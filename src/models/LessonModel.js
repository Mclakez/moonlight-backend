import mongoose from 'mongoose'

const lessonSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Lesson title is required'],
      trim: true,
    },

    description: {
      type: String,
      default: '',
    },

    module: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Module',
      required: true,
    },

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },

    // type of content
    lessonType: {
      type: String,
      enum: [
        'video',
        'document',
        'presentation',
        'audio',
        'quiz',
        'assignment',
        'downloadable',
      ],
      required: true,
    },

    // url of the uploaded content
    contentUrl: {
      type: String,
      default: '',
    },

    duration: {
      type: String,
      default: '',
    },

    // controls the order lessons appear in a module
    order: {
      type: Number,
      required: true,
    },

    // free preview or enrolled students only
    visibility: {
      type: String,
      enum: ['enrolled', 'free'],
      default: 'enrolled',
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

const Lesson = mongoose.model('Lesson', lessonSchema)

export default Lesson