#!/bin/bash

# ======================================
# 🧪 Image Gallery API Test Script
# ======================================
# Tests all 7 gallery endpoints with a specific user_id
# Usage: ./test_gallery_api.sh

set -e  # Exit on error

# Configuration
BASE_URL="http://localhost:9999/v1"
USER_ID="direct_test_1765694439"
TEST_IMAGE_URL="https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=800"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

echo "======================================"
echo "🧪 Testing Image Gallery APIs"
echo "======================================"
echo -e "${CYAN}User ID: ${USER_ID}${NC}"
echo -e "${CYAN}Base URL: ${BASE_URL}${NC}"
echo ""

# Helper function to print test header
print_test_header() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "${BLUE}$1${NC}"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# Helper function to check response
check_response() {
    local response=$1
    local test_name=$2
    
    # Extract code from response
    local code=$(echo "$response" | jq -r '.code' 2>/dev/null || echo "error")
    
    if [ "$code" = "1000" ]; then
        echo -e "${GREEN}✓ $test_name PASSED${NC}"
        ((TESTS_PASSED++))
        return 0
    else
        echo -e "${RED}✗ $test_name FAILED${NC}"
        echo -e "${RED}Response: $response${NC}"
        ((TESTS_FAILED++))
        return 1
    fi
}

# ======================================
# TEST 0: Check if server is running
# ======================================
print_test_header "TEST 0: Server Health Check"

echo "📡 Checking if server is running..."
if curl -s -f "${BASE_URL}/gallery/?user_id=${USER_ID}" > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Server is running${NC}"
else
    echo -e "${RED}✗ Server is not running or not responding${NC}"
    echo -e "${YELLOW}Please start the server: python manage.py runserver 0.0.0.0:9999${NC}"
    exit 1
fi

# ======================================
# TEST 1: List User's Images (Initial - Should be empty or have existing)
# ======================================
print_test_header "TEST 1: List User's Images (Initial State)"

echo "📤 GET ${BASE_URL}/gallery/?user_id=${USER_ID}"
RESPONSE=$(curl -s "${BASE_URL}/gallery/?user_id=${USER_ID}")
echo "$RESPONSE" | jq '.'

IMAGE_COUNT=$(echo "$RESPONSE" | jq '.result | length' 2>/dev/null || echo "0")
echo -e "${CYAN}Found ${IMAGE_COUNT} existing images${NC}"

if check_response "$RESPONSE" "List Images (Initial)"; then
    echo -e "${GREEN}Initial gallery state retrieved successfully${NC}"
fi

# ======================================
# TEST 2: Create Image Entry
# ======================================
print_test_header "TEST 2: Create Image Entry"

echo "📤 POST ${BASE_URL}/gallery/"
echo "Creating test image entry..."

CREATE_RESPONSE=$(curl -s -X POST "${BASE_URL}/gallery/" \
  -H "Content-Type: application/json" \
  -d "{
    \"user_id\": \"${USER_ID}\",
    \"image_url\": \"${TEST_IMAGE_URL}\",
    \"prompt\": \"Test image from gallery test script\",
    \"intent\": \"image_generation\",
    \"metadata\": {
      \"feature\": \"image_generation\",
      \"version\": \"1.0\",
      \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",
      \"task_id\": \"test_$(date +%s)\",
      \"aspect_ratio\": \"16:9\",
      \"processing_time\": 0.5
    }
  }")

echo "$CREATE_RESPONSE" | jq '.'

if check_response "$CREATE_RESPONSE" "Create Image Entry"; then
    # Extract image ID from response (try both 'image_id' and 'id' fields)
    IMAGE_ID=$(echo "$CREATE_RESPONSE" | jq -r '.result.image_id // .result.id')
    echo -e "${CYAN}Created Image ID: ${IMAGE_ID}${NC}"
    
    if [ "$IMAGE_ID" = "null" ] || [ -z "$IMAGE_ID" ]; then
        echo -e "${RED}Failed to get image ID from response${NC}"
        exit 1
    fi
else
    echo -e "${RED}Failed to create image entry${NC}"
    exit 1
fi

# ======================================
# TEST 3: List User's Images (After Create)
# ======================================
print_test_header "TEST 3: List User's Images (After Create)"

echo "📤 GET ${BASE_URL}/gallery/?user_id=${USER_ID}"
LIST_RESPONSE=$(curl -s "${BASE_URL}/gallery/?user_id=${USER_ID}")
echo "$LIST_RESPONSE" | jq '.'

NEW_IMAGE_COUNT=$(echo "$LIST_RESPONSE" | jq '.result | length' 2>/dev/null || echo "0")
echo -e "${CYAN}Now have ${NEW_IMAGE_COUNT} images (was ${IMAGE_COUNT})${NC}"

if check_response "$LIST_RESPONSE" "List Images (After Create)"; then
    # Verify the new image is in the list (check both 'image_id' and 'id' fields)
    FOUND_IMAGE=$(echo "$LIST_RESPONSE" | jq --arg id "$IMAGE_ID" '.result[] | select(.image_id == $id or .id == $id)')
    if [ -n "$FOUND_IMAGE" ]; then
        echo -e "${GREEN}✓ New image found in gallery list${NC}"
    else
        echo -e "${YELLOW}⚠ New image not found in gallery list (ID mismatch?)${NC}"
    fi
fi

# ======================================
# TEST 4: Get Single Image
# ======================================
print_test_header "TEST 4: Get Single Image"

echo "📤 GET ${BASE_URL}/gallery/${IMAGE_ID}"
GET_RESPONSE=$(curl -s "${BASE_URL}/gallery/${IMAGE_ID}")
echo "$GET_RESPONSE" | jq '.'

if check_response "$GET_RESPONSE" "Get Single Image"; then
    # Verify metadata structure
    HAS_FEATURE=$(echo "$GET_RESPONSE" | jq -r '.result.metadata.feature')
    HAS_VERSION=$(echo "$GET_RESPONSE" | jq -r '.result.metadata.version')
    HAS_TIMESTAMP=$(echo "$GET_RESPONSE" | jq -r '.result.metadata.timestamp')
    
    echo -e "${CYAN}Metadata validation:${NC}"
    echo "  - feature: $HAS_FEATURE"
    echo "  - version: $HAS_VERSION"
    echo "  - timestamp: $HAS_TIMESTAMP"
    
    if [ "$HAS_FEATURE" != "null" ] && [ "$HAS_VERSION" != "null" ]; then
        echo -e "${GREEN}✓ Metadata structure is correct${NC}"
    else
        echo -e "${YELLOW}⚠ Metadata structure is incomplete${NC}"
    fi
fi

# ======================================
# TEST 5: Soft Delete Image
# ======================================
print_test_header "TEST 5: Soft Delete Image"

echo "📤 DELETE ${BASE_URL}/gallery/${IMAGE_ID}"
DELETE_RESPONSE=$(curl -s -X DELETE "${BASE_URL}/gallery/${IMAGE_ID}")
echo "$DELETE_RESPONSE" | jq '.'

if check_response "$DELETE_RESPONSE" "Soft Delete Image"; then
    echo -e "${GREEN}Image soft deleted successfully${NC}"
fi

# ======================================
# TEST 6: List User's Images (After Delete)
# ======================================
print_test_header "TEST 6: List User's Images (After Soft Delete)"

echo "📤 GET ${BASE_URL}/gallery/?user_id=${USER_ID}"
LIST_AFTER_DELETE=$(curl -s "${BASE_URL}/gallery/?user_id=${USER_ID}")
echo "$LIST_AFTER_DELETE" | jq '.'

AFTER_DELETE_COUNT=$(echo "$LIST_AFTER_DELETE" | jq '.result | length' 2>/dev/null || echo "0")
echo -e "${CYAN}Now have ${AFTER_DELETE_COUNT} active images (was ${NEW_IMAGE_COUNT})${NC}"

if check_response "$LIST_AFTER_DELETE" "List Images (After Delete)"; then
    # Verify the image is NOT in the active list (check both 'image_id' and 'id' fields)
    FOUND_DELETED=$(echo "$LIST_AFTER_DELETE" | jq --arg id "$IMAGE_ID" '.result[] | select(.image_id == $id or .id == $id)')
    if [ -z "$FOUND_DELETED" ]; then
        echo -e "${GREEN}✓ Deleted image correctly removed from active gallery${NC}"
    else
        echo -e "${RED}✗ Deleted image still appears in active gallery${NC}"
    fi
fi

# ======================================
# TEST 7: List Deleted Images
# ======================================
print_test_header "TEST 7: List Deleted Images"

echo "📤 GET ${BASE_URL}/gallery/deleted?user_id=${USER_ID}"
DELETED_LIST=$(curl -s "${BASE_URL}/gallery/deleted?user_id=${USER_ID}")
echo "$DELETED_LIST" | jq '.'

if check_response "$DELETED_LIST" "List Deleted Images"; then
    # Verify the image IS in the deleted list (check both 'image_id' and 'id' fields)
    FOUND_IN_TRASH=$(echo "$DELETED_LIST" | jq --arg id "$IMAGE_ID" '.result[] | select(.image_id == $id or .id == $id)')
    if [ -n "$FOUND_IN_TRASH" ]; then
        echo -e "${GREEN}✓ Deleted image found in trash${NC}"
        
        # Show deleted_at timestamp
        DELETED_AT=$(echo "$FOUND_IN_TRASH" | jq -r '.deleted_at')
        echo -e "${CYAN}Deleted at: ${DELETED_AT}${NC}"
    else
        echo -e "${YELLOW}⚠ Deleted image not found in trash${NC}"
    fi
fi

# ======================================
# TEST 8: Restore Deleted Image
# ======================================
print_test_header "TEST 8: Restore Deleted Image"

echo "📤 POST ${BASE_URL}/gallery/${IMAGE_ID}/restore"
RESTORE_RESPONSE=$(curl -s -X POST "${BASE_URL}/gallery/${IMAGE_ID}/restore")
echo "$RESTORE_RESPONSE" | jq '.'

if check_response "$RESTORE_RESPONSE" "Restore Image"; then
    # Verify deleted_at is null
    DELETED_AT_AFTER=$(echo "$RESTORE_RESPONSE" | jq -r '.result.deleted_at')
    if [ "$DELETED_AT_AFTER" = "null" ]; then
        echo -e "${GREEN}✓ Image restored successfully (deleted_at = null)${NC}"
    else
        echo -e "${YELLOW}⚠ Image restored but deleted_at is not null${NC}"
    fi
fi

# ======================================
# TEST 9: List User's Images (After Restore)
# ======================================
print_test_header "TEST 9: List User's Images (After Restore)"

echo "📤 GET ${BASE_URL}/gallery/?user_id=${USER_ID}"
LIST_AFTER_RESTORE=$(curl -s "${BASE_URL}/gallery/?user_id=${USER_ID}")
echo "$LIST_AFTER_RESTORE" | jq '.'

AFTER_RESTORE_COUNT=$(echo "$LIST_AFTER_RESTORE" | jq '.result | length' 2>/dev/null || echo "0")
echo -e "${CYAN}Now have ${AFTER_RESTORE_COUNT} active images${NC}"

if check_response "$LIST_AFTER_RESTORE" "List Images (After Restore)"; then
    # Verify the image is back in the active list (check both 'image_id' and 'id' fields)
    FOUND_RESTORED=$(echo "$LIST_AFTER_RESTORE" | jq --arg id "$IMAGE_ID" '.result[] | select(.image_id == $id or .id == $id)')
    if [ -n "$FOUND_RESTORED" ]; then
        echo -e "${GREEN}✓ Restored image is back in active gallery${NC}"
    else
        echo -e "${RED}✗ Restored image not found in active gallery${NC}"
    fi
fi

# ======================================
# TEST 10: Permanent Delete (Cleanup)
# ======================================
print_test_header "TEST 10: Permanent Delete (Cleanup)"

echo -e "${YELLOW}⚠ This will permanently delete the test image${NC}"
echo "📤 DELETE ${BASE_URL}/gallery/${IMAGE_ID}/permanent"

PERMANENT_DELETE=$(curl -s -X DELETE "${BASE_URL}/gallery/${IMAGE_ID}/permanent")
echo "$PERMANENT_DELETE" | jq '.'

if check_response "$PERMANENT_DELETE" "Permanent Delete"; then
    echo -e "${GREEN}Test image permanently deleted (cleanup complete)${NC}"
fi

# ======================================
# TEST 11: Verify Permanent Delete
# ======================================
print_test_header "TEST 11: Verify Permanent Delete"

echo "📤 GET ${BASE_URL}/gallery/${IMAGE_ID}"
VERIFY_DELETE=$(curl -s "${BASE_URL}/gallery/${IMAGE_ID}")
echo "$VERIFY_DELETE" | jq '.'

# Check error code (should be 1004 for NOT_FOUND or 9999 for general error)
ERROR_CODE=$(echo "$VERIFY_DELETE" | jq -r '.code' 2>/dev/null || echo "null")

if [ "$ERROR_CODE" = "1004" ] || [ "$ERROR_CODE" = "9999" ]; then
    echo -e "${GREEN}✓ Image correctly returns 'not found' error (code: ${ERROR_CODE})${NC}"
    ((TESTS_PASSED++))
else
    echo -e "${RED}✗ Image still accessible after permanent delete (code: ${ERROR_CODE})${NC}"
    ((TESTS_FAILED++))
fi

# ======================================
# Test Summary
# ======================================
echo ""
echo "======================================"
echo "📊 Test Summary"
echo "======================================"
echo -e "${GREEN}Passed: ${TESTS_PASSED}${NC}"
echo -e "${RED}Failed: ${TESTS_FAILED}${NC}"
echo "Total: $((TESTS_PASSED + TESTS_FAILED))"
echo ""

if [ $TESTS_FAILED -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}❌ Some tests failed${NC}"
    exit 1
fi
