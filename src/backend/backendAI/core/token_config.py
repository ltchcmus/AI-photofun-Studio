"""
Token Configuration for AI Features
Centralized configuration for estimated tokens and deduction rates
"""

class TokenConfig:
    """Token cost configuration for each AI feature"""
    
    # ============================================================================
    # GLOBAL SETTINGS
    # ============================================================================
    
    # Minimum token required to start using any feature
    MIN_TOKEN_REQUIRED = 10
    
    # If actual cost is less than min_deduction, charge min_deduction instead
    # Formula: tokens_charged = max(actual_cost, min_deduction)
    
    # ============================================================================
    # IMAGE FEATURES
    # ============================================================================
    
    IMAGE_GENERATION = {
        'feature_name': 'image_generation',
        'display_name': 'Text to Image Generation',
        'estimated_tokens': 20,      # Tokens needed to start (pre-check)
        'min_deduction': 30,          # Minimum tokens to charge
        'token_per_second': 5.0,      # Deduction rate per second
        'description': 'Generate images from text prompts using Freepik API'
    }
    
    UPSCALE = {
        'feature_name': 'upscale',
        'display_name': 'Image Upscaling',
        'estimated_tokens': 20,
        'min_deduction': 30,
        'token_per_second': 5.0,
        'description': 'Upscale images to higher resolution'
    }
    
    REMOVE_BACKGROUND = {
        'feature_name': 'remove_background',
        'display_name': 'Background Removal',
        'estimated_tokens': 20,
        'min_deduction': 30,
        'token_per_second': 5.0,
        'description': 'Remove background from images'
    }
    
    REIMAGINE = {
        'feature_name': 'reimagine',
        'display_name': 'Image Reimagining',
        'estimated_tokens': 20,
        'min_deduction': 30,
        'token_per_second': 5.0,
        'description': 'Reimagine images with AI'
    }
    
    RELIGHT = {
        'feature_name': 'relight',
        'display_name': 'Image Relighting',
        'estimated_tokens': 20,
        'min_deduction': 30,
        'token_per_second': 5.0,
        'description': 'Relight images with different lighting conditions'
    }
    
    STYLE_TRANSFER = {
        'feature_name': 'style_transfer',
        'display_name': 'Style Transfer',
        'estimated_tokens': 20,
        'min_deduction': 30,
        'token_per_second': 5.0,
        'description': 'Apply artistic styles to images'
    }
    
    IMAGE_EXPAND = {
        'feature_name': 'image_expand',
        'display_name': 'Image Expansion',
        'estimated_tokens': 20,
        'min_deduction': 30,
        'token_per_second': 5.0,
        'description': 'Expand images with AI-generated content'
    }
    
    # ============================================================================
    # VIDEO FEATURES (More expensive due to longer processing time)
    # ============================================================================
    
    PROMPT_TO_VIDEO = {
        'feature_name': 'prompt_to_video',
        'display_name': 'Text to Video Generation',
        'estimated_tokens': 200,
        'min_deduction': 200,
        'token_per_second': 5.0,
        'description': 'Generate videos from text prompts using ModelStudio API'
    }
    
    IMAGE_TO_VIDEO = {
        'feature_name': 'image_to_video',
        'display_name': 'Image to Video Generation',
        'estimated_tokens': 200,
        'min_deduction': 200,
        'token_per_second': 5.0,
        'description': 'Generate videos from images using ModelStudio API'
    }
    
    # ============================================================================
    # HELPER METHODS
    # ============================================================================
    
    @classmethod
    def get_config(cls, feature_name: str) -> dict:
        """
        Get configuration for a specific feature
        
        Args:
            feature_name: Name of the feature (e.g., 'image_generation', 'upscale')
        
        Returns:
            dict: Configuration dictionary with all settings
        
        Raises:
            ValueError: If feature_name is not found
        """
        # Normalize feature name to uppercase
        feature_key = feature_name.upper()
        
        if not hasattr(cls, feature_key):
            raise ValueError(
                f"Unknown feature: {feature_name}. "
                f"Available features: {cls.get_all_feature_names()}"
            )
        
        return getattr(cls, feature_key)
    
    @classmethod
    def get_all_feature_names(cls) -> list:
        """Get list of all available feature names"""
        features = []
        for attr_name in dir(cls):
            if attr_name.isupper() and not attr_name.startswith('_'):
                attr = getattr(cls, attr_name)
                if isinstance(attr, dict) and 'feature_name' in attr:
                    features.append(attr['feature_name'])
        return features
    
    @classmethod
    def get_all_configs(cls) -> dict:
        """Get all feature configurations as a dictionary"""
        configs = {}
        for attr_name in dir(cls):
            if attr_name.isupper() and not attr_name.startswith('_'):
                attr = getattr(cls, attr_name)
                if isinstance(attr, dict) and 'feature_name' in attr:
                    configs[attr['feature_name']] = attr
        return configs
    
    @classmethod
    def calculate_cost(cls, feature_name: str, processing_time: float) -> int:
        """
        Calculate token cost for a feature based on processing time
        
        Args:
            feature_name: Name of the feature
            processing_time: Processing time in seconds
        
        Returns:
            int: Tokens to deduct (max of actual_cost and min_deduction)
        """
        config = cls.get_config(feature_name)
        
        actual_cost = int(processing_time * config['token_per_second'])
        min_deduction = config['min_deduction']
        
        # Always charge at least min_deduction
        tokens_to_charge = max(actual_cost, min_deduction)
        
        return tokens_to_charge
    
    @classmethod
    def validate_balance(cls, feature_name: str, current_balance: int) -> tuple[bool, str]:
        """
        Validate if user has enough balance for a feature
        
        Args:
            feature_name: Name of the feature
            current_balance: User's current token balance
        
        Returns:
            tuple: (is_valid, error_message)
        """
        config = cls.get_config(feature_name)
        
        # Check global minimum
        if current_balance < cls.MIN_TOKEN_REQUIRED:
            return False, (
                f"Insufficient tokens. You have {current_balance} tokens but need "
                f"at least {cls.MIN_TOKEN_REQUIRED} tokens to use any feature."
            )
        
        # Check feature-specific estimated tokens
        estimated = config['estimated_tokens']
        if current_balance < estimated:
            return False, (
                f"Insufficient tokens for {config['display_name']}. "
                f"You have {current_balance} tokens but this feature requires "
                f"approximately {estimated} tokens."
            )
        
        return True, ""
    
    @classmethod
    def get_feature_summary(cls, feature_name: str) -> str:
        """Get a human-readable summary of a feature's token cost"""
        config = cls.get_config(feature_name)
        return (
            f"{config['display_name']}:\n"
            f"  - Estimated tokens: {config['estimated_tokens']}\n"
            f"  - Minimum charge: {config['min_deduction']}\n"
            f"  - Rate: {config['token_per_second']} tokens/second\n"
            f"  - Description: {config['description']}"
        )
    
    @classmethod
    def print_all_configs(cls):
        """Print all feature configurations (for debugging)"""
        print("=" * 80)
        print("TOKEN CONFIGURATION FOR ALL FEATURES")
        print("=" * 80)
        print(f"\nGlobal Settings:")
        print(f"  - Minimum tokens required: {cls.MIN_TOKEN_REQUIRED}")
        print(f"\nFeature Configurations:\n")
        
        for feature_name in sorted(cls.get_all_feature_names()):
            print(cls.get_feature_summary(feature_name))
            print()


# ============================================================================
# USAGE EXAMPLES (for testing)
# ============================================================================

if __name__ == "__main__":
    # Example 1: Get config for a feature
    config = TokenConfig.get_config('image_generation')
    print("Image Generation Config:", config)
    print()
    
    # Example 2: Calculate cost
    processing_time = 3.5  # seconds
    cost = TokenConfig.calculate_cost('image_generation', processing_time)
    print(f"Cost for 3.5s processing: {cost} tokens")
    print(f"  - Actual: {int(3.5 * 2.0)} tokens")
    print(f"  - Minimum: {config['min_deduction']} tokens")
    print(f"  - Charged: max(7, 20) = {cost} tokens")
    print()
    
    # Example 3: Validate balance
    is_valid, error_msg = TokenConfig.validate_balance('image_generation', 45)
    print(f"Balance 45 tokens: Valid={is_valid}")
    if not is_valid:
        print(f"  Error: {error_msg}")
    print()
    
    # Example 4: Print all configs
    TokenConfig.print_all_configs()
