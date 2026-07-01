import jwt from 'jsonwebtoken'
import User from '../models/UserModel.js'

// checks if the user is logged in
export const protect = async (req, res, next) => {
  try {
    let token

    // Authorization: Bearer eyJhbGci...
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1]
    }

    
    if (!token) {
      return res.status(401).json({ message: 'Not authorized, no token' })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = await User.findById(decoded.id).select('-password')

    if (!req.user) {
      return res.status(401).json({ message: 'User no longer exists' })
    }

    next()
  } catch (error) {
    return res.status(401).json({ message: 'Not authorized, invalid token' })
  }
}


// checks if the logged in user has the right role
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        message: `Access denied. Only ${roles.join(' or ')} can perform this action`,
      })
    }
    next()
  }
}