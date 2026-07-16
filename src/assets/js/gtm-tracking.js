/**
 * Google Tag Manager Event Tracking Module
 * Centralized event tracking for GTM data layer
 * Usage: gtmTracking.trackEvent('event_name', { additional: 'data' })
 */

const gtmTracking = (() => {
  /**
   * Initialize GTM data layer if not already present
   */
  function initializeDataLayer() {
    if (typeof window.dataLayer === 'undefined') {
      window.dataLayer = [];
    }
  }

  /**
   * Push event to GTM data layer
   * @param {string} eventName - Event name (e.g., 'form_submit', 'inquiry_open')
   * @param {object} eventData - Additional event data
   */
  function trackEvent(eventName, eventData = {}) {
    initializeDataLayer();
    
    const event = {
      event: eventName,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      ...eventData
    };

    console.log('[GTM] Tracking event:', event);
    window.dataLayer.push(event);
  }

  /**
   * Track form interaction events
   */
  const form = {
    open: (formType = 'inquiry') => {
      trackEvent('form_open', {
        form_type: formType,
        form_name: formType === 'inquiry' ? 'Inquiry Form' : formType
      });
    },

    close: (formType = 'inquiry', completed = false) => {
      trackEvent('form_close', {
        form_type: formType,
        form_completed: completed
      });
    },

    submit: (formType = 'inquiry', formData = {}) => {
      trackEvent('form_submit', {
        form_type: formType,
        form_fields_filled: Object.keys(formData).length,
        locale: formData.locale || 'unknown'
      });
    },

    error: (formType = 'inquiry', errorMessage = '') => {
      trackEvent('form_error', {
        form_type: formType,
        error_message: errorMessage
      });
    },

    success: (formType = 'inquiry') => {
      trackEvent('form_success', {
        form_type: formType,
        success_time: new Date().toISOString()
      });
    }
  };

  /**
   * Track page view with additional context
   */
  const page = {
    view: (pageName = '') => {
      trackEvent('page_view', {
        page_name: pageName || document.title,
        page_path: window.location.pathname
      });
    }
  };

  /**
   * Track click events on important buttons/links
   */
  const click = {
    button: (buttonText = '', buttonId = '') => {
      trackEvent('button_click', {
        button_text: buttonText,
        button_id: buttonId
      });
    },

    link: (linkUrl = '', linkText = '') => {
      trackEvent('link_click', {
        link_url: linkUrl,
        link_text: linkText,
        is_external: linkUrl.startsWith('http')
      });
    }
  };

  /**
   * Track conversion goals
   */
  const conversion = {
    inquirySubmitted: (inquiryData = {}) => {
      trackEvent('conversion_inquiry_submitted', {
        ...inquiryData
      });
    },

    leadGenerated: (leadData = {}) => {
      trackEvent('conversion_lead_generated', {
        ...leadData
      });
    }
  };

  // Public API
  return {
    trackEvent,
    form,
    page,
    click,
    conversion,
    // Direct access to data layer for advanced usage
    getDataLayer: () => window.dataLayer || []
  };
})();

// Auto-track page views on load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    gtmTracking.page.view();
  });
} else {
  gtmTracking.page.view();
}
