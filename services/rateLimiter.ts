import { RATE_LIMIT_WINDOW_MS, MAX_REQUESTS_PER_WINDOW } from '../constants';

/**
 * A simple client-side Token Bucket implementation to throttle requests.
 * This prevents accidental spamming or abuse from a single browser session.
 */
class RateLimiter {
  private timestamps: number[] = [];

  public checkLimit(): boolean {
    const now = Date.now();
    // Filter out timestamps older than the window
    this.timestamps = this.timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);

    if (this.timestamps.length >= MAX_REQUESTS_PER_WINDOW) {
      return false;
    }

    this.timestamps.push(now);
    return true;
  }

  public getRemainingTime(): number {
    if (this.timestamps.length === 0) return 0;
    const now = Date.now();
    const oldest = this.timestamps[0];
    const elapsed = now - oldest;
    return Math.max(0, RATE_LIMIT_WINDOW_MS - elapsed);
  }
  
  public getRemainingRequests(): number {
      const now = Date.now();
      this.timestamps = this.timestamps.filter(t => now - t < RATE_LIMIT_WINDOW_MS);
      return Math.max(0, MAX_REQUESTS_PER_WINDOW - this.timestamps.length);
  }
}

export const rateLimiter = new RateLimiter();