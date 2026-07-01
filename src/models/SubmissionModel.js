import mongoose from 'mongoose'

const submissionSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    assignment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Assignment',
      required: true,
    },

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },

    // what the student submitted
    // could be a url, text, or file path
    submissionContent: {
      type: String,
      required: true,
    },

    submittedAt: {
      type: Date,
      default: Date.now,
    },

    // grading fields
    score: {
      type: Number,
      default: null,
    },

    grade: {
      type: String,
      enum: ['A', 'B', 'C', 'D', 'F', 'Pass', 'Fail', null],
      default: null,
    },

    feedback: {
      type: String,
      default: '',
    },

    gradingStatus: {
      type: String,
      enum: ['pending', 'graded', 'revision'],
      default: 'pending',
    },

    // whether student can see grade yet
    gradeReleased: {
      type: Boolean,
      default: false,
    },

    gradedAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
  }
)

// prevent a student from submitting the same assignment twice
submissionSchema.index({ student: 1, assignment: 1 }, { unique: true })

const Submission = mongoose.model('Submission', submissionSchema)

export default Submission