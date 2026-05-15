// pdf.js - PDF generation with lazy-loaded jsPDF

/**
 * Generate a PDF summary of the current vehicle configuration.
 * Dynamically imports jsPDF only when called.
 * @param {Object} state - Current configurator state
 * @param {Object} productData - The product data object
 * @param {string} locale - Current locale ('de' or 'en')
 * @param {Object} uiStrings - Locale-specific UI strings
 */
export async function generatePDF(state, productData, locale, uiStrings) {
  // Dynamic import — only loads jsPDF when user requests PDF
  const { jsPDF } = await import('https://cdn.jsdelivr.net/npm/jspdf@2.5.2/+esm');

  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 0;

  // Header with FAS Expedition branding
  doc.setFillColor(0, 0, 0);
  doc.rect(0, 0, pageWidth, 35, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('FAS EXPEDITION', pageWidth / 2, 18, { align: 'center' });
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(uiStrings['pdf.subtitle'], pageWidth / 2, 26, { align: 'center' });

  y = 45;

  // Date formatted by locale
  doc.setTextColor(100, 100, 100);
  doc.setFontSize(9);
  const dateStr = new Date().toLocaleDateString(
    locale === 'de' ? 'de-DE' : 'en-GB',
    { year: 'numeric', month: 'long', day: 'numeric' }
  );
  doc.text(`${uiStrings['pdf.date']}: ${dateStr}`, 20, y);
  y += 15;

  // Title
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(uiStrings['pdf.title'], 20, y);
  y += 12;

  // Helper to find option name by ID
  function getOptionName(collection, id) {
    const item = collection.find(opt => opt.id === id);
    if (!item) return id;
    return item.name[locale] || item.name.de || id;
  }

  const selections = state.selections || state;

  // Platform section
  if (selections.platform) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(uiStrings['pdf.section.platform'], 20, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(getOptionName(productData.platforms, selections.platform), 25, y);
    y += 12;
  }

  // Cabin section
  if (selections.cabinSize) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(uiStrings['pdf.section.cabin'], 20, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(getOptionName(productData.cabinSizes, selections.cabinSize), 25, y);
    y += 12;
  }

  // Equipment section
  if (selections.equipmentLine) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(uiStrings['pdf.section.equipment'], 20, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(getOptionName(productData.equipmentLines, selections.equipmentLine), 25, y);
    y += 12;
  }

  // Accessories section
  const accessories = selections.accessories || [];
  if (accessories.length > 0) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(uiStrings['pdf.section.accessories'], 20, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    for (const accId of accessories) {
      doc.text(`• ${getOptionName(productData.accessories, accId)}`, 25, y);
      y += 6;
    }
    y += 6;
  }

  // Contact section
  if (state.contact && state.contact.name) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(uiStrings['pdf.section.contact'], 20, y);
    y += 7;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    if (state.contact.name) doc.text(state.contact.name, 25, y), y += 6;
    if (state.contact.email) doc.text(state.contact.email, 25, y), y += 6;
    if (state.contact.phone) doc.text(state.contact.phone, 25, y), y += 6;
    if (state.contact.company) doc.text(state.contact.company, 25, y), y += 6;
  }

  // Disclaimer at bottom
  const disclaimer = uiStrings['pdf.disclaimer'];
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text(disclaimer, pageWidth / 2, doc.internal.pageSize.getHeight() - 15, {
    align: 'center',
    maxWidth: pageWidth - 40,
  });

  // Save with locale-appropriate filename
  const filename = locale === 'de'
    ? `FAS-Expedition-Konfiguration-${Date.now()}.pdf`
    : `FAS-Expedition-Configuration-${Date.now()}.pdf`;
  doc.save(filename);
}
