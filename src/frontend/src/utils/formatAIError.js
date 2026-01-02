/**
 * Format error messages for AI API responses
 * Shows user-friendly messages for rate limits, auth errors, and server issues
 */
export const formatAIError = (error) => {
    const errorStr = (error?.toString() || "").toLowerCase();
    const errorMsg = (error?.message || "").toLowerCase();

    // Rate limit / Quota exceeded
    if (errorStr.includes("429") || errorStr.includes("rate limit") ||
        errorStr.includes("quota") || errorStr.includes("limit") ||
        errorStr.includes("exceeded") || errorStr.includes("resource_exhausted") ||
        errorStr.includes("exhausted") || errorStr.includes("feature execution error") ||
        errorMsg.includes("429") || errorMsg.includes("rate limit") ||
        errorMsg.includes("quota") || errorMsg.includes("exceeded")) {
        return "⚠️ Daily image/video creation limit reached. Please try again tomorrow.";
    }

    // Authentication errors
    if (errorStr.includes("401") || errorStr.includes("unauthorized") ||
        errorStr.includes("invalid") || errorStr.includes("auth") ||
        errorMsg.includes("401") || errorMsg.includes("unauthorized")) {
        return "⚠️ Authentication error. Please log in again.";
    }

    // Server errors
    if (errorStr.includes("500") || errorStr.includes("server") ||
        errorStr.includes("internal") ||
        errorMsg.includes("500") || errorMsg.includes("server error")) {
        return "⚠️ Server is busy. Please try again in a few minutes.";
    }

    // Network errors
    if (errorStr.includes("network") || errorStr.includes("timeout") ||
        errorStr.includes("fetch") || errorStr.includes("connection") ||
        errorMsg.includes("network") || errorMsg.includes("timeout")) {
        return "⚠️ Network connection error. Please check your internet and try again.";
    }

    // Default - show generic limit message instead of raw error
    return "⚠️ Daily image/video creation limit reached. Please try again tomorrow.";
};

export default formatAIError;
