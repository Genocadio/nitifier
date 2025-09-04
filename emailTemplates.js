/**
 * Email templates for different issue statuses in multiple languages
 */

const templates = {
    // Issue Received Templates
    received: {
        english: {
            subject: 'Issue {ticketId} Received - CES Support',
            body: `Hello {name},

We have successfully received your issue and created a support ticket for you.

Issue Details:
- Ticket ID: {ticketId}
- Issue Title: {issueTitle}
- Status: Received
- Date: {currentDate}

Our team will review your issue and get back to you as soon as possible. You can track the status of your issue using the ticket ID provided above.

Click here to view issue details: https://ces-frontend-zeta.vercel.app/followup?id={ticketId}

Thank you for contacting us.

Best regards,
CES Support Team`,
            htmlBody: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2c3e50;">Issue Received</h2>
                    <p>Hello <strong>{name}</strong>,</p>
                    
                    <p>We have successfully received your issue and created a support ticket for you.</p>
                    
                    <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
                        <h3 style="color: #495057; margin-top: 0;">Issue Details:</h3>
                        <ul style="list-style: none; padding: 0;">
                            <li><strong>Ticket ID:</strong> {ticketId}</li>
                            <li><strong>Issue Title:</strong> {issueTitle}</li>
                            <li><strong>Status:</strong> <span style="color: #28a745;">Received</span></li>
                            <li><strong>Date:</strong> {currentDate}</li>
                        </ul>
                    </div>
                    
                    <p>Our team will review your issue and get back to you as soon as possible. You can track the status of your issue using the ticket ID provided above.</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <a href="https://ces-frontend-zeta.vercel.app/followup?id={ticketId}" 
                           style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                            Click here to view issue details
                        </a>
                    </div>
                    
                    <p>Thank you for contacting us.</p>
                    
                    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6;">
                        <p style="color: #6c757d; margin: 0;">Best regards,<br>CES Support Team</p>
                    </div>
                </div>
            `
        },
        french: {
            subject: 'Problème {ticketId} Reçu - Support CES',
            body: `Bonjour {name},

Nous avons reçu avec succès votre problème et créé un ticket de support pour vous.

Détails du problème:
- ID du ticket: {ticketId}
- Titre du problème: {issueTitle}
- Statut: Reçu
- Date: {currentDate}

Notre équipe examinera votre problème et vous contactera dès que possible. Vous pouvez suivre le statut de votre problème en utilisant l'ID de ticket fourni ci-dessus.

Cliquez ici pour voir les détails du problème: https://ces-frontend-zeta.vercel.app/followup?id={ticketId}

Merci de nous avoir contactés.

Cordialement,
Équipe de Support CES`
        },
        kinyarwanda: {
            subject: 'Ikibazo {ticketId} Cyakiriwe - Ubufasha bwa CES',
            body: `Mwaramutse {name},

Twakize neza ikibazo cyawe maze tushyiraho tiketi y'ubufasha.

Ibisobanura by'ikibazo:
- ID ya tiketi: {ticketId}
- Umutwe w'ikibazo: {issueTitle}
- Imimerere: Cyakiriwe
- Itariki: {currentDate}

Ikipe yacu izasuzuma ikibazo cyawe maze ikagusubize vuba bishoboka. Urashobora gukurikirana imimerere y'ikibazo cyawe ukoresheje ID ya tiketi yatanzwe hejuru.

Kanda hano kugira ngo urebe ibisobanura by'ikibazo: https://ces-frontend-zeta.vercel.app/followup?id={ticketId}

Urakoze kutwandikira.

Icyubahiro,
Ikipe y'Ubufasha ya CES`
        }
    },

    // Issue Resolved Templates
    resolved: {
        english: {
            subject: 'Issue {ticketId} Resolved - CES Support',
            body: `Hello {name},

Great news! Your issue has been successfully resolved.

Issue Details:
- Ticket ID: {ticketId}
- Issue Title: {issueTitle}
- Status: Resolved
- Resolution Date: {currentDate}

{responseMessage}

Your issue is now closed. If you have any other questions or need further assistance, please don't hesitate to contact us.

Click here to view issue details: https://ces-frontend-zeta.vercel.app/followup?id={ticketId}

Thank you for using our services.

Best regards,
CES Support Team`
        },
        french: {
            subject: 'Problème {ticketId} Résolu - Support CES',
            body: `Bonjour {name},

Bonne nouvelle! Votre problème a été résolu avec succès.

Détails du problème:
- ID du ticket: {ticketId}
- Titre du problème: {issueTitle}
- Statut: Résolu
- Date de résolution: {currentDate}

{responseMessage}

Votre problème est maintenant fermé. Si vous avez d'autres questions ou besoin d'assistance supplémentaire, n'hésitez pas à nous contacter.

Cliquez ici pour voir les détails du problème: https://ces-frontend-zeta.vercel.app/followup?id={ticketId}

Merci d'utiliser nos services.

Cordialement,
Équipe de Support CES`
        },
        kinyarwanda: {
            subject: 'Ikibazo {ticketId} Cyakemuwe - Ubufasha bwa CES',
            body: `Mwaramutse {name},

Amakuru meza! Ikibazo cyawe cyakemuwe neza.

Ibisobanura by'ikibazo:
- ID ya tiketi: {ticketId}
- Umutwe w'ikibazo: {issueTitle}
- Imimerere: Cyakemuwe
- Itariki cyakemuweho: {currentDate}

{responseMessage}

Ikibazo cyawe gisozwa. Niba ufite ibindi bibazo cyangwa ukeneye ubundi bufasha, ntuzuhe kutwandikira.

Kanda hano kugira ngo urebe ibisobanura by'ikibazo: https://ces-frontend-zeta.vercel.app/followup?id={ticketId}

Urakoze gukoresha serivise zacu.

Icyubahiro,
Ikipe y'Ubufasha ya CES`
        }
    },

    // Issue Escalated Templates
    escalated: {
        english: {
            subject: 'Issue {ticketId} Escalated to {escalatedTo} - CES Support',
            body: `Hello {name},

Your issue has been escalated to a higher level for faster resolution.

Issue Details:
- Ticket ID: {ticketId}
- Issue Title: {issueTitle}
- Status: Escalated
- Escalated to: {escalatedTo}
- Escalation Date: {currentDate}

Your issue has been assigned to {escalatedTo} who specializes in handling complex cases like yours. You can expect a response soon.

We appreciate your patience as we work to resolve your issue.

Click here to view issue details: https://ces-frontend-zeta.vercel.app/followup?id={ticketId}

Best regards,
CES Support Team`
        },
        french: {
            subject: 'Problème {ticketId} Escaladé à {escalatedTo} - Support CES',
            body: `Bonjour {name},

Votre problème a été escaladé à un niveau supérieur pour une résolution plus rapide.

Détails du problème:
- ID du ticket: {ticketId}
- Titre du problème: {issueTitle}
- Statut: Escaladé
- Escaladé à: {escalatedTo}
- Date d'escalade: {currentDate}

Votre problème a été assigné à {escalatedTo} qui se spécialise dans la gestion de cas complexes comme le vôtre. Vous pouvez vous attendre à une réponse bientôt.

Nous apprécions votre patience pendant que nous travaillons à résoudre votre problème.

Cliquez ici pour voir les détails du problème: https://ces-frontend-zeta.vercel.app/followup?id={ticketId}

Cordialement,
Équipe de Support CES`
        },
        kinyarwanda: {
            subject: 'Ikibazo {ticketId} Cyoherejwe kuri {escalatedTo} - Ubufasha bwa CES',
            body: `Mwaramutse {name},

Ikibazo cyawe cyoherejwe ku rwego rwo hejuru kugira ngo kirangirwe vuba.

Ibisobanura by'ikibazo:
- ID ya tiketi: {ticketId}
- Umutwe w'ikibazo: {issueTitle}
- Imimerere: Cyoherejwe hejuru
- Cyoherejwe kuri: {escalatedTo}
- Itariki yoherejweho: {currentDate}

Ikibazo cyawe cyahawe {escalatedTo} uzobereye gukemura ibibazo bigoye nk'icyawe. Urategereje igisubizo vuba.

Turagushimira kwihangana mu gihe dukora kugira ngo dukemure ikibazo cyawe.

Kanda hano kugira ngo urebe ibisobanura by'ikibazo: https://ces-frontend-zeta.vercel.app/followup?id={ticketId}

Icyubahiro,
Ikipe y'Ubufasha ya CES`
        }
    },

    // Issue Assigned Templates
    assigned: {
        english: {
            subject: 'Issue {ticketId} Assigned to {assignedTo} - CES Support',
            body: `Hello {name},

Your issue has been assigned to a specialist for resolution.

Issue Details:
- Ticket ID: {ticketId}
- Issue Title: {issueTitle}
- Status: Assigned
- Assigned to: {assignedTo}
- Assignment Date: {currentDate}

{assignedTo} will be handling your case and will contact you soon with updates or solutions.

Thank you for your patience.

Click here to view issue details: https://ces-frontend-zeta.vercel.app/followup?id={ticketId}

Best regards,
CES Support Team`
        },
        french: {
            subject: 'Problème {ticketId} Assigné à {assignedTo} - Support CES',
            body: `Bonjour {name},

Votre problème a été assigné à un spécialiste pour résolution.

Détails du problème:
- ID du ticket: {ticketId}
- Titre du problème: {issueTitle}
- Statut: Assigné
- Assigné à: {assignedTo}
- Date d'assignation: {currentDate}

{assignedTo} s'occupera de votre cas et vous contactera bientôt avec des mises à jour ou des solutions.

Merci pour votre patience.

Cliquez ici pour voir les détails du problème: https://ces-frontend-zeta.vercel.app/followup?id={ticketId}

Cordialement,
Équipe de Support CES`
        },
        kinyarwanda: {
            subject: 'Ikibazo {ticketId} Cyahawe {assignedTo} - Ubufasha bwa CES',
            body: `Mwaramutse {name},

Ikibazo cyawe cyahawe inzobere kugira ngo ikemure.

Ibisobanura by'ikibazo:
- ID ya tiketi: {ticketId}
- Umutwe w'ikibazo: {issueTitle}
- Imimerere: Cyahawe
- Cyahawe: {assignedTo}
- Itariki cyahaweho: {currentDate}

{assignedTo} azakemura ikibazo cyawe kandi azakugera vuba n'amakuru cyangwa ibisubizo.

Urakoze kwihangana.

Kanda hano kugira ngo urebe ibisobanura by'ikibazo: https://ces-frontend-zeta.vercel.app/followup?id={ticketId}

Icyubahiro,
Ikipe y'Ubufasha ya CES`
        }
    },

    // Issue Closed Templates
    closed: {
        english: {
            subject: 'Issue {ticketId} Closed - CES Support',
            body: `Hello {name},

Your issue has been closed.

Issue Details:
- Ticket ID: {ticketId}
- Issue Title: {issueTitle}
- Status: Closed
- Closure Date: {currentDate}

If you believe this issue was closed in error or if you have additional questions, please contact us with your ticket ID.

Click here to view issue details: https://ces-frontend-zeta.vercel.app/followup?id={ticketId}

Thank you for using our services.

Best regards,
CES Support Team`
        },
        french: {
            subject: 'Problème {ticketId} Fermé - Support CES',
            body: `Bonjour {name},

Votre problème a été fermé.

Détails du problème:
- ID du ticket: {ticketId}
- Titre du problème: {issueTitle}
- Statut: Fermé
- Date de fermeture: {currentDate}

Si vous pensez que ce problème a été fermé par erreur ou si vous avez des questions supplémentaires, veuillez nous contacter avec votre ID de ticket.

Cliquez ici pour voir les détails du problème: https://ces-frontend-zeta.vercel.app/followup?id={ticketId}

Merci d'utiliser nos services.

Cordialement,
Équipe de Support CES`
        },
        kinyarwanda: {
            subject: 'Ikibazo {ticketId} Cyafunguwe - Ubufasha bwa CES',
            body: `Mwaramutse {name},

Ikibazo cyawe cyafunguwe.

Ibisobanura by'ikibazo:
- ID ya tiketi: {ticketId}
- Umutwe w'ikibazo: {issueTitle}
- Imimerere: Cyafunguwe
- Itariki yafunguwemo: {currentDate}

Niba wibaza ko iki kibazo cyafunguwe mu makosa cyangwa ufite ibindi bibazo, nyamuneka tubabarire ufite ID ya tiketi yawe.

Kanda hano kugira ngo urebe ibisobanura by'ikibazo: https://ces-frontend-zeta.vercel.app/followup?id={ticketId}

Urakoze gukoresha serivise zacu.

Icyubahiro,
Ikipe y'Ubufasha ya CES`
        }
    },

    // Issue In Progress Templates
    in_progress: {
        english: {
            subject: 'Issue {ticketId} In Progress - CES Support',
            body: `Hello {name},

Your issue is currently being processed by our team.

Issue Details:
- Ticket ID: {ticketId}
- Issue Title: {issueTitle}
- Status: In Progress
- Update Date: {currentDate}

Our team is actively working on resolving your issue. We will keep you updated on the progress.

Click here to view issue details: https://ces-frontend-zeta.vercel.app/followup?id={ticketId}

Thank you for your patience.

Best regards,
CES Support Team`
        },
        french: {
            subject: 'Problème {ticketId} En Cours - Support CES',
            body: `Bonjour {name},

Votre problème est actuellement en cours de traitement par notre équipe.

Détails du problème:
- ID du ticket: {ticketId}
- Titre du problème: {issueTitle}
- Statut: En cours
- Date de mise à jour: {currentDate}

Notre équipe travaille activement à résoudre votre problème. Nous vous tiendrons informé des progrès.

Cliquez ici pour voir les détails du problème: https://ces-frontend-zeta.vercel.app/followup?id={ticketId}

Merci pour votre patience.

Cordialement,
Équipe de Support CES`
        },
        kinyarwanda: {
            subject: 'Ikibazo {ticketId} Kirakoresha - Ubufasha bwa CES',
            body: `Mwaramutse {name},

Ikibazo cyawe gisigaye gikoresha n'ikipe yacu.

Ibisobanura by'ikibazo:
- ID ya tiketi: {ticketId}
- Umutwe w'ikibazo: {issueTitle}
- Imimerere: Kirakoresha
- Itariki yahinduwe: {currentDate}

Ikipe yacu ikora cyane kugira ngo ikemure ikibazo cyawe. Tuzagufasha amakuru ku myiyoborere.

Kanda hano kugira ngo urebe ibisobanura by'ikibazo: https://ces-frontend-zeta.vercel.app/followup?id={ticketId}

Urakoze kwihangana.

Icyubahiro,
Ikipe y'Ubufasha ya CES`
        }
    }
};

/**
 * Get email template by status and language
 * @param {string} status - Issue status
 * @param {string} language - Language preference
 * @returns {Object|null} Email template or null if not found
 */
function getTemplate(status, language) {
    const normalizedStatus = status?.toLowerCase().replace(/[-_\s]/g, '_');
    const normalizedLanguage = language?.toLowerCase();
    
    if (templates[normalizedStatus] && templates[normalizedStatus][normalizedLanguage]) {
        return templates[normalizedStatus][normalizedLanguage];
    }
    
    // Fallback to English if language not found
    if (templates[normalizedStatus] && templates[normalizedStatus]['english']) {
        console.warn(`Template for language '${language}' not found, falling back to English`);
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

module.exports = {
    getTemplate,
    getAvailableStatuses,
    getAvailableLanguages,
    hasTemplate,
    templates
};