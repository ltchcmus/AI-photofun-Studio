import axios from "axios";

// Base URL for AI backend - use environment variable for production
const AI_BASE_URL = import.meta.env.VITE_AI_API_URL || "http://localhost:9999";

// File upload URL: production uses VITE_FILE_UPLOAD_URL, dev uses Vite proxy
const FILE_UPLOAD_BASE_URL = import.meta.env.VITE_FILE_UPLOAD_URL || "";

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
    sessionId =
      "web_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
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
  onStatusUpdate = () => {},
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
export const generateImage = async ({
  prompt,
  model = "realism",
  aspectRatio = "1:1",
}) => {
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

  // Production: VITE_FILE_UPLOAD_URL/api/v1/file/uploads
  // Dev: /api/file-upload (Vite proxy rewrites to file-service-cdal.onrender.com/api/v1/file/uploads)
  const uploadUrl = FILE_UPLOAD_BASE_URL
    ? `${FILE_UPLOAD_BASE_URL}/api/v1/file/uploads`
    : "/api/file-upload";

  try {
    const response = await axios.post(uploadUrl, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });

    // Adjust based on your file service response structure
    return {
      success: true,
      url:
        response.data?.url ||
        response.data?.file_url ||
        response.data?.data?.url,
    };
  } catch (err) {
    return {
      success: false,
      error: err.response?.data?.message || err.message,
    };
  }
};

/**
 * Upscale image to higher resolution
 * @param {object} params - Upscale parameters
 * @param {string} params.imageUrl - URL of image to upscale
 * @param {string} params.flavor - Upscale flavor: "photo", "sublime", "photo_denoiser"
 * @returns {Promise<object>} - Task ID for polling
 */
export const upscaleImage = async ({ imageUrl, flavor = "photo" }) => {
  const sessionId = getSessionId();

  try {
    const response = await aiClient.post("/v1/features/upscale/", {
      user_id: sessionId,
      image_url: imageUrl,
      flavor: flavor,
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
 * Reimagine image with new style
 * @param {object} params - Reimagine parameters
 * @param {string} params.imageUrl - URL of image to reimagine
 * @param {string} params.prompt - Optional guidance prompt
 * @param {string} params.imagination - Level: "subtle", "vivid", "wild"
 * @param {string} params.aspectRatio - Aspect ratio: "1:1", "16:9", "9:16", etc.
 * @returns {Promise<object>} - Task ID for polling
 */
export const reimagineImage = async ({
  imageUrl,
  prompt = "",
  imagination = "subtle",
  aspectRatio = "1:1",
}) => {
  const sessionId = getSessionId();

  try {
    const response = await aiClient.post("/v1/features/reimagine/", {
      user_id: sessionId,
      image_url: imageUrl,
      prompt: prompt,
      imagination: imagination,
      aspect_ratio: aspectRatio,
    });

    const data = response.data;
    const taskId = data.result?.task_id;
    const imageResult = data.result?.image_url;

    if (imageResult) {
      // Sync response
      return {
        success: true,
        imageUrl: imageResult,
        data: data.result,
      };
    } else if (taskId) {
      // Async response - needs polling
      return {
        success: true,
        taskId,
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
 * Relight image with new lighting
 * @param {object} params - Relight parameters
 * @param {string} params.imageUrl - URL of image to relight
 * @param {string} params.prompt - Lighting description prompt
 * @param {string} params.style - Lighting style: "standard", "dramatic", "soft", "natural"
 * @param {string} params.referenceImageUrl - Optional reference image for lighting transfer
 * @param {number} params.lightTransferStrength - Light transfer strength (0.0-1.0)
 * @returns {Promise<object>} - Task ID for polling
 */
export const relightImage = async ({
  imageUrl,
  prompt,
  style = "standard",
  referenceImageUrl = null,
  lightTransferStrength = 0.8,
}) => {
  const sessionId = getSessionId();

  try {
    const body = {
      user_id: sessionId,
      image_url: imageUrl,
      prompt: prompt,
      style: style,
    };

    // Add optional reference image parameters
    if (referenceImageUrl) {
      body.reference_image_url = referenceImageUrl;
      body.light_transfer_strength = lightTransferStrength;
    }

    const response = await aiClient.post("/v1/features/relight/", body);

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
 * Expand image boundaries
 * @param {object} params - Expand parameters
 * @param {string} params.imageUrl - URL of image to expand
 * @param {string} params.prompt - Description for expanded areas
 * @param {number} params.left - Pixels to expand left
 * @param {number} params.right - Pixels to expand right
 * @param {number} params.top - Pixels to expand top
 * @param {number} params.bottom - Pixels to expand bottom
 * @returns {Promise<object>} - Task ID for polling
 */
export const expandImage = async ({
  imageUrl,
  prompt = "",
  left = 100,
  right = 100,
  top = 50,
  bottom = 50,
}) => {
  const sessionId = getSessionId();

  try {
    const response = await aiClient.post("/v1/features/image-expand/", {
      user_id: sessionId,
      image_url: imageUrl,
      prompt: prompt,
      left: left,
      right: right,
      top: top,
      bottom: bottom,
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

export default {
  generateImage,
  removeBackground,
  upscaleImage,
  reimagineImage,
  relightImage,
  expandImage,
  pollTaskStatus,
  uploadImageForAI,
  getSessionId,
};
