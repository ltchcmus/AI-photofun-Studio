import io
import time
from PIL import Image, ImageFilter, ImageEnhance
import logging

logger = logging.getLogger(__name__)


class ImageProcessingService:
    """Service for basic image processing operations"""
    
    def process_image(self, image_file, operation_type, parameters):
        """
        Process image based on operation type
        
        Args:
            image_file: Uploaded image file
            operation_type: Type of operation (resize, crop, rotate, filter, compress)
            parameters: Dictionary of operation parameters
            
        Returns:
            tuple: (processed_image_bytes, processing_time)
        """
        start_time = time.time()
        
        # Open image
        image = Image.open(image_file)
        
        # Convert RGBA to RGB if necessary
        if image.mode == 'RGBA':
            background = Image.new('RGB', image.size, (255, 255, 255))
            background.paste(image, mask=image.split()[3])
            image = background
        elif image.mode != 'RGB':
            image = image.convert('RGB')
        
        # Process based on operation type
        if operation_type == 'resize':
            image = self._resize(image, parameters)
        elif operation_type == 'crop':
            image = self._crop(image, parameters)
        elif operation_type == 'rotate':
            image = self._rotate(image, parameters)
        elif operation_type == 'filter':
            image = self._apply_filter(image, parameters)
        elif operation_type == 'compress':
            image = self._compress(image, parameters)
        else:
            raise ValueError(f"Unknown operation type: {operation_type}")
        
        # Save to bytes
        output = io.BytesIO()
        image.save(output, format='PNG', quality=95)
        output.seek(0)
        
        processing_time = time.time() - start_time
        logger.info(f"Image processed in {processing_time:.2f}s")
        
        return output.read(), processing_time
    
    def _resize(self, image, parameters):
        """Resize image"""
        width = parameters.get('width', 800)
        height = parameters.get('height', 600)
        maintain_aspect = parameters.get('maintain_aspect', True)
        
        if maintain_aspect:
            image.thumbnail((width, height), Image.Resampling.LANCZOS)
        else:
            image = image.resize((width, height), Image.Resampling.LANCZOS)
        
        return image
    
    def _crop(self, image, parameters):
        """Crop image"""
        left = parameters.get('left', 0)
        top = parameters.get('top', 0)
        right = parameters.get('right', image.width)
        bottom = parameters.get('bottom', image.height)
        
        return image.crop((left, top, right, bottom))
    
    def _rotate(self, image, parameters):
        """Rotate image"""
        angle = parameters.get('angle', 90)
        expand = parameters.get('expand', True)
        
        return image.rotate(angle, expand=expand)
    
    def _apply_filter(self, image, parameters):
        """Apply filter to image"""
        filter_type = parameters.get('filter_type', 'blur')
        
        if filter_type == 'blur':
            image = image.filter(ImageFilter.BLUR)
        elif filter_type == 'sharpen':
            image = image.filter(ImageFilter.SHARPEN)
        elif filter_type == 'edge_enhance':
            image = image.filter(ImageFilter.EDGE_ENHANCE)
        elif filter_type == 'brightness':
            brightness = parameters.get('value', 1.5)
            enhancer = ImageEnhance.Brightness(image)
            image = enhancer.enhance(brightness)
        elif filter_type == 'contrast':
            contrast = parameters.get('value', 1.5)
            enhancer = ImageEnhance.Contrast(image)
            image = enhancer.enhance(contrast)
        
        return image
    
    def _compress(self, image, parameters):
        """Compress image"""
        quality = parameters.get('quality', 85)
        
        output = io.BytesIO()
        image.save(output, format='JPEG', quality=quality, optimize=True)
        output.seek(0)
        
        return Image.open(output)
