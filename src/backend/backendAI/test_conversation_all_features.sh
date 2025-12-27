#!/bin/bash

# Conversation API - All Features Test Script
# Tests all AI features through conversational interface with parameter extraction

BASE_URL="http://localhost:9999/api/v1"
SESSION_ID=""
USER_ID="test_conv_user_$(date +%s)"
LAST_MESSAGE_ID=""
GENERATED_MESSAGE_ID=""

# Pre-existing image URL (to skip expensive image generation)
# Set this to use an existing image instead of generating a new one
EXISTING_IMAGE_URL="https://res.cloudinary.com/derwtva4p/image/upload/v1766469508/file-service/07ffd51e-9940-485a-83d3-32096d74b814.png"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "════════════════════════════════════════════════════════════════════════════════"
echo "🧪 Testing Conversation API - All Features with Parameter Extraction"
echo "════════════════════════════════════════════════════════════════════════════════"
echo ""
echo "📝 Test Configuration:"
echo "   Base URL: $BASE_URL"
echo "   User ID: $USER_ID"
if [ ! -z "$EXISTING_IMAGE_URL" ]; then
    echo "   Using existing image: $EXISTING_IMAGE_URL"
fi
echo ""

# Helper function to create session
create_session() {
    echo "════════════════════════════════════════════════════════════════════════════════"
    echo "📍 SETUP: Creating Conversation Session"
    echo "════════════════════════════════════════════════════════════════════════════════"
    echo ""
    
    echo "📤 REQUEST: POST $BASE_URL/chat/sessions"
    
    RESPONSE=$(curl -s -X POST "$BASE_URL/chat/sessions" \
        -H "Content-Type: application/json" \
        -d "{\"user_id\": \"$USER_ID\"}")
    
    echo "📥 RESPONSE:"
    echo "$RESPONSE" | jq '.'
    echo ""
    
    SESSION_ID=$(echo $RESPONSE | jq -r '.result.session_id // .data.session_id // .session_id // empty')
    
    if [ -z "$SESSION_ID" ] || [ "$SESSION_ID" == "null" ]; then
        echo "❌ Failed to create session"
        exit 1
    fi
    
    echo "✅ Session created: ${GREEN}$SESSION_ID${NC}"
    echo ""
    read -p "⏸️  Press Enter to continue..."
    echo ""
}

# Helper function to send message (parameters extracted from prompt automatically)
send_message() {
    local prompt="$1"
    local selected_messages="$2"
    local additional_images="$3"
    local use_image_url="$4"  # Optional: direct image URL instead of message ID
    
    echo "📤 REQUEST: POST $BASE_URL/chat/sessions/$SESSION_ID/messages"
    echo "   Prompt: \"$prompt\""
    
    # Build request JSON - NO feature_params (extracted automatically)
    local request_json="{\"user_id\": \"$USER_ID\", \"prompt\": \"$prompt\""
    
    # Add image_url directly if provided (skip selected_messages)
    if [ ! -z "$use_image_url" ]; then
        request_json+=", \"image_url\": \"$use_image_url\""
    # Otherwise use selected_messages if provided
    elif [ ! -z "$selected_messages" ] && [ "$selected_messages" != "[]" ]; then
        request_json+=", \"selected_messages\": $selected_messages"
    fi
    
    if [ ! -z "$additional_images" ] && [ "$additional_images" != "[]" ]; then
        request_json+=", \"additional_images\": $additional_images"
    fi
    
    request_json+="}"
    
    echo "   Body: $request_json"
    echo ""
    
    RESPONSE=$(curl -s -X POST "$BASE_URL/chat/sessions/$SESSION_ID/messages" \
        -H "Content-Type: application/json" \
        -d "$request_json")
    
    echo "📥 RESPONSE:"
    echo "$RESPONSE" | jq '.'
    echo ""
    
    LAST_MESSAGE_ID=$(echo $RESPONSE | jq -r '.result.message_id // .data.message_id // .message_id // empty')
    
    if [ -z "$LAST_MESSAGE_ID" ] || [ "$LAST_MESSAGE_ID" == "null" ]; then
        echo "❌ Failed to send message"
        return 1
    fi
    
    echo "✅ Message sent, ID: ${GREEN}$LAST_MESSAGE_ID${NC}"
    echo ""
}

# Helper function to poll for completion
poll_completion() {
    local message_id="$1"
    local max_attempts=40
    local attempt=1
    
    echo "════════════════════════════════════════════════════════════════════════════════"
    echo "📊 Polling for completion (Message ID: $message_id)"
    echo "════════════════════════════════════════════════════════════════════════════════"
    echo ""
    
    while [ $attempt -le $max_attempts ]; do
        echo "📤 REQUEST (Attempt $attempt/$max_attempts): GET $BASE_URL/chat/sessions/$SESSION_ID"
        
        HISTORY=$(curl -s "$BASE_URL/chat/sessions/$SESSION_ID")
        
        # Find message by ID and check status
        STATUS=$(echo $HISTORY | jq -r ".result.messages[] | select(.message_id == \"$message_id\") | .status // empty")
        
        if [ -z "$STATUS" ]; then
            STATUS="NOT_FOUND"
        fi
        
        echo "   Status: $STATUS"
        
        if [ "$STATUS" = "COMPLETED" ]; then
            MESSAGE_DATA=$(echo $HISTORY | jq ".result.messages[] | select(.message_id == \"$message_id\")")
            IMAGE_URL=$(echo "$MESSAGE_DATA" | jq -r '.image_url // empty')
            UPLOADED_URLS=$(echo "$MESSAGE_DATA" | jq -r '.uploaded_urls // empty')
            CONTENT=$(echo "$MESSAGE_DATA" | jq -r '.content // empty')
            EXTRACTED_PARAMS=$(echo "$MESSAGE_DATA" | jq -r '.metadata.extracted_params // empty')
            
            echo ""
            echo "✅ ${GREEN}Task completed!${NC}"
            echo ""
            echo "📋 Message Details:"
            echo "   Content: $CONTENT"
            if [ ! -z "$IMAGE_URL" ] && [ "$IMAGE_URL" != "null" ]; then
                echo "   Image URL: $IMAGE_URL"
            fi
            if [ ! -z "$UPLOADED_URLS" ] && [ "$UPLOADED_URLS" != "null" ]; then
                echo "   Uploaded URLs: $UPLOADED_URLS"
            fi
            if [ ! -z "$EXTRACTED_PARAMS" ] && [ "$EXTRACTED_PARAMS" != "null" ] && [ "$EXTRACTED_PARAMS" != "{}" ]; then
                echo "   🔍 Extracted Parameters: $EXTRACTED_PARAMS"
            fi
            echo ""
            echo "📄 ${BLUE}Full Message JSON:${NC}"
            echo "$MESSAGE_DATA" | jq '.'
            echo ""
            return 0
        elif [ "$STATUS" = "FAILED" ] || [ "$STATUS" = "ERROR" ]; then
            MESSAGE_DATA=$(echo $HISTORY | jq ".result.messages[] | select(.message_id == \"$message_id\")")
            ERROR_MSG=$(echo "$MESSAGE_DATA" | jq -r '.content // .prompt // .error.message // "Unknown error"')
            
            echo ""
            echo "❌ ${RED}Task failed${NC}"
            echo "   Error: $ERROR_MSG"
            echo ""
            echo "📄 ${BLUE}Full Message JSON:${NC}"
            echo "$MESSAGE_DATA" | jq '.'
            echo ""
            return 1
        fi
        
        if [ $attempt -lt $max_attempts ]; then
            echo "   ⏳ Waiting 3 seconds..."
            sleep 3
        fi
        
        attempt=$((attempt + 1))
        echo ""
    done
    
    echo "⚠️  ${RED}Timeout waiting for completion${NC}"
    echo ""
    return 1
}

# Test 1: Image Generation (REQUIRED - establishes base image)
test_image_generation() {
    echo "════════════════════════════════════════════════════════════════════════════════"
    echo "📍 TEST 1: Image Generation"
    echo "════════════════════════════════════════════════════════════════════════════════"
    echo ""
    
    # Natural language prompt with aspect ratio hint
    send_message "Generate a beautiful sunset over mountains in landscape format"
    
    if poll_completion "$LAST_MESSAGE_ID"; then
        echo "✅ ${GREEN}TEST 1 PASSED${NC}"
        GENERATED_MESSAGE_ID=$LAST_MESSAGE_ID
        echo "   💾 Saved generated image message ID: $GENERATED_MESSAGE_ID"
    else
        echo "❌ ${RED}TEST 1 FAILED${NC}"
        return 1
    fi
    
    echo ""
    read -p "⏸️  Press Enter to continue..."
    echo ""
}

# Test 2: Upscale (with parameter extraction)
test_upscale() {
    echo "════════════════════════════════════════════════════════════════════════════════"
    echo "📍 TEST 2: Upscale with Photo Flavor (Extracted from Prompt)"
    echo "════════════════════════════════════════════════════════════════════════════════"
    echo ""
    
    # Natural language - system should extract "photo" flavor
    # Use existing image URL if available, otherwise use generated message ID
    if [ ! -z "$EXISTING_IMAGE_URL" ] && [ -z "$GENERATED_MESSAGE_ID" ]; then
        send_message "Upscale this photo to higher resolution" "" "" "$EXISTING_IMAGE_URL"
    else
        send_message "Upscale this photo to higher resolution" "[\"$GENERATED_MESSAGE_ID\"]"
    fi
    
    if poll_completion "$LAST_MESSAGE_ID"; then
        echo "✅ ${GREEN}TEST 2 PASSED${NC}"
    else
        echo "❌ ${RED}TEST 2 FAILED${NC}"
    fi
    
    echo ""
    read -p "⏸️  Press Enter to continue..."
    echo ""
}

# Test 3: Remove Background
test_remove_background() {
    echo "════════════════════════════════════════════════════════════════════════════════"
    echo "📍 TEST 3: Remove Background"
    echo "════════════════════════════════════════════════════════════════════════════════"
    echo ""
    
    if [ ! -z "$EXISTING_IMAGE_URL" ] && [ -z "$GENERATED_MESSAGE_ID" ]; then
        send_message "Remove the background from this image" "" "" "$EXISTING_IMAGE_URL"
    else
        send_message "Remove the background from this image" "[\"$GENERATED_MESSAGE_ID\"]"
    fi
    
    if poll_completion "$LAST_MESSAGE_ID"; then
        echo "✅ ${GREEN}TEST 3 PASSED${NC}"
    else
        echo "❌ ${RED}TEST 3 FAILED${NC}"
    fi
    
    echo ""
    read -p "⏸️  Press Enter to continue..."
    echo ""
}

# Test 4: Reimagine (with parameter extraction)
test_reimagine() {
    echo "════════════════════════════════════════════════════════════════════════════════"
    echo "📍 TEST 4: Reimagine with Creative Imagination (Extracted from Prompt)"
    echo "════════════════════════════════════════════════════════════════════════════════"
    echo ""
    
    # Natural language - system should extract "creative" imagination
    if [ ! -z "$EXISTING_IMAGE_URL" ] && [ -z "$GENERATED_MESSAGE_ID" ]; then
        send_message "Transform this into a creative watercolor painting with artistic imagination" "" "" "$EXISTING_IMAGE_URL"
    else
        send_message "Transform this into a creative watercolor painting with artistic imagination" "[\"$GENERATED_MESSAGE_ID\"]"
    fi
    
    if poll_completion "$LAST_MESSAGE_ID"; then
        echo "✅ ${GREEN}TEST 4 PASSED${NC}"
    else
        echo "❌ ${RED}TEST 4 FAILED${NC}"
    fi
    
    echo ""
    read -p "⏸️  Press Enter to continue..."
    echo ""
}

# Test 5: Relight (with parameter extraction)
test_relight() {
    echo "════════════════════════════════════════════════════════════════════════════════"
    echo "📍 TEST 5: Relight with Dramatic Style (Extracted from Prompt)"
    echo "════════════════════════════════════════════════════════════════════════════════"
    echo ""
    
    # Natural language - system should extract "dramatic" style
    if [ ! -z "$EXISTING_IMAGE_URL" ] && [ -z "$GENERATED_MESSAGE_ID" ]; then
        send_message "Add dramatic warm sunset lighting to this image" "" "" "$EXISTING_IMAGE_URL"
    else
        send_message "Add dramatic warm sunset lighting to this image" "[\"$GENERATED_MESSAGE_ID\"]"
    fi
    
    if poll_completion "$LAST_MESSAGE_ID"; then
        echo "✅ ${GREEN}TEST 5 PASSED${NC}"
    else
        echo "❌ ${RED}TEST 5 FAILED${NC}"
    fi
    
    echo ""
    read -p "⏸️  Press Enter to continue..."
    echo ""
}

# Test 6: Image Expand (with parameter extraction)
test_image_expand() {
    echo "════════════════════════════════════════════════════════════════════════════════"
    echo "📍 TEST 6: Image Expand (Directional Keywords Extracted from Prompt)"
    echo "════════════════════════════════════════════════════════════════════════════════"
    echo ""
    
    # Natural language - system should detect "left" and "right" expansion
    if [ ! -z "$EXISTING_IMAGE_URL" ] && [ -z "$GENERATED_MESSAGE_ID" ]; then
        send_message "Extend this image horizontally on both left and right sides" "" "" "$EXISTING_IMAGE_URL"
    else
        send_message "Extend this image horizontally on both left and right sides" "[\"$GENERATED_MESSAGE_ID\"]"
    fi
    
    if poll_completion "$LAST_MESSAGE_ID"; then
        echo "✅ ${GREEN}TEST 6 PASSED${NC}"
    else
        echo "❌ ${RED}TEST 6 FAILED${NC}"
    fi
    
    echo ""
    read -p "⏸️  Press Enter to continue..."
    echo ""
}

# Test 7: Style Transfer (with reference image)
test_style_transfer() {
    echo "═══════════════════════════════════════════════════════════════════════════════="
    echo "📍 TEST 7: Style Transfer with Reference Image"
    echo "═══════════════════════════════════════════════════════════════════════════════="
    echo ""
    
    # Use pre-defined reference image URL (skip expensive generation)
    local REFERENCE_IMAGE="https://ai-statics.freepik.com/content/mg-upscaler/6ddl4vh7zjc5zcy7vwahpkycju/bc54e5d4-710e-4cc6-bccd-15ea08c9079a_1c5bb0d9-d386-4dfd-b433-df1281c3b74e.png?token=exp=1766558775~hmac=f7f3641379eb747f1f9a88ab8a0e4acf"
    
    echo "📝 Using pre-defined reference image: $REFERENCE_IMAGE"
    echo ""
    
    # OLD CODE: Generate reference image dynamically (costs API credits)
    # echo "📝 Step 1: Generating reference image..."
    # echo ""
    # send_message "Generate an abstract digital art painting with vibrant colors"
    # 
    # if poll_completion "$LAST_MESSAGE_ID"; then
    #     local REFERENCE_MESSAGE_ID=$LAST_MESSAGE_ID
    #     
    #     # Get reference image URL from conversation
    #     HISTORY=$(curl -s "$BASE_URL/chat/sessions/$SESSION_ID")
    #     REFERENCE_IMAGE=$(echo $HISTORY | jq -r ".result.messages[] | select(.message_id == \"$REFERENCE_MESSAGE_ID\") | (.image_url // .uploaded_urls[0])")
    
    # Apply style transfer with reference image
    if [ ! -z "$EXISTING_IMAGE_URL" ] && [ -z "$GENERATED_MESSAGE_ID" ]; then
        send_message "Apply the artistic style from the reference image to this photo" "" "[\"$REFERENCE_IMAGE\"]" "$EXISTING_IMAGE_URL"
    else
        send_message "Apply the artistic style from the reference image to this photo" "[\"$GENERATED_MESSAGE_ID\"]" "[\"$REFERENCE_IMAGE\"]"
    fi
    
    if poll_completion "$LAST_MESSAGE_ID"; then
        echo "✅ ${GREEN}TEST 7 PASSED${NC}"
    else
        echo "❌ ${RED}TEST 7 FAILED${NC}"
    fi
    
    echo ""
    read -p "⏸️  Press Enter to continue..."
    echo ""
}

# Main execution
main() {
    create_session
    
    # Test 1 is OPTIONAL now - can use EXISTING_IMAGE_URL instead
    # Uncomment to generate new image (costs API credits):
    # test_image_generation
    
    # Check if we have an image to work with (either generated or existing URL)
    if [ -z "$GENERATED_MESSAGE_ID" ] && [ -z "$EXISTING_IMAGE_URL" ]; then
        echo "❌ ${RED}Cannot proceed - no image available${NC}"
        echo "❌ ${RED}Either run test_image_generation() or set EXISTING_IMAGE_URL${NC}"
        exit 1
    fi
    
    if [ ! -z "$EXISTING_IMAGE_URL" ]; then
        echo "💡 ${YELLOW}Using existing image URL instead of generating new image${NC}"
        echo "   This saves API credits!"
        echo ""
        read -p "⏸️  Press Enter to start tests..."
        echo ""
    fi
    
    # Run all editing feature tests
    # test_upscale
    # test_remove_background
    # test_reimagine
    # test_relight
    # test_image_expand
    test_style_transfer
    
    # Display final conversation
    echo "════════════════════════════════════════════════════════════════════════════════"
    echo "📊 FINAL CONVERSATION HISTORY"
    echo "════════════════════════════════════════════════════════════════════════════════"
    echo ""
    
    HISTORY=$(curl -s "$BASE_URL/chat/sessions/$SESSION_ID")
    echo "$HISTORY" | jq '.result.messages[] | {
        role: .role, 
        status: .status, 
        intent: .metadata.intent, 
        extracted_params: .metadata.extracted_params,
        image: (.image_url // .uploaded_urls[0] // null)
    }'
    
    echo ""
    echo "════════════════════════════════════════════════════════════════════════════════"
    echo "✅ ${GREEN}All Conversation Tests Completed${NC}"
    echo "════════════════════════════════════════════════════════════════════════════════"
    echo ""
    echo "📊 Summary:"
    MESSAGE_COUNT=$(echo "$HISTORY" | jq '.result.messages | length')
    echo "   Total messages: $MESSAGE_COUNT"
    echo "   Session ID: $SESSION_ID"
    echo "   User ID: $USER_ID"
    echo ""
}

main
