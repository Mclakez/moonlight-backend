import express from 'express'
import {
  generateCertificate,
  downloadCertificate,
  verifyCertificate,
  getMyCertificates,
} from '../controllers/certificateController.js'
import { protect, authorize } from '../middleware/auth.js'

const router = express.Router()

// specific routes first
router.get(
  '/my-certificates',
  protect,
  authorize('student'),
  getMyCertificates
)

router.get(
  '/:certificateId/verify',
  verifyCertificate // public, no token needed
)

router.post(
  '/generate/:enrollmentId',
  protect,
  authorize('student'),
  generateCertificate
)

router.get(
  '/:id/download',
  protect,
  authorize('student'),
  downloadCertificate
)

export default router