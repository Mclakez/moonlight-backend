import mongoose from 'mongoose'

const paymentSchema = new mongoose.Schema(
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

    amount: {
      type: Number,
      required: true,
    },

    // which payment provider was used
    provider: {
      type: String,
      enum: ['paystack', 'flutterwave'],
      required: true,
    },

    // unique transaction ID from the provider
    reference: {
      type: String,
      required: true,
      unique: true,
    },

    status: {
      type: String,
      enum: ['pending', 'success', 'failed'],
      default: 'pending',
    },

    paidAt: {
      type: Date,
      default: null,
    },

    // unique invoice number for this transaction
    invoiceId: {
      type: String,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
)

// generate invoice ID before saving
paymentSchema.pre('save', function (next) {
  if (!this.invoiceId) {
    const timestamp = Date.now()
    const random = Math.floor(Math.random() * 1000)
    this.invoiceId = `MDA-INV-${timestamp}-${random}`
  }
  next()
})

const Payment = mongoose.model('Payment', paymentSchema)

export default Payment