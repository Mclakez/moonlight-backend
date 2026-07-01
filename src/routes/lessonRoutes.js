import express from 'express'
import {
  createLesson,
  getModuleLessons,
  getLesson,
  updateLesson,
  deleteLesson,
} from '../controllers/lessonController.js'
import { protect, authorize } from '../middleware/auth.js'

const router = express.Router()

router.post('/', protect, authorize('instructor', 'admin'), createLesson)
router.get('/module/:moduleId', protect, getModuleLessons)
router.get('/:id', protect, getLesson)
router.put('/:id', protect, authorize('instructor', 'admin'), updateLesson)
router.delete('/:id', protect, authorize('instructor', 'admin'), deleteLesson)

export default router