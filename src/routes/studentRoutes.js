import express from 'express'
import {
  getEnrolledCourses,
  getStudentProgress,
  updateProgress,
} from '../controllers/enrollmentController.js'
import { protect, authorize } from '../middleware/auth.js'

const router = express.Router()

router.get('/courses', protect, authorize('student'), getEnrolledCourses)
router.get('/progress', protect, authorize('student'), getStudentProgress)
router.post('/progress', protect, authorize('student'), updateProgress)

export default router