/**
 * TermSender Pro - JavaScript Application
 * Modern email campaign management interface
 */

class TermSenderApp {
    constructor() {
        this.currentSection = 'dashboard';
        this.smtpServers = [];  // Changed from single config to array
        this.rotationSettings = {
            mode: 'email_count',
            emailsPerRotation: 10,
            secondsPerRotation: 30,
            delayBetweenEmails: 1,
            enableFailover: true,
            maxRetries: 3
        };
        this.emailContent = null;
        this.recipients = [];
        this.attachments = [];
        this.isReady = false;
        this.isLoading = false;
        this.editingSmtpIndex = -1;  // For editing existing SMTP servers
        this.campaignActive = false;
        this.campaignProgress = {
            sent: 0,
            failed: 0,
            total: 0,
            current_smtp: '-',
            smtp_usage: {},
            smtp_rotations: 0,
            start_time: null,
            end_time: null
        };

        this.init();
    }

    init() {
        console.log('Initializing TermSender Pro...');

        // Make sure loading is hidden initially
        this.hideLoading();

        // Load saved data first
        this.loadSavedData();

        this.setupEventListeners();

        // Update header status after loading data
        this.updateHeaderStatus();

        // Only show compliance modal if not already accepted
        const complianceAccepted = sessionStorage.getItem('complianceAccepted');
        if (!complianceAccepted) {
            // Small delay to ensure DOM is ready
            setTimeout(() => {
                this.showComplianceModal();
            }, 100);
        }

        this.updateDashboard();
        this.updateSettingsStatus();
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

        // Settings Icon click - both button and icon
        const settingsBtn = document.getElementById('settingsBtn');
        const settingsIcon = document.getElementById('settingsIcon');
        
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => {
                this.showSettingsModal();
            });
        }
        
        if (settingsIcon) {
            settingsIcon.addEventListener('click', () => {
                this.showSettingsModal();
            });
        }

        // Settings Modal
        const closeModalBtn = document.getElementById('closeSettingsModal');
        const saveSettingsBtn = document.getElementById('saveSettingsBtn');

        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => this.hideSettingsModal());
        }
        if (saveSettingsBtn) {
            saveSettingsBtn.addEventListener('click', () => this.saveSettings());
        }
    }

    setupSMTPEventListeners() {
        // Add SMTP Server buttons
        const addSmtpBtn = document.getElementById('addSmtpBtn');
        const addFirstSmtpBtn = document.getElementById('addFirstSmtpBtn');

        if (addSmtpBtn) {
            addSmtpBtn.addEventListener('click', () => this.showSMTPModal());
        }
        if (addFirstSmtpBtn) {
            addFirstSmtpBtn.addEventListener('click', () => this.showSMTPModal());
        }

        // SMTP Modal
        const smtpForm = document.getElementById('smtpForm');
        const testBtn = document.getElementById('testSmtpBtn');
        const closeModalBtn = document.getElementById('closeSmtpModal');

        if (smtpForm) {
            smtpForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.saveSMTPServer();
            });
        }

        if (testBtn) {
            testBtn.addEventListener('click', () => {
                this.testSMTPConnection();
            });
        }

        if (closeModalBtn) {
            closeModalBtn.addEventListener('click', () => {
                this.hideSMTPModal();
            });
        }

        // Rotation Settings
        const rotationMode = document.getElementById('rotationMode');
        const saveRotationBtn = document.getElementById('saveRotationBtn');
        const testAllSmtpBtn = document.getElementById('testAllSmtpBtn');

        if (rotationMode) {
            rotationMode.addEventListener('change', (e) => {
                this.toggleRotationSettings(e.target.value);
            });
        }

        if (saveRotationBtn) {
            saveRotationBtn.addEventListener('click', () => {
                this.saveRotationSettings();
            });
        }

        if (testAllSmtpBtn) {
            testAllSmtpBtn.addEventListener('click', () => {
                this.testAllSMTPServers();
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
            section_el.style.display = 'none';
        });

        const targetSection = document.getElementById(section);
        if (targetSection) {
            targetSection.classList.add('active');
            targetSection.style.display = 'block';
        }

        this.currentSection = section;

        // Update section-specific content
        if (section === 'send') {
            this.updateSendSummary();
        } else if (section === 'smtp') {
            this.updateSMTPServersList();
        }
    }

    // SMTP Configuration
    showSMTPModal(index = -1) {
        const modal = document.getElementById('smtpModal');
        const title = document.getElementById('smtpModalTitle');

        this.editingSmtpIndex = index;

        if (index >= 0 && this.smtpServers[index]) {
            // Edit existing server
            title.textContent = 'Edit SMTP Server';
            const server = this.smtpServers[index];

            document.getElementById('smtpName').value = server.name || '';
            document.getElementById('smtpHost').value = server.host || '';
            document.getElementById('smtpPort').value = server.port || 587;
            document.getElementById('smtpUsername').value = server.username || '';
            document.getElementById('smtpPassword').value = server.password || '';
            document.getElementById('senderEmail').value = server.sender_email || '';
            document.getElementById('maxEmailsPerHour').value = server.max_emails_per_hour || 300;
            document.getElementById('smtpPriority').value = server.priority || 1;
            document.getElementById('useTls').checked = server.use_tls !== false;
            document.getElementById('smtpEnabled').checked = server.enabled !== false;
        } else {
            // Add new server
            title.textContent = 'Add SMTP Server';
            document.getElementById('smtpForm').reset();
            document.getElementById('smtpPort').value = 587;
            document.getElementById('maxEmailsPerHour').value = 300;
            document.getElementById('smtpPriority').value = this.smtpServers.length + 1;
            document.getElementById('useTls').checked = true;
            document.getElementById('smtpEnabled').checked = true;
        }

        modal.style.display = 'flex';
    }

    hideSMTPModal() {
        const modal = document.getElementById('smtpModal');
        modal.style.display = 'none';
        this.editingSmtpIndex = -1;
    }

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

    async testAllSMTPServers() {
        if (this.smtpServers.length === 0) {
            this.showNotification('No SMTP servers to test', 'warning');
            return;
        }

        this.showLoading();

        try {
            const response = await fetch('/api/test-smtp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(this.smtpServers)
            });

            const result = await response.json();

            if (result.success && result.results) {
                let successCount = 0;
                let failCount = 0;

                result.results.forEach(res => {
                    if (res.status === 'success') successCount++;
                    else failCount++;
                });

                this.showNotification(`Test Results: ${successCount} successful, ${failCount} failed`,
                    failCount === 0 ? 'success' : 'warning');
                this.addActivity(`Tested ${this.smtpServers.length} SMTP servers`);

                // Update server status in UI
                this.updateSMTPServersList();
            } else {
                this.showNotification(result.message || 'Test failed', 'error');
            }
        } catch (error) {
            console.error('SMTP test error:', error);
            this.showNotification('Failed to test SMTP servers', 'error');
        } finally {
            this.hideLoading();
        }
    }

    saveSMTPServer() {
        const formData = this.getSMTPFormData();
        if (!formData) return;

        if (this.editingSmtpIndex >= 0) {
            // Update existing server
            this.smtpServers[this.editingSmtpIndex] = formData;
            this.showNotification('SMTP server updated successfully!', 'success');
            this.addActivity(`Updated SMTP server: ${formData.name}`);
        } else {
            // Add new server
            this.smtpServers.push(formData);
            this.showNotification('SMTP server added successfully!', 'success');
            this.addActivity(`Added SMTP server: ${formData.name}`);
        }

        this.updateSMTPServersList();
        this.updateDashboard();
        this.hideSMTPModal();
        this.saveDataToFiles(); // Auto-save
    }

    removeSMTPServer(index) {
        if (confirm('Are you sure you want to remove this SMTP server?')) {
            const server = this.smtpServers[index];
            this.smtpServers.splice(index, 1);
            this.updateSMTPServersList();
            this.updateDashboard();
            this.showNotification(`SMTP server "${server.name}" removed`, 'success');
            this.addActivity(`Removed SMTP server: ${server.name}`);
        }
    }

    toggleSMTPServer(index) {
        const server = this.smtpServers[index];
        server.enabled = !server.enabled;
        this.updateSMTPServersList();
        this.updateDashboard();
        this.showNotification(`SMTP server "${server.name}" ${server.enabled ? 'enabled' : 'disabled'}`, 'success');
    }

    toggleRotationSettings(mode) {
        const emailCountSetting = document.getElementById('emailCountSetting');
        const timeDurationSetting = document.getElementById('timeDurationSetting');

        if (mode === 'email_count') {
            emailCountSetting.style.display = 'block';
            timeDurationSetting.style.display = 'none';
        } else {
            emailCountSetting.style.display = 'none';
            timeDurationSetting.style.display = 'block';
        }
    }

    saveRotationSettings() {
        const mode = document.getElementById('rotationMode').value;
        const emailsPerRotation = parseInt(document.getElementById('emailsPerRotation').value);
        const secondsPerRotation = parseInt(document.getElementById('secondsPerRotation').value);
        const delayBetweenEmails = parseFloat(document.getElementById('delayBetweenEmails').value);
        const enableFailover = document.getElementById('enableFailover').checked;
        const maxRetries = parseInt(document.getElementById('maxRetries').value);

        this.rotationSettings = {
            mode,
            emailsPerRotation,
            secondsPerRotation,
            delayBetweenEmails,
            enableFailover,
            maxRetries
        };

        this.showNotification('Rotation settings saved successfully!', 'success');
        this.addActivity('Updated SMTP rotation settings');
        this.updateDashboard();
        this.saveDataToFiles(); // Auto-save
    }

    updateSMTPServersList() {
        const container = document.getElementById('smtpServersList');
        if (!container) return;

        if (this.smtpServers.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-server"></i>
                    <p>No SMTP servers configured</p>
                    <button class="btn btn-outline" id="addFirstSmtpBtn">Add Your First SMTP Server</button>
                </div>
            `;

            // Re-attach event listener
            const addFirstBtn = document.getElementById('addFirstSmtpBtn');
            if (addFirstBtn) {
                addFirstBtn.addEventListener('click', () => this.showSMTPModal());
            }
            return;
        }

        container.innerHTML = this.smtpServers.map((server, index) => `
            <div class="smtp-server-card ${!server.enabled ? 'disabled' : ''}">
                <div class="server-header">
                    <div class="server-info">
                        <h4>${server.name}</h4>
                        <span class="server-details">${server.host}:${server.port}</span>
                    </div>
                    <div class="server-actions">
                        <button class="btn btn-sm btn-outline" onclick="app.showSMTPModal(${index})" title="Edit">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-sm ${server.enabled ? 'btn-warning' : 'btn-success'}"
                                onclick="app.toggleSMTPServer(${index})" title="${server.enabled ? 'Disable' : 'Enable'}">
                            <i class="fas fa-${server.enabled ? 'pause' : 'play'}"></i>
                        </button>
                        <button class="btn btn-sm btn-danger" onclick="app.removeSMTPServer(${index})" title="Remove">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
                <div class="server-stats">
                    <div class="stat">
                        <span class="stat-label">Priority</span>
                        <span class="stat-value">${server.priority || 1}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Max/Hour</span>
                        <span class="stat-value">${server.max_emails_per_hour || 300}</span>
                    </div>
                    <div class="stat">
                        <span class="stat-label">Status</span>
                        <span class="stat-value ${server.enabled ? 'status-enabled' : 'status-disabled'}">
                            ${server.enabled ? 'Enabled' : 'Disabled'}
                        </span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    getSMTPFormData() {
        const name = document.getElementById('smtpName')?.value?.trim();
        const host = document.getElementById('smtpHost')?.value?.trim();
        const port = parseInt(document.getElementById('smtpPort')?.value);
        const username = document.getElementById('smtpUsername')?.value?.trim();
        const password = document.getElementById('smtpPassword')?.value;
        const senderEmail = document.getElementById('senderEmail')?.value?.trim();
        const maxEmailsPerHour = parseInt(document.getElementById('maxEmailsPerHour')?.value);
        const priority = parseInt(document.getElementById('smtpPriority')?.value);
        const useTls = document.getElementById('useTls')?.checked;
        const enabled = document.getElementById('smtpEnabled')?.checked;

        if (!name || !host || !port || !username || !password || !senderEmail) {
            this.showNotification('Please fill in all required SMTP fields', 'error');
            return null;
        }

        return {
            name, host, port, username, password,
            sender_email: senderEmail,
            max_emails_per_hour: maxEmailsPerHour || 300,
            priority: priority || 1,
            use_tls: useTls,
            enabled: enabled
        };
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
        
        // Auto-save recipients
        this.saveDataToFiles();
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
        this.saveDataToFiles(); // Auto-save
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
        this.updateAdvancedPreview();
        this.updateLaunchButton();
    }

    updateAdvancedPreview() {
        // Email Content Preview
        const previewFrom = document.getElementById('previewFrom');
        const previewSubjectLine = document.getElementById('previewSubjectLine');
        const previewEmailBody = document.getElementById('previewEmailBody');

        if (previewFrom) {
            const enabledServers = this.smtpServers.filter(s => s.enabled);
            previewFrom.textContent = enabledServers.length > 0 ? enabledServers[0].sender_email : 'No sender configured';
        }

        if (previewSubjectLine) {
            previewSubjectLine.textContent = this.emailContent?.subject || 'No subject';
        }

        if (previewEmailBody) {
            if (this.emailContent?.body) {
                if (this.emailContent.is_html) {
                    previewEmailBody.innerHTML = this.emailContent.body;
                } else {
                    previewEmailBody.innerHTML = `<pre style="white-space: pre-wrap;">${this.emailContent.body}</pre>`;
                }
            } else {
                previewEmailBody.innerHTML = '<p class="empty-preview">No content to preview</p>';
            }
        }

        // Recipients Summary
        const totalRecipientsCount = document.getElementById('totalRecipientsCount');
        const domainBreakdown = document.getElementById('domainBreakdown');

        if (totalRecipientsCount) {
            totalRecipientsCount.textContent = this.recipients.length.toString();
        }

        if (domainBreakdown) {
            if (this.recipients.length > 0) {
                const domains = {};
                this.recipients.forEach(r => {
                    const domain = r.email.split('@')[1] || 'unknown';
                    domains[domain] = (domains[domain] || 0) + 1;
                });

                const sortedDomains = Object.entries(domains)
                    .sort(([,a], [,b]) => b - a)
                    .slice(0, 5);

                domainBreakdown.innerHTML = sortedDomains.map(([domain, count]) =>
                    `<div class="domain-item">
                        <span class="domain-name">${domain}</span>
                        <span class="domain-count">${count}</span>
                    </div>`
                ).join('');
            } else {
                domainBreakdown.innerHTML = '<div class="empty-breakdown">No recipients loaded</div>';
            }
        }

        // SMTP Summary
        const smtpSummary = document.getElementById('smtpSummary');
        if (smtpSummary) {
            const enabledServers = this.smtpServers.filter(s => s.enabled);
            if (enabledServers.length > 0) {
                smtpSummary.innerHTML = `
                    <div class="smtp-overview">
                        <div class="smtp-stat">
                            <span class="stat-number">${enabledServers.length}</span>
                            <span class="stat-label">Active Servers</span>
                        </div>
                        <div class="smtp-rotation-info">
                            <span class="rotation-mode">${this.rotationSettings.mode.replace('_', ' ')}</span>
                            <span class="rotation-value">
                                ${this.rotationSettings.mode === 'email_count' ?
                                    `${this.rotationSettings.emailsPerRotation} emails` :
                                    `${this.rotationSettings.secondsPerRotation} seconds`}
                            </span>
                        </div>
                    </div>
                    <div class="smtp-servers-preview">
                        ${enabledServers.slice(0, 3).map(server =>
                            `<div class="smtp-server-preview">
                                <span class="server-name">${server.name}</span>
                                <span class="server-priority">Priority ${server.priority}</span>
                            </div>`
                        ).join('')}
                        ${enabledServers.length > 3 ? `<div class="more-servers">+${enabledServers.length - 3} more</div>` : ''}
                    </div>
                `;
            } else {
                smtpSummary.innerHTML = '<div class="empty-smtp">No SMTP servers configured</div>';
            }
        }

        // Attachments Summary
        const attachmentsCount = document.getElementById('attachmentsCount');
        const attachmentsList = document.getElementById('attachmentsList');

        if (attachmentsCount) {
            attachmentsCount.textContent = this.attachments.length.toString();
        }

        if (attachmentsList) {
            if (this.attachments.length > 0) {
                attachmentsList.innerHTML = this.attachments.map(att =>
                    `<div class="attachment-preview">
                        <span class="attachment-name">${att.original_name}</span>
                        <span class="attachment-size">${this.formatFileSize(att.size)}</span>
                    </div>`
                ).join('');
            } else {
                attachmentsList.innerHTML = '<div class="empty-attachments">No attachments</div>';
            }
        }
    }

    updateLaunchButton() {
        const enabledServers = this.smtpServers.filter(s => s.enabled);
        const isReady = enabledServers.length > 0 && this.emailContent && this.recipients.length > 0;
        const launchBtn = document.getElementById('launchBtn');
        const launchWarning = document.getElementById('launchWarning');

        if (launchBtn) {
            if (isReady) {
                launchBtn.disabled = false;
                launchBtn.classList.remove('btn-secondary');
                launchBtn.classList.add('btn-danger');
                const span = launchBtn.querySelector('span');
                if (span) span.textContent = 'Launch Campaign';

                if (launchWarning) launchWarning.style.display = 'none';
            } else {
                launchBtn.disabled = true;
                launchBtn.classList.remove('btn-danger');
                launchBtn.classList.add('btn-secondary');
                const span = launchBtn.querySelector('span');
                if (span) span.textContent = 'Complete Setup First';

                if (launchWarning) {
                    launchWarning.style.display = 'flex';
                    const missing = [];
                    if (enabledServers.length === 0) missing.push('SMTP servers');
                    if (!this.emailContent) missing.push('email content');
                    if (this.recipients.length === 0) missing.push('recipients');

                    const warningSpan = launchWarning.querySelector('span');
                    if (warningSpan) {
                        warningSpan.textContent = `Missing: ${missing.join(', ')}`;
                    }
                }
            }
        }
    }

    async launchCampaign() {
        // Validate setup
        const enabledServers = this.smtpServers.filter(s => s.enabled);
        
        if (enabledServers.length === 0) {
            this.showNotification('No SMTP servers configured or enabled', 'error');
            this.navigateToSection('smtp');
            return;
        }
        
        if (!this.emailContent) {
            this.showNotification('Please compose your email content first', 'error');
            this.navigateToSection('compose');
            return;
        }
        
        if (this.recipients.length === 0) {
            this.showNotification('Please add recipients first', 'error');
            this.navigateToSection('recipients');
            return;
        }

        const sendModeElement = document.querySelector('input[name="sendMode"]:checked');
        const sendMode = sendModeElement ? sendModeElement.value : 'dry_run';
        const isDryRun = sendMode === 'dry_run';

        if (!isDryRun && !confirm(`⚠️ Are you sure you want to send ${this.recipients.length} emails using ${enabledServers.length} SMTP server(s)? This action cannot be undone.`)) {
            return;
        }

        // Show progress section
        const progressSection = document.getElementById('progressSection');
        const resultsSection = document.getElementById('resultsSection');

        if (progressSection) progressSection.style.display = 'block';
        if (resultsSection) resultsSection.style.display = 'none';

        // Reset progress
        this.resetCampaignProgress();
        this.campaignActive = true;

        // Get advanced options
        const batchSize = parseInt(document.getElementById('batchSize')?.value) || 50;
        const maxRetries = parseInt(document.getElementById('maxRetries')?.value) || 3;
        const enableAnalytics = document.getElementById('enableAnalytics')?.checked !== false;

        this.campaignProgress = {
            sent: 0,
            failed: 0,
            total: this.recipients.length,
            current_smtp: '-',
            smtp_usage: {},
            smtp_rotations: 0,
            start_time: new Date(),
            end_time: null,
            failed_recipients: [],
            smtp_rotations_details: [] // To store details of each rotation
        };

        const payload = {
            smtp_configs: enabledServers,
            content: this.emailContent,
            recipients: this.recipients,
            attachments: this.attachments,
            dry_run: isDryRun,
            rotation_mode: this.rotationSettings.mode,
            rotation_value: this.rotationSettings.mode === 'email_count' ?
                this.rotationSettings.emailsPerRotation : this.rotationSettings.secondsPerRotation,
            delay_between_emails: this.rotationSettings.delayBetweenEmails,
            batch_size: batchSize,
            max_retries: maxRetries,
            enable_analytics: enableAnalytics
        };

        try {
            this.startProgressTimer();

            // Simulate sending emails
            for (let i = 0; i < this.recipients.length; i++) {
                const recipient = this.recipients[i];
                // Simulate SMTP rotation for demo
                if (this.smtp_manager && this.smtp_manager.should_rotate && this.smtp_manager.should_rotate()) {
                    server = this.smtp_manager.rotate_server();
                    this.campaignProgress["smtp_rotations"] += 1;
                    this.campaignProgress["current_smtp"] = server.name;
                }

                const currentServer = this.smtpServers.find(s => s.enabled) || { name: 'Test Server' };
                this.campaignProgress["current_smtp"] = currentServer.name;

                // Update usage stats
                if (!this.campaignProgress["smtp_usage"][currentServer.name]) {
                    this.campaignProgress["smtp_usage"][currentServer.name] = 0;
                }
                this.campaignProgress["smtp_usage"][currentServer.name] += 1;

                // Add to activity log
                this.addActivityLog('success', recipient, this.emailContent?.subject || 'Test Subject', currentServer.name, 'Email sent successfully');

                this.campaignProgress["sent"] = i + 1;

                // Update progress UI
                this.updateCampaignProgress(this.campaignProgress);

                await new Promise(resolve => setTimeout(resolve, 100)); // Simulate processing
            }

            this.campaignActive = false;
            this.campaignProgress.end_time = new Date();
            this.displayCampaignResults(this.campaignProgress); // Pass the final progress object
            this.addActivity(`Campaign ${isDryRun ? 'simulated' : 'sent'}: ${this.campaignProgress.sent} emails`);

        } catch (error) {
            console.error('Campaign launch error:', error);
            this.showNotification('Failed to launch campaign', 'error');
            this.campaignActive = false;
            this.campaignProgress.end_time = new Date();
            this.displayCampaignResults(this.campaignProgress); // Display current progress even on error
        } finally {
            this.stopProgressTimer();
        }
    }

    // Placeholder for actual campaign progress update
    updateCampaignProgress(progress) {
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        const sentCount = document.getElementById('sentCount');
        const failedCount = document.getElementById('failedCount');
        const elapsedTime = document.getElementById('elapsedTime');
        const rotationCount = document.getElementById('rotationCount');
        const progressDetails = document.getElementById('progressDetails');
        const liveLog = document.getElementById('liveLog');
        const currentSmtpName = document.getElementById('currentSmtpName');
        const currentSmtpUsage = document.getElementById('currentSmtpUsage');

        const progressPercent = progress.total > 0 ? (progress.sent / progress.total) * 100 : 0;
        const elapsed = progress.start_time ? Math.floor((new Date() - new Date(progress.start_time)) / 1000) : 0;

        if (progressFill) progressFill.style.width = progressPercent + '%';
        if (progressText) progressText.textContent = Math.round(progressPercent) + '%';
        if (sentCount) sentCount.textContent = progress.sent.toString();
        if (failedCount) failedCount.textContent = progress.failed.toString();
        if (elapsedTime) elapsedTime.textContent = this.formatTime(elapsed);
        if (rotationCount) rotationCount.textContent = progress.smtp_rotations.toString();
        if (progressDetails) progressDetails.textContent = `Sending email ${progress.sent} of ${progress.total}`;
        if (currentSmtpName) currentSmtpName.textContent = progress.current_smtp;
        if (currentSmtpUsage) currentSmtpUsage.textContent = `${progress.smtp_usage[progress.current_smtp] || 0} emails sent`;

        // Update the live activity log in the launch section
        if (liveLog) {
            const latestLogEntries = liveLog.querySelectorAll('.log-entry');
            if (latestLogEntries.length > 5) { // Keep only the latest 5 entries for truncation
                liveLog.removeChild(latestLogEntries[latestLogEntries.length - 1]);
            }
        }
    }

    addActivityLog(status, recipient, subject, smtpServer, message) {
        const liveLog = document.getElementById('liveLog');
        if (!liveLog) return;

        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${status}`;
        logEntry.innerHTML = `
            <div class="log-details">
                <span class="log-time">${new Date().toLocaleTimeString()}</span>
                <span class="log-status-icon"><i class="fas fa-${status === 'success' ? 'check-circle' : 'times-circle'}"></i></span>
                <span class="log-recipient">${recipient.email}</span>
                <span class="log-subject">${subject}</span>
                <span class="log-server">${smtpServer}</span>
            </div>
            <div class="log-message">${message}</div>
            <div class="log-actions">
                <button class="btn btn-sm btn-secondary" onclick="app.openEmailLogModal('${recipient.email}', '${smtpServer}')">
                    <i class="fas fa-table"></i> Log
                </button>
            </div>
        `;
        liveLog.prepend(logEntry); // Add to the top
    }

    openEmailLogModal(email, smtpServer) {
        // Placeholder for opening a modal with detailed log for a specific email/server
        console.log(`Opening log modal for ${email} via ${smtpServer}`);
        alert(`Showing detailed log for ${email} sent via ${smtpServer}. (Modal functionality not yet implemented)`);
    }


    resetCampaignProgress() {
        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        const sentCount = document.getElementById('sentCount');
        const failedCount = document.getElementById('failedCount');
        const elapsedTime = document.getElementById('elapsedTime');
        const rotationCount = document.getElementById('rotationCount');
        const progressDetails = document.getElementById('progressDetails');
        const liveLog = document.getElementById('liveLog');
        const currentSmtpName = document.getElementById('currentSmtpName');
        const currentSmtpUsage = document.getElementById('currentSmtpUsage');

        if (progressFill) progressFill.style.width = '0%';
        if (progressText) progressText.textContent = '0%';
        if (sentCount) sentCount.textContent = '0';
        if (failedCount) failedCount.textContent = '0';
        if (elapsedTime) elapsedTime.textContent = '0s';
        if (rotationCount) rotationCount.textContent = '0';
        if (progressDetails) progressDetails.textContent = 'Initializing...';
        if (currentSmtpName) currentSmtpName.textContent = '-';
        if (currentSmtpUsage) currentSmtpUsage.textContent = '0 emails sent';

        if (liveLog) {
            liveLog.innerHTML = `
                <div class="log-entry initial">
                    <span class="log-time">${new Date().toLocaleTimeString()}</span>
                    <span class="log-message">Campaign initialized and ready to start...</span>
                </div>
            `;
        }
    }

    displayCampaignResults(results) {
        this.stopProgressTimer();

        // Update final progress
        const progressPercent = results.total > 0 ? (results.sent / results.total) * 100 : 0;

        const progressFill = document.getElementById('progressFill');
        const progressText = document.getElementById('progressText');
        const sentCount = document.getElementById('sentCount');
        const failedCount = document.getElementById('failedCount');
        const progressDetails = document.getElementById('progressDetails');

        if (progressFill) progressFill.style.width = progressPercent + '%';
        if (progressText) progressText.textContent = Math.round(progressPercent) + '%';
        if (sentCount) sentCount.textContent = results.sent.toString();
        if (failedCount) failedCount.textContent = results.failed.toString();
        if (progressDetails) progressDetails.textContent = 'Campaign completed!';

        // Show results
        setTimeout(() => {
            this.showDetailedResults(results);
        }, 1000);
    }

    showDetailedResults(results) {
        const resultsSection = document.getElementById('resultsSection');
        if (resultsSection) {
            resultsSection.style.display = 'block';

            // Update summary cards
            const finalSentCount = document.getElementById('finalSentCount');
            const finalFailedCount = document.getElementById('finalFailedCount');
            const successPercentage = document.getElementById('successPercentage');
            const failurePercentage = document.getElementById('failurePercentage');
            const campaignDuration = document.getElementById('campaignDuration');
            const emailsPerMinute = document.getElementById('emailsPerMinute');
            const smtpServersUsed = document.getElementById('smtpServersUsed');
            const totalRotations = document.getElementById('totalRotations');

            if (finalSentCount) finalSentCount.textContent = results.sent.toString();
            if (finalFailedCount) finalFailedCount.textContent = results.failed.toString();

            const successRate = results.total > 0 ? (results.sent / results.total) * 100 : 0;
            const failureRate = 100 - successRate;

            if (successPercentage) successPercentage.textContent = successRate.toFixed(1) + '%';
            if (failurePercentage) failurePercentage.textContent = failureRate.toFixed(1) + '%';

            const duration = this.calculateDuration(results.start_time, results.end_time);
            if (campaignDuration) campaignDuration.textContent = duration;

            if (emailsPerMinute && results.start_time && results.end_time) {
                const durationMs = new Date(results.end_time) - new Date(results.start_time);
                const rate = durationMs > 0 ? Math.round((results.sent / durationMs) * 60000) : 0;
                emailsPerMinute.textContent = rate.toString();
            }

            if (smtpServersUsed) {
                const serversUsed = Object.keys(results.smtp_usage || {}).length;
                smtpServersUsed.textContent = serversUsed.toString();
            }

            if (totalRotations) {
                totalRotations.textContent = `${results.smtp_rotations || 0} rotations`;
            }

            // Update SMTP usage breakdown
            this.updateSmtpUsageBreakdown(results.smtp_usage || {});

            // Update failed recipients table
            this.updateFailedRecipientsTable(results.failed_recipients || []);
        }
    }

    updateSmtpUsageBreakdown(smtpUsage) {
        const smtpUsageGrid = document.getElementById('smtpUsageGrid');
        if (!smtpUsageGrid) return;

        if (Object.keys(smtpUsage).length === 0) {
            smtpUsageGrid.innerHTML = '<div class="empty-usage">No SMTP usage data</div>';
            return;
        }

        const total = Object.values(smtpUsage).reduce((a, b) => a + b, 0);

        smtpUsageGrid.innerHTML = Object.entries(smtpUsage)
            .sort(([,a], [,b]) => b - a)
            .map(([serverName, count]) => {
                const percentage = total > 0 ? (count / total) * 100 : 0;
                return `
                    <div class="smtp-usage-card">
                        <div class="usage-header">
                            <span class="server-name">${serverName}</span>
                            <span class="usage-count">${count} emails</span>
                        </div>
                        <div class="usage-bar">
                            <div class="usage-fill" style="width: ${percentage}%"></div>
                        </div>
                        <div class="usage-percentage">${percentage.toFixed(1)}%</div>
                    </div>
                `;
            }).join('');
    }

    updateFailedRecipientsTable(failedRecipients) {
        const failedRecipientsSection = document.getElementById('failedRecipientsSection');
        const failedRecipientsTable = document.getElementById('failedRecipientsTable');

        if (!failedRecipientsSection || !failedRecipientsTable) return;

        if (failedRecipients.length === 0) {
            failedRecipientsSection.style.display = 'none';
            return;
        }

        failedRecipientsSection.style.display = 'block';

        failedRecipientsTable.innerHTML = failedRecipients.map(failed => `
            <tr>
                <td>${failed.email}</td>
                <td class="error-reason">${failed.error}</td>
                <td>${failed.smtp_server || 'Unknown'}</td>
                <td>${failed.timestamp ? new Date(failed.timestamp).toLocaleString() : '-'}</td>
            </tr>
        `).join('');
    }

    // Dashboard Updates
    updateDashboard() {
        // Update SMTP status and header
        this.updateSettingsStatus();
        this.updateHeaderStatus();

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
            const enabledServers = this.smtpServers.filter(s => s.enabled);
            const isReady = enabledServers.length > 0 && this.emailContent && this.recipients.length > 0;
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
            const enabledServers = this.smtpServers.filter(s => s.enabled);
            const isReady = enabledServers.length > 0 && this.emailContent && this.recipients.length > 0;
            readyToSend.textContent = isReady ? 'Yes' : 'No';
        }

        // Update send section if currently viewing it
        if (this.currentSection === 'send') {
            this.updateSendSummary();
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

    // Settings Modal
    showSettingsModal() {
        const modal = document.getElementById('settingsModal');
        if (!modal) return;

        // Populate settings form if elements exist
        const smtpTestInterval = document.getElementById('smtpTestInterval');
        const analyticsEnabled = document.getElementById('analyticsEnabled');
        const apiEndpoint = document.getElementById('apiEndpoint');
        const statusCheckInterval = document.getElementById('statusCheckInterval');

        if (smtpTestInterval) smtpTestInterval.value = this.settings?.smtp_test_interval || 60;
        if (analyticsEnabled) analyticsEnabled.checked = this.settings?.analytics_enabled !== false;
        if (apiEndpoint) apiEndpoint.value = this.settings?.api_endpoint || 'http://localhost:5000/api';
        if (statusCheckInterval) statusCheckInterval.value = this.settings?.status_check_interval || 30;

        modal.style.display = 'flex';
        this.updateSettingsStatus(); // Update status indicators within the modal
    }

    hideSettingsModal() {
        const modal = document.getElementById('settingsModal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    saveSettings() {
        const smtpTestInterval = parseInt(document.getElementById('smtpTestInterval')?.value || 60);
        const analyticsEnabled = document.getElementById('analyticsEnabled')?.checked !== false;
        const apiEndpoint = document.getElementById('apiEndpoint')?.value || 'http://localhost:5000/api';
        const statusCheckInterval = parseInt(document.getElementById('statusCheckInterval')?.value || 30);

        this.settings = {
            smtp_test_interval: smtpTestInterval,
            analytics_enabled: analyticsEnabled,
            api_endpoint: apiEndpoint,
            status_check_interval: statusCheckInterval
        };

        this.showNotification('Settings saved successfully!', 'success');
        this.hideSettingsModal();
        this.updateHeaderStatus();
        this.addActivity('Settings updated');
    }

    updateHeaderStatus() {
        const headerStatusDot = document.getElementById('headerStatusDot');
        const headerStatusText = document.getElementById('headerStatusText');
        
        if (!headerStatusDot || !headerStatusText) return;

        const enabledServers = this.smtpServers.filter(s => s.enabled);

        if (enabledServers.length > 0) {
            headerStatusDot.classList.remove('offline', 'error');
            headerStatusDot.classList.add('online');
            headerStatusText.textContent = `Ready - ${enabledServers.length} server(s) configured`;
        } else if (this.smtpServers.length > 0) {
            headerStatusDot.classList.remove('online', 'error');
            headerStatusDot.classList.add('offline');
            headerStatusText.textContent = 'Offline - No active servers';
        } else {
            headerStatusDot.classList.remove('online', 'offline');
            headerStatusDot.classList.add('error');
            headerStatusText.textContent = 'Setup required';
        }
    }

    updateSettingsStatus() {
        const settingsIcon = document.getElementById('settingsIcon');
        if (!settingsIcon) return;

        const enabledServers = this.smtpServers.filter(s => s.enabled);

        if (enabledServers.length > 0) {
            settingsIcon.classList.remove('status-pending', 'status-issue');
            settingsIcon.classList.add('status-online');
            settingsIcon.title = `Online (${enabledServers.length} server(s) active)`;
        } else if (this.smtpServers.length > 0) {
            settingsIcon.classList.remove('status-online', 'status-issue');
            settingsIcon.classList.add('status-pending');
            settingsIcon.title = 'Pending (No active servers)';
        } else {
            settingsIcon.classList.remove('status-online', 'status-pending');
            settingsIcon.classList.add('status-issue');
            settingsIcon.title = 'Issue (No SMTP servers configured)';
        }

        // Also update header status
        this.updateHeaderStatus();
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

    formatTime(seconds) {
        if (seconds < 60) {
            return `${seconds}s`;
        }
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${minutes}m ${remainingSeconds}s`;
    }

    calculateDuration(startTime, endTime) {
        if (!startTime || !endTime) return '0s';
        const start = new Date(startTime);
        const end = new Date(endTime);
        const durationMs = end - start;
        const durationSeconds = Math.floor(durationMs / 1000);
        return this.formatTime(durationSeconds);
    }

    // Data Persistence Methods
    async loadSavedData() {
        try {
            // Load SMTP servers
            const smtpResponse = await fetch('/api/get-smtp-servers');
            if (smtpResponse.ok) {
                const smtpData = await smtpResponse.json();
                if (smtpData.success && smtpData.servers) {
                    this.smtpServers = smtpData.servers;
                }
            }

            // Load rotation settings
            const rotationResponse = await fetch('/api/get-rotation-settings');
            if (rotationResponse.ok) {
                const rotationData = await rotationResponse.json();
                if (rotationData.success && rotationData.settings) {
                    this.rotationSettings = { ...this.rotationSettings, ...rotationData.settings };
                }
            }

            // Load saved recipients
            const recipientsData = localStorage.getItem('termsender_recipients');
            if (recipientsData) {
                this.recipients = JSON.parse(recipientsData);
            }

            // Load saved email content
            const emailData = localStorage.getItem('termsender_email_content');
            if (emailData) {
                this.emailContent = JSON.parse(emailData);
                this.populateEmailForm();
            }

            console.log('Saved data loaded successfully');
        } catch (error) {
            console.error('Error loading saved data:', error);
        }
    }

    async saveDataToFiles() {
        try {
            // Save SMTP servers
            await fetch('/api/save-smtp-servers', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ servers: this.smtpServers })
            });

            // Save rotation settings
            await fetch('/api/save-rotation-settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ settings: this.rotationSettings })
            });

            // Save recipients to localStorage
            localStorage.setItem('termsender_recipients', JSON.stringify(this.recipients));

            // Save email content to localStorage
            if (this.emailContent) {
                localStorage.setItem('termsender_email_content', JSON.stringify(this.emailContent));
            }

        } catch (error) {
            console.error('Error saving data:', error);
        }
    }

    populateEmailForm() {
        if (!this.emailContent) return;

        const subjectField = document.getElementById('emailSubject');
        const htmlEditor = document.getElementById('emailBody');
        const plainEditor = document.getElementById('emailBodyPlain');

        if (subjectField) subjectField.value = this.emailContent.subject || '';

        if (this.emailContent.is_html && htmlEditor) {
            htmlEditor.innerHTML = this.emailContent.body || '';
            this.switchEmailFormat('html');
        } else if (plainEditor) {
            plainEditor.value = this.emailContent.body || '';
            this.switchEmailFormat('plain');
        }

        this.updatePreview();
    }

startProgressTimer() {
        this.progressTimer = setInterval(() => {
            if (this.campaignActive && this.campaignProgress.start_time) {
                const elapsed = Math.floor((new Date() - new Date(this.campaignProgress.start_time)) / 1000);
                const elapsedTimeElement = document.getElementById('elapsedTime');
                if (elapsedTimeElement) {
                    elapsedTimeElement.textContent = this.formatTime(elapsed);
                }
            }
        }, 1000);
    }

    stopProgressTimer() {
        if (this.progressTimer) {
            clearInterval(this.progressTimer);
            this.progressTimer = null;
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
    // Update status to issue if an error occurs
    if (window.app) {
        window.app.updateSettingsStatus();
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
            window.app.updateSettingsStatus(); // Re-check status
        }
    }
});