import { jsPDF } from 'jspdf';

export interface PDFData {
  imageName: string;
  verdict: string;
  confidence: number;
  timestamp: string;
  analysis: string;
  riskIndicators: string[];
  imageUrl?: string;
}

export function generateSecurityPDF(data: PDFData) {
  const doc = new jsPDF();
  const primaryColor = '#3b82f6';
  const redColor = '#ef4444';
  const emeraldColor = '#10b981';
  const amberColor = '#f59e0b';
  
  const verdictColor = data.verdict.toLowerCase() === 'phishing' ? redColor : 
                     data.verdict.toLowerCase() === 'safe' ? emeraldColor : amberColor;

  // Header
  doc.setFillColor(30, 30, 35); // Dark background
  doc.rect(0, 0, 210, 40, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.text('PhiShield AI', 20, 25);
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Advanced Phishing Intelligence Report', 20, 32);
  
  // Title Section
  doc.setTextColor(30, 30, 35);
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text(data.imageName || 'Security Investigation', 20, 55);
  
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated on: ${data.timestamp}`, 20, 62);
  
  // Verdict Box
  doc.setDrawColor(verdictColor);
  doc.setLineWidth(0.5);
  doc.roundedRect(20, 70, 170, 25, 3, 3, 'S');
  
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('FINAL VERDICT', 25, 78);
  doc.text('CONFIDENCE', 140, 78);
  
  doc.setFontSize(14);
  doc.setTextColor(verdictColor);
  doc.setFont('helvetica', 'bold');
  doc.text(data.verdict.toUpperCase(), 25, 87);
  doc.text(`${data.confidence}%`, 140, 87);

  let currentY = 105;

  // Evidence Image
  if (data.imageUrl) {
    try {
      // Add a title for the image
      doc.setTextColor(30, 30, 35);
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text('Analyzed image', 20, currentY);
      currentY += 6;
      
      doc.setDrawColor(200, 200, 200);
      doc.setLineWidth(0.2);
      doc.line(20, currentY, 190, currentY);
      currentY += 10;

      // jsPDF addImage handles aspect ratio if we provide width and calculate height
      // Or we can get image properties
      const imgProps = doc.getImageProperties(data.imageUrl);
      const pageWidth = 170; // 210 - 20 - 20
      const pageHeight = 160; 
      
      let imgWidth = imgProps.width;
      let imgHeight = imgProps.height;
      
      // Proportional scaling
      const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);
      const finalWidth = imgWidth * ratio;
      const finalHeight = imgHeight * ratio;
      
      doc.addImage(data.imageUrl, 'JPEG', 20 + (pageWidth - finalWidth) / 2, currentY, finalWidth, finalHeight, undefined, 'FAST');
    } catch (e) {
      console.error("Failed to add image to PDF:", e);
    }
  }
  
  // Force new page for Analysis as requested
  doc.addPage();
  currentY = 20;

  // Analysis
  doc.setTextColor(verdictColor);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Report analysis', 20, currentY);
  currentY += 6;
  
  doc.setDrawColor(verdictColor);
  doc.setLineWidth(1);
  doc.line(20, currentY, 40, currentY); // Accent line
  currentY += 12;
  
  doc.setFontSize(10);
  doc.setTextColor(60, 60, 60);

  // Custom renderer for pointwise text with bold support (matching website style)
  const renderRichText = (text: string, x: number, y: number, maxWidth: number) => {
    const lines = text.split('\n');
    let currentLineY = y;
    const lineHeight = 6;

    lines.forEach(line => {
      // Handle page break
      if (currentLineY > 275) {
        doc.addPage();
        currentLineY = 20;
      }

      const trimmedLine = line.trim();
      if (trimmedLine === '') {
        currentLineY += lineHeight / 2;
        return;
      }
      
      let currentX = x;
      // Handle markdown bullets
      const isBullet = trimmedLine.startsWith('- ') || trimmedLine.startsWith('* ') || trimmedLine.startsWith('• ');
      let lineToProcess = line;
      
      if (isBullet) {
        doc.setTextColor(verdictColor);
        doc.setFont('helvetica', 'bold');
        doc.text('•', currentX, currentLineY);
        doc.setFont('helvetica', 'normal');
        currentX += 5;
        // Find index of first space or actual start of text after bullet marker
        const bulletMatch = trimmedLine.match(/^[-*•]\s*/);
        if (bulletMatch) {
          lineToProcess = line.substring(line.indexOf(bulletMatch[0]) + bulletMatch[0].length);
        }
      }

      const parts = lineToProcess.split(/(\*\*.*?\*\*)/g);
      
      parts.forEach(part => {
        if (part.startsWith('**') && part.endsWith('**')) {
          doc.setFont('helvetica', 'bold');
          doc.setTextColor(verdictColor);
          const cleanPart = part.slice(2, -2);
          const words = cleanPart.split(' ');
          
          words.forEach((word, idx) => {
            const wordWithSpace = idx === words.length - 1 ? word : word + ' ';
            const width = doc.getTextWidth(wordWithSpace);
            
            if (currentX + width > x + maxWidth) {
              currentX = isBullet ? x + 5 : x;
              currentLineY += lineHeight;
              // Check page break again inside word loop
              if (currentLineY > 275) {
                doc.addPage();
                currentLineY = 20;
              }
            }
            doc.text(wordWithSpace, currentX, currentLineY);
            currentX += width;
          });
        } else {
          doc.setFont('helvetica', 'normal');
          doc.setTextColor(60, 60, 60);
          const words = part.split(' ');
          words.forEach((word, idx) => {
            if (word === '') return;
            const wordWithSpace = idx === words.length - 1 ? word : word + ' ';
            const width = doc.getTextWidth(wordWithSpace);
            
            if (currentX + width > x + maxWidth) {
              currentX = isBullet ? x + 5 : x;
              currentLineY += lineHeight;
              // Check page break again inside word loop
              if (currentLineY > 275) {
                doc.addPage();
                currentLineY = 20;
              }
            }
            doc.text(wordWithSpace, currentX, currentLineY);
            currentX += width;
          });
        }
      });
      
      currentLineY += lineHeight;
    });
    
    return currentLineY + lineHeight;
  };

  // Filter out headers if they are redundant and render using the rich text helper
  const cleanAnalysis = data.analysis;
  currentY = renderRichText(cleanAnalysis, 20, currentY, 170);
  
  // Risk Indicators
  if (data.riskIndicators && data.riskIndicators.length > 0) {
    if (currentY > 250) {
      doc.addPage();
      currentY = 20;
    } else {
      currentY += 15;
    }
    
    doc.setTextColor(redColor);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Threat Signatures Detected', 20, currentY);
    
    currentY += 8;
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(80, 80, 80);
    
    data.riskIndicators.forEach((indicator, index) => {
      if (currentY > 270) {
        doc.addPage();
        currentY = 20;
      }
      doc.text(`• ${indicator}`, 25, currentY);
      currentY += 7;
    });
  }
  
  // Footer on all pages
  const pageCount = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Page ${i} of ${pageCount}`, 180, 285);
    doc.text('PhiShield AI © 2026 - Security Intelligence Proprietary Report', 20, 285);
  }
  
  doc.save(`phishield-report-${Date.now()}.pdf`);
}

export function generateBatchPDF(scans: PDFData[]) {
  const doc = new jsPDF();
  
  scans.forEach((data, scanIndex) => {
    if (scanIndex > 0) doc.addPage();
    
    const primaryColor = '#3b82f6';
    const redColor = '#ef4444';
    const emeraldColor = '#10b981';
    const amberColor = '#f59e0b';
    
    const verdictColor = data.verdict.toLowerCase() === 'phishing' ? redColor : 
                       data.verdict.toLowerCase() === 'safe' ? emeraldColor : amberColor;

    // Header
    doc.setFillColor(30, 30, 35);
    doc.rect(0, 0, 210, 35, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('PhiShield AI Batch Report', 20, 20);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Item ${scanIndex + 1} of ${scans.length}`, 20, 27);

    // Title Section
    doc.setTextColor(30, 30, 35);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(data.imageName || 'Security Investigation', 20, 50);
    
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.setFont('helvetica', 'normal');
    doc.text(`Timestamp: ${data.timestamp}`, 20, 56);
    
    // Verdict Box
    doc.setDrawColor(verdictColor);
    doc.setLineWidth(0.5);
    doc.roundedRect(20, 65, 170, 20, 2, 2, 'S');
    
    doc.setFontSize(7);
    doc.setTextColor(100, 100, 100);
    doc.text('VERDICT', 25, 72);
    doc.text('CONFIDENCE', 140, 72);
    
    doc.setFontSize(12);
    doc.setTextColor(verdictColor);
    doc.setFont('helvetica', 'bold');
    doc.text(data.verdict.toUpperCase(), 25, 79);
    doc.text(`${data.confidence}%`, 140, 79);
    
    // Analysis
    doc.setTextColor(30, 30, 35);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text('Analysis Report', 20, 95);
    
    doc.setDrawColor(220, 220, 220);
    doc.line(20, 97, 190, 97);
    
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(60, 60, 60);
    
    const splitAnalysis = doc.splitTextToSize(data.analysis.replace(/\*\*/g, ''), 170);
    doc.text(splitAnalysis, 20, 105);
    
    let currentY = 105 + (splitAnalysis.length * 5);
    
    // Risk Indicators
    if (data.riskIndicators && data.riskIndicators.length > 0) {
      currentY += 10;
      doc.setTextColor(redColor);
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Detected Threat Signatures', 20, currentY);
      
      currentY += 6;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(80, 80, 80);
      
      data.riskIndicators.slice(0, 5).forEach((indicator) => {
        doc.text(`• ${indicator}`, 25, currentY);
        currentY += 5;
      });
    }
  });
  
  doc.save(`phishield-batch-report-${Date.now()}.pdf`);
}
