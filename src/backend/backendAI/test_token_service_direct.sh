#!/bin/bash

# Test Token Service: Check Balance & Deduct
# Updated by Gemini

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}       TESTING TOKEN SERVICE            ${NC}"
echo -e "${YELLOW}========================================${NC}\n"

# --- CẤU HÌNH ---
TARGET_URL="https://nmcnpm-api.lethanhcong.site:46337"

API_KEY_1="81aa801afec422868bea639e7c7bde4be900f533a4e1c755bffbb7c331c205b972a70e93bae29c79023cfe53a1fd9abd7c825cd57a1a46152fcaaacabfda350f"
API_KEY_2="2455925911c575f05b49845a7036abcd66be850cfc581ae90501173b36e6c8efc1b2937522f489486e9c1c604a9832b1929945aaa5852ffe2e34acdb5b4e92ca"

TEST_USER_ID="8cf89cd2-28a3-4bce-b538-cb361d030c04"

# Số lượng token muốn thay đổi (Để dấu âm (-) nếu muốn trừ, dương (+) nếu muốn cộng)
# Lưu ý: Nếu API không chấp nhận số âm, hãy đổi thành "10"
MODIFY_AMOUNT="10" 

# --- FUNCTION GỬI REQUEST ---
send_request() {
    local method=$1
    local endpoint=$2
    local data=$3
    local description=$4

    echo -e "${BLUE}--- Test: $description ---${NC}"
    echo "Endpoint: $method $endpoint"
    if [ ! -z "$data" ]; then
        echo "Payload: $data"
    fi

    # Xây dựng lệnh curl
    if [ "$method" == "GET" ]; then
        response=$(curl -s -w "\nHTTP_CODE:%{http_code}" \
            "${TARGET_URL}${endpoint}" \
            -H "api-key-1: ${API_KEY_1}" \
            -H "api-key-2: ${API_KEY_2}" \
            -H "Content-Type: application/json")
    else
        response=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X $method \
            "${TARGET_URL}${endpoint}" \
            -H "api-key-1: ${API_KEY_1}" \
            -H "api-key-2: ${API_KEY_2}" \
            -H "Content-Type: application/json" \
            -d "$data")
    fi

    # Xử lý kết quả
    http_code=$(echo "$response" | grep "HTTP_CODE:" | cut -d':' -f2)
    body=$(echo "$response" | grep -v "HTTP_CODE:")

    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✓ SUCCESS (200)${NC}"
        # Dùng jq in đẹp nếu có
        if command -v jq &> /dev/null; then
            echo "$body" | jq '.'
        else
            echo "$body"
        fi
    else
        echo -e "${RED}✗ FAILED (HTTP $http_code)${NC}"
        echo "Error Body: $body"
    fi
    echo ""
}

# --- BẮT ĐẦU TEST ---

# 1. Kiểm tra số dư trước
send_request "GET" "/api/v1/identity/users/tokens/${TEST_USER_ID}" "" "Check Balance (Before)"

# 2. Trừ Token
# Tạo JSON payload đúng format
PAYLOAD="{\"userId\": \"${TEST_USER_ID}\", \"tokens\": \"${MODIFY_AMOUNT}\"}"
send_request "PATCH" "/api/v1/identity/users/modify-tokens" "$PAYLOAD" "Deduct Tokens ($MODIFY_AMOUNT)"

# 3. Kiểm tra số dư sau khi trừ (để xác nhận)
send_request "GET" "/api/v1/identity/users/tokens/${TEST_USER_ID}" "" "Check Balance (After)"

echo -e "${YELLOW}========================================${NC}"
echo -e "${YELLOW}             TEST FINISHED              ${NC}"
echo -e "${YELLOW}========================================${NC}"