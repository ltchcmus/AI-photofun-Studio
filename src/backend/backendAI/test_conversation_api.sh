#!/bin/bash

# =============================================================================
# Test Conversation Flow API
# Test conversation service with session creation and chat
# =============================================================================

BASE_URL="http://localhost:9999"
USER_ID="test_user_$(date +%s)"

echo "════════════════════════════════════════════════════════════════════════════════"
echo "🚀 CONVERSATION FLOW TEST"
echo "════════════════════════════════════════════════════════════════════════════════"
echo ""
echo "📝 Test Configuration:"
echo "   Base URL: $BASE_URL"
echo "   User ID: $USER_ID"
echo ""

# =============================================================================
# STEP 1: Create Session
# =============================================================================
echo "════════════════════════════════════════════════════════════════════════════════"
echo "📍 STEP 1: Create Conversation Session"
echo "════════════════════════════════════════════════════════════════════════════════"
echo ""

echo "📤 REQUEST:"
echo "   POST $BASE_URL/api/v1/chat/sessions"
echo "   Content-Type: application/json"
echo ""
echo "   Body:"
cat << EOF | jq '.'
{
  "user_id": "$USER_ID"
}
EOF
echo ""

echo "⏳ Sending request..."
echo ""

SESSION_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/chat/sessions" \
  -H "Content-Type: application/json" \
  -d "{\"user_id\":\"$USER_ID\"}")

echo "📥 RESPONSE:"
echo "$SESSION_RESPONSE" | jq '.'
echo ""

# Extract session_id
SESSION_ID=$(echo "$SESSION_RESPONSE" | jq -r '.result.session_id // .data.session_id // .session_id // empty')

if [ -z "$SESSION_ID" ] || [ "$SESSION_ID" == "null" ]; then
    echo "❌ Failed to create session or extract session_id"
    echo "Response: $SESSION_RESPONSE"
    exit 1
fi

echo "✅ Session created successfully"
echo "   Session ID: $SESSION_ID"
echo ""

read -p "⏸️  Press Enter to continue to next step..."
echo ""

# =============================================================================
# STEP 2: Send Chat Message (Text to Image)
# =============================================================================
echo "════════════════════════════════════════════════════════════════════════════════"
echo "📍 STEP 2: Send Chat Message - Generate Image"
echo "════════════════════════════════════════════════════════════════════════════════"
echo ""

CHAT_MESSAGE="generate a cat on the beach"

echo "📤 REQUEST:"
echo "   POST $BASE_URL/api/v1/chat/sessions/$SESSION_ID/messages"
echo "   Content-Type: application/json"
echo ""
echo "   Body:"
cat << EOF | jq '.'
{
  "user_id": "$USER_ID",
  "prompt": "$CHAT_MESSAGE"
}
EOF
echo ""

echo "⏳ Sending request..."
echo ""

CHAT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/v1/chat/sessions/$SESSION_ID/messages" \
  -H "Content-Type: application/json" \
  -d "{\"user_id\":\"$USER_ID\",\"prompt\":\"$CHAT_MESSAGE\"}")

echo "📥 RESPONSE:"
echo "$CHAT_RESPONSE" | jq '.'
echo ""

# Extract key information
MESSAGE_ID=$(echo "$CHAT_RESPONSE" | jq -r '.result.message_id // .data.message_id // .message_id // empty')
STATUS=$(echo "$CHAT_RESPONSE" | jq -r '.result.status // .data.status // .status // empty')

echo "✅ Chat message sent"
echo "   Message ID: $MESSAGE_ID"
echo "   Status: $STATUS"
echo ""

if [ -z "$MESSAGE_ID" ] || [ "$MESSAGE_ID" == "null" ]; then
    echo "❌ Failed to get message_id from response"
    exit 1
fi

read -p "⏸️  Press Enter to start polling message status..."
echo ""

# =============================================================================
# STEP 2.5: Poll Message Status
# =============================================================================
echo "════════════════════════════════════════════════════════════════════════════════"
echo "📍 STEP 2.5: Poll Message Status Until Completed"
echo "════════════════════════════════════════════════════════════════════════════════"
echo ""

MAX_ATTEMPTS=30
ATTEMPT=1
CURRENT_STATUS="PROCESSING"

while [ $ATTEMPT -le $MAX_ATTEMPTS ] && [ "$CURRENT_STATUS" == "PROCESSING" ]; do
    echo "📤 REQUEST (Attempt $ATTEMPT/$MAX_ATTEMPTS):"
    echo "   GET $BASE_URL/api/v1/chat/sessions/$SESSION_ID"
    echo ""
    
    POLL_RESPONSE=$(curl -s -X GET "$BASE_URL/api/v1/chat/sessions/$SESSION_ID")
    
    echo "📥 RESPONSE:"
    echo "$POLL_RESPONSE" | jq '.'
    echo ""
    
    # Find the message with our message_id and extract its status
    CURRENT_STATUS=$(echo "$POLL_RESPONSE" | jq -r ".result.messages[] | select(.message_id == \"$MESSAGE_ID\") | .status // empty")
    
    if [ -z "$CURRENT_STATUS" ]; then
        CURRENT_STATUS="UNKNOWN"
    fi
    
    echo "   Current Status: $CURRENT_STATUS"
    
    if [ "$CURRENT_STATUS" == "COMPLETED" ]; then
        echo "✅ Message processing completed!"
        
        # Extract the completed message details
        COMPLETED_MESSAGE=$(echo "$POLL_RESPONSE" | jq ".result.messages[] | select(.message_id == \"$MESSAGE_ID\")")
        echo ""
        echo "📋 Completed Message Details:"
        echo "$COMPLETED_MESSAGE" | jq '.'
        echo ""
        
        # Extract uploaded URLs if available
        UPLOADED_URLS=$(echo "$COMPLETED_MESSAGE" | jq -r '.uploaded_urls // empty')
        if [ ! -z "$UPLOADED_URLS" ] && [ "$UPLOADED_URLS" != "null" ]; then
            echo "🖼️  Generated Image URLs:"
            echo "$UPLOADED_URLS" | jq -r '.[]' 2>/dev/null || echo "$UPLOADED_URLS"
            echo ""
        fi
        
        break
    elif [ "$CURRENT_STATUS" == "FAILED" ] || [ "$CURRENT_STATUS" == "ERROR" ]; then
        echo "❌ Message processing failed"
        
        # Extract error message
        ERROR_MSG=$(echo "$POLL_RESPONSE" | jq -r ".result.messages[] | select(.message_id == \"$MESSAGE_ID\") | .content // .prompt // .error.message // \"Unknown error\"")
        echo "   Error: $ERROR_MSG"
        echo ""
        break
    fi
    
    if [ $ATTEMPT -lt $MAX_ATTEMPTS ]; then
        echo "   ⏳ Waiting 3 seconds before next poll..."
        sleep 3
    fi
    
    ATTEMPT=$((ATTEMPT + 1))
    echo ""
done

if [ "$CURRENT_STATUS" == "PROCESSING" ]; then
    echo "⚠️  Max polling attempts reached, message still processing"
fi

read -p "⏸️  Press Enter to continue to next step..."
echo ""

# =============================================================================
# STEP 3: Get Session History
# =============================================================================
echo "════════════════════════════════════════════════════════════════════════════════"
echo "📍 STEP 3: Get Session History"
echo "════════════════════════════════════════════════════════════════════════════════"
echo ""

echo "📤 REQUEST:"
echo "   GET $BASE_URL/api/v1/chat/sessions/$SESSION_ID"
echo ""

echo "⏳ Sending request..."
echo ""

HISTORY_RESPONSE=$(curl -s -X GET "$BASE_URL/api/v1/chat/sessions/$SESSION_ID")

echo "📥 RESPONSE:"
echo "$HISTORY_RESPONSE" | jq '.'
echo ""

MESSAGE_COUNT=$(echo "$HISTORY_RESPONSE" | jq '.result.messages | length // .data.messages | length // .messages | length // 0')

echo "✅ History retrieved"
echo "   Total messages: $MESSAGE_COUNT"
echo ""

read -p "⏸️  Press Enter to continue to next step..."
echo ""

# =============================================================================
# SUMMARY
# =============================================================================
echo "════════════════════════════════════════════════════════════════════════════════"
echo "✅ TEST SUMMARY"
echo "════════════════════════════════════════════════════════════════════════════════"
echo ""
echo "   ✅ Step 1: Session created (ID: $SESSION_ID)"
echo "   ✅ Step 2: Message sent and polled (Message ID: $MESSAGE_ID)"
echo "   ✅ Step 2.5: Message status: $CURRENT_STATUS"
echo "   ✅ Step 3: History retrieved ($MESSAGE_COUNT messages)"
echo ""
echo "🎉 Conversation flow test completed!"
echo ""
echo "💡 To test another message (like upscale), you can run:"
echo "   curl -X POST $BASE_URL/api/v1/chat/sessions/$SESSION_ID/messages \\"
echo "     -H 'Content-Type: application/json' \\"
echo "     -d '{\"user_id\":\"$USER_ID\",\"prompt\":\"upscale the image\"}' | jq '.'"
echo ""
