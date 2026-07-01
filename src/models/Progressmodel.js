import mongoose from 'mongoose'

const progressSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },

    // which lesson was completed
    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      required: true,
    },

    completedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
)

// prevent duplicate progress records
// a student can only complete a lesson once
progressSchema.index({ student: 1, lesson: 1 }, { unique: true })

const Progress = mongoose.model('Progress', progressSchema)

export default Progress