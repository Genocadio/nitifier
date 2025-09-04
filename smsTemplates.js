/**
 * SMS templates for different issue statuses in multiple languages
 * Optimized for SMS character limits (153 chars for plain text, 67 for Unicode)
 */

const templates = {
    // Issue Received Templates
    received: {
        english: {
            message: `Hi {name}, your issue {ticketId} has been received. We'll review it soon. Track: https://ces-frontend-zeta.vercel.app/followup?id={ticketId}`
        },
        french: {
            message: `Bonjour {name}, votre problème {ticketId} a été reçu. Nous l'examinerons bientôt. Suivi: https://ces-frontend-zeta.vercel.app/followup?id={ticketId}`
        },
        kinyarwanda: {
            message: `Mwaramutse {name}, ikibazo {ticketId} cyakiriwe. Tuzacyasuzuma vuba. Kurikirana: https://ces-frontend-zeta.vercel.app/followup?id={ticketId}`
        }
    },

    // Issue Resolved Templates
    resolved: {
        english: {
            message: `Hi {name}, your issue {ticketId} has been resolved! View details: https://ces-frontend-zeta.vercel.app/followup?id={ticketId}`
        },
        french: {
            message: `Bonjour {name}, votre problème {ticketId} a été résolu! Détails: https://ces-frontend-zeta.vercel.app/followup?id={ticketId}`
        },
        kinyarwanda: {
            message: `Mwaramutse {name}, ikibazo {ticketId} cyakemuwe! Ibisobanura: https://ces-frontend-zeta.vercel.app/followup?id={ticketId}`
        }
    },

    // Issue Escalated Templates
    escalated: {
        english: {
            message: `Hi {name}, your issue {ticketId} has been escalated to {escalatedTo}. Track: https://ces-frontend-zeta.vercel.app/followup?id={ticketId}`
        },
        french: {
            message: `Bonjour {name}, votre problème {ticketId} a été escaladé à {escalatedTo}. Suivi: https://ces-frontend-zeta.vercel.app/followup?id={ticketId}`
        },
        kinyarwanda: {
            message: `Mwaramutse {name}, ikibazo {ticketId} cyoherejwe kuri {escalatedTo}. Kurikirana: https://ces-frontend-zeta.vercel.app/followup?id={ticketId}`
        }
    },

    // Issue Assigned Templates
    assigned: {
        english: {
            message: `Hi {name}, your issue {ticketId} has been assigned to {assignedTo}. Track: https://ces-frontend-zeta.vercel.app/followup?id={ticketId}`
        },
        french: {
            message: `Bonjour {name}, votre problème {ticketId} a été assigné à {assignedTo}. Suivi: https://ces-frontend-zeta.vercel.app/followup?id={ticketId}`
        },
        kinyarwanda: {
            message: `Mwaramutse {name}, ikibazo {ticketId} cyahawe {assignedTo}. Kurikirana: https://ces-frontend-zeta.vercel.app/followup?id={ticketId}`
        }
    },

    // Issue Closed Templates
    closed: {
        english: {
            message: `Hi {name}, your issue {ticketId} has been closed. If you need help, contact us. Details: https://ces-frontend-zeta.vercel.app/followup?id={ticketId}`
        },
        french: {
            message: `Bonjour {name}, votre problème {ticketId} a été fermé. Si vous avez besoin d'aide, contactez-nous. Détails: https://ces-frontend-zeta.vercel.app/followup?id={ticketId}`
        },
        kinyarwanda: {
            message: `Mwaramutse {name}, ikibazo {ticketId} cyafunguwe. Niba ukeneye ubufasha, tubabarire. Ibisobanura: https://ces-frontend-zeta.vercel.app/followup?id={ticketId}`
        }
    },

    // Issue In Progress Templates
    in_progress: {
        english: {
            message: `Hi {name}, we're working on your issue {ticketId}. We'll update you soon. Track: https://ces-frontend-zeta.vercel.app/followup?id={ticketId}`
        },
        french: {
            message: `Bonjour {name}, nous travaillons sur votre problème {ticketId}. Nous vous tiendrons informé. Suivi: https://ces-frontend-zeta.vercel.app/followup?id={ticketId}`
        },
        kinyarwanda: {
            message: `Mwaramutse {name}, dukora ku kibazo {ticketId}. Tuzagufasha amakuru vuba. Kurikirana: https://ces-frontend-zeta.vercel.app/followup?id={ticketId}`
        }
    }
};

/**
 * Get SMS template by status and language
 * @param {string} status - Issue status
 * @param {string} language - Language preference
 * @returns {Object|null} SMS template or null if not found
 */
function getTemplate(status, language) {
    const normalizedStatus = status?.toLowerCase().replace(/[-_\s]/g, '_');
    const normalizedLanguage = language?.toLowerCase();
    
    if (templates[normalizedStatus] && templates[normalizedStatus][normalizedLanguage]) {
        return templates[normalizedStatus][normalizedLanguage];
    }
    
    // Fallback to English if language not found
    if (templates[normalizedStatus] && templates[normalizedStatus]['english']) {
        console.warn(`SMS template for language '${language}' not found, falling back to English`);
        return templates[normalizedStatus]['english'];
    }
    
    return null;
}

/**
 * Get all available statuses
 * @returns {Array} Array of available statuses
 */
function getAvailableStatuses() {
    return Object.keys(templates);
}

/**
 * Get all available languages
 * @returns {Array} Array of available languages
 */
function getAvailableLanguages() {
    return ['english', 'french', 'kinyarwanda'];
}

/**
 * Check if a status template exists
 * @param {string} status - Status to check
 * @returns {boolean} True if template exists
 */
function hasTemplate(status) {
    const normalizedStatus = status?.toLowerCase().replace(/[-_\s]/g, '_');
    return !!templates[normalizedStatus];
}

/**
 * Get template character count info
 * @param {string} status - Issue status
 * @param {string} language - Language
 * @param {Object} data - Template data for placeholder replacement
 * @returns {Object} Character count and parts info
 */
function getTemplateInfo(status, language, data = {}) {
    const template = getTemplate(status, language);
    if (!template) {
        return null;
    }

    // Build message with sample data to get accurate character count
    let message = template.message;
    const sampleData = {
        '{name}': data.name || 'Customer',
        '{ticketId}': data.ticketId || 'TK12345',
        '{issueTitle}': data.issueTitle || 'Issue',
        '{assignedTo}': data.assignedTo || 'Support Team',
        '{escalatedTo}': data.escalatedTo || 'Support Team',
        '{responseMessage}': data.responseMessage || 'Resolved',
        '{currentDate}': new Date().toLocaleDateString()
    };

    for (const [placeholder, value] of Object.entries(sampleData)) {
        message = message.replace(new RegExp(placeholder, 'g'), value);
    }

    const totalChars = message.length;
    const maxCharsPerPart = 153; // Plain text limit
    const parts = Math.ceil(totalChars / maxCharsPerPart);
    
    return {
        totalChars,
        maxCharsPerPart,
        parts,
        isMultiPart: parts > 1,
        remainingChars: maxCharsPerPart - (totalChars % maxCharsPerPart),
        message
    };
}

/**
 * Validate template length for SMS constraints
 * @param {string} status - Issue status
 * @param {string} language - Language
 * @param {Object} data - Template data
 * @returns {Object} Validation result
 */
function validateTemplateLength(status, language, data = {}) {
    const info = getTemplateInfo(status, language, data);
    
    if (!info) {
        return {
            isValid: false,
            error: 'Template not found'
        };
    }

    if (info.parts > 5) {
        return {
            isValid: false,
            error: `Message too long: ${info.parts} parts (max 5 allowed)`,
            info
        };
    }

    return {
        isValid: true,
        info
    };
}

module.exports = {
    getTemplate,
    getAvailableStatuses,
    getAvailableLanguages,
    hasTemplate,
    getTemplateInfo,
    validateTemplateLength,
    templates
};
