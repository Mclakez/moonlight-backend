import express from 'express'
import {
  initiatePayment,
  paystackWebhook,
  flutterwaveWebhook,
  verifyPayment,
  getPaymentHistory,
  getInvoice,
} from '../controllers/paymentController.js'
import { protect, authorize } from '../middleware/auth.js'

const router = express.Router()

// student routes
router.post('/initiate', protect, authorize('student'), initiatePayment)
router.get('/verify/:reference', protect, authorize('student'), verifyPayment)
router.get('/history', protect, authorize('student'), getPaymentHistory)
router.get('/:id/invoice', protect, authorize('student'), getInvoice)

// webhook routes — public, called by payment providers
// no token needed, they use signature verification instead
router.post('/webhook/paystack', paystackWebhook)
router.post('/webhook/flutterwave', flutterwaveWebhook)

export default router