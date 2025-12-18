"""
Constants for Intent Router
Defines all intent types and feature-specific enums
"""

class IntentType:
    """
    Intent codes for routing to appropriate AI feature services
    """
    # Image Generation
    image_generation = "image_generation"
    
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
            cls.image_generation,
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
    Supports both user-friendly format (1:1, 16:9) and Freepik API format
    """
    # User-friendly format (for API input)
    SQUARE = "1:1"
    LANDSCAPE = "16:9"
    PORTRAIT = "9:16"
    WIDE = "21:9"
    CLASSIC = "4:3"
    TRADITIONAL = "3:4"
    
    # Freepik API format
    SQUARE_FREEPIK = "square_1_1"
    WIDESCREEN_FREEPIK = "widescreen_16_9"
    PORTRAIT_FREEPIK = "portrait_9_16"
    CLASSIC_FREEPIK = "classic_4_3"
    TRADITIONAL_FREEPIK = "traditional_3_4"
    FILM_HORIZONTAL_FREEPIK = "film_horizontal_21_9"
    STANDARD_FREEPIK = "standard_3_2"
    
    @classmethod
    def all(cls):
        """Return all aspect ratios (user-friendly format)"""
        return [cls.SQUARE, cls.LANDSCAPE, cls.PORTRAIT, cls.WIDE, cls.CLASSIC, cls.TRADITIONAL]
    
    @classmethod
    def all_freepik(cls):
        """Return all Freepik format aspect ratios"""
        return [
            cls.SQUARE_FREEPIK,
            cls.WIDESCREEN_FREEPIK, 
            cls.PORTRAIT_FREEPIK,
            cls.CLASSIC_FREEPIK,
            cls.TRADITIONAL_FREEPIK,
            cls.FILM_HORIZONTAL_FREEPIK,
            cls.STANDARD_FREEPIK
        ]
    
    @classmethod
    def choices(cls):
        """Return choices for Django field (user-friendly format)"""
        return [(ratio, ratio) for ratio in cls.all()]
    
    @classmethod
    def to_freepik_format(cls, user_format: str) -> str:
        """
        Convert user-friendly format to Freepik API format
        
        Args:
            user_format: User-friendly format like "1:1", "16:9"
            
        Returns:
            Freepik format like "square_1_1", "widescreen_16_9"
        """
        mapping = {
            cls.SQUARE: cls.SQUARE_FREEPIK,
            cls.LANDSCAPE: cls.WIDESCREEN_FREEPIK,
            cls.PORTRAIT: cls.PORTRAIT_FREEPIK,
            cls.CLASSIC: cls.CLASSIC_FREEPIK,
            cls.TRADITIONAL: cls.TRADITIONAL_FREEPIK,
            cls.WIDE: cls.FILM_HORIZONTAL_FREEPIK,
            "3:2": cls.STANDARD_FREEPIK,
        }
        return mapping.get(user_format, cls.SQUARE_FREEPIK)
    
    @classmethod
    def from_freepik_format(cls, freepik_format: str) -> str:
        """
        Convert Freepik format to user-friendly format
        
        Args:
            freepik_format: Freepik format like "square_1_1", "widescreen_16_9"
            
        Returns:
            User-friendly format like "1:1", "16:9"
        """
        reverse_mapping = {
            cls.SQUARE_FREEPIK: cls.SQUARE,
            cls.WIDESCREEN_FREEPIK: cls.LANDSCAPE,
            cls.PORTRAIT_FREEPIK: cls.PORTRAIT,
            cls.CLASSIC_FREEPIK: cls.CLASSIC,
            cls.TRADITIONAL_FREEPIK: cls.TRADITIONAL,
            cls.FILM_HORIZONTAL_FREEPIK: cls.WIDE,
            cls.STANDARD_FREEPIK: "3:2",
        }
        return reverse_mapping.get(freepik_format, cls.SQUARE)


# Intent to Feature App Mapping
INTENT_TO_APP_MAP = {
    IntentType.image_generation: "image_generation",
    IntentType.UPSCALE: "upscale",
    IntentType.REMOVE_BACKGROUND: "remove_background",
    IntentType.RELIGHT: "relight",
    IntentType.STYLE_TRANSFER: "style_transfer",
    IntentType.REIMAGINE: "reimagine",
    IntentType.IMAGE_EXPAND: "image_expand",
}
