/**
 * Security Middleware for QUEUELESS Express Backend
 * Provides CORS allowlist, security headers, rate limiting, and structured request logging.
 */

const rateLimitStores = new Map();

/**
 * Check if an origin is permitted by the CORS allowlist
 */
export function isOriginAllowed(origin) {
  if (!origin) return true; // Same-origin or server-to-server / curl without Origin header

  const allowedEnv = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

  const staticAllowed = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    process.env.APP_URL
  ].filter(Boolean);

  const allExplicit = new Set([...staticAllowed, ...allowedEnv]);
  if (allExplicit.has(origin)) return true;

  // Permit Cloud Run preview / production hosts for this applet if configured
  try {
    const parsed = new URL(origin);
    if (
      parsed.protocol === 'https:' &&
      (parsed.hostname.endsWith('.run.app') || parsed.hostname.endsWith('.web.app') || parsed.hostname.endsWith('.firebaseapp.com'))
    ) {
      return true;
    }
  } catch {
    return false;
  }

  return false;
}

/**
 * CORS Allowlist Middleware
 */
export function corsAllowlistMiddleware(req, res, next) {
  const origin = req.headers.origin;
  if (origin) {
    if (!isOriginAllowed(origin)) {
      return res.status(403).json({
        success: false,
        error: 'Origin not permitted by CORS policy.'
      });
    }
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }

  if (req.method === 'OPTIONS') {
    return res.status(204).end();
  }

  next();
}

/**
 * Security Headers Middleware (iFrame-compatible for AI Studio preview)
 */
export function securityHeadersMiddleware(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  res.setHeader('X-DNS-Prefetch-Control', 'off');
  next();
}

/**
 * In-memory Sliding Window Rate Limiter
 */
export function createRateLimiter({ windowMs = 60_000, maxRequests = 120, keyPrefix = 'global' } = {}) {
  const store = new Map();
  rateLimitStores.set(keyPrefix, store);

  // Periodic cleanup every 5 minutes
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of store.entries()) {
      if (now - entry.windowStart > windowMs) {
        store.delete(key);
      }
    }
  }, 300_000);
  if (cleanupTimer.unref) cleanupTimer.unref();

  return function rateLimitMiddleware(req, res, next) {
    const clientIp = (req.headers['x-forwarded-for'] || req.socket?.remoteAddress || 'unknown')
      .toString()
      .split(',')[0]
      .trim();
    const key = `${keyPrefix}:${clientIp}`;
    const now = Date.now();

    let entry = store.get(key);
    if (!entry || now - entry.windowStart > windowMs) {
      entry = { count: 1, windowStart: now };
      store.set(key, entry);
    } else {
      entry.count += 1;
    }

    const remaining = Math.max(0, maxRequests - entry.count);
    res.setHeader('X-RateLimit-Limit', String(maxRequests));
    res.setHeader('X-RateLimit-Remaining', String(remaining));

    if (entry.count > maxRequests) {
      const retryAfterSec = Math.ceil((entry.windowStart + windowMs - now) / 1000);
      res.setHeader('Retry-After', String(Math.max(1, retryAfterSec)));
      return res.status(429).json({
        success: false,
        error: 'Rate limit exceeded. Please wait briefly before retrying.'
      });
    }

    next();
  };
}

/**
 * Structured Request Logger (Redacts Authorization and PII)
 */
export function structuredLoggerMiddleware(req, res, next) {
  if (!req.path.startsWith('/api')) {
    return next();
  }

  const start = Date.now();
  res.on('finish', () => {
    const durationMs = Date.now() - start;
    const logEntry = {
      level: res.statusCode >= 500 ? 'error' : res.statusCode >= 400 ? 'warn' : 'info',
      timestamp: new Date().toISOString(),
      method: req.method,
      path: req.originalUrl || req.path,
      statusCode: res.statusCode,
      durationMs,
      uid: req.user?.uid || 'anonymous'
    };
    console.log(JSON.stringify(logEntry));
  });

  next();
}
