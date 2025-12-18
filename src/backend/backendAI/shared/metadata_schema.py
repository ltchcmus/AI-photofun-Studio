"""
Standardized Metadata Schema for Image Gallery
All AI features should follow this structure when saving to gallery
"""

from typing import Dict, Any, Optional
from datetime import datetime


class MetadataBuilder:
    """
    Builder class for creating standardized metadata objects
    
    Usage:
        metadata = MetadataBuilder.image_generation(
            task_id="abc123",
            aspect_ratio="16:9",
            model="realism",
            resolution="2k"
        )
    """
    
    @staticmethod
    def _base_metadata(
        feature: str,
        task_id: Optional[str] = None,
        processing_time: Optional[float] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """
        Base metadata structure shared by all features
        
        Args:
            feature: Feature name (image_generation, upscale, etc.)
            task_id: Celery task ID or Freepik task ID
            processing_time: Time taken to process (seconds)
            **kwargs: Additional feature-specific fields
        """
        metadata = {
            "feature": feature,
            "version": "1.0",
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
        
        if task_id:
            metadata["task_id"] = task_id
            
        if processing_time:
            metadata["processing_time"] = round(processing_time, 2)
        
        # Add any additional fields
        metadata.update(kwargs)
        
        return metadata
    
    # =========================================================================
    # IMAGE GENERATION
    # =========================================================================
    
    @staticmethod
    def image_generation(
        task_id: str,
        aspect_ratio: str,
        model: str = "realism",
        resolution: str = "2k",
        style: Optional[str] = None,
        num_images: int = 1,
        processing_time: Optional[float] = None,
        freepik_task_id: Optional[str] = None,
        **extra
    ) -> Dict[str, Any]:
        """
        Metadata for image generation
        
        Standard fields:
        - feature: "image_generation"
        - task_id: Celery task ID
        - aspect_ratio: "1:1", "16:9", etc.
        - model: "realism", "fluid", "zen"
        - resolution: "2k", "4k"
        - style: Optional style name
        - num_images: Number of images generated
        - freepik_task_id: Freepik API task ID (if different)
        """
        return MetadataBuilder._base_metadata(
            feature="image_generation",
            task_id=task_id,
            processing_time=processing_time,
            aspect_ratio=aspect_ratio,
            model=model,
            resolution=resolution,
            style=style,
            num_images=num_images,
            freepik_task_id=freepik_task_id,
            **extra
        )
    
    # =========================================================================
    # UPSCALE
    # =========================================================================
    
    @staticmethod
    def upscale(
        task_id: str,
        scale_factor: int = 2,
        creativity: Optional[int] = None,
        resemblance: Optional[int] = None,
        engine: Optional[str] = None,
        processing_time: Optional[float] = None,
        freepik_task_id: Optional[str] = None,
        input_dimensions: Optional[Dict[str, int]] = None,
        output_dimensions: Optional[Dict[str, int]] = None,
        **extra
    ) -> Dict[str, Any]:
        """
        Metadata for image upscaling
        
        Standard fields:
        - feature: "upscale"
        - task_id: Celery task ID
        - scale_factor: 2, 4, etc.
        - creativity: 0-100
        - resemblance: 0-100
        - engine: Processing engine used
        - input_dimensions: {"width": 512, "height": 512}
        - output_dimensions: {"width": 1024, "height": 1024}
        """
        return MetadataBuilder._base_metadata(
            feature="upscale",
            task_id=task_id,
            processing_time=processing_time,
            scale_factor=scale_factor,
            creativity=creativity,
            resemblance=resemblance,
            engine=engine,
            freepik_task_id=freepik_task_id,
            input_dimensions=input_dimensions,
            output_dimensions=output_dimensions,
            **extra
        )
    
    # =========================================================================
    # REMOVE BACKGROUND
    # =========================================================================
    
    @staticmethod
    def remove_background(
        input_source: str = "url",
        processing_time: Optional[float] = None,
        output_format: str = "png",
        has_transparency: bool = True,
        **extra
    ) -> Dict[str, Any]:
        """
        Metadata for background removal
        
        Standard fields:
        - feature: "remove_background"
        - input_source: "url", "base64", or "file"
        - output_format: "png" (always PNG for transparency)
        - has_transparency: true
        """
        return MetadataBuilder._base_metadata(
            feature="remove_background",
            processing_time=processing_time,
            input_source=input_source,
            output_format=output_format,
            has_transparency=has_transparency,
            **extra
        )
    
    # =========================================================================
    # RELIGHT
    # =========================================================================
    
    @staticmethod
    def relight(
        task_id: str,
        light_direction: Optional[str] = None,
        light_intensity: Optional[int] = None,
        light_color: Optional[str] = None,
        processing_time: Optional[float] = None,
        freepik_task_id: Optional[str] = None,
        **extra
    ) -> Dict[str, Any]:
        """
        Metadata for image relighting
        
        Standard fields:
        - feature: "relight"
        - task_id: Celery task ID
        - light_direction: Direction of light source
        - light_intensity: 0-100
        - light_color: Hex color or name
        """
        return MetadataBuilder._base_metadata(
            feature="relight",
            task_id=task_id,
            processing_time=processing_time,
            light_direction=light_direction,
            light_intensity=light_intensity,
            light_color=light_color,
            freepik_task_id=freepik_task_id,
            **extra
        )
    
    # =========================================================================
    # STYLE TRANSFER
    # =========================================================================
    
    @staticmethod
    def style_transfer(
        task_id: str,
        style_name: Optional[str] = None,
        style_strength: Optional[int] = None,
        processing_time: Optional[float] = None,
        freepik_task_id: Optional[str] = None,
        **extra
    ) -> Dict[str, Any]:
        """
        Metadata for style transfer
        
        Standard fields:
        - feature: "style_transfer"
        - task_id: Celery task ID
        - style_name: Name of applied style
        - style_strength: 0-100
        """
        return MetadataBuilder._base_metadata(
            feature="style_transfer",
            task_id=task_id,
            processing_time=processing_time,
            style_name=style_name,
            style_strength=style_strength,
            freepik_task_id=freepik_task_id,
            **extra
        )
    
    # =========================================================================
    # REIMAGINE
    # =========================================================================
    
    @staticmethod
    def reimagine(
        task_id: str,
        creativity_level: Optional[int] = None,
        style_reference: Optional[str] = None,
        processing_time: Optional[float] = None,
        freepik_task_id: Optional[str] = None,
        **extra
    ) -> Dict[str, Any]:
        """
        Metadata for image reimagining
        
        Standard fields:
        - feature: "reimagine"
        - task_id: Celery task ID
        - creativity_level: 0-100
        - style_reference: URL of style reference (if used)
        """
        return MetadataBuilder._base_metadata(
            feature="reimagine",
            task_id=task_id,
            processing_time=processing_time,
            creativity_level=creativity_level,
            style_reference=style_reference,
            freepik_task_id=freepik_task_id,
            **extra
        )
    
    # =========================================================================
    # IMAGE EXPAND
    # =========================================================================
    
    @staticmethod
    def image_expand(
        task_id: str,
        expand_direction: Optional[str] = None,
        expand_amount: Optional[int] = None,
        new_aspect_ratio: Optional[str] = None,
        processing_time: Optional[float] = None,
        freepik_task_id: Optional[str] = None,
        input_dimensions: Optional[Dict[str, int]] = None,
        output_dimensions: Optional[Dict[str, int]] = None,
        **extra
    ) -> Dict[str, Any]:
        """
        Metadata for image expansion
        
        Standard fields:
        - feature: "image_expand"
        - task_id: Celery task ID
        - expand_direction: "all", "horizontal", "vertical"
        - expand_amount: Pixels or percentage
        - new_aspect_ratio: Target aspect ratio
        - input_dimensions: Original size
        - output_dimensions: Expanded size
        """
        return MetadataBuilder._base_metadata(
            feature="image_expand",
            task_id=task_id,
            processing_time=processing_time,
            expand_direction=expand_direction,
            expand_amount=expand_amount,
            new_aspect_ratio=new_aspect_ratio,
            freepik_task_id=freepik_task_id,
            input_dimensions=input_dimensions,
            output_dimensions=output_dimensions,
            **extra
        )


# =============================================================================
# METADATA VALIDATION
# =============================================================================

def validate_metadata(metadata: Dict[str, Any]) -> bool:
    """
    Validate metadata structure
    
    Required fields:
    - feature: str
    - version: str
    - timestamp: str (ISO 8601)
    
    Returns:
        bool: True if valid
    """
    required_fields = ["feature", "version", "timestamp"]
    
    for field in required_fields:
        if field not in metadata:
            return False
    
    # Validate feature name
    valid_features = [
        "image_generation",
        "upscale",
        "remove_background",
        "relight",
        "style_transfer",
        "reimagine",
        "image_expand"
    ]
    
    if metadata["feature"] not in valid_features:
        return False
    
    return True


# =============================================================================
# EXAMPLE USAGE
# =============================================================================

"""
# Image Generation
metadata = MetadataBuilder.image_generation(
    task_id="abc123-456",
    aspect_ratio="16:9",
    model="realism",
    resolution="2k",
    style="photorealistic",
    processing_time=12.5
)

# Upscale
metadata = MetadataBuilder.upscale(
    task_id="xyz789",
    scale_factor=2,
    creativity=50,
    resemblance=80,
    input_dimensions={"width": 512, "height": 512},
    output_dimensions={"width": 1024, "height": 1024}
)

# Remove Background
metadata = MetadataBuilder.remove_background(
    input_source="url",
    processing_time=2.3
)

# Save to gallery with standardized metadata
image_gallery_service.save_image(
    user_id="user123",
    image_url="https://...",
    refined_prompt="A beautiful sunset",
    intent="image_generation",
    metadata=metadata
)
"""
