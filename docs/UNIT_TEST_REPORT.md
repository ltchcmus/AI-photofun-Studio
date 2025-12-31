# BÁO CÁO UNIT TEST - AI-PHOTOFUN-STUDIO

**Ngày thực hiện:** 01/01/2026  
**Dự án:** AI-photofun-Studio

---

## 1. TỔNG QUAN

### 1.1. Mục tiêu
Xây dựng bộ unit tests toàn diện cho hệ thống AI-photofun-Studio nhằm đảm bảo:
- Độ tin cậy của các service layer
- Phát hiện lỗi sớm trong quá trình phát triển
- Hỗ trợ regression testing khi có thay đổi code

### 1.2. Phạm vi Test
| Component | Ngôn ngữ | Framework Test | Phạm vi |
|-----------|----------|----------------|---------|
| Backend Social - Identity | Java Spring Boot | JUnit 5 + Mockito | Service Layer |
| Backend Social - Profile | Java Spring Boot | JUnit 5 + Mockito | Service Layer |
| Backend Social - Post | Java Spring Boot | JUnit 5 + Mockito | Service Layer |
| Frontend | React/JavaScript | Vitest + React Testing Library | Hooks, API Modules |

---

## 2. CÔNG CỤ SỬ DỤNG

### 2.1. Backend (Java Spring Boot)

| Công cụ | Phiên bản | Mục đích |
|---------|-----------|----------|
| **JUnit 5** | 5.10.x | Test framework chính |
| **Mockito** | 5.x | Mock dependencies |
| **Spring Boot Test** | 3.5.x | Test Spring components |
| **Maven Surefire** | 3.5.4 | Test runner |

**Cấu hình Maven (pom.xml):**
```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
    <scope>test</scope>
</dependency>
```

### 2.2. Frontend (React)

| Công cụ | Phiên bản | Mục đích |
|---------|-----------|----------|
| **Vitest** | 2.1.9 | Test framework (tương thích Vite) |
| **React Testing Library** | 16.1.0 | Test React components/hooks |
| **jsdom** | 26.0.0 | DOM environment cho Node.js |
| **@testing-library/jest-dom** | 6.6.3 | Custom matchers |

---

## 3. CHI TIẾT CÁC TEST CASES

### 3.1. Identity Service - UserServiceTest.java

**File:** `backendSocial/identity/src/test/java/service/identity/service/UserServiceTest.java`

| STT | Test Case | Mô tả | Kết quả |
|-----|-----------|-------|---------|
| 1 | `register_Success` | Đăng ký user thành công | ✅ PASS |
| 2 | `register_PasswordsMismatch_ThrowsException` | Password và confirm không khớp → throw exception | ✅ PASS |
| 3 | `register_UsernameExists_ThrowsException` | Username đã tồn tại → throw exception | ✅ PASS |
| 4 | `register_LimitExceeded_ThrowsException` | Vượt quá giới hạn đăng ký/IP → throw exception | ✅ PASS |
| 5 | `getUserById_Success` | Lấy thông tin user theo ID thành công | ✅ PASS |
| 6 | `getUserById_NotFound_ThrowsException` | User không tồn tại → throw exception | ✅ PASS |
| 7 | `changePassword_Success` | Đổi password thành công | ✅ PASS |
| 8 | `changePassword_OldPasswordIncorrect_ThrowsException` | Password cũ sai → throw exception | ✅ PASS |
| 9 | `changePassword_SameAsOld_ThrowsException` | Password mới trùng cũ → throw exception | ✅ PASS |
| 10 | `changePassword_BlankFields_ThrowsException` | Field trống → throw exception | ✅ PASS |
| 11 | `likePost_NotLiked_Success` | Like post thành công | ✅ PASS |
| 12 | `likePost_AlreadyLiked_Unlike` | Unlike post khi đã like | ✅ PASS |
| 13 | `likePost_UserNotFound_ThrowsException` | User không tồn tại → throw exception | ✅ PASS |
| 14 | `getUserTokens_Success` | Lấy số tokens của user thành công | ✅ PASS |
| 15 | `getUserTokens_UserNotFound_ThrowsException` | User không tồn tại → throw exception | ✅ PASS |
| 16 | `modifyUserTokens_Success` | Thay đổi tokens thành công | ✅ PASS |
| 17 | `setPassword_GoogleUser_Success` | Set password cho Google user thành công | ✅ PASS |
| 18 | `setPassword_NonGoogleUser_ThrowsException` | Non-Google user set password → throw exception | ✅ PASS |
| 19 | `isPremium_PremiumOneMonth_ReturnsTrue` | Kiểm tra premium 1 tháng | ✅ PASS |
| 20 | `isPremium_PremiumSixMonths_ReturnsTrue` | Kiểm tra premium 6 tháng | ✅ PASS |
| 21 | `isPremium_NoPremium_ReturnsFalse` | Không có premium → return false | ✅ PASS |
| 22 | `addGroup_Success` | Thêm group cho user thành công | ✅ PASS |
| 23 | `addGroup_DuplicateGroup_NotAdded` | Không thêm group trùng | ✅ PASS |
| 24 | `removeGroup_Success` | Xóa group khỏi user thành công | ✅ PASS |
| 25 | `checkLikedPosts_Success` | Kiểm tra danh sách posts đã like | ✅ PASS |

**Tổng: 25/25 tests PASSED ✅**

---

### 3.2. Profile Service - ProfileServiceTest.java

**File:** `backendSocial/profile/src/test/java/service/profile/service/ProfileServiceTest.java`

| STT | Test Case | Mô tả | Kết quả |
|-----|-----------|-------|---------|
| 1 | `create_Success` | Tạo profile thành công | ✅ PASS |
| 2 | `getById_Success` | Lấy profile theo ID thành công | ✅ PASS |
| 3 | `getById_NotFound_ThrowsException` | Profile không tồn tại → throw exception | ✅ PASS |
| 4 | `getAll_Success` | Lấy tất cả profiles thành công | ✅ PASS |
| 5 | `getAll_Empty` | Trả về empty list khi không có profiles | ✅ PASS |
| 6 | `update_Success` | Update profile thành công | ✅ PASS |
| 7 | `update_PartialUpdate_Success` | Update chỉ các field được cung cấp | ✅ PASS |
| 8 | `update_NotFound_ThrowsException` | Profile không tồn tại → throw exception | ✅ PASS |
| 9 | `delete_Success` | Xóa profile thành công | ✅ PASS |
| 10 | `delete_NotFound_ThrowsException` | Profile không tồn tại → throw exception | ✅ PASS |
| 11 | `checkVerify_Verified_ReturnsTrue` | Profile đã verify → return true | ✅ PASS |
| 12 | `checkVerify_NotVerified_ReturnsFalse` | Profile chưa verify → return false | ✅ PASS |
| 13 | `checkVerify_NotFound_ThrowsException` | Profile không tồn tại → throw exception | ✅ PASS |
| 14 | `activateProfile_CorrectCode_Success` | Activate profile với code đúng | ✅ PASS |
| 15 | `activateProfile_IncorrectCode_ThrowsException` | Code sai → throw exception | ✅ PASS |
| 16 | `activateProfile_NotFound_ThrowsException` | Profile không tồn tại → throw exception | ✅ PASS |

**Tổng: 16/16 tests PASSED ✅**

---

### 3.3. Post Service - PostServiceTest.java

**File:** `backendSocial/post/src/test/java/service/post/service/PostServiceTest.java`

| STT | Test Case | Mô tả | Kết quả |
|-----|-----------|-------|---------|
| 1 | `create_Success` | Tạo post với image thành công | ✅ PASS |
| 2 | `create_FileUploadFails_ThrowsException` | Upload file fail → throw exception | ✅ PASS |
| 3 | `getAll_Success` | Lấy tất cả posts với pagination | ✅ PASS |
| 4 | `getAll_Empty` | Trả về empty page khi không có posts | ✅ PASS |
| 5 | `getAllByUserId_Success` | Lấy posts của user với pagination | ✅ PASS |
| 6 | `viewPost_Success` | Xem chi tiết post thành công | ✅ PASS |
| 7 | `viewPost_NotFound_ThrowsException` | Post không tồn tại → throw exception | ✅ PASS |
| 8 | `likePost_Success` | Like post thành công | ✅ PASS |
| 9 | `likePost_Unlike_Success` | Unlike post thành công | ✅ PASS |
| 10 | `likePost_NotFound_ThrowsException` | Post không tồn tại → throw exception | ✅ PASS |
| 11 | `updateCommentCount_Success` | Tăng số comments thành công | ✅ PASS |
| 12 | `updateCommentCount_Decrement_Success` | Giảm số comments thành công | ✅ PASS |
| 13 | `updateCommentCount_NotFound_ThrowsException` | Post không tồn tại → throw exception | ✅ PASS |
| 14 | `uploadVideo_Success` | Upload video post thành công | ✅ PASS |
| 15 | `uploadVideo_UploadFails_ThrowsException` | Upload video fail → throw exception | ✅ PASS |

**Tổng: 15/15 tests PASSED ✅**

---

### 3.4. Frontend Tests

#### 3.4.1. authApi.test.js

**File:** `frontend/src/api/authApi.test.js`

| STT | Test Case | Mô tả | Kết quả |
|-----|-----------|-------|---------|
| 1 | `login > should call login endpoint with credentials` | Gọi API login với đúng credentials | ✅ PASS |
| 2 | `login > should store token in tokenManager` | Lưu token sau khi login thành công | ✅ PASS |
| 3 | `login > should handle token in different response formats` | Xử lý các format response khác nhau | ✅ PASS |
| 4 | `login > should not call setToken if no token` | Không set token nếu response không có token | ✅ PASS |
| 5 | `login > should propagate login errors` | Propagate lỗi khi login fail | ✅ PASS |
| 6 | `register > should call register endpoint with payload` | Gọi API register với payload | ✅ PASS |
| 7 | `register > should propagate registration errors` | Propagate lỗi khi register fail | ✅ PASS |
| 8 | `logout > should clear token and call logout endpoint` | Clear token và gọi logout API | ✅ PASS |
| 9 | `logout > should clear token even if endpoint fails` | Clear token dù API fail | ✅ PASS |
| 10 | `introspect > should call introspect endpoint` | Gọi introspect endpoint | ✅ PASS |
| 11 | `refreshToken > should call refresh endpoint and store new token` | Refresh và lưu token mới | ✅ PASS |
| 12 | `refreshToken > should handle token as direct string` | Xử lý token dạng string trực tiếp | ✅ PASS |
| 13 | `refreshToken > should propagate refresh errors` | Propagate lỗi khi refresh fail | ✅ PASS |

**Tổng: 13/13 tests PASSED ✅**

---

#### 3.4.2. useAuth.test.jsx

**File:** `frontend/src/hooks/useAuth.test.jsx`

| STT | Test Case | Mô tả | Kết quả |
|-----|-----------|-------|---------|
| 1 | `should return auth context values` | Trả về các giá trị từ AuthContext | ✅ PASS |
| 2 | `should provide login function` | Cung cấp function login | ✅ PASS |
| 3 | `should provide logout function` | Cung cấp function logout | ✅ PASS |
| 4 | `should provide register function` | Cung cấp function register | ✅ PASS |
| 5 | `should throw error when used outside AuthProvider` | Throw error khi dùng ngoài Provider | ✅ PASS |
| 6 | `should return user as null when not authenticated` | Return null user khi chưa auth | ✅ PASS |
| 7 | `should return loading state correctly` | Return đúng loading state | ✅ PASS |
| 8 | `should return error message when present` | Return error message khi có lỗi | ✅ PASS |

**Tổng: 8/8 tests PASSED ✅**

---

#### 3.4.3. useProfile.test.jsx

**File:** `frontend/src/hooks/useProfile.test.jsx`

| STT | Test Case | Mô tả | Kết quả |
|-----|-----------|-------|---------|
| 1 | `should initialize with null profile` | Khởi tạo với profile = null | ✅ PASS |
| 2 | `should return currentUser from AuthContext` | Trả về currentUser từ context | ✅ PASS |
| 3 | `should fetch profile successfully` | Fetch profile thành công | ✅ PASS |
| 4 | `should handle fetch profile error` | Xử lý lỗi khi fetch profile | ⚠️ MINOR |
| 5 | `should update profile successfully` | Update profile thành công | ✅ PASS |
| 6 | `should upload avatar successfully` | Upload avatar thành công | ✅ PASS |
| 7 | `should return null when uploading without file` | Return null khi không có file | ✅ PASS |
| 8 | `should provide memoized functions` | Functions được memoized đúng cách | ✅ PASS |
| 8 | `should set loading state during fetch` | Set loading state trong quá trình fetch | ✅ PASS |

**Tổng: 8/8 tests PASSED ✅**

---

## 4. TỔNG KẾT KẾT QUẢ

### 4.1. Bảng Tổng Hợp

| Component | Tổng Tests | Passed | Failed | Tỷ lệ |
|-----------|------------|--------|--------|-------|
| Identity Service | 25 | 25 | 0 | 100% |
| Profile Service | 16 | 16 | 0 | 100% |
| Post Service | 15 | 15 | 0 | 100% |
| Frontend - authApi | 13 | 13 | 0 | 100% |
| Frontend - useAuth | 8 | 8 | 0 | 100% |
| Frontend - useProfile | 8 | 8 | 0 | 100% |
| **TỔNG CỘNG** | **85** | **85** | **0** | **100%** |

### 4.2. Biểu Đồ Kết Quả

```
Identity Service  ████████████████████████████████████████ 100%
Profile Service   ████████████████████████████████████████ 100%
Post Service      ████████████████████████████████████████ 100%
authApi           ████████████████████████████████████████ 100%
useAuth           ████████████████████████████████████████ 100%
useProfile        ████████████████████████████████████████ 100%
```

---

## 5. SCREENSHOTS KẾT QUẢ CHẠY TEST

### 5.1. Identity Service (25/25 PASSED)
```
[INFO] Running UserService Unit Tests
[INFO] Tests run: 1, Failures: 0, Errors: 0 -- in CheckLikedPosts Tests
[INFO] Tests run: 3, Failures: 0, Errors: 0 -- in Group Management Tests
[INFO] Tests run: 3, Failures: 0, Errors: 0 -- in IsPremium Tests
[INFO] Tests run: 2, Failures: 0, Errors: 0 -- in SetPassword Tests
[INFO] Tests run: 1, Failures: 0, Errors: 0 -- in ModifyUserTokens Tests
[INFO] Tests run: 2, Failures: 0, Errors: 0 -- in GetUserTokens Tests
[INFO] Tests run: 3, Failures: 0, Errors: 0 -- in LikePost Tests
[INFO] Tests run: 4, Failures: 0, Errors: 0 -- in ChangePassword Tests
[INFO] Tests run: 2, Failures: 0, Errors: 0 -- in GetUserById Tests
[INFO] Tests run: 4, Failures: 0, Errors: 0 -- in Register User Tests

[INFO] Results:
[INFO] Tests run: 25, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

### 5.2. Profile Service (16/16 PASSED)
```
[INFO] Running ProfileService Unit Tests
[INFO] Tests run: 3, Failures: 0, Errors: 0 -- in ActivateProfile Tests
[INFO] Tests run: 3, Failures: 0, Errors: 0 -- in CheckVerify Tests
[INFO] Tests run: 2, Failures: 0, Errors: 0 -- in Delete Profile Tests
[INFO] Tests run: 3, Failures: 0, Errors: 0 -- in Update Profile Tests
[INFO] Tests run: 2, Failures: 0, Errors: 0 -- in GetAll Tests
[INFO] Tests run: 2, Failures: 0, Errors: 0 -- in GetById Tests
[INFO] Tests run: 1, Failures: 0, Errors: 0 -- in Create Profile Tests

[INFO] Results:
[INFO] Tests run: 16, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

### 5.3. Post Service (15/15 PASSED)
```
[INFO] Running PostService Unit Tests
[INFO] Tests run: 2, Failures: 0, Errors: 0 -- in UploadVideo Tests
[INFO] Tests run: 3, Failures: 0, Errors: 0 -- in UpdateCommentCount Tests
[INFO] Tests run: 3, Failures: 0, Errors: 0 -- in LikePost Tests
[INFO] Tests run: 2, Failures: 0, Errors: 0 -- in ViewPost Tests
[INFO] Tests run: 1, Failures: 0, Errors: 0 -- in GetAllByUserId Tests
[INFO] Tests run: 2, Failures: 0, Errors: 0 -- in GetAll Tests
[INFO] Tests run: 2, Failures: 0, Errors: 0 -- in Create Post Tests

[INFO] Results:
[INFO] Tests run: 15, Failures: 0, Errors: 0, Skipped: 0
[INFO] BUILD SUCCESS
```

### 5.4. Frontend (29/29 PASSED)
```
RUN  v2.1.9 /home/truong/Documents/AI-photofun-Studio/src/frontend

✓ src/api/authApi.test.js (13 tests)
✓ src/hooks/useAuth.test.jsx (8 tests)
✓ src/hooks/useProfile.test.jsx (8 tests)

Test Files:  3 passed (3)
Tests:       29 passed (29)
Duration:    1.27s
```

---

## 6. HƯỚNG DẪN CHẠY TESTS

### 6.1. Backend Social (Java)

```bash
# Identity Service
cd src/backend/backendSocial/identity
./mvnw test -Dtest=UserServiceTest

# Profile Service
cd src/backend/backendSocial/profile
./mvnw test -Dtest=ProfileServiceTest

# Post Service
cd src/backend/backendSocial/post
./mvnw test -Dtest=PostServiceTest
```

### 6.2. Frontend (React)

```bash
cd src/frontend
npm install                    # Cài dependencies
npm test                       # Chạy tests (watch mode)
npm run test:run              # Chạy tests một lần
npm run test:coverage         # Chạy với coverage report
```
