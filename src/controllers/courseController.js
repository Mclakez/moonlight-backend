import Course from '../models/CourseModel.js'

// @route  POST /api/courses
// @desc   Create a course
// @access Private (instructor, admin)
export const createCourse = async (req, res) => {
  try {
    const {
      title,
      description,
      category,
      level,
      language,
      price,
      thumbnail,
      duration,
      learningObjectives,
      requirements,
      targetAudience,
    } = req.body

    const course = await Course.create({
      title,
      description,
      category,
      level,
      language,
      price,
      thumbnail,
      duration,
      learningObjectives,
      requirements,
      targetAudience,
      instructor: req.user._id, // comes from protect middleware
    })

    res.status(201).json({
      message: 'Course created successfully',
      course,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// @route  GET /api/courses
// @desc   Get all published courses (with search and filter)
// @access Public
export const getCourses = async (req, res) => {
  try {
    const { category, search, level, page = 1, limit = 10 } = req.query

    // build query object dynamically
    const query = { status: 'published', isApproved: true }

    // filter by category if provided
    if (category) {
      query.category = category
    }

    // filter by level if provided
    if (level) {
      query.level = level
    }

    // search by title or description if provided
    if (search) {
      query.$text = { $search: search }
    }

    // pagination
    const skip = (page - 1) * limit

    const courses = await Course.find(query)
      .populate('instructor', 'name avatar')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))

    const total = await Course.countDocuments(query)

    res.status(200).json({
      message: 'Courses fetched successfully',
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      courses,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// @route  GET /api/courses/:id
// @desc   Get a single course
// @access Public
export const getCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id).populate(
      'instructor',
      'name avatar'
    )

    if (!course) {
      return res.status(404).json({ message: 'Course not found' })
    }

    res.status(200).json({
      message: 'Course fetched successfully',
      course,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// @route  PUT /api/courses/:id
// @desc   Update a course
// @access Private (instructor, admin)
export const updateCourse = async (req, res) => {
  try {
    let course = await Course.findById(req.params.id)

    if (!course) {
      return res.status(404).json({ message: 'Course not found' })
    }

    // make sure the instructor owns this course and admin can update any course
    if (
      course.instructor.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        message: 'Not authorized to update this course',
      })
    }

    // update the course
    course = await Course.findByIdAndUpdate(
      req.params.id,
      { ...req.body },
      { new: true, runValidators: true }
    )

    res.status(200).json({
      message: 'Course updated successfully',
      course,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// @route  DELETE /api/courses/:id
// @desc   Delete a course
// @access Private (instructor, admin)
export const deleteCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)

    if (!course) {
      return res.status(404).json({ message: 'Course not found' })
    }

    // make sure the instructor owns this course and admin can delete any course
    if (
      course.instructor.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        message: 'Not authorized to delete this course',
      })
    }

    await course.deleteOne()

    res.status(200).json({ message: 'Course deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// @route  GET /api/courses/my-courses
// @desc   Get all courses created by the logged in instructor
// @access Private (instructor)
export const getMyCourses = async (req, res) => {
  try {
    const courses = await Course.find({ instructor: req.user._id }).sort({
      createdAt: -1,
    })

    res.status(200).json({
      message: 'Courses fetched successfully',
      total: courses.length,
      courses,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}