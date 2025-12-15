#!/bin/bash
# API Testing Commands for AI PhotoFun Studio
# Run these commands to test the APIs

BASE_URL="http://localhost:9999"

echo "================================================================================================"
echo "🚀 AI PHOTOFUN STUDIO - API TESTING COMMANDS"
echo "================================================================================================"
echo ""

# ============================================================================
# TEST 1: CONVERSATION FLOW
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 TEST 1: CONVERSATION FLOW"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Step 1: Create conversation session
echo "STEP 1: Create Conversation Session"
echo "------------------------------------"
echo "Command:"
echo 'curl -X POST '$BASE_URL'/api/conversation/sessions/ \'
echo '  -H "Content-Type: application/json" \'
echo '  -d '"'"'{"user_id": "test_user_123"}'"'"
echo ""
echo "Executing..."
SESSION_RESPONSE=$(curl -s -X POST $BASE_URL/api/conversation/sessions/ \
  -H "Content-Type: application/json" \
  -d '{"user_id": "test_user_123"}')

echo "Response:"
echo "$SESSION_RESPONSE" | python3 -m json.tool
echo ""

# Extract session_id
SESSION_ID=$(echo $SESSION_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('session_id', ''))")

if [ -z "$SESSION_ID" ]; then
    echo "❌ Failed to create session"
    exit 1
fi

echo "✅ Session created: $SESSION_ID"
echo ""

# Step 2: Send chat message to generate image
echo "STEP 2: Send Chat Message (Generate Image)"
echo "-------------------------------------------"
echo "Command:"
echo 'curl -X POST '$BASE_URL'/api/conversation/sessions/'$SESSION_ID'/chat/ \'
echo '  -H "Content-Type: application/json" \'
echo '  -d '"'"'{"message": "tạo cho tôi một bức ảnh về hoàng hôn trên núi"}'"'"
echo ""
echo "Executing..."
CHAT_RESPONSE=$(curl -s -X POST $BASE_URL/api/conversation/sessions/$SESSION_ID/chat/ \
  -H "Content-Type: application/json" \
  -d '{"message": "tạo cho tôi một bức ảnh về hoàng hôn trên núi"}')

echo "Response:"
echo "$CHAT_RESPONSE" | python3 -m json.tool
echo ""

# Extract task_id
TASK_ID=$(echo $CHAT_RESPONSE | python3 -c "import sys, json; data=json.load(sys.stdin); print(data.get('result', {}).get('task_id', ''))")

if [ ! -z "$TASK_ID" ]; then
    echo "✅ Task created: $TASK_ID"
    echo ""
    
    # Poll for completion
    echo "STEP 3: Poll Task Status (wait for completion)"
    echo "-----------------------------------------------"
    echo "Polling every 3 seconds..."
    
    for i in {1..20}; do
        echo "Attempt $i/20..."
        
        POLL_RESPONSE=$(curl -s -X GET "$BASE_URL/api/image-generation/tasks/$TASK_ID/")
        STATUS=$(echo $POLL_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('status', ''))")
        
        echo "Status: $STATUS"
        
        if [ "$STATUS" == "COMPLETED" ]; then
            echo ""
            echo "✅ Generation completed!"
            echo ""
            echo "Full Response:"
            echo "$POLL_RESPONSE" | python3 -m json.tool
            echo ""
            
            # Extract image URLs
            UPLOADED_URLS=$(echo $POLL_RESPONSE | python3 -c "import sys, json; urls=json.load(sys.stdin).get('uploaded_urls', []); print('\n'.join(urls))")
            
            if [ ! -z "$UPLOADED_URLS" ]; then
                echo "🖼️  Generated Images:"
                echo "$UPLOADED_URLS"
            fi
            
            break
        elif [ "$STATUS" == "FAILED" ]; then
            echo "❌ Generation failed"
            echo "$POLL_RESPONSE" | python3 -m json.tool
            break
        fi
        
        sleep 3
    done
else
    echo "⚠️  No task_id returned (might be non-generation intent)"
fi

echo ""
echo ""

# ============================================================================
# TEST 2: DIRECT IMAGE GENERATION
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 TEST 2: DIRECT IMAGE GENERATION (without conversation)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

echo "Command:"
echo 'curl -X POST '$BASE_URL'/api/image-generation/ \'
echo '  -H "Content-Type: application/json" \'
echo '  -d '"'"'{
    "prompt": "a beautiful cat sitting on a couch",
    "user_id": "test_user_456",
    "model": "realism",
    "aspect_ratio": "square_1_1",
    "resolution": "2k"
}'"'"
echo ""
echo "Executing..."

GENERATE_RESPONSE=$(curl -s -X POST $BASE_URL/api/image-generation/ \
  -H "Content-Type: application/json" \
  -d '{
    "prompt": "a beautiful cat sitting on a couch",
    "user_id": "test_user_456",
    "model": "realism",
    "aspect_ratio": "square_1_1",
    "resolution": "2k"
}')

echo "Response:"
echo "$GENERATE_RESPONSE" | python3 -m json.tool
echo ""

GEN_TASK_ID=$(echo $GENERATE_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('task_id', ''))")

if [ ! -z "$GEN_TASK_ID" ]; then
    echo "✅ Generation task created: $GEN_TASK_ID"
    echo ""
    echo "To check status, run:"
    echo "curl -X GET $BASE_URL/api/image-generation/tasks/$GEN_TASK_ID/ | python3 -m json.tool"
fi

echo ""
echo ""

# ============================================================================
# TEST 3: OTHER AI FEATURES
# ============================================================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 TEST 3: OTHER AI FEATURES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Upscale
echo "3.1 UPSCALE"
echo "-----------"
echo "curl -X POST $BASE_URL/api/upscale/ \\"
echo '  -H "Content-Type: application/json" \'
echo '  -d '"'"'{
    "image_url": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400",
    "user_id": "test_user_789",
    "sharpen": 0.5
}'"'"
echo ""

# Remove Background
echo "3.2 REMOVE BACKGROUND"
echo "---------------------"
echo "curl -X POST $BASE_URL/api/remove-background/ \\"
echo '  -H "Content-Type: application/json" \'
echo '  -d '"'"'{
    "image_url": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400",
    "user_id": "test_user_101"
}'"'"
echo ""

# Relight
echo "3.3 RELIGHT"
echo "-----------"
echo "curl -X POST $BASE_URL/api/relight/ \\"
echo '  -H "Content-Type: application/json" \'
echo '  -d '"'"'{
    "image_url": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400",
    "prompt": "add warm sunset lighting",
    "user_id": "test_user_202",
    "style": "standard"
}'"'"
echo ""

# Reimagine
echo "3.4 REIMAGINE"
echo "-------------"
echo "curl -X POST $BASE_URL/api/reimagine/ \\"
echo '  -H "Content-Type: application/json" \'
echo '  -d '"'"'{
    "image_url": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400",
    "prompt": "make it more vibrant",
    "user_id": "test_user_303",
    "imagination": "subtle"
}'"'"
echo ""

# Image Expand
echo "3.5 IMAGE EXPAND"
echo "----------------"
echo "curl -X POST $BASE_URL/api/image-expand/ \\"
echo '  -H "Content-Type: application/json" \'
echo '  -d '"'"'{
    "image_url": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400",
    "prompt": "extend with mountains",
    "user_id": "test_user_404",
    "left": 100,
    "right": 100
}'"'"
echo ""

# Style Transfer
echo "3.6 STYLE TRANSFER"
echo "------------------"
echo "curl -X POST $BASE_URL/api/style-transfer/ \\"
echo '  -H "Content-Type: application/json" \'
echo '  -d '"'"'{
    "image_url": "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400",
    "reference_image": "https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=400",
    "user_id": "test_user_505",
    "style_strength": 0.75
}'"'"
echo ""

echo ""
echo "================================================================================================"
echo "✅ ALL COMMANDS LISTED"
echo "================================================================================================"
echo ""
echo "💡 TIP: Copy individual commands above to test specific features"
echo ""
