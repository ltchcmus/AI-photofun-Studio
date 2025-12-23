#!/bin/bash

# Simple Parameter Extraction Test
# Tests the prompt service parameter extraction without calling Freepik

BASE_URL="http://localhost:9999/v1/prompt/test-extract"

echo "=========================================="
echo "Parameter Extraction Test"
echo "=========================================="
echo ""

# Test function
test() {
    local name="$1"
    local prompt="$2"
    
    echo "Test: $name"
    echo "Prompt: \"$prompt\""
    
    response=$(curl -s -X POST "$BASE_URL" \
        -H "Content-Type: application/json" \
        -d "{\"prompt\": \"$prompt\"}")
    
    # Extract key fields
    intent=$(echo "$response" | jq -r '.result.intent // "error"')
    params=$(echo "$response" | jq -c '.result.extracted_params // {}')
    refined=$(echo "$response" | jq -r '.result.refined_prompt // "error"' | cut -c1-60)
    
    echo "→ Intent: $intent"
    echo "→ Params: $params"
    echo "→ Refined: $refined..."
    echo ""
}

# Run tests
test "Image Gen - Landscape" "Create a beautiful landscape sunset photo"
test "Image Gen - Realistic" "Generate a realistic photo of a cat"
test "Upscale - Photo" "Upscale this photo with more clarity"
test "Upscale - Artwork" "Enhance this illustration and make it sharper"
test "Reimagine - Subtle" "Reimagine this with subtle variations"
test "Reimagine - Creative" "Make this image more creative and imaginative"
test "Reimagine - Wild" "Go wild with this image transformation"
test "Relight - Dramatic" "Add dramatic moody lighting to this scene"
test "Relight - Bright" "Make this image brighter with more light"
test "Style Transfer - Portrait" "Transform this portrait to anime style"
test "Image Expand - Left" "Expand the image to the left side"
test "Image Expand - All" "Expand this image in all directions"
test "Vietnamese - Upscale" "Làm rõ nét ảnh chụp này"
test "Vietnamese - Reimagine" "Tưởng tượng lại ảnh này sáng tạo hơn"

echo "=========================================="
echo "Tests Complete!"
echo "=========================================="
