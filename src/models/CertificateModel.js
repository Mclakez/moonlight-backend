import mongoose from 'mongoose'
import crypto from 'crypto'

const certificateSchema = new mongoose.Schema(
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

    enrollment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Enrollment',
      required: true,
    },

    // unique public ID for verification
    certificateId: {
      type: String,
      unique: true,
      default: () => crypto.randomBytes(16).toString('hex'),
    },

    issuedAt: {
      type: Date,
      default: Date.now,
    },

    // we'll store the PDF as base64 or a file path
    pdfUrl: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
)

// prevent duplicate certificates
// one student can only have one certificate per course
certificateSchema.index({ student: 1, course: 1 }, { unique: true })

const Certificate = mongoose.model('Certificate', certificateSchema)

export default Certificate