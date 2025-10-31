"""
AI Model Manager - Handles loading and caching of AI models
"""
import os
import logging
from pathlib import Path
from django.conf import settings

logger = logging.getLogger(__name__)


class ModelManager:
    """Singleton manager for AI models"""
    
    _instance = None
    _models = {}
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
        return cls._instance
    
    def __init__(self):
        self.model_dir = getattr(settings, 'ML_MODELS_DIR', Path(settings.BASE_DIR) / 'ml_models')
        os.makedirs(self.model_dir, exist_ok=True)
    
    def load_model(self, model_name, model_class=None, **kwargs):
        """
        Load or retrieve cached model
        
        Args:
            model_name: Name identifier for the model
            model_class: Class to instantiate the model
            **kwargs: Additional arguments for model initialization
            
        Returns:
            Loaded model instance
        """
        if model_name in self._models:
            logger.info(f"Using cached model: {model_name}")
            return self._models[model_name]
        
        logger.info(f"Loading model: {model_name}")
        
        try:
            if model_class:
                model = model_class(**kwargs)
                self._models[model_name] = model
                return model
            else:
                logger.warning(f"No model class provided for {model_name}")
                return None
        except Exception as e:
            logger.error(f"Error loading model {model_name}: {str(e)}")
            raise
    
    def unload_model(self, model_name):
        """Unload model from memory"""
        if model_name in self._models:
            del self._models[model_name]
            logger.info(f"Unloaded model: {model_name}")
    
    def get_model_path(self, model_filename):
        """Get full path to model file"""
        return os.path.join(self.model_dir, model_filename)
    
    def list_models(self):
        """List all loaded models"""
        return list(self._models.keys())


# Global model manager instance
model_manager = ModelManager()
