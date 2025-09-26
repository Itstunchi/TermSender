# TermSender - Professional Terminal Email Sender

## Overview
TermSender is a Python-based terminal email sender tool designed for ethical bulk email campaigns. It features an interactive CLI interface with colorful panels and progress tracking, built using the Rich library for beautiful terminal UI and Typer for command-line interface management.

## Recent Changes
- **2025-09-26**: Initial implementation of TermSender MVP
  - Created main application with interactive CLI using Rich and Typer
  - Implemented SMTP configuration with connection testing
  - Added email content composition with plain text and HTML support
  - Built recipient management with CSV import and manual entry
  - Integrated email validation and deduplication
  - Added progress tracking and real-time sending feedback
  - Implemented dry-run mode for testing without sending
  - Created compliance warnings and ethical usage prompts

## User Preferences
- Interactive terminal interface preferred over command-line arguments
- Emphasis on ethical email sending practices and compliance
- Clean, professional UI with color-coded panels and progress bars
- Security-conscious approach (passwords not saved to disk)

## Project Architecture

### Core Components
1. **SMTPConfig Class**: Manages SMTP server configuration and connection testing
2. **EmailContent Class**: Handles email composition with preview functionality
3. **RecipientManager Class**: Manages recipient loading from CSV or manual entry
4. **EmailValidator Class**: Validates and cleans email addresses
5. **EmailSender Class**: Handles the actual email sending with progress tracking

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
├── termsender.py           # Main application file
├── sample_recipients.csv   # Sample CSV file for testing
├── replit.md              # Project documentation
└── logs/                  # Log directory (created when needed)
```

### Dependencies
- **typer**: CLI framework for command-line interface
- **rich**: Terminal UI library for colorful panels and progress bars
- **pandas**: Data manipulation for CSV processing
- **email-validator**: Email address validation
- **validators**: Additional validation utilities

### Usage
```bash
# Start the interactive email sender
python termsender.py send

# Show version information
python termsender.py version

# Show help
python termsender.py --help
```

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