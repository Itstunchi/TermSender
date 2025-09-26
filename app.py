#!/usr/bin/env python3
"""
TermSender Pro Web Application
Professional email sender with SMTP rotation and advanced analytics
"""

import os
import json
import smtplib
import time
import threading
from datetime import datetime, timedelta
from pathlib import Path
from typing import List, Dict, Optional
import tempfile
import uuid
import glob # Import glob module for file searching

from flask import Flask, render_template, request, jsonify, session, send_file
from werkzeug.utils import secure_filename
import pandas as pd
from email_validator import validate_email, EmailNotValidError
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders

# Import our enhanced classes
from config_manager import config_manager
from termsender import SMTPRotationManager, AnalyticsManager, SMTPServer

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
    """Web-optimized email sender with SMTP rotation"""

    def __init__(self, smtp_configs: List[dict], rotation_mode: str = "email_count", rotation_value: int = 10):
        # Convert dicts to SMTPServer objects
        smtp_servers = []
        for config in smtp_configs:
            server = SMTPServer(
                name=config['name'],
                host=config['host'],
                port=config['port'],
                username=config['username'],
                password=config['password'],
                sender_email=config['sender_email'],
                use_tls=config.get('use_tls', True),
                enabled=config.get('enabled', True)
            )
            smtp_servers.append(server)

        self.smtp_manager = SMTPRotationManager(smtp_servers, rotation_mode, rotation_value)
        self.analytics = AnalyticsManager()

    def send_emails_async(self, content: dict, recipients: List[str], attachments: List[str] = None,
                         dry_run: bool = False, progress_callback=None):
        """Send emails with SMTP rotation and progress updates"""

        campaign_id = f"web_campaign_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        stats = self.analytics.start_campaign(campaign_id, len(recipients))

        results = {
            "sent": 0,
            "failed": 0,
            "failed_recipients": [],
            "start_time": datetime.now().isoformat(),
            "total": len(recipients),
            "dry_run": dry_run,
            "smtp_rotations": 0,
            "smtp_usage": {},
            "current_smtp": ""
        }

        if dry_run:
            for i, recipient in enumerate(recipients):
                # Simulate SMTP rotation for demo
                if self.smtp_manager.should_rotate():
                    server = self.smtp_manager.rotate_server()
                    results["smtp_rotations"] += 1
                    results["current_smtp"] = server.name

                current_server = self.smtp_manager.get_current_server()
                results["current_smtp"] = current_server.name

                # Update usage stats
                if current_server.name not in results["smtp_usage"]:
                    results["smtp_usage"][current_server.name] = 0
                results["smtp_usage"][current_server.name] += 1

                self.smtp_manager.record_email_sent()
                results["sent"] = i + 1
                time.sleep(0.1)  # Simulate processing

                if progress_callback:
                    progress_callback(results)

            results["end_time"] = datetime.now().isoformat()
            self.analytics.end_campaign()
            return results

        try:
            for i, recipient in enumerate(recipients):
                try:
                    # Check if we should rotate SMTP servers
                    if self.smtp_manager.should_rotate():
                        new_server = self.smtp_manager.rotate_server()
                        results["smtp_rotations"] += 1
                        results["current_smtp"] = new_server.name
                        self.analytics.record_smtp_rotation()

                    current_server = self.smtp_manager.get_current_server()
                    results["current_smtp"] = current_server.name

                    # Get SMTP connection
                    server_connection = self.smtp_manager.get_server_connection(current_server)

                    # Create message
                    msg = MIMEMultipart()
                    msg['From'] = current_server.sender_email
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
                    server_connection.sendmail(
                        current_server.sender_email,
                        recipient,
                        msg.as_string()
                    )

                    # Record success
                    self.smtp_manager.record_email_sent()
                    self.analytics.record_email_sent(current_server.name)
                    results["sent"] += 1

                    # Update usage stats
                    if current_server.name not in results["smtp_usage"]:
                        results["smtp_usage"][current_server.name] = 0
                    results["smtp_usage"][current_server.name] += 1

                    time.sleep(1)  # Rate limiting

                except Exception as e:
                    current_server = self.smtp_manager.get_current_server()
                    self.analytics.record_email_failed(recipient, str(e), current_server.name)
                    results["failed"] += 1
                    results["failed_recipients"].append({"email": recipient, "error": str(e)})

                # Update progress
                if progress_callback:
                    progress_callback(results)

            # Cleanup connections
            self.smtp_manager.cleanup_connections()
            results["end_time"] = datetime.now().isoformat()
            self.analytics.end_campaign()

        except Exception as e:
            results["smtp_error"] = str(e)
            results["end_time"] = datetime.now().isoformat()

        return results

# Routes
@app.route('/')
def index():
    """Main dashboard with enhanced analytics"""
    system_status = config_manager.get_system_status()

    # Load recent analytics
    analytics_file = Path("analytics/campaign_analytics.json")
    recent_campaigns = []
    if analytics_file.exists():
        with open(analytics_file, 'r') as f:
            all_campaigns = json.load(f)
            recent_campaigns = all_campaigns[-5:]  # Last 5 campaigns

    system_status['recent_campaigns'] = recent_campaigns
    return render_template('index.html', system_status=system_status)

@app.route('/api/test-smtp', methods=['POST'])
def test_smtp():
    """Test SMTP connection with rotation support"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "message": "No data provided"})

        # Test single server or multiple servers
        if isinstance(data, list):
            # Multiple servers
            results = []
            for server_config in data:
                try:
                    server = smtplib.SMTP(server_config['host'], server_config['port'])
                    if server_config.get('use_tls', True):
                        server.starttls()
                    server.login(server_config['username'], server_config['password'])
                    server.quit()
                    results.append({"server": server_config['name'], "status": "success"})
                except Exception as e:
                    results.append({"server": server_config['name'], "status": "failed", "error": str(e)})

            return jsonify({"success": True, "results": results})
        else:
            # Single server
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
    """Validate email addresses with enhanced feedback"""
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
                        "status": "valid",
                        "domain": email.split('@')[1] if '@' in email else ""
                    })
            else:
                invalid_emails.append({
                    "email": email,
                    "status": "invalid",
                    "reason": "Invalid format"
                })

        return jsonify({
            "success": True,
            "valid_emails": valid_emails,
            "invalid_emails": invalid_emails,
            "total_valid": len(valid_emails),
            "total_invalid": len(invalid_emails),
            "duplicate_count": len(emails) - len(valid_emails) - len(invalid_emails)
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

@app.route('/api/send-emails', methods=['POST'])
def send_emails():
    """Send emails with SMTP rotation and real-time progress"""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"success": False, "message": "No data provided"})

        # Validate required data
        smtp_configs = data.get('smtp_configs', [])
        content = data.get('content')
        recipients = data.get('recipients', [])
        attachments = data.get('attachments', [])
        dry_run = data.get('dry_run', False)

        # Rotation settings
        rotation_mode = data.get('rotation_mode', 'email_count')
        rotation_value = data.get('rotation_value', 10)
        delay_between_emails = data.get('delay_between_emails', 1)
        batch_size = data.get('batch_size', 50)
        max_retries = data.get('max_retries', 3)

        # Detailed validation
        if not smtp_configs:
            return jsonify({"success": False, "message": "No SMTP servers configured"})

        if not content or not content.get('subject') or not content.get('body'):
            return jsonify({"success": False, "message": "Email content is incomplete"})

        if not recipients:
            return jsonify({"success": False, "message": "No recipients provided"})

        # Filter enabled SMTP servers
        enabled_configs = [config for config in smtp_configs if config.get('enabled', True)]
        if not enabled_configs:
            return jsonify({"success": False, "message": "No enabled SMTP servers found"})

        # Create sender with rotation
        sender = WebEmailSender(enabled_configs, rotation_mode, rotation_value)

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
            "results": results,
            "message": f"Campaign completed: {results['sent']} sent, {results['failed']} failed"
        })

    except Exception as e:
        import traceback
        print(f"Send emails error: {str(e)}")
        print(traceback.format_exc())
        return jsonify({"success": False, "message": f"Server error: {str(e)}"})

@app.route('/api/analytics', methods=['GET'])
def get_analytics():
    """Get comprehensive analytics data"""
    try:
        analytics_file = Path("analytics/campaign_analytics.json")

        if not analytics_file.exists():
            return jsonify({
                "success": True,
                "data": {
                    "total_campaigns": 0,
                    "total_emails_sent": 0,
                    "total_emails_failed": 0,
                    "average_success_rate": 0,
                    "recent_campaigns": [],
                    "smtp_usage_summary": {}
                }
            })

        with open(analytics_file, 'r') as f:
            campaigns = json.load(f)

        # Calculate summary statistics
        total_campaigns = len(campaigns)
        total_emails_sent = sum(c.get('emails_sent', 0) for c in campaigns)
        total_emails_failed = sum(c.get('emails_failed', 0) for c in campaigns)

        success_rates = [c.get('success_rate', 0) for c in campaigns if c.get('success_rate') is not None]
        average_success_rate = sum(success_rates) / len(success_rates) if success_rates else 0

        # SMTP usage summary
        smtp_usage_summary = {}
        for campaign in campaigns:
            smtp_usage = campaign.get('smtp_usage', {})
            for smtp_name, count in smtp_usage.items():
                if smtp_name not in smtp_usage_summary:
                    smtp_usage_summary[smtp_name] = 0
                smtp_usage_summary[smtp_name] += count

        return jsonify({
            "success": True,
            "data": {
                "total_campaigns": total_campaigns,
                "total_emails_sent": total_emails_sent,
                "total_emails_failed": total_emails_failed,
                "average_success_rate": round(average_success_rate, 2),
                "recent_campaigns": campaigns[-10:],  # Last 10 campaigns
                "smtp_usage_summary": smtp_usage_summary
            }
        })

    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

@app.route('/api/config/smtp-servers', methods=['GET'])
def get_smtp_servers():
    """Get configured SMTP servers"""
    try:
        smtp_servers = config_manager.get_smtp_servers()
        return jsonify({
            "success": True,
            "smtp_servers": smtp_servers
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

@app.route('/api/config/email-lists', methods=['GET'])
def get_email_lists():
    """Get available email lists"""
    try:
        email_lists = config_manager.get_email_lists()
        return jsonify({
            "success": True,
            "email_lists": email_lists
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

@app.route('/api/config/templates', methods=['GET'])
def get_templates():
    """Get email templates"""
    try:
        templates = config_manager.get_email_templates()
        return jsonify({
            "success": True,
            "templates": templates
        })
    except Exception as e:
        return jsonify({"success": False, "message": str(e)})

@app.route('/api/upload-csv', methods=['POST'])
def upload_csv():
    """Upload and process CSV file with enhanced validation"""
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

            # Process CSV with enhanced validation
            df = pd.read_csv(filepath)

            # Find email columns
            email_columns = [col for col in df.columns if 'email' in col.lower()]
            if not email_columns:
                return jsonify({"success": False, "message": "No email column found in CSV"})

            email_col = email_columns[0]
            raw_emails = df[email_col].dropna().astype(str).tolist()

            # Enhanced processing with domain analysis
            processed_data = []
            domains = {}

            for _, row in df.iterrows():
                email = str(row[email_col]).strip().lower()
                if validate_email_address(email):
                    row_data = {"email": email}
                    # Add other columns as additional data
                    for col in df.columns:
                        if col != email_col:
                            row_data[col] = str(row[col]) if pd.notna(row[col]) else ""

                    # Track domains
                    domain = email.split('@')[1] if '@' in email else 'unknown'
                    domains[domain] = domains.get(domain, 0) + 1

                    processed_data.append(row_data)

            # Clean up file
            os.remove(filepath)

            return jsonify({
                "success": True,
                "message": f"Successfully processed {len(processed_data)} valid emails",
                "emails": processed_data,
                "total_processed": len(raw_emails),
                "total_valid": len(processed_data),
                "domain_breakdown": domains,
                "columns_found": list(df.columns)
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

@app.route('/api/cleanup-files', methods=['POST'])
def cleanup_files():
    try:
        data = request.get_json()
        file_ids = data.get('file_ids', [])

        # Clean up specified files
        for file_id in file_ids:
            file_path = os.path.join(UPLOAD_FOLDER, f"{file_id}_*")
            for file in glob.glob(file_path):
                try:
                    os.remove(file)
                except OSError:
                    pass

        return jsonify({'success': True, 'message': 'Files cleaned up'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/get-smtp-servers', methods=['GET'])
def get_smtp_servers():
    try:
        smtp_file = os.path.join('config', 'smtp_servers.json')
        if os.path.exists(smtp_file):
            with open(smtp_file, 'r') as f:
                data = json.load(f)
                return jsonify({'success': True, 'servers': data.get('smtp_servers', [])})
        return jsonify({'success': True, 'servers': []})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/save-smtp-servers', methods=['POST'])
def save_smtp_servers():
    try:
        data = request.get_json()
        servers = data.get('servers', [])

        smtp_file = os.path.join('config', 'smtp_servers.json')
        os.makedirs('config', exist_ok=True)

        # Load existing config or create new one
        config_data = {'smtp_servers': servers, 'rotation_settings': {}}
        if os.path.exists(smtp_file):
            with open(smtp_file, 'r') as f:
                existing_data = json.load(f)
                config_data['rotation_settings'] = existing_data.get('rotation_settings', {})

        with open(smtp_file, 'w') as f:
            json.dump(config_data, f, indent=2)

        return jsonify({'success': True, 'message': 'SMTP servers saved'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/get-rotation-settings', methods=['GET'])
def get_rotation_settings():
    try:
        smtp_file = os.path.join('config', 'smtp_servers.json')
        if os.path.exists(smtp_file):
            with open(smtp_file, 'r') as f:
                data = json.load(f)
                return jsonify({'success': True, 'settings': data.get('rotation_settings', {})})
        return jsonify({'success': True, 'settings': {}})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

@app.route('/api/save-rotation-settings', methods=['POST'])
def save_rotation_settings():
    try:
        data = request.get_json()
        settings = data.get('settings', {})

        smtp_file = os.path.join('config', 'smtp_servers.json')
        os.makedirs('config', exist_ok=True)

        # Load existing config or create new one
        config_data = {'smtp_servers': [], 'rotation_settings': settings}
        if os.path.exists(smtp_file):
            with open(smtp_file, 'r') as f:
                existing_data = json.load(f)
                config_data['smtp_servers'] = existing_data.get('smtp_servers', [])

        with open(smtp_file, 'w') as f:
            json.dump(config_data, f, indent=2)

        return jsonify({'success': True, 'message': 'Rotation settings saved'})
    except Exception as e:
        return jsonify({'success': False, 'message': str(e)}), 500

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)