# 🧪 TEST REAL-TIME COMMENTS - HƯỚNG DẪN CHI TIẾT

## ✅ Yêu cầu trước khi test

1. **Comments Service đang chạy** (Port 8003)
2. **testUI đang chạy** (npm run dev)
3. **Socket.IO client v2.5.0** đã cài (đã có trong package.json)

## 📋 Các bước test Real-time

### Bước 1: Khởi động Comments Service

```powershell
cd comments
go run cmd/api/main.go
```

**Kiểm tra:** Thấy log `Server starting on :8003`

---

### Bước 2: Khởi động testUI

```powershell
cd testUI
npm run dev
```

**Kiểm tra:** Mở browser tại `http://localhost:5173`

---

### Bước 3: Mở 2 tabs browser (quan trọng!)

1. **Tab 1:** `http://localhost:5173` - Đại diện User A
2. **Tab 2:** `http://localhost:5173` - Đại diện User B

---

### Bước 4: Test Real-time trên CẢ 2 TABS

#### TRÊN TAB 1 (User A):

1. Vào tab **"Comments"**
2. Kiểm tra Socket Status: phải hiển thị **"✅ Connected"** màu xanh
3. Xem log box phải có: `✅ Connected to socket server (ID: xxx)`
4. Nhập Post ID: `test-post-123` (hoặc ID bất kỳ)
5. Click **"Join Room"**
6. Xem log box phải có: `✅ Joined room: test-post-123`

#### TRÊN TAB 2 (User B):

1. Vào tab **"Comments"**
2. Kiểm tra Socket Status: phải hiển thị **"✅ Connected"** (socket ID khác Tab 1)
3. Nhập Post ID: `test-post-123` (CÙNG POST ID với Tab 1)
4. Click **"Join Room"**
5. Xem log box phải có: `✅ Joined room: test-post-123`

---

### Bước 5: Tạo comment từ Tab 1

#### TRÊN TAB 1:

1. Scroll xuống phần **"➕ Create Comment"**
2. Điền thông tin:
   - Post ID: `test-post-123` (tự động điền)
   - User ID: `user-001` (tự động điền)
   - User Name: `Alice` (đổi thành Alice)
   - Content: `Hello from Alice!`
3. Click **"Create Comment & Broadcast"**

**Kết quả Tab 1:**
- Response box hiển thị: `"message": "Comment created successfully"`
- Log box có thêm: `📝 New comment: Hello from Alice! (by Alice)`

---

### Bước 6: Kiểm tra Tab 2 nhận real-time

#### TRÊN TAB 2 (KHÔNG LÀM GÌ CẢ):

**Kết quả tự động:**
- Log box xuất hiện: `📝 New comment: Hello from Alice! (by Alice)`

✅ **THÀNH CÔNG!** Tab 2 nhận được comment từ Tab 1 mà không cần refresh!

---

### Bước 7: Test ngược lại - Tab 2 tạo comment

#### TRÊN TAB 2:

1. Scroll xuống phần **"➕ Create Comment"**
2. Điền thông tin:
   - User Name: `Bob`
   - Content: `Hi Alice! I'm Bob!`
3. Click **"Create Comment & Broadcast"**

**Kết quả Tab 2:**
- Response box: `"message": "Comment created successfully"`
- Log box: `📝 New comment: Hi Alice! I'm Bob! (by Bob)`

**Kết quả Tab 1 (tự động):**
- Log box: `📝 New comment: Hi Alice! I'm Bob! (by Bob)`

✅ **THÀNH CÔNG!** Tab 1 nhận được comment từ Tab 2!

---

## 🎯 Test các chức năng khác

### Test Update Comment (Real-time)

1. Lấy Comment ID từ response khi tạo comment
2. Ở 1 tab, nhập Comment ID và nội dung mới
3. Click **"Update"**
4. Tab kia sẽ nhận event: `✏️ Comment updated: [new content]`

### Test Delete Comment (Real-time)

1. Lấy Comment ID
2. Ở 1 tab, nhập Comment ID
3. Click **"Delete Comment"**
4. Tab kia sẽ nhận event: `🗑️ Comment deleted: [comment_id]`

---

## 🔍 Kiểm tra Backend logs

### Logs bình thường khi hoạt động đúng:

```
✅ Socket connected: [socket_id_1]
User [socket_id_1] joined room: test-post-123
✅ Socket connected: [socket_id_2]
User [socket_id_2] joined room: test-post-123
```

Khi tạo comment, sẽ thấy log broadcast:
```
Broadcasting to room test-post-123: new_comment
```

---

## ❌ Xử lý lỗi thường gặp

### Lỗi 1: Socket không kết nối

**Triệu chứng:** Status hiển thị "❌ Disconnected" màu đỏ

**Giải pháp:**
1. Kiểm tra Comments service có chạy không
2. Check port 8003 có bị chiếm không: `netstat -ano | findstr :8003`
3. Restart Comments service

---

### Lỗi 2: Join room nhưng không nhận được event

**Triệu chứng:** Tạo comment ở tab 1, tab 2 không có gì

**Giải pháp:**
1. Kiểm tra CẢ 2 TAB đều đã join cùng Post ID
2. Xem log box có dòng `✅ Joined room: [postId]` không
3. Kiểm tra Post ID của comment khớp với room đã join

---

### Lỗi 3: "Transport unknown" error

**Triệu chứng:** Console browser có lỗi transport

**Giải pháp:**
```bash
cd testUI
npm uninstall socket.io-client
npm install socket.io-client@2.5.0
```

---

### Lỗi 4: Nhận duplicate events

**Triệu chứng:** Mỗi comment nhận 2-3 lần

**Giải pháp:**
1. Đã fix bằng `useRef` pattern
2. Đã disable React.StrictMode
3. Nếu vẫn lỗi, hard refresh: `Ctrl + Shift + R`

---

## ✅ Checklist test thành công

- [ ] Socket connected trên cả 2 tabs
- [ ] Cả 2 tabs đều join được room
- [ ] Tab 1 tạo comment → Tab 2 nhận được
- [ ] Tab 2 tạo comment → Tab 1 nhận được
- [ ] Update comment → tab kia nhận event
- [ ] Delete comment → tab kia nhận event
- [ ] Log box hiển thị đầy đủ events
- [ ] Không có lỗi trong console

---

## 📊 Kiến trúc Real-time Flow

```
┌─────────────┐                ┌──────────────┐                ┌─────────────┐
│   Tab 1     │                │   Backend    │                │   Tab 2     │
│  (Alice)    │                │   (Go)       │                │   (Bob)     │
└─────────────┘                └──────────────┘                └─────────────┘
       │                              │                              │
       │ 1. socket.emit('join',       │                              │
       │    'test-post-123')          │                              │
       ├─────────────────────────────>│                              │
       │ ✅ joined: test-post-123     │                              │
       │<─────────────────────────────┤                              │
       │                              │                              │
       │                              │  2. socket.emit('join',      │
       │                              │     'test-post-123')         │
       │                              │<─────────────────────────────┤
       │                              │  ✅ joined: test-post-123    │
       │                              │─────────────────────────────>│
       │                              │                              │
       │ 3. POST /comments            │                              │
       │    {content: "Hello!"}       │                              │
       ├─────────────────────────────>│                              │
       │                              │ 4. Save to MongoDB           │
       │                              │ 5. BroadcastToRoom()         │
       │                              │    "new_comment"             │
       │ 📝 new_comment event         │  📝 new_comment event        │
       │<─────────────────────────────┼─────────────────────────────>│
       │                              │                              │
       │                              │                              │
       │                              │  6. POST /comments           │
       │                              │     {content: "Hi Alice!"}   │
       │                              │<─────────────────────────────┤
       │                              │ 7. Save to MongoDB           │
       │                              │ 8. BroadcastToRoom()         │
       │ 📝 new_comment event         │  📝 new_comment event        │
       │<─────────────────────────────┼─────────────────────────────>│
       │ "Hi Alice!"                  │                  "Hi Alice!" │
```

---

## 🎉 Kết luận

Nếu test thành công tất cả các bước trên, **Real-time Comments đã hoạt động 100%!**

Backend Go tự động broadcast sau khi:
- ✅ CREATE comment → event `new_comment`
- ✅ UPDATE comment → event `update_comment`
- ✅ DELETE comment → event `delete_comment`

Không cần thêm code gì nữa!
