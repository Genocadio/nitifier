const sgMail = require('@sendgrid/mail');
const emailTemplates = require('./emailTemplates');
const { validateEmailRequest } = require('./validators');

class EmailService {
    constructor() {
        sgMail.setApiKey(process.env.SENDGRID_API_KEY);
        this.fromEmail = process.env.FROM_EMAIL;
    }

    /**
     * Send email based on issue status with appropriate template
     * @param {Object} emailData - Email data containing recipient info and issue details
     * @param {string} emailData.email - Recipient email address
     * @param {string} emailData.ticketId - Ticket ID
     * @param {string} emailData.name - Recipient name
     * @param {string} emailData.language - Language (english, french, kinyarwanda)
     * @param {string} emailData.subject - Issue status (received, resolved, escalated, assigned, closed, in_progress)
     * @param {string} [emailData.assignedTo] - Name of person assigned to (for assignment/escalation)
     * @param {string} [emailData.escalatedTo] - Name of person escalated to
     * @param {string} [emailData.issueTitle] - Title of the issue
     * @param {string} [emailData.responseMessage] - Response message for responses
     * @returns {Promise<Object>} Email sending result
     */
    async sendIssueEmail(emailData) {
        try {
            // Validate input
            const validation = validateEmailRequest(emailData);
            if (!validation.isValid) {
                throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
            }

            const { email, ticketId, name, language, subject, assignedTo, escalatedTo, issueTitle, responseMessage } = emailData;

            // Normalize language
            const normalizedLanguage = this.normalizeLanguage(language);
            
            // Get template based on subject (status)
            const template = emailTemplates.getTemplate(subject, normalizedLanguage);
            if (!template) {
                throw new Error(`Template not found for status: ${subject} and language: ${normalizedLanguage}`);
            }

            // Build email subject
            const emailSubject = this.buildEmailSubject(subject, ticketId, template, assignedTo, escalatedTo);
            
            // Build email body
            const emailBody = this.buildEmailBody(template, {
                name,
                ticketId,
                issueTitle,
                assignedTo,
                escalatedTo,
                responseMessage
            });

            // Prepare email message
            const msg = {
                to: email,
                from: {
                    email: this.fromEmail,
                    name: 'CES Team'
                },
                subject: emailSubject,
                text: emailBody.text,
                html: emailBody.html
            };

            // Send email
            const result = await sgMail.send(msg);
            
            console.log(`Email sent successfully to ${email} for ticket ${ticketId} with status ${subject}`);
            
            return {
                success: true,
                messageId: result[0].headers['x-message-id'],
                status: 'sent',
                message: 'Email sent successfully'
            };

        } catch (error) {
            console.error('Failed to send email:', error);
            
            return {
                success: false,
                status: 'failed',
                message: error.message,
                error: error.response?.body || error.message
            };
        }
    }

    /**
     * Send bulk emails for multiple recipients
     * @param {Array} emailList - Array of email data objects
     * @returns {Promise<Array>} Array of email sending results
     */
    async sendBulkEmails(emailList) {
        const results = [];
        
        for (const emailData of emailList) {
            const result = await this.sendIssueEmail(emailData);
            results.push({
                email: emailData.email,
                ticketId: emailData.ticketId,
                result
            });
        }
        
        return results;
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
     * Build email subject based on status and template
     * @param {string} status - Issue status
     * @param {string} ticketId - Ticket ID
     * @param {Object} template - Email template
     * @param {string} assignedTo - Assigned to person (optional)
     * @param {string} escalatedTo - Escalated to person (optional)
     * @returns {string} Formatted email subject
     */
    buildEmailSubject(status, ticketId, template, assignedTo, escalatedTo) {
        let subject = template.subject.replace('{ticketId}', ticketId);
        
        if (assignedTo && (status === 'assigned' || status === 'escalated')) {
            subject = subject.replace('{assignedTo}', assignedTo);
        }
        
        if (escalatedTo && status === 'escalated') {
            subject = subject.replace('{escalatedTo}', escalatedTo);
        }
        
        return subject;
    }

    /**
     * Build email body from template with dynamic data
     * @param {Object} template - Email template
     * @param {Object} data - Dynamic data for template
     * @returns {Object} Email body with text and HTML versions
     */
    buildEmailBody(template, data) {
        let textBody = template.body;
        let htmlBody = template.htmlBody || this.convertTextToHtml(template.body);
        
        // Replace placeholders with actual data
        const replacements = {
            '{name}': data.name || 'Valued Customer',
            '{ticketId}': data.ticketId || 'N/A',
            '{issueTitle}': data.issueTitle || 'Your Issue',
            '{assignedTo}': data.assignedTo || '',
            '{escalatedTo}': data.escalatedTo || '',
            '{responseMessage}': data.responseMessage || '',
            '{currentDate}': new Date().toLocaleString()
        };
        
        for (const [placeholder, value] of Object.entries(replacements)) {
            textBody = textBody.replace(new RegExp(placeholder, 'g'), value);
            htmlBody = htmlBody.replace(new RegExp(placeholder, 'g'), value);
        }
        
        return {
            text: textBody,
            html: htmlBody
        };
    }

    /**
     * Convert plain text to basic HTML format
     * @param {string} text - Plain text
     * @returns {string} HTML formatted text
     */
    convertTextToHtml(text) {
        return text
            .replace(/\n\n/g, '</p><p>')
            .replace(/\n/g, '<br>')
            .replace(/^/, '<p>')
            .replace(/$/, '</p>')
            .replace(/<p><\/p>/g, '');
    }

    /**
     * Test email configuration
     * @returns {Promise<Object>} Test result
     */
    async testConfiguration() {
        try {
            const testMsg = {
                to: process.env.TEST_EMAIL || 'test@example.com',
                from: this.fromEmail,
                subject: 'CES Email Service Test',
                text: 'This is a test email to verify the email service configuration.',
                html: '<p>This is a test email to verify the email service configuration.</p>'
            };

            await sgMail.send(testMsg);
            
            return {
                success: true,
                message: 'Email service configuration is working correctly'
            };
        } catch (error) {
            return {
                success: false,
                message: 'Email service configuration failed',
                error: error.message
            };
        }
    }
}

module.exports = EmailService;