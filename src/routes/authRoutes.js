import express from 'express'
import { register, login, logout, forgotPassword, resetPassword } from '../controllers/authController.js'
import { registerRules, loginRules, forgotPasswordRules, resetPasswordRules, validate } from '../middleware/validate.js'
import { authLimiter, loginLimiter, forgotPasswordLimiter } from '../middleware/rateLimiter.js'

const router = express.Router()

router.use(authLimiter)


router.post('/register', registerRules, validate, register)
router.post('/login', loginLimiter, loginRules, validate, login)
router.post('/logout', logout)
router.post('/forgot-password', forgotPasswordLimiter, forgotPasswordRules, validate, forgotPassword)
router.post('/reset-password', resetPasswordRules, validate, resetPassword)

export default router