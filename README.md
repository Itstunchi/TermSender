# TermSender Pro - Professional Email Campaign Manager

<div align="center">

🚀 **Beautiful Web Interface** • 📁 **File-Based Configuration** • 🎯 **Professional Email Campaigns**

*The ultimate email marketing tool that's both effortless to use and incredibly powerful*

</div>

## ✨ Features

### 🎨 Beautiful Web Interface
- **Modern dark-themed UI** that's professional and intuitive
- **Drag & drop file uploads** for CSV lists and attachments
- **Real-time validation** and live preview
- **Interactive dashboard** with status indicators
- **Responsive design** that works on any device

### 📁 Dual Configuration Modes
- **Web UI Mode**: Configure everything through the beautiful interface
- **File-Based Mode**: Pre-configure campaigns using JSON files
- **Hybrid Approach**: Mix both methods for maximum flexibility

### 🎯 Professional Features
- **SMTP Management**: Multiple server support with live testing
- **Rich Text Editor**: HTML/plain text with formatting tools
- **File Attachments**: PDFs, images, documents up to 50MB
- **Email Validation**: Automatic validation and deduplication
- **Campaign Templates**: Pre-built templates with variables
- **Compliance**: Built-in CAN-SPAM, GDPR guidelines

## 🚀 Quick Start

### Method 1: Web Interface (Recommended)
```bash
# Start the beautiful web interface
python launch.py

# Or with custom settings
python launch.py --web --port 8080 --no-browser
```

### Method 2: File-Based Campaigns
```bash
# List available configurations
python launch.py --list

# Run a campaign in test mode
python launch.py --campaign welcome_campaign --dry-run

# Run a campaign live
python launch.py --campaign product_launch --live
```

### Method 3: Production Deployment
```bash
# For deployment on Replit or other platforms
python deployment_config.py
```

## 📁 File-Based Configuration

TermSender Pro supports powerful file-based configuration for bulk setup:

### Configuration Files

#### `config/smtp_servers.json` - SMTP Server Settings
```json
{
  "smtp_servers": [
    {
      "name": "Gmail SMTP",
      "host": "smtp.gmail.com",
      "port": 587,
      "username": "your-email@gmail.com",
      "password": "your-app-password",
      "sender_email": "your-email@gmail.com",
      "use_tls": true,
      "enabled": true
    }
  ]
}
```

#### `config/email_lists.json` - Recipient Lists
```json
{
  "email_lists": {
    "customers": [
      {
        "email": "customer@example.com",
        "name": "John Doe",
        "company": "Acme Corp",
        "status": "active"
      }
    ]
  }
}
```

#### `config/email_templates.json` - Email Templates
```json
{
  "email_templates": {
    "welcome_email": {
      "subject": "Welcome {name}!",
      "body": "Dear {name},\n\nWelcome to our service!\n\nBest regards,\nThe Team",
      "is_html": false,
      "variables": ["name"]
    }
  }
}
```

#### `config/campaign_settings.json` - Campaign Configurations
```json
{
  "campaigns": {
    "welcome_campaign": {
      "name": "New Customer Welcome",
      "smtp_server": "Gmail SMTP",
      "email_list": "customers",
      "template": "welcome_email",
      "settings": {
        "send_mode": "dry_run"
      }
    }
  }
}
```

## 🌐 Web Deployment

### Deploy on Replit
1. **Automatic Deployment**: Your project is configured for Replit Autoscale deployment
2. **Click "Deploy"** in the Replit interface
3. **Custom Domain**: Add your domain in deployment settings
4. **Environment Variables**: Set `SECRET_KEY` for production security

### Deploy Elsewhere
```bash
# Install dependencies
pip install -r requirements.txt

# Run production server
python deployment_config.py
```

## 📋 Usage Examples

### Web Interface Workflow
1. **Start the App**: `python launch.py`
2. **Configure SMTP**: Add your email server settings
3. **Upload Recipients**: Drag & drop CSV files or add manually
4. **Compose Email**: Use the rich text editor
5. **Add Attachments**: Upload files as needed
6. **Launch Campaign**: Test with dry-run, then send live

### File-Based Workflow
1. **Edit Config Files**: Modify JSON files in `config/` directory
2. **Test Campaign**: `python launch.py --campaign mycampaign --dry-run`
3. **Run Live**: `python launch.py --campaign mycampaign --live`

### Hybrid Workflow
1. **Pre-configure**: Set up SMTP and templates in files
2. **Use Web UI**: Upload recipients and compose content via interface
3. **Launch**: Use either method to send campaigns

## 🔒 Security & Compliance

- **Password Security**: Passwords never saved to disk in web mode
- **File Permissions**: Secure handling of uploaded files
- **HTTPS Ready**: Configured for SSL/TLS deployment
- **Compliance Warnings**: Built-in CAN-SPAM, GDPR guidance
- **Rate Limiting**: Prevents server overload
- **Input Validation**: All inputs sanitized and validated

## 🛠 Configuration Reference

### Command Line Options
```bash
python launch.py [OPTIONS]

Options:
  --web                    Start web UI (default)
  --campaign NAME          Run specific campaign
  --list                   Show all configurations
  --host HOST             Web server host (default: 0.0.0.0)
  --port PORT             Web server port (default: 5000)
  --no-browser            Don't open browser automatically
  --dry-run               Test mode (default for campaigns)
  --live                  Live sending mode
```

### Environment Variables
```bash
SECRET_KEY=your-secret-key-for-production
PORT=5000                # Port for deployment
```

### CSV Format
```csv
email,name,company,status
user@example.com,John Doe,Acme Corp,active
jane@example.com,Jane Smith,TechCorp,active
```

## 🎯 Advanced Features

### Template Variables
Use `{variable_name}` in templates:
- `{name}` - Recipient name
- `{company}` - Company name  
- `{email}` - Email address
- Custom variables from CSV columns

### Multiple SMTP Servers
- Configure multiple SMTP servers in `smtp_servers.json`
- Enable/disable servers as needed
- Automatic failover support

### Campaign Scheduling
```json
{
  "schedule": {
    "type": "scheduled",
    "datetime": "2025-10-01T09:00:00"
  }
}
```

### Batch Processing
```json
{
  "settings": {
    "batch_size": 50,
    "delay_between_emails": 2,
    "max_retries": 3
  }
}
```

## 🚨 Important Notes

⚠️ **Compliance**: Always ensure compliance with anti-spam laws (CAN-SPAM, GDPR)
⚠️ **Consent**: Only send emails to consenting recipients
⚠️ **Testing**: Always test campaigns with `--dry-run` first
⚠️ **Passwords**: Use app passwords for Gmail/Outlook, not account passwords

## 📊 API Endpoints

The web interface exposes these API endpoints:

- `GET /api/config/smtp-servers` - List SMTP servers
- `GET /api/config/email-lists` - List email lists
- `GET /api/config/templates` - List email templates
- `GET /api/config/campaigns` - List campaigns
- `POST /api/config/campaigns/<name>/run` - Run campaign
- `GET /api/config/status` - System status
- `POST /api/config/backup` - Backup configurations

## 🔧 Troubleshooting

### Common Issues

**SMTP Connection Failed**
- Check server settings (host, port, TLS)
- Use app passwords for Gmail/Outlook
- Verify firewall settings

**File Upload Issues**
- Check file size (50MB limit)
- Verify file format (CSV for lists, PDF/images for attachments)
- Ensure proper permissions

**Template Variables Not Working**
- Check variable names match CSV columns
- Use `{variable}` format in templates
- Verify template configuration

### Getting Help
1. Check the web interface status indicators
2. Review log files in `logs/` directory
3. Use `python launch.py --list` to verify configurations
4. Test with dry-run mode first

## 📜 License

Professional Email Campaign Manager - Use responsibly and ethically.

---

<div align="center">

**Made with ❤️ for professional email marketing**

*Beautiful • Powerful • Compliant*

</div>