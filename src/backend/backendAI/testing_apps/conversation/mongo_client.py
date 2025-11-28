import os
from pymongo import MongoClient
from django.conf import settings


_client = None


def get_client():
    """Lazily initialize a MongoClient."""
    global _client
    if _client is None:
        uri = getattr(settings, 'MONGO_URI', None) or os.environ.get('MONGO_URI') or 'mongodb://localhost:27017'
        _client = MongoClient(uri)
    return _client


def get_db(name=None):
    client = get_client()
    db_name = name or getattr(settings, 'MONGO_DB_NAME', 'ai_photofun_studio')
    return client[db_name]


def get_collection(name: str):
    db = get_db()
    return db[name]
