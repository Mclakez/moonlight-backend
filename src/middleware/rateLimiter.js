import rateLimit from 'express-rate-limit'

// general limiter for all auth routes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // max 20 requests per 15 minutes
  message: {
    message: 'Too many requests, please try again after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// stricter limiter for login specifically
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5, // only 5 login attempts per 15 minutes
  message: {
    message: 'Too many login attempts, please try again after 15 minutes',
  },
  standardHeaders: true,
  legacyHeaders: false,
})

// stricter limiter for forgot password
export const forgotPasswordLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 3, // only 3 attempts per hour
  message: {
    message: 'Too many password reset requests, please try again after an hour',
  },
  standardHeaders: true,
  legacyHeaders: false,
})