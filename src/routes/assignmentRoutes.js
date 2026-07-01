import express from 'express'
import {
  createAssignment,
  getCourseAssignments,
  submitAssignment,
  getSubmissions,
  gradeSubmission,
} from '../controllers/assignmentController.js'
import { protect, authorize } from '../middleware/auth.js'

const router = express.Router()

router.post('/', protect, authorize('instructor', 'admin'), createAssignment)
router.get('/course/:courseId', protect, authorize('instructor', 'admin'), getCourseAssignments)
router.post('/:id/submit', protect, authorize('student'), submitAssignment)
router.get('/:id/submissions', protect, authorize('instructor', 'admin'), getSubmissions)
router.post('/grade', protect, authorize('instructor', 'admin'), gradeSubmission)

export default router