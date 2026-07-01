import Lesson from '../models/LessonModel.js'
import Module from '../models/ModuleModel.js'
import Course from '../models/CourseModel.js'
import Enrollment from '../models/EnrollmentModel.js'

// @route  POST /api/lessons
// @desc   Upload a lesson
// @access Private (instructor, admin)
export const createLesson = async (req, res) => {
  try {
    const {
      title,
      description,
      moduleId,
      courseId,
      lessonType,
      contentUrl,
      duration,
      order,
      visibility,
    } = req.body

    // check module exists
    const module = await Module.findById(moduleId).populate('course')
    if (!module) {
      return res.status(404).json({ message: 'Module not found' })
    }

    // check instructor owns the course
    if (
      module.course.instructor.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        message: 'Not authorized to add lessons to this module',
      })
    }

    const lesson = await Lesson.create({
      title,
      description,
      module: moduleId,
      course: courseId,
      lessonType,
      contentUrl,
      duration,
      order,
      visibility,
    })

    res.status(201).json({
      message: 'Lesson created successfully',
      lesson,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// @route  GET /api/lessons/module/:moduleId
// @desc   Get all lessons in a module
// @access Private (enrolled student, instructor, admin)
export const getModuleLessons = async (req, res) => {
  try {
    const lessons = await Lesson.find({
      module: req.params.moduleId,
    }).sort({ order: 1 })

    res.status(200).json({
      message: 'Lessons fetched successfully',
      total: lessons.length,
      lessons,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// @route  GET /api/lessons/:id
// @desc   Get a single lesson
// @access Private (enrolled student, instructor, admin)
export const getLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id)
      .populate('module', 'title')
      .populate('course', 'title')

    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' })
    }

    // if lesson is enrolled only, check enrollment
    if (lesson.visibility === 'enrolled') {
      const enrollment = await Enrollment.findOne({
        student: req.user._id,
        course: lesson.course._id,
      })

      if (!enrollment && req.user.role === 'student') {
        return res.status(403).json({
          message: 'You must be enrolled in this course to access this lesson',
        })
      }
    }

    res.status(200).json({
      message: 'Lesson fetched successfully',
      lesson,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// @route  PUT /api/lessons/:id
// @desc   Update a lesson
// @access Private (instructor, admin)
export const updateLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id).populate({
      path: 'module',
      populate: { path: 'course' },
    })

    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' })
    }

    if (
      lesson.module.course.instructor.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        message: 'Not authorized to update this lesson',
      })
    }

    const updated = await Lesson.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true }
    )

    res.status(200).json({
      message: 'Lesson updated successfully',
      lesson: updated,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// @route  DELETE /api/lessons/:id
// @desc   Delete a lesson
// @access Private (instructor, admin)
export const deleteLesson = async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id).populate({
      path: 'module',
      populate: { path: 'course' },
    })

    if (!lesson) {
      return res.status(404).json({ message: 'Lesson not found' })
    }

    if (
      lesson.module.course.instructor.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        message: 'Not authorized to delete this lesson',
      })
    }

    await lesson.deleteOne()

    res.status(200).json({ message: 'Lesson deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}