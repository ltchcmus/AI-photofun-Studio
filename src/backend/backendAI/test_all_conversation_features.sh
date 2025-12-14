#!/bin/bash

# Test All Conversation Features
# Tests image_generate, upscale, remove_background, reimagine, relight, expand

BASE_URL="http://localhost:9999/api/v1/chat"
USER_ID="test_user_$(date +%s)"

echo "======================================"
echo "🧪 Testing All Conversation Features"
echo "======================================"
echo "User ID: $USER_ID"
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to wait and check session status
wait_for_completion() {
    local session_id=$1
    local max_attempts=40
    local attempt=0
    
    while [ $attempt -lt $max_attempts ]; do
        sleep 3
        attempt=$((attempt + 1))
        
        response=$(curl -s -X GET "$BASE_URL/sessions/$session_id")
        status=$(echo $response | jq -r '.result.messages[-1].status // "PROCESSING"')
        
        echo "   Attempt $attempt/$max_attempts: Status=$status"
        
        if [ "$status" = "DONE" ]; then
            echo -e "${GREEN}✓ Task completed!${NC}"
            echo $response | jq '.result.messages[-1]'
            return 0
        elif [ "$status" = "ERROR" ]; then
            echo -e "${RED}✗ Task failed!${NC}"
            echo $response | jq '.result.messages[-1]'
            return 1
        fi
    done
    
    echo -e "${RED}✗ Timeout waiting for completion${NC}"
    return 1
}

# Test 1: Image Generation
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}TEST 1: Image Generation${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo "📝 Creating session..."
SESSION_1=$(curl -s -X POST "$BASE_URL/sessions" \
  -H "Content-Type: application/json" \
  -d "{\"user_id\": \"$USER_ID\"}" | jq -r '.result.session_id')

echo "Session ID: $SESSION_1"
echo ""

echo "📤 Sending prompt: 'generate a beautiful sunset over mountains'..."
curl -s -X POST "$BASE_URL/sessions/$SESSION_1/messages" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "'"$USER_ID"'",
    "prompt": "generate a beautiful sunset over mountains"
  }' | jq '.'

echo ""
echo "⏳ Waiting for image generation..."
if wait_for_completion $SESSION_1; then
    echo -e "${GREEN}✓ TEST 1 PASSED: Image generated successfully${NC}"
    
    # Extract image URL for next tests
    IMAGE_URL=$(curl -s -X GET "$BASE_URL/sessions/$SESSION_1" | jq -r '.result.messages[-1].image.image_url')
    echo "Generated image: $IMAGE_URL"
else
    echo -e "${RED}✗ TEST 1 FAILED${NC}"
    exit 1
fi

echo ""
sleep 2

# Test 2: Upscale
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}TEST 2: Upscale${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo "📤 Sending prompt: 'upscale this image'..."
MESSAGE_ID=$(curl -s -X GET "$BASE_URL/sessions/$SESSION_1" | jq -r '.result.messages[-1].message_id')

curl -s -X POST "$BASE_URL/sessions/$SESSION_1/messages" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "'"$USER_ID"'",
    "prompt": "upscale this image",
    "selected_messages": ["'"$MESSAGE_ID"'"]
  }' | jq '.'

echo ""
echo "⏳ Waiting for upscale..."
if wait_for_completion $SESSION_1; then
    echo -e "${GREEN}✓ TEST 2 PASSED: Image upscaled successfully${NC}"
else
    echo -e "${RED}✗ TEST 2 FAILED${NC}"
fi

echo ""
sleep 2

# Test 3: Remove Background
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}TEST 3: Remove Background${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo "📝 Creating new session..."
SESSION_2=$(curl -s -X POST "$BASE_URL/sessions" \
  -H "Content-Type: application/json" \
  -d "{\"user_id\": \"$USER_ID\"}" | jq -r '.result.session_id')

echo "Session ID: $SESSION_2"
echo ""

echo "📤 Sending prompt: 'generate a cat'..."
curl -s -X POST "$BASE_URL/sessions/$SESSION_2/messages" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "'"$USER_ID"'",
    "prompt": "generate a cat"
  }' | jq '.'

echo ""
echo "⏳ Waiting for image generation..."
wait_for_completion $SESSION_2

echo ""
echo "📤 Sending prompt: 'remove background from this image'..."
MESSAGE_ID=$(curl -s -X GET "$BASE_URL/sessions/$SESSION_2" | jq -r '.result.messages[-1].message_id')

curl -s -X POST "$BASE_URL/sessions/$SESSION_2/messages" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "'"$USER_ID"'",
    "prompt": "remove background from this image",
    "selected_messages": ["'"$MESSAGE_ID"'"]
  }' | jq '.'

echo ""
echo "⏳ Waiting for background removal..."
if wait_for_completion $SESSION_2; then
    echo -e "${GREEN}✓ TEST 3 PASSED: Background removed successfully${NC}"
else
    echo -e "${RED}✗ TEST 3 FAILED${NC}"
fi

echo ""
sleep 2

# Test 4: Reimagine
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}TEST 4: Reimagine${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo "📤 Sending prompt: 'reimagine this as a watercolor painting'..."
MESSAGE_ID=$(curl -s -X GET "$BASE_URL/sessions/$SESSION_2" | jq -r '.result.messages[-2].message_id')

curl -s -X POST "$BASE_URL/sessions/$SESSION_2/messages" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "'"$USER_ID"'",
    "prompt": "reimagine this as a watercolor painting",
    "selected_messages": ["'"$MESSAGE_ID"'"]
  }' | jq '.'

echo ""
echo "⏳ Waiting for reimagine..."
if wait_for_completion $SESSION_2; then
    echo -e "${GREEN}✓ TEST 4 PASSED: Image reimagined successfully${NC}"
else
    echo -e "${RED}✗ TEST 4 FAILED${NC}"
fi

echo ""
sleep 2

# Test 5: Relight
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}TEST 5: Relight${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo "📤 Sending prompt: 'relight this image with warm sunset lighting'..."
MESSAGE_ID=$(curl -s -X GET "$BASE_URL/sessions/$SESSION_2" | jq -r '.result.messages[-3].message_id')

curl -s -X POST "$BASE_URL/sessions/$SESSION_2/messages" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "'"$USER_ID"'",
    "prompt": "relight this image with warm sunset lighting",
    "selected_messages": ["'"$MESSAGE_ID"'"]
  }' | jq '.'

echo ""
echo "⏳ Waiting for relight..."
if wait_for_completion $SESSION_2; then
    echo -e "${GREEN}✓ TEST 5 PASSED: Image relit successfully${NC}"
else
    echo -e "${RED}✗ TEST 5 FAILED${NC}"
fi

echo ""
sleep 2

# Test 6: Image Expand
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}TEST 6: Image Expand${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo "📤 Sending prompt: 'expand this image to show more scenery'..."
MESSAGE_ID=$(curl -s -X GET "$BASE_URL/sessions/$SESSION_2" | jq -r '.result.messages[-4].message_id')

curl -s -X POST "$BASE_URL/sessions/$SESSION_2/messages" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "'"$USER_ID"'",
    "prompt": "expand this image to show more scenery",
    "selected_messages": ["'"$MESSAGE_ID"'"]
  }' | jq '.'

echo ""
echo "⏳ Waiting for image expand..."
if wait_for_completion $SESSION_2; then
    echo -e "${GREEN}✓ TEST 6 PASSED: Image expanded successfully${NC}"
else
    echo -e "${RED}✗ TEST 6 FAILED${NC}"
fi

echo ""
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 All tests completed!${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# Summary
echo "📊 Test Summary:"
echo "   Session 1: $SESSION_1"
echo "   Session 2: $SESSION_2"
echo ""
echo "View full conversation:"
echo "   curl -s $BASE_URL/sessions/$SESSION_1 | jq '.'"
echo "   curl -s $BASE_URL/sessions/$SESSION_2 | jq '.'"
