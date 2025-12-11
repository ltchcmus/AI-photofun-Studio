"""
Constants for Intent Router
Defines all intent types and feature-specific enums
"""

class IntentType:
    """
    Intent codes for routing to appropriate AI feature services
    """
    # Image Generation
    IMAGE_GENERATE = "image_generate"
    
    # Image Enhancement
    UPSCALE = "upscale"
    
    # Background Operations
    REMOVE_BACKGROUND = "remove_background"
    
    # Lighting
    RELIGHT = "relight"
    
    # Style Operations
    STYLE_TRANSFER = "style_transfer"
    REIMAGINE = "reimagine"
    
    # Image Manipulation
    IMAGE_EXPAND = "image_expand"
    
    # Fallback
    OTHER = "other"
    
    @classmethod
    def all(cls):
        """Return all intent types"""
        return [
            cls.IMAGE_GENERATE,
            cls.UPSCALE,
            cls.REMOVE_BACKGROUND,
            cls.RELIGHT,
            cls.STYLE_TRANSFER,
            cls.REIMAGINE,
            cls.IMAGE_EXPAND,
            cls.OTHER,
        ]
    
    @classmethod
    def choices(cls):
        """Return choices for Django field"""
        return [(intent, intent.replace('_', ' ').title()) for intent in cls.all()]


class UpscaleFlavor:
    """
    Upscale flavor options
    """
    # For artwork, concept art, 3D renders
    SUBLIME = "sublime"
    
    # For portraits, product photos, real-life images
    PHOTO = "photo"
    
    # For noisy photos (low light, high ISO)
    PHOTO_DENOISER = "photo_denoiser"
    
    @classmethod
    def all(cls):
        """Return all flavors"""
        return [cls.SUBLIME, cls.PHOTO, cls.PHOTO_DENOISER]
    
    @classmethod
    def choices(cls):
        """Return choices for Django field"""
        return [
            (cls.SUBLIME, "Sublime (Artwork, Concept Art, 3D)"),
            (cls.PHOTO, "Photo (Portrait, Product, Real-life)"),
            (cls.PHOTO_DENOISER, "Photo Denoiser (Noisy photos)"),
        ]


class AspectRatio:
    """
    Common aspect ratios for image generation
    """
    SQUARE = "1:1"
    LANDSCAPE = "16:9"
    PORTRAIT = "9:16"
    WIDE = "21:9"
    CLASSIC = "4:3"
    
    @classmethod
    def all(cls):
        """Return all aspect ratios"""
        return [cls.SQUARE, cls.LANDSCAPE, cls.PORTRAIT, cls.WIDE, cls.CLASSIC]
    
    @classmethod
    def choices(cls):
        """Return choices for Django field"""
        return [(ratio, ratio) for ratio in cls.all()]


# Intent to Feature App Mapping
INTENT_TO_APP_MAP = {
    IntentType.IMAGE_GENERATE: "image_generation",
    IntentType.UPSCALE: "upscale",
    IntentType.REMOVE_BACKGROUND: "remove_background",
    IntentType.RELIGHT: "relight",
    IntentType.STYLE_TRANSFER: "style_transfer",
    IntentType.REIMAGINE: "reimagine",
    IntentType.IMAGE_EXPAND: "image_expand",
}
