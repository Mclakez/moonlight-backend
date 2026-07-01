import express from 'express'
import {
  enrollCourse,
  getEnrolledCourses,
  getStudentProgress,
  updateProgress,
} from '../controllers/enrollmentController.js'
import { protect, authorize } from '../middleware/auth.js'

const router = express.Router()

router.post('/', protect, authorize('student'), enrollCourse)

export default router