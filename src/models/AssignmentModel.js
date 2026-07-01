import mongoose from 'mongoose'

const assignmentSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Assignment title is required'],
      trim: true,
    },

    description: {
      type: String,
      required: [true, 'Assignment description is required'],
    },

    instructions: {
      type: String,
      default: '',
    },

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },

    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Lesson',
      required: true,
    },

    // how students can submit
    submissionType: {
      type: String,
      enum: [
        'file',
        'text',
        'image',
        'video',
        'link',
      ],
      required: true,
    },

    allowedFileTypes: {
      type: [String],
      default: [],
    },

    maxFileSize: {
      type: Number, // in MB
      default: 10,
    },

    totalMarks: {
      type: Number,
      required: true,
    },

    dueDate: {
      type: Date,
      required: true,
    },

    // notify students when published
    notifyStudents: {
      type: Boolean,
      default: true,
    },

    status: {
      type: String,
      enum: ['draft', 'published'],
      default: 'draft',
    },
  },
  {
    timestamps: true,
  }
)

const Assignment = mongoose.model('Assignment', assignmentSchema)

export default Assignment