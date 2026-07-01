import axios from 'axios'
import crypto from 'crypto'
import Payment from '../models/PaymentModel.js'
import Enrollment from '../models/EnrollmentModel.js'
import Course from '../models/CourseModel.js'

// ─── INITIATE PAYMENT ─────────────────────────────────────────

// @route  POST /api/payments/initiate
// @desc   Start a payment session
// @access Private (student)
export const initiatePayment = async (req, res) => {
  try {
    const { courseId, provider } = req.body

    // 1. find the course
    const course = await Course.findById(courseId)
    if (!course) {
      return res.status(404).json({ message: 'Course not found' })
    }

    // 2. check if student is already enrolled
    const existingEnrollment = await Enrollment.findOne({
      student: req.user._id,
      course: courseId,
    })
    if (existingEnrollment) {
      return res.status(400).json({ message: 'Already enrolled in this course' })
    }

    // 3. check if there's already a pending payment
    const existingPayment = await Payment.findOne({
      student: req.user._id,
      course: courseId,
      status: 'pending',
    })
    if (existingPayment) {
      return res.status(400).json({ message: 'You already have a pending payment for this course' })
    }

    // 4. generate a unique reference
    const reference = `MDA-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`

    // 5. create a pending payment record
    const payment = await Payment.create({
      student: req.user._id,
      course: courseId,
      amount: course.price,
      provider,
      reference,
    })

    // 6. contact the payment provider
    let paymentUrl

    if (provider === 'paystack') {
      const response = await axios.post(
        'https://api.paystack.co/transaction/initialize',
        {
          email: req.user.email,
          amount: course.price * 100, // paystack uses kobo
          reference,
          metadata: {
            courseId,
            studentId: req.user._id,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          },
        }
      )
      paymentUrl = response.data.data.authorization_url

    } else if (provider === 'flutterwave') {
      const response = await axios.post(
        'https://api.flutterwave.com/v3/payments',
        {
          tx_ref: reference,
          amount: course.price,
          currency: 'NGN',
          redirect_url: `${process.env.CLIENT_URL}/payment/verify`,
          customer: {
            email: req.user.email,
            name: req.user.name,
          },
          meta: {
            courseId,
            studentId: req.user._id,
          },
          customizations: {
            title: 'Moon Digital Academy',
            description: `Payment for ${course.title}`,
          },
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
          },
        }
      )
      paymentUrl = response.data.data.link
    }

    res.status(200).json({
      message: 'Payment initiated successfully',
      paymentUrl,
      reference,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// ─── PAYSTACK WEBHOOK ─────────────────────────────────────────

// @route  POST /api/payments/webhook/paystack
// @desc   Paystack confirms payment
// @access Public (called by Paystack, not the frontend)
export const paystackWebhook = async (req, res) => {
  try {
    // 1. verify this request actually came from paystack
    // paystack signs every webhook with your secret key
    const hash = crypto
      .createHmac('sha512', process.env.PAYSTACK_SECRET_KEY)
      .update(JSON.stringify(req.body))
      .digest('hex')

    if (hash !== req.headers['x-paystack-signature']) {
      return res.status(401).json({ message: 'Invalid signature' })
    }

    const event = req.body

    // 2. only process successful payments
    if (event.event === 'charge.success') {
      const { reference, metadata } = event.data

      // 3. find the pending payment
      const payment = await Payment.findOne({ reference })
      if (!payment || payment.status === 'success') {
        return res.status(200).json({ message: 'Already processed' })
      }

      // 4. mark payment as successful
      payment.status = 'success'
      payment.paidAt = Date.now()
      await payment.save()

      // 5. create enrollment automatically
      await Enrollment.create({
        student: metadata.studentId,
        course: metadata.courseId,
        amount: payment.amount,
        paymentReference: reference,
      })

      // 6. update course total enrollments
      await Course.findByIdAndUpdate(metadata.courseId, {
        $inc: { totalEnrollments: 1 },
      })
    }

    // always return 200 to paystack
    // if you return anything else paystack will keep retrying
    res.status(200).json({ message: 'Webhook received' })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// ─── FLUTTERWAVE WEBHOOK ──────────────────────────────────────

// @route  POST /api/payments/webhook/flutterwave
// @desc   Flutterwave confirms payment
// @access Public (called by Flutterwave, not the frontend)
export const flutterwaveWebhook = async (req, res) => {
  try {
    // 1. verify this request actually came from flutterwave
    const signature = req.headers['verif-hash']
    if (signature !== process.env.WEBHOOK_SECRET) {
      return res.status(401).json({ message: 'Invalid signature' })
    }

    const event = req.body

    // 2. only process successful payments
    if (event.status === 'successful') {
      const reference = event.data.tx_ref
      const metadata = event.data.meta

      // 3. verify the payment with flutterwave directly
      // never trust the webhook data alone
      const response = await axios.get(
        `https://api.flutterwave.com/v3/transactions/${event.data.id}/verify`,
        {
          headers: {
            Authorization: `Bearer ${process.env.FLUTTERWAVE_SECRET_KEY}`,
          },
        }
      )

      const verified = response.data.data
      if (verified.status !== 'successful') {
        return res.status(400).json({ message: 'Payment verification failed' })
      }

      // 4. find the pending payment
      const payment = await Payment.findOne({ reference })
      if (!payment || payment.status === 'success') {
        return res.status(200).json({ message: 'Already processed' })
      }

      // 5. mark payment as successful
      payment.status = 'success'
      payment.paidAt = Date.now()
      await payment.save()

      // 6. create enrollment automatically
      await Enrollment.create({
        student: metadata.studentId,
        course: metadata.courseId,
        amount: payment.amount,
        paymentReference: reference,
      })

      // 7. update course total enrollments
      await Course.findByIdAndUpdate(metadata.courseId, {
        $inc: { totalEnrollments: 1 },
      })
    }

    res.status(200).json({ message: 'Webhook received' })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// ─── VERIFY PAYMENT ───────────────────────────────────────────

// @route  GET /api/payments/verify/:reference
// @desc   Manually verify a payment
// @access Private (student)
export const verifyPayment = async (req, res) => {
  try {
    const payment = await Payment.findOne({
      reference: req.params.reference,
    })
      .populate('course', 'title price')
      .populate('student', 'name email')

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' })
    }

    // make sure this student owns this payment
    if (payment.student._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: 'Not authorized to view this payment',
      })
    }

    res.status(200).json({
      message: 'Payment fetched successfully',
      payment,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// ─── PAYMENT HISTORY ─────────────────────────────────────────

// @route  GET /api/payments/history
// @desc   Get student payment history
// @access Private (student)
export const getPaymentHistory = async (req, res) => {
  try {
    const payments = await Payment.find({ student: req.user._id })
      .populate('course', 'title thumbnail price')
      .sort({ createdAt: -1 })

    res.status(200).json({
      message: 'Payment history fetched successfully',
      total: payments.length,
      payments,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// ─── INVOICE GENERATION ───────────────────────────────────────

// @route  GET /api/payments/:id/invoice
// @desc   Get invoice for a payment
// @access Private (student)
export const getInvoice = async (req, res) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate('course', 'title price')
      .populate('student', 'name email')

    if (!payment) {
      return res.status(404).json({ message: 'Payment not found' })
    }

    if (payment.student._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: 'Not authorized to view this invoice',
      })
    }

    if (payment.status !== 'success') {
      return res.status(400).json({
        message: 'Invoice only available for successful payments',
      })
    }

    // build invoice object
    const invoice = {
      invoiceId: payment.invoiceId,
      issuedTo: {
        name: payment.student.name,
        email: payment.student.email,
      },
      course: payment.course.title,
      amount: payment.amount,
      provider: payment.provider,
      reference: payment.reference,
      status: payment.status,
      paidAt: payment.paidAt,
      issuedBy: 'Moon Digital Academy',
    }

    res.status(200).json({
      message: 'Invoice fetched successfully',
      invoice,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}