import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export const generatePrescriptionPDF = (prescription, doctorName, patientName, dateStr) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const filename = `prescription_${prescription._id || Date.now()}.pdf`;
      const uploadDir = path.join(process.cwd(), 'uploads', 'prescriptions');

      // Ensure upload directory exists
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const filePath = path.join(uploadDir, filename);
      const writeStream = fs.createWriteStream(filePath);

      doc.pipe(writeStream);

      // Clinic Header
      doc.fillColor('#0d9488')
         .fontSize(20)
         .text('ANTIGRAVITY HEALTH CENTRE', { align: 'center', bold: true });
      
      doc.fontSize(10)
         .fillColor('#4b5563')
         .text('101 Wellness Circle, Medical City | Phone: +91 98765 43210', { align: 'center' });
      
      doc.moveDown();
      doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      // Meta Information (Doctor & Patient info)
      doc.fontSize(12).fillColor('#1f2937');
      doc.text(`Doctor: Dr. ${doctorName}`, { bold: true });
      doc.text(`Patient: ${patientName}`);
      doc.text(`Date: ${dateStr}`);
      doc.moveDown();

      doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      // Diagnosis
      doc.fontSize(14).fillColor('#0d9488').text('Diagnosis & Clinical Findings', { bold: true });
      doc.fontSize(11).fillColor('#1f2937').text(prescription.diagnosis);
      doc.moveDown();

      // Medicines Table
      doc.fontSize(14).fillColor('#0d9488').text('Rx (Medicines)', { bold: true });
      doc.moveDown(0.5);

      prescription.medicines.forEach((med, idx) => {
        doc.fontSize(11).fillColor('#1f2937')
           .text(`${idx + 1}. ${med.name} - ${med.dosage} (${med.frequency} for ${med.duration})`);
        doc.moveDown(0.2);
      });
      
      doc.moveDown();

      // Advice
      if (prescription.advice) {
        doc.fontSize(14).fillColor('#0d9488').text('Advice & Instructions', { bold: true });
        doc.fontSize(11).fillColor('#1f2937').text(prescription.advice);
        doc.moveDown();
      }

      // Footer Signature area
      doc.moveDown(2);
      doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(350, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor('#4b5563').text("Doctor's Signature / Stamp", 350, doc.y, { align: 'center' });

      doc.end();

      writeStream.on('finish', () => {
        // Return local file path or web-accessible URL
        // In local development, we'll serve it at /uploads/prescriptions/filename
        const fileUrl = `/uploads/prescriptions/${filename}`;
        resolve(fileUrl);
      });

      writeStream.on('error', (err) => {
        reject(err);
      });
    } catch (error) {
      reject(error);
    }
  });
};
