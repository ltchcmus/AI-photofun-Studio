#!/bin/bash

# Test Role-Based Access Control for Video Features
# Tests ADMIN, PREMIUM, and USER roles against video APIs

BASE_URL="http://localhost:9999"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}════════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${BLUE}🔒 Testing Role-Based Access Control for Video Features${NC}"
echo -e "${BLUE}════════════════════════════════════════════════════════════════════════════════${NC}"
echo ""

# Test function
test_api() {
    local role=$1
    local token=$2
    local test_name=$3
    
    echo -e "${YELLOW}Testing: $test_name${NC}"
    echo "Role: $role"
    
    if [ -z "$token" ]; then
        echo -e "${YELLOW}Authorization: None (no token)${NC}"
        response=$(curl -s -X POST "$BASE_URL/v1/features/prompt-to-video/" \
            -H "Content-Type: application/json" \
            -d '{
                "user_id": "test_user",
                "prompt": "A beautiful sunset",
                "model": "wan2.6-t2v"
            }')
    else
        echo -e "${YELLOW}Authorization: Bearer <token>...${NC}"
        response=$(curl -s -X POST "$BASE_URL/v1/features/prompt-to-video/" \
            -H "Authorization: Bearer $token" \
            -H "Content-Type: application/json" \
            -d '{
                "user_id": "test_user",
                "prompt": "A beautiful sunset",
                "model": "wan2.6-t2v"
            }')
    fi
    
    echo ""
    echo "Response:"
    echo "$response" | jq '.' 2>/dev/null || echo "$response"
    echo ""
    
    # Check response code
    code=$(echo "$response" | jq -r '.code' 2>/dev/null)
    message=$(echo "$response" | jq -r '.message' 2>/dev/null)
    
    case $role in
        "ADMIN"|"PREMIUM")
            if [ "$code" == "1000" ] || [ "$code" == "202" ]; then
                echo -e "${GREEN}✅ PASS: $role can access video API${NC}"
            else
                echo -e "${RED}❌ FAIL: $role should be able to access video API${NC}"
                echo -e "${RED}   Code: $code, Message: $message${NC}"
            fi
            ;;
        "USER")
            if [ "$code" == "1005" ]; then
                echo -e "${GREEN}✅ PASS: USER correctly blocked (403 Forbidden)${NC}"
            else
                echo -e "${RED}❌ FAIL: USER should be blocked with code 1005${NC}"
                echo -e "${RED}   Got code: $code, Message: $message${NC}"
            fi
            ;;
        "NONE")
            if [ "$code" == "1002" ]; then
                echo -e "${GREEN}✅ PASS: No token correctly rejected (401 Unauthorized)${NC}"
            else
                echo -e "${RED}❌ FAIL: Should return 401 for missing token${NC}"
                echo -e "${RED}   Got code: $code, Message: $message${NC}"
            fi
            ;;
    esac
    
    echo ""
    echo -e "${BLUE}────────────────────────────────────────────────────────────────────────────────${NC}"
    echo ""
}

# Generate mock JWT tokens for testing
# Note: These are mock tokens - in production, get from auth service
echo -e "${YELLOW}📝 Note: Using mock JWT tokens for testing${NC}"
echo -e "${YELLOW}   In production, get real tokens from authentication service${NC}"
echo ""

# You need to generate real JWT tokens with the JWT_SECRET_KEY from .env
# For now, we'll test with no token, invalid token, and placeholder tokens

echo -e "${BLUE}Test 1: No Token (Should be blocked - 401)${NC}"
test_api "NONE" "" "API call without Authorization header"

echo -e "${BLUE}Test 2: Invalid Token (Should be blocked - 401)${NC}"
test_api "INVALID" "invalid_token_here" "API call with invalid token"

echo ""
echo -e "${YELLOW}════════════════════════════════════════════════════════════════════════════════${NC}"
echo -e "${YELLOW}⚠️  To test with real tokens:${NC}"
echo -e "${YELLOW}════════════════════════════════════════════════════════════════════════════════${NC}"
echo ""
echo "1. Get JWT token from your authentication service"
echo ""
echo "2. Test with ADMIN token:"
echo "   ADMIN_TOKEN=\"your_admin_jwt_token\""
echo "   curl -X POST $BASE_URL/v1/features/prompt-to-video/ \\"
echo "     -H \"Authorization: Bearer \$ADMIN_TOKEN\" \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d '{\"user_id\": \"admin_id\", \"prompt\": \"test\", \"model\": \"wan2.6-t2v\"}'"
echo ""
echo "3. Test with PREMIUM token:"
echo "   PREMIUM_TOKEN=\"your_premium_jwt_token\""
echo "   curl -X POST $BASE_URL/v1/features/prompt-to-video/ \\"
echo "     -H \"Authorization: Bearer \$PREMIUM_TOKEN\" \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d '{\"user_id\": \"premium_id\", \"prompt\": \"test\", \"model\": \"wan2.6-t2v\"}'"
echo ""
echo "4. Test with USER token (should be blocked):"
echo "   USER_TOKEN=\"your_user_jwt_token\""
echo "   curl -X POST $BASE_URL/v1/features/prompt-to-video/ \\"
echo "     -H \"Authorization: Bearer \$USER_TOKEN\" \\"
echo "     -H \"Content-Type: application/json\" \\"
echo "     -d '{\"user_id\": \"user_id\", \"prompt\": \"test\", \"model\": \"wan2.6-t2v\"}'"
echo ""
echo -e "${YELLOW}════════════════════════════════════════════════════════════════════════════════${NC}"
echo ""
echo -e "${BLUE}📚 For detailed documentation, see: RBAC_GUIDE.md${NC}"
echo ""
