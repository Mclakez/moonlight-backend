import User from '../models/UserModel.js'
import jwt from 'jsonwebtoken'
import crypto from 'crypto'
import sendEmail from '../utils/sendEmail.js'

const generateToken = (userId) => {
  return jwt.sign(
    { id: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  )
}

// @route  POST /api/auth/register
export const register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body

    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' })
    }

    const user = await User.create({
      name,
      email,
      password,
      role: role || 'student', 
    })

    const token = generateToken(user._id)

    // 4. return response
    res.status(201).json({
      message: 'Registration successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        accountStatus: user.accountStatus,
      },
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}


// @route  POST /api/auth/login
export const login = async (req, res) => {
  try {
    const { email, password } = req.body

    
    const user = await User.findOne({ email }).select('+password')

    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    const isMatch = await user.matchPassword(password)
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid email or password' })
    }

    if (user.accountStatus === 'suspended') {
      return res.status(403).json({ message: 'Your account has been suspended' })
    }

    if (user.accountStatus === 'deactivated') {
      return res.status(403).json({ message: 'Your account has been deactivated' })
    }

    const token = generateToken(user._id)

    res.status(200).json({
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        accountStatus: user.accountStatus,
      },
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}


// @route  POST /api/auth/logout

export const logout = async (req, res) => {
  try {
    res.status(200).json({ message: 'Logged out successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}


// @route  POST /api/auth/forgot-password
export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body

    const user = await User.findOne({ email })

    if (!user) {
      return res.status(200).json({
        message: 'If that email exists, a reset link has been sent',
      })
    }

    // generate raw token
    const rawToken = crypto.randomBytes(32).toString('hex')

    // hash before saving to DB
    const hashedToken = crypto
      .createHash('sha256')
      .update(rawToken)
      .digest('hex')

    // saved to user with 15 minute expiry
    user.resetPasswordToken = hashedToken
    user.resetPasswordExpire = Date.now() + 15 * 60 * 1000
    await user.save()

    // build reset URL with raw token and this points to the frontend reset page
    const resetURL = `${process.env.CLIENT_URL}/reset-password?token=${rawToken}`

    await sendEmail({
      to: user.email,
      subject: 'Password Reset Request',
      html: `
        <h2>Password Reset</h2>
        <p>You requested a password reset for your Moon Digital Academy account.</p>
        <p>Click the link below to reset your password. This link expires in 15 minutes.</p>
        <a href="${resetURL}" style="
          background: #4F46E5;
          color: white;
          padding: 12px 24px;
          text-decoration: none;
          border-radius: 6px;
          display: inline-block;
        ">Reset Password</a>
        <p>If you did not request this, please ignore this email.</p>
      `,
    })

    res.status(200).json({
      message: 'If that email exists, a reset link has been sent',
    })
  } catch (error) {
    console.error('Forgot password error:', error.message)

    await User.updateOne(
      { email: req.body.email },
      {
        resetPasswordToken: undefined,
        resetPasswordExpire: undefined,
      }
    )

    res.status(503).json({
      message: 'Password reset email could not be sent right now. Please try again later.',
    })
  }
}


// @route  POST /api/auth/reset-password

export const resetPassword = async (req, res) => {
  try {
    const { token, password } = req.body

    // hash the incoming raw token
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex')

    //find user with matching token that hasn't expired
    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpire: { $gt: Date.now() },
    })

    
    if (!user) {
      return res.status(400).json({ message: 'Invalid or expired reset token' })
    }

    user.password = password
    user.resetPasswordToken = undefined
    user.resetPasswordExpire = undefined
    await user.save()

    res.status(200).json({ message: 'Password reset successful. You can now log in.' })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}