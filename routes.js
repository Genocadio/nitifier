const express = require('express');
const rateLimit = require('express-rate-limit');
const EmailService = require('./emailService');
const SmsService = require('./smsService');
const { validateEmailRequest, validateSmsRequest, validateTripRequest, validateBulkTripRequest } = require('./validators');

const router = express.Router();
const emailService = new EmailService();
const smsService = new SmsService();

// Rate limiting middleware
const emailRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        error: 'Too many email requests from this IP, please try again later.',
        code: 'RATE_LIMIT_EXCEEDED'
    }
});

// Apply rate limiting to all email routes
router.use(emailRateLimit);

/**
 * POST /api/email/send
 * Send a single email based on issue status
 * 
 * Body Parameters:
 * - email: string (required) - Recipient email address
 * - ticketId: string (required) - Ticket ID
 * - name: string (required) - Recipient name
 * - language: string (required) - Language preference (english, french, kinyarwanda)
 * - subject: string (required) - Issue status (received, resolved, escalated, assigned, closed, in_progress)
 * - assignedTo: string (optional) - Name of person assigned to (for assignment/escalation)
 * - escalatedTo: string (optional) - Name of person escalated to
 * - issueTitle: string (optional) - Title of the issue
 * - responseMessage: string (optional) - Response message for responses
 */
router.post('/email/send', async (req, res) => {
    try {
        const emailData = req.body;
        
        // Log incoming request (excluding sensitive data)
        console.log(`Email request received for ticket ${emailData.ticketId} with status ${emailData.subject}`);
        
        // Send email
        const result = await emailService.sendIssueEmail(emailData);
        
        if (result.success) {
            res.status(200).json({
                success: true,
                data: {
                    messageId: result.messageId,
                    status: result.status,
                    message: result.message,
                    ticketId: emailData.ticketId,
                    recipient: emailData.email
                }
            });
        } else {
            res.status(400).json({
                success: false,
                error: {
                    message: result.message,
                    details: result.error,
                    code: 'EMAIL_SEND_FAILED'
                }
            });
        }
    } catch (error) {
        console.error('Error in email send endpoint:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Internal server error',
                code: 'INTERNAL_ERROR'
            }
        });
    }
});

/**
 * POST /api/email/send-bulk
 * Send multiple emails in batch
 * 
 * Body Parameters:
 * - emails: Array of email objects (same structure as single send)
 */
router.post('/email/send-bulk', async (req, res) => {
    try {
        const { emails } = req.body;
        
        if (!Array.isArray(emails) || emails.length === 0) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'emails must be a non-empty array',
                    code: 'INVALID_INPUT'
                }
            });
        }
        
        if (emails.length > 50) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Maximum 50 emails allowed per batch',
                    code: 'BATCH_SIZE_EXCEEDED'
                }
            });
        }
        
        console.log(`Bulk email request received for ${emails.length} emails`);
        
        const results = await emailService.sendBulkEmails(emails);
        
        // Summarize results
        const summary = results.reduce((acc, result) => {
            if (result.result.success) {
                acc.successful++;
            } else {
                acc.failed++;
            }
            return acc;
        }, { successful: 0, failed: 0 });
        
        res.status(200).json({
            success: true,
            data: {
                summary,
                results: results.map(r => ({
                    email: r.email,
                    ticketId: r.ticketId,
                    success: r.result.success,
                    messageId: r.result.messageId,
                    message: r.result.message,
                    error: r.result.success ? null : r.result.error
                }))
            }
        });
    } catch (error) {
        console.error('Error in bulk email send endpoint:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Internal server error',
                code: 'INTERNAL_ERROR'
            }
        });
    }
});

/**
 * GET /api/email/templates
 * Get available email templates and statuses
 */
router.get('/email/templates', (req, res) => {
    try {
        const emailTemplates = require('./emailTemplates');
        
        res.status(200).json({
            success: true,
            data: {
                availableStatuses: emailTemplates.getAvailableStatuses(),
                availableLanguages: emailTemplates.getAvailableLanguages(),
                templates: Object.keys(emailTemplates.templates).map(status => ({
                    status,
                    languages: Object.keys(emailTemplates.templates[status])
                }))
            }
        });
    } catch (error) {
        console.error('Error in templates endpoint:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Internal server error',
                code: 'INTERNAL_ERROR'
            }
        });
    }
});

/**
 * GET /api/email/template/:status/:language
 * Get specific template by status and language
 */
router.get('/email/template/:status/:language', (req, res) => {
    try {
        const { status, language } = req.params;
        const emailTemplates = require('./emailTemplates');
        
        const template = emailTemplates.getTemplate(status, language);
        
        if (!template) {
            return res.status(404).json({
                success: false,
                error: {
                    message: `Template not found for status '${status}' and language '${language}'`,
                    code: 'TEMPLATE_NOT_FOUND'
                }
            });
        }
        
        res.status(200).json({
            success: true,
            data: {
                status,
                language,
                template: {
                    subject: template.subject,
                    body: template.body,
                    hasHtml: !!template.htmlBody
                }
            }
        });
    } catch (error) {
        console.error('Error in template endpoint:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Internal server error',
                code: 'INTERNAL_ERROR'
            }
        });
    }
});

/**
 * POST /api/email/validate
 * Validate email request without sending
 */
router.post('/email/validate', (req, res) => {
    try {
        const emailData = req.body;
        const validation = validateEmailRequest(emailData);
        
        if (validation.isValid) {
            res.status(200).json({
                success: true,
                data: {
                    isValid: true,
                    message: 'Email request is valid'
                }
            });
        } else {
            res.status(400).json({
                success: false,
                error: {
                    message: 'Validation failed',
                    code: 'VALIDATION_FAILED',
                    details: validation.errors
                }
            });
        }
    } catch (error) {
        console.error('Error in validation endpoint:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Internal server error',
                code: 'INTERNAL_ERROR'
            }
        });
    }
});

/**
 * POST /api/email/test
 * Test email service configuration
 */
router.post('/email/test', async (req, res) => {
    try {
        const { testEmail } = req.body;
        
        // Temporarily override test email if provided
        if (testEmail) {
            process.env.TEST_EMAIL = testEmail;
        }
        
        const result = await emailService.testConfiguration();
        
        if (result.success) {
            res.status(200).json({
                success: true,
                data: {
                    message: result.message,
                    testEmail: process.env.TEST_EMAIL
                }
            });
        } else {
            res.status(400).json({
                success: false,
                error: {
                    message: result.message,
                    details: result.error,
                    code: 'CONFIG_TEST_FAILED'
                }
            });
        }
    } catch (error) {
        console.error('Error in test endpoint:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Internal server error',
                code: 'INTERNAL_ERROR'
            }
        });
    }
});

/**
 * GET /api/email/health
 * Health check endpoint
 */
router.get('/email/health', (req, res) => {
    try {
        const hasApiKey = !!process.env.SENDGRID_API_KEY;
        const hasFromEmail = !!process.env.FROM_EMAIL;
        
        res.status(200).json({
            success: true,
            data: {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                configuration: {
                    hasApiKey,
                    hasFromEmail,
                    isConfigured: hasApiKey && hasFromEmail
                }
            }
        });
    } catch (error) {
        console.error('Error in health endpoint:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Health check failed',
                code: 'HEALTH_CHECK_FAILED'
            }
        });
    }
});

// ==================== SMS ROUTES ====================

/**
 * POST /api/sms/send
 * Send a single SMS based on issue status
 * 
 * Body Parameters:
 * - phoneNumber: string (required) - Recipient phone number (without + or 00)
 * - ticketId: string (required) - Ticket ID
 * - name: string (required) - Recipient name
 * - language: string (required) - Language preference (english, french, kinyarwanda)
 * - subject: string (required) - Issue status (received, resolved, escalated, assigned, closed, in_progress)
 * - assignedTo: string (optional) - Name of person assigned to (for assignment/escalation)
 * - escalatedTo: string (optional) - Name of person escalated to
 * - issueTitle: string (optional) - Title of the issue
 * - responseMessage: string (optional) - Response message for responses
 */
router.post('/sms/send', async (req, res) => {
    try {
        const smsData = req.body;
        
        // Log incoming request (excluding sensitive data)
        console.log(`SMS request received for ticket ${smsData.ticketId} with status ${smsData.subject}`);
        
        // Send SMS
        const result = await smsService.sendIssueSms(smsData);
        
        if (result.success) {
            res.status(200).json({
                success: true,
                data: {
                    status: result.status,
                    message: result.message,
                    ticketId: smsData.ticketId,
                    phoneNumber: smsData.phoneNumber
                }
            });
        } else {
            res.status(400).json({
                success: false,
                error: {
                    message: result.message,
                    details: result.error,
                    code: 'SMS_SEND_FAILED'
                }
            });
        }
    } catch (error) {
        console.error('Error in SMS send endpoint:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Internal server error',
                code: 'INTERNAL_ERROR'
            }
        });
    }
});

/**
 * POST /api/sms/send-bulk
 * Send multiple SMS messages in batch
 * 
 * Body Parameters:
 * - smsList: Array of SMS objects (same structure as single send)
 */
router.post('/sms/send-bulk', async (req, res) => {
    try {
        const { smsList } = req.body;
        
        if (!Array.isArray(smsList) || smsList.length === 0) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'smsList must be a non-empty array',
                    code: 'INVALID_INPUT'
                }
            });
        }
        
        if (smsList.length > 30) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Maximum 30 SMS messages allowed per batch',
                    code: 'BATCH_SIZE_EXCEEDED'
                }
            });
        }
        
        console.log(`Bulk SMS request received for ${smsList.length} messages`);
        
        const results = await smsService.sendBulkSms(smsList);
        
        // Summarize results
        const summary = results.reduce((acc, result) => {
            if (result.result.success) {
                acc.successful++;
            } else {
                acc.failed++;
            }
            return acc;
        }, { successful: 0, failed: 0 });
        
        res.status(200).json({
            success: true,
            data: {
                summary,
                results: results.map(r => ({
                    phoneNumber: r.phoneNumber,
                    ticketId: r.ticketId,
                    success: r.result.success,
                    message: r.result.message,
                    error: r.result.success ? null : r.result.error
                }))
            }
        });
    } catch (error) {
        console.error('Error in bulk SMS send endpoint:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Internal server error',
                code: 'INTERNAL_ERROR'
            }
        });
    }
});

/**
 * GET /api/sms/templates
 * Get available SMS templates and statuses
 */
router.get('/sms/templates', (req, res) => {
    try {
        const smsTemplates = require('./smsTemplates');
        
        res.status(200).json({
            success: true,
            data: {
                availableStatuses: smsTemplates.getAvailableStatuses(),
                availableLanguages: smsTemplates.getAvailableLanguages(),
                templates: Object.keys(smsTemplates.templates).map(status => ({
                    status,
                    languages: Object.keys(smsTemplates.templates[status])
                }))
            }
        });
    } catch (error) {
        console.error('Error in SMS templates endpoint:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Internal server error',
                code: 'INTERNAL_ERROR'
            }
        });
    }
});

/**
 * GET /api/sms/template/:status/:language
 * Get specific SMS template by status and language
 */
router.get('/sms/template/:status/:language', (req, res) => {
    try {
        const { status, language } = req.params;
        const smsTemplates = require('./smsTemplates');
        
        const template = smsTemplates.getTemplate(status, language);
        
        if (!template) {
            return res.status(404).json({
                success: false,
                error: {
                    message: `SMS template not found for status '${status}' and language '${language}'`,
                    code: 'TEMPLATE_NOT_FOUND'
                }
            });
        }
        
        // Get template info with character count
        const templateInfo = smsTemplates.getTemplateInfo(status, language);
        
        res.status(200).json({
            success: true,
            data: {
                status,
                language,
                template: {
                    message: template.message,
                    characterCount: templateInfo?.totalChars || 0,
                    parts: templateInfo?.parts || 1,
                    isMultiPart: templateInfo?.isMultiPart || false
                }
            }
        });
    } catch (error) {
        console.error('Error in SMS template endpoint:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Internal server error',
                code: 'INTERNAL_ERROR'
            }
        });
    }
});

/**
 * POST /api/sms/validate
 * Validate SMS request without sending
 */
router.post('/sms/validate', (req, res) => {
    try {
        const smsData = req.body;
        const validation = validateSmsRequest(smsData);
        
        if (validation.isValid) {
            res.status(200).json({
                success: true,
                data: {
                    isValid: true,
                    message: 'SMS request is valid'
                }
            });
        } else {
            res.status(400).json({
                success: false,
                error: {
                    message: 'Validation failed',
                    code: 'VALIDATION_FAILED',
                    details: validation.errors
                }
            });
        }
    } catch (error) {
        console.error('Error in SMS validation endpoint:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Internal server error',
                code: 'INTERNAL_ERROR'
            }
        });
    }
});

/**
 * POST /api/sms/test
 * Test SMS service configuration
 */
router.post('/sms/test', async (req, res) => {
    try {
        const { testPhone } = req.body;
        
        // Temporarily override test phone if provided
        if (testPhone) {
            process.env.TEST_PHONE = testPhone;
        }
        
        const result = await smsService.testConfiguration();
        
        if (result.success) {
            res.status(200).json({
                success: true,
                data: {
                    message: result.message,
                    testPhone: process.env.TEST_PHONE
                }
            });
        } else {
            res.status(400).json({
                success: false,
                error: {
                    message: result.message,
                    details: result.error,
                    code: 'CONFIG_TEST_FAILED'
                }
            });
        }
    } catch (error) {
        console.error('Error in SMS test endpoint:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Internal server error',
                code: 'INTERNAL_ERROR'
            }
        });
    }
});

/**
 * GET /api/sms/health
 * SMS service health check endpoint
 */
router.get('/sms/health', (req, res) => {
    try {
        const hasApiToken = !!process.env.SMS_API_TOKEN;
        const hasSenderId = !!process.env.SMS_SENDER_ID;
        
        res.status(200).json({
            success: true,
            data: {
                status: 'healthy',
                timestamp: new Date().toISOString(),
                configuration: {
                    hasApiToken,
                    hasSenderId,
                    isConfigured: hasApiToken && hasSenderId
                }
            }
        });
    } catch (error) {
        console.error('Error in SMS health endpoint:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'SMS health check failed',
                code: 'HEALTH_CHECK_FAILED'
            }
        });
    }
});

// ==================== TRIP NOTIFICATION ROUTES ====================

/**
 * POST /api/trip/send
 * Send trip notification via email and/or SMS
 * 
 * Body Parameters:
 * - email: string (optional) - Recipient email address
 * - phoneNumber: string (optional) - Recipient phone number (without + or 00)
 * - name: string (required) - Recipient name
 * - language: string (required) - Language preference (english, french, kinyarwanda)
 * - notificationType: string (required) - Trip notification type (trip_remaining_time, trip_arrival_notice)
 * - destinationName: string (required) - Destination name
 * - remainingTime: string (required for trip_remaining_time) - Remaining time (e.g., "2 hours", "30 minutes")
 * - tripId: string (optional) - Trip ID
 */
router.post('/trip/send', async (req, res) => {
    try {
        const tripData = req.body;
        
        // Validate input
        const validation = validateTripRequest(tripData);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Validation failed',
                    code: 'VALIDATION_FAILED',
                    details: validation.errors
                }
            });
        }
        
        // Log incoming request (excluding sensitive data)
        console.log(`Trip notification request received for ${tripData.notificationType} to ${tripData.destinationName}`);
        
        const results = {
            email: null,
            sms: null
        };
        
        // Send email if provided
        if (tripData.email) {
            try {
                const emailResult = await emailService.sendTripEmail(tripData);
                results.email = {
                    success: emailResult.success,
                    messageId: emailResult.messageId,
                    status: emailResult.status,
                    message: emailResult.message,
                    error: emailResult.success ? null : emailResult.error
                };
            } catch (error) {
                results.email = {
                    success: false,
                    status: 'failed',
                    message: error.message,
                    error: error.message
                };
            }
        }
        
        // Send SMS if provided
        if (tripData.phoneNumber) {
            try {
                const smsResult = await smsService.sendTripSms(tripData);
                results.sms = {
                    success: smsResult.success,
                    status: smsResult.status,
                    message: smsResult.message,
                    phoneNumber: smsResult.phoneNumber,
                    error: smsResult.success ? null : smsResult.error
                };
            } catch (error) {
                results.sms = {
                    success: false,
                    status: 'failed',
                    message: error.message,
                    error: error.message
                };
            }
        }
        
        // Determine overall success
        const overallSuccess = (results.email === null || results.email.success) && 
                              (results.sms === null || results.sms.success);
        
        res.status(overallSuccess ? 200 : 400).json({
            success: overallSuccess,
            data: {
                destinationName: tripData.destinationName,
                notificationType: tripData.notificationType,
                tripId: tripData.tripId,
                results
            }
        });
        
    } catch (error) {
        console.error('Error in trip send endpoint:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Internal server error',
                code: 'INTERNAL_ERROR'
            }
        });
    }
});

/**
 * POST /api/trip/send-bulk
 * Send multiple trip notifications in batch
 * 
 * Body Parameters:
 * - trips: Array of trip objects (same structure as single send)
 */
router.post('/trip/send-bulk', async (req, res) => {
    try {
        const { trips } = req.body;
        
        if (!Array.isArray(trips) || trips.length === 0) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'trips must be a non-empty array',
                    code: 'INVALID_INPUT'
                }
            });
        }
        
        if (trips.length > 20) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Maximum 20 trip notifications allowed per batch',
                    code: 'BATCH_SIZE_EXCEEDED'
                }
            });
        }
        
        // Validate all trips
        const validation = validateBulkTripRequest(trips);
        if (!validation.isValid) {
            return res.status(400).json({
                success: false,
                error: {
                    message: 'Validation failed',
                    code: 'VALIDATION_FAILED',
                    details: validation.errors
                }
            });
        }
        
        console.log(`Bulk trip notification request received for ${trips.length} trips`);
        
        const results = [];
        
        // Process each trip
        for (const tripData of trips) {
            const tripResult = {
                tripId: tripData.tripId,
                destinationName: tripData.destinationName,
                notificationType: tripData.notificationType,
                email: null,
                sms: null
            };
            
            // Send email if provided
            if (tripData.email) {
                try {
                    const emailResult = await emailService.sendTripEmail(tripData);
                    tripResult.email = {
                        success: emailResult.success,
                        messageId: emailResult.messageId,
                        status: emailResult.status,
                        message: emailResult.message,
                        error: emailResult.success ? null : emailResult.error
                    };
                } catch (error) {
                    tripResult.email = {
                        success: false,
                        status: 'failed',
                        message: error.message,
                        error: error.message
                    };
                }
            }
            
            // Send SMS if provided
            if (tripData.phoneNumber) {
                try {
                    const smsResult = await smsService.sendTripSms(tripData);
                    tripResult.sms = {
                        success: smsResult.success,
                        status: smsResult.status,
                        message: smsResult.message,
                        phoneNumber: smsResult.phoneNumber,
                        error: smsResult.success ? null : smsResult.error
                    };
                } catch (error) {
                    tripResult.sms = {
                        success: false,
                        status: 'failed',
                        message: error.message,
                        error: error.message
                    };
                }
            }
            
            results.push(tripResult);
        }
        
        // Summarize results
        const summary = results.reduce((acc, result) => {
            if ((result.email === null || result.email.success) && 
                (result.sms === null || result.sms.success)) {
                acc.successful++;
            } else {
                acc.failed++;
            }
            return acc;
        }, { successful: 0, failed: 0 });
        
        res.status(200).json({
            success: true,
            data: {
                summary,
                results
            }
        });
        
    } catch (error) {
        console.error('Error in bulk trip send endpoint:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Internal server error',
                code: 'INTERNAL_ERROR'
            }
        });
    }
});

/**
 * POST /api/trip/validate
 * Validate trip notification request without sending
 */
router.post('/trip/validate', (req, res) => {
    try {
        const tripData = req.body;
        const validation = validateTripRequest(tripData);
        
        if (validation.isValid) {
            res.status(200).json({
                success: true,
                data: {
                    isValid: true,
                    message: 'Trip notification request is valid'
                }
            });
        } else {
            res.status(400).json({
                success: false,
                error: {
                    message: 'Validation failed',
                    code: 'VALIDATION_FAILED',
                    details: validation.errors
                }
            });
        }
    } catch (error) {
        console.error('Error in trip validation endpoint:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Internal server error',
                code: 'INTERNAL_ERROR'
            }
        });
    }
});

/**
 * GET /api/trip/templates
 * Get available trip notification templates
 */
router.get('/trip/templates', (req, res) => {
    try {
        const emailTemplates = require('./emailTemplates');
        const smsTemplates = require('./smsTemplates');
        
        // Get trip-specific templates
        const tripEmailTemplates = Object.keys(emailTemplates.templates)
            .filter(status => status.startsWith('trip_'))
            .map(status => ({
                status,
                languages: Object.keys(emailTemplates.templates[status])
            }));
            
        const tripSmsTemplates = Object.keys(smsTemplates.templates)
            .filter(status => status.startsWith('trip_'))
            .map(status => ({
                status,
                languages: Object.keys(smsTemplates.templates[status])
            }));
        
        res.status(200).json({
            success: true,
            data: {
                availableNotificationTypes: ['trip_remaining_time', 'trip_arrival_notice'],
                availableLanguages: emailTemplates.getAvailableLanguages(),
                emailTemplates: tripEmailTemplates,
                smsTemplates: tripSmsTemplates
            }
        });
    } catch (error) {
        console.error('Error in trip templates endpoint:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Internal server error',
                code: 'INTERNAL_ERROR'
            }
        });
    }
});

/**
 * GET /api/trip/template/:type/:language
 * Get specific trip template by notification type and language
 */
router.get('/trip/template/:type/:language', (req, res) => {
    try {
        const { type, language } = req.params;
        const emailTemplates = require('./emailTemplates');
        const smsTemplates = require('./smsTemplates');
        
        const emailTemplate = emailTemplates.getTemplate(type, language);
        const smsTemplate = smsTemplates.getTemplate(type, language);
        
        if (!emailTemplate && !smsTemplate) {
            return res.status(404).json({
                success: false,
                error: {
                    message: `Template not found for notification type '${type}' and language '${language}'`,
                    code: 'TEMPLATE_NOT_FOUND'
                }
            });
        }
        
        const response = {
            success: true,
            data: {
                notificationType: type,
                language,
                emailTemplate: emailTemplate ? {
                    subject: emailTemplate.subject,
                    body: emailTemplate.body,
                    hasHtml: !!emailTemplate.htmlBody
                } : null,
                smsTemplate: smsTemplate ? {
                    message: smsTemplate.message,
                    characterCount: smsTemplate.message.length,
                    parts: Math.ceil(smsTemplate.message.length / 153),
                    isMultiPart: smsTemplate.message.length > 153
                } : null
            }
        };
        
        res.status(200).json(response);
    } catch (error) {
        console.error('Error in trip template endpoint:', error);
        res.status(500).json({
            success: false,
            error: {
                message: 'Internal server error',
                code: 'INTERNAL_ERROR'
            }
        });
    }
});

// Error handling middleware for this router
router.use((error, req, res, next) => {
    console.error('Email router error:', error);
    
    if (!res.headersSent) {
        res.status(500).json({
            success: false,
            error: {
                message: 'Internal server error',
                code: 'INTERNAL_ERROR'
            }
        });
    }
});

module.exports = router;