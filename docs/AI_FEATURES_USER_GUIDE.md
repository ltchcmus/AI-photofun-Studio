# 🎨 AI PhotoFun Studio - Hướng Dẫn Sử Dụng Các Tính Năng AI

## 📋 Mục Lục
1. [Giới Thiệu](#giới-thiệu)
2. [Sinh Ảnh Từ Văn Bản (Image Generation)](#1-sinh-ảnh-từ-văn-bản)
3. [Tăng Độ Phân Giải (Upscale)](#2-tăng-độ-phân-giải)
4. [Xóa Phông Nền (Remove Background)](#3-xóa-phông-nền)
5. [Chiếu Sáng Lại (Relight)](#4-chiếu-sáng-lại)
6. [Chuyển Đổi Phong Cách (Style Transfer)](#5-chuyển-đổi-phong-cách)
7. [Tái Tưởng Tượng (Reimagine)](#6-tái-tưởng-tượng)
8. [Mở Rộng Ảnh (Image Expand)](#7-mở-rộng-ảnh)
9. [Chi Phí Token](#chi-phí-token)
10. [Câu Hỏi Thường Gặp](#câu-hỏi-thường-gặp)

---

## Giới Thiệu

AI PhotoFun Studio cung cấp 7 tính năng AI mạnh mẽ để chỉnh sửa và tạo ảnh:

| Tính năng | Mô tả | Token | Thời gian |
|-----------|-------|-------|-----------|
| 🎨 **Image Generation** | Tạo ảnh từ văn bản mô tả | 10 | 10-30s |
| 🔍 **Upscale** | Tăng độ phân giải ảnh | 5 | 5-15s |
| ✂️ **Remove Background** | Xóa phông nền tự động | 3 | Tức thì |
| 💡 **Relight** | Thay đổi ánh sáng trong ảnh | 8 | 10-20s |
| 🎭 **Style Transfer** | Chuyển phong cách nghệ thuật | 12 | 15-30s |
| 🔮 **Reimagine** | Tái tưởng tượng ảnh với AI | 15 | 15-30s |
| 📐 **Image Expand** | Mở rộng viền ảnh thông minh | 10 | 10-20s |

---

## 1. Sinh Ảnh Từ Văn Bản

### 📝 Mô tả
Tạo ảnh hoàn toàn mới chỉ từ mô tả văn bản. Tính năng mạnh mẽ nhất để biến ý tưởng thành hình ảnh.

### 🎯 Cách sử dụng

#### Qua Chat Bot:
```
Bạn: "Tạo cho tôi một bức ảnh hoàng hôn trên núi"
Bot: [Tự động sinh ảnh và trả về kết quả]
```

#### Qua API trực tiếp:
```bash
curl -X POST http://localhost:8000/v1/features/image-generation/ \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A beautiful sunset over mountains with dramatic clouds",
    "user_id": "user123",
    "aspect_ratio": "landscape_16_9"
  }'
```

### ⚙️ Tùy chọn nâng cao

#### Tỷ lệ khung hình:
- `square_1_1` - Vuông (1:1) - Mặc định
- `portrait_9_16` - Dọc (9:16) - Cho điện thoại
- `landscape_16_9` - Ngang (16:9) - Cho desktop
- `portrait_3_4` - Dọc (3:4)
- `landscape_4_3` - Ngang (4:3)

#### Ảnh tham khảo phong cách:
```json
{
  "prompt": "A modern cityscape",
  "style_reference": "https://example.com/cyberpunk-style.jpg"
}
```

### 💡 Tips cho prompt tốt:
1. **Mô tả cụ thể**: "A golden retriever puppy playing in a meadow" tốt hơn "a dog"
2. **Thêm chi tiết**: "sunset, dramatic clouds, warm colors, professional photography"
3. **Phong cách nghệ thuật**: "oil painting", "watercolor", "digital art", "photorealistic"
4. **Ánh sáng**: "soft lighting", "dramatic shadows", "golden hour"
5. **Chất lượng**: "high quality", "4k", "detailed", "professional"

### ✅ Ví dụ prompts hay:

**Chân dung:**
```
"Professional portrait of a woman, studio lighting, 
soft bokeh background, Canon 85mm f/1.4, 
high quality photography"
```

**Phong cảnh:**
```
"Majestic mountain landscape at sunset, 
dramatic clouds, reflection in lake, 
wide angle, Ansel Adams style, 
high dynamic range"
```

**Nghệ thuật:**
```
"Fantasy castle on floating island, 
magical atmosphere, glowing crystals, 
concept art style, trending on artstation, 
vibrant colors"
```

---

## 2. Tăng Độ Phân Giải

### 📝 Mô tả
Tăng kích thước và độ chi tiết của ảnh mà không làm mờ. Hoàn hảo cho việc in ấn hoặc phóng to ảnh.

### 🎯 Cách sử dụng

```json
{
  "image": "https://example.com/my-photo.jpg",
  "user_id": "user123",
  "flavor": "photo"
}
```

### ⚙️ Chế độ Upscale:

#### 📷 Photo Mode (Khuyên dùng cho ảnh chụp):
- Sharpness: 50%
- Smart Grain: 20%
- Ultra Detail: 30%
- **Dùng cho**: Ảnh selfie, ảnh chân dung, ảnh du lịch

#### 🎨 Art Mode (Dùng cho tranh vẽ):
- Sharpness: 30%
- Smart Grain: 0%
- Ultra Detail: 50%
- **Dùng cho**: Tranh vẽ, artwork, paintings

#### 🖼️ Illustration Mode (Dùng cho hình minh họa):
- Sharpness: 70%
- Smart Grain: 0%
- Ultra Detail: 40%
- **Dùng cho**: Logo, icons, illustrations, line art

### 💡 Khi nào nên dùng:
- ✅ Ảnh chụp từ điện thoại cần in ra
- ✅ Ảnh cũ độ phân giải thấp
- ✅ Logo/icon cần phóng to
- ✅ Ảnh mờ cần làm rõ nét
- ❌ KHÔNG dùng cho ảnh đã rất sắc nét (lãng phí token)

---

## 3. Xóa Phông Nền

### 📝 Mô tả
Xóa phông nền ảnh tự động, giữ lại đối tượng chính. **Tính năng nhanh nhất** - kết quả tức thì!

### 🎯 Cách sử dụng

```json
{
  "image": "https://example.com/portrait.jpg",
  "user_id": "user123"
}
```

### ⚡ Đặc điểm:
- ✅ **Trả kết quả ngay lập tức** (không cần chờ polling)
- ✅ Tự động nhận diện đối tượng chính
- ✅ Edge detection chính xác
- ✅ Giữ chi tiết tóc, cạnh viền

### 💡 Ứng dụng thực tế:
1. **E-commerce**: Ảnh sản phẩm trên nền trắng
2. **Chân dung chuyên nghiệp**: Ảnh hồ sơ, CV
3. **Social media**: Tạo sticker, avatar
4. **Thiết kế**: Ghép ảnh, collage
5. **Marketing**: Banner, poster với nền custom

### 📸 Loại ảnh phù hợp:
- ✅ Chân dung người (kết quả tốt nhất)
- ✅ Sản phẩm có đường viền rõ
- ✅ Logo/icon
- ✅ Động vật (chó, mèo, chim...)
- ⚠️ Ảnh phức tạp nhiều đối tượng (kết quả có thể không chính xác)

---

## 4. Chiếu Sáng Lại

### 📝 Mô tả
Thay đổi ánh sáng trong ảnh bằng AI. Tạo hiệu ứng chiếu sáng chuyên nghiệp như studio.

### 🎯 Cách sử dụng

```json
{
  "image": "https://example.com/portrait.jpg",
  "prompt": "Soft sunset lighting with warm golden tones",
  "user_id": "user123",
  "style": "cinematic"
}
```

### 🎨 Phong cách chiếu sáng:

#### 🎬 Cinematic
- **Mô tả**: Ánh sáng điện ảnh, dramatic
- **Dùng cho**: Chân dung nghệ thuật, phim ảnh style
- **Prompt gợi ý**: "dramatic side lighting", "film noir style"

#### ✨ Standard
- **Mô tả**: Ánh sáng cân bằng, tự nhiên
- **Dùng cho**: Ảnh hằng ngày, ảnh gia đình
- **Prompt gợi ý**: "natural daylight", "soft studio lighting"

#### 🌑 Darker But Realistic
- **Mô tả**: Tối hơn nhưng vẫn chân thực
- **Dùng cho**: Ảnh mood tối, nghệ thuật
- **Prompt gợi ý**: "moody atmosphere", "low-key lighting"

#### 🧹 Clean
- **Mô tả**: Sáng, sạch, không bóng tối
- **Dùng cho**: Product photography, e-commerce
- **Prompt gợi ý**: "bright even lighting", "white background"

#### 🌊 Smooth
- **Mô tả**: Ánh sáng mềm mại, không cứng
- **Dùng cho**: Chân dung beauty, fashion
- **Prompt gợi ý**: "soft diffused light", "beauty lighting"

### 💡 Tips sử dụng:

**Với ảnh tham khảo:**
```json
{
  "image": "https://example.com/my-photo.jpg",
  "reference_image": "https://example.com/lighting-reference.jpg",
  "light_transfer_strength": 0.8,
  "prompt": "Copy the lighting from reference"
}
```

**Prompts hiệu quả:**
- "Golden hour sunset lighting, warm tones"
- "Studio portrait lighting with rim light"
- "Dramatic side lighting, Rembrandt style"
- "Soft window light from the left"
- "Blue hour twilight ambiance"

---

## 5. Chuyển Đổi Phong Cách

### 📝 Mô tả
Chuyển ảnh của bạn sang phong cách nghệ thuật từ ảnh tham khảo. Biến ảnh thường thành tác phẩm nghệ thuật!

### 🎯 Cách sử dụng

```json
{
  "image": "https://example.com/my-photo.jpg",
  "reference_image": "https://example.com/van-gogh-style.jpg",
  "user_id": "user123",
  "style_strength": 0.75,
  "structure_strength": 0.75
}
```

### ⚙️ Tham số điều chỉnh:

#### Style Strength (0.0 - 1.0)
- `0.2-0.4`: Chỉ áp dụng một chút phong cách
- `0.5-0.7`: Cân bằng giữa ảnh gốc và phong cách
- `0.8-1.0`: Phong cách mạnh, thay đổi nhiều

#### Structure Strength (0.0 - 1.0)
- `0.2-0.4`: Cho phép thay đổi cấu trúc nhiều
- `0.5-0.7`: Giữ cấu trúc vừa phải
- `0.8-1.0`: Giữ nguyên cấu trúc ảnh gốc

### 🎭 Chế độ Portrait (Đặc biệt):

Khi `is_portrait: true`, bật các tính năng chuyên biệt cho chân dung:

#### Portrait Styles:
1. **Anime** - Phong cách hoạt hình Nhật Bản
2. **Photographic** - Ảnh chụp chuyên nghiệp
3. **Digital Art** - Nghệ thuật số hiện đại
4. **Comic Book** - Truyện tranh Mỹ
5. **Fantasy Art** - Nghệ thuật giả tưởng
6. **Line Art** - Vẽ đường nét
7. **Neon Punk** - Phong cách cyberpunk neon

```json
{
  "image": "https://example.com/selfie.jpg",
  "reference_image": "https://example.com/anime-style.jpg",
  "is_portrait": true,
  "portrait_style": "anime",
  "style_strength": 0.8
}
```

### 💡 Ví dụ thực tế:

**Biến ảnh thành tranh sơn dầu:**
```json
{
  "reference_image": "https://example.com/van-gogh-starry-night.jpg",
  "style_strength": 0.7,
  "structure_strength": 0.8
}
```

**Phong cách anime cho selfie:**
```json
{
  "is_portrait": true,
  "portrait_style": "anime",
  "style_strength": 0.85
}
```

**Biến ảnh thành artwork fantasy:**
```json
{
  "reference_image": "https://example.com/fantasy-painting.jpg",
  "style_strength": 0.6,
  "structure_strength": 0.7
}
```

---

## 6. Tái Tưởng Tượng

### 📝 Mô tả
Để AI sáng tạo lại ảnh của bạn theo cách mới. Khám phá vô số phiên bản khác nhau của cùng một ảnh!

### 🎯 Cách sử dụng

```json
{
  "image": "https://example.com/my-photo.jpg",
  "user_id": "user123",
  "prompt": "Make it more futuristic and sci-fi",
  "imagination": "subtle",
  "aspect_ratio": "square_1_1"
}
```

### 🔮 Mức độ tưởng tượng:

#### 🎯 Subtle (Tinh tế)
- **Mô tả**: Giữ gần với ảnh gốc, thay đổi nhẹ
- **Dùng khi**: Bạn muốn cải thiện ảnh mà không thay đổi nhiều
- **Ví dụ**: Ảnh chân dung → Cải thiện ánh sáng, màu sắc

#### 🌈 Vivid (Sống động)
- **Mô tả**: Màu sắc rực rỡ hơn, chi tiết nổi bật
- **Dùng khi**: Muốn ảnh có màu sắc đẹp, bắt mắt hơn
- **Ví dụ**: Phong cảnh → Màu trời đẹp hơn, cây xanh hơn

#### 🌪️ Wild (Hoang dã)
- **Mô tả**: Sáng tạo tự do, có thể rất khác ảnh gốc
- **Dùng khi**: Muốn khám phá ý tưởng mới hoàn toàn
- **Ví dụ**: Phòng bình thường → Thành phòng futuristic

### 💡 Cách viết prompt hiệu quả:

**Thêm yếu tố mới:**
```
"Add magical elements and fantasy atmosphere"
"Transform into cyberpunk style with neon lights"
"Make it look like a fairy tale illustration"
```

**Thay đổi thời điểm:**
```
"Change to sunset scene"
"Transform to winter wonderland"
"Make it nighttime with stars"
```

**Thay đổi phong cách nghệ thuật:**
```
"Turn into watercolor painting"
"Reimagine as vintage photograph"
"Make it look like concept art for a video game"
```

### 🎨 Use Cases:

1. **Khám phá phiên bản khác**: Tạo nhiều biến thể của cùng một ảnh
2. **Concept Art**: Phát triển ý tưởng thiết kế
3. **Nghệ thuật sáng tạo**: Tạo artwork độc đáo
4. **Biến ảnh cũ thành mới**: Refresh ảnh theo style hiện đại

---

## 7. Mở Rộng Ảnh

### 📝 Mô tả
Mở rộng viền ảnh với nội dung được AI tạo ra một cách tự nhiên. Hoàn hảo khi cần thay đổi tỷ lệ khung hình!

### 🎯 Cách sử dụng

```json
{
  "image": "https://example.com/my-photo.jpg",
  "user_id": "user123",
  "prompt": "Continue the landscape naturally",
  "left": 100,
  "right": 100,
  "top": 0,
  "bottom": 0
}
```

### 📐 Hướng mở rộng:

Chỉ định số pixel mở rộng ở mỗi cạnh:
- `left`: Mở rộng sang trái
- `right`: Mở rộng sang phải
- `top`: Mở rộng lên trên
- `bottom`: Mở rộng xuống dưới

**Lưu ý**: Phải có ít nhất một hướng > 0

### 💡 Tình huống sử dụng:

#### 📱 Đổi ảnh dọc thành ngang:
```json
{
  "left": 200,
  "right": 200,
  "top": 0,
  "bottom": 0,
  "prompt": "Continue the background scene"
}
```
**Dùng cho**: Ảnh portrait cần dùng làm banner

#### 🖼️ Đổi ảnh ngang thành vuông:
```json
{
  "left": 0,
  "right": 0,
  "top": 150,
  "bottom": 150,
  "prompt": "Extend the sky and ground"
}
```
**Dùng cho**: Post Instagram (1:1)

#### 🌅 Mở rộng phong cảnh:
```json
{
  "left": 300,
  "right": 0,
  "top": 100,
  "bottom": 100,
  "prompt": "Continue the mountain landscape with trees and sky"
}
```
**Dùng cho**: Panorama, wide-angle shots

### 📝 Tips cho prompts tốt:

**Cụ thể về nội dung:**
```
"Continue the ocean and sandy beach"
"Extend the forest with more trees"
"Add more cityscape and buildings"
```

**Mô tả style:**
```
"Match the lighting and colors of original"
"Keep the same artistic style"
"Maintain the photorealistic quality"
```

**Tránh:**
- ❌ Prompts mơ hồ: "make it bigger"
- ❌ Thêm đối tượng mới không liên quan
- ✅ Mô tả rõ phần mở rộng nên có gì

### 🎯 Ứng dụng thực tế:

1. **Social Media**: Chỉnh tỷ lệ ảnh cho từng platform
2. **Print Design**: Thêm không gian cho text overlay
3. **Photography**: Sửa lỗi crop quá sát
4. **Marketing**: Tạo banner từ ảnh nhỏ
5. **Content Creation**: Flexible aspect ratios

---

## Chi Phí Token

### 💰 Bảng giá Token:

| Tính năng | Token | Tương đương |
|-----------|-------|-------------|
| Remove Background | 3 | ~$0.03 |
| Upscale | 5 | ~$0.05 |
| Relight | 8 | ~$0.08 |
| Image Generation | 10 | ~$0.10 |
| Image Expand | 10 | ~$0.10 |
| Style Transfer | 12 | ~$0.12 |
| Reimagine | 15 | ~$0.15 |

### 💡 Tips tiết kiệm Token:

1. **Dùng Remove Background trước Upscale**: 
   - Xóa nền trước (3 tokens) → Upscale sau (5 tokens)
   - Tổng: 8 tokens thay vì upscale rồi xóa nền

2. **Test với Subtle trước khi dùng Wild**:
   - Reimagine ở chế độ Subtle trước
   - Chỉ dùng Wild khi cần thiết

3. **Dùng Prompt tốt ngay từ đầu**:
   - Generation 1 lần với prompt tốt > Generate nhiều lần sửa

4. **Chọn đúng tính năng**:
   - Không dùng Reimagine khi chỉ cần Upscale
   - Không dùng Style Transfer khi chỉ cần Relight

### 📊 Gói Token khuyên dùng:

- **Người dùng thử nghiệm**: 100 tokens (~10 ảnh generation)
- **Người dùng thường xuyên**: 500 tokens (~50 tác vụ)
- **Content creator**: 2000+ tokens (~200+ tác vụ)

---

## Câu Hỏi Thường Gặp

### ❓ Thời gian xử lý bao lâu?

| Tính năng | Thời gian |
|-----------|-----------|
| Remove Background | **Tức thì** |
| Upscale | 5-15 giây |
| Image Generation | 10-30 giây |
| Relight | 10-20 giây |
| Style Transfer | 15-30 giây |
| Reimagine | 15-30 giây |
| Image Expand | 10-20 giây |

### ❓ Kích thước ảnh tối đa?

- **Upload**: 10MB
- **Kích thước**: 4096x4096 pixels
- **Format**: JPG, PNG, WEBP

### ❓ Có giới hạn số lượng không?

- **Rate limit**: 1 request/giây cho AI features
- **Daily limit**: Tùy theo gói token
- **Concurrent tasks**: 3 tasks cùng lúc

### ❓ Làm gì khi task bị lỗi?

1. Kiểm tra format ảnh (JPG/PNG)
2. Kiểm tra kích thước file (< 10MB)
3. Thử lại với prompt đơn giản hơn
4. Liên hệ support nếu vẫn lỗi

### ❓ Kết quả không như ý?

**Image Generation:**
- ✅ Viết prompt chi tiết hơn
- ✅ Thêm từ khóa về style, lighting
- ✅ Thử model khác (realism, flexible...)

**Style Transfer:**
- ✅ Điều chỉnh style_strength thấp hơn
- ✅ Tăng structure_strength để giữ ảnh gốc

**Relight:**
- ✅ Dùng ảnh tham khảo thay vì prompt
- ✅ Thử style khác (cinematic, clean...)

### ❓ Có thể lưu ảnh đã tạo không?

- ✅ Tất cả ảnh tự động lưu vào Gallery
- ✅ Truy cập qua `/v1/gallery/`
- ✅ Download bất cứ lúc nào
- ✅ Xem lịch sử các tác vụ AI

### ❓ Bảo mật ảnh của tôi?

- 🔒 Ảnh được mã hóa khi truyền tải
- 🔒 Chỉ bạn truy cập được ảnh của mình
- 🔒 Tự động xóa sau 30 ngày (tùy cấu hình)
- 🔒 Tuân thủ GDPR và privacy laws

---

## 🚀 Bắt Đầu Ngay

### Qua Chat Bot (Đơn giản nhất):
```
"Tạo cho tôi ảnh hoàng hôn trên biển"
"Xóa phông nền ảnh này: [upload]"
"Làm ảnh này rõ nét hơn: [upload]"
```

### Qua API (Cho developers):
```bash
# 1. Generate image
curl -X POST http://api.aiphotostudio.com/v1/features/image-generation/ \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "A sunset over the ocean",
    "user_id": "your_user_id"
  }'

# 2. Check status
curl http://api.aiphotostudio.com/v1/features/image-generation/status/TASK_ID

# 3. Download result
# URLs in response: uploaded_urls[]
```

---

## 📞 Hỗ Trợ

- 📧 Email: support@aiphotostudio.com
- 💬 Discord: [AI PhotoFun Community]
- 📖 Documentation: https://docs.aiphotostudio.com
- 🐛 Bug Reports: https://github.com/aiphotostudio/issues

---

**Made with ❤️ by AI PhotoFun Studio Team**

*Cập nhật lần cuối: December 2025*
