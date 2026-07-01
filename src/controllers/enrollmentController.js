import Enrollment from '../models/EnrollmentModel.js'
import Progress from '../models/ProgressModel.js'
import Course from '../models/CourseModel.js'
import Lesson from '../models/LessonModel.js'
import Certificate from '../models/CertificateModel.js'

// @route  POST /api/enrollments
// @desc   Enroll a student in a course
// @access Private (student)
export const enrollCourse = async (req, res) => {
  try {
    const { courseId } = req.body

    // 1. check if course exists and is published
    const course = await Course.findById(courseId)

    if (!course) {
      return res.status(404).json({ message: 'Course not found' })
    }

    if (!course.isApproved || course.status !== 'published') {
      return res.status(400).json({ message: 'Course is not available for enrollment' })
    }

    // 2. check if student is already enrolled
    const existingEnrollment = await Enrollment.findOne({
      student: req.user._id,
      course: courseId,
    })

    if (existingEnrollment) {
      return res.status(400).json({ message: 'Already enrolled in this course' })
    }

    // 3. create enrollment
    // payment reference will come from payment card later
    const enrollment = await Enrollment.create({
      student: req.user._id,
      course: courseId,
      amount: course.price,
    })

    // 4. update course total enrollments
    await Course.findByIdAndUpdate(courseId, {
      $inc: { totalEnrollments: 1 },
    })

    res.status(201).json({
      message: 'Enrolled successfully',
      enrollment,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// @route  GET /api/student/courses
// @desc   Get all courses a student is enrolled in
// @access Private (student)
export const getEnrolledCourses = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ student: req.user._id })
      .populate({
        path: 'course',
        select: 'title description thumbnail category level duration instructor',
        populate: {
          path: 'instructor',
          select: 'name avatar',
        },
      })
      .sort({ enrolledAt: -1 })

    res.status(200).json({
      message: 'Enrolled courses fetched successfully',
      total: enrollments.length,
      enrollments,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// @route  GET /api/student/progress
// @desc   Get student progress across all enrolled courses
// @access Private (student)
export const getStudentProgress = async (req, res) => {
  try {
    const enrollments = await Enrollment.find({
      student: req.user._id,
    }).populate('course', 'title thumbnail')

    const progressReport = await Promise.all(
      enrollments.map(async (enrollment) => {
        // get actual total lessons in this course
        const totalLessons = await Lesson.countDocuments({
          course: enrollment.course._id,
          status: 'published',
        })

        // get completed lessons for this student in this course
        const completedLessons = await Progress.countDocuments({
          student: req.user._id,
          course: enrollment.course._id,
        })

        // calculate percentage
        const percentage =
          totalLessons === 0
            ? 0
            : Math.round((completedLessons / totalLessons) * 100)

        // check if course is fully completed
        if (percentage === 100 && !enrollment.completed) {
          await Enrollment.findByIdAndUpdate(enrollment._id, {
            completed: true,
            completedAt: Date.now(),
          })
        
          // automatically generate certificate on completion
          const existingCert = await Certificate.findOne({
            student: req.user._id,
            course: enrollment.course._id,
          })
        
          if (!existingCert) {
            await Certificate.create({
              student: req.user._id,
              course: enrollment.course._id,
              enrollment: enrollment._id,
            })
          }
        }
        return {
          course: enrollment.course,
          enrolledAt: enrollment.enrolledAt,
          completed: percentage === 100,
          completedLessons,
          totalLessons,
          percentage,
        }
      })
    )

    res.status(200).json({
      message: 'Progress fetched successfully',
      progress: progressReport,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// @route  POST /api/student/progress
// @desc   Mark a lesson as completed
// @access Private (student)
export const updateProgress = async (req, res) => {
  try {
    const { courseId, lessonId } = req.body

    // check if student is enrolled in this course
    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: courseId,
    })

    if (!enrollment) {
      return res.status(403).json({
        message: 'You are not enrolled in this course',
      })
    }

    // mark lesson as complete
    // upsert means create if not exists, update if exists
    await Progress.findOneAndUpdate(
      { student: req.user._id, lesson: lessonId },
      { student: req.user._id, course: courseId, lesson: lessonId },
      { upsert: true, new: true }
    )

    res.status(200).json({ message: 'Progress updated successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}