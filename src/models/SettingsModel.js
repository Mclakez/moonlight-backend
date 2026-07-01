import mongoose from 'mongoose'

const settingsSchema = new mongoose.Schema(
  {
    platformName: {
      type: String,
      default: 'Moon Digital Academy',
    },

    // percentage the platform takes from each sale
    platformFee: {
      type: Number,
      default: 20, // 20%
    },

    // maintenance mode shuts down the platform temporarily
    maintenanceMode: {
      type: Boolean,
      default: false,
    },

    maintenanceMessage: {
      type: String,
      default: 'Platform is under maintenance. Please check back later.',
    },

    // whether new instructors need admin approval
    requireCourseApproval: {
      type: Boolean,
      default: true,
    },

    // whether students can enroll for free
    allowFreeEnrollment: {
      type: Boolean,
      default: false,
    },

    supportEmail: {
      type: String,
      default: '',
    },

    // only one settings document should ever exist
    isSingleton: {
      type: Boolean,
      default: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
)

const Settings = mongoose.model('Settings', settingsSchema)

export default Settings

// always find and update, never create a second one
Settings.findOneAndUpdate({}, { platformFee: 15 }, { new: true })