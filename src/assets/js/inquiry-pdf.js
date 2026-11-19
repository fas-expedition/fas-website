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
    const tr = (de, en, es, fr) => ({ de, en, es, fr }[locale] || en);
    const localeTag = { de: 'de-DE', en: 'en-GB', es: 'es-ES', fr: 'fr-FR' }[locale] || 'en-GB';

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
        .map((c) => c.label || c.value);
    const displayValue = (field) =>
      (formData.localized_values && formData.localized_values[field]) || formData[field];

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
      tr('Kundenanfrage – Intern / Vertraulich', 'Customer Inquiry – Internal / Confidential', 'Solicitud del cliente – Interno / Confidencial', 'Demande client – Interne / Confidentiel'),
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
    const dateStr = now.toLocaleDateString(localeTag, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const timeStr = now.toLocaleTimeString(localeTag, {
      hour: '2-digit',
      minute: '2-digit',
    });
    const ref = `REF-${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}-${String(now.getHours()).padStart(2, '0')}${String(now.getMinutes()).padStart(2, '0')}`;
    doc.text(`${tr('Datum', 'Date', 'Fecha', 'Date')}: ${dateStr}, ${timeStr}`, margin, y);
    doc.text(`${tr('Referenz', 'Reference', 'Referencia', 'Référence')}: ${ref}`, pageW - margin, y, { align: 'right' });
    y += 10;

    // ─── KUNDENDATEN ─────────────────────────────────────────────────────────
    sectionHeader(tr('Kundendaten', 'Customer Information', 'Datos del cliente', 'Coordonnées du client'));
    row('Name', formData.name);
    row(tr('Straße', 'Street', 'Calle', 'Rue'), formData.street);
    row(tr('PLZ / Ort', 'Postal / City', 'Código postal / Ciudad', 'Code postal / Ville'), formData.postal);
    row(tr('Land', 'Country', 'País', 'Pays'), formData.country);
    row('E-Mail', formData.email);
    row(tr('Telefon', 'Phone', 'Teléfono', 'Téléphone'), formData.phone);
    spacer(4);

    // ─── NACHRICHT ───────────────────────────────────────────────────────────
    if (formData.message) {
      sectionHeader(tr('Nachricht des Kunden', 'Customer Message', 'Mensaje del cliente', 'Message du client'));
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
      sectionHeader(tr('Fahrzeugkonfiguration', 'Vehicle Configuration', 'Configuración del vehículo', 'Configuration du véhicule'));

      // ── Basisfahrzeug ──
      const basisCB = cb('details_basisfahrzeug');
      if (formData.base_vehicle_model || formData.base_vehicle_custom || basisCB.length) {
        subHeader(tr('Basisfahrzeug', 'Base Vehicle', 'Vehículo base', 'Véhicule de base'));
        const modelVal =
          formData.base_vehicle_model === 'anderes Fahrgestell'
            ? tr('Anderes Fahrgestell', 'Other Chassis', 'Otro chasis', 'Autre châssis')
            : displayValue('base_vehicle_model');
        row(tr('Modell', 'Model', 'Modelo', 'Modèle'), modelVal);
        if (formData.base_vehicle_custom)
          row(tr('Angabe', 'Specification', 'Especificación', 'Précision'), formData.base_vehicle_custom);
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
        subHeader(tr('Leerkabine', 'Bare Cabin', 'Cabina sin equipar', 'Cellule nue'));
        const dims = [
          formData.bare_cabin_length,
          formData.bare_cabin_width,
          formData.bare_cabin_height,
        ].filter(Boolean);
        if (dims.length)
          row(tr('Maße (L × B × H)', 'Dimensions (L × W × H)', 'Dimensiones (L × A × A)', 'Dimensions (L × l × h)'), dims.join(' × ') + ' m');
        row(tr('Lackierung', 'Paintwork', 'Pintura', 'Peinture'), displayValue('bare_cabin_paintwork'));
        row(tr('Farbbezeichnung/-code', 'Color Name/Code', 'Nombre/código del color', 'Nom/code couleur'), formData.bare_cabin_color_code);
        row(tr('Treppe', 'Staircase', 'Escalera', 'Escalier'), displayValue('bare_cabin_treppe'));
        row(tr('Tür', 'Door', 'Puerta', 'Porte'), displayValue('bare_cabin_tuer'));
        if (formData.side_window_klein)
          row(tr('Seitenfenster klein (Stk.)', 'Side windows small (qty)', 'Ventanas laterales pequeñas (unid.)', 'Petites fenêtres latérales (qté)'), formData.side_window_klein);
        if (formData.side_window_gross)
          row(tr('Seitenfenster groß (Stk.)', 'Side windows large (qty)', 'Ventanas laterales grandes (unid.)', 'Grandes fenêtres latérales (qté)'), formData.side_window_gross);
        if (formData.side_window_panorama)
          row(tr('Seitenfenster Panorama (Stk.)', 'Panorama side windows (qty)', 'Ventanas panorámicas laterales (unid.)', 'Fenêtres latérales panoramiques (qté)'), formData.side_window_panorama);
        if (formData.roof_window_klein)
          row(tr('Dachfenster klein (Stk.)', 'Roof windows small (qty)', 'Ventanas de techo pequeñas (unid.)', 'Petites fenêtres de toit (qté)'), formData.roof_window_klein);
        if (formData.roof_window_gross)
          row(tr('Dachfenster groß (Stk.)', 'Roof windows large (qty)', 'Ventanas de techo grandes (unid.)', 'Grandes fenêtres de toit (qté)'), formData.roof_window_gross);
        stauklappenCB.forEach((v) => bullet(v));
        leerkabineCB.forEach((v) => bullet(v));
        if (formData.bare_cabin_special_items)
          row(tr('Besondere Utensilien / Maße', 'Special Equipment / Dimensions', 'Equipamiento especial / dimensiones', 'Équipements spéciaux / dimensions'), formData.bare_cabin_special_items);
        spacer(4);
      }

      // ── Schnittstellen ──
      const schnittCB = cb('details_schnittstellen');
      if (schnittCB.length) {
        subHeader(tr('Schnittstellen Fahrzeug / Wohnkabine', 'Vehicle / Cabin Interfaces', 'Conexiones entre vehículo y cabina', 'Interfaces véhicule / cellule'));
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
        subHeader(tr('Innenausbau', 'Interior', 'Interior', 'Aménagement intérieur'));
        // Energy
        row(tr('Batteriekapazität', 'Battery Capacity', 'Capacidad de la batería', 'Capacité de la batterie'), formData.energy_battery_capacity);
        // Water
        row(tr('Wasserkapazität', 'Water Capacity', 'Capacidad de agua', 'Capacité en eau'), formData.water_tank_capacity);
        // Climate
        row(tr('Heizmodell', 'Heating Model', 'Modelo de calefacción', 'Modèle de chauffage'), displayValue('climate_heating_model'));
        row(tr('Klimaanlage', 'Air Conditioning', 'Aire acondicionado', 'Climatisation'), displayValue('climate_air_conditioning'));
        // Cooling
        row(tr('Kühltyp', 'Cooling Type', 'Tipo de refrigeración', 'Type de réfrigération'), displayValue('cooling_type'));
        row(tr('Gefrier-Option', 'Freezer Option', 'Opción de congelador', 'Option congélateur'), displayValue('cooling_freezer_option'));
        // Shower/WC
        row(tr('Nasszelle Typ', 'Wet Room Type', 'Tipo de baño', 'Type de salle d’eau'), displayValue('shower_wc_type'));
        row(tr('Toiletten Typ', 'Toilet Type', 'Tipo de inodoro', 'Type de toilettes'), displayValue('shower_wc_toilet_type'));
        // Checkboxes
        innenCB.forEach((v) => bullet(v));
        spacer(4);
      }

      // ── Zusatzausstattung ──
      const zusatzCB = [...cb('details_zusatz'), ...cb('garagen_')];
      if (zusatzCB.length) {
        subHeader(tr('Zusatzausstattung', 'Additional Equipment', 'Equipamiento adicional', 'Équipements supplémentaires'));
        zusatzCB.forEach((v) => bullet(v));
        spacer(4);
      }
    }

    // ─── SPEZIELLE WÜNSCHE ───────────────────────────────────────────────────
    if (formData.special_wishes) {
      sectionHeader(tr('Spezielle Kundenwünsche', 'Special Customer Requests', 'Peticiones especiales', 'Demandes particulières'));
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
        tr(
          'Vertraulich – FAS Expedition GmbH – Trafoweg 2-4, 52152 Lammersdorf – info@fas-expedition.de',
          'Confidential – FAS Expedition GmbH – Trafoweg 2-4, 52152 Lammersdorf – info@fas-expedition.de',
          'Confidencial – FAS Expedition GmbH – Trafoweg 2-4, 52152 Lammersdorf – info@fas-expedition.de',
          'Confidentiel – FAS Expedition GmbH – Trafoweg 2-4, 52152 Lammersdorf – info@fas-expedition.de'
        ),
        pageW / 2,
        pageH - 6,
        { align: 'center' }
      );
      doc.text(`${p} / ${totalPages}`, pageW - margin, pageH - 6, { align: 'right' });
    }

    // ─── Export ──────────────────────────────────────────────────────────────
    const inquiryLabel = { de: 'Anfrage', en: 'Inquiry', es: 'Solicitud', fr: 'Demande' }[locale] || 'Inquiry';
    const filename = `FAS-Expedition-${inquiryLabel}-${now.toISOString().slice(0, 10)}.pdf`;

    const dataUri = doc.output('datauristring');
    const base64 = dataUri.split(',')[1];

    return { base64, filename };
  };
})();
