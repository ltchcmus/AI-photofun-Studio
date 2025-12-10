# Group API Fixes - Communication Service

## Issues Fixed

### 1. **GroupController - Removed Invalid Annotations**

**Problem:** Controller had `@Builder` and `@Data` annotations which are meant for entities, not controllers

```java
// ❌ Before
@Builder
@Data
public class GroupController {
```

```java
// ✅ After
public class GroupController {
```

**Impact:** Controllers should use `@RestController` and `@RequiredArgsConstructor` only

---

### 2. **pleaseAddGroup - Fixed Parameter Order**

**Problem:** userId and requestId were swapped when calling identityClient

```java
// ❌ Before
String requestId = SecurityContextHolder.getContext().getAuthentication().getName();
var response = identityClient.requestJoinGroup(requestId, adminId, groupId);
```

```java
// ✅ After
String userId = SecurityContextHolder.getContext().getAuthentication().getName();
// User (userId) sends request to admin (adminId) to join group
var response = identityClient.requestJoinGroup(adminId, userId, groupId);
```

**Impact:** Requests are now properly sent to the group admin

---

### 3. **modifyRequestStatus - Fixed Accept Parameter Type**

**Problem:** Parameter was `int` but frontend sends boolean string "true"/"false"

```java
// ❌ Before
modifyRequestStatus(@RequestParam("accept") int status)
groupService.modifyRequestJoin(requestId, groupId, status);
if (accept > 0) { ... }
```

```java
// ✅ After
modifyRequestStatus(@RequestParam("accept") boolean accept)
groupService.modifyRequestJoin(requestId, groupId, accept);
if (accept) { ... }
```

**Impact:** Accept/deny requests now work correctly with boolean values

---

### 4. **modifyRequestJoin - Fixed Logic and Added Safety Check**

**Problem:** Group was saved before checking identity service response

```java
// ❌ Before
if (accept > 0) {
  group.getMemberIds().add(requestId);
  var response = identityClient.addGroup(requestId, groupId);
  if (response.getCode() != 1000) {
    throw new AppException(ErrorCode.FAILED_TO_ADD_GROUP);
  }
  groupRepository.save(group); // Too late!
}
```

```java
// ✅ After
if (accept) {
  // Check for duplicates
  if (!group.getMemberIds().contains(requestId)) {
    group.getMemberIds().add(requestId);
    groupRepository.save(group);
  }

  var response = identityClient.addGroup(requestId, groupId);
  if (response.getCode() != 1000) {
    throw new AppException(ErrorCode.FAILED_TO_ADD_GROUP);
  }
}

// Delete request regardless of accept/deny
identityClient.deleteRequestJoinGroup(userId, requestId, groupId);
```

**Impact:**

- Prevents duplicate members
- Saves to DB before external call
- Deletes request for both accept and deny

---

### 5. **createGroup - Added Validation**

**Problem:** No validation for group name

```java
// ❌ Before
Group group = Group.builder()
  .name(groupName)
  .image(imageUrl)
  ...
```

```java
// ✅ After
if (groupName == null || groupName.trim().isEmpty()) {
  throw new AppException(ErrorCode.CANT_BE_BLANK);
}

Group group = Group.builder()
  .name(groupName.trim())
  .image(imageUrl)
  ...
```

**Impact:** Prevents creating groups with empty names

---

### 6. **Added Missing Features**

#### 6.1 Leave Group API

```java
@DeleteMapping("/{groupId}/leave")
HttpResponse<Void> leaveGroup(@PathVariable("groupId") String groupId)
```

**Logic:**

- User can leave group (if not admin)
- Admin cannot leave their own group
- Removes user from memberIds
- Removes group from user's groupsJoined

#### 6.2 Remove Member API

```java
@DeleteMapping("/{groupId}/members/{memberId}")
HttpResponse<Void> removeMember(@PathVariable("groupId") String groupId,
                                @PathVariable("memberId") String memberId)
```

**Logic:**

- Only admin can remove members
- Cannot remove admin
- Removes member from memberIds
- Removes group from member's groupsJoined

---

### 7. **Added New Error Codes**

```java
ADMIN_CANNOT_LEAVE_GROUP(2010, "Admin cannot leave their own group, please delete the group instead")
FAILED_TO_REMOVE_GROUP(2011, "Failed to remove group from user")
CANNOT_REMOVE_ADMIN(2012, "Cannot remove group admin")
```

---

### 8. **Added Identity Client Method**

```java
@PatchMapping("/users/remove-group")
HttpResponse<Void> removeGroup(@RequestParam("userId") String userId,
                               @RequestParam("groupId") String groupId);
```

---

## Complete API List

### Group Management

| Method | Endpoint                  | Description                | Auth                  |
| ------ | ------------------------- | -------------------------- | --------------------- |
| GET    | `/groups/all`             | Get all groups (paginated) | ✅                    |
| POST   | `/groups/create`          | Create new group           | ✅ Premium            |
| GET    | `/groups/{groupId}`       | Get group detail           | ✅                    |
| PATCH  | `/groups/{groupId}`       | Update group               | ✅ Admin              |
| DELETE | `/groups/{groupId}/leave` | Leave group                | ✅ Member (not admin) |

### Group Avatar

| Method | Endpoint                      | Description         | Auth     |
| ------ | ----------------------------- | ------------------- | -------- |
| POST   | `/groups/{groupId}/avatar`    | Upload group avatar | ✅ Admin |
| GET    | `/groups/get-image/{groupId}` | Get group image URL | Public   |

### Group Membership

| Method | Endpoint                                  | Description              | Auth     |
| ------ | ----------------------------------------- | ------------------------ | -------- |
| POST   | `/groups/request-join-group?groupId={id}` | Request to join group    | ✅       |
| PATCH  | `/groups/modify-request-status`           | Accept/deny join request | ✅ Admin |
| DELETE | `/groups/{groupId}/members/{memberId}`    | Remove member from group | ✅ Admin |

### Group Messages

| Method | Endpoint                     | Description                    | Auth      |
| ------ | ---------------------------- | ------------------------------ | --------- |
| GET    | `/groups/{groupId}/messages` | Get group messages (paginated) | ✅ Member |

---

## Testing Guide

### 1. Create Group (Premium Required)

```http
POST /communications/groups/create?groupName=My%20Group&imageUrl=https://example.com/img.jpg
Authorization: Bearer {token}
```

**Expected:**

```json
{
  "code": 1000,
  "message": "Create group successfully",
  "result": {
    "groupId": "abc123",
    "name": "My Group",
    "image": "https://example.com/img.jpg",
    "adminId": "user123",
    "memberCount": 1
  }
}
```

### 2. Request to Join Group

```http
POST /communications/groups/request-join-group?groupId=abc123
Authorization: Bearer {token}
```

**Expected:**

```json
{
  "code": 1000,
  "message": "Request to join group sent successfully"
}
```

### 3. Accept Request (Admin Only)

```http
PATCH /communications/groups/modify-request-status?requestId=user456&groupId=abc123&accept=true
Authorization: Bearer {admin_token}
```

**Expected:**

```json
{
  "code": 1000,
  "message": "Modify request status successfully"
}
```

### 4. Deny Request (Admin Only)

```http
PATCH /communications/groups/modify-request-status?requestId=user456&groupId=abc123&accept=false
Authorization: Bearer {admin_token}
```

### 5. Leave Group (Member, not admin)

```http
DELETE /communications/groups/abc123/leave
Authorization: Bearer {member_token}
```

**Expected:**

```json
{
  "code": 1000,
  "message": "Left group successfully"
}
```

### 6. Remove Member (Admin Only)

```http
DELETE /communications/groups/abc123/members/user456
Authorization: Bearer {admin_token}
```

**Expected:**

```json
{
  "code": 1000,
  "message": "Member removed successfully"
}
```

---

## Error Scenarios

### User Not Premium

```http
POST /communications/groups/create?groupName=Test
Authorization: Bearer {non_premium_token}
```

**Response:**

```json
{
  "code": 2008,
  "message": "Only premium users can create groups"
}
```

### Admin Tries to Leave

```http
DELETE /communications/groups/abc123/leave
Authorization: Bearer {admin_token}
```

**Response:**

```json
{
  "code": 2010,
  "message": "Admin cannot leave their own group, please delete the group instead"
}
```

### Non-Admin Tries to Remove Member

```http
DELETE /communications/groups/abc123/members/user456
Authorization: Bearer {non_admin_token}
```

**Response:**

```json
{
  "code": 1501,
  "message": "Unauthorized access"
}
```

### Try to Remove Admin

```http
DELETE /communications/groups/abc123/members/{admin_id}
Authorization: Bearer {admin_token}
```

**Response:**

```json
{
  "code": 2012,
  "message": "Cannot remove group admin"
}
```

---

## Database Schema

### Group Entity (MongoDB)

```json
{
  "groupId": "string (auto-generated)",
  "name": "string (required, trimmed)",
  "image": "string (optional URL)",
  "description": "string (optional)",
  "adminId": "string (userId of creator)",
  "memberIds": ["userId1", "userId2", ...],
  "createdAt": "Instant (auto)",
  "updatedAt": "Instant (auto)"
}
```

---

## Integration Points

### Identity Service Required Endpoints

1. **Check Premium Status**
   - `GET /users/check-premium?userId={id}`
2. **Request Join Group**
   - `PATCH /users/request-join-group?userId={adminId}&requestId={userId}&groupId={id}`
3. **Delete Request**
   - `DELETE /users/delete-request-join-group?userId={adminId}&requestId={userId}&groupId={id}`
4. **Add Group to User**
   - `PATCH /users/add-group?userId={id}&groupId={id}`
5. **Remove Group from User**
   - `PATCH /users/remove-group?userId={id}&groupId={id}`

---

## Summary of Changes

✅ **Fixed Issues:**

- Removed invalid controller annotations
- Fixed parameter order in pleaseAddGroup
- Changed accept parameter from int to boolean
- Added duplicate check in modifyRequestJoin
- Added group name validation

✅ **New Features:**

- Leave group API
- Remove member API
- Better error handling
- Safety checks

✅ **Error Codes:**

- Added 3 new error codes for group operations

✅ **Code Quality:**

- Proper transaction handling with ReentrantLock
- Rollback on failure (createGroup)
- Consistent error responses
