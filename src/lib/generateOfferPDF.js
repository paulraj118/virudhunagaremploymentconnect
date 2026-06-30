import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const generateOfferPDF = (offerData, studentData) => {
  const doc = new jsPDF('p', 'pt', 'a4');

  const { companyName, jobRole, salaryPackage, location, joiningDate, expiryDate, offerId, notes } = offerData;
  const { name: studentName } = studentData;

  // Colors
  const primaryColor = [79, 70, 229]; // Indigo-600
  const textColor = [51, 65, 85]; // Slate-700
  
  // Header Background
  doc.setFillColor(...primaryColor);
  doc.rect(0, 0, doc.internal.pageSize.width, 80, 'F');

  // Header Text
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text(companyName, 40, 50);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Offer ID: ${offerId}`, doc.internal.pageSize.width - 40, 50, { align: 'right' });

  // Reset text color for body
  doc.setTextColor(...textColor);

  // Date & Salutation
  doc.setFontSize(11);
  const issueDate = new Date().toLocaleDateString();
  doc.text(`Date: ${issueDate}`, 40, 120);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Dear ${studentName},`, 40, 160);

  // Body Paragraph
  doc.setFont('helvetica', 'normal');
  const bodyText = `We are delighted to offer you the position of ${jobRole} at ${companyName}. Your skills and background will be a valuable asset to our team. Please review the details of your offer below.`;
  const splitBody = doc.splitTextToSize(bodyText, doc.internal.pageSize.width - 80);
  doc.text(splitBody, 40, 190);

  // Offer Details Table
  doc.autoTable({
    startY: 230,
    margin: { left: 40, right: 40 },
    theme: 'grid',
    headStyles: { fillColor: primaryColor, textColor: [255, 255, 255], fontStyle: 'bold' },
    bodyStyles: { textColor: textColor },
    head: [['Offer Detail', 'Value']],
    body: [
      ['Position', jobRole],
      ['Salary Package (CTC)', salaryPackage],
      ['Work Location', location],
      ['Expected Joining Date', new Date(joiningDate).toLocaleDateString()],
      ['Offer Expiry Date', new Date(expiryDate).toLocaleDateString()]
    ],
  });

  // Additional Notes
  if (notes) {
    const finalY = doc.lastAutoTable.finalY || 350;
    doc.setFont('helvetica', 'bold');
    doc.text('Additional Information:', 40, finalY + 30);
    doc.setFont('helvetica', 'normal');
    const splitNotes = doc.splitTextToSize(notes, doc.internal.pageSize.width - 80);
    doc.text(splitNotes, 40, finalY + 50);
  }

  // Terms and conditions
  const termsY = (doc.lastAutoTable.finalY || 350) + (notes ? 80 : 40);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('Terms & Conditions:', 40, termsY);
  doc.setFont('helvetica', 'normal');
  const terms = `1. This offer is contingent upon successful background verification.
2. You will be bound by the company's rules, regulations, and policies.
3. Please accept this offer before the expiry date to confirm your employment.`;
  const splitTerms = doc.splitTextToSize(terms, doc.internal.pageSize.width - 80);
  doc.text(splitTerms, 40, termsY + 20);

  // Signatures
  const signY = termsY + 120;
  doc.setFont('helvetica', 'bold');
  doc.text('For ' + companyName, 40, signY);
  doc.text('Accepted By:', doc.internal.pageSize.width - 160, signY);
  
  doc.setFont('helvetica', 'normal');
  doc.text('_______________________', 40, signY + 40);
  doc.text('Authorized Signatory', 40, signY + 55);

  doc.text('_______________________', doc.internal.pageSize.width - 160, signY + 40);
  doc.text(studentName, doc.internal.pageSize.width - 160, signY + 55);

  // Footer
  doc.setFontSize(8);
  doc.setTextColor(150, 150, 150);
  doc.text('This is a system generated document.', doc.internal.pageSize.width / 2, doc.internal.pageSize.height - 30, { align: 'center' });

  // Save the PDF
  doc.save(`${studentName.replace(/\s+/g, '_')}_Offer_Letter.pdf`);
};
