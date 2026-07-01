import express from 'express'
import {
  createCourse,
  getCourses,
  getCourse,
  updateCourse,
  deleteCourse,
  getMyCourses,
} from '../controllers/courseController.js'
import { protect, authorize } from '../middleware/auth.js'

const router = express.Router()

router.get('/', getCourses)
router.get('/my-courses', protect, authorize('instructor'), getMyCourses)
router.get('/:id', getCourse)

router.post('/', protect, authorize('instructor', 'admin'), createCourse)

router.put('/:id', protect, authorize('instructor', 'admin'), updateCourse)
router.delete('/:id', protect, authorize('instructor', 'admin'), deleteCourse)


export default router