"""
Application-wide Constants

Define constants that are used across different parts of the application.
"""

# API Versions
API_VERSION_V1 = "v1"

# Task Queues
QUEUE_CPU = "cpu"
QUEUE_GPU = "gpu"

# Image Processing
MAX_IMAGE_SIZE = 4096
SUPPORTED_IMAGE_FORMATS = ["jpg", "jpeg", "png", "webp"]

# Response Status
STATUS_SUCCESS = "success"
STATUS_ERROR = "error"
STATUS_PENDING = "pending"
STATUS_PROCESSING = "processing"

# MongoDB Collections
COLLECTION_CONVERSATIONS = "conversations"
COLLECTION_MESSAGES = "messages"
