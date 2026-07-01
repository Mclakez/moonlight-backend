import express from 'express'
import {
  getUsers,
  getUser,
  updateUser,
  deleteUser,
  getPendingCourses,
  approveCourse,
  rejectCourse,
  getAnalytics,
  createAnnouncement,
  getAnnouncements,
  getSettings,
  updateSettings,
} from '../controllers/adminController.js'
import { protect, authorize } from '../middleware/auth.js'

const router = express.Router()

// every admin route is protected and admin only
router.use(protect, authorize('admin'))

// user management
router.get('/users', getUsers)
router.get('/users/:id', getUser)
router.put('/users/:id', updateUser)
router.delete('/users/:id', deleteUser)

// course approval
router.get('/courses', getPendingCourses)
router.put('/courses/:id/approve', approveCourse)
router.put('/courses/:id/reject', rejectCourse)

// analytics
router.get('/analytics', getAnalytics)

// announcements
router.post('/announcements', createAnnouncement)
router.get('/announcements', getAnnouncements)

// settings
router.get('/settings', getSettings)
router.put('/settings', updateSettings)

export default router