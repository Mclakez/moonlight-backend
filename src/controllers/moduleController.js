import Module from '../models/ModuleModel.js'
import Course from '../models/CourseModel.js'

// @route  POST /api/modules
// @desc   Create a module
// @access Private (instructor, admin)
export const createModule = async (req, res) => {
  try {
    const { title, description, courseId, order } = req.body

    // check if course exists
    const course = await Course.findById(courseId)
    if (!course) {
      return res.status(404).json({ message: 'Course not found' })
    }

    // make sure instructor owns this course
    if (
      course.instructor.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        message: 'Not authorized to add modules to this course',
      })
    }

    const module = await Module.create({
      title,
      description,
      course: courseId,
      order,
    })

    // add module to course
    await Course.findByIdAndUpdate(courseId, {
      $push: { modules: module._id },
    })

    res.status(201).json({
      message: 'Module created successfully',
      module,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// @route  GET /api/modules/course/:courseId
// @desc   Get all modules for a course
// @access Public
export const getCourseModules = async (req, res) => {
  try {
    const modules = await Module.find({
      course: req.params.courseId,
    }).sort({ order: 1 })

    res.status(200).json({
      message: 'Modules fetched successfully',
      total: modules.length,
      modules,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// @route  PUT /api/modules/:id
// @desc   Update a module
// @access Private (instructor, admin)
export const updateModule = async (req, res) => {
  try {
    const module = await Module.findById(req.params.id).populate('course')

    if (!module) {
      return res.status(404).json({ message: 'Module not found' })
    }

    // make sure instructor owns the course this module belongs to
    if (
      module.course.instructor.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        message: 'Not authorized to update this module',
      })
    }

    const updated = await Module.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true }
    )

    res.status(200).json({
      message: 'Module updated successfully',
      module: updated,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// @route  DELETE /api/modules/:id
// @desc   Delete a module
// @access Private (instructor, admin)
export const deleteModule = async (req, res) => {
  try {
    const module = await Module.findById(req.params.id).populate('course')

    if (!module) {
      return res.status(404).json({ message: 'Module not found' })
    }

    if (
      module.course.instructor.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        message: 'Not authorized to delete this module',
      })
    }

    // remove module from course
    await Course.findByIdAndUpdate(module.course._id, {
      $pull: { modules: module._id },
    })

    await module.deleteOne()

    res.status(200).json({ message: 'Module deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}