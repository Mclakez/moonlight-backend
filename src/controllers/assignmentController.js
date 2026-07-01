import Assignment from '../models/AssignmentModel.js'
import Submission from '../models/SubmissionModel.js'
import Course from '../models/CourseModel.js'
import Enrollment from '../models/EnrollmentModel.js'

// @route  POST /api/assignments
// @desc   Create an assignment
// @access Private (instructor, admin)
export const createAssignment = async (req, res) => {
  try {
    const {
      title,
      description,
      instructions,
      courseId,
      lessonId,
      submissionType,
      allowedFileTypes,
      maxFileSize,
      totalMarks,
      dueDate,
      notifyStudents,
    } = req.body

    const course = await Course.findById(courseId)
    if (!course) {
      return res.status(404).json({ message: 'Course not found' })
    }

    if (
      course.instructor.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        message: 'Not authorized to create assignments for this course',
      })
    }

    const assignment = await Assignment.create({
      title,
      description,
      instructions,
      course: courseId,
      lesson: lessonId,
      submissionType,
      allowedFileTypes,
      maxFileSize,
      totalMarks,
      dueDate,
      notifyStudents,
    })

    res.status(201).json({
      message: 'Assignment created successfully',
      assignment,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// @route  GET /api/assignments/course/:courseId
// @desc   Get all assignments for a course
// @access Private (instructor, admin)
export const getCourseAssignments = async (req, res) => {
  try {
    const assignments = await Assignment.find({
      course: req.params.courseId,
    }).populate('lesson', 'title')

    res.status(200).json({
      message: 'Assignments fetched successfully',
      total: assignments.length,
      assignments,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// @route  POST /api/assignments/:id/submit
// @desc   Student submits an assignment
// @access Private (student)
export const submitAssignment = async (req, res) => {
  try {
    const { submissionContent } = req.body

    const assignment = await Assignment.findById(req.params.id)
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' })
    }

    // check student is enrolled
    const enrollment = await Enrollment.findOne({
      student: req.user._id,
      course: assignment.course,
    })

    if (!enrollment) {
      return res.status(403).json({
        message: 'You must be enrolled in this course to submit',
      })
    }

    // check due date
    if (new Date() > new Date(assignment.dueDate)) {
      return res.status(400).json({ message: 'Assignment due date has passed' })
    }

    // check for existing submission
    const existing = await Submission.findOne({
      student: req.user._id,
      assignment: req.params.id,
    })

    if (existing) {
      return res.status(400).json({ message: 'You have already submitted this assignment' })
    }

    const submission = await Submission.create({
      student: req.user._id,
      assignment: req.params.id,
      course: assignment.course,
      submissionContent,
    })

    res.status(201).json({
      message: 'Assignment submitted successfully',
      submission,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// @route  GET /api/assignments/:id/submissions
// @desc   Get all submissions for an assignment
// @access Private (instructor, admin)
export const getSubmissions = async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' })
    }

    const submissions = await Submission.find({
      assignment: req.params.id,
    }).populate('student', 'name email avatar')

    res.status(200).json({
      message: 'Submissions fetched successfully',
      total: submissions.length,
      submissions,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// @route  POST /api/grades
// @desc   Grade a submission
// @access Private (instructor, admin)
export const gradeSubmission = async (req, res) => {
  try {
    const {
      submissionId,
      score,
      grade,
      feedback,
      gradeReleased,
    } = req.body

    const submission = await Submission.findById(submissionId)
    if (!submission) {
      return res.status(404).json({ message: 'Submission not found' })
    }

    // verify instructor owns the course
    const course = await Course.findById(submission.course)
    if (
      course.instructor.toString() !== req.user._id.toString() &&
      req.user.role !== 'admin'
    ) {
      return res.status(403).json({
        message: 'Not authorized to grade this submission',
      })
    }

    const updated = await Submission.findByIdAndUpdate(
      submissionId,
      {
        score,
        grade,
        feedback,
        gradeReleased,
        gradingStatus: 'graded',
        gradedAt: Date.now(),
      },
      { new: true }
    )

    res.status(200).json({
      message: 'Submission graded successfully',
      submission: updated,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}