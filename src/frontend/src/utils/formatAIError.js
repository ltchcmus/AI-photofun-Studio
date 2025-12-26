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
        return "⚠️ Giới hạn tạo ảnh/video hôm nay đã hết. Vui lòng thử lại vào ngày mai.";
    }

    // Authentication errors
    if (errorStr.includes("401") || errorStr.includes("unauthorized") ||
        errorStr.includes("invalid") || errorStr.includes("auth") ||
        errorMsg.includes("401") || errorMsg.includes("unauthorized")) {
        return "⚠️ Lỗi xác thực. Vui lòng đăng nhập lại.";
    }

    // Server errors
    if (errorStr.includes("500") || errorStr.includes("server") ||
        errorStr.includes("internal") ||
        errorMsg.includes("500") || errorMsg.includes("server error")) {
        return "⚠️ Máy chủ đang bận. Vui lòng thử lại sau ít phút.";
    }

    // Network errors
    if (errorStr.includes("network") || errorStr.includes("timeout") ||
        errorStr.includes("fetch") || errorStr.includes("connection") ||
        errorMsg.includes("network") || errorMsg.includes("timeout")) {
        return "⚠️ Lỗi kết nối mạng. Vui lòng kiểm tra internet và thử lại.";
    }

    // Default - show generic limit message instead of raw error
    return "⚠️ Giới hạn tạo ảnh/video hôm nay đã hết. Vui lòng thử lại vào ngày mai.";
};

export default formatAIError;
