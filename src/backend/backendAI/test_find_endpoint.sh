#!/bin/bash

# Find the correct API endpoint
echo "========================================="
echo "Testing Various API Endpoint Patterns"
echo "========================================="
echo ""

BASE="https://nmcnpm.lethanhcong.site:46337"
USER_ID="25562afb-d68d-453b-a214-61a77d05c5af"
KEY1="81aa801afec422868bea639e7c7bde4be900f533a4e1c7559d0506df55a66f1e"
KEY2="2455925911c575f05b49845a7036abcd66be850cfc581ae922e825b69b21e5dc"

test_endpoint() {
    local endpoint=$1
    local desc=$2
    
    echo "Testing: $desc"
    echo "URL: ${BASE}${endpoint}"
    
    response=$(curl -s -w "\nHTTP:%{http_code}" \
        "${BASE}${endpoint}" \
        -H "api-key-1: ${KEY1}" \
        -H "api-key-2: ${KEY2}" \
        -H "Content-Type: application/json" 2>&1)
    
    http_code=$(echo "$response" | grep "HTTP:" | cut -d':' -f2)
    body=$(echo "$response" | grep -v "HTTP:")
    
    # Check if JSON
    if echo "$body" | jq empty 2>/dev/null; then
        echo "✓ JSON Response!"
        echo "$body" | jq '.'
        echo ""
        return 0
    else
        echo "✗ HTTP $http_code - Not JSON (HTML/Error)"
        echo "Preview: ${body:0:100}..."
        echo ""
        return 1
    fi
}

echo "Pattern 1: /api/v1/identity/users/tokens/{id}"
test_endpoint "/api/v1/identity/users/tokens/${USER_ID}" "Standard API path"

echo "Pattern 2: /users/tokens/{id}"
test_endpoint "/users/tokens/${USER_ID}" "Short path"

echo "Pattern 3: /api/users/tokens/{id}"
test_endpoint "/api/users/tokens/${USER_ID}" "API prefix only"

echo "Pattern 4: /identity/users/tokens/{id}"
test_endpoint "/identity/users/tokens/${USER_ID}" "Identity prefix"

echo "Pattern 5: /v1/users/tokens/{id}"
test_endpoint "/v1/users/tokens/${USER_ID}" "Version prefix"

echo "Pattern 6: /tokens/${USER_ID}"
test_endpoint "/tokens/${USER_ID}" "Direct tokens endpoint"

echo ""
echo "========================================="
echo "Checking if this is an API-GW proxy issue"
echo "========================================="
echo ""

# Try without specific endpoint - get root
echo "Testing root endpoint for API info:"
curl -s "${BASE}/" | head -50

echo ""
echo "========================================="
echo "Recommendation:"
echo "========================================="
echo "Please ask the server admin for:"
echo "1. Correct API endpoint URL"
echo "2. Example curl command that works"
echo "3. API documentation link"
echo ""
echo "Current issue: Server returns HTML (frontend app) instead of JSON API"
