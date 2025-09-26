#!/usr/bin/env python3
"""
TermSender Pro Launcher
Supports both web UI and file-based campaign execution
"""

import argparse
import sys
import os
from pathlib import Path
from typing import Optional
import webbrowser
import time

from config_manager import config_manager

def launch_web_ui(host='0.0.0.0', port=5000, auto_open=True):
    """Launch the web UI"""
    print("🚀 Starting TermSender Pro Web Interface...")
    print(f"📡 Server will be accessible at: http://localhost:{port}")
    print("🎨 Beautiful dark-themed interface loading...")
    print("⚡ File-based configuration support enabled")
    print("🔒 Compliance and security features active")
    print("\n" + "="*60)
    
    if auto_open and port == 5000:
        # Open browser after a short delay
        import threading
        def open_browser():
            time.sleep(2)
            webbrowser.open(f'http://localhost:{port}')
        
        browser_thread = threading.Thread(target=open_browser)
        browser_thread.daemon = True
        browser_thread.start()
    
    # Import and run the app
    try:
        from app import app
        app.run(host=host, port=port, debug=False)
    except ImportError as e:
        print(f"❌ Error importing app: {e}")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error starting web server: {e}")
        sys.exit(1)

def run_campaign_from_file(campaign_name: str, dry_run: bool = True):
    """Run a campaign from file configuration"""
    print(f"🎯 Running campaign: {campaign_name}")
    print(f"🧪 Mode: {'Dry Run (Test)' if dry_run else 'Live Send'}")
    print("="*50)
    
    try:
        # Get campaign configuration
        campaign = config_manager.get_campaign(campaign_name)
        if not campaign:
            print(f"❌ Campaign '{campaign_name}' not found")
            print("📋 Available campaigns:")
            campaigns = config_manager.get_campaigns()
            for name in campaigns.keys():
                print(f"  - {name}")
            return False
        
        print(f"📧 Campaign: {campaign.get('name', campaign_name)}")
        
        # Get SMTP configuration
        smtp_server_name = campaign.get('smtp_server')
        smtp_servers = config_manager.get_smtp_servers()
        smtp_config = None
        
        for server in smtp_servers:
            if server.get('name') == smtp_server_name:
                smtp_config = server
                break
        
        if not smtp_config:
            print(f"❌ SMTP server '{smtp_server_name}' not found")
            return False
        
        print(f"📮 SMTP: {smtp_config.get('host')} ({smtp_config.get('name')})")
        
        # Get email list
        email_list_name = campaign.get('email_list')
        recipients = config_manager.get_email_list(email_list_name)
        
        if not recipients:
            print(f"❌ Email list '{email_list_name}' not found or empty")
            return False
        
        print(f"👥 Recipients: {len(recipients)} emails from '{email_list_name}' list")
        
        # Get template
        template_name = campaign.get('template')
        template = config_manager.get_email_template(template_name)
        
        if not template:
            print(f"❌ Template '{template_name}' not found")
            return False
        
        print(f"📝 Template: {template_name}")
        print(f"📋 Subject: {template.get('subject')}")
        
        # Initialize EmailSender for live mode
        if not dry_run:
            from termsender import SMTPConfig, EmailSender, EmailContent, EmailValidator
            
            # Create SMTP configuration
            smtp_config = SMTPConfig(
                host=smtp_config['host'],
                port=smtp_config['port'],
                username=smtp_config['username'],
                password=smtp_config['password'],
                use_tls=smtp_config.get('use_tls', True)
            )
            
            # Create email sender
            email_sender = EmailSender(smtp_config)
            
            # Test SMTP connection
            print("🔗 Testing SMTP connection...")
            try:
                email_sender.test_connection()
                print("✅ SMTP connection successful")
            except Exception as e:
                print(f"❌ SMTP connection failed: {e}")
                return False
        
        # Execute campaign
        print("\n🎬 Starting campaign execution...")
        
        sent_count = 0
        failed_count = 0
        failed_recipients = []
        
        for i, recipient in enumerate(recipients, 1):
            email = recipient.get('email', 'unknown')
            
            if dry_run:
                print(f"  {i:3d}. 🧪 Would send to: {email}")
                sent_count += 1
            else:
                try:
                    # Merge recipient data with template variables
                    render_vars = template_variables.copy()
                    render_vars.update(recipient)
                    
                    # Render template
                    rendered_template = config_manager.render_template(template_name, render_vars)
                    if not rendered_template:
                        raise Exception("Template rendering failed")
                    
                    # Create email content
                    email_content = EmailContent(
                        subject=rendered_template['subject'],
                        body=rendered_template['body'],
                        is_html=rendered_template.get('is_html', False)
                    )
                    
                    # Set sender email
                    sender_email = smtp_config.get('sender_email', smtp_config['username'])
                    
                    # Send email
                    print(f"  {i:3d}. 📧 Sending to: {email}")
                    email_sender.send_email(sender_email, [email], email_content)
                    sent_count += 1
                    
                    # Add delay between emails
                    campaign_settings = campaign.get('settings', {})
                    delay = campaign_settings.get('delay_between_emails', 1)
                    if delay > 0 and i < len(recipients):
                        time.sleep(delay)
                    
                except Exception as e:
                    print(f"  {i:3d}. ❌ Failed to send to {email}: {str(e)}")
                    failed_count += 1
                    failed_recipients.append({
                        "email": email,
                        "error": str(e)
                    })
            
            # Add small delay for display
            time.sleep(0.1)
        
        print(f"\n✅ Campaign completed!")
        print(f"📊 Results: {sent_count} sent, {failed_count} failed")
        
        if failed_count > 0:
            print(f"\n❌ Failed Recipients ({failed_count}):")
            for failed in failed_recipients[:5]:  # Show first 5 failures
                print(f"  - {failed['email']}: {failed['error']}")
            if len(failed_recipients) > 5:
                print(f"  ... and {len(failed_recipients) - 5} more")
        
        if dry_run:
            print("🧪 This was a test run - no emails were actually sent")
        else:
            print("📧 Live campaign completed - emails were sent to recipients")
        
        return True
        
    except Exception as e:
        print(f"❌ Error running campaign: {e}")
        return False

def list_configurations():
    """List all available configurations"""
    print("📋 TermSender Pro Configuration Overview")
    print("="*50)
    
    # SMTP Servers
    smtp_servers = config_manager.get_smtp_servers()
    print(f"\n📮 SMTP Servers ({len(smtp_servers)}):")
    for server in smtp_servers:
        status = "✅ Enabled" if server.get('enabled') else "⭕ Disabled"
        print(f"  - {server.get('name', 'Unnamed')} ({server.get('host')}) [{status}]")
    
    # Email Lists
    email_lists = config_manager.get_email_lists()
    print(f"\n👥 Email Lists ({len(email_lists)}):")
    for list_name, emails in email_lists.items():
        print(f"  - {list_name}: {len(emails)} recipients")
    
    # Templates
    templates = config_manager.get_email_templates()
    print(f"\n📝 Email Templates ({len(templates)}):")
    for template_name, template in templates.items():
        print(f"  - {template_name}: \"{template.get('subject', 'No subject')}\"")
    
    # Campaigns
    campaigns = config_manager.get_campaigns()
    print(f"\n🎯 Campaigns ({len(campaigns)}):")
    for campaign_name, campaign in campaigns.items():
        print(f"  - {campaign_name}: {campaign.get('name', 'Unnamed campaign')}")
    
    # System Status
    status = config_manager.get_system_status()
    print(f"\n📊 System Status:")
    print(f"  - SMTP Configured: {'✅ Yes' if status['smtp_configured'] else '❌ No'}")
    print(f"  - Total Recipients: {status['total_recipients']}")
    print(f"  - Config Files: {'✅ Complete' if status['config_files_exist'] else '❌ Missing'}")

def main():
    """Main launcher function"""
    parser = argparse.ArgumentParser(
        description="TermSender Pro - Professional Email Campaign Manager",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  python launch.py                           # Start web UI
  python launch.py --web --port 8080         # Start web UI on port 8080
  python launch.py --campaign welcome_campaign --dry-run  # Test campaign
  python launch.py --campaign welcome_campaign --live     # Run campaign live
  python launch.py --list                    # Show all configurations
  
File-based Configuration:
  Edit files in the 'config/' directory to pre-configure:
  - config/smtp_servers.json     # SMTP server settings
  - config/email_lists.json      # Email recipient lists  
  - config/email_templates.json  # Email templates
  - config/campaign_settings.json # Campaign configurations
        """
    )
    
    # Mode selection
    mode_group = parser.add_mutually_exclusive_group()
    mode_group.add_argument('--web', action='store_true', default=True,
                          help='Start web UI (default)')
    mode_group.add_argument('--campaign', type=str,
                          help='Run a specific campaign from file configuration')
    mode_group.add_argument('--list', action='store_true',
                          help='List all available configurations')
    
    # Web UI options
    parser.add_argument('--host', default='0.0.0.0',
                       help='Host to bind web server (default: 0.0.0.0)')
    parser.add_argument('--port', type=int, default=5000,
                       help='Port for web server (default: 5000)')
    parser.add_argument('--no-browser', action='store_true',
                       help="Don't automatically open browser")
    
    # Campaign options
    campaign_group = parser.add_mutually_exclusive_group()
    campaign_group.add_argument('--dry-run', action='store_true', default=True,
                               help='Test campaign without sending (default)')
    campaign_group.add_argument('--live', action='store_true',
                               help='Run campaign and actually send emails')
    
    args = parser.parse_args()
    
    # Print banner
    print("\n" + "="*60)
    print("  TermSender Pro - Professional Email Campaign Manager")
    print("  🎨 Beautiful Web UI + 📁 File-based Configuration")
    print("="*60)
    
    # Execute based on mode
    if args.list:
        list_configurations()
    elif args.campaign:
        dry_run = not args.live  # Default to dry-run unless --live specified
        success = run_campaign_from_file(args.campaign, dry_run)
        sys.exit(0 if success else 1)
    else:
        # Default to web UI
        auto_open = not args.no_browser
        launch_web_ui(args.host, args.port, auto_open)

if __name__ == '__main__':
    main()