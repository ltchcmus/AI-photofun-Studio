#!/bin/bash

# Test RBAC for Video Features
# This script tests role-based access control for prompt-to-video and image-to-video

echo "🔐 Testing Role-Based Access Control for Video Features"
echo "=========================================================="
echo ""

# Configuration
BASE_URL="http://localhost:9999"
USER_ID="8cf89cd2-28a3-4bce-b538-cb361d030c04"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "Step 1: Get your JWT token from frontend"
echo "=========================================="
echo ""
echo "1. Login to the frontend (http://localhost:5173)"
echo "2. Open DevTools > Network tab"
echo "3. Make any API request"
echo "4. Copy the Authorization header value"
echo ""
read -p "Enter your JWT token (with or without 'Bearer '): " TOKEN
echo ""

# Remove "Bearer " prefix if present
TOKEN=$(echo "$TOKEN" | sed 's/^Bearer //')

# Test token decode
echo "Step 2: Decode and analyze JWT token"
echo "=========================================="
python3 test_jwt_token.py "$TOKEN"
echo ""
read -p "Press Enter to continue with API tests..."
echo ""

# Test Prompt to Video
echo "Step 3: Test Prompt-to-Video API"
echo "=========================================="
echo ""
echo "Testing: POST /v1/features/prompt-to-video/"
echo ""

response=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST "$BASE_URL/v1/features/prompt-to-video/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"user_id\": \"$USER_ID\",
    \"prompt\": \"A beautiful sunset over mountains\",
    \"model\": \"wan2.6-t2v\"
  }")

# Extract HTTP status and body
http_status=$(echo "$response" | grep "HTTP_STATUS:" | cut -d: -f2)
body=$(echo "$response" | sed '/HTTP_STATUS:/d')

echo "Response:"
echo "$body" | jq '.' 2>/dev/null || echo "$body"
echo ""

if [ "$http_status" == "202" ] || [ "$http_status" == "200" ]; then
    echo -e "${GREEN}✅ SUCCESS: Prompt-to-video access granted (status: $http_status)${NC}"
elif [ "$http_status" == "403" ]; then
    echo -e "${RED}❌ FORBIDDEN: You don't have required role (status: $http_status)${NC}"
    echo -e "${YELLOW}   Required: ADMIN or PREMIUM${NC}"
elif [ "$http_status" == "401" ]; then
    echo -e "${RED}❌ UNAUTHORIZED: Token authentication failed (status: $http_status)${NC}"
    echo -e "${YELLOW}   Check token validity and JWT configuration${NC}"
else
    echo -e "${RED}❌ ERROR: Unexpected status code: $http_status${NC}"
fi
echo ""

# Test Image to Video
echo "Step 4: Test Image-to-Video API"
echo "=========================================="
echo ""
echo "Testing: POST /v1/features/image-to-video/"
echo ""

response2=$(curl -s -w "\nHTTP_STATUS:%{http_code}" \
  -X POST "$BASE_URL/v1/features/image-to-video/" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d "{
    \"user_id\": \"$USER_ID\",
    \"prompt\": \"Make clouds move\",
    \"model\": \"wan2.6-i2v\",
    \"image_url\": \"https://placehold.co/1280x720.jpg\"
  }")

# Extract HTTP status and body
http_status2=$(echo "$response2" | grep "HTTP_STATUS:" | cut -d: -f2)
body2=$(echo "$response2" | sed '/HTTP_STATUS:/d')

echo "Response:"
echo "$body2" | jq '.' 2>/dev/null || echo "$body2"
echo ""

if [ "$http_status2" == "202" ] || [ "$http_status2" == "200" ]; then
    echo -e "${GREEN}✅ SUCCESS: Image-to-video access granted (status: $http_status2)${NC}"
elif [ "$http_status2" == "403" ]; then
    echo -e "${RED}❌ FORBIDDEN: You don't have required role (status: $http_status2)${NC}"
    echo -e "${YELLOW}   Required: ADMIN or PREMIUM${NC}"
elif [ "$http_status2" == "401" ]; then
    echo -e "${RED}❌ UNAUTHORIZED: Token authentication failed (status: $http_status2)${NC}"
    echo -e "${YELLOW}   Check token validity and JWT configuration${NC}"
else
    echo -e "${RED}❌ ERROR: Unexpected status code: $http_status2${NC}"
fi
echo ""

# Summary
echo "=========================================="
echo "📊 Test Summary"
echo "=========================================="
echo ""

if [ "$http_status" == "202" ] || [ "$http_status" == "200" ]; then
    prom_result="${GREEN}✅ PASSED${NC}"
else
    prom_result="${RED}❌ FAILED${NC}"
fi

if [ "$http_status2" == "202" ] || [ "$http_status2" == "200" ]; then
    img_result="${GREEN}✅ PASSED${NC}"
else
    img_result="${RED}❌ FAILED${NC}"
fi

echo -e "Prompt-to-Video: $prom_result"
echo -e "Image-to-Video:  $img_result"
echo ""

echo "Check Django logs for detailed authorization debug info"
echo ""
