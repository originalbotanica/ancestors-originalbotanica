const UPSTASH_URL = process.env.UPSTASH_REDIS_REST_URL;
const UPSTASH_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

/**
 * Call the Upstash Redis REST API directly (no SDK needed).
 */
async function redisCommand(...args) {
    const path = args.map((a) => encodeURIComponent(a)).join('/');
    const res = await fetch(`${UPSTASH_URL}/${path}`, {
          method: 'GET',
          headers: { Authorization: `Bearer ${UPSTASH_TOKEN}` },
          cache: 'no-store',
        });
    const data = await res.json();
    return data.result;
  }

/**
 * Fixed-window rate limiter.
 * @param {string} key    - Unique identifier (e.g. "route:ip")
 * @param {number} limit  - Max requests allowed per window
 * @param {number} window - Window size in seconds
 * @returns {Promise<{allowed: boolean, remaining: number}>}
 */
export async function checkRateLimit(key, limit = 10, window = 60) {
    const redisKey = `rl:${key}`;
    const count = await redisCommand('INCR', redisKey);
    if (count === 1) {
          // First request in this window — set expiry
          await redisCommand('EXPIRE', redisKey, window);
        }
    return {
          allowed: count <= limit,
          remaining: Math.max(0, limit - count),
        };
  }
