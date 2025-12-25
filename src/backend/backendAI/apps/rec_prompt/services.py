import logging
import os
import threading
import time
import zlib
from typing import Optional

import numpy as np
from bson.binary import Binary
from pymongo import ReturnDocument
from pymongo.errors import DuplicateKeyError
from scipy.sparse import csr_matrix, vstack
from sklearn.feature_extraction.text import HashingVectorizer, TfidfTransformer
from sklearn.preprocessing import normalize

from .models import (
    get_counters_collection,
    get_prompts_collection,
    get_user_profiles_collection,
)

logger = logging.getLogger(__name__)

CFG_VERSION = 2  # bump when preprocessing changes
DEFAULT_N_FEATURES = int(os.getenv("PROMPT_N_FEATURES", str(2**18)))
COUNTER_KEY = "rec_prompts"

SYN_TOKEN = {
    "hình": "ảnh",
    "hinh": "ảnh",
    "hình_ảnh": "ảnh",
    "hinh_anh": "ảnh",
    "image": "ảnh",
    "photo": "ảnh",
}


def norm_text_keep_accents(s: str) -> str:
    s = s.strip().lower()
    s = " ".join(s.split())
    return s


def canon_text(s: str) -> str:
    s = norm_text_keep_accents(s)
    s = s.replace("hình ảnh", "ảnh")
    s = s.replace("hinh anh", "ảnh")
    s = s.replace("hình_ảnh", "ảnh")
    s = s.replace("hinh_anh", "ảnh")

    toks = s.split()
    toks = [SYN_TOKEN.get(t, t) for t in toks]
    return " ".join(toks)


class MongoStore:
    def __init__(self):
        self.prompts = get_prompts_collection()
        self.user_profiles = get_user_profiles_collection()
        self.counters = get_counters_collection()
        self._ensure_indexes()
        self._ensure_counter()

    def _ensure_indexes(self):
        self.prompts.create_index("prompt_id", unique=True)
        self.prompts.create_index("text", unique=True)
        self.user_profiles.create_index("user_id", unique=True)

    def _ensure_counter(self):
        max_doc = self.prompts.find_one(sort=[("prompt_id", -1)], projection={"prompt_id": 1})
        max_id = int(max_doc["prompt_id"]) if max_doc else 0
        doc = self.counters.find_one({"_id": COUNTER_KEY})
        if doc is None:
            self.counters.insert_one({"_id": COUNTER_KEY, "seq": max_id})
        else:
            seq = int(doc.get("seq", 0))
            if seq < max_id:
                self.counters.update_one({"_id": COUNTER_KEY}, {"$set": {"seq": max_id}})

    def _next_prompt_id(self) -> int:
        doc = self.counters.find_one_and_update(
            {"_id": COUNTER_KEY},
            {"$inc": {"seq": 1}},
            upsert=True,
            return_document=ReturnDocument.AFTER,
        )
        return int(doc.get("seq", 0))

    def get_max_prompt_id(self) -> int:
        doc = self.prompts.find_one(sort=[("prompt_id", -1)], projection={"prompt_id": 1})
        return int(doc["prompt_id"]) if doc else 0

    def fetch_prompts_after(self, last_id: int) -> list[tuple[int, str, int]]:
        cursor = self.prompts.find(
            {"prompt_id": {"$gt": int(last_id)}},
            projection={"_id": 0, "prompt_id": 1, "text": 1, "popularity": 1},
        ).sort("prompt_id", 1)
        return [
            (int(doc["prompt_id"]), str(doc["text"]), int(doc.get("popularity", 0)))
            for doc in cursor
        ]

    def fetch_all_prompts(self) -> list[tuple[int, str, int]]:
        cursor = self.prompts.find(
            {},
            projection={"_id": 0, "prompt_id": 1, "text": 1, "popularity": 1},
        ).sort("prompt_id", 1)
        return [
            (int(doc["prompt_id"]), str(doc["text"]), int(doc.get("popularity", 0)))
            for doc in cursor
        ]

    def ensure_prompt(self, text: str) -> tuple[int, bool]:
        text = " ".join(text.strip().split())
        if not text:
            raise ValueError("Empty prompt")

        existing = self.prompts.find_one({"text": text}, projection={"prompt_id": 1})
        if existing:
            return int(existing["prompt_id"]), False

        now = time.time()
        prompt_id = self._next_prompt_id()
        doc = {
            "prompt_id": int(prompt_id),
            "text": text,
            "popularity": 0,
            "created_at": now,
        }
        try:
            self.prompts.insert_one(doc)
            return prompt_id, True
        except DuplicateKeyError:
            existing = self.prompts.find_one({"text": text}, projection={"prompt_id": 1})
            if existing:
                return int(existing["prompt_id"]), False
            raise

    def bump_popularity(self, prompt_id: int, delta: int = 1):
        self.prompts.update_one(
            {"prompt_id": int(prompt_id)},
            {"$inc": {"popularity": int(delta)}},
        )

    @staticmethod
    def _compress(arr: np.ndarray) -> Binary:
        return Binary(zlib.compress(arr.tobytes()))

    @staticmethod
    def _decompress(blob: bytes, dtype) -> np.ndarray:
        raw = zlib.decompress(bytes(blob))
        return np.frombuffer(raw, dtype=dtype)

    def load_user_sum(
        self,
        user_id: str,
        n_features_expected: int,
        cfg_version_expected: int,
    ) -> Optional[csr_matrix]:
        doc = self.user_profiles.find_one(
            {"user_id": user_id},
            projection={"n_features": 1, "cfg_version": 1, "indices_z": 1, "data_z": 1},
        )
        if doc is None:
            return None

        n_features = int(doc.get("n_features", 0))
        cfg_v = int(doc.get("cfg_version", 0))
        if n_features != n_features_expected:
            return None
        if cfg_v != cfg_version_expected:
            return None

        indices_z = doc.get("indices_z")
        data_z = doc.get("data_z")
        if not indices_z or not data_z:
            return None

        indices = self._decompress(indices_z, np.int32)
        data = self._decompress(data_z, np.float32)
        indptr = np.array([0, data.size], dtype=np.int32)
        return csr_matrix((data, indices, indptr), shape=(1, n_features))

    def save_user_sum(self, user_id: str, user_sum: csr_matrix, n_features: int, cfg_version: int):
        user_sum = user_sum.tocsr()
        indices = np.asarray(user_sum.indices, dtype=np.int32)
        data = np.asarray(user_sum.data, dtype=np.float32)

        indices_z = self._compress(indices)
        data_z = self._compress(data)
        now = time.time()

        self.user_profiles.update_one(
            {"user_id": user_id},
            {
                "$set": {
                    "n_features": int(n_features),
                    "cfg_version": int(cfg_version),
                    "indices_z": indices_z,
                    "data_z": data_z,
                    "updated_at": now,
                }
            },
            upsert=True,
        )

    def ensure_user_profile(self, user_id: str, n_features: int, cfg_version: int) -> bool:
        user_id = user_id.strip()
        if not user_id:
            raise ValueError("Empty user_id")

        existing = self.user_profiles.find_one({"user_id": user_id}, projection={"_id": 1})
        if existing:
            return False

        empty = csr_matrix((1, int(n_features)), dtype=np.float32)
        self.save_user_sum(user_id, empty, int(n_features), int(cfg_version))
        return True


class SuggestEngine:
    def __init__(self, store: MongoStore, n_features: int = 2**18):
        self.store = store
        self.n_features = int(n_features)

        self.hv = HashingVectorizer(
            analyzer="char_wb",
            ngram_range=(3, 5),
            n_features=self.n_features,
            alternate_sign=False,
            norm=None,
            dtype=np.float32,
        )
        self.tfidf = TfidfTransformer(norm="l2", use_idf=True, smooth_idf=True)

        self.last_id = 0
        self.ids: list[int] = []
        self.texts: list[str] = []
        self.keys: list[str] = []
        self.pop: np.ndarray = np.zeros((0,), dtype=np.float32)
        self.X: csr_matrix = csr_matrix((0, self.n_features), dtype=np.float32)

        self._load_initial()

    def _load_initial(self):
        rows = self.store.fetch_all_prompts()
        if not rows:
            dummy = self.hv.transform(["__dummy__"])
            self.tfidf.fit(dummy)
            self.last_id = self.store.get_max_prompt_id()
            logger.info("[rec_prompt] DB empty, no prompts loaded")
            return

        self.ids = [r[0] for r in rows]
        self.texts = [r[1] for r in rows]
        self.pop = np.asarray([r[2] for r in rows], dtype=np.float32)

        self.keys = [canon_text(t) for t in self.texts]
        counts = self.hv.transform(self.keys)
        self.X = self.tfidf.fit_transform(counts).astype(np.float32)

        self.last_id = max(self.ids)
        logger.info("[rec_prompt] Loaded %s prompts (last_id=%s)", len(self.ids), self.last_id)

    def refresh_from_db(self) -> int:
        max_id = self.store.get_max_prompt_id()
        if max_id <= self.last_id:
            return 0

        new_rows = self.store.fetch_prompts_after(self.last_id)
        if not new_rows:
            self.last_id = max_id
            return 0

        new_ids = [r[0] for r in new_rows]
        new_texts = [r[1] for r in new_rows]
        new_pop = np.asarray([r[2] for r in new_rows], dtype=np.float32)
        new_keys = [canon_text(t) for t in new_texts]

        if self.X.shape[0] == 0:
            counts = self.hv.transform(new_keys)
            self.X = self.tfidf.fit_transform(counts).astype(np.float32)
        else:
            counts = self.hv.transform(new_keys)
            new_X = self.tfidf.transform(counts).astype(np.float32)
            self.X = vstack([self.X, new_X], format="csr")

        self.ids.extend(new_ids)
        self.texts.extend(new_texts)
        self.keys.extend(new_keys)
        self.pop = np.append(self.pop, new_pop).astype(np.float32)

        self.last_id = max_id
        return len(new_rows)

    def reload_full(self):
        rows = self.store.fetch_all_prompts()
        self.ids = [r[0] for r in rows]
        self.texts = [r[1] for r in rows]
        self.pop = np.asarray([r[2] for r in rows], dtype=np.float32)
        self.keys = [canon_text(t) for t in self.texts]

        if not self.texts:
            self.X = csr_matrix((0, self.n_features), dtype=np.float32)
            dummy = self.hv.transform(["__dummy__"])
            self.tfidf.fit(dummy)
            self.last_id = self.store.get_max_prompt_id()
            return

        counts = self.hv.transform(self.keys)
        self.X = self.tfidf.fit_transform(counts).astype(np.float32)
        self.last_id = max(self.ids)
        logger.info("[rec_prompt] Refit TF-IDF on %s prompts (last_id=%s)", len(self.ids), self.last_id)

    @staticmethod
    def _row_to_1d(sparse_row: csr_matrix) -> np.ndarray:
        return sparse_row.toarray().ravel()

    def add_prompt(self, text: str) -> int:
        pid, inserted = self.store.ensure_prompt(text)
        if inserted:
            self.refresh_from_db()
        return pid

    def update_user_ema(self, user_id: str, chosen_prompt_id: int, decay: float = 0.98):
        w = 1.0

        try:
            idx = self.ids.index(chosen_prompt_id)
        except ValueError:
            return

        v_item = self.X[idx]
        user_sum = self.store.load_user_sum(user_id, self.n_features, CFG_VERSION)
        new_sum = (v_item * w) if user_sum is None else (user_sum * decay) + (v_item * w)
        self.store.save_user_sum(user_id, new_sum, self.n_features, CFG_VERSION)

    def suggest(
        self,
        query: str,
        user_id: str,
        topk: int = 5,
        w_sem: float = 1.0,
        w_prefix: float = 0.25,
        w_user: float = 0.35,
        w_pop: float = 0.08,
        min_sim: float = 0.10,
        pop_pool: int = 2000,
    ):
        self.refresh_from_db()
        if self.X.shape[0] == 0:
            return []

        q = query.strip()

        if q == "":
            pop = np.log1p(self.pop)
            n = pop.size
            pool = min(int(pop_pool), int(n))
            if pool <= 0:
                return []
            cand = np.arange(n) if pool == n else np.argpartition(-pop, pool - 1)[:pool]

            scores = w_pop * pop[cand]
            user_sum = self.store.load_user_sum(user_id, self.n_features, CFG_VERSION)
            if user_sum is not None:
                user_u = normalize(user_sum, norm="l2", copy=False)
                sim_u = self._row_to_1d(user_u @ self.X[cand].T)
                scores = scores + w_user * sim_u

            k = min(int(topk), scores.size)
            if k <= 0:
                return []
            idx_part = np.argpartition(-scores, k - 1)[:k]
            idx = idx_part[np.argsort(-scores[idx_part])]
            out = []
            for j in idx:
                gi = int(cand[int(j)])
                out.append((self.ids[gi], self.texts[gi], float(scores[int(j)])))
            return out

        qk = canon_text(q)
        qv = self.tfidf.transform(self.hv.transform([qk])).astype(np.float32)

        sim = self._row_to_1d(qv @ self.X.T)

        prefix = np.fromiter(
            (k.startswith(qk) for k in self.keys),
            dtype=np.int8,
            count=len(self.keys),
        ).astype(np.float32)

        user_sum = self.store.load_user_sum(user_id, self.n_features, CFG_VERSION)
        if user_sum is not None:
            user_u = normalize(user_sum, norm="l2", copy=False)
            sim_u = self._row_to_1d(user_u @ self.X.T)
        else:
            sim_u = 0.0

        pop = np.log1p(self.pop)
        scores = (w_sem * sim) + (w_user * sim_u) + (w_pop * pop) + (w_prefix * prefix)

        scores = np.where(prefix > 0.5, scores, np.where(sim >= float(min_sim), scores, -1e9))

        k = min(int(topk), scores.size)
        if k <= 0:
            return []
        idx_part = np.argpartition(-scores, k - 1)[:k]
        idx = idx_part[np.argsort(-scores[idx_part])]

        return [(self.ids[int(i)], self.texts[int(i)], float(scores[int(i)])) for i in idx]


class RecPromptService:
    def __init__(self, n_features: int = DEFAULT_N_FEATURES):
        self.store = MongoStore()
        self.engine = SuggestEngine(self.store, n_features=n_features)
        self.lock = threading.RLock()

    def suggest(self, user_id: str, query: str, topk: int = 5):
        with self.lock:
            self.store.ensure_user_profile(user_id, self.engine.n_features, CFG_VERSION)
            return self.engine.suggest(query, user_id=user_id, topk=topk)

    def choose(self, user_id: str, prompt_text: str):
        decay = 0.98

        with self.lock:
            self.store.ensure_user_profile(user_id, self.engine.n_features, CFG_VERSION)
            prompt_id, created = self.store.ensure_prompt(prompt_text)
            self.engine.refresh_from_db()

            self.engine.update_user_ema(user_id, prompt_id, decay=decay)
            self.store.bump_popularity(prompt_id, delta=1)

            try:
                idx = self.engine.ids.index(prompt_id)
                self.engine.pop[idx] += 1.0
            except ValueError:
                self.engine.reload_full()

        return prompt_id, created


_service = None
_service_lock = threading.Lock()


def get_service() -> RecPromptService:
    global _service
    if _service is None:
        with _service_lock:
            if _service is None:
                _service = RecPromptService()
    return _service
