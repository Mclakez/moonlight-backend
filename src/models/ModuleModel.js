import mongoose from 'mongoose'

const moduleSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Module title is required'],
      trim: true,
    },

    description: {
      type: String,
      default: '',
    },

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true,
    },

    // controls the order modules appear in
    order: {
      type: Number,
      required: true,
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

const Module = mongoose.model('Module', moduleSchema)

export default Module