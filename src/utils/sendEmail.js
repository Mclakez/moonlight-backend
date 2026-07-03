import nodemailer from 'nodemailer'

const sendEmail = async ({ to, subject, html }) => {
  const host = process.env.EMAIL_HOST || 'smtp.mailtrap.io'
  const port = Number(process.env.EMAIL_PORT || 2525)
  const secure = process.env.EMAIL_SECURE === 'true' || port === 465
  const timeoutMs = Number(process.env.EMAIL_TIMEOUT_MS || 10000)

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('Email service is not configured')
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    connectionTimeout: timeoutMs,
    greetingTimeout: timeoutMs,
    socketTimeout: timeoutMs,
  })

  return Promise.race([
    transporter.sendMail({
      from: `"Moon Digital Academy" <${process.env.EMAIL_FROM || process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    }),
    new Promise((_, reject) => {
      setTimeout(() => reject(new Error(`Email delivery timed out after ${timeoutMs}ms`)), timeoutMs)
    }),
  ])
}

export default sendEmail