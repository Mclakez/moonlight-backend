import express from 'express'
import {
  createModule,
  getCourseModules,
  updateModule,
  deleteModule,
} from '../controllers/moduleController.js'
import { protect, authorize } from '../middleware/auth.js'

const router = express.Router()

router.post('/', protect, authorize('instructor', 'admin'), createModule)
router.get('/course/:courseId', getCourseModules)
router.put('/:id', protect, authorize('instructor', 'admin'), updateModule)
router.delete('/:id', protect, authorize('instructor', 'admin'), deleteModule)

export default router