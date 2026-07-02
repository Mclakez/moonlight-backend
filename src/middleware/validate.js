import { body, validationResult } from 'express-validator'

export const validate = (req, res, next) => {
  console.log('Validate middleware called')
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }
  next()
}


export const registerRules = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required'),

  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please enter a valid email'),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
]


export const loginRules = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please enter a valid email'),

  body('password')
    .notEmpty()
    .withMessage('Password is required'),
]


export const forgotPasswordRules = [
  body('email')
    .trim()
    .notEmpty()
    .withMessage('Email is required')
    .isEmail()
    .withMessage('Please enter a valid email'),
]


export const resetPasswordRules = [
  body('token')
    .notEmpty()
    .withMessage('Token is required'),

  body('password')
    .notEmpty()
    .withMessage('Password is required')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters'),
]