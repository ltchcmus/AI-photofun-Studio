#!/bin/bash

# Test Token Service with Valid User
# Tìm user hợp lệ hoặc tạo user mới để test

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Token Service - Find Valid User${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Correct configuration
TOKEN_SERVICE_URL="https://nmcnpm-api.lethanhcong.site:46337"
API_KEY_1="81aa801afec422868bea639e7c7bde4be900f533a4e1c755bffbb7c331c205b972a70e93bae29c79023cfe53a1fd9abd7c825cd57a1a46152fcaaacabfda350f"
API_KEY_2="2455925911c575f05b49845a7036abcd66be850cfc581ae90501173b36e6c8efc1b2937522f489486e9c1c604a9832b1929945aaa5852ffe2e34acdb5b4e92ca"

# Test với user từ frontend (lấy từ localStorage khi login)
echo -e "${YELLOW}Note: Bạn cần user_id từ hệ thống authentication của frontend${NC}"
echo -e "${YELLOW}Để lấy user_id:${NC}"
echo "1. Đăng nhập vào frontend (http://localhost:5173)"
echo "2. Mở DevTools > Application > Local Storage"
echo "3. Copy giá trị của key 'user' hoặc 'userId'"
echo ""

# Test với một vài user IDs thường gặp
TEST_USERS=(
    "25562afb-d68d-453b-a214-61a77d05c5af"
    "web_1766726211779_mrrhmmxfb"
    "test-user"
    "admin"
)

echo -e "${BLUE}Testing với các user IDs...${NC}\n"

for user_id in "${TEST_USERS[@]}"; do
    echo -e "${YELLOW}Testing user: ${user_id}${NC}"
    
    response=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
        "${TOKEN_SERVICE_URL}/api/v1/identity/users/tokens/${user_id}" \
        -H "api-key-1: ${API_KEY_1}" \
        -H "api-key-2: ${API_KEY_2}" \
        -H "Content-Type: application/json")
    
    http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d':' -f2)
    body=$(echo "$response" | grep -v "HTTP_CODE:")
    
    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✓ FOUND VALID USER!${NC}"
        echo "User ID: ${user_id}"
        echo "Response:"
        echo "$body" | jq '.' 2>/dev/null || echo "$body"
        
        # Extract token balance
        balance=$(echo "$body" | jq -r '.result.tokens // "N/A"' 2>/dev/null)
        echo -e "\n${GREEN}Token Balance: ${balance}${NC}"
        
        echo -e "\n${GREEN}Use this user_id for testing:${NC}"
        echo "USER_ID_GOOD=\"${user_id}\""
        echo ""
        exit 0
    else
        echo -e "${RED}✗ Not found (HTTP ${http_code})${NC}"
        echo "$body" | head -1
        echo ""
    fi
done

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}No valid user found in test list${NC}"
echo -e "${YELLOW}========================================${NC}\n"

echo "Options:"
echo "1. Đăng nhập frontend và lấy user_id từ localStorage"
echo "2. Tạo user mới qua authentication API"
echo "3. Hỏi admin để lấy user_id test"
echo ""

echo -e "${BLUE}Manual test command:${NC}"
echo "curl -s \"${TOKEN_SERVICE_URL}/api/v1/identity/users/tokens/YOUR_USER_ID\" \\"
echo "  -H \"api-key-1: ${API_KEY_1}\" \\"
echo "  -H \"api-key-2: ${API_KEY_2}\" | jq '.'"
