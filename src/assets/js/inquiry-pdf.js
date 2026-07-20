/**
 * Inquiry Form PDF Generator
 * Generates a structured PDF from inquiry form data for internal use and quote creation.
 * Exposed as window.generateInquiryPDF(formData, locale) → { base64, filename }
 *
 * formData shape:
 *   name, street, postal, country, email, phone, message,
 *   base_vehicle_model, base_vehicle_custom,
 *   checkboxes: [{name, value}], (all checked .inquiry-detail-checkbox elements)
 *   bare_cabin_length, bare_cabin_width, bare_cabin_height,
 *   bare_cabin_paintwork, bare_cabin_color_code, bare_cabin_treppe, bare_cabin_tuer,
 *   side_window_klein, side_window_gross, side_window_panorama,
 *   roof_window_klein, roof_window_gross, bare_cabin_special_items,
 *   energy_battery_capacity, water_tank_capacity,
 *   climate_heating_model, climate_air_conditioning,
 *   cooling_type, cooling_freezer_option,
 *   shower_wc_type, shower_wc_toilet_type,
 *   special_wishes
 */
(function () {
  window.generateInquiryPDF = async function (formData, locale) {
    const { jsPDF } = await import('https://cdn.jsdelivr.net/npm/jspdf@2.5.2/+esm');

    const doc = new jsPDF();
    const pageW = doc.internal.pageSize.getWidth();
    const pageH = doc.internal.pageSize.getHeight();
    const margin = 18;
    const contentW = pageW - margin * 2;
    const isDE = locale === 'de';

    let y = 0;

    // ─── Layout helpers ───────────────────────────────────────────────────────

    function checkPage(needed) {
      if (y + needed > pageH - 18) {
        doc.addPage();
        y = 22;
      }
    }

    function sectionHeader(title) {
      checkPage(14);
      doc.setFillColor(15, 15, 15);
      doc.rect(margin, y - 4, contentW, 11, 'F');
      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.text(title.toUpperCase(), margin + 3, y + 4);
      doc.setTextColor(0, 0, 0);
      y += 13;
    }

    function subHeader(title) {
      checkPage(10);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(40, 40, 40);
      doc.text(title, margin, y);
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y + 1.5, margin + contentW, y + 1.5);
      doc.setTextColor(0, 0, 0);
      y += 8;
    }

    /**
     * Render a label:value row. label is right-padded to 52pt.
     */
    function row(label, value, indent = 0) {
      if (value === null || value === undefined || value === '') return;
      checkPage(7);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(90, 90, 90);
      doc.text(label + ':', margin + indent, y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      const maxW = contentW - 52 - indent;
      const lines = doc.splitTextToSize(String(value), maxW);
      doc.text(lines, margin + indent + 52, y);
      y += 5.5 * lines.length + 1.5;
    }

    function bullet(text) {
      if (!text) return;
      checkPage(5.5);
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      const lines = doc.splitTextToSize('• ' + text, contentW - 6);
      doc.text(lines, margin + 4, y);
      y += 5.5 * lines.length;
    }

    function spacer(h = 5) {
      y += h;
    }

    // ─── Filter checkboxes by name-prefix ────────────────────────────────────
    const cb = (prefix) =>
      (formData.checkboxes || [])
        .filter((c) => c.name.startsWith(prefix))
        .map((c) => c.value);

    // ─── HEADER ──────────────────────────────────────────────────────────────
    doc.setFillColor(0, 0, 0);
    doc.rect(0, 0, pageW, 33, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('FAS EXPEDITION', pageW / 2, 14, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.text(
      isDE ? 'Kundenanfrage – Intern / Vertraulich' : 'Customer Inquiry – Internal / Confidential',
      pageW / 2,
      24,
      { align: 'center' }
    );

    y = 42;

    // Date + reference
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(110, 110, 110);
    const now = new Date();
    const dateStr = now.toLocaleDateString(isDE ? 'de-DE' : 'en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const timeStr = now.toLocaleTimeString(isDE ? 'de-DE' : 'en-GB', {
      hour: '2-digit',
      minute: '2-digit',
    });
    const ref = `REF-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    doc.text(`${isDE ? 'Datum' : 'Date'}: ${dateStr}, ${timeStr}`, margin, y);
    doc.text(`${isDE ? 'Ref' : 'Ref'}: ${ref}`, pageW - margin, y, { align: 'right' });
    y += 10;

    // ─── KUNDENDATEN ─────────────────────────────────────────────────────────
    sectionHeader(isDE ? 'Kundendaten' : 'Customer Information');
    row(isDE ? 'Name' : 'Name', formData.name);
    row(isDE ? 'Straße' : 'Street', formData.street);
    row(isDE ? 'PLZ / Ort' : 'Postal / City', formData.postal);
    row(isDE ? 'Land' : 'Country', formData.country);
    row('E-Mail', formData.email);
    row(isDE ? 'Telefon' : 'Phone', formData.phone);
    spacer(4);

    // ─── NACHRICHT ───────────────────────────────────────────────────────────
    if (formData.message) {
      sectionHeader(isDE ? 'Nachricht des Kunden' : 'Customer Message');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      const msgLines = doc.splitTextToSize(formData.message, contentW);
      for (const line of msgLines) {
        checkPage(5.5);
        doc.text(line, margin, y);
        y += 5.5;
      }
      spacer(4);
    }

    // ─── FAHRZEUGKONFIGURATION ───────────────────────────────────────────────
    const hasVehicleData =
      formData.base_vehicle_model ||
      (formData.checkboxes && formData.checkboxes.length > 0) ||
      formData.bare_cabin_length ||
      formData.energy_battery_capacity;

    if (hasVehicleData) {
      sectionHeader(isDE ? 'Fahrzeugkonfiguration' : 'Vehicle Configuration');

      // ── Basisfahrzeug ──
      const basisCB = cb('details_basisfahrzeug');
      if (formData.base_vehicle_model || formData.base_vehicle_custom || basisCB.length) {
        subHeader(isDE ? 'Basisfahrzeug' : 'Base Vehicle');
        const modelVal =
          formData.base_vehicle_model === 'anderes Fahrgestell'
            ? isDE
              ? 'Anderes Fahrgestell'
              : 'Other Chassis'
            : formData.base_vehicle_model;
        row(isDE ? 'Modell' : 'Model', modelVal);
        if (formData.base_vehicle_custom)
          row(isDE ? 'Angabe' : 'Specification', formData.base_vehicle_custom);
        basisCB.forEach((v) => bullet(v));
        spacer(4);
      }

      // ── Leerkabine ──
      const leerkabineHasValues = [
        'bare_cabin_length', 'bare_cabin_width', 'bare_cabin_height',
        'bare_cabin_paintwork', 'bare_cabin_color_code', 'bare_cabin_treppe',
        'bare_cabin_tuer', 'side_window_klein', 'side_window_gross',
        'side_window_panorama', 'roof_window_klein', 'roof_window_gross',
        'bare_cabin_special_items',
      ].some((f) => formData[f]);
      const stauklappenCB = cb('details_stauklappen');
      const leerkabineCB = cb('details_leerkabine');

      if (leerkabineHasValues || stauklappenCB.length || leerkabineCB.length) {
        subHeader(isDE ? 'Leerkabine' : 'Bare Cabin');
        const dims = [
          formData.bare_cabin_length,
          formData.bare_cabin_width,
          formData.bare_cabin_height,
        ].filter(Boolean);
        if (dims.length)
          row(isDE ? 'Maße (L × B × H)' : 'Dimensions (L × W × H)', dims.join(' × ') + ' m');
        row(isDE ? 'Lackierung' : 'Paintwork', formData.bare_cabin_paintwork);
        row(isDE ? 'Farbbezeichnung/-code' : 'Color Name/Code', formData.bare_cabin_color_code);
        row(isDE ? 'Treppe' : 'Staircase', formData.bare_cabin_treppe);
        row(isDE ? 'Tür' : 'Door', formData.bare_cabin_tuer);
        if (formData.side_window_klein)
          row(isDE ? 'Seitenfenster klein (Stk.)' : 'Side windows small (qty)', formData.side_window_klein);
        if (formData.side_window_gross)
          row(isDE ? 'Seitenfenster groß (Stk.)' : 'Side windows large (qty)', formData.side_window_gross);
        if (formData.side_window_panorama)
          row(isDE ? 'Seitenfenster Panorama (Stk.)' : 'Panorama side windows (qty)', formData.side_window_panorama);
        if (formData.roof_window_klein)
          row(isDE ? 'Dachfenster klein (Stk.)' : 'Roof windows small (qty)', formData.roof_window_klein);
        if (formData.roof_window_gross)
          row(isDE ? 'Dachfenster groß (Stk.)' : 'Roof windows large (qty)', formData.roof_window_gross);
        stauklappenCB.forEach((v) => bullet(v));
        leerkabineCB.forEach((v) => bullet(v));
        if (formData.bare_cabin_special_items)
          row(isDE ? 'Besondere Utensilien / Maße' : 'Special Equipment / Dimensions', formData.bare_cabin_special_items);
        spacer(4);
      }

      // ── Schnittstellen ──
      const schnittCB = cb('details_schnittstellen');
      if (schnittCB.length) {
        subHeader(isDE ? 'Schnittstellen Fahrzeug / Wohnkabine' : 'Vehicle / Cabin Interfaces');
        schnittCB.forEach((v) => bullet(v));
        spacer(4);
      }

      // ── Innenausbau ──
      const innenFields = [
        'energy_battery_capacity', 'water_tank_capacity',
        'climate_heating_model', 'climate_air_conditioning',
        'cooling_type', 'cooling_freezer_option',
        'shower_wc_type', 'shower_wc_toilet_type',
      ].some((f) => formData[f]);
      const innenCB = [
        ...cb('details_innenausbau'),
        ...cb('sleeping_'),
        ...cb('cooking_'),
        ...cb('appliance_'),
        ...cb('bathroom_'),
        ...cb('water_separate'),
        ...cb('climate_floor'),
        ...cb('upgrade_'),
      ];

      if (innenFields || innenCB.length) {
        subHeader(isDE ? 'Innenausbau' : 'Interior');
        // Energy
        row(isDE ? 'Batteriekapazität' : 'Battery Capacity', formData.energy_battery_capacity);
        // Water
        row(isDE ? 'Wasserkapazität' : 'Water Capacity', formData.water_tank_capacity);
        // Climate
        row(isDE ? 'Heizmodell' : 'Heating Model', formData.climate_heating_model);
        row(isDE ? 'Klimaanlage' : 'Air Conditioning', formData.climate_air_conditioning);
        // Cooling
        row(isDE ? 'Kühltyp' : 'Cooling Type', formData.cooling_type);
        row(isDE ? 'Gefrier-Option' : 'Freezer Option', formData.cooling_freezer_option);
        // Shower/WC
        row(isDE ? 'Nasszelle Typ' : 'Wet Room Type', formData.shower_wc_type);
        row(isDE ? 'Toiletten Typ' : 'Toilet Type', formData.shower_wc_toilet_type);
        // Checkboxes
        innenCB.forEach((v) => bullet(v));
        spacer(4);
      }

      // ── Zusatzausstattung ──
      const zusatzCB = [...cb('details_zusatz'), ...cb('garagen_')];
      if (zusatzCB.length) {
        subHeader(isDE ? 'Zusatzausstattung' : 'Additional Equipment');
        zusatzCB.forEach((v) => bullet(v));
        spacer(4);
      }
    }

    // ─── SPEZIELLE WÜNSCHE ───────────────────────────────────────────────────
    if (formData.special_wishes) {
      sectionHeader(isDE ? 'Spezielle Kundenwünsche' : 'Special Customer Requests');
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(0, 0, 0);
      const wishLines = doc.splitTextToSize(formData.special_wishes, contentW);
      for (const line of wishLines) {
        checkPage(5.5);
        doc.text(line, margin, y);
        y += 5.5;
      }
    }

    // ─── FOOTER (alle Seiten) ────────────────────────────────────────────────
    const totalPages = doc.internal.getNumberOfPages();
    for (let p = 1; p <= totalPages; p++) {
      doc.setPage(p);
      doc.setFontSize(6.5);
      doc.setTextColor(160, 160, 160);
      doc.text(
        isDE
          ? 'Vertraulich – FAS Expedition GmbH – Trafoweg 2-4, 52152 Lammersdorf – info@fas-expedition.de'
          : 'Confidential – FAS Expedition GmbH – Trafoweg 2-4, 52152 Lammersdorf – info@fas-expedition.de',
        pageW / 2,
        pageH - 6,
        { align: 'center' }
      );
      doc.text(`${p} / ${totalPages}`, pageW - margin, pageH - 6, { align: 'right' });
    }

    // ─── Export ──────────────────────────────────────────────────────────────
    const filename = isDE
      ? `FAS-Expedition-Anfrage-${now.toISOString().slice(0, 10)}.pdf`
      : `FAS-Expedition-Inquiry-${now.toISOString().slice(0, 10)}.pdf`;

    const dataUri = doc.output('datauristring');
    const base64 = dataUri.split(',')[1];

    return { base64, filename };
  };
})();
