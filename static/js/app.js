
/**
 * TermSender Pro - JavaScript Application
 * Modern email campaign management interface
 */

class TermSenderApp {
    constructor() {
        this.currentSection = 'dashboard';
        this.smtpConfig = null;
        this.emailContent = null;
        this.recipients = [];
        this.attachments = [];
        this.isReady = false;
        this.isLoading = false;
        
        this.init();
    }

    init() {
        console.log('Initializing TermSender Pro...');
        
        // Make sure loading is hidden initially
        this.hideLoading();
        
        this.setupEventListeners();
        
        // Only show compliance modal if not already accepted
        const complianceAccepted = sessionStorage.getItem('complianceAccepted');
        if (!complianceAccepted) {
            // Small delay to ensure DOM is ready
            setTimeout(() => {
                this.showComplianceModal();
            }, 100);
        }
        
        this.updateDashboard();
        console.log('TermSender Pro initialized successfully');
    }

    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const section = e.currentTarget.dataset.section;
                this.navigateToSection(section);
            });
        });

        // Dashboard cards navigation
        document.querySelectorAll('.dashboard-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const cardIcon = e.currentTarget.querySelector('.card-icon');
                let section = 'dashboard';
                
                if (cardIcon.classList.contains('smtp-icon')) section = 'smtp';
                else if (cardIcon.classList.contains('recipients-icon')) section = 'recipients';
                else if (cardIcon.classList.contains('compose-icon')) section = 'compose';
                else if (cardIcon.classList.contains('send-icon')) section = 'send';
                
                this.navigateToSection(section);
            });
        });

        // SMTP Form
        this.setupSMTPEventListeners();
        
        // Recipients
        this.setupRecipientsEventListeners();
        
        // Compose
        this.setupComposeEventListeners();
        
        // Attachments
        this.setupAttachmentsEventListeners();
        
        // Send
        this.setupSendEventListeners();
        
        // Compliance Modal
        this.setupComplianceEventListeners();
    }

    setupSMTPEventListeners() {
        const smtpForm = document.getElementById('smtpForm');
        const testBtn = document.getElementById('testSmtpBtn');

        if (smtpForm) {
            smtpForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveSMTPConfig();
            });
        }

        if (testBtn) {
            testBtn.addEventListener('click', () => {
                this.testSMTPConnection();
            });
        }

        // Auto-fill sender email when username changes
        const smtpUsername = document.getElementById('smtpUsername');
        const senderEmail = document.getElementById('senderEmail');
        
        if (smtpUsername && senderEmail) {
            smtpUsername.addEventListener('input', (e) => {
                if (!senderEmail.value) {
                    senderEmail.value = e.target.value;
                }
            });
        }
    }

    setupRecipientsEventListeners() {
        // CSV Upload
        const csvDropZone = document.getElementById('csvDropZone');
        const csvFileInput = document.getElementById('csvFileInput');
        const csvBrowseBtn = document.getElementById('csvBrowseBtn');

        if (csvDropZone && csvFileInput && csvBrowseBtn) {
            // File drag and drop
            csvDropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                csvDropZone.classList.add('dragover');
            });

            csvDropZone.addEventListener('dragleave', () => {
                csvDropZone.classList.remove('dragover');
            });

            csvDropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                csvDropZone.classList.remove('dragover');
                const files = e.dataTransfer.files;
                if (files.length > 0) {
                    this.handleCSVUpload(files[0]);
                }
            });

            csvBrowseBtn.addEventListener('click', () => csvFileInput.click());
            csvFileInput.addEventListener('change', (e) => {
                if (e.target.files.length > 0) {
                    this.handleCSVUpload(e.target.files[0]);
                }
            });
        }

        // Manual entry
        const addManualBtn = document.getElementById('addManualBtn');
        if (addManualBtn) {
            addManualBtn.addEventListener('click', () => {
                this.addManualEmails();
            });
        }

        // Recipients actions
        const validateEmailsBtn = document.getElementById('validateEmailsBtn');
        const clearRecipientsBtn = document.getElementById('clearRecipientsBtn');
        
        if (validateEmailsBtn) {
            validateEmailsBtn.addEventListener('click', () => {
                this.validateAllEmails();
            });
        }

        if (clearRecipientsBtn) {
            clearRecipientsBtn.addEventListener('click', () => {
                this.clearAllRecipients();
            });
        }
    }

    setupComposeEventListeners() {
        const composeForm = document.getElementById('composeForm');
        const formatTabs = document.querySelectorAll('.format-tab');
        const emailSubject = document.getElementById('emailSubject');
        const emailBody = document.getElementById('emailBody');
        const emailBodyPlain = document.getElementById('emailBodyPlain');

        if (composeForm) {
            composeForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveEmailContent();
            });
        }

        // Format tabs
        formatTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchEmailFormat(e.target.dataset.format);
            });
        });

        // Live preview
        if (emailSubject) {
            emailSubject.addEventListener('input', () => this.updatePreview());
        }
        if (emailBody) {
            emailBody.addEventListener('input', () => this.updatePreview());
        }
        if (emailBodyPlain) {
            emailBodyPlain.addEventListener('input', () => this.updatePreview());
        }

        // Rich text editor toolbar
        document.querySelectorAll('.toolbar-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.preventDefault();
                this.executeEditorCommand(e.target.dataset.action);
            });
        });
    }

    setupAttachmentsEventListeners() {
        const attachmentDropZone = document.getElementById('attachmentDropZone');
        const attachmentFileInput = document.getElementById('attachmentFileInput');
        const attachmentBrowseBtn = document.getElementById('attachmentBrowseBtn');

        if (attachmentDropZone && attachmentFileInput && attachmentBrowseBtn) {
            // File drag and drop
            attachmentDropZone.addEventListener('dragover', (e) => {
                e.preventDefault();
                attachmentDropZone.classList.add('dragover');
            });

            attachmentDropZone.addEventListener('dragleave', () => {
                attachmentDropZone.classList.remove('dragover');
            });

            attachmentDropZone.addEventListener('drop', (e) => {
                e.preventDefault();
                attachmentDropZone.classList.remove('dragover');
                const files = e.dataTransfer.files;
                for (let file of files) {
                    this.handleAttachmentUpload(file);
                }
            });

            attachmentBrowseBtn.addEventListener('click', () => attachmentFileInput.click());
            attachmentFileInput.addEventListener('change', (e) => {
                for (let file of e.target.files) {
                    this.handleAttachmentUpload(file);
                }
            });
        }
    }

    setupSendEventListeners() {
        const launchBtn = document.getElementById('launchBtn');
        if (launchBtn) {
            launchBtn.addEventListener('click', () => {
                this.launchCampaign();
            });
        }
    }

    setupComplianceEventListeners() {
        const acceptBtn = document.getElementById('acceptCompliance');
        const declineBtn = document.getElementById('declineCompliance');
        
        if (acceptBtn) {
            acceptBtn.addEventListener('click', () => {
                this.acceptCompliance();
            });
        }

        if (declineBtn) {
            declineBtn.addEventListener('click', () => {
                this.declineCompliance();
            });
        }
    }

    // Navigation
    navigateToSection(section) {
        console.log(`Navigating to section: ${section}`);
        
        // Update nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.section === section) {
                item.classList.add('active');
            }
        });

        // Update content sections
        document.querySelectorAll('.content-section').forEach(section_el => {
            section_el.classList.remove('active');
        });

        const targetSection = document.getElementById(section);
        if (targetSection) {
            targetSection.classList.add('active');
        }
        
        this.currentSection = section;

        // Update send section summary when navigating to it
        if (section === 'send') {
            this.updateSendSummary();
        }
    }

    // SMTP Configuration
    async testSMTPConnection() {
        const formData = this.getSMTPFormData();
        if (!formData) return;

        this.showLoading();
        
        try {
            const response = await fetch('/api/test-smtp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            if (result.success) {
                this.showNotification('SMTP connection successful!', 'success');
            } else {
                this.showNotification(result.message || 'Unknown error occurred', 'error');
            }
        } catch (error) {
            console.error('SMTP test error:', error);
            this.showNotification(`Failed to test SMTP connection: ${error.message}`, 'error');
        } finally {
            this.hideLoading();
        }
    }

    async saveSMTPConfig() {
        const formData = this.getSMTPFormData();
        if (!formData) return;

        this.showLoading();
        
        try {
            const response = await fetch('/api/test-smtp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const result = await response.json();
            
            if (result.success) {
                this.smtpConfig = formData;
                this.showNotification('SMTP configuration saved successfully!', 'success');
                this.updateDashboard();
                this.addActivity('SMTP configuration saved and tested');
            } else {
                this.showNotification(result.message, 'error');
            }
        } catch (error) {
            console.error('SMTP save error:', error);
            this.showNotification('Failed to save SMTP configuration', 'error');
        } finally {
            this.hideLoading();
        }
    }

    getSMTPFormData() {
        const host = document.getElementById('smtpHost')?.value?.trim();
        const port = parseInt(document.getElementById('smtpPort')?.value);
        const username = document.getElementById('smtpUsername')?.value?.trim();
        const password = document.getElementById('smtpPassword')?.value;
        const senderEmail = document.getElementById('senderEmail')?.value?.trim();
        const useTls = document.getElementById('useTls')?.checked;

        if (!host || !port || !username || !password || !senderEmail) {
            this.showNotification('Please fill in all SMTP fields', 'error');
            return null;
        }

        return { host, port, username, password, sender_email: senderEmail, use_tls: useTls };
    }

    // Recipients Management
    async handleCSVUpload(file) {
        if (!file.name.endsWith('.csv')) {
            this.showNotification('Please upload a CSV file', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        this.showLoading();

        // Add timeout protection
        const controller = new AbortController();
        const timeoutId = setTimeout(() => {
            controller.abort();
            this.hideLoading();
            this.showNotification('Request timed out. Please try again.', 'error');
        }, 30000); // 30 second timeout

        try {
            const response = await fetch('/api/upload-csv', {
                method: 'POST',
                body: formData,
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();

            if (result.success) {
                this.recipients = [...this.recipients, ...result.emails];
                this.updateRecipientsTable();
                this.updateDashboard();
                this.showNotification(result.message, 'success');
                this.addActivity(`Imported ${result.total_valid} recipients from CSV`);
            } else {
                this.showNotification(result.message || 'Upload failed', 'error');
            }
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                console.log('Request was aborted');
                return; // Don't show error message as we already showed timeout message
            }
            console.error('CSV upload error:', error);
            this.showNotification(`Failed to upload CSV file: ${error.message}`, 'error');
        } finally {
            this.hideLoading();
        }
    }

    async addManualEmails() {
        const manualEmails = document.getElementById('manualEmails')?.value?.trim();
        if (!manualEmails) {
            this.showNotification('Please enter email addresses', 'error');
            return;
        }

        // Split by comma or newline
        const emails = manualEmails.split(/[,\n]/).map(email => email.trim()).filter(email => email);

        this.showLoading();

        try {
            const response = await fetch('/api/validate-emails', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emails })
            });

            const result = await response.json();

            if (result.success) {
                // Add valid emails to recipients
                for (const emailObj of result.valid_emails) {
                    if (!this.recipients.find(r => r.email === emailObj.email)) {
                        this.recipients.push(emailObj);
                    }
                }

                this.updateRecipientsTable();
                this.updateDashboard();
                document.getElementById('manualEmails').value = '';
                this.showNotification(`Added ${result.total_valid} valid emails`, 'success');
                this.addActivity(`Added ${result.total_valid} recipients manually`);

                if (result.total_invalid > 0) {
                    this.showNotification(`Skipped ${result.total_invalid} invalid emails`, 'warning');
                }
            } else {
                this.showNotification(result.message, 'error');
            }
        } catch (error) {
            console.error('Email validation error:', error);
            this.showNotification('Failed to validate emails', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async validateAllEmails() {
        if (this.recipients.length === 0) {
            this.showNotification('No recipients to validate', 'warning');
            return;
        }

        const emails = this.recipients.map(r => r.email);
        this.showLoading();

        try {
            const response = await fetch('/api/validate-emails', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ emails })
            });

            const result = await response.json();

            if (result.success) {
                // Update recipients with validation status
                this.recipients = result.valid_emails;
                this.updateRecipientsTable();
                this.updateDashboard();
                this.showNotification(`Validated ${result.total_valid} emails`, 'success');

                if (result.total_invalid > 0) {
                    this.showNotification(`Removed ${result.total_invalid} invalid emails`, 'warning');
                }
            } else {
                this.showNotification(result.message, 'error');
            }
        } catch (error) {
            console.error('Validation error:', error);
            this.showNotification('Failed to validate emails', 'error');
        } finally {
            this.hideLoading();
        }
    }

    clearAllRecipients() {
        if (this.recipients.length === 0) {
            this.showNotification('No recipients to clear', 'warning');
            return;
        }

        if (confirm('Are you sure you want to clear all recipients?')) {
            this.recipients = [];
            this.updateRecipientsTable();
            this.updateDashboard();
            this.showNotification('All recipients cleared', 'success');
            this.addActivity('All recipients cleared');
        }
    }

    updateRecipientsTable() {
        const tbody = document.querySelector('#recipientsTable tbody');
        if (!tbody) return;
        
        if (this.recipients.length === 0) {
            tbody.innerHTML = `
                <tr class="empty-state">
                    <td colspan="4">
                        <div class="empty-content">
                            <i class="fas fa-user-plus"></i>
                            <p>No recipients added yet</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = this.recipients.map((recipient, index) => `
            <tr>
                <td>${recipient.email}</td>
                <td>
                    <span class="status-${recipient.status || 'valid'}">
                        <i class="fas fa-circle"></i>
                        ${recipient.status || 'valid'}
                    </span>
                </td>
                <td>
                    ${Object.keys(recipient).filter(k => k !== 'email' && k !== 'status').map(k => 
                        `${k}: ${recipient[k]}`
                    ).join(', ') || '-'}
                </td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="app.removeRecipient(${index})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    }

    removeRecipient(index) {
        this.recipients.splice(index, 1);
        this.updateRecipientsTable();
        this.updateDashboard();
        this.showNotification('Recipient removed', 'success');
    }

    // Email Composition
    switchEmailFormat(format) {
        const formatTabs = document.querySelectorAll('.format-tab');
        const htmlEditor = document.getElementById('emailBody');
        const plainEditor = document.getElementById('emailBodyPlain');
        const toolbar = document.getElementById('editorToolbar');

        if (!htmlEditor || !plainEditor || !toolbar) return;

        formatTabs.forEach(tab => {
            tab.classList.remove('active');
            if (tab.dataset.format === format) {
                tab.classList.add('active');
            }
        });

        if (format === 'html') {
            htmlEditor.style.display = 'block';
            plainEditor.style.display = 'none';
            toolbar.style.display = 'flex';
        } else {
            htmlEditor.style.display = 'none';
            plainEditor.style.display = 'block';
            toolbar.style.display = 'none';
        }

        this.updatePreview();
    }

    executeEditorCommand(action) {
        if (action === 'createLink') {
            const url = prompt('Enter URL:');
            if (url) {
                document.execCommand(action, false, url);
            }
        } else {
            document.execCommand(action, false, null);
        }
        
        this.updatePreview();
    }

    updatePreview() {
        const subject = document.getElementById('emailSubject')?.value || '';
        const activeTab = document.querySelector('.format-tab.active');
        const isHtml = activeTab ? activeTab.dataset.format === 'html' : false;
        
        const body = isHtml ? 
            document.getElementById('emailBody')?.innerHTML || '' : 
            document.getElementById('emailBodyPlain')?.value || '';

        const previewSubject = document.getElementById('previewSubject');
        const previewBody = document.getElementById('previewBody');
        
        if (previewSubject) {
            previewSubject.textContent = subject || 'No subject';
        }
        
        if (previewBody) {
            if (body.trim()) {
                if (isHtml) {
                    previewBody.innerHTML = body;
                } else {
                    previewBody.innerHTML = `<pre style="white-space: pre-wrap; font-family: inherit;">${body}</pre>`;
                }
            } else {
                previewBody.innerHTML = '<p class="empty-preview">Start typing to see preview</p>';
            }
        }
    }

    saveEmailContent() {
        const subject = document.getElementById('emailSubject')?.value?.trim();
        const activeTab = document.querySelector('.format-tab.active');
        const isHtml = activeTab ? activeTab.dataset.format === 'html' : false;
        const body = isHtml ? 
            document.getElementById('emailBody')?.innerHTML?.trim() : 
            document.getElementById('emailBodyPlain')?.value?.trim();

        if (!subject || !body) {
            this.showNotification('Please fill in both subject and body', 'error');
            return;
        }

        this.emailContent = { subject, body, is_html: isHtml };
        this.updateDashboard();
        this.showNotification('Email content saved successfully!', 'success');
        this.addActivity('Email content composed and saved');
    }

    // Attachments
    async handleAttachmentUpload(file) {
        if (file.size > 50 * 1024 * 1024) { // 50MB limit
            this.showNotification('File size exceeds 50MB limit', 'error');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);

        this.showLoading();

        try {
            const response = await fetch('/api/upload-attachment', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                this.attachments.push(result.file);
                this.updateAttachmentsGrid();
                this.updateDashboard();
                this.showNotification('File uploaded successfully', 'success');
                this.addActivity(`Attached file: ${result.file.original_name}`);
            } else {
                this.showNotification(result.message, 'error');
            }
        } catch (error) {
            console.error('Attachment upload error:', error);
            this.showNotification('Failed to upload file', 'error');
        } finally {
            this.hideLoading();
        }
    }

    updateAttachmentsGrid() {
        const grid = document.getElementById('attachmentsGrid');
        if (!grid) return;
        
        if (this.attachments.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-paperclip"></i>
                    <p>No files attached</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = this.attachments.map((attachment, index) => `
            <div class="attachment-card">
                <button class="attachment-remove" onclick="app.removeAttachment(${index})">
                    <i class="fas fa-times"></i>
                </button>
                <div class="attachment-icon">
                    <i class="fas fa-${this.getFileIcon(attachment.original_name)}"></i>
                </div>
                <div class="attachment-name">${attachment.original_name}</div>
                <div class="attachment-size">${this.formatFileSize(attachment.size)}</div>
            </div>
        `).join('');
    }

    removeAttachment(index) {
        const attachment = this.attachments[index];
        this.attachments.splice(index, 1);
        this.updateAttachmentsGrid();
        this.updateDashboard();
        this.showNotification('Attachment removed', 'success');

        // Clean up file on server
        fetch('/api/cleanup-files', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ file_ids: [attachment.id] })
        });
    }

    getFileIcon(filename) {
        const ext = filename.split('.').pop().toLowerCase();
        const iconMap = {
            'pdf': 'file-pdf',
            'doc': 'file-word',
            'docx': 'file-word',
            'txt': 'file-alt',
            'png': 'file-image',
            'jpg': 'file-image',
            'jpeg': 'file-image',
            'gif': 'file-image'
        };
        return iconMap[ext] || 'file';
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Send Campaign
    updateSendSummary() {
        const summarySubject = document.getElementById('summarySubject');
        const summaryRecipients = document.getElementById('summaryRecipients');
        const summaryAttachments = document.getElementById('summaryAttachments');
        const summarySmtp = document.getElementById('summarySmtp');
        
        if (summarySubject) summarySubject.textContent = this.emailContent?.subject || '-';
        if (summaryRecipients) summaryRecipients.textContent = this.recipients.length.toString();
        if (summaryAttachments) summaryAttachments.textContent = this.attachments.length.toString();
        if (summarySmtp) summarySmtp.textContent = this.smtpConfig?.host || '-';

        // Check if ready to send
        const isReady = this.smtpConfig && this.emailContent && this.recipients.length > 0;
        const launchBtn = document.getElementById('launchBtn');
        
        if (launchBtn) {
            if (isReady) {
                launchBtn.disabled = false;
                const span = launchBtn.querySelector('span');
                if (span) span.textContent = 'Launch Campaign';
            } else {
                launchBtn.disabled = true;
                const span = launchBtn.querySelector('span');
                if (span) span.textContent = 'Complete Setup First';
            }
        }
    }

    async launchCampaign() {
        if (!this.smtpConfig || !this.emailContent || this.recipients.length === 0) {
            this.showNotification('Please complete all setup steps first', 'error');
            return;
        }

        const sendModeElement = document.querySelector('input[name="sendMode"]:checked');
        const sendMode = sendModeElement ? sendModeElement.value : 'dry_run';
        const isDryRun = sendMode === 'dry_run';

        if (!isDryRun && !confirm(`Are you sure you want to send ${this.recipients.length} emails? This action cannot be undone.`)) {
            return;
        }

        // Show progress section
        const progressSection = document.getElementById('progressSection');
        const resultsSection = document.getElementById('resultsSection');
        
        if (progressSection) progressSection.style.display = 'block';
        if (resultsSection) resultsSection.style.display = 'none';
        
        // Reset progress
        this.resetProgress();

        const payload = {
            smtp_config: this.smtpConfig,
            content: this.emailContent,
            recipients: this.recipients,
            attachments: this.attachments,
            dry_run: isDryRun
        };

        try {
            const response = await fetch('/api/send-emails', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            if (result.success) {
                this.displayCampaignResults(result.results);
                this.addActivity(`Campaign ${isDryRun ? 'simulated' : 'sent'}: ${result.results.sent} emails`);
            } else {
                this.showNotification(result.message, 'error');
            }
        } catch (error) {
            console.error('Campaign launch error:', error);
            this.showNotification('Failed to launch campaign', 'error');
        }
    }

    resetProgress() {
        const progressFill = document.getElementById('progressFill');
        const sentCount = document.getElementById('sentCount');
        const failedCount = document.getElementById('failedCount');
        const totalCount = document.getElementById('totalCount');
        const liveLog = document.getElementById('liveLog');
        
        if (progressFill) progressFill.style.width = '0%';
        if (sentCount) sentCount.textContent = '0';
        if (failedCount) failedCount.textContent = '0';
        if (totalCount) totalCount.textContent = this.recipients.length.toString();
        if (liveLog) liveLog.innerHTML = '';
    }

    displayCampaignResults(results) {
        // Update progress bar
        const progressPercent = results.total > 0 ? (results.sent / results.total) * 100 : 0;
        
        const progressFill = document.getElementById('progressFill');
        const sentCount = document.getElementById('sentCount');
        const failedCount = document.getElementById('failedCount');
        
        if (progressFill) progressFill.style.width = progressPercent + '%';
        if (sentCount) sentCount.textContent = results.sent.toString();
        if (failedCount) failedCount.textContent = results.failed.toString();

        // Show results
        setTimeout(() => {
            const resultsSection = document.getElementById('resultsSection');
            if (resultsSection) {
                resultsSection.style.display = 'block';
                
                const resultsContainer = document.getElementById('resultsContainer');
                if (resultsContainer) {
                    resultsContainer.innerHTML = this.generateResultsHTML(results);
                }
            }
        }, 1000);
    }

    generateResultsHTML(results) {
        const duration = this.calculateDuration(results.start_time, results.end_time);
        
        let html = `
            <div class="results-summary">
                <div class="result-stat ${results.sent > 0 ? 'success' : ''}">
                    <i class="fas fa-check-circle"></i>
                    <div>
                        <span class="result-number">${results.sent}</span>
                        <span class="result-label">Sent Successfully</span>
                    </div>
                </div>
                <div class="result-stat ${results.failed > 0 ? 'error' : ''}">
                    <i class="fas fa-exclamation-circle"></i>
                    <div>
                        <span class="result-number">${results.failed}</span>
                        <span class="result-label">Failed</span>
                    </div>
                </div>
                <div class="result-stat">
                    <i class="fas fa-clock"></i>
                    <div>
                        <span class="result-number">${duration}</span>
                        <span class="result-label">Duration</span>
                    </div>
                </div>
            </div>
        `;
        
        if (results.dry_run) {
            html += '<div class="dry-run-notice"><i class="fas fa-info-circle"></i> This was a test run - no emails were actually sent</div>';
        }
        
        if (results.failed_recipients && results.failed_recipients.length > 0) {
            html += `
                <div class="failed-recipients">
                    <h4>Failed Recipients</h4>
                    <ul>
                        ${results.failed_recipients.slice(0, 5).map(fr => `<li>${fr.email}: ${fr.error}</li>`).join('')}
                    </ul>
                    ${results.failed_recipients.length > 5 ? `<p>... and ${results.failed_recipients.length - 5} more</p>` : ''}
                </div>
            `;
        }
        
        return html;
    }

    calculateDuration(start, end) {
        if (!start || !end) return '0s';
        const duration = new Date(end) - new Date(start);
        const seconds = Math.floor(duration / 1000);
        return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    }

    // Dashboard Updates
    updateDashboard() {
        // Update SMTP status
        const smtpStatus = document.getElementById('smtpStatus');
        if (smtpStatus) {
            if (this.smtpConfig) {
                smtpStatus.innerHTML = '<i class="fas fa-circle status-success"></i><span>Configured</span>';
            } else {
                smtpStatus.innerHTML = '<i class="fas fa-circle status-pending"></i><span>Not Configured</span>';
            }
        }

        // Update recipients status
        const recipientsStatus = document.getElementById('recipientsStatus');
        if (recipientsStatus) {
            if (this.recipients.length > 0) {
                recipientsStatus.innerHTML = `<i class="fas fa-circle status-success"></i><span>${this.recipients.length} Recipients</span>`;
            } else {
                recipientsStatus.innerHTML = '<i class="fas fa-circle status-pending"></i><span>0 Recipients</span>';
            }
        }

        // Update compose status
        const composeStatus = document.getElementById('composeStatus');
        if (composeStatus) {
            if (this.emailContent) {
                composeStatus.innerHTML = '<i class="fas fa-circle status-success"></i><span>Content Ready</span>';
            } else {
                composeStatus.innerHTML = '<i class="fas fa-circle status-pending"></i><span>Not Composed</span>';
            }
        }

        // Update launch status
        const launchStatus = document.getElementById('launchStatus');
        if (launchStatus) {
            const isReady = this.smtpConfig && this.emailContent && this.recipients.length > 0;
            if (isReady) {
                launchStatus.innerHTML = '<i class="fas fa-circle status-success"></i><span>Ready to Launch</span>';
            } else {
                launchStatus.innerHTML = '<i class="fas fa-circle status-pending"></i><span>Not Ready</span>';
            }
        }

        // Update sidebar stats
        const totalRecipients = document.getElementById('totalRecipients');
        const readyToSend = document.getElementById('readyToSend');
        
        if (totalRecipients) totalRecipients.textContent = this.recipients.length.toString();
        if (readyToSend) {
            const isReady = this.smtpConfig && this.emailContent && this.recipients.length > 0;
            readyToSend.textContent = isReady ? 'Yes' : 'No';
        }
    }

    addActivity(message) {
        const activityList = document.getElementById('activityList');
        if (!activityList) return;
        
        const time = new Date().toLocaleTimeString();
        
        const activityItem = document.createElement('div');
        activityItem.className = 'activity-item';
        activityItem.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>${message}</span>
            <time class="activity-time">${time}</time>
        `;
        
        activityList.insertBefore(activityItem, activityList.firstChild);
        
        // Keep only last 10 activities
        const activities = activityList.querySelectorAll('.activity-item');
        if (activities.length > 10) {
            activities[activities.length - 1].remove();
        }
    }

    // Compliance Modal
    showComplianceModal() {
        // Always hide loading overlay first
        this.hideLoading();
        
        const modal = document.getElementById('complianceModal');
        if (modal) {
            modal.style.display = 'flex';
            modal.style.zIndex = '1004'; // Ensure it's above loading overlay
        }
    }

    acceptCompliance() {
        const modal = document.getElementById('complianceModal');
        if (modal) {
            modal.style.display = 'none';
        }
        this.showNotification('Welcome to TermSender Pro!', 'success');
        this.addActivity('Compliance agreement accepted');
        
        // Mark as accepted in session
        sessionStorage.setItem('complianceAccepted', 'true');
    }

    declineCompliance() {
        const modal = document.getElementById('complianceModal');
        if (modal) {
            modal.style.display = 'none';
        }
        this.showNotification('You must agree to compliance terms to use TermSender Pro', 'error');
        
        // Redirect or close application
        setTimeout(() => {
            window.location.reload();
        }, 2000);
    }

    // UI Helpers
    showNotification(message, type = 'info') {
        const container = document.getElementById('notificationContainer');
        if (!container) return;
        
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        container.appendChild(notification);
        
        // Auto remove after 5 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 5000);
    }

    showLoading() {
        if (this.isLoading) return;
        this.isLoading = true;
        
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'flex';
            overlay.style.zIndex = '1001';
        }
    }

    hideLoading() {
        this.isLoading = false;
        
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
        
        // Force hide if stuck
        setTimeout(() => {
            if (overlay && overlay.style.display !== 'none') {
                overlay.style.display = 'none';
                this.isLoading = false;
            }
        }, 100);
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing TermSender Pro...');
    window.app = new TermSenderApp();
    
    // Emergency cleanup for stuck loading states
    setTimeout(() => {
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay && loadingOverlay.style.display !== 'none') {
            loadingOverlay.style.display = 'none';
            console.log('Emergency cleanup: Forced loading overlay to hide');
        }
    }, 5000);
});

// Additional error handling
window.addEventListener('error', (e) => {
    console.error('JavaScript error:', e.error);
    // Hide loading on any JavaScript error
    const loadingOverlay = document.getElementById('loadingOverlay');
    if (loadingOverlay) {
        loadingOverlay.style.display = 'none';
    }
});

// Handle page visibility changes
document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'visible') {
        // Force hide loading when page becomes visible again
        const loadingOverlay = document.getElementById('loadingOverlay');
        if (loadingOverlay) {
            loadingOverlay.style.display = 'none';
        }
        if (window.app) {
            window.app.isLoading = false;
        }
    }
});
