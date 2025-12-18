#!/bin/bash

# Test All AI Features Directly (No Conversation)
# Tests: image_generation, upscale, remove_background, reimagine, relight, expand

BASE_URL="http://localhost:9999"
SESSION_ID="direct_test_$(date +%s)"

echo "======================================"
echo "🧪 Testing All AI Features (Direct)"
echo "======================================"
echo "Session ID: $SESSION_ID"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Sample image URL for testing - using reliable public domain test image
TEST_IMAGE_URL="https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=800"

# Function to check task status
poll_task() {
    local task_id=$1
    local endpoint=$2
    local max_attempts=40
    local attempt=0
    
    echo "   📊 Polling task: $task_id"
    
    while [ $attempt -lt $max_attempts ]; do
        sleep 3
        attempt=$((attempt + 1))
        
        response=$(curl -s -X GET "$BASE_URL/$endpoint/status/$task_id/?user_id=$SESSION_ID")
        status=$(echo $response | jq -r '.result.status // "PROCESSING"')
        
        echo "   Attempt $attempt/$max_attempts: Status=$status"
        
        if [ "$status" = "COMPLETED" ]; then
            echo -e "${GREEN}✓ Task completed!${NC}"
            echo $response | jq '.'
            
            # Extract image URL from uploaded_urls or generated
            image_url=$(echo $response | jq -r '.result.uploaded_urls[0] // .result.generated[0] // empty')
            if [ ! -z "$image_url" ]; then
                echo -e "${BLUE}📸 Image URL: $image_url${NC}"
                echo $image_url > /tmp/last_generated_image.txt
            fi
            return 0
        elif [ "$status" = "FAILED" ]; then
            echo -e "${RED}✗ Task failed!${NC}"
            echo $response | jq '.'
            return 1
        fi
    done
    
    echo -e "${RED}✗ Timeout${NC}"
    return 1
}

# # Test 1: Image Generation
# echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
# echo -e "${YELLOW}TEST 1: Image Generation${NC}"
# echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# echo "📤 Request: Generate a beautiful sunset over mountains"
# response=$(curl -s -X POST "$BASE_URL/v1/features/image-generation/" \
#   -H "Content-Type: application/json" \
#   -d '{
#     "user_id": "'"$SESSION_ID"'",
#     "prompt": "A beautiful sunset over mountains, golden hour, dramatic clouds, photorealistic",
#     "model": "realism",
#     "aspect_ratio": "16:9",
#     "session_id": "'"$SESSION_ID"'"
#   }')

# echo $response | jq '.'
# task_id=$(echo $response | jq -r '.result.task_id')

# if [ "$task_id" != "null" ] && [ ! -z "$task_id" ]; then
#     echo ""
#     if poll_task $task_id "v1/features/image-generation"; then
#         echo -e "${GREEN}✓ TEST 1 PASSED${NC}"
#     else
#         echo -e "${RED}✗ TEST 1 FAILED${NC}"
#         exit 1
#     fi
# else
#     echo -e "${RED}✗ TEST 1 FAILED: No task_id returned${NC}"
#     exit 1
# fi

# echo ""
# sleep 2

# # Test 2: Upscale
# echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
# echo -e "${YELLOW}TEST 2: Upscale${NC}"
# echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# echo "📤 Request: Upscale image"
# echo "   Using image: $TEST_IMAGE_URL"

# response=$(curl -s -X POST "$BASE_URL/v1/features/upscale/" \
#   -H "Content-Type: application/json" \
#   -d '{
#     "user_id": "'"$SESSION_ID"'",
#     "image_url": "'"$TEST_IMAGE_URL"'",
#     "upscale_factor": 2,
#     "flavor": "photo",
#     "session_id": "'"$SESSION_ID"'"
#   }')

# echo $response | jq '.'
# task_id=$(echo $response | jq -r '.result.task_id')

# if [ "$task_id" != "null" ] && [ ! -z "$task_id" ]; then
#     echo ""
#     if poll_task $task_id "v1/features/upscale"; then
#         echo -e "${GREEN}✓ TEST 2 PASSED${NC}"
#     else
#         echo -e "${RED}✗ TEST 2 FAILED${NC}"
#     fi
# else
#     echo -e "${RED}✗ TEST 2 FAILED: No task_id returned${NC}"
# fi

echo ""
sleep 2

# Test 3: Remove Background
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${YELLOW}TEST 3: Remove Background${NC}"
echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

echo "📤 Request: Remove background"
echo "   Using image: $TEST_IMAGE_URL"

response=$(curl -s -X POST "$BASE_URL/v1/features/remove-background/" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "'"$SESSION_ID"'",
    "image_url": "'"$TEST_IMAGE_URL"'",
    "session_id": "'"$SESSION_ID"'"
  }')

echo $response | jq '.'

# Remove background is synchronous, check for image_url directly
image_url=$(echo $response | jq -r '.result.image_url // empty')
if [ ! -z "$image_url" ]; then
    echo -e "${GREEN}✓ TEST 3 PASSED${NC}"
    echo -e "${BLUE}📸 Image URL: $image_url${NC}"
else
    echo -e "${RED}✗ TEST 3 FAILED${NC}"
fi

# echo ""
# sleep 2

# # Test 4: Reimagine
# echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
# echo -e "${YELLOW}TEST 4: Reimagine${NC}"
# echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# echo "📤 Request: Reimagine as watercolor painting"
# echo "   Using image: $TEST_IMAGE_URL"

# response=$(curl -s -X POST "$BASE_URL/v1/features/reimagine/" \
#   -H "Content-Type: application/json" \
#   -d '{
#     "user_id": "'"$SESSION_ID"'",
#     "image_url": "'"$TEST_IMAGE_URL"'",
#     "prompt": "Transform this into a beautiful watercolor painting style",
#     "session_id": "'"$SESSION_ID"'"
#   }')

# echo $response | jq '.'
# task_id=$(echo $response | jq -r '.result.task_id')

# if [ "$task_id" != "null" ] && [ ! -z "$task_id" ]; then
#     echo ""
#     if poll_task $task_id "v1/features/reimagine"; then
#         echo -e "${GREEN}✓ TEST 4 PASSED${NC}"
#     else
#         echo -e "${RED}✗ TEST 4 FAILED${NC}"
#     fi
# else
#     echo -e "${RED}✗ TEST 4 FAILED: No task_id returned${NC}"
# fi

# echo ""
# sleep 2

# # Test 5: Relight
# echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
# echo -e "${YELLOW}TEST 5: Relight${NC}"
# echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# echo "📤 Request: Relight with warm sunset"
# echo "   Using image: $TEST_IMAGE_URL"

# response=$(curl -s -X POST "$BASE_URL/v1/features/relight/" \
#   -H "Content-Type: application/json" \
#   -d '{
#     "user_id": "'"$SESSION_ID"'",
#     "image_url": "'"$TEST_IMAGE_URL"'",
#     "prompt": "Warm sunset lighting, golden hour glow",
#     "session_id": "'"$SESSION_ID"'"
#   }')

# echo $response | jq '.'
# task_id=$(echo $response | jq -r '.result.task_id')

# if [ "$task_id" != "null" ] && [ ! -z "$task_id" ]; then
#     echo ""
#     if poll_task $task_id "v1/features/relight"; then
#         echo -e "${GREEN}✓ TEST 5 PASSED${NC}"
#     else
#         echo -e "${RED}✗ TEST 5 FAILED${NC}"
#     fi
# else
#     echo -e "${RED}✗ TEST 5 FAILED: No task_id returned${NC}"
# fi

# echo ""
# sleep 2

# # Test 6: Image Expand
# echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
# echo -e "${YELLOW}TEST 6: Image Expand${NC}"
# echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# echo "📤 Request: Expand image"
# echo "   Using image: $TEST_IMAGE_URL"

# response=$(curl -s -X POST "$BASE_URL/v1/features/image-expand/" \
#   -H "Content-Type: application/json" \
#   -d '{
#     "user_id": "'"$SESSION_ID"'",
#     "image_url": "'"$TEST_IMAGE_URL"'",
#     "prompt": "Expand to show more beautiful scenery and landscape",
#     "aspect_ratio": "16:9",
#     "left": 100,
#     "right": 100,
#     "top": 50,
#     "bottom": 50,
#     "session_id": "'"$SESSION_ID"'"
#   }')

# echo $response | jq '.'
# task_id=$(echo $response | jq -r '.result.task_id')

# if [ "$task_id" != "null" ] && [ ! -z "$task_id" ]; then
#     echo ""
#     if poll_task $task_id "v1/features/image-expand"; then
#         echo -e "${GREEN}✓ TEST 6 PASSED${NC}"
#     else
#         echo -e "${RED}✗ TEST 6 FAILED${NC}"
#     fi
# else
#     echo -e "${RED}✗ TEST 6 FAILED: No task_id returned${NC}"
# fi

# echo ""
# echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
# echo -e "${GREEN}🎉 All direct API tests completed!${NC}"
# echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
# echo ""

# # Check gallery
# echo "📊 Checking Image Gallery..."
# echo "Session ID: $SESSION_ID"

# gallery_response=$(curl -s -X GET "$BASE_URL/v1/gallery/?user_id=$SESSION_ID&limit=20")
# total_images=$(echo $gallery_response | jq '.result | length')

# echo "Total images saved to gallery: $total_images"
# echo ""
# echo "View gallery:"
# echo "   curl -s $BASE_URL/v1/gallery/images?user_id=$SESSION_ID | jq '.'"
