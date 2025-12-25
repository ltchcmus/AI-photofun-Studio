/**
 * Rate Limiter - Limits API calls to prevent server overload
 * Default: 5 calls per 2 seconds
 */

class RateLimiter {
    constructor(maxCalls = 5, windowMs = 2000) {
        this.maxCalls = maxCalls;
        this.windowMs = windowMs;
        this.calls = [];
    }

    /**
     * Check if we can make a new call
     * @returns {boolean} true if call is allowed
     */
    canMakeCall() {
        const now = Date.now();
        // Remove calls outside the time window
        this.calls = this.calls.filter(time => now - time < this.windowMs);
        return this.calls.length < this.maxCalls;
    }

    /**
     * Record a new call
     */
    recordCall() {
        this.calls.push(Date.now());
    }

    /**
     * Get time to wait before next call is allowed
     * @returns {number} milliseconds to wait (0 if call is allowed now)
     */
    getWaitTime() {
        if (this.canMakeCall()) return 0;
        const oldest = this.calls[0];
        return this.windowMs - (Date.now() - oldest);
    }

    /**
     * Wait until a call is allowed, then record it
     * @returns {Promise<void>}
     */
    async waitForSlot() {
        const waitTime = this.getWaitTime();
        if (waitTime > 0) {
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        this.recordCall();
    }
}

// Global rate limiter instance: 5 calls per 2 seconds
const rateLimiter = new RateLimiter(5, 2000);

export { RateLimiter, rateLimiter };
export default rateLimiter;
