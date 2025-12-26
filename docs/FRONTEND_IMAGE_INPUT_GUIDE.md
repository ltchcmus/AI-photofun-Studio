# Frontend Image Input Guide

## 📸 3 Cách Gửi Ảnh Đến Backend

Backend hỗ trợ **3 cách** gửi ảnh, FE chọn cách nào thuận tiện nhất:

### 1. Base64 Encoding (JSON) ⭐ **Khuyên dùng cho small images**

**Cách hoạt động**: Encode ảnh thành base64 string, gửi trong JSON body

**Ưu điểm**:
- ✅ Đơn giản, chỉ cần 1 request
- ✅ Không cần multipart/form-data
- ✅ Dễ debug (xem trong Network tab)
- ✅ Hoạt động tốt với React/Vue/Angular

**Nhược điểm**:
- ❌ File size tăng ~33% (base64 overhead)
- ❌ Không tốt cho ảnh lớn (>2MB)

**Code Example**:

```javascript
// React/Vue/Angular
async function uploadWithBase64(imageFile) {
  // Convert file to base64
  const reader = new FileReader();
  reader.readAsDataURL(imageFile);
  
  reader.onload = async () => {
    const base64 = reader.result; // "data:image/png;base64,iVBOR..."
    
    const response = await fetch('/v1/features/upscale/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        image_data: base64,  // Base64 với header
        flavor: 'photo',
        user_id: 'user123'
      })
    });
    
    const result = await response.json();
    console.log('Task ID:', result.task_id);
  };
}
```

**Base64 Format**:
```
data:image/png;base64,iVBORw0KGgoAAAANS...
```

Backend tự động:
- Detect extension từ `data:image/png` 
- Remove prefix `data:image/png;base64,`
- Decode base64
- Upload to storage
- Return URL

---

### 2. Direct URL (JSON) ⚡ **Fastest**

**Cách hoạt động**: Gửi URL của ảnh đã được upload sẵn

**Ưu điểm**:
- ✅ **Nhanh nhất** - không cần upload
- ✅ JSON đơn giản
- ✅ Tốt cho ảnh đã có trên server khác

**Nhược điểm**:
- ❌ Cần upload ảnh trước (2 bước)

**Code Example**:

```javascript
// Scenario 1: Ảnh từ file upload service
async function uploadWithURL() {
  // Step 1: Upload to file service first
  const formData = new FormData();
  formData.append('image', imageFile);
  formData.append('id', uuidv4());
  
  const uploadResponse = await fetch('https://file-service-cdal.onrender.com/api/v1/file/uploads', {
    method: 'POST',
    body: formData
  });
  
  const { url } = await uploadResponse.json();
  
  // Step 2: Send URL to AI service
  const response = await fetch('/v1/features/upscale/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image_url: url,  // URL from upload service
      flavor: 'photo',
      user_id: 'user123'
    })
  });
}

// Scenario 2: Ảnh từ external URL (user paste link)
async function uploadExternalURL() {
  const response = await fetch('/v1/features/upscale/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image_url: 'https://example.com/photo.jpg',  // External URL
      flavor: 'photo',
      user_id: 'user123'
    })
  });
}
```

---

### 3. Multipart Form-Data (File Upload) 📁 **Best for large files**

**Cách hoạt động**: Traditional file upload với form-data

**Ưu điểm**:
- ✅ **Tốt nhất cho ảnh lớn** (>2MB)
- ✅ Không có base64 overhead
- ✅ Browser native support
- ✅ Progress tracking dễ dàng

**Nhược điểm**:
- ❌ Phức tạp hơn JSON
- ❌ Cần `multipart/form-data` content-type

**Code Example**:

```javascript
// React/Vue/Angular
async function uploadWithFormData(imageFile) {
  const formData = new FormData();
  formData.append('image_file', imageFile);  // File object
  formData.append('flavor', 'photo');
  formData.append('user_id', 'user123');
  
  const response = await fetch('/v1/features/upscale/', {
    method: 'POST',
    body: formData  // NO Content-Type header! Browser auto-sets
  });
  
  const result = await response.json();
  console.log('Task ID:', result.task_id);
}
```

**With Progress**:

```javascript
async function uploadWithProgress(imageFile) {
  const formData = new FormData();
  formData.append('image_file', imageFile);
  formData.append('flavor', 'photo');
  formData.append('user_id', 'user123');
  
  const xhr = new XMLHttpRequest();
  
  // Progress tracking
  xhr.upload.addEventListener('progress', (e) => {
    if (e.lengthComputable) {
      const percent = (e.loaded / e.total) * 100;
      console.log(`Upload progress: ${percent}%`);
    }
  });
  
  xhr.addEventListener('load', () => {
    const result = JSON.parse(xhr.responseText);
    console.log('Task ID:', result.task_id);
  });
  
  xhr.open('POST', '/v1/features/upscale/');
  xhr.send(formData);
}
```

---

## 🎯 Khi Nào Dùng Cái Gì?

### Base64 (image_data) - Dùng khi:
- ✅ Ảnh nhỏ (<2MB)
- ✅ Single-page app cần đơn giản
- ✅ React/Vue component upload
- ✅ Mobile app (React Native, Flutter)

### URL (image_url) - Dùng khi:
- ✅ Ảnh đã được upload rồi
- ✅ User paste link từ internet
- ✅ Cần performance tốt nhất
- ✅ Batch processing nhiều ảnh

### Form-Data (image_file) - Dùng khi:
- ✅ Ảnh lớn (>2MB)
- ✅ Cần progress bar
- ✅ Traditional web forms
- ✅ Multiple file uploads

---

## 🔧 API Endpoints Hỗ Trợ

Tất cả các AI endpoints đều hỗ trợ 3 cách:

| Endpoint | Supports |
|----------|----------|
| `/v1/features/upscale/` | ✅ base64 / URL / file |
| `/v1/features/remove-background/` | ✅ base64 / URL / file |
| `/v1/features/relight/` | ✅ base64 / URL / file |
| `/v1/features/style-transfer/` | ✅ base64 / URL / file |
| `/v1/features/reimagine/` | ✅ base64 / URL / file |
| `/v1/features/image-expand/` | ✅ base64 / URL / file |

---

## 📋 Request Examples

### Example 1: Upscale với Base64

```javascript
POST /v1/features/upscale/
Content-Type: application/json

{
  "image_data": "data:image/jpeg;base64,/9j/4AAQSkZJRg...",
  "flavor": "photo",
  "user_id": "user123"
}
```

### Example 2: Upscale với URL

```javascript
POST /v1/features/upscale/
Content-Type: application/json

{
  "image_url": "https://file-service.com/images/abc123.jpg",
  "flavor": "photo",
  "user_id": "user123"
}
```

### Example 3: Upscale với Form-Data

```javascript
POST /v1/features/upscale/
Content-Type: multipart/form-data

------WebKitFormBoundary
Content-Disposition: form-data; name="image_file"; filename="photo.jpg"
Content-Type: image/jpeg

<binary data>
------WebKitFormBoundary
Content-Disposition: form-data; name="flavor"

photo
------WebKitFormBoundary
Content-Disposition: form-data; name="user_id"

user123
------WebKitFormBoundary--
```

---

## 🎨 React Component Examples

### Hook for Base64 Upload

```jsx
import { useState } from 'react';

function useImageUpload() {
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  
  const uploadImage = async (file, feature = 'upscale') => {
    setUploading(true);
    
    try {
      // Convert to base64
      const base64 = await fileToBase64(file);
      
      // Send to API
      const response = await fetch(`/v1/features/${feature}/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_data: base64,
          flavor: 'photo',
          user_id: getCurrentUserId()
        })
      });
      
      const data = await response.json();
      setResult(data);
      return data;
      
    } catch (error) {
      console.error('Upload failed:', error);
      throw error;
    } finally {
      setUploading(false);
    }
  };
  
  return { uploadImage, uploading, result };
}

// Helper function
function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
  });
}

// Usage in component
function ImageUploader() {
  const { uploadImage, uploading } = useImageUpload();
  
  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (file) {
      const result = await uploadImage(file);
      console.log('Task ID:', result.task_id);
    }
  };
  
  return (
    <input 
      type="file" 
      accept="image/*" 
      onChange={handleFileSelect}
      disabled={uploading}
    />
  );
}
```

### Component with Form-Data

```jsx
function ImageUploaderFormData() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  
  const handleFileSelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    setUploading(true);
    
    const formData = new FormData();
    formData.append('image_file', file);
    formData.append('flavor', 'photo');
    formData.append('user_id', getCurrentUserId());
    
    try {
      const xhr = new XMLHttpRequest();
      
      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          setProgress((e.loaded / e.total) * 100);
        }
      };
      
      xhr.onload = () => {
        const result = JSON.parse(xhr.responseText);
        console.log('Task ID:', result.task_id);
        setUploading(false);
      };
      
      xhr.open('POST', '/v1/features/upscale/');
      xhr.send(formData);
      
    } catch (error) {
      console.error('Upload failed:', error);
      setUploading(false);
    }
  };
  
  return (
    <div>
      <input 
        type="file" 
        accept="image/*" 
        onChange={handleFileSelect}
        disabled={uploading}
      />
      {uploading && <progress value={progress} max="100" />}
    </div>
  );
}
```

---

## ⚠️ Important Notes

### Validation
Backend validates that **at least one** of these is provided:
- `image_data` (base64)
- `image_url` (URL)
- `image_file` (file upload)

If none provided → `400 Bad Request`

### Priority Order
If multiple provided, backend uses this priority:
1. **image_url** (fastest, no processing)
2. **image_file** (direct upload)
3. **image_data** (base64 decode)

### File Size Limits
- **Max upload size**: 10MB
- **Max dimensions**: 4096x4096 pixels
- **Allowed formats**: JPG, PNG, WEBP, GIF

### Best Practices
1. ✅ Use base64 for <2MB images
2. ✅ Use form-data for >2MB images
3. ✅ Use URL when image already uploaded
4. ✅ Show progress bar for large files
5. ✅ Handle errors gracefully
6. ✅ Validate file type client-side
7. ✅ Compress images before upload when possible

---

## 🐛 Error Handling

```javascript
async function uploadImageWithErrorHandling(file) {
  try {
    // Validate file type
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      throw new Error('Invalid file type. Use JPG, PNG, or WEBP.');
    }
    
    // Validate file size
    if (file.size > 10 * 1024 * 1024) {
      throw new Error('File too large. Max 10MB.');
    }
    
    // Choose upload method based on size
    const method = file.size > 2 * 1024 * 1024 ? 'formdata' : 'base64';
    
    let response;
    if (method === 'base64') {
      const base64 = await fileToBase64(file);
      response = await fetch('/v1/features/upscale/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_data: base64,
          flavor: 'photo',
          user_id: getCurrentUserId()
        })
      });
    } else {
      const formData = new FormData();
      formData.append('image_file', file);
      formData.append('flavor', 'photo');
      formData.append('user_id', getCurrentUserId());
      
      response = await fetch('/v1/features/upscale/', {
        method: 'POST',
        body: formData
      });
    }
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || 'Upload failed');
    }
    
    return await response.json();
    
  } catch (error) {
    console.error('Upload error:', error);
    alert(error.message);
    throw error;
  }
}
```

---

**Made with ❤️ for Frontend Developers**
