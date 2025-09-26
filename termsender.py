#!/usr/bin/env python3
"""
TermSender - Professional Terminal Email Sender Tool
A Python-based CLI email sender with interactive interface for ethical bulk email campaigns.
"""

import smtplib
import os
import json
import csv
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.mime.base import MIMEBase
from email import encoders
from pathlib import Path
from typing import List, Dict, Optional
import time
from datetime import datetime

import typer
from rich.console import Console
from rich.panel import Panel
from rich.prompt import Prompt, Confirm, IntPrompt
from rich.table import Table
from rich.progress import Progress, TaskID
from rich.text import Text
import pandas as pd
from email_validator import validate_email, EmailNotValidError

# Initialize Typer app and Rich console
app = typer.Typer(
    name="TermSender",
    help="Professional terminal email sender tool for ethical bulk email campaigns",
    rich_markup_mode="rich"
)
console = Console()

# Configuration file path
CONFIG_FILE = Path("termsender_config.json")
LOGS_DIR = Path("logs")

class EmailValidator:
    """Email validation utility class"""
    
    @staticmethod
    def is_valid_email(email: str) -> bool:
        """Validate email address using email-validator library"""
        try:
            validate_email(email)
            return True
        except EmailNotValidError:
            return False
    
    @staticmethod
    def clean_email_list(emails: List[str]) -> List[str]:
        """Clean and deduplicate email list"""
        valid_emails = []
        seen = set()
        
        for email in emails:
            email = email.strip().lower()
            if email and EmailValidator.is_valid_email(email) and email not in seen:
                valid_emails.append(email)
                seen.add(email)
        
        return valid_emails

class SMTPConfig:
    """SMTP Configuration management"""
    
    def __init__(self):
        self.host: str = ""
        self.port: int = 587
        self.username: str = ""
        self.password: str = ""
        self.use_tls: bool = True
        self.sender_email: str = ""
    
    def configure_interactive(self) -> bool:
        """Interactive SMTP configuration"""
        console.print(Panel(
            "[bold cyan]SMTP Server Configuration[/bold cyan]\n"
            "Enter your email server details. For Gmail, use app passwords.\n"
            "For other providers, check their SMTP settings.",
            title="📧 Email Server Setup",
            border_style="blue"
        ))
        
        # SMTP Host
        self.host = Prompt.ask(
            "[bold]SMTP Host[/bold]",
            default="smtp.gmail.com"
        )
        
        # SMTP Port
        self.port = IntPrompt.ask(
            "[bold]SMTP Port[/bold]",
            default=587
        )
        
        # Username
        self.username = Prompt.ask("[bold]SMTP Username/Email[/bold]")
        
        # Password
        self.password = Prompt.ask(
            "[bold]SMTP Password[/bold]",
            password=True
        )
        
        # TLS
        self.use_tls = Confirm.ask(
            "[bold]Use TLS encryption?[/bold]",
            default=True
        )
        
        # Sender email
        self.sender_email = Prompt.ask(
            "[bold]Sender Email Address[/bold]",
            default=self.username
        )
        
        # Validate sender email
        if not EmailValidator.is_valid_email(self.sender_email):
            console.print("[red]Invalid sender email address![/red]")
            return False
        
        # Test connection
        return self.test_connection()
    
    def test_connection(self) -> bool:
        """Test SMTP connection"""
        try:
            console.print("[yellow]Testing SMTP connection...[/yellow]")
            server = smtplib.SMTP(self.host, self.port)
            if self.use_tls:
                server.starttls()
            server.login(self.username, self.password)
            server.quit()
            console.print("[green]✓ SMTP connection successful![/green]")
            return True
        except Exception as e:
            console.print(f"[red]✗ SMTP connection failed: {e}[/red]")
            return False
    
    def to_dict(self) -> Dict:
        """Convert to dictionary for saving"""
        return {
            "host": self.host,
            "port": self.port,
            "username": self.username,
            "use_tls": self.use_tls,
            "sender_email": self.sender_email
            # Note: Password not saved for security
        }
    
    def from_dict(self, data: Dict):
        """Load from dictionary"""
        self.host = data.get("host", "")
        self.port = data.get("port", 587)
        self.username = data.get("username", "")
        self.use_tls = data.get("use_tls", True)
        self.sender_email = data.get("sender_email", "")

class EmailContent:
    """Email content management"""
    
    def __init__(self):
        self.subject: str = ""
        self.body: str = ""
        self.is_html: bool = False
    
    def compose_interactive(self) -> bool:
        """Interactive email composition"""
        console.print(Panel(
            "[bold cyan]Email Content Composition[/bold cyan]\n"
            "Create your email subject and body content.",
            title="✍️ Content Creation",
            border_style="green"
        ))
        
        # Subject
        self.subject = Prompt.ask("[bold]Email Subject[/bold]")
        if not self.subject.strip():
            console.print("[red]Subject cannot be empty![/red]")
            return False
        
        # Body type
        self.is_html = Confirm.ask(
            "[bold]Use HTML format?[/bold]",
            default=False
        )
        
        # Body content
        body_type = "HTML" if self.is_html else "Plain Text"
        console.print(f"[yellow]Enter {body_type} email body (press Enter twice to finish):[/yellow]")
        
        lines = []
        while True:
            line = input()
            if line == "" and lines and lines[-1] == "":
                break
            lines.append(line)
        
        self.body = "\n".join(lines[:-1])  # Remove last empty line
        
        if not self.body.strip():
            console.print("[red]Email body cannot be empty![/red]")
            return False
        
        # Preview
        self.show_preview()
        return Confirm.ask("[bold]Accept this email content?[/bold]", default=True)
    
    def show_preview(self):
        """Show email preview"""
        preview_table = Table(title="📋 Email Preview")
        preview_table.add_column("Field", style="bold")
        preview_table.add_column("Content", style="dim")
        
        preview_table.add_row("Subject", self.subject)
        preview_table.add_row("Format", "HTML" if self.is_html else "Plain Text")
        preview_table.add_row("Body", self.body[:100] + "..." if len(self.body) > 100 else self.body)
        
        console.print(preview_table)

class RecipientManager:
    """Recipient management and loading"""
    
    def __init__(self):
        self.recipients: List[str] = []
    
    def load_interactive(self) -> bool:
        """Interactive recipient loading"""
        console.print(Panel(
            "[bold cyan]Recipient Management[/bold cyan]\n"
            "Load your email recipients from CSV file or enter manually.",
            title="👥 Recipients",
            border_style="yellow"
        ))
        
        method = Prompt.ask(
            "[bold]How would you like to add recipients?[/bold]",
            choices=["csv", "manual"],
            default="csv"
        )
        
        if method == "csv":
            return self.load_from_csv()
        else:
            return self.load_manual()
    
    def load_from_csv(self) -> bool:
        """Load recipients from CSV file"""
        file_path = Prompt.ask("[bold]CSV file path[/bold]")
        
        try:
            if not os.path.exists(file_path):
                console.print(f"[red]File not found: {file_path}[/red]")
                return False
            
            df = pd.read_csv(file_path)
            
            # Check for email column
            email_columns = [col for col in df.columns if 'email' in col.lower()]
            if not email_columns:
                console.print("[red]No email column found in CSV. Expected column name containing 'email'.[/red]")
                return False
            
            email_col = email_columns[0]
            console.print(f"[green]Using column: {email_col}[/green]")
            
            raw_emails = df[email_col].dropna().astype(str).tolist()
            self.recipients = EmailValidator.clean_email_list(raw_emails)
            
            console.print(f"[green]Loaded {len(self.recipients)} valid emails from {len(raw_emails)} total entries[/green]")
            
            if len(self.recipients) != len(raw_emails):
                console.print(f"[yellow]Skipped {len(raw_emails) - len(self.recipients)} invalid/duplicate emails[/yellow]")
            
            return len(self.recipients) > 0
            
        except Exception as e:
            console.print(f"[red]Error loading CSV: {e}[/red]")
            return False
    
    def load_manual(self) -> bool:
        """Manual recipient entry"""
        console.print("[yellow]Enter email addresses (comma-separated):[/yellow]")
        emails_input = Prompt.ask("[bold]Emails[/bold]")
        
        raw_emails = [email.strip() for email in emails_input.split(",")]
        self.recipients = EmailValidator.clean_email_list(raw_emails)
        
        console.print(f"[green]Added {len(self.recipients)} valid emails[/green]")
        
        if len(self.recipients) != len(raw_emails):
            console.print(f"[yellow]Skipped {len(raw_emails) - len(self.recipients)} invalid emails[/yellow]")
        
        return len(self.recipients) > 0
    
    def show_summary(self):
        """Show recipient summary"""
        if not self.recipients:
            console.print("[red]No recipients loaded[/red]")
            return
        
        summary_table = Table(title="📊 Recipients Summary")
        summary_table.add_column("Metric", style="bold")
        summary_table.add_column("Value", style="cyan")
        
        summary_table.add_row("Total Recipients", str(len(self.recipients)))
        summary_table.add_row("First 5 Recipients", ", ".join(self.recipients[:5]))
        
        if len(self.recipients) > 5:
            summary_table.add_row("...", f"and {len(self.recipients) - 5} more")
        
        console.print(summary_table)

class EmailSender:
    """Email sending functionality"""
    
    def __init__(self, smtp_config: SMTPConfig):
        self.smtp_config = smtp_config
        self.sent_count = 0
        self.failed_count = 0
        self.failed_recipients = []
    
    def send_emails(self, content: EmailContent, recipients: List[str], dry_run: bool = False) -> Dict:
        """Send emails to recipients with progress tracking"""
        if dry_run:
            return self._dry_run(content, recipients)
        
        results = {
            "sent": 0,
            "failed": 0,
            "failed_recipients": [],
            "start_time": datetime.now(),
            "end_time": None
        }
        
        try:
            # Connect to SMTP server
            server = smtplib.SMTP(self.smtp_config.host, self.smtp_config.port)
            if self.smtp_config.use_tls:
                server.starttls()
            server.login(self.smtp_config.username, self.smtp_config.password)
            
            # Send emails with progress bar
            with Progress() as progress:
                task = progress.add_task("[cyan]Sending emails...", total=len(recipients))
                
                for recipient in recipients:
                    try:
                        # Create message
                        msg = MIMEMultipart()
                        msg['From'] = self.smtp_config.sender_email
                        msg['To'] = recipient
                        msg['Subject'] = content.subject
                        
                        # Add body
                        body_type = 'html' if content.is_html else 'plain'
                        msg.attach(MIMEText(content.body, body_type))
                        
                        # Send email
                        server.sendmail(
                            self.smtp_config.sender_email,
                            recipient,
                            msg.as_string()
                        )
                        
                        results["sent"] += 1
                        console.print(f"[green]✓ Sent to {recipient}[/green]")
                        
                    except Exception as e:
                        results["failed"] += 1
                        results["failed_recipients"].append(recipient)
                        console.print(f"[red]✗ Failed to send to {recipient}: {e}[/red]")
                    
                    progress.update(task, advance=1)
                    time.sleep(0.1)  # Small delay to avoid overwhelming the server
            
            server.quit()
            results["end_time"] = datetime.now()
            
        except Exception as e:
            console.print(f"[red]SMTP Error: {e}[/red]")
            results["smtp_error"] = str(e)
        
        return results
    
    def _dry_run(self, content: EmailContent, recipients: List[str]) -> Dict:
        """Simulate email sending without actually sending"""
        console.print(Panel(
            "[bold yellow]DRY RUN MODE - No emails will be sent[/bold yellow]",
            border_style="yellow"
        ))
        
        with Progress() as progress:
            task = progress.add_task("[yellow]Simulating email send...", total=len(recipients))
            
            for recipient in recipients:
                console.print(f"[yellow]Would send to: {recipient}[/yellow]")
                progress.update(task, advance=1)
                time.sleep(0.05)  # Quick simulation
        
        return {
            "sent": len(recipients),
            "failed": 0,
            "failed_recipients": [],
            "dry_run": True,
            "start_time": datetime.now(),
            "end_time": datetime.now()
        }

def show_welcome():
    """Display welcome message and compliance warning"""
    welcome_text = Text()
    welcome_text.append("TermSender", style="bold cyan")
    welcome_text.append(" - Professional Email Sender\n", style="bold")
    welcome_text.append("Version 1.0 | Ethical Bulk Email Tool", style="dim")
    
    compliance_text = Text()
    compliance_text.append("⚠️  COMPLIANCE WARNING\n", style="bold red")
    compliance_text.append("• Ensure compliance with anti-spam laws (CAN-SPAM, GDPR)\n", style="yellow")
    compliance_text.append("• Only use with consented recipient lists\n", style="yellow")
    compliance_text.append("• Include unsubscribe options in your emails\n", style="yellow")
    compliance_text.append("• Respect rate limits and sending policies", style="yellow")
    
    console.print(Panel(welcome_text, border_style="cyan"))
    console.print(Panel(compliance_text, border_style="red"))
    
    if not Confirm.ask("[bold red]Do you understand and agree to use this tool ethically?[/bold red]"):
        console.print("[red]Exiting. Use this tool responsibly.[/red]")
        raise typer.Exit(1)

def show_results(results: Dict):
    """Display sending results"""
    if results.get("dry_run"):
        console.print(Panel(
            f"[bold yellow]DRY RUN COMPLETED[/bold yellow]\n"
            f"Would have sent {results['sent']} emails",
            title="🧪 Simulation Results",
            border_style="yellow"
        ))
        return
    
    # Calculate duration
    duration = results.get("end_time", datetime.now()) - results["start_time"]
    
    results_table = Table(title="📈 Sending Results")
    results_table.add_column("Metric", style="bold")
    results_table.add_column("Value", style="cyan")
    
    results_table.add_row("✅ Successfully Sent", str(results["sent"]))
    results_table.add_row("❌ Failed", str(results["failed"]))
    results_table.add_row("⏱️ Duration", str(duration).split('.')[0])
    
    if results["failed"] > 0:
        results_table.add_row("Failed Recipients", ", ".join(results["failed_recipients"][:5]))
        if len(results["failed_recipients"]) > 5:
            results_table.add_row("", f"... and {len(results['failed_recipients']) - 5} more")
    
    console.print(results_table)
    
    # Success rate
    total = results["sent"] + results["failed"]
    if total > 0:
        success_rate = (results["sent"] / total) * 100
        if success_rate >= 90:
            style = "green"
        elif success_rate >= 70:
            style = "yellow"
        else:
            style = "red"
        
        console.print(f"[{style}]Success Rate: {success_rate:.1f}%[/{style}]")

@app.command()
def send():
    """Start the interactive email sending process"""
    show_welcome()
    
    # Initialize components
    smtp_config = SMTPConfig()
    content = EmailContent()
    recipient_manager = RecipientManager()
    
    try:
        # Step 1: Configure SMTP
        console.print("\n[bold blue]Step 1: SMTP Configuration[/bold blue]")
        if not smtp_config.configure_interactive():
            console.print("[red]SMTP configuration failed. Exiting.[/red]")
            raise typer.Exit(1)
        
        # Step 2: Compose email
        console.print("\n[bold blue]Step 2: Email Content[/bold blue]")
        if not content.compose_interactive():
            console.print("[red]Email composition cancelled. Exiting.[/red]")
            raise typer.Exit(1)
        
        # Step 3: Load recipients
        console.print("\n[bold blue]Step 3: Load Recipients[/bold blue]")
        if not recipient_manager.load_interactive():
            console.print("[red]No valid recipients loaded. Exiting.[/red]")
            raise typer.Exit(1)
        
        recipient_manager.show_summary()
        
        # Step 4: Final confirmation
        console.print("\n[bold blue]Step 4: Final Review[/bold blue]")
        
        # Settings
        dry_run = Confirm.ask("[bold]Run in dry-run mode? (simulate without sending)[/bold]", default=False)
        
        if not dry_run:
            final_confirm = Confirm.ask(
                f"[bold red]Ready to send {len(recipient_manager.recipients)} emails? This action cannot be undone.[/bold red]"
            )
            if not final_confirm:
                console.print("[yellow]Send cancelled by user.[/yellow]")
                raise typer.Exit(0)
        
        # Step 5: Send emails
        console.print("\n[bold blue]Step 5: Sending Emails[/bold blue]")
        sender = EmailSender(smtp_config)
        results = sender.send_emails(content, recipient_manager.recipients, dry_run)
        
        # Show results
        show_results(results)
        
    except KeyboardInterrupt:
        console.print("\n[yellow]Operation cancelled by user.[/yellow]")
        raise typer.Exit(0)
    except Exception as e:
        console.print(f"\n[red]Unexpected error: {e}[/red]")
        raise typer.Exit(1)

@app.command()
def version():
    """Show version information"""
    console.print("TermSender v1.0.0")
    console.print("Professional terminal email sender tool")

if __name__ == "__main__":
    app()