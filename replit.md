# TermSender Pro - Web-Based Email Campaign Manager

## Overview
TermSender Pro is a sophisticated web-based email campaign management tool designed for ethical bulk email campaigns. It features a modern dark-themed interface that makes email campaign creation effortless while maintaining powerful functionality. Built with Flask backend and a responsive frontend with real-time interactions.

## Recent Changes
- **2025-09-26**: Complete transformation to web-based application
  - Built Flask web application with modern dark-themed UI
  - Created responsive dashboard with navigation sidebar
  - Implemented drag-drop CSV upload and file attachments
  - Added rich text email editor with HTML/plain text modes
  - Built real-time SMTP connection testing
  - Created email validation and recipient management
  - Added campaign launching with progress tracking
  - Implemented compliance modal and notifications system
  - Built file upload system for attachments (PDF, images, documents)

## User Preferences
- Modern web-based interface that's effortless to use yet powerful
- Sophisticated dark-themed UI similar to professional tools
- Emphasis on ethical email sending practices and compliance
- Drag-and-drop functionality for easy file and CSV uploads
- Real-time feedback and validation
- Security-conscious approach (passwords not saved to disk)

## Project Architecture

### Core Components
1. **Flask Web Application**: Modern web server with RESTful API endpoints
2. **Dark-Themed UI**: Professional interface with responsive design
3. **Dashboard System**: Real-time status updates and navigation
4. **SMTP Management**: Interactive configuration with live testing
5. **Recipient System**: Drag-drop CSV upload and manual entry with validation
6. **Rich Text Editor**: HTML/plain text composition with live preview
7. **File Upload System**: Attachment management for PDFs, images, and documents
8. **Campaign Manager**: Email sending with progress tracking and results

### Key Features
- **Interactive SMTP Setup**: Step-by-step configuration with connection testing
- **Email Composition**: Subject and body composition with HTML/plain text support
- **Recipient Management**: CSV import or manual entry with validation
- **Progress Tracking**: Real-time progress bars during email sending
- **Dry-Run Mode**: Test functionality without actually sending emails
- **Error Handling**: Comprehensive error tracking and reporting
- **Compliance**: Built-in warnings and ethical usage prompts

### File Structure
```
├── app.py                     # Flask web application
├── termsender.py             # Original CLI version (legacy)
├── templates/
│   └── index.html            # Main web interface
├── static/
│   ├── css/
│   │   └── style.css         # Dark-themed styling
│   └── js/
│       └── app.js            # Frontend JavaScript
├── uploads/                  # File upload directory
├── sample_recipients.csv     # Sample CSV file for testing
└── replit.md                # Project documentation
```

### Dependencies
- **typer**: CLI framework for command-line interface
- **rich**: Terminal UI library for colorful panels and progress bars
- **pandas**: Data manipulation for CSV processing
- **email-validator**: Email address validation
- **validators**: Additional validation utilities

### Usage
```bash
# Start the web application
python app.py

# Access the web interface at:
# http://localhost:5000
```

### Web Interface Features
- **Dashboard**: Overview of campaign status with interactive cards
- **SMTP Config**: Easy server setup with live connection testing
- **Recipients**: Drag-drop CSV upload and manual email entry
- **Compose**: Rich text editor with HTML/plain text modes and live preview
- **Attachments**: File upload system supporting PDFs, images, and documents
- **Launch**: Campaign summary and sending with progress tracking

### CSV Format
The application expects CSV files with an 'email' column:
```csv
email,name,company
user@example.com,John Doe,Company Name
```

## Current State
The TermSender MVP is complete and functional with all core features implemented:
- ✅ Interactive SMTP configuration
- ✅ Email content composition
- ✅ Recipient management (CSV/manual)
- ✅ Email validation and deduplication
- ✅ Progress tracking and error handling
- ✅ Dry-run mode for testing
- ✅ Compliance warnings

The application is ready for use and can be extended with additional features like multi-SMTP rotation, HTML templates, file attachments, and advanced analytics.