/**
 * Validation utilities for email requests
 */

const emailTemplates = require('./emailTemplates');
const smsTemplates = require('./smsTemplates');

/**
 * Validate email address format
 * @param {string} email - Email address to validate
 * @returns {boolean} True if valid email format
 */
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Validate ticket ID format
 * @param {string} ticketId - Ticket ID to validate
 * @returns {boolean} True if valid ticket ID
 */
function isValidTicketId(ticketId) {
    // Allow alphanumeric characters, hyphens, and underscores
    const ticketRegex = /^[A-Za-z0-9\-_]{1,50}$/;
    return ticketRegex.test(ticketId);
}

/**
 * Validate name format
 * @param {string} name - Name to validate
 * @returns {boolean} True if valid name
 */
function isValidName(name) {
    // Allow letters, spaces, hyphens, and apostrophes, 1-100 characters
    const nameRegex = /^[A-Za-z\s\-']{1,100}$/;
    return nameRegex.test(name);
}

/**
 * Validate language
 * @param {string} language - Language to validate
 * @returns {boolean} True if valid/supported language
 */
function isValidLanguage(language) {
    const supportedLanguages = emailTemplates.getAvailableLanguages();
    const normalizedLanguage = language?.toLowerCase();
    
    // Also accept common language codes
    const languageMap = {
        'en': 'english',
        'fr': 'french',
        'rw': 'kinyarwanda',
        'kin': 'kinyarwanda',
        'français': 'french'
    };
    
    return supportedLanguages.includes(normalizedLanguage) || 
           languageMap.hasOwnProperty(normalizedLanguage);
}

/**
 * Validate issue status/subject
 * @param {string} subject - Subject/status to validate
 * @returns {boolean} True if valid status
 */
function isValidSubject(subject) {
    const availableStatuses = emailTemplates.getAvailableStatuses();
    const normalizedSubject = subject?.toLowerCase().replace(/[-_\s]/g, '_');
    
    return availableStatuses.includes(normalizedSubject);
}

/**
 * Validate email request data
 * @param {Object} emailData - Email request data
 * @returns {Object} Validation result with isValid boolean and errors array
 */
function validateEmailRequest(emailData) {
    const errors = [];
    
    // Required fields validation
    if (!emailData) {
        errors.push('Email data is required');
        return { isValid: false, errors };
    }
    
    // Email validation
    if (!emailData.email) {
        errors.push('email is required');
    } else if (typeof emailData.email !== 'string') {
        errors.push('email must be a string');
    } else if (!isValidEmail(emailData.email.trim())) {
        errors.push('email must be a valid email address');
    }
    
    // Ticket ID validation
    if (!emailData.ticketId) {
        errors.push('ticketId is required');
    } else if (typeof emailData.ticketId !== 'string') {
        errors.push('ticketId must be a string');
    } else if (!isValidTicketId(emailData.ticketId.trim())) {
        errors.push('ticketId must contain only alphanumeric characters, hyphens, and underscores (1-50 characters)');
    }
    
    // Name validation
    if (!emailData.name) {
        errors.push('name is required');
    } else if (typeof emailData.name !== 'string') {
        errors.push('name must be a string');
    } else if (!isValidName(emailData.name.trim())) {
        errors.push('name must contain only letters, spaces, hyphens, and apostrophes (1-100 characters)');
    }
    
    // Language validation
    if (!emailData.language) {
        errors.push('language is required');
    } else if (typeof emailData.language !== 'string') {
        errors.push('language must be a string');
    } else if (!isValidLanguage(emailData.language.trim())) {
        const availableLanguages = emailTemplates.getAvailableLanguages();
        errors.push(`language must be one of: ${availableLanguages.join(', ')}`);
    }
    
    // Subject validation
    if (!emailData.subject) {
        errors.push('subject is required');
    } else if (typeof emailData.subject !== 'string') {
        errors.push('subject must be a string');
    } else if (!isValidSubject(emailData.subject.trim())) {
        const availableStatuses = emailTemplates.getAvailableStatuses();
        errors.push(`subject must be one of: ${availableStatuses.join(', ')}`);
    }
    
    // Optional fields validation
    if (emailData.assignedTo !== undefined && emailData.assignedTo !== null && emailData.assignedTo !== '') {
        if (typeof emailData.assignedTo !== 'string') {
            errors.push('assignedTo must be a string');
        } else if (emailData.assignedTo.trim() && !isValidName(emailData.assignedTo.trim())) {
            errors.push('assignedTo must contain only letters, spaces, hyphens, and apostrophes (1-100 characters)');
        }
    }
    
    if (emailData.escalatedTo !== undefined && emailData.escalatedTo !== null && emailData.escalatedTo !== '') {
        if (typeof emailData.escalatedTo !== 'string') {
            errors.push('escalatedTo must be a string');
        } else if (emailData.escalatedTo.trim() && !isValidName(emailData.escalatedTo.trim())) {
            errors.push('escalatedTo must contain only letters, spaces, hyphens, and apostrophes (1-100 characters)');
        }
    }
    
    if (emailData.issueTitle !== undefined && emailData.issueTitle !== null && emailData.issueTitle !== '') {
        if (typeof emailData.issueTitle !== 'string') {
            errors.push('issueTitle must be a string');
        } else if (emailData.issueTitle.length > 200) {
            errors.push('issueTitle must be 200 characters or less');
        }
    }
    
    if (emailData.responseMessage !== undefined && emailData.responseMessage !== null && emailData.responseMessage !== '') {
        if (typeof emailData.responseMessage !== 'string') {
            errors.push('responseMessage must be a string');
        } else if (emailData.responseMessage.length > 2000) {
            errors.push('responseMessage must be 2000 characters or less');
        }
    }
    
    // Conditional validation - check if required fields are present for specific statuses
    const subject = emailData.subject?.toLowerCase().replace(/[-_\s]/g, '_');
    
    if ((subject === 'assigned' || subject === 'escalated') && !emailData.assignedTo && !emailData.escalatedTo) {
        if (subject === 'assigned') {
            errors.push('assignedTo is required when subject is "assigned"');
        }
        if (subject === 'escalated') {
            errors.push('escalatedTo is required when subject is "escalated"');
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Validate bulk email request
 * @param {Array} emails - Array of email request objects
 * @returns {Object} Validation result
 */
function validateBulkEmailRequest(emails) {
    const errors = [];
    
    if (!Array.isArray(emails)) {
        errors.push('emails must be an array');
        return { isValid: false, errors };
    }
    
    if (emails.length === 0) {
        errors.push('emails array cannot be empty');
        return { isValid: false, errors };
    }
    
    if (emails.length > 50) {
        errors.push('maximum 50 emails allowed per batch');
        return { isValid: false, errors };
    }
    
    // Validate each email in the array
    emails.forEach((emailData, index) => {
        const validation = validateEmailRequest(emailData);
        if (!validation.isValid) {
            validation.errors.forEach(error => {
                errors.push(`Email ${index + 1}: ${error}`);
            });
        }
    });
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Sanitize email data by trimming strings and removing null/undefined values
 * @param {Object} emailData - Email data to sanitize
 * @returns {Object} Sanitized email data
 */
function sanitizeEmailData(emailData) {
    const sanitized = { ...emailData };
    
    // Trim string fields
    const stringFields = ['email', 'ticketId', 'name', 'language', 'subject', 'assignedTo', 'escalatedTo', 'issueTitle', 'responseMessage'];
    
    stringFields.forEach(field => {
        if (typeof sanitized[field] === 'string') {
            sanitized[field] = sanitized[field].trim();
            
            // Remove empty strings (convert to undefined)
            if (sanitized[field] === '') {
                sanitized[field] = undefined;
            }
        }
    });
    
    // Remove undefined values
    Object.keys(sanitized).forEach(key => {
        if (sanitized[key] === undefined || sanitized[key] === null) {
            delete sanitized[key];
        }
    });
    
    return sanitized;
}

/**
 * Validate phone number format
 * @param {string} phoneNumber - Phone number to validate
 * @returns {boolean} True if valid phone number format
 */
function isValidPhoneNumber(phoneNumber) {
    // Remove all non-digit characters
    const cleaned = phoneNumber.replace(/\D/g, '');
    
    // Check if it's a valid length (7-15 digits)
    if (cleaned.length < 7 || cleaned.length > 15) {
        return false;
    }
    
    // Check if it contains only digits
    return /^\d+$/.test(cleaned);
}

/**
 * Normalize phone number by removing non-digit characters
 * @param {string} phoneNumber - Phone number to normalize
 * @returns {string} Normalized phone number
 */
function normalizePhoneNumber(phoneNumber) {
    return phoneNumber.replace(/\D/g, '');
}

/**
 * Validate SMS request data
 * @param {Object} smsData - SMS request data
 * @returns {Object} Validation result with isValid boolean and errors array
 */
function validateSmsRequest(smsData) {
    const errors = [];
    
    // Required fields validation
    if (!smsData) {
        errors.push('SMS data is required');
        return { isValid: false, errors };
    }
    
    // Phone number validation
    if (!smsData.phoneNumber) {
        errors.push('phoneNumber is required');
    } else if (typeof smsData.phoneNumber !== 'string') {
        errors.push('phoneNumber must be a string');
    } else if (!isValidPhoneNumber(smsData.phoneNumber.trim())) {
        errors.push('phoneNumber must be a valid phone number (7-15 digits)');
    }
    
    // Ticket ID validation
    if (!smsData.ticketId) {
        errors.push('ticketId is required');
    } else if (typeof smsData.ticketId !== 'string') {
        errors.push('ticketId must be a string');
    } else if (!isValidTicketId(smsData.ticketId.trim())) {
        errors.push('ticketId must contain only alphanumeric characters, hyphens, and underscores (1-50 characters)');
    }
    
    // Name validation
    if (!smsData.name) {
        errors.push('name is required');
    } else if (typeof smsData.name !== 'string') {
        errors.push('name must be a string');
    } else if (!isValidName(smsData.name.trim())) {
        errors.push('name must contain only letters, spaces, hyphens, and apostrophes (1-100 characters)');
    }
    
    // Language validation
    if (!smsData.language) {
        errors.push('language is required');
    } else if (typeof smsData.language !== 'string') {
        errors.push('language must be a string');
    } else if (!isValidLanguage(smsData.language.trim())) {
        const availableLanguages = smsTemplates.getAvailableLanguages();
        errors.push(`language must be one of: ${availableLanguages.join(', ')}`);
    }
    
    // Subject validation
    if (!smsData.subject) {
        errors.push('subject is required');
    } else if (typeof smsData.subject !== 'string') {
        errors.push('subject must be a string');
    } else if (!isValidSubject(smsData.subject.trim())) {
        const availableStatuses = smsTemplates.getAvailableStatuses();
        errors.push(`subject must be one of: ${availableStatuses.join(', ')}`);
    }
    
    // Optional fields validation
    if (smsData.assignedTo !== undefined && smsData.assignedTo !== null && smsData.assignedTo !== '') {
        if (typeof smsData.assignedTo !== 'string') {
            errors.push('assignedTo must be a string');
        } else if (smsData.assignedTo.trim() && !isValidName(smsData.assignedTo.trim())) {
            errors.push('assignedTo must contain only letters, spaces, hyphens, and apostrophes (1-100 characters)');
        }
    }
    
    if (smsData.escalatedTo !== undefined && smsData.escalatedTo !== null && smsData.escalatedTo !== '') {
        if (typeof smsData.escalatedTo !== 'string') {
            errors.push('escalatedTo must be a string');
        } else if (smsData.escalatedTo.trim() && !isValidName(smsData.escalatedTo.trim())) {
            errors.push('escalatedTo must contain only letters, spaces, hyphens, and apostrophes (1-100 characters)');
        }
    }
    
    if (smsData.issueTitle !== undefined && smsData.issueTitle !== null && smsData.issueTitle !== '') {
        if (typeof smsData.issueTitle !== 'string') {
            errors.push('issueTitle must be a string');
        } else if (smsData.issueTitle.length > 200) {
            errors.push('issueTitle must be 200 characters or less');
        }
    }
    
    if (smsData.responseMessage !== undefined && smsData.responseMessage !== null && smsData.responseMessage !== '') {
        if (typeof smsData.responseMessage !== 'string') {
            errors.push('responseMessage must be a string');
        } else if (smsData.responseMessage.length > 2000) {
            errors.push('responseMessage must be 2000 characters or less');
        }
    }
    
    // Conditional validation - check if required fields are present for specific statuses
    const subject = smsData.subject?.toLowerCase().replace(/[-_\s]/g, '_');
    
    if ((subject === 'assigned' || subject === 'escalated') && !smsData.assignedTo && !smsData.escalatedTo) {
        if (subject === 'assigned') {
            errors.push('assignedTo is required when subject is "assigned"');
        }
        if (subject === 'escalated') {
            errors.push('escalatedTo is required when subject is "escalated"');
        }
    }
    
    // Validate SMS template length
    if (errors.length === 0) {
        const templateValidation = smsTemplates.validateTemplateLength(
            smsData.subject, 
            smsData.language, 
            {
                name: smsData.name,
                ticketId: smsData.ticketId,
                issueTitle: smsData.issueTitle,
                assignedTo: smsData.assignedTo,
                escalatedTo: smsData.escalatedTo,
                responseMessage: smsData.responseMessage
            }
        );
        
        if (!templateValidation.isValid) {
            errors.push(templateValidation.error);
        }
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Validate bulk SMS request
 * @param {Array} smsList - Array of SMS request objects
 * @returns {Object} Validation result
 */
function validateBulkSmsRequest(smsList) {
    const errors = [];
    
    if (!Array.isArray(smsList)) {
        errors.push('smsList must be an array');
        return { isValid: false, errors };
    }
    
    if (smsList.length === 0) {
        errors.push('smsList array cannot be empty');
        return { isValid: false, errors };
    }
    
    if (smsList.length > 30) {
        errors.push('maximum 30 SMS messages allowed per batch');
        return { isValid: false, errors };
    }
    
    // Validate each SMS in the array
    smsList.forEach((smsData, index) => {
        const validation = validateSmsRequest(smsData);
        if (!validation.isValid) {
            validation.errors.forEach(error => {
                errors.push(`SMS ${index + 1}: ${error}`);
            });
        }
    });
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Sanitize SMS data by trimming strings and removing null/undefined values
 * @param {Object} smsData - SMS data to sanitize
 * @returns {Object} Sanitized SMS data
 */
function sanitizeSmsData(smsData) {
    const sanitized = { ...smsData };
    
    // Trim string fields
    const stringFields = ['phoneNumber', 'ticketId', 'name', 'language', 'subject', 'assignedTo', 'escalatedTo', 'issueTitle', 'responseMessage'];
    
    stringFields.forEach(field => {
        if (typeof sanitized[field] === 'string') {
            sanitized[field] = sanitized[field].trim();
            
            // Remove empty strings (convert to undefined)
            if (sanitized[field] === '') {
                sanitized[field] = undefined;
            }
        }
    });
    
    // Normalize phone number
    if (sanitized.phoneNumber) {
        sanitized.phoneNumber = normalizePhoneNumber(sanitized.phoneNumber);
    }
    
    // Remove undefined values
    Object.keys(sanitized).forEach(key => {
        if (sanitized[key] === undefined || sanitized[key] === null) {
            delete sanitized[key];
        }
    });
    
    return sanitized;
}

/**
 * Validate environment configuration
 * @returns {Object} Validation result for environment setup
 */
function validateEnvironmentConfig() {
    const errors = [];
    
    if (!process.env.SENDGRID_API_KEY) {
        errors.push('SENDGRID_API_KEY environment variable is required');
    } else if (!process.env.SENDGRID_API_KEY.startsWith('SG.')) {
        errors.push('SENDGRID_API_KEY must start with "SG."');
    }
    
    if (!process.env.FROM_EMAIL) {
        errors.push('FROM_EMAIL environment variable is required');
    } else if (!isValidEmail(process.env.FROM_EMAIL)) {
        errors.push('FROM_EMAIL must be a valid email address');
    }
    
    // SMS configuration validation
    if (!process.env.SMS_API_TOKEN) {
        errors.push('SMS_API_TOKEN environment variable is required for SMS functionality');
    }
    
    if (!process.env.SMS_SENDER_ID) {
        errors.push('SMS_SENDER_ID environment variable is required for SMS functionality');
    }
    
    return {
        isValid: errors.length === 0,
        errors
    };
}

module.exports = {
    validateEmailRequest,
    validateBulkEmailRequest,
    sanitizeEmailData,
    validateSmsRequest,
    validateBulkSmsRequest,
    sanitizeSmsData,
    validateEnvironmentConfig,
    isValidEmail,
    isValidTicketId,
    isValidName,
    isValidLanguage,
    isValidSubject,
    isValidPhoneNumber,
    normalizePhoneNumber
};