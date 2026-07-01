import mongoose from 'mongoose'

const announcementSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Announcement title is required'],
      trim: true,
    },

    message: {
      type: String,
      required: [true, 'Announcement message is required'],
    },

    // who sees this announcement
    audience: {
      type: String,
      enum: ['all', 'students', 'instructors'],
      default: 'all',
    },

    type: {
      type: String,
      enum: [
        'general',
        'maintenance',
        'new_course',
        'platform_update',
        'holiday',
      ],
      default: 'general',
    },

    // admin who created it
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
)

const Announcement = mongoose.model('Announcement', announcementSchema)

export default Announcement