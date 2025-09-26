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
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.showComplianceModal();
        this.updateDashboard();
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

        smtpForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveSMTPConfig();
        });

        testBtn.addEventListener('click', () => {
            this.testSMTPConnection();
        });

        // Auto-fill sender email when username changes
        document.getElementById('smtpUsername').addEventListener('input', (e) => {
            const senderEmail = document.getElementById('senderEmail');
            if (!senderEmail.value) {
                senderEmail.value = e.target.value;
            }
        });
    }

    setupRecipientsEventListeners() {
        // CSV Upload
        const csvDropZone = document.getElementById('csvDropZone');
        const csvFileInput = document.getElementById('csvFileInput');
        const csvBrowseBtn = document.getElementById('csvBrowseBtn');

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

        // Manual entry
        document.getElementById('addManualBtn').addEventListener('click', () => {
            this.addManualEmails();
        });

        // Recipients actions
        document.getElementById('validateEmailsBtn').addEventListener('click', () => {
            this.validateAllEmails();
        });

        document.getElementById('clearRecipientsBtn').addEventListener('click', () => {
            this.clearAllRecipients();
        });
    }

    setupComposeEventListeners() {
        const composeForm = document.getElementById('composeForm');
        const formatTabs = document.querySelectorAll('.format-tab');
        const emailSubject = document.getElementById('emailSubject');
        const emailBody = document.getElementById('emailBody');
        const emailBodyPlain = document.getElementById('emailBodyPlain');

        composeForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveEmailContent();
        });

        // Format tabs
        formatTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                e.preventDefault();
                this.switchEmailFormat(e.target.dataset.format);
            });
        });

        // Live preview
        emailSubject.addEventListener('input', () => this.updatePreview());
        emailBody.addEventListener('input', () => this.updatePreview());
        emailBodyPlain.addEventListener('input', () => this.updatePreview());

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

    setupSendEventListeners() {
        document.getElementById('launchBtn').addEventListener('click', () => {
            this.launchCampaign();
        });
    }

    setupComplianceEventListeners() {
        document.getElementById('acceptCompliance').addEventListener('click', () => {
            this.acceptCompliance();
        });

        document.getElementById('declineCompliance').addEventListener('click', () => {
            this.declineCompliance();
        });
    }

    // Navigation
    navigateToSection(section) {
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

        document.getElementById(section).classList.add('active');
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

            const result = await response.json();
            
            if (result.success) {
                this.showNotification('SMTP connection successful!', 'success');
            } else {
                this.showNotification(result.message, 'error');
            }
        } catch (error) {
            this.showNotification('Failed to test SMTP connection', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async saveSMTPConfig() {
        const formData = this.getSMTPFormData();
        if (!formData) return;

        // Test connection first
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
            this.showNotification('Failed to save SMTP configuration', 'error');
        } finally {
            this.hideLoading();
        }
    }

    getSMTPFormData() {
        const host = document.getElementById('smtpHost').value.trim();
        const port = parseInt(document.getElementById('smtpPort').value);
        const username = document.getElementById('smtpUsername').value.trim();
        const password = document.getElementById('smtpPassword').value;
        const senderEmail = document.getElementById('senderEmail').value.trim();
        const useTls = document.getElementById('useTls').checked;

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

        try {
            const response = await fetch('/api/upload-csv', {
                method: 'POST',
                body: formData
            });

            const result = await response.json();

            if (result.success) {
                this.recipients = [...this.recipients, ...result.emails];
                this.updateRecipientsTable();
                this.updateDashboard();
                this.showNotification(result.message, 'success');
                this.addActivity(`Imported ${result.total_valid} recipients from CSV`);
            } else {
                this.showNotification(result.message, 'error');
            }
        } catch (error) {
            this.showNotification('Failed to upload CSV file', 'error');
        } finally {
            this.hideLoading();
        }
    }

    async addManualEmails() {
        const manualEmails = document.getElementById('manualEmails').value.trim();
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
        const subject = document.getElementById('emailSubject').value;
        const isHtml = document.querySelector('.format-tab.active').dataset.format === 'html';
        const body = isHtml ? 
            document.getElementById('emailBody').innerHTML : 
            document.getElementById('emailBodyPlain').value;

        document.getElementById('previewSubject').textContent = subject || 'No subject';
        
        const previewBody = document.getElementById('previewBody');
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

    saveEmailContent() {
        const subject = document.getElementById('emailSubject').value.trim();
        const isHtml = document.querySelector('.format-tab.active').dataset.format === 'html';
        const body = isHtml ? 
            document.getElementById('emailBody').innerHTML.trim() : 
            document.getElementById('emailBodyPlain').value.trim();

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
            this.showNotification('Failed to upload file', 'error');
        } finally {
            this.hideLoading();
        }
    }

    updateAttachmentsGrid() {
        const grid = document.getElementById('attachmentsGrid');
        
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
        document.getElementById('summarySubject').textContent = this.emailContent?.subject || '-';
        document.getElementById('summaryRecipients').textContent = this.recipients.length.toString();
        document.getElementById('summaryAttachments').textContent = this.attachments.length.toString();
        document.getElementById('summarySmtp').textContent = this.smtpConfig?.host || '-';

        // Check if ready to send
        const isReady = this.smtpConfig && this.emailContent && this.recipients.length > 0;
        const launchBtn = document.getElementById('launchBtn');
        
        if (isReady) {
            launchBtn.disabled = false;
            launchBtn.querySelector('span').textContent = 'Launch Campaign';
        } else {
            launchBtn.disabled = true;
            launchBtn.querySelector('span').textContent = 'Complete Setup First';
        }
    }

    async launchCampaign() {
        if (!this.smtpConfig || !this.emailContent || this.recipients.length === 0) {
            this.showNotification('Please complete all setup steps first', 'error');
            return;
        }

        const sendMode = document.querySelector('input[name="sendMode"]:checked').value;
        const isDryRun = sendMode === 'dry_run';

        if (!isDryRun && !confirm(`Are you sure you want to send ${this.recipients.length} emails? This action cannot be undone.`)) {
            return;
        }

        // Show progress section
        document.getElementById('progressSection').style.display = 'block';
        document.getElementById('resultsSection').style.display = 'none';
        
        // Reset progress
        document.getElementById('progressFill').style.width = '0%';
        document.getElementById('sentCount').textContent = '0';
        document.getElementById('failedCount').textContent = '0';
        document.getElementById('totalCount').textContent = this.recipients.length.toString();
        document.getElementById('liveLog').innerHTML = '';

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
            this.showNotification('Failed to launch campaign', 'error');
        }
    }

    displayCampaignResults(results) {
        // Update progress bar
        const progressPercent = (results.sent / results.total) * 100;
        document.getElementById('progressFill').style.width = progressPercent + '%';
        document.getElementById('sentCount').textContent = results.sent.toString();
        document.getElementById('failedCount').textContent = results.failed.toString();

        // Show results
        setTimeout(() => {
            document.getElementById('resultsSection').style.display = 'block';
            
            const resultsContainer = document.getElementById('resultsContainer');
            resultsContainer.innerHTML = `
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
                            <span class="result-number">${this.calculateDuration(results.start_time, results.end_time)}</span>
                            <span class="result-label">Duration</span>
                        </div>
                    </div>
                </div>
                ${results.dry_run ? '<div class="dry-run-notice"><i class="fas fa-info-circle"></i> This was a test run - no emails were actually sent</div>' : ''}
                ${results.failed_recipients && results.failed_recipients.length > 0 ? `
                    <div class="failed-recipients">
                        <h4>Failed Recipients</h4>
                        <ul>
                            ${results.failed_recipients.map(fr => `<li>${fr.email}: ${fr.error}</li>`).join('')}
                        </ul>
                    </div>
                ` : ''}
            `;
        }, 1000);
    }

    calculateDuration(start, end) {
        const duration = new Date(end) - new Date(start);
        const seconds = Math.floor(duration / 1000);
        return seconds < 60 ? `${seconds}s` : `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    }

    // Dashboard Updates
    updateDashboard() {
        // Update SMTP status
        const smtpStatus = document.getElementById('smtpStatus');
        if (this.smtpConfig) {
            smtpStatus.innerHTML = '<i class="fas fa-circle status-success"></i><span>Configured</span>';
        } else {
            smtpStatus.innerHTML = '<i class="fas fa-circle status-pending"></i><span>Not Configured</span>';
        }

        // Update recipients status
        const recipientsStatus = document.getElementById('recipientsStatus');
        if (this.recipients.length > 0) {
            recipientsStatus.innerHTML = `<i class="fas fa-circle status-success"></i><span>${this.recipients.length} Recipients</span>`;
        } else {
            recipientsStatus.innerHTML = '<i class="fas fa-circle status-pending"></i><span>0 Recipients</span>';
        }

        // Update compose status
        const composeStatus = document.getElementById('composeStatus');
        if (this.emailContent) {
            composeStatus.innerHTML = '<i class="fas fa-circle status-success"></i><span>Content Ready</span>';
        } else {
            composeStatus.innerHTML = '<i class="fas fa-circle status-pending"></i><span>Not Composed</span>';
        }

        // Update launch status
        const launchStatus = document.getElementById('launchStatus');
        const isReady = this.smtpConfig && this.emailContent && this.recipients.length > 0;
        if (isReady) {
            launchStatus.innerHTML = '<i class="fas fa-circle status-success"></i><span>Ready to Launch</span>';
        } else {
            launchStatus.innerHTML = '<i class="fas fa-circle status-pending"></i><span>Not Ready</span>';
        }

        // Update sidebar stats
        document.getElementById('totalRecipients').textContent = this.recipients.length.toString();
        document.getElementById('readyToSend').textContent = isReady ? 'Yes' : 'No';
    }

    addActivity(message) {
        const activityList = document.getElementById('activityList');
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
        document.getElementById('complianceModal').style.display = 'flex';
    }

    acceptCompliance() {
        document.getElementById('complianceModal').style.display = 'none';
        this.showNotification('Welcome to TermSender Pro!', 'success');
        this.addActivity('Compliance agreement accepted');
    }

    declineCompliance() {
        alert('You must agree to the compliance terms to use TermSender Pro.');
    }

    // UI Helpers
    showNotification(message, type = 'info') {
        const container = document.getElementById('notificationContainer');
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
        document.getElementById('loadingOverlay').style.display = 'flex';
    }

    hideLoading() {
        document.getElementById('loadingOverlay').style.display = 'none';
    }
}

// Initialize app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new TermSenderApp();
});

// Additional CSS for results styling
const additionalCSS = `
.results-summary {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 1rem;
    margin-bottom: 1.5rem;
}

.result-stat {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem;
    background: var(--bg-tertiary);
    border-radius: 8px;
    border: 1px solid var(--border-color);
}

.result-stat.success {
    border-color: var(--brand-success);
    background: rgba(34, 197, 94, 0.1);
}

.result-stat.error {
    border-color: var(--brand-danger);
    background: rgba(239, 68, 68, 0.1);
}

.result-stat i {
    font-size: 1.5rem;
    color: var(--brand-primary);
}

.result-stat.success i {
    color: var(--brand-success);
}

.result-stat.error i {
    color: var(--brand-danger);
}

.result-number {
    display: block;
    font-size: 1.5rem;
    font-weight: 700;
    color: var(--text-primary);
}

.result-label {
    display: block;
    font-size: 0.8rem;
    color: var(--text-muted);
    text-transform: uppercase;
    letter-spacing: 0.05em;
}

.dry-run-notice {
    background: rgba(245, 158, 11, 0.1);
    border: 1px solid var(--brand-warning);
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1rem;
    color: var(--brand-warning);
    text-align: center;
}

.failed-recipients {
    background: var(--bg-tertiary);
    border-radius: 8px;
    padding: 1rem;
}

.failed-recipients h4 {
    color: var(--brand-danger);
    margin-bottom: 0.5rem;
}

.failed-recipients ul {
    margin: 0;
    padding-left: 1.5rem;
}

.failed-recipients li {
    color: var(--text-secondary);
    margin-bottom: 0.25rem;
}

.btn-sm {
    padding: 0.375rem 0.75rem;
    font-size: 0.8rem;
    min-height: 32px;
}
`;

// Inject additional CSS
const style = document.createElement('style');
style.textContent = additionalCSS;
document.head.appendChild(style);