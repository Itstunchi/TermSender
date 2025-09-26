#!/usr/bin/env python3
"""
TermSender Web Application
Professional email sender with sophisticated web interface
"""

import os
import json
import smtplib
import time
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Optional
import tempfile
import uuid

from flask import Flask, render_template, request, jsonify, session, send_file
from werkzeug.utils import secure_filename
import pandas as pd
from email_validator import validate_email, EmailNotValidError
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders

# Import our classes
from config_manager import config_manager

app = Flask(__name__)
app.secret_key = os.environ.get('SESSION_SECRET', 'dev-secret-key-change-in-production')
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max file size

# Configuration
UPLOAD_FOLDER = Path('uploads')
UPLOAD_FOLDER.mkdir(exist_ok=True)
ALLOWED_EXTENSIONS = {'txt', 'csv', 'pdf', 'png', 'jpg', 'jpeg', 'gif', 'doc', 'docx'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def validate_email_address(email):
    """Validate email address"""
    try:
        validate_email(email)
        return True
    except EmailNotValidError:
        return False

class WebEmailSender:
    """Web-optimized email sender with progress callbacks"""

    def __init__(self, smtp_config: dict):
        self.smtp_config = smtp_config
        self.progress_callback = None

    def send_emails_async(self, content: dict, recipients: List[str], attachments: List[str] = None, dry_run: bool = False):
        """Send emails with progress updates"""
        results = {
            "sent": 0,
            "failed": 0,
            "failed_recipients": [],
            "start_time": datetime.now().isoformat(),
            "total": len(recipients),
            "dry_run": dry_run
        }

        if dry_run:
            for i, recipient in enumerate(recipients):
                results["sent"] = i + 1
                time.sleep(0.1)  # Simulate processing
            results["end_time"] = datetime.now().isoformat()
            return results

        try:
            # Connect to SMTP server
            server = smtplib.SMTP(self.smtp_config['host'], self.smtp_config['port'])
            if self.smtp_config.get('use_tls', True):
                server.starttls()
            server.login(self.smtp_config['username'], self.smtp_config['password'])

            for i, recipient in enumerate(recipients):
                try:
                    # Create message
                    msg = MIMEMultipart()
                    msg['From'] = self.smtp_config['sender_email']
                    msg['To'] = recipient
                    msg['Subject'] = content['subject']

                    # Add body
                    body_type = 'html' if content.get('is_html', False) else 'plain'
                    msg.attach(MIMEText(content['body'], body_type))

                    # Add attachments
                    if attachments:
                        for attachment_path in attachments:
                            if os.path.exists(attachment_path):
                                with open(attachment_path, "rb") as attachment:
                                    part = MIMEBase('application', 'octet-stream')
                                    part.set_payload(attachment.read())

                                encoders.encode_base64(part)
                                part.add_header(
                                    'Content-Disposition',
                                    f'attachment; filename= {os.path.basename(attachment_path)}'
                                )
                                msg.attach(part)

                    # Send email
                    server.sendmail(
                        self.smtp_config['sender_email'],
                        recipient,
                        msg.as_string()
                    )

                    results["sent"] += 1
                    time.sleep(1)  # Rate limiting

                except Exception as e:
                    results["failed"] += 1
                    results["failed_recipients"].append({"email": recipient, "error": str(e)})

            server.quit()
            results["end_time"] = datetime.now().isoformat()

        except Exception as e:
            results["smtp_error"] = str(e)
            results["end_time"] = datetime.now().isoformat()

        return results

# Routes
@app.route('/')
def index():
    """Main dashboard"""
    system_status = config_manager.get_system_status()
    return render_template('index.html', system_status=system_status)

@app.route('/api/test-smtp', methods=['POST'])
def test_smtp():
    """Test SMTP connection"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "message": "No data provided"})

        server = smtplib.SMTP(data['host'], data['port'])
        if data.get('use_tls', True):
            server.starttls()
        server.login(data['username'], data['password'])
        server.quit()
        return jsonify({"success": True, "message": "SMTP connection successful!"})
    except Exception as e:
        return jsonify({"success": False, "message": f"SMTP connection failed: {str(e)}"})

@app.route('/api/validate-emails', methods=['POST'])
def validate_emails():
    """Validate email addresses"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "message": "No data provided"})

        emails = data.get('emails', [])

        valid_emails = []
        invalid_emails = []

        for email in emails:
            email = email.strip().lower()
            if validate_email_address(email):
                if email not in [e['email'] for e in valid_emails]:  # Deduplicate
                    valid_emails.append({
                        "email": email,
                        "status": "valid"
                    })
            else:
                invalid_emails.append({
                    "email": email,
                    "status": "invalid"
                })

        return jsonify({
            "success": True,
            "valid_emails": valid_emails,
            "invalid_emails": invalid_emails,
            "total_valid": len(valid_emails),
            "total_invalid": len(invalid_emails)
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

@app.route('/api/upload-csv', methods=['POST'])
def upload_csv():
    """Upload and process CSV file"""
    try:
        if 'file' not in request.files:
            return jsonify({"success": False, "message": "No file uploaded"})

        file = request.files['file']
        if file.filename == '':
            return jsonify({"success": False, "message": "No file selected"})

        if file and file.filename and allowed_file(file.filename):
            filename = secure_filename(file.filename)
            filepath = UPLOAD_FOLDER / filename
            file.save(filepath)

            # Process CSV
            df = pd.read_csv(filepath)

            # Find email columns
            email_columns = [col for col in df.columns if 'email' in col.lower()]
            if not email_columns:
                return jsonify({"success": False, "message": "No email column found in CSV"})

            email_col = email_columns[0]
            raw_emails = df[email_col].dropna().astype(str).tolist()

            # Also extract other useful columns
            other_data = []
            for _, row in df.iterrows():
                email = str(row[email_col]).strip().lower()
                if validate_email_address(email):
                    row_data = {"email": email}
                    for col in df.columns:
                        if col != email_col:
                            row_data[col] = str(row[col]) if pd.notna(row[col]) else ""
                    other_data.append(row_data)

            # Clean up file
            os.remove(filepath)

            return jsonify({
                "success": True,
                "message": f"Successfully processed {len(other_data)} valid emails",
                "emails": other_data,
                "total_processed": len(raw_emails),
                "total_valid": len(other_data)
            })

        return jsonify({"success": False, "message": "Invalid file type"})

    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

@app.route('/api/upload-attachment', methods=['POST'])
def upload_attachment():
    """Upload attachment files"""
    try:
        if 'file' not in request.files:
            return jsonify({"success": False, "message": "No file uploaded"})

        file = request.files['file']
        if file.filename == '':
            return jsonify({"success": False, "message": "No file selected"})

        if file and file.filename and allowed_file(file.filename):
            # Generate unique filename
            file_id = str(uuid.uuid4())
            filename = secure_filename(file.filename)
            new_filename = f"{file_id}_{filename}"
            filepath = UPLOAD_FOLDER / new_filename
            file.save(filepath)

            file_info = {
                "id": file_id,
                "original_name": filename,
                "stored_name": new_filename,
                "size": os.path.getsize(filepath),
                "path": str(filepath)
            }

            return jsonify({
                "success": True,
                "message": "File uploaded successfully",
                "file": file_info
            })

        return jsonify({"success": False, "message": "Invalid file type"})

    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

@app.route('/api/send-emails', methods=['POST'])
def send_emails():
    """Send emails to recipients"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "message": "No data provided"})

        # Validate required data
        smtp_config = data.get('smtp_config')
        content = data.get('content')
        recipients = data.get('recipients', [])
        attachments = data.get('attachments', [])
        dry_run = data.get('dry_run', False)

        if not smtp_config or not content or not recipients:
            return jsonify({"success": False, "message": "Missing required data"})

        # Create sender
        sender = WebEmailSender(smtp_config)

        # Prepare attachment paths
        attachment_paths = []
        for attachment in attachments:
            file_path = UPLOAD_FOLDER / attachment['stored_name']
            if file_path.exists():
                attachment_paths.append(str(file_path))

        # Send emails
        results = sender.send_emails_async(
            content=content,
            recipients=[r['email'] for r in recipients],
            attachments=attachment_paths,
            dry_run=dry_run
        )

        return jsonify({
            "success": True,
            "results": results
        })

    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

@app.route('/api/cleanup-files', methods=['POST'])
def cleanup_files():
    """Clean up uploaded files"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "message": "No data provided"})

        file_ids = data.get('file_ids', [])

        for file_id in file_ids:
            # Find and remove files with this ID
            for file_path in UPLOAD_FOLDER.glob(f"{file_id}_*"):
                if file_path.exists():
                    os.remove(file_path)

        return jsonify({"success": True, "message": "Files cleaned up"})

    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)