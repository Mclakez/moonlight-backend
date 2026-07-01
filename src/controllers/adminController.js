import User from '../models/UserModel.js'
import Course from '../models/CourseModel.js'
import Enrollment from '../models/EnrollmentModel.js'
import Announcement from '../models/AnnouncementModel.js'
import Settings from '../models/SettingsModel.js'

// ─── USER MANAGEMENT ─────────────────────────────────────────

// @route  GET /api/admin/users
// @desc   Get all users
// @access Private (admin)
export const getUsers = async (req, res) => {
  try {
    const { role, accountStatus, search, page = 1, limit = 10 } = req.query

    const query = {}

    if (role) query.role = role
    if (accountStatus) query.accountStatus = accountStatus

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ]
    }

    const skip = (page - 1) * limit

    const users = await User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))

    const total = await User.countDocuments(query)

    res.status(200).json({
      message: 'Users fetched successfully',
      total,
      page: Number(page),
      pages: Math.ceil(total / limit),
      users,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// @route  GET /api/admin/users/:id
// @desc   Get a single user
// @access Private (admin)
export const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    res.status(200).json({
      message: 'User fetched successfully',
      user,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// @route  PUT /api/admin/users/:id
// @desc   Update user role or account status
// @access Private (admin)
export const updateUser = async (req, res) => {
  try {
    const { role, accountStatus } = req.body

    const user = await User.findById(req.params.id)

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // prevent admin from demoting themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        message: 'You cannot update your own account status or role',
      })
    }

    if (role) user.role = role
    if (accountStatus) user.accountStatus = accountStatus

    await user.save()

    res.status(200).json({
      message: 'User updated successfully',
      user,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// @route  DELETE /api/admin/users/:id
// @desc   Delete a user
// @access Private (admin)
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)

    if (!user) {
      return res.status(404).json({ message: 'User not found' })
    }

    // prevent admin from deleting themselves
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({
        message: 'You cannot delete your own account',
      })
    }

    await user.deleteOne()

    res.status(200).json({ message: 'User deleted successfully' })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// ─── COURSE APPROVAL ─────────────────────────────────────────

// @route  GET /api/admin/courses
// @desc   Get all courses pending review
// @access Private (admin)
export const getPendingCourses = async (req, res) => {
  try {
    const courses = await Course.find({ status: 'pending' })
      .populate('instructor', 'name email avatar')
      .sort({ createdAt: -1 })

    res.status(200).json({
      message: 'Pending courses fetched successfully',
      total: courses.length,
      courses,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// @route  PUT /api/admin/courses/:id/approve
// @desc   Approve a course
// @access Private (admin)
export const approveCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)

    if (!course) {
      return res.status(404).json({ message: 'Course not found' })
    }

    if (course.status !== 'pending') {
      return res.status(400).json({
        message: 'Only pending courses can be approved',
      })
    }

    course.isApproved = true
    course.status = 'published'
    await course.save()

    res.status(200).json({
      message: 'Course approved successfully',
      course,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// @route  PUT /api/admin/courses/:id/reject
// @desc   Reject a course
// @access Private (admin)
export const rejectCourse = async (req, res) => {
  try {
    const { reason } = req.body

    const course = await Course.findById(req.params.id)

    if (!course) {
      return res.status(404).json({ message: 'Course not found' })
    }

    if (course.status !== 'pending') {
      return res.status(400).json({
        message: 'Only pending courses can be rejected',
      })
    }

    course.status = 'rejected'
    course.isApproved = false
    await course.save()

    res.status(200).json({
      message: `Course rejected successfully${reason ? `: ${reason}` : ''}`,
      course,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// ─── ANALYTICS ───────────────────────────────────────────────

// @route  GET /api/admin/analytics
// @desc   Get platform analytics
// @access Private (admin)
export const getAnalytics = async (req, res) => {
  try {
    // counts
    const totalUsers = await User.countDocuments()
    const totalStudents = await User.countDocuments({ role: 'student' })
    const totalInstructors = await User.countDocuments({ role: 'instructor' })
    const totalCourses = await Course.countDocuments()
    const publishedCourses = await Course.countDocuments({ status: 'published' })
    const pendingCourses = await Course.countDocuments({ status: 'pending' })
    const totalEnrollments = await Enrollment.countDocuments()

    // revenue — sum of all enrollment amounts
    const revenueData = await Enrollment.aggregate([
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: '$amount' },
        },
      },
    ])

    const totalRevenue = revenueData.length > 0
      ? revenueData[0].totalRevenue
      : 0

    // get platform fee from settings
    const settings = await Settings.findOne({ isSingleton: true })
    const platformFee = settings ? settings.platformFee : 20
    const platformRevenue = (totalRevenue * platformFee) / 100

    res.status(200).json({
      message: 'Analytics fetched successfully',
      analytics: {
        users: {
          total: totalUsers,
          students: totalStudents,
          instructors: totalInstructors,
        },
        courses: {
          total: totalCourses,
          published: publishedCourses,
          pending: pendingCourses,
        },
        enrollments: {
          total: totalEnrollments,
        },
        revenue: {
          total: totalRevenue,
          platformRevenue,
          platformFeePercent: platformFee,
        },
      },
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// ─── ANNOUNCEMENTS ────────────────────────────────────────────

// @route  POST /api/admin/announcements
// @desc   Create an announcement
// @access Private (admin)
export const createAnnouncement = async (req, res) => {
  try {
    const { title, message, audience, type } = req.body

    const announcement = await Announcement.create({
      title,
      message,
      audience,
      type,
      createdBy: req.user._id,
    })

    res.status(201).json({
      message: 'Announcement created successfully',
      announcement,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// @route  GET /api/admin/announcements
// @desc   Get all announcements
// @access Private (admin)
export const getAnnouncements = async (req, res) => {
  try {
    const announcements = await Announcement.find()
      .populate('createdBy', 'name')
      .sort({ createdAt: -1 })

    res.status(200).json({
      message: 'Announcements fetched successfully',
      total: announcements.length,
      announcements,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// ─── PLATFORM SETTINGS ───────────────────────────────────────

// @route  GET /api/admin/settings
// @desc   Get platform settings
// @access Private (admin)
export const getSettings = async (req, res) => {
  try {
    // find existing or create default settings
    let settings = await Settings.findOne({ isSingleton: true })

    if (!settings) {
      settings = await Settings.create({ isSingleton: true })
    }

    res.status(200).json({
      message: 'Settings fetched successfully',
      settings,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// @route  PUT /api/admin/settings
// @desc   Update platform settings
// @access Private (admin)
export const updateSettings = async (req, res) => {
  try {
    const {
      platformName,
      platformFee,
      maintenanceMode,
      maintenanceMessage,
      requireCourseApproval,
      allowFreeEnrollment,
      supportEmail,
    } = req.body

    // always update the single settings document
    const settings = await Settings.findOneAndUpdate(
      { isSingleton: true },
      {
        platformName,
        platformFee,
        maintenanceMode,
        maintenanceMessage,
        requireCourseApproval,
        allowFreeEnrollment,
        supportEmail,
      },
      { new: true, upsert: true }
    )

    res.status(200).json({
      message: 'Settings updated successfully',
      settings,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}