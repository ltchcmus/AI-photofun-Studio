# 🎥 Video Features Added to TestUI

## Tóm tắt các thay đổi

### ✅ Backend đã có sẵn (đã kiểm tra):

#### 1. **Post Service - Video Posts**

- ✅ Entity `Post`: có field `videoUrl`
- ✅ `CreateVideoPostRequest`: nhận `caption`, `videoUrl`, `prompt`
- ✅ `PostController`: endpoint `POST /api/v1/posts/create-video`
- ✅ `PostService.uploadVideo()`: logic tạo video post hoàn chỉnh

#### 2. **Communication Service - Video Messages**

- ✅ Entity `Communication`: có field `isVideo`
- ✅ Entity `GroupMessage`: có field `isVideo`
- ✅ `SendMessageRequest`: có field `isVideo`
- ✅ `SendMessageGroupRequest`: có field `isVideo`
- ✅ `WebSocket.java`: xử lý `isVideo` cho cả 1-1 và group chat

---

## 🆕 Đã thêm vào TestUI

### 1. **PostTab.jsx** - Create Video Post

#### Thêm UI cho tạo video post:

```jsx
<div className="api-section">
  <h3>🎥 Create Video Post (API #33)</h3>
  <p>Note: Upload video to external server first to get videoUrl</p>
  <div className="form-row">
    <input placeholder="Caption" />
    <input placeholder="Prompt" />
    <input placeholder="Video URL (from external server)" />
    <button onClick={createVideoPost}>Create Video Post</button>
  </div>
</div>
```

#### Thêm function `createVideoPost()`:

- Gửi `FormData` với `caption`, `prompt`, `videoUrl`
- Gọi `POST /api/v1/posts/create-video`
- Hiển thị response

#### State đã update:

```jsx
const [createData, setCreateData] = useState({
  caption: "",
  prompt: "",
  videoUrl: "", // ← Thêm videoUrl
});
```

---

### 2. **CommunicationTab.jsx** - Video Messages

#### Thêm state cho video:

```jsx
// 1-1 Chat
const [isImage, setIsImage] = useState(false);
const [isVideo, setIsVideo] = useState(false); // ← New

// Group Chat
const [groupIsImage, setGroupIsImage] = useState(false);
const [groupIsVideo, setGroupIsVideo] = useState(false); // ← New
```

#### Update `sendDirectMessage()`:

```jsx
const data = {
  senderId: auth.userId,
  receiverId: receiverId,
  message: message,
  isImage: isImage,
  isVideo: isVideo, // ← Gửi isVideo flag
};
socket.emit("sendMessage", data);
```

#### Update `sendGroupMsg()`:

```jsx
const data = {
  senderId: auth.userId,
  groupId: groupId,
  message: groupMessage,
  isImage: groupIsImage,
  isVideo: groupIsVideo, // ← Gửi isVideo flag
};
socket.emit("sendMessageToGroup", data);
```

#### Thêm UI checkboxes:

```jsx
<label>
  <input type="checkbox" checked={isImage} onChange={...} />
  🖼️ Is Image
</label>
<label>
  <input type="checkbox" checked={isVideo} onChange={...} />
  🎥 Is Video
</label>
```

**Logic**: Khi check video thì uncheck image và ngược lại (mutually exclusive)

#### Update log messages:

```jsx
const type = isVideo ? "🎥 Video" : isImage ? "🖼️ Image" : "💬 Text";
addSocketMessage(`📤 Sent to ${receiverId} (${type}): ${message}`);
```

---

## 📝 Cách sử dụng

### Tạo Video Post:

1. Mở **Post Tab**
2. Tìm section "🎥 Create Video Post (API #33)"
3. Nhập caption, prompt
4. **Quan trọng**: Upload video lên server khác trước để lấy URL
5. Paste video URL vào ô "Video URL (from external server)"
6. Click "Create Video Post"

### Gửi Video Message (1-1):

1. Mở **Communication Tab**
2. Connect socket (tự động)
3. Nhập Receiver User ID
4. Nhập URL của video vào "Message"
5. Check ☑️ "🎥 Is Video"
6. Click "Send Message"

### Gửi Video Message (Group):

1. Join room với Group ID
2. Nhập URL của video vào "Group Message"
3. Check ☑️ "🎥 Is Video"
4. Click "Send Group Message"

---

## ⚠️ Lưu ý

1. **Video URL**: Backend không tự upload video file, bạn phải upload video lên server khác (như AWS S3, Cloudinary, etc.) trước để lấy URL

2. **Message content**: Khi `isVideo = true`, field `message` chứa URL của video (tương tự như `isImage`)

3. **Mutual exclusive**: Không thể vừa là image vừa là video cùng lúc

4. **Backend validation**: Backend không validate URL format, UI chỉ gửi URL string

---

## ✅ Checklist đã hoàn thành

- [x] Kiểm tra Post service có support video post
- [x] Kiểm tra Communication service có support video message
- [x] Thêm UI create video post trong PostTab
- [x] Thêm function `createVideoPost()` gọi API
- [x] Thêm state `isVideo` cho 1-1 chat
- [x] Thêm state `groupIsVideo` cho group chat
- [x] Update `sendDirectMessage()` để gửi `isVideo`
- [x] Update `sendGroupMsg()` để gửi `isVideo`
- [x] Thêm checkbox UI cho video toggle
- [x] Thêm message type indicator trong log
- [x] Tạo documentation file

---

## 🎯 Kết luận

Backend của bạn đã implement đầy đủ các chức năng video. UI đã được update để support:

- ✅ Tạo video post qua API
- ✅ Gửi video message trong 1-1 chat
- ✅ Gửi video message trong group chat
- ✅ UI checkboxes để toggle video mode
- ✅ Visual indicators cho video messages

Tất cả đã sẵn sàng để test! 🚀
