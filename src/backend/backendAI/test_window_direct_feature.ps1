# ==============================
# Test AI Features (Windows)
# ==============================

$BASE_URL = "http://localhost:9999"
$SESSION_ID = "direct_test_$(Get-Date -Format 'yyyyMMddHHmmss')"

Write-Host "======================================"
Write-Host "Testing All AI Features (Windows)"
Write-Host "======================================"
Write-Host "Session ID: $SESSION_ID"
Write-Host ""

$TEST_IMAGE_URL = "https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?w=800"

function Poll-Task {
    param (
        [string]$TaskId,
        [string]$Endpoint
    )

    $maxAttempts = 30

    Write-Host "Polling task: $TaskId"

    for ($i = 1; $i -le $maxAttempts; $i++) {
        Start-Sleep -Seconds 3

        try {
            $response = Invoke-RestMethod `
                -Method GET `
                -Uri "$BASE_URL/$Endpoint/status/$TaskId/?user_id=$SESSION_ID"

            $status = $response.result.status
            Write-Host "Attempt $i : Status = $status"

            if ($status -eq "COMPLETED") {
                Write-Host "Task completed"
                $response | ConvertTo-Json -Depth 10
                return $true
            }

            if ($status -eq "FAILED") {
                Write-Host "Task failed"
                $response | ConvertTo-Json -Depth 10
                return $false
            }

        } catch {
            Write-Host "Error polling task"
        }
    }

    Write-Host "Timeout waiting for task"
    return $false
}

# ==============================
# TEST 1: Image Generation
# ==============================

Write-Host ""
Write-Host "TEST 1: Image Generation"

$body = @{
    user_id      = $SESSION_ID
    prompt       = "A beautiful sunset over mountains, photorealistic"
    model        = "realism"
    aspect_ratio = "16:9"
    session_id   = $SESSION_ID
} | ConvertTo-Json

$response = Invoke-RestMethod `
    -Method POST `
    -Uri "$BASE_URL/v1/features/image-generation/" `
    -ContentType "application/json" `
    -Body $body

$response | ConvertTo-Json -Depth 10

$taskId = $response.result.task_id

if (-not $taskId) {
    Write-Host "No task_id returned"
    exit 1
}

if (-not (Poll-Task -TaskId $taskId -Endpoint "v1/features/image-generation")) {
    Write-Host "Image generation failed"
    exit 1
}

# ==============================
# TEST 2: Remove Background
# ==============================

Write-Host ""
Write-Host "TEST 2: Remove Background"

$body = @{
    user_id    = $SESSION_ID
    image_url = $TEST_IMAGE_URL
    session_id = $SESSION_ID
} | ConvertTo-Json

$response = Invoke-RestMethod `
    -Method POST `
    -Uri "$BASE_URL/v1/features/remove-background/" `
    -ContentType "application/json" `
    -Body $body

$response | ConvertTo-Json -Depth 10

if ($response.result.image_url) {
    Write-Host "Remove background OK"
    Write-Host $response.result.image_url
} else {
    Write-Host "Remove background failed"
}

Write-Host ""
Write-Host "All direct API tests completed"
