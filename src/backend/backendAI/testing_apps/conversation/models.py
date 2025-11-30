"""Conversation collections helpers.

Avoid performing any network/DB access at module import time so Django
startup or simple imports don't require configured settings. Use
`get_conversations_collection()` to obtain the collection when needed.
"""

from .mongo_client import get_collection


def get_conversations_collection():
	"""Return the `conversations` collection (lazy)."""
	return get_collection('conversations')

