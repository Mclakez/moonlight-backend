import PDFDocument from 'pdfkit'
import Certificate from '../models/CertificateModel.js'
import Enrollment from '../models/EnrollmentModel.js'
import Course from '../models/CourseModel.js'
import generateCertificatePDF from '../utils/generateCertificatePDF.js'

// ─── GENERATE CERTIFICATE ─────────────────────────────────────

// @route  POST /api/certificates/generate/:enrollmentId
// @desc   Generate a certificate for a completed course
// @access Private (student)
export const generateCertificate = async (req, res) => {
  try {
    // 1. find the enrollment
    const enrollment = await Enrollment.findById(req.params.enrollmentId)
      .populate('course')
      .populate('student')

    if (!enrollment) {
      return res.status(404).json({ message: 'Enrollment not found' })
    }

    // 2. make sure this student owns this enrollment
    if (enrollment.student._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: 'Not authorized to generate this certificate',
      })
    }

    // 3. make sure the course is actually completed
    if (!enrollment.completed) {
      return res.status(400).json({
        message: 'You have not completed this course yet',
      })
    }

    // 4. check if certificate already exists
    const existing = await Certificate.findOne({
      student: req.user._id,
      course: enrollment.course._id,
    })

    if (existing) {
      return res.status(200).json({
        message: 'Certificate already exists',
        certificate: existing,
      })
    }

    // 5. create certificate record in database
    const certificate = await Certificate.create({
      student: req.user._id,
      course: enrollment.course._id,
      enrollment: enrollment._id,
    })

    res.status(201).json({
      message: 'Certificate generated successfully',
      certificate,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// ─── DOWNLOAD CERTIFICATE ─────────────────────────────────────

// @route  GET /api/certificates/:id/download
// @desc   Download a certificate as PDF
// @access Private (student)
export const downloadCertificate = async (req, res) => {
  try {
    // 1. find the certificate
    const certificate = await Certificate.findById(req.params.id)
      .populate('student', 'name')
      .populate('course', 'title')

    if (!certificate) {
      return res.status(404).json({ message: 'Certificate not found' })
    }

    // 2. make sure this student owns this certificate
    if (certificate.student._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        message: 'Not authorized to download this certificate',
      })
    }

    // 3. generate the PDF on the fly
    const doc = new PDFDocument({
      layout: 'landscape',
      size: 'A4',
    })

    // 4. set response headers so browser knows it's a PDF download
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=certificate-${certificate.certificateId}.pdf`
    )

    // 5. pipe the PDF directly to the response
    // this means the PDF is streamed to the user as it's being built
    doc.pipe(res)

    // 6. build the PDF content

// replace the pdf building section with this single call
generateCertificatePDF(doc, {
  studentName: certificate.student.name,
  courseName: certificate.course.title,
  certificateId: certificate.certificateId,
  issuedAt: certificate.issuedAt,
})

doc.end()
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// ─── VERIFY CERTIFICATE ───────────────────────────────────────

// @route  GET /api/certificates/:certificateId/verify
// @desc   Verify a certificate is real
// @access Public
export const verifyCertificate = async (req, res) => {
  try {
    const certificate = await Certificate.findOne({
      certificateId: req.params.certificateId,
    })
      .populate('student', 'name')
      .populate('course', 'title')

    if (!certificate) {
      return res.status(404).json({
        valid: false,
        message: 'Certificate not found or invalid',
      })
    }

    res.status(200).json({
      valid: true,
      message: 'Certificate is valid',
      certificate: {
        certificateId: certificate.certificateId,
        studentName: certificate.student.name,
        courseName: certificate.course.title,
        issuedAt: certificate.issuedAt,
      },
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}

// ─── GET MY CERTIFICATES ──────────────────────────────────────

// @route  GET /api/certificates/my-certificates
// @desc   Get all certificates for the logged in student
// @access Private (student)
export const getMyCertificates = async (req, res) => {
  try {
    const certificates = await Certificate.find({ student: req.user._id })
      .populate('course', 'title thumbnail category')
      .sort({ issuedAt: -1 })

    res.status(200).json({
      message: 'Certificates fetched successfully',
      total: certificates.length,
      certificates,
    })
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message })
  }
}