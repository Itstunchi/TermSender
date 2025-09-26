
# TermSender Pro v3.0 - Advanced Email Campaign Manager

<div align="center">

🚀 **SMTP Rotation** • 📊 **Real-time Analytics** • 🎨 **Beautiful Web UI** • 🖥️ **Advanced CLI**

*The ultimate email marketing solution with multiple SMTP rotation, sophisticated analytics, and seamless terminal/web operation*

</div>

## ✨ Enhanced Features v3.0

### 🔄 Advanced SMTP Rotation
- **Multiple SMTP Support**: Configure unlimited SMTP servers
- **Rotation Modes**: 
  - **Email Count**: Rotate after N emails (e.g., every 10 emails)
  - **Time-based**: Rotate after N seconds (e.g., every 30 seconds)
- **Automatic Failover**: Seamless switching when servers fail
- **Load Balancing**: Distribute emails across servers intelligently

### 📊 Real-time Analytics & Tracking
- **Live Progress**: Watch emails being sent with SMTP rotation status
- **Success Metrics**: Track delivery rates per SMTP server
- **Campaign History**: Comprehensive analytics dashboard
- **Failure Analysis**: Detailed error tracking and retry logic
- **Performance Insights**: Server usage statistics and optimization tips

### 🎨 Dual Operation Modes
- **Beautiful Web UI**: Modern interface with drag & drop, real-time updates
- **Advanced Terminal CLI**: Full-featured command-line interface
- **Hybrid Workflow**: Use both modes seamlessly
- **File-based Config**: JSON configuration files for automation

### 🛡️ Professional Features
- **Rate Limiting**: Prevent server overload with smart throttling
- **Compliance Tools**: Built-in CAN-SPAM, GDPR guidelines
- **Security**: Encrypted password handling, secure file uploads
- **Template System**: Reusable email templates with variables
- **Batch Processing**: Handle large recipient lists efficiently

## 🚀 Quick Start Guide

### Method 1: Beautiful Web Interface
```bash
# Start the enhanced web interface
python launch.py

# Custom port and settings
python launch.py --web --port 8080 --no-browser
```

**Web Features:**
- Drag & drop CSV upload
- Real-time SMTP rotation visualization
- Live analytics dashboard
- Interactive campaign builder
- File attachment support

### Method 2: Advanced Terminal CLI
```bash
# Interactive email sending with SMTP rotation
python launch.py --cli send

# Run pre-configured campaign
python launch.py --cli campaign welcome_campaign

# Advanced rotation settings
python launch.py --cli send --rotation-mode time_based --rotation-value 30

# View comprehensive analytics
python launch.py --cli analytics
```

**CLI Features:**
- Interactive prompts with Rich UI
- File-based configuration support
- Advanced SMTP rotation controls
- Real-time progress tracking
- Comprehensive analytics reporting

### Method 3: File-based Automation
```bash
# List available configurations
python launch.py --cli config

# Run campaign with file configs
python launch.py --cli campaign newsletter_monthly --live

# Automated sending with custom settings
python launch.py --cli send --smtp-config "all" --rotation-mode email_count --rotation-value 15
```

## 📁 Enhanced Configuration System

### SMTP Servers (`config/smtp_servers.json`)
```json
{
  "smtp_servers": [
    {
      "name": "Gmail Primary",
      "host": "smtp.gmail.com",
      "port": 587,
      "username": "primary@gmail.com",
      "password": "app-password-1",
      "sender_email": "primary@gmail.com",
      "use_tls": true,
      "enabled": true,
      "max_emails_per_hour": 300,
      "priority": 1
    },
    {
      "name": "Gmail Secondary",
      "host": "smtp.gmail.com",
      "port": 587,
      "username": "secondary@gmail.com",
      "password": "app-password-2",
      "sender_email": "secondary@gmail.com",
      "use_tls": true,
      "enabled": true,
      "max_emails_per_hour": 300,
      "priority": 2
    }
  ],
  "rotation_settings": {
    "default_mode": "email_count",
    "default_emails_per_rotation": 10,
    "default_seconds_per_rotation": 30,
    "enable_failover": true,
    "max_retries_per_server": 3
  }
}
```

### Campaign Settings (`config/campaign_settings.json`)
```json
{
  "campaigns": {
    "welcome_campaign": {
      "name": "New Customer Welcome",
      "smtp_server": "all",
      "email_list": "customers",
      "template": "welcome_email",
      "settings": {
        "rotation_mode": "email_count",
        "rotation_value": 15,
        "delay_between_emails": 2,
        "enable_analytics": true
      }
    }
  }
}
```

### Email Lists (`config/email_lists.json`)
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

## 🔄 SMTP Rotation Explained

### Email Count Rotation
- **How it works**: Rotate after sending N emails
- **Example**: Every 10 emails, switch to next SMTP server
- **Best for**: Consistent load distribution
- **Use case**: Large mailing lists with multiple providers

```bash
python launch.py --cli send --rotation-mode email_count --rotation-value 10
```

### Time-based Rotation
- **How it works**: Rotate after N seconds of usage
- **Example**: Every 30 seconds, switch to next SMTP server
- **Best for**: Rate limiting compliance
- **Use case**: Providers with time-based limits

```bash
python launch.py --cli send --rotation-mode time_based --rotation-value 30
```

## 📊 Analytics Dashboard

### Real-time Metrics
- **Emails Sent**: Live count with success rate
- **SMTP Usage**: Which servers are being used
- **Rotation Count**: How many times servers rotated
- **Failure Analysis**: Detailed error tracking
- **Performance Stats**: Speed and efficiency metrics

### Historical Analytics
```bash
# View comprehensive campaign analytics
python launch.py --cli analytics
```

**Analytics Include:**
- Campaign success rates over time
- SMTP server performance comparison
- Failure patterns and optimization suggestions
- Delivery speed and throughput analysis

## 🖥️ Terminal vs Web Usage

### Use Terminal CLI When:
- ✅ Automating campaigns with scripts
- ✅ Running scheduled campaigns
- ✅ Need detailed analytics output
- ✅ Working with pre-configured files
- ✅ Batch processing large lists

### Use Web Interface When:
- ✅ Interactive campaign building
- ✅ File uploads and management
- ✅ Real-time monitoring
- ✅ Team collaboration
- ✅ Visual analytics review

### Hybrid Workflow:
1. **Setup**: Configure SMTP servers and templates via files
2. **Compose**: Use web UI for email content and recipient upload
3. **Execute**: Run campaigns via terminal for automation
4. **Monitor**: Use web UI for real-time progress tracking
5. **Analyze**: Review results in terminal analytics

## 📈 Performance & Best Practices

### SMTP Rotation Optimization
```json
{
  "rotation_settings": {
    "mode": "email_count",
    "value": 10,
    "delay_between_emails": 1.5,
    "enable_failover": true
  }
}
```

### Rate Limiting Guidelines
- **Gmail**: 300 emails/hour per account
- **Outlook**: 250 emails/hour per account
- **Custom SMTP**: Check with provider
- **Recommended Delay**: 1-3 seconds between emails

### Security Best Practices
- 🔒 Use app passwords for Gmail/Outlook
- 🔒 Store sensitive configs outside version control
- 🔒 Enable TLS for all SMTP connections
- 🔒 Regularly rotate SMTP passwords
- 🔒 Monitor sending reputation

## 🛠 Advanced Configuration

### Environment Variables
```bash
export TERMSENDER_CONFIG_DIR=/path/to/configs
export TERMSENDER_ANALYTICS_DIR=/path/to/analytics
export TERMSENDER_LOGS_DIR=/path/to/logs
```

### Deployment on Replit
```bash
# The project is optimized for Replit deployment
# Simply click "Deploy" in the Replit interface
# Web interface will be available at your Replit domain
```

### Custom SMTP Providers
```json
{
  "name": "SendGrid SMTP",
  "host": "smtp.sendgrid.net",
  "port": 587,
  "username": "apikey",
  "password": "your-sendgrid-api-key",
  "use_tls": true,
  "max_emails_per_hour": 1000
}
```

## 🔍 Troubleshooting

### Common Issues

**SMTP Connection Fails:**
```bash
# Test SMTP configuration
python launch.py --cli send --smtp-config "Gmail Primary"
```

**Analytics Not Showing:**
```bash
# Check analytics directory
ls -la analytics/
# View raw analytics data
cat analytics/campaign_analytics.json
```

**Rotation Not Working:**
- Ensure multiple SMTP servers are enabled
- Check rotation settings in campaign config
- Verify SMTP server connectivity

### Debug Mode
```bash
# Enable verbose logging
python launch.py --cli send --debug
```

## 📞 Support & Documentation

### Command Reference
```bash
# Show all available commands
python launch.py --help

# Command-specific help
python launch.py --cli send --help
python launch.py --cli campaign --help
```

### File Structure
```
termsender-pro/
├── config/                 # Configuration files
│   ├── smtp_servers.json
│   ├── email_lists.json
│   ├── email_templates.json
│   └── campaign_settings.json
├── analytics/              # Analytics data
├── logs/                   # Campaign logs
├── uploads/                # Temporary file uploads
├── static/                 # Web UI assets
├── templates/              # Web UI templates
├── launch.py              # Main launcher
├── termsender.py          # Enhanced CLI
├── app.py                 # Web application
└── config_manager.py      # Configuration manager
```

---

<div align="center">

**TermSender Pro v3.0** - Professional Email Campaign Management
*Built for scale, designed for efficiency, optimized for success*

🌟 **Star this project** • 🐛 **Report issues** • 💡 **Request features**

</div>

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