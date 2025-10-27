#!/bin/bash
# HTTP API Test Script
# Test các endpoints qua REST API

BASE_URL="http://localhost:8000"
API_V1="${BASE_URL}/api/v1"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_step() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}BƯỚC $1: $2${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}📝 $1${NC}"
}

# Check if server is running
check_server() {
    print_step "0" "Kiểm tra server"
    
    if curl -s "${BASE_URL}/admin/" > /dev/null 2>&1; then
        print_success "Server đang chạy tại ${BASE_URL}"
        return 0
    else
        print_error "Server không chạy! Hãy chạy: python manage.py runserver"
        exit 1
    fi
}

# Test 1: Prompt Refinement Service
test_prompt_refinement() {
    print_step "1" "Test Prompt Refinement Service"
    
    print_info "POST ${API_V1}/prompt-refinement/refine/"
    
    # Test case 1: Simple prompt
    echo -e "\n${YELLOW}Test 1.1: Simple prompt${NC}"
    RESPONSE=$(curl -s -X POST "${API_V1}/prompt-refinement/refine/" \
        -H "Content-Type: application/json" \
        -d '{
            "original_prompt": "a cat",
            "context": {
                "style": "realistic",
                "quality": "high"
            },
            "method": "rule_based"
        }')
    
    if echo "$RESPONSE" | jq -e '.refined_prompt' > /dev/null 2>&1; then
        print_success "Prompt refinement successful"
        echo "$RESPONSE" | jq '.'
    else
        print_error "Prompt refinement failed"
        echo "$RESPONSE"
    fi
    
    # Test case 2: Complex prompt
    echo -e "\n${YELLOW}Test 1.2: Complex prompt${NC}"
    RESPONSE=$(curl -s -X POST "${API_V1}/prompt-refinement/refine/" \
        -H "Content-Type: application/json" \
        -d '{
            "original_prompt": "beautiful landscape with mountains",
            "context": {
                "style": "cinematic",
                "quality": "masterpiece"
            }
        }')
    
    if echo "$RESPONSE" | jq -e '.refined_prompt' > /dev/null 2>&1; then
        print_success "Complex prompt refinement successful"
        REFINED=$(echo "$RESPONSE" | jq -r '.refined_prompt')
        echo "  Original: 'beautiful landscape with mountains'"
        echo "  Refined:  '${REFINED}'"
    else
        print_error "Complex prompt refinement failed"
    fi
}

# Test 2: Validate Prompt
test_validate_prompt() {
    print_step "2" "Test Prompt Validation"
    
    print_info "POST ${API_V1}/prompt-refinement/validate/"
    
    # Test case 1: Valid prompt
    echo -e "\n${YELLOW}Test 2.1: Valid prompt${NC}"
    RESPONSE=$(curl -s -X POST "${API_V1}/prompt-refinement/validate/" \
        -H "Content-Type: application/json" \
        -d '{
            "prompt": "a beautiful sunset over mountains, high quality, detailed"
        }')
    
    if echo "$RESPONSE" | jq -e '.is_valid' > /dev/null 2>&1; then
        IS_VALID=$(echo "$RESPONSE" | jq -r '.is_valid')
        if [ "$IS_VALID" = "true" ]; then
            print_success "Prompt is valid"
        else
            print_info "Prompt validation returned false (expected for some prompts)"
        fi
        echo "$RESPONSE" | jq '.'
    else
        print_error "Validation failed"
    fi
    
    # Test case 2: Empty prompt (should be invalid)
    echo -e "\n${YELLOW}Test 2.2: Empty prompt (should be invalid)${NC}"
    RESPONSE=$(curl -s -X POST "${API_V1}/prompt-refinement/validate/" \
        -H "Content-Type: application/json" \
        -d '{
            "prompt": ""
        }')
    
    IS_VALID=$(echo "$RESPONSE" | jq -r '.is_valid')
    if [ "$IS_VALID" = "false" ]; then
        print_success "Empty prompt correctly rejected"
    else
        print_error "Empty prompt should be invalid"
    fi
}

# Test 3: Extract Negative Prompt
test_extract_negative() {
    print_step "3" "Test Extract Negative Prompt"
    
    print_info "POST ${API_V1}/prompt-refinement/extract-negative/"
    
    RESPONSE=$(curl -s -X POST "${API_V1}/prompt-refinement/extract-negative/" \
        -H "Content-Type: application/json" \
        -d '{
            "prompt": "a beautiful cat, high quality, NOT blurry, WITHOUT watermark"
        }')
    
    if echo "$RESPONSE" | jq -e '.positive_prompt' > /dev/null 2>&1; then
        print_success "Negative prompt extraction successful"
        POSITIVE=$(echo "$RESPONSE" | jq -r '.positive_prompt')
        NEGATIVE=$(echo "$RESPONSE" | jq -r '.negative_prompt')
        echo "  Positive: '${POSITIVE}'"
        echo "  Negative: '${NEGATIVE}'"
    else
        print_error "Extraction failed"
    fi
}

# Test 4: Get Prompt Templates
test_get_templates() {
    print_step "4" "Test Get Prompt Templates"
    
    print_info "GET ${API_V1}/prompt-refinement/templates/"
    
    RESPONSE=$(curl -s -X GET "${API_V1}/prompt-refinement/templates/?category=portrait")
    
    if echo "$RESPONSE" | jq -e '.[0]' > /dev/null 2>&1; then
        print_success "Templates retrieved successfully"
        COUNT=$(echo "$RESPONSE" | jq '. | length')
        echo "  Found ${COUNT} templates"
        echo "$RESPONSE" | jq '.[0]' 2>/dev/null
    else
        print_info "No templates found (this is OK if database is empty)"
    fi
}

# Test 5: Image Generation Service
test_image_generation() {
    print_step "5" "Test Image Generation Service"
    
    print_info "POST ${API_V1}/image-generation/generate/"
    
    echo -e "\n${YELLOW}Test 5.1: Generate single image${NC}"
    RESPONSE=$(curl -s -X POST "${API_V1}/image-generation/generate/" \
        -H "Content-Type: application/json" \
        -d '{
            "prompt": "a beautiful sunset over mountains, high quality, detailed, 8k",
            "negative_prompt": "blurry, low quality",
            "width": 512,
            "height": 512,
            "num_inference_steps": 30,
            "guidance_scale": 7.5
        }')
    
    if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
        SUCCESS=$(echo "$RESPONSE" | jq -r '.success')
        if [ "$SUCCESS" = "true" ]; then
            print_success "Image generation successful"
            REQUEST_ID=$(echo "$RESPONSE" | jq -r '.request_id')
            echo "  Request ID: ${REQUEST_ID}"
            echo "$RESPONSE" | jq '.metadata'
        else
            print_error "Image generation failed"
            echo "$RESPONSE" | jq '.'
        fi
    else
        print_error "Invalid response"
        echo "$RESPONSE"
    fi
}

# Test 6: Image Generation - Invalid Parameters
test_image_generation_invalid() {
    print_step "6" "Test Image Generation - Invalid Parameters"
    
    print_info "POST ${API_V1}/image-generation/generate/ (with invalid params)"
    
    echo -e "\n${YELLOW}Test 6.1: Invalid width (not multiple of 64)${NC}"
    RESPONSE=$(curl -s -X POST "${API_V1}/image-generation/generate/" \
        -H "Content-Type: application/json" \
        -d '{
            "prompt": "test",
            "width": 500,
            "height": 512
        }')
    
    if echo "$RESPONSE" | jq -e '.success == false' > /dev/null 2>&1; then
        print_success "Invalid parameters correctly rejected"
        ERROR=$(echo "$RESPONSE" | jq -r '.error')
        echo "  Error: ${ERROR}"
    else
        print_error "Invalid parameters should be rejected"
    fi
}

# Test 7: AI Gateway - Full Pipeline
test_ai_gateway() {
    print_step "7" "Test AI Gateway - Full Pipeline"
    
    print_info "POST ${API_V1}/ai-gateway/chat/"
    
    echo -e "\n${YELLOW}Test 7.1: Image generation via Gateway${NC}"
    RESPONSE=$(curl -s -X POST "${API_V1}/ai-gateway/chat/" \
        -H "Content-Type: application/json" \
        -d '{
            "message": "Generate a beautiful sunset landscape with mountains",
            "session_id": "test-session-001",
            "context": {
                "style": "realistic",
                "quality": "high"
            }
        }')
    
    if echo "$RESPONSE" | jq -e '.success' > /dev/null 2>&1; then
        print_success "AI Gateway processed request successfully"
        echo "$RESPONSE" | jq '.pipeline_metadata'
    else
        print_error "AI Gateway processing failed"
        echo "$RESPONSE"
    fi
}

# Main execution
main() {
    echo -e "${BLUE}"
    echo "╔═══════════════════════════════════════════════════════════════╗"
    echo "║         AI PHOTOFUN STUDIO - HTTP API TEST                    ║"
    echo "╚═══════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    
    echo -e "${YELLOW}Testing architecture:${NC}"
    echo "  apps/"
    echo "  ├── prompt_refinement/      ← Standalone Service"
    echo "  ├── image_generation/       ← Standalone Service"
    echo "  └── ai_gateway/             ← Pure Orchestrator"
    
    # Check dependencies
    if ! command -v jq &> /dev/null; then
        print_error "jq is required but not installed. Install it with: sudo apt-get install jq"
        exit 1
    fi
    
    if ! command -v curl &> /dev/null; then
        print_error "curl is required but not installed."
        exit 1
    fi
    
    # Run tests
    check_server
    
    # Standalone Services Tests
    test_prompt_refinement
    test_validate_prompt
    test_extract_negative
    test_get_templates
    test_image_generation
    test_image_generation_invalid
    
    # AI Gateway Tests
    test_ai_gateway
    
    # Summary
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${GREEN}✅ All HTTP API tests completed!${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

# Run main function
main
