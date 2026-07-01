import mongoose from 'mongoose'

const courseSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Course title is required'],
      trim: true,
    },

    description: {
      type: String,
      required: [true, 'Course description is required'],
    },

    category: {
      type: String,
      required: [true, 'Course category is required'],
      trim: true,
    },

    level: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced'],
      required: [true, 'Course level is required'],
    },

    language: {
      type: String,
      default: 'English',
    },

    price: {
      type: Number,
      required: [true, 'Course price is required'],
      min: [0, 'Price cannot be negative'],
    },

    thumbnail: {
      type: String,
      default: '',
    },

    duration: {
      type: String,
      default: '',
    },

    learningObjectives: {
      type: [String],
      default: [],
    },

    requirements: {
      type: [String],
      default: [],
    },

    targetAudience: {
      type: String,
      default: '',
    },

    instructor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    status: {
      type: String,
      enum: ['draft', 'pending', 'published', 'rejected'],
      default: 'draft',
    },

    isApproved: {
      type: Boolean,
      default: false,
    },

    totalEnrollments: {
      type: Number,
      default: 0,
    },
    modules: [
        {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Module',
        },
      ],
  },
  {
    timestamps: true,
  }
)


// this tells MongoDB which fields to search across when a search query comes in
courseSchema.index({ title: 'text', description: 'text' })

const Course = mongoose.model('Course', courseSchema)

export default Course