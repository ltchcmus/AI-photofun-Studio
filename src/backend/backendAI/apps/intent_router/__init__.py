"""
Intent Router
Centralized routing logic for dispatching requests to appropriate AI feature services
"""

from .router import IntentRouter
from .constants import IntentType, UpscaleFlavor

__all__ = ['IntentRouter', 'IntentType', 'UpscaleFlavor']
