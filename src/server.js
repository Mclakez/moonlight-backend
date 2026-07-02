import dotenv from 'dotenv'
import connectDB from './config/db.js'
import express from 'express'
import helmet from 'helmet'
import cors from 'cors'
import authRoutes from './routes/authRoutes.js'
import { notFound, errorHandler } from './middleware/errorHandler.js'
import courseRoutes from './routes/courseRoutes.js'
import enrollmentRoutes from './routes/enrollmentRoutes.js'
import studentRoutes from './routes/studentRoutes.js'
import moduleRoutes from './routes/moduleRoutes.js'
import lessonRoutes from './routes/lessonRoutes.js'
import assignmentRoutes from './routes/assignmentRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
import certificateRoutes from './routes/certificateRoutes.js'
import paymentRoutes from './routes/paymentRoutes.js'
import postRoutes from './routes/postRoutes.js'
dotenv.config()
connectDB()

const app = express()
app.set('trust proxy', 1)

// security headers
app.use(helmet())

app.use(cors({
  origin: true,
  credentials: true,
}))

app.use('/api/payments/webhook', express.raw({ type: 'application/json' }))

app.use(express.json())



app.use('/api/auth', authRoutes)
app.use('/api/courses', courseRoutes)
app.use('/api/enrollments', enrollmentRoutes)
app.use('/api/student', studentRoutes)
app.use('/api/modules', moduleRoutes)
app.use('/api/lessons', lessonRoutes)
app.use('/api/assignments', assignmentRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/certificates', certificateRoutes)
app.use('/api/payments', paymentRoutes)
app.use('/api/posts', postRoutes)

app.use(notFound)
app.use(errorHandler)

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))