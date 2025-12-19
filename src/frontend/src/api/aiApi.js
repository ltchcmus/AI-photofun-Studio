import axios from "axios";

// Base URL for AI backend
const AI_BASE_URL = "http://localhost:9999";

// Create a dedicated axios instance for AI API
const aiClient = axios.create({
    baseURL: AI_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
});

// Generate a unique session ID
const getSessionId = () => {
    let sessionId = localStorage.getItem("ai_session_id");
    if (!sessionId) {
        sessionId = "web_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
        localStorage.setItem("ai_session_id", sessionId);
    }
    return sessionId;
};

/**
 * Poll for task status until completion or failure
 * @param {string} taskId - The task ID to poll
 * @param {string} endpoint - The endpoint to poll (e.g., "v1/features/image-generation")
 * @param {function} onStatusUpdate - Callback for status updates
 * @param {number} maxAttempts - Maximum polling attempts (default: 60)
 * @param {number} interval - Polling interval in ms (default: 3000)
 * @returns {Promise<object>} - The final result
 */
export const pollTaskStatus = async (
    taskId,
    endpoint,
    onStatusUpdate = () => { },
    maxAttempts = 60,
    interval = 3000
) => {
    const sessionId = getSessionId();

    for (let i = 1; i <= maxAttempts; i++) {
        try {
            const response = await aiClient.get(
                `/${endpoint}/status/${taskId}/?user_id=${sessionId}`
            );
            const data = response.data;
            const status = data.result?.status;

            onStatusUpdate(status, i, data);

            if (status === "COMPLETED") {
                return {
                    success: true,
                    imageUrl: data.result?.image_url || data.result?.output_url,
                    data: data.result,
                };
            }

            if (status === "FAILED") {
                return {
                    success: false,
                    error: data.result?.error || "Task failed",
                    data: data.result,
                };
            }
        } catch (err) {
            console.error(`Polling error (attempt ${i}):`, err.message);
        }

        await new Promise((resolve) => setTimeout(resolve, interval));
    }

    return {
        success: false,
        error: "Timeout waiting for task completion",
    };
};

/**
 * Generate image from text prompt
 * @param {object} params - Generation parameters
 * @param {string} params.prompt - Text prompt for image generation
 * @param {string} params.model - Model to use ("realism" or "artistic")
 * @param {string} params.aspectRatio - Aspect ratio (e.g., "16:9", "1:1")
 * @returns {Promise<object>} - Task ID and initial response
 */
export const generateImage = async ({ prompt, model = "realism", aspectRatio = "1:1" }) => {
    const sessionId = getSessionId();

    try {
        const response = await aiClient.post("/v1/features/image-generation/", {
            user_id: sessionId,
            prompt,
            model,
            aspect_ratio: aspectRatio,
            session_id: sessionId,
        });

        const data = response.data;
        const taskId = data.result?.task_id;

        if (taskId) {
            return {
                success: true,
                taskId,
                data: data.result,
            };
        } else {
            return {
                success: false,
                error: "No task ID received",
                data: data.result,
            };
        }
    } catch (err) {
        return {
            success: false,
            error: err.response?.data?.message || err.message,
        };
    }
};

/**
 * Remove background from image
 * @param {string} imageUrl - URL of the image to process
 * @returns {Promise<object>} - Result with processed image URL
 */
export const removeBackground = async (imageUrl) => {
    const sessionId = getSessionId();

    try {
        const response = await aiClient.post("/v1/features/remove-background/", {
            user_id: sessionId,
            image_url: imageUrl,
            session_id: sessionId,
        });

        const data = response.data;

        if (data.result?.image_url) {
            return {
                success: true,
                imageUrl: data.result.image_url,
                data: data.result,
            };
        } else if (data.result?.task_id) {
            // If it returns a task ID, we need to poll
            return {
                success: true,
                taskId: data.result.task_id,
                needsPolling: true,
                data: data.result,
            };
        } else {
            return {
                success: false,
                error: "No result received",
                data: data.result,
            };
        }
    } catch (err) {
        return {
            success: false,
            error: err.response?.data?.message || err.message,
        };
    }
};

/**
 * Upload image to get a URL (helper function)
 * For local files, we need to upload to a file service first
 * @param {File} file - The file to upload
 * @returns {Promise<string>} - The uploaded file URL
 */
export const uploadImageForAI = async (file) => {
    const formData = new FormData();
    formData.append("file", file);

    try {
        const response = await axios.post("/api/file-upload", formData, {
            headers: {
                "Content-Type": "multipart/form-data",
            },
        });

        // Adjust based on your file service response structure
        return {
            success: true,
            url: response.data?.url || response.data?.file_url || response.data?.data?.url,
        };
    } catch (err) {
        return {
            success: false,
            error: err.response?.data?.message || err.message,
        };
    }
};

export default {
    generateImage,
    removeBackground,
    pollTaskStatus,
    uploadImageForAI,
    getSessionId,
};
