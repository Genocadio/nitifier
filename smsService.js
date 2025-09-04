const axios = require('axios');
const smsTemplates = require('./smsTemplates');
const { validateSmsRequest } = require('./validators');

class SmsService {
    constructor() {
        this.apiUrl = 'https://api.mista.io/sms';
        this.apiToken = process.env.SMS_API_TOKEN;
        this.senderId = process.env.SMS_SENDER_ID || 'E-Notifier';
    }

    /**
     * Send SMS based on issue status with appropriate template
     * @param {Object} smsData - SMS data containing recipient info and issue details
     * @param {string} smsData.phoneNumber - Recipient phone number (without + or 00)
     * @param {string} smsData.ticketId - Ticket ID
     * @param {string} smsData.name - Recipient name
     * @param {string} smsData.language - Language (english, french, kinyarwanda)
     * @param {string} smsData.subject - Issue status (received, resolved, escalated, assigned, closed, in_progress)
     * @param {string} [smsData.assignedTo] - Name of person assigned to (for assignment/escalation)
     * @param {string} [smsData.escalatedTo] - Name of person escalated to
     * @param {string} [smsData.issueTitle] - Title of the issue
     * @param {string} [smsData.responseMessage] - Response message for responses
     * @returns {Promise<Object>} SMS sending result
     */
    async sendIssueSms(smsData) {
        try {
            // Validate input
            const validation = validateSmsRequest(smsData);
            if (!validation.isValid) {
                throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
            }

            const { phoneNumber, ticketId, name, language, subject, assignedTo, escalatedTo, issueTitle, responseMessage } = smsData;

            // Normalize language
            const normalizedLanguage = this.normalizeLanguage(language);
            
            // Get template based on subject (status)
            const template = smsTemplates.getTemplate(subject, normalizedLanguage);
            if (!template) {
                throw new Error(`Template not found for status: ${subject} and language: ${normalizedLanguage}`);
            }

            // Build SMS message
            const message = this.buildSmsMessage(template, {
                name,
                ticketId,
                issueTitle,
                assignedTo,
                escalatedTo,
                responseMessage
            });

            // Determine message type (0 for plain text, 1 for Unicode)
            const messageType = this.determineMessageType(message, normalizedLanguage);

            // Send SMS
            const result = await this.sendSms(phoneNumber, message, messageType);
            
            console.log(`SMS sent successfully to ${phoneNumber} for ticket ${ticketId} with status ${subject}`);
            
            return {
                success: true,
                status: 'sent',
                message: 'SMS sent successfully',
                phoneNumber,
                ticketId
            };

        } catch (error) {
            console.error('Failed to send SMS:', error);
            
            return {
                success: false,
                status: 'failed',
                message: error.message,
                error: error.message
            };
        }
    }

    /**
     * Send bulk SMS for multiple recipients
     * @param {Array} smsList - Array of SMS data objects
     * @returns {Promise<Array>} Array of SMS sending results
     */
    async sendBulkSms(smsList) {
        const results = [];
        
        // Group SMS by message content to send bulk messages
        const messageGroups = {};
        
        for (const smsData of smsList) {
            const { phoneNumber, ticketId, name, language, subject, assignedTo, escalatedTo, issueTitle, responseMessage } = smsData;
            
            // Normalize language
            const normalizedLanguage = this.normalizeLanguage(language);
            
            // Get template based on subject (status)
            const template = smsTemplates.getTemplate(subject, normalizedLanguage);
            if (!template) {
                results.push({
                    phoneNumber,
                    ticketId,
                    result: {
                        success: false,
                        message: `Template not found for status: ${subject} and language: ${normalizedLanguage}`
                    }
                });
                continue;
            }

            // Build SMS message
            const message = this.buildSmsMessage(template, {
                name,
                ticketId,
                issueTitle,
                assignedTo,
                escalatedTo,
                responseMessage
            });

            // Determine message type
            const messageType = this.determineMessageType(message, normalizedLanguage);
            
            // Create a key for grouping messages with same content
            const messageKey = `${message}_${messageType}`;
            
            if (!messageGroups[messageKey]) {
                messageGroups[messageKey] = {
                    message,
                    type: messageType,
                    recipients: []
                };
            }
            
            messageGroups[messageKey].recipients.push({ phoneNumber, ticketId, name });
        }
        
        // Send each group of messages
        for (const [messageKey, group] of Object.entries(messageGroups)) {
            try {
                const phoneNumbers = group.recipients.map(r => r.phoneNumber).join(', ');
                const result = await this.sendSms(phoneNumbers, group.message, group.type);
                
                // Add results for all recipients in this group
                group.recipients.forEach(recipient => {
                    results.push({
                        phoneNumber: recipient.phoneNumber,
                        ticketId: recipient.ticketId,
                        result: {
                            success: true,
                            status: 'sent',
                            message: 'SMS sent successfully'
                        }
                    });
                });
            } catch (error) {
                // Add error results for all recipients in this group
                group.recipients.forEach(recipient => {
                    results.push({
                        phoneNumber: recipient.phoneNumber,
                        ticketId: recipient.ticketId,
                        result: {
                            success: false,
                            status: 'failed',
                            message: error.message
                        }
                    });
                });
            }
        }
        
        return results;
    }

    /**
     * Send SMS using Mista.io API
     * @param {string} phoneNumber - Recipient phone number
     * @param {string} message - SMS message
     * @param {string} type - Message type (plain or unicode)
     * @returns {Promise<Object>} API response
     */
    async sendSms(phoneNumber, message, type = 'plain') {
        try {
            const data = {
                recipient: phoneNumber,
                sender_id: this.senderId,
                type: type,
                message: message
            };

            const config = {
                method: 'post',
                url: this.apiUrl,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiToken}`
                },
                data: data
            };

            const response = await axios.request(config);
            
            return {
                success: true,
                response: response.data
            };
        } catch (error) {
            if (error.response) {
                // API responded with error status
                throw new Error(`SMS API Error: ${error.response.data.message || error.response.statusText} (${error.response.status})`);
            } else if (error.request) {
                // Request was made but no response received
                throw new Error('SMS API request failed: No response received');
            } else {
                // Something else happened
                throw new Error(`SMS API request failed: ${error.message}`);
            }
        }
    }

    /**
     * Normalize language input to supported languages
     * @param {string} language - Input language
     * @returns {string} Normalized language
     */
    normalizeLanguage(language) {
        const lang = language?.toLowerCase().trim();
        
        switch (lang) {
            case 'french':
            case 'fr':
            case 'français':
                return 'french';
            case 'kinyarwanda':
            case 'rw':
            case 'kin':
                return 'kinyarwanda';
            case 'english':
            case 'en':
            default:
                return 'english';
        }
    }

    /**
     * Build SMS message from template with dynamic data
     * @param {Object} template - SMS template
     * @param {Object} data - Dynamic data for template
     * @returns {string} Formatted SMS message
     */
    buildSmsMessage(template, data) {
        let message = template.message;
        
        // Replace placeholders with actual data
        const replacements = {
            '{name}': data.name || 'Customer',
            '{ticketId}': data.ticketId || 'N/A',
            '{issueTitle}': data.issueTitle || 'Your Issue',
            '{assignedTo}': data.assignedTo || '',
            '{escalatedTo}': data.escalatedTo || '',
            '{responseMessage}': data.responseMessage || '',
            '{currentDate}': new Date().toLocaleDateString()
        };
        
        for (const [placeholder, value] of Object.entries(replacements)) {
            message = message.replace(new RegExp(placeholder, 'g'), value);
        }
        
        return message;
    }

    /**
     * Determine message type based on content and language
     * @param {string} message - SMS message content
     * @param {string} language - Language
     * @returns {string} Message type (plain or unicode)
     */
    determineMessageType(message, language) {
        // Check if message contains non-ASCII characters
        const hasUnicode = /[^\x00-\x7F]/.test(message);
        
        // Kinyarwanda and some French characters might need Unicode
        if (language === 'kinyarwanda' || hasUnicode) {
            return 'unicode';
        }
        
        return 'plain';
    }

    /**
     * Test SMS configuration
     * @returns {Promise<Object>} Test result
     */
    async testConfiguration() {
        try {
            const testMessage = 'CES SMS Service Test - Configuration working correctly';
            const testPhone = process.env.TEST_PHONE || '250788606765';
            
            const result = await this.sendSms(testPhone, testMessage, 'plain');
            
            return {
                success: true,
                message: 'SMS service configuration is working correctly'
            };
        } catch (error) {
            return {
                success: false,
                message: 'SMS service configuration failed',
                error: error.message
            };
        }
    }

    /**
     * Get SMS character count and parts
     * @param {string} message - SMS message
     * @param {string} type - Message type (plain or unicode)
     * @returns {Object} Character count and parts info
     */
    getMessageInfo(message, type = 'plain') {
        const maxCharsPerPart = type === 'unicode' ? 67 : 153;
        const totalChars = message.length;
        const parts = Math.ceil(totalChars / maxCharsPerPart);
        
        return {
            totalChars,
            maxCharsPerPart,
            parts,
            isMultiPart: parts > 1,
            remainingChars: maxCharsPerPart - (totalChars % maxCharsPerPart)
        };
    }
}

module.exports = SmsService;
