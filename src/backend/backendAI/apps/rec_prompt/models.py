"""Mongo collections helpers for prompt recommendations."""

from .mongo_client import get_collection


def get_prompts_collection():
    """Return the prompts collection (lazy)."""
    return get_collection('rec_prompts')


def get_user_profiles_collection():
    """Return the user profiles collection (lazy)."""
    return get_collection('rec_user_profiles')


def get_counters_collection():
    """Return the counters collection for auto-increment IDs (lazy)."""
    return get_collection('rec_counters')
