const generateCertificatePDF = (doc, {
    studentName,
    courseName,
    certificateId,
    issuedAt,
  }) => {
    // title
    doc
      .fontSize(36)
      .font('Helvetica-Bold')
      .text('Certificate of Completion', { align: 'center' })
  
    doc.moveDown()
  
    // intro text
    doc
      .fontSize(20)
      .font('Helvetica')
      .text('This is to certify that', { align: 'center' })
  
    doc.moveDown()
  
    // student name
    doc
      .fontSize(28)
      .font('Helvetica-Bold')
      .text(studentName, { align: 'center' })
  
    doc.moveDown()
  
    // completion text
    doc
      .fontSize(20)
      .font('Helvetica')
      .text('has successfully completed', { align: 'center' })
  
    doc.moveDown()
  
    // course name
    doc
      .fontSize(24)
      .font('Helvetica-Bold')
      .text(courseName, { align: 'center' })
  
    doc.moveDown(2)
  
    // issuer
    doc
      .fontSize(12)
      .font('Helvetica')
      .text('Issued by Moon Digital Academy', { align: 'center' })
  
    doc.moveDown()
  
    // date
    doc
      .fontSize(12)
      .text(`Date: ${new Date(issuedAt).toLocaleDateString()}`, { align: 'center' })
  
    doc.moveDown()
  
    // certificate ID
    doc
      .fontSize(10)
      .fillColor('grey')
      .text(`Certificate ID: ${certificateId}`, { align: 'center' })
  }
  
  export default generateCertificatePDF