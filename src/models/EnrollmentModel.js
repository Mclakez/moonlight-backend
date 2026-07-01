import mongoose from 'mongoose'

const enrollmentSchema = new mongoose.Schema(
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

    // amount paid at time of enrollment
    amount: {
      type: Number,
      required: true,
    },

    // payment reference from payment provider
    // useful when payment card comes
    paymentReference: {
      type: String,
      default: '',
    },

    enrolledAt: {
      type: Date,
      default: Date.now,
    },

    // has the student completed the course
    completed: {
      type: Boolean,
      default: false,
    },

    completedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
)

// prevent a student from enrolling in the same course twice
enrollmentSchema.index({ student: 1, course: 1 }, { unique: true })

const Enrollment = mongoose.model('Enrollment', enrollmentSchema)

export default Enrollment