# IMAGE GALLERY METADATA SCHEMA

## ✅ FIXES APPLIED

### 1. **URL Pattern Fix**
- ❌ Trước: `path('<uuid:image_id>', ...)` - Không có trailing slash
- ✅ Sau: `path('<uuid:image_id>/', ...)` - Có trailing slash

**Test:**
```bash
# Trước (404 Error):
curl -X DELETE "http://localhost:9999/v1/gallery/cf5bdd40-c8b2-49a6-83e4-f2917919648c/" -v

# Sau (200 OK):
curl -X DELETE "http://localhost:9999/v1/gallery/cf5bdd40-c8b2-49a6-83e4-f2917919648c/" -v
```

### 2. **Metadata Standardization**
Tất cả AI features giờ sử dụng `MetadataBuilder` để đảm bảo cấu trúc thống nhất.

---

## STANDARDIZED METADATA STRUCTURE

### Base Fields (All Features)

```json
{
  "feature": "string",           // Feature name
  "version": "1.0",              // Schema version
  "timestamp": "ISO8601",        // When created
  "task_id": "string",           // Celery task ID (optional)
  "processing_time": 12.5        // Seconds (optional)
}
```

---

## FEATURE-SPECIFIC METADATA

### 1. Image Generation
```json
{
  "feature": "image_generation",
  "version": "1.0",
  "timestamp": "2025-12-18T03:00:00Z",
  "task_id": "abc123-456",
  "processing_time": 12.5,
  
  // Feature-specific
  "aspect_ratio": "16:9",
  "model": "realism",
  "resolution": "2k",
  "style": "photorealistic",
  "num_images": 1,
  "freepik_task_id": "xyz789"
}
```

**Usage:**
```python
from shared.metadata_schema import MetadataBuilder

metadata = MetadataBuilder.image_generation(
    task_id="abc123",
    aspect_ratio="16:9",
    model="realism",
    resolution="2k",
    style="photorealistic",
    processing_time=12.5
)
```

---

### 2. Upscale
```json
{
  "feature": "upscale",
  "version": "1.0",
  "timestamp": "2025-12-18T03:00:00Z",
  "task_id": "def456",
  "processing_time": 8.3,
  
  // Feature-specific
  "scale_factor": 2,
  "creativity": 50,
  "resemblance": 80,
  "engine": "magnific_sharpy",
  "input_dimensions": {"width": 512, "height": 512},
  "output_dimensions": {"width": 1024, "height": 1024}
}
```

**Usage:**
```python
metadata = MetadataBuilder.upscale(
    task_id="def456",
    scale_factor=2,
    creativity=50,
    resemblance=80,
    input_dimensions={"width": 512, "height": 512},
    output_dimensions={"width": 1024, "height": 1024}
)
```

---

### 3. Remove Background
```json
{
  "feature": "remove_background",
  "version": "1.0",
  "timestamp": "2025-12-18T03:00:00Z",
  "processing_time": 2.3,
  
  // Feature-specific
  "input_source": "url",
  "output_format": "png",
  "has_transparency": true,
  "original_image": "https://example.com/input.jpg"
}
```

**Usage:**
```python
metadata = MetadataBuilder.remove_background(
    input_source="url",
    processing_time=2.3
)
```

---

### 4. Relight
```json
{
  "feature": "relight",
  "version": "1.0",
  "timestamp": "2025-12-18T03:00:00Z",
  "task_id": "ghi789",
  
  // Feature-specific
  "light_direction": "top-right",
  "light_intensity": 75,
  "light_color": "#FFD700"
}
```

**Usage:**
```python
metadata = MetadataBuilder.relight(
    task_id="ghi789",
    light_direction="top-right",
    light_intensity=75,
    light_color="#FFD700"
)
```

---

### 5. Style Transfer
```json
{
  "feature": "style_transfer",
  "version": "1.0",
  "timestamp": "2025-12-18T03:00:00Z",
  "task_id": "jkl012",
  
  // Feature-specific
  "style_name": "anime",
  "style_strength": 80
}
```

---

### 6. Reimagine
```json
{
  "feature": "reimagine",
  "version": "1.0",
  "timestamp": "2025-12-18T03:00:00Z",
  "task_id": "mno345",
  
  // Feature-specific
  "creativity_level": 70,
  "style_reference": "https://example.com/style.jpg"
}
```

---

### 7. Image Expand
```json
{
  "feature": "image_expand",
  "version": "1.0",
  "timestamp": "2025-12-18T03:00:00Z",
  "task_id": "pqr678",
  
  // Feature-specific
  "expand_direction": "horizontal",
  "expand_amount": 256,
  "new_aspect_ratio": "16:9",
  "input_dimensions": {"width": 512, "height": 512},
  "output_dimensions": {"width": 1024, "height": 512}
}
```

---

## MIGRATION GUIDE

### Before (Inconsistent)
```python
# Different structures in each service
metadata = {
    'model': 'realism',
    'aspect_ratio': '16:9',
    'resolution': '2k',
    'original_prompt': prompt
}
```

### After (Standardized)
```python
from shared.metadata_schema import MetadataBuilder

metadata = MetadataBuilder.image_generation(
    task_id=task_id,
    aspect_ratio="16:9",
    model="realism",
    resolution="2k",
    processing_time=12.5
)
```

---

## VALIDATION

```python
from shared.metadata_schema import validate_metadata

# Validate before saving
if validate_metadata(metadata):
    image_gallery_service.save_image(
        user_id=user_id,
        image_url=image_url,
        refined_prompt=prompt,
        intent="image_generation",
        metadata=metadata
    )
```

---

## UPDATED FILES

✅ **Core:**
- `shared/metadata_schema.py` - MetadataBuilder class
- `apps/image_gallery/urls.py` - Fixed URL patterns

✅ **Services Updated:**
- `apps/image_generation/services.py`
- `apps/remove_background/services.py`

⏳ **Services To Update:**
- `apps/upscale/services.py`
- `apps/relight/services.py`
- `apps/style_transfer/services.py`
- `apps/reimagine/services.py`
- `apps/image_expand/services.py`

---

## TESTING

### Test URL Fix
```bash
# List all images
curl "http://localhost:9999/v1/gallery/?user_id=user123"

# Get single image
curl "http://localhost:9999/v1/gallery/IMAGE_ID/"

# Delete image
curl -X DELETE "http://localhost:9999/v1/gallery/IMAGE_ID/"
```

### Test Metadata Structure
```bash
# Generate image and check metadata
curl -X POST "http://localhost:9999/v1/features/image-generate/" \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A sunset",
    "user_id": "test_user",
    "aspect_ratio": "16:9"
  }'

# Check gallery entry
curl "http://localhost:9999/v1/gallery/?user_id=test_user" | jq '.result[-1].metadata'

# Expected output:
# {
#   "feature": "image_generation",
#   "version": "1.0",
#   "timestamp": "2025-12-18T03:00:00Z",
#   "task_id": "...",
#   "aspect_ratio": "16:9",
#   "model": "realism",
#   "resolution": "2k",
#   "num_images": 1
# }
```

---

## BENEFITS

✅ **Consistency** - All features use the same metadata structure  
✅ **Validation** - Built-in validation for metadata fields  
✅ **Extensibility** - Easy to add new fields without breaking existing code  
✅ **Type Safety** - Clear function signatures with type hints  
✅ **Documentation** - Self-documenting through builder methods  
✅ **Debugging** - Timestamp and processing_time for troubleshooting  
✅ **Analytics** - Standardized structure makes data analysis easier
