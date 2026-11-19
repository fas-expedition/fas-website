/**
 * Inquiry Form Modal Handler
 * Manages opening, closing, and submission of the inquiry form modal.
 *
 * Submission flow (Netlify Forms):
 *  1. Collect all form fields into a structured data object (for PDF generation)
 *  2. Generate a PDF via window.generateInquiryPDF (inquiry-pdf.js)
 *  3. Build a FormData from the real <form> (captures every text/select/checkbox field)
 *     and attach the generated PDF as a file under "pdf_attachment"
 *  4. POST the FormData to "/" → Netlify Forms stores the submission (incl. PDF file)
 *     and triggers whatever notifications are configured in the Netlify dashboard
 *  5. Show success/error state in the modal (no page navigation)
 */
(function() {
  const MIN_SUBMIT_DELAY_SECONDS = 5;
  const inquiryFormModal = document.getElementById('inquiry-form');
  const inquiryFormElement = document.getElementById('inquiry-form-element');
  const closeButtons = document.querySelectorAll('.inquiry-form-close');
  const primaryButtons = document.querySelectorAll('[href="#inquiry-form"]');

  if (!inquiryFormModal) return;
  localizeModal(document.getElementById('inquiry-locale')?.value || document.documentElement.lang);

  function localizeModal(locale) {
    if (locale !== 'es' && locale !== 'fr') return;
    const translations = {
      es: {
        'Inquiry Form': 'Formulario de consulta',
        'Close form': 'Cerrar formulario',
        'Name': 'Nombre',
        'name@example.com': 'nombre@ejemplo.com',
        '+49 (0) 123 456789': '+34 123 456 789',
        'Your Name': 'Nombre y apellidos',
        'Street & Number': 'Calle y número',
        'Street': 'Calle',
        'Postal & City': 'Código postal y ciudad',
        '12345 City': 'Código postal y ciudad',
        'Country': 'País',
        'Phone': 'Teléfono',
        'Message': 'Mensaje',
        'Tell us about your inquiry...': 'Cuéntanos en qué podemos ayudarte...',
        'Add Inquiry Details': 'Añadir detalles a la solicitud',
        'Base Vehicle': 'Vehículo base',
        'Vehicle Model': 'Modelo del vehículo',
        'Other Chassis': 'Otro chasis',
        'Please specify': 'Especifica',
        'Wheelbase Extension': 'Alargamiento de la distancia entre ejes',
        'Tire Pressure Control': 'Sistema de control de presión de neumáticos',
        'Hydraulic Support Legs': 'Patas hidráulicas de apoyo',
        'Work Lights/Lightbars': 'Luces de trabajo / barras LED',
        'Winch': 'Cabrestante',
        'Fuel System': 'Sistema de combustible',
        'Staircase': 'Escalera',
        'Roof Rack': 'Portaequipajes de techo',
        'Storage Boxes': 'Cajas de almacenamiento',
        'Slide-Out Platform (Balcony)': 'Plataforma extensible (balcón)',
        'Outdoor Kitchen': 'Cocina exterior',
        '360° Camera System': 'Sistema de cámaras de 360°',
        'Paintwork': 'Pintura',
        'Rear Carrier': 'Soporte trasero',
        'Desired Interfaces Between Vehicle and Cabin': 'Conexiones deseadas entre el vehículo y la cabina',
        'Sub Frame': 'Subchasis',
        'Crawl-Through': 'Paso entre cabina y vehículo',
        'Crawl-Through with Window': 'Paso con ventana',
        'Bare Cabin': 'Cabina sin equipar',
        'Length (outside)': 'Longitud exterior',
        'Select an element': 'Selecciona una opción',
        'Uni Paint': 'Pintura lisa',
        'Metallic or Matte Paint': 'Pintura metalizada o mate',
        'Color Name/Code': 'Nombre o código del color',
        'e.g. DB 447': 'p. ej., DB 447',
        'Storage Box Staircase - Front Ascent Manual': 'Escalera de cajón, acceso frontal manual',
        'Storage Box Staircase - Lateral Ascent Manual': 'Escalera de cajón, acceso lateral manual',
        'Storage Box Staircase - Lateral Ascent Electric': 'Escalera de cajón, acceso lateral eléctrico',
        'Retractable Ladder in Container Frame (Unimog only)': 'Escalera extraíble en el bastidor (solo Unimog)',
        'Door': 'Puerta',
        '3-point locking door without window': 'Puerta con cierre de tres puntos, sin ventana',
        '3-point locking door with window': 'Puerta con cierre de tres puntos y ventana',
        'Side Windows': 'Ventanas laterales',
        'Hardglass Small (Qty)': 'Cristal templado pequeño (unid.)',
        'Hardglass Large (Qty)': 'Cristal templado grande (unid.)',
        'Hardglass Panorama (Qty)': 'Cristal panorámico (unid.)',
        'Roof Windows': 'Ventanas de techo',
        'Storage Doors': 'Compartimentos de almacenamiento',
        'Lateral': 'Lateral',
        'Rear': 'Trasero',
        'Box Slide-Out System in Rear Garage': 'Sistema extraíble de cajas en el garaje trasero',
        'Special Equipment, Vehicles, Sports Equipment': 'Equipamiento especial, vehículos y material deportivo',
        'Specify Dimensions': 'Indica las dimensiones',
        'Click or type here to enter text...': 'Haz clic o escribe aquí...',
        'Interior': 'Interior',
        'Energy Package': 'Paquete de energía',
        'Select battery capacity': 'Selecciona la capacidad de la batería',
        'Water Package': 'Paquete de agua',
        'Tank Capacity': 'Capacidad del depósito',
        'Fresh Water 300L / Gray Water 150L': 'Agua limpia 300 L / aguas grises 150 L',
        'Fresh Water 450L / Gray Water 300L': 'Agua limpia 450 L / aguas grises 300 L',
        'Fresh Water 650L / Gray Water 400L': 'Agua limpia 650 L / aguas grises 400 L',
        'Separate Drinking Water System': 'Sistema independiente de agua potable',
        'Climate Package': 'Paquete de climatización',
        'Heating Model': 'Modelo de calefacción',
        'Warm Air Heating': 'Calefacción por aire caliente',
        'Water-based Heating': 'Calefacción por agua',
        'Floor Heating': 'Calefacción por suelo radiante',
        'Air Conditioning': 'Aire acondicionado',
        '230V System for Stationary Operation': 'Sistema de 230 V para uso estacionario',
        '24V System for Mobile Operation': 'Sistema de 24 V para uso durante la marcha',
        'Both Systems for Redundancy': 'Ambos sistemas para mayor redundancia',
        'Sleeping': 'Dormir',
        'Double Bed': 'Cama doble',
        'Longitudinal Bed': 'Cama longitudinal',
        'Bunk Bed(s)': 'Litera(s)',
        'Lifting Bed': 'Cama abatible',
        'Cooking': 'Cocina',
        'Combination Oven/Microwave': 'Horno combinado con microondas',
        'Number of Burners': 'Número de fuegos',
        'Select...': 'Selecciona...',
        '2-Burner': '2 fuegos',
        '3-Burner': '3 fuegos',
        '4-Burner': '4 fuegos',
        'Cooling': 'Refrigeración',
        'Cooling Type': 'Tipo de refrigeración',
        'Fridge': 'Nevera',
        'Cooling Drawer': 'Cajón frigorífico',
        'Freezer Option': 'Opción de congelador',
        'no Freezer': 'Sin congelador',
        'Freezer Compartment in Fridge': 'Compartimento congelador en la nevera',
        'Freezer': 'Congelador',
        'Freezer Drawer': 'Cajón congelador',
        'Electrical Appliances': 'Electrodomésticos',
        'Coffee Machine': 'Cafetera',
        'Washer Dryer': 'Lavadora-secadora',
        'Radio/Sound System': 'Radio / sistema de sonido',
        'Dishwasher': 'Lavavajillas',
        'Built-in Vacuum': 'Aspirador integrado',
        'Smart TV': 'Televisor inteligente',
        'Shower/WC': 'Ducha / WC',
        'Wet Room Type': 'Tipo de baño',
        '1 combined wet room': '1 baño combinado',
        '2 separate rooms for shower and WC': '2 espacios separados para ducha y WC',
        'Room bath with sliding door': 'Baño integrado con puerta corredera',
        'Toilet Type': 'Tipo de inodoro',
        'Macerator Toilet with Water Flush': 'Inodoro triturador con descarga de agua',
        'Dry Separation Toilet': 'Inodoro seco separador',
        'Compost Separation Toilet Electric': 'Inodoro eléctrico de compostaje separador',
        'Bathroom Fixtures': 'Equipamiento del baño',
        'Bathroom Cabinet': 'Armario de baño',
        'Hand Sink': 'Lavamanos',
        'Towel Dryer': 'Toallero calefactable',
        'Upgrades': 'Mejoras',
        'Solid Wood Doors Oak': 'Puertas de roble macizo',
        'Scratch-resistant FENIX surface': 'Superficie FENIX resistente a los arañazos',
        'Leather upholstery instead of fabric': 'Tapicería de cuero en lugar de tela',
        'Alcantara upholstery instead of fabric': 'Tapicería de Alcantara en lugar de tela',
        'Dishes/Pots/Glasses': 'Vajilla / ollas / vasos',
        'Additional Equipment': 'Equipamiento adicional',
        'Garage Storage': 'Almacenamiento en el garaje',
        'Airrail Rails': 'Carriles Airrail',
        'Box Slide-Out System': 'Sistema extraíble de cajas',
        'Router with External Antenna': 'Router con antena exterior',
        'Alarm System': 'Sistema de alarma',
        'Built-in Safe': 'Caja fuerte integrada',
        'Special Customer Requests': 'Peticiones especiales',
        'Tell us your special requests...': 'Cuéntanos tus peticiones especiales...',
        'Upload Documents': 'Subir documentos',
        'Click to Upload': 'Haz clic para subir archivos',
        'Send Inquiry': 'Enviar solicitud',
        'Cancel': 'Cancelar',
        'Required fields': 'Campos obligatorios',
      },
      fr: {
        'Inquiry Form': 'Formulaire de demande',
        'Close form': 'Fermer le formulaire',
        'Name': 'Nom',
        'name@example.com': 'nom@exemple.fr',
        '+49 (0) 123 456789': '+33 1 23 45 67 89',
        'Your Name': 'Nom et prénom',
        'Street & Number': 'Rue et numéro',
        'Street': 'Rue',
        'Postal & City': 'Code postal et ville',
        '12345 City': 'Code postal et ville',
        'Country': 'Pays',
        'Phone': 'Téléphone',
        'Message': 'Message',
        'Tell us about your inquiry...': 'Décrivez votre demande...',
        'Add Inquiry Details': 'Ajouter des détails à la demande',
        'Base Vehicle': 'Véhicule de base',
        'Vehicle Model': 'Modèle du véhicule',
        'Other Chassis': 'Autre châssis',
        'Please specify': 'Veuillez préciser',
        'Wheelbase Extension': 'Allongement de l’empattement',
        'Tire Pressure Control': 'Système de contrôle de la pression des pneus',
        'Hydraulic Support Legs': 'Béquilles hydrauliques',
        'Work Lights/Lightbars': 'Éclairage de travail / barres LED',
        'Winch': 'Treuil',
        'Fuel System': 'Système de carburant',
        'Staircase': 'Escalier',
        'Roof Rack': 'Galerie de toit',
        'Storage Boxes': 'Coffres de rangement',
        'Slide-Out Platform (Balcony)': 'Plateforme coulissante (balcon)',
        'Outdoor Kitchen': 'Cuisine extérieure',
        '360° Camera System': 'Système de caméras à 360°',
        'Paintwork': 'Peinture',
        'Rear Carrier': 'Porte-charge arrière',
        'Desired Interfaces Between Vehicle and Cabin': 'Interfaces souhaitées entre le véhicule et la cellule',
        'Sub Frame': 'Faux-châssis',
        'Crawl-Through': 'Passage cabine-cellule',
        'Crawl-Through with Window': 'Passage avec fenêtre',
        'Bare Cabin': 'Cellule nue',
        'Length (outside)': 'Longueur extérieure',
        'Select an element': 'Choisissez une option',
        'Uni Paint': 'Peinture unie',
        'Metallic or Matte Paint': 'Peinture métallisée ou mate',
        'Color Name/Code': 'Nom ou code couleur',
        'e.g. DB 447': 'ex. DB 447',
        'Storage Box Staircase - Front Ascent Manual': 'Escalier-coffre, accès frontal manuel',
        'Storage Box Staircase - Lateral Ascent Manual': 'Escalier-coffre, accès latéral manuel',
        'Storage Box Staircase - Lateral Ascent Electric': 'Escalier-coffre, accès latéral électrique',
        'Retractable Ladder in Container Frame (Unimog only)': 'Échelle coulissante dans le châssis (Unimog uniquement)',
        'Door': 'Porte',
        '3-point locking door without window': 'Porte à verrouillage 3 points sans fenêtre',
        '3-point locking door with window': 'Porte à verrouillage 3 points avec fenêtre',
        'Side Windows': 'Fenêtres latérales',
        'Hardglass Small (Qty)': 'Petit vitrage trempé (qté)',
        'Hardglass Large (Qty)': 'Grand vitrage trempé (qté)',
        'Hardglass Panorama (Qty)': 'Vitrage panoramique (qté)',
        'Roof Windows': 'Fenêtres de toit',
        'Storage Doors': 'Compartiments de rangement',
        'Lateral': 'Latéral',
        'Rear': 'Arrière',
        'Box Slide-Out System in Rear Garage': 'Système de tiroirs coulissants dans le garage arrière',
        'Special Equipment, Vehicles, Sports Equipment': 'Équipements spéciaux, véhicules et matériel sportif',
        'Specify Dimensions': 'Précisez les dimensions',
        'Click or type here to enter text...': 'Cliquez ou saisissez votre texte ici...',
        'Interior': 'Aménagement intérieur',
        'Energy Package': 'Pack énergie',
        'Select battery capacity': 'Choisissez la capacité de la batterie',
        'Water Package': 'Pack eau',
        'Tank Capacity': 'Capacité des réservoirs',
        'Fresh Water 300L / Gray Water 150L': 'Eau propre 300 L / eaux grises 150 L',
        'Fresh Water 450L / Gray Water 300L': 'Eau propre 450 L / eaux grises 300 L',
        'Fresh Water 650L / Gray Water 400L': 'Eau propre 650 L / eaux grises 400 L',
        'Separate Drinking Water System': 'Système indépendant d’eau potable',
        'Climate Package': 'Pack climatisation',
        'Heating Model': 'Modèle de chauffage',
        'Warm Air Heating': 'Chauffage à air pulsé',
        'Water-based Heating': 'Chauffage à eau',
        'Floor Heating': 'Chauffage au sol',
        'Air Conditioning': 'Climatisation',
        '230V System for Stationary Operation': 'Système 230 V pour fonctionnement à l’arrêt',
        '24V System for Mobile Operation': 'Système 24 V pour fonctionnement en roulant',
        'Both Systems for Redundancy': 'Les deux systèmes pour plus de redondance',
        'Sleeping': 'Couchages',
        'Double Bed': 'Lit double',
        'Longitudinal Bed': 'Lit longitudinal',
        'Bunk Bed(s)': 'Lit(s) superposé(s)',
        'Lifting Bed': 'Lit escamotable',
        'Cooking': 'Cuisine',
        'Combination Oven/Microwave': 'Four combiné avec micro-ondes',
        'Number of Burners': 'Nombre de feux',
        'Select...': 'Choisir...',
        '2-Burner': '2 feux',
        '3-Burner': '3 feux',
        '4-Burner': '4 feux',
        'Cooling': 'Réfrigération',
        'Cooling Type': 'Type de réfrigération',
        'Fridge': 'Réfrigérateur',
        'Cooling Drawer': 'Tiroir réfrigéré',
        'Freezer Option': 'Option congélateur',
        'no Freezer': 'Sans congélateur',
        'Freezer Compartment in Fridge': 'Compartiment congélateur dans le réfrigérateur',
        'Freezer': 'Congélateur',
        'Freezer Drawer': 'Tiroir congélateur',
        'Electrical Appliances': 'Appareils électriques',
        'Coffee Machine': 'Machine à café',
        'Washer Dryer': 'Lave-linge séchant',
        'Radio/Sound System': 'Radio / système audio',
        'Dishwasher': 'Lave-vaisselle',
        'Built-in Vacuum': 'Aspirateur intégré',
        'Smart TV': 'Téléviseur connecté',
        'Shower/WC': 'Douche / WC',
        'Wet Room Type': 'Type de salle d’eau',
        '1 combined wet room': '1 salle d’eau combinée',
        '2 separate rooms for shower and WC': '2 espaces séparés pour la douche et les toilettes',
        'Room bath with sliding door': 'Salle de bains avec porte coulissante',
        'Toilet Type': 'Type de toilettes',
        'Macerator Toilet with Water Flush': 'Toilettes à broyeur avec chasse d’eau',
        'Dry Separation Toilet': 'Toilettes sèches à séparation',
        'Compost Separation Toilet Electric': 'Toilettes électriques à compostage et séparation',
        'Bathroom Fixtures': 'Équipements de salle de bains',
        'Bathroom Cabinet': 'Meuble de salle de bains',
        'Hand Sink': 'Lave-mains',
        'Towel Dryer': 'Sèche-serviettes',
        'Upgrades': 'Options',
        'Solid Wood Doors Oak': 'Portes en chêne massif',
        'Scratch-resistant FENIX surface': 'Surface FENIX résistante aux rayures',
        'Leather upholstery instead of fabric': 'Sellerie en cuir au lieu du tissu',
        'Alcantara upholstery instead of fabric': 'Sellerie en Alcantara au lieu du tissu',
        'Dishes/Pots/Glasses': 'Vaisselle / casseroles / verres',
        'Additional Equipment': 'Équipement supplémentaire',
        'Garage Storage': 'Rangement de garage',
        'Airrail Rails': 'Rails Airrail',
        'Box Slide-Out System': 'Système de tiroirs coulissants',
        'Router with External Antenna': 'Routeur avec antenne extérieure',
        'Alarm System': 'Système d’alarme',
        'Built-in Safe': 'Coffre-fort intégré',
        'Special Customer Requests': 'Demandes particulières',
        'Tell us your special requests...': 'Indiquez vos demandes particulières...',
        'Upload Documents': 'Importer des documents',
        'Click to Upload': 'Cliquez pour importer des fichiers',
        'Send Inquiry': 'Envoyer la demande',
        'Cancel': 'Annuler',
        'Required fields': 'Champs obligatoires',
      },
    };
    const dictionary = translations[locale];
    const walker = document.createTreeWalker(inquiryFormModal, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const node = walker.currentNode;
      const value = node.nodeValue.trim();
      if (dictionary[value]) {
        node.nodeValue = node.nodeValue.replace(value, dictionary[value]);
      }
    }
    inquiryFormModal.querySelectorAll('input, textarea, button, option').forEach(function(el) {
      ['placeholder', 'aria-label'].forEach(function(attribute) {
        const value = el.getAttribute(attribute);
        if (value && dictionary[value]) el.setAttribute(attribute, dictionary[value]);
      });
    });
  }

  /**
   * Open the inquiry form modal
   */
  function openForm(e) {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    inquiryFormModal.classList.remove('hidden');
    inquiryFormModal.classList.add('flex');
    inquiryFormElement.scrollTop = 0;
    document.body.style.overflow = 'hidden';
    const openedAtField = document.getElementById('inquiry-opened-at');
    if (openedAtField) {
      openedAtField.value = String(Date.now());
    }

    if (typeof gtmTracking !== 'undefined') {
      gtmTracking.form.open('inquiry');
    }
  }

  /**
   * Close the inquiry form modal
   */
  function closeForm() {
    inquiryFormModal.classList.add('hidden');
    inquiryFormModal.classList.remove('flex');
    document.body.style.overflow = '';

    if (typeof gtmTracking !== 'undefined') {
      gtmTracking.form.close('inquiry', false);
    }
  }

  /**
   * Collect all form data into a structured object including:
   * - All text/select inputs by name
   * - checkboxes: array of {name, value} for all checked .inquiry-detail-checkbox elements
   * - selectedDetails: comma-joined values for Netlify Forms backup
   */
  function collectFormData() {
    const locale = document.getElementById('inquiry-locale')?.value || 'de';

    // All checked detail checkboxes
    const checkboxes = [];
    document.querySelectorAll('.inquiry-detail-checkbox:checked').forEach(function(cb) {
      checkboxes.push({
        name: cb.name,
        value: cb.value,
        label: cb.closest('label')?.querySelector('span')?.textContent.trim() || cb.value,
      });
    });

    // Helper: get trimmed value of an element by ID
    function val(id) {
      const el = document.getElementById(id);
      return el ? el.value.trim() : '';
    }

    const localizedValues = {};
    inquiryFormElement.querySelectorAll('select').forEach(function(select) {
      const selected = select.selectedOptions && select.selectedOptions[0];
      if (select.name && selected) localizedValues[select.name] = selected.textContent.trim();
    });

    return {
      // Customer data
      name: val('inquiry-name'),
      street: val('inquiry-street'),
      postal: val('inquiry-postal'),
      country: val('inquiry-country'),
      email: val('inquiry-email'),
      phone: val('inquiry-phone'),
      message: val('inquiry-message'),
      locale,
      form_opened_at: val('inquiry-opened-at'),
      localized_values: localizedValues,

      // Vehicle
      base_vehicle_model: val('base_vehicle_model'),
      base_vehicle_custom: val('base_vehicle_custom'),

      // Bare cabin dimensions & options
      bare_cabin_length: val('bare_cabin_length'),
      bare_cabin_width: val('bare_cabin_width'),
      bare_cabin_height: val('bare_cabin_height'),
      bare_cabin_paintwork: val('bare_cabin_paintwork'),
      bare_cabin_color_code: val('bare_cabin_color_code'),
      bare_cabin_treppe: val('bare_cabin_treppe'),
      bare_cabin_tuer: val('bare_cabin_tuer'),

      // Windows
      side_window_klein: val('side_window_klein'),
      side_window_gross: val('side_window_gross'),
      side_window_panorama: val('side_window_panorama'),
      roof_window_klein: val('roof_window_klein'),
      roof_window_gross: val('roof_window_gross'),

      // Special items
      bare_cabin_special_items: val('bare_cabin_special_items'),

      // Interior
      energy_battery_capacity: val('energy_battery_capacity'),
      water_tank_capacity: val('water_tank_capacity'),
      climate_heating_model: val('climate_heating_model'),
      climate_air_conditioning: val('climate_air_conditioning'),
      cooling_type: val('cooling_type'),
      cooling_freezer_option: val('cooling_freezer_option'),
      shower_wc_type: val('shower_wc_type'),
      shower_wc_toilet_type: val('shower_wc_toilet_type'),

      // Special wishes
      special_wishes: val('inquiry-special-wishes'),

      // Checkboxes (structured for PDF)
      checkboxes,
      // Flat string for Netlify Forms backup
      selected_details: checkboxes.map(function(c) { return c.value; }).join(', '),
    };
  }

  /**
   * Show success state inside the modal (replaces form content).
   */
  function showSuccess(locale) {
    const text = messages(locale);
    const container = inquiryFormElement.parentElement;
    inquiryFormElement.style.display = 'none';

    const successDiv = document.createElement('div');
    successDiv.id = 'inquiry-success';
    successDiv.className = 'p-8 flex flex-col items-center justify-center text-center space-y-6';
    successDiv.innerHTML =
      '<svg class="w-16 h-16 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">' +
        '<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>' +
      '</svg>' +
      '<h3 class="text-2xl font-bold tracking-wider uppercase">' +
        text.successTitle +
      '</h3>' +
      '<p class="text-zinc-400 max-w-sm">' +
        text.successBody +
      '</p>' +
      '<button id="inquiry-success-close" class="bg-white text-black px-8 py-3 font-bold tracking-widest uppercase hover:bg-zinc-200 transition-colors">' +
        text.close +
      '</button>';
    container.appendChild(successDiv);

    document.getElementById('inquiry-success-close').addEventListener('click', function() {
      closeForm();
      // Restore form for next open
      inquiryFormElement.style.display = '';
      successDiv.remove();
    });
  }

  /**
   * Show inline error message and re-enable submit button.
   */
  function showError(submitButton, originalText, locale, detail) {
    const text = messages(locale);
    submitButton.textContent = originalText;
    submitButton.disabled = false;

    let errorMsg = document.getElementById('inquiry-error-msg');
    if (!errorMsg) {
      errorMsg = document.createElement('p');
      errorMsg.id = 'inquiry-error-msg';
      errorMsg.className = 'text-red-400 text-sm text-center';
      submitButton.parentElement.parentElement.insertBefore(errorMsg, submitButton.parentElement.nextSibling);
    }
    const base = text.error;
    const timingText = text.timing.replace('{seconds}', MIN_SUBMIT_DELAY_SECONDS);
    const isTimingError = detail === 'too-fast';
    errorMsg.textContent = isTimingError ? timingText : (detail && detail !== 'submit-failed' ? base + ' (' + detail + ')' : base);
  }

  /**
   * Convert a base64 string (no data-URI prefix) into a Blob.
   */
  function base64ToBlob(base64, mimeType) {
    const byteChars = atob(base64);
    const byteNumbers = new Array(byteChars.length);
    for (let i = 0; i < byteChars.length; i++) {
      byteNumbers[i] = byteChars.charCodeAt(i);
    }
    return new Blob([new Uint8Array(byteNumbers)], { type: mimeType });
  }

  /**
   * Main submit handler:
   * 1. Generate PDF from the collected form data
   * 2. Build a FormData snapshot of the real form (captures every field + checked checkboxes)
   * 3. Attach the generated PDF as a file under "pdf_attachment"
   * 4. POST to Netlify Forms ("/") and show success or error
   */
  async function handleSubmit(e) {
    e.preventDefault();

    const submitButton = inquiryFormElement.querySelector('button[type="submit"]');
    const originalText = submitButton.textContent;
    const locale = document.getElementById('inquiry-locale')?.value || 'de';
    const text = messages(locale);

    // Remove previous error if any
    const prevErr = document.getElementById('inquiry-error-msg');
    if (prevErr) prevErr.remove();

    // ── Client-side spam timing guard (mirrors previous server-side check) ──
    const openedAtField = document.getElementById('inquiry-opened-at');
    const openedAt = openedAtField ? Number(openedAtField.value) : NaN;
    if (Number.isFinite(openedAt) && Date.now() - openedAt < MIN_SUBMIT_DELAY_SECONDS * 1000) {
      showError(submitButton, originalText, locale, 'too-fast');
      return;
    }

    // Show loading state
    submitButton.textContent = text.sending;
    submitButton.disabled = true;

    const collectedData = collectFormData();

    // ── GTM tracking ──
    if (typeof gtmTracking !== 'undefined') {
      gtmTracking.form.submit('inquiry', {
        name: collectedData.name,
        email: collectedData.email,
        base_vehicle_model: collectedData.base_vehicle_model,
        message_length: collectedData.message.length,
        submit_delay_seconds: collectedData.form_opened_at
          ? Math.floor((Date.now() - Number(collectedData.form_opened_at)) / 1000)
          : null,
      });
      gtmTracking.conversion.inquirySubmitted({
        email: collectedData.email,
        vehicle_model: collectedData.base_vehicle_model,
        message_length: collectedData.message.length,
        submit_delay_seconds: collectedData.form_opened_at
          ? Math.floor((Date.now() - Number(collectedData.form_opened_at)) / 1000)
          : null,
      });
    }

    // ── Generate PDF ──
    let pdfBase64 = null;
    let pdfFilename = null;
    try {
      if (typeof window.generateInquiryPDF === 'function') {
        const pdf = await window.generateInquiryPDF(collectedData, locale);
        pdfBase64 = pdf.base64;
        pdfFilename = pdf.filename;
      }
    } catch (pdfErr) {
      console.warn('PDF generation failed (continuing without attachment):', pdfErr);
    }

    // ── Populate the flattened "selected_details" summary field before snapshotting ──
    const selectedDetailsField = document.getElementById('inquiry-selected-details');
    if (selectedDetailsField) {
      selectedDetailsField.value = collectedData.selected_details;
    }

    // ── Build FormData from the real form (captures all text/select/checkbox fields) ──
    const netlifyFormData = new FormData(inquiryFormElement);

    // Netlify Forms supports only one file per field; keep at most the first
    // user-selected document to avoid submission errors from the "documents" field.
    const documentFiles = netlifyFormData.getAll('documents').filter(function(f) { return f && f.size > 0; });
    netlifyFormData.delete('documents');
    if (documentFiles.length > 0) {
      netlifyFormData.set('documents', documentFiles[0]);
    }

    // Attach the generated PDF (overrides the empty placeholder file input)
    if (pdfBase64 && pdfFilename) {
      netlifyFormData.set('pdf_attachment', base64ToBlob(pdfBase64, 'application/pdf'), pdfFilename);
    } else {
      netlifyFormData.delete('pdf_attachment');
    }

    // ── POST to Netlify Forms ──
    // Submit to the current page path rather than "/": netlify.toml redirects
    // "/" to "/de/" with a 301, which breaks the AJAX POST (fetch turns the
    // redirected request into a GET, and Netlify Forms then rejects it).
    // Every page already contains this form (it's rendered in base.njk), so
    // the current path is always a valid Netlify Forms submission target.
    const submitUrl = window.location.pathname || '/';
    let success = false;
    let errorDetail = null;
    try {
      const response = await fetch(submitUrl, {
        method: 'POST',
        body: netlifyFormData,
      });
      success = response.ok;
      if (!response.ok) {
        errorDetail = 'HTTP ' + response.status;
        console.error('Netlify Forms submission error:', response.status);
      }
    } catch (fetchErr) {
      errorDetail = 'submit-failed';
      console.error('Netlify Forms fetch failed:', fetchErr);
    }

    // ── Show result ──
    if (success) {
      showSuccess(locale);
    } else {
      showError(submitButton, originalText, locale, errorDetail);
    }
  }

  /**
   * Toggle details expander
   */
  function toggleDetailsSection() {
    const detailsContent = document.getElementById('inquiry-details-content');
    const toggleIcon = document.getElementById('inquiry-toggle-icon');

    detailsContent.classList.toggle('hidden');
    toggleIcon.style.transform = detailsContent.classList.contains('hidden')
      ? 'rotate(0deg)'
      : 'rotate(180deg)';

    inquiryFormElement.scrollTop = 0;
  }

  function messages(locale) {
    const translations = {
      de: {
        successTitle: 'Anfrage erhalten!',
        successBody: 'Vielen Dank für deine Anfrage. Du erhältst in Kürze eine Bestätigung per E-Mail. Wir melden uns so schnell wie möglich bei dir.',
        close: 'Schließen',
        error: 'Fehler beim Senden. Bitte versuche es erneut oder schreibe uns direkt an info@fas-expedition.de.',
        timing: 'Bitte warte mindestens {seconds} Sekunden vor dem Absenden.',
        sending: 'Wird gesendet…',
        upload: 'Klicken zum Hochladen',
      },
      en: {
        successTitle: 'Inquiry received!',
        successBody: 'Thank you for your inquiry. You will receive a confirmation email shortly. We will get back to you as soon as possible.',
        close: 'Close',
        error: 'Error sending inquiry. Please try again or contact us directly at info@fas-expedition.de.',
        timing: 'Please wait at least {seconds} seconds before submitting.',
        sending: 'Sending…',
        upload: 'Click to Upload',
      },
      es: {
        successTitle: '¡Hemos recibido tu solicitud!',
        successBody: 'Gracias por tu consulta. En breve recibirás un correo de confirmación. Nos pondremos en contacto contigo lo antes posible.',
        close: 'Cerrar',
        error: 'No se pudo enviar la solicitud. Inténtalo de nuevo o escríbenos a info@fas-expedition.de.',
        timing: 'Espera al menos {seconds} segundos antes de enviar el formulario.',
        sending: 'Enviando…',
        upload: 'Haz clic para subir archivos',
      },
      fr: {
        successTitle: 'Demande reçue !',
        successBody: 'Merci pour votre demande. Vous recevrez bientôt un e-mail de confirmation. Nous vous contacterons dès que possible.',
        close: 'Fermer',
        error: 'Échec de l’envoi. Veuillez réessayer ou nous écrire à info@fas-expedition.de.',
        timing: 'Veuillez patienter au moins {seconds} secondes avant l’envoi.',
        sending: 'Envoi en cours…',
        upload: 'Cliquez pour importer des fichiers',
      },
    };
    return translations[locale] || translations.en;
  }

  // ── Event listeners ──────────────────────────────────────────────────────

  primaryButtons.forEach(function(btn) {
    btn.addEventListener('click', openForm);
  });

  closeButtons.forEach(function(btn) {
    btn.addEventListener('click', closeForm);
  });

  inquiryFormModal.addEventListener('click', function(e) {
    if (e.target === inquiryFormModal) closeForm();
  });

  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') closeForm();
  });

  inquiryFormElement.addEventListener('submit', handleSubmit);

  const detailsToggle = document.getElementById('inquiry-details-toggle');
  if (detailsToggle) {
    detailsToggle.addEventListener('click', function(e) {
      e.preventDefault();
      toggleDetailsSection();
    });
  }

  // Base vehicle model → show/hide custom field
  const baseVehicleSelect = document.getElementById('base_vehicle_model');
  const customVehicleField = document.getElementById('custom_vehicle_field');
  if (baseVehicleSelect && customVehicleField) {
    baseVehicleSelect.addEventListener('change', function(e) {
      if (e.target.value === 'anderes Fahrgestell') {
        customVehicleField.classList.remove('hidden');
      } else {
        customVehicleField.classList.add('hidden');
      }
    });
  }

  // File input → show selected filenames
  const fileInput = document.getElementById('inquiry-documents');
  const fileDisplay = document.getElementById('inquiry-documents-display');
  if (fileInput && fileDisplay) {
    fileDisplay.addEventListener('click', function() {
      fileInput.click();
    });
    fileInput.addEventListener('change', function() {
      if (fileInput.files.length > 0) {
        const names = Array.from(fileInput.files).map(function(f) { return f.name; }).join(', ');
        fileDisplay.textContent = names;
        fileDisplay.classList.remove('text-zinc-400');
        fileDisplay.classList.add('text-white');
      } else {
        const loc = document.getElementById('inquiry-locale')?.value;
        fileDisplay.textContent = messages(loc).upload;
        fileDisplay.classList.remove('text-white');
        fileDisplay.classList.add('text-zinc-400');
      }

    });
  }
})();
