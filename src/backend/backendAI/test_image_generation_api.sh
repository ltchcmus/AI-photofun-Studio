#!/bin/bash

# =============================================================================
# Test Image Generation API
# Test direct image generation feature without conversation
# =============================================================================

BASE_URL="http://localhost:9999"
USER_ID="test_direct_$(date +%s)"

echo "════════════════════════════════════════════════════════════════════════════════"
echo "🚀 IMAGE GENERATION API TEST"
echo "════════════════════════════════════════════════════════════════════════════════"
echo ""
echo "📝 Test Configuration:"
echo "   Base URL: $BASE_URL"
echo "   User ID: $USER_ID"
echo ""

# =============================================================================
# STEP 1: Generate Image
# =============================================================================
echo "════════════════════════════════════════════════════════════════════════════════"
echo "📍 STEP 1: Generate Image with Mystic API"
echo "════════════════════════════════════════════════════════════════════════════════"
echo ""

PROMPT="a beautiful sunset over mountains with vibrant colors"

echo "📤 REQUEST:"
echo "   POST $BASE_URL/v1/features/image-generation/"
echo "   Content-Type: application/json"
echo ""
echo "   Body:"
cat << EOF | jq '.'
{
  "prompt": "$PROMPT",
  "user_id": "$USER_ID",
  "aspect_ratio": "square_1_1",
  "model": "realism",
  "resolution": "2k"
}
EOF
echo ""

echo "⏳ Sending request..."
echo ""

GENERATION_RESPONSE=$(curl -s -X POST "$BASE_URL/v1/features/image-generation/" \
  -H "Content-Type: application/json" \
  -d "{\"prompt\":\"$PROMPT\",\"user_id\":\"$USER_ID\",\"aspect_ratio\":\"square_1_1\",\"model\":\"realism\",\"resolution\":\"2k\"}")

echo "📥 RESPONSE:"
echo "$GENERATION_RESPONSE" | jq '.'
echo ""

# Extract key information
TASK_ID=$(echo "$GENERATION_RESPONSE" | jq -r '.result.task_id // .data.task_id // .task_id // empty')
STATUS=$(echo "$GENERATION_RESPONSE" | jq -r '.result.status // .data.status // .status // empty')
REFINED_PROMPT=$(echo "$GENERATION_RESPONSE" | jq -r '.result.refined_prompt // .data.refined_prompt // .refined_prompt // empty')
UPLOADED_URLS=$(echo "$GENERATION_RESPONSE" | jq -r '.result.uploaded_urls // .data.uploaded_urls // .uploaded_urls // empty')

echo "✅ Generation request sent"
echo "   Task ID: $TASK_ID"
echo "   Status: $STATUS"
echo "   Original Prompt: $PROMPT"
echo "   Refined Prompt: ${REFINED_PROMPT:0:80}..."
echo ""

if [ "$STATUS" == "COMPLETED" ] && [ "$UPLOADED_URLS" != "null" ] && [ "$UPLOADED_URLS" != "[]" ]; then
    echo "🎉 Image generated synchronously!"
    echo ""
    echo "📤 Uploaded URLs:"
    echo "$GENERATION_RESPONSE" | jq -r '.uploaded_urls[] // .data.uploaded_urls[]' | while read url; do
        echo "   - $url"
    done
    echo ""
    
    read -p "⏸️  Press Enter to continue to gallery check..."
    echo ""
else
    echo "⏳ Image generation is async. Polling for completion..."
    echo ""
    
    if [ -z "$TASK_ID" ] || [ "$TASK_ID" == "null" ]; then
        echo "❌ No task_id returned. Cannot poll for status."
        exit 1
    fi
    
    read -p "⏸️  Press Enter to start polling..."
    echo ""
    
    # =============================================================================
    # STEP 2: Poll Task Status
    # =============================================================================
    echo "════════════════════════════════════════════════════════════════════════════════"
    echo "📍 STEP 2: Poll Task Status"
    echo "════════════════════════════════════════════════════════════════════════════════"
    echo ""
    
    MAX_ATTEMPTS=20
    ATTEMPT=1
    
    while [ $ATTEMPT -le $MAX_ATTEMPTS ]; do
        echo "📤 REQUEST (Attempt $ATTEMPT/$MAX_ATTEMPTS):"
        echo "   GET $BASE_URL/v1/features/image-generation/status/$TASK_ID/"
        echo ""
        
        POLL_RESPONSE=$(curl -s -X GET "$BASE_URL/v1/features/image-generation/status/$TASK_ID/")
        
        echo "📥 RESPONSE:"
        echo "$POLL_RESPONSE" | jq '.'
        echo ""
        
        CURRENT_STATUS=$(echo "$POLL_RESPONSE" | jq -r '.result.status // .data.status // .status // empty')
        
        echo "   Status: $CURRENT_STATUS"
        echo ""
        
        if [ "$CURRENT_STATUS" == "COMPLETED" ]; then
            echo "✅ Generation completed!"
            echo ""
            
            UPLOADED_URLS=$(echo "$POLL_RESPONSE" | jq -r '.result.uploaded_urls // .data.uploaded_urls // .uploaded_urls // empty')
            
            if [ "$UPLOADED_URLS" != "null" ] && [ "$UPLOADED_URLS" != "[]" ]; then
                echo "📤 Uploaded URLs:"
                echo "$POLL_RESPONSE" | jq -r '.uploaded_urls[] // .data.uploaded_urls[]' | while read url; do
                    echo "   - $url"
                done
                echo ""
            fi
            
            break
        elif [ "$CURRENT_STATUS" == "FAILED" ]; then
            echo "❌ Generation failed!"
            exit 1
        fi
        
        if [ $ATTEMPT -eq $MAX_ATTEMPTS ]; then
            echo "⚠️ Max polling attempts reached. Image may still be generating."
            echo ""
        else
            echo "⏳ Waiting 3 seconds before next poll..."
            sleep 3
            echo ""
        fi
        
        ATTEMPT=$((ATTEMPT + 1))
    done
fi

read -p "⏸️  Press Enter to check gallery..."
echo ""

# =============================================================================
# STEP 3: Check Image Gallery
# =============================================================================
echo "════════════════════════════════════════════════════════════════════════════════"
echo "📍 STEP 3: Check Image Gallery"
echo "════════════════════════════════════════════════════════════════════════════════"
echo ""

echo "📤 REQUEST:"
echo "   GET $BASE_URL/v1/gallery/?user_id=$USER_ID&intent=image_generation"
echo ""

echo "⏳ Sending request..."
echo ""

GALLERY_RESPONSE=$(curl -s -X GET "$BASE_URL/v1/gallery/?user_id=$USER_ID&intent=image_generation")

echo "📥 RESPONSE:"
echo "$GALLERY_RESPONSE" | jq '.'
echo ""

IMAGE_COUNT=$(echo "$GALLERY_RESPONSE" | jq '.result | length // .results | length // .data | length // 0')

echo "✅ Gallery check completed"
echo "   Images found: $IMAGE_COUNT"
echo ""

if [ "$IMAGE_COUNT" -gt 0 ]; then
    echo "📸 Latest image details:"
    echo "$GALLERY_RESPONSE" | jq '.results[0] // .data[0] // empty' | while IFS= read -r line; do
        echo "   $line"
    done
    echo ""
    
    # Extract and display image URL
    IMAGE_URL=$(echo "$GALLERY_RESPONSE" | jq -r '.results[0].image_url // .data[0].image_url // empty')
    if [ -n "$IMAGE_URL" ] && [ "$IMAGE_URL" != "null" ]; then
        echo "🖼️  Image URL:"
        echo "   $IMAGE_URL"
        echo ""
        echo "🔍 Verify image (copy URL and open in browser):"
        echo "   $IMAGE_URL"
        echo ""
    fi
fi

# =============================================================================
# SUMMARY
# =============================================================================
echo "════════════════════════════════════════════════════════════════════════════════"
echo "✅ TEST SUMMARY"
echo "════════════════════════════════════════════════════════════════════════════════"
echo ""
echo "   ✅ Step 1: Image generation requested"
echo "   ✅ Step 2: Task polling completed"
echo "   ✅ Step 3: Gallery checked ($IMAGE_COUNT images found)"
echo ""
echo "🎉 Image generation API test completed!"
echo ""
