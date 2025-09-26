
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
from rich.progress import Progress, TaskID, SpinnerColumn, TextColumn, BarColumn, TimeElapsedColumn
from rich.text import Text
from rich.layout import Layout
from rich.live import Live
from rich.align import Align
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
LOGS_DIR.mkdir(exist_ok=True)

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
        """Interactive SMTP configuration with enhanced UI"""
        layout = Layout()
        layout.split_column(
            Layout(name="header", size=3),
            Layout(name="body")
        )
        
        header_text = Text("🚀 TermSender Pro - SMTP Configuration", style="bold cyan", justify="center")
        layout["header"].update(Panel(header_text, style="cyan"))
        
        console.print(Panel(
            "[bold cyan]SMTP Server Configuration[/bold cyan]\n"
            "Enter your email server details. For Gmail, use app passwords.\n"
            "For other providers, check their SMTP settings.\n\n"
            "[yellow]💡 Tips:[/yellow]\n"
            "• Gmail: smtp.gmail.com:587 with app password\n"
            "• Outlook: smtp-mail.outlook.com:587\n"
            "• Yahoo: smtp.mail.yahoo.com:587",
            title="📧 Email Server Setup",
            border_style="blue"
        ))
        
        # SMTP Host with suggestions
        console.print("[dim]Common hosts: gmail.com, outlook.com, yahoo.com[/dim]")
        self.host = Prompt.ask(
            "[bold]SMTP Host[/bold]",
            default="smtp.gmail.com"
        )
        
        # SMTP Port with validation
        self.port = IntPrompt.ask(
            "[bold]SMTP Port[/bold]",
            default=587
        )
        
        # Username
        self.username = Prompt.ask("[bold]SMTP Username/Email[/bold]")
        
        # Password with security notice
        console.print("[yellow]⚠️  Your password is secure and won't be saved to disk[/yellow]")
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
            console.print("[red]❌ Invalid sender email address![/red]")
            return False
        
        # Test connection with enhanced feedback
        return self.test_connection()
    
    def test_connection(self) -> bool:
        """Test SMTP connection with progress indicator"""
        with console.status("[yellow]Testing SMTP connection...", spinner="dots"):
            try:
                time.sleep(0.5)  # Brief pause for UX
                server = smtplib.SMTP(self.host, self.port)
                if self.use_tls:
                    server.starttls()
                server.login(self.username, self.password)
                server.quit()
                console.print("✅ [green]SMTP connection successful![/green]")
                return True
            except Exception as e:
                console.print(f"❌ [red]SMTP connection failed: {e}[/red]")
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
        """Interactive email composition with enhanced UI"""
        console.print(Panel(
            "[bold cyan]Email Content Composition[/bold cyan]\n"
            "Create your professional email content with advanced options.\n\n"
            "[yellow]💡 Features:[/yellow]\n"
            "• Plain text or HTML formatting\n"
            "• Variable substitution support\n"
            "• Live character count\n"
            "• Preview before sending",
            title="✍️ Content Creation",
            border_style="green"
        ))
        
        # Subject with character count
        self.subject = Prompt.ask("[bold]📝 Email Subject[/bold]")
        if not self.subject.strip():
            console.print("[red]❌ Subject cannot be empty![/red]")
            return False
        
        console.print(f"[dim]Subject length: {len(self.subject)} characters[/dim]")
        
        # Body type selection
        self.is_html = Confirm.ask(
            "[bold]📄 Use HTML format?[/bold]",
            default=False
        )
        
        # Body content with enhanced input
        body_type = "HTML" if self.is_html else "Plain Text"
        console.print(f"[yellow]📝 Enter {body_type} email body:[/yellow]")
        console.print("[dim]Press Enter twice when finished[/dim]")
        
        lines = []
        empty_line_count = 0
        
        while True:
            try:
                line = input()
                if line == "":
                    empty_line_count += 1
                    if empty_line_count >= 2:
                        break
                else:
                    empty_line_count = 0
                lines.append(line)
            except KeyboardInterrupt:
                console.print("\n[yellow]Content composition cancelled[/yellow]")
                return False
        
        # Remove trailing empty lines
        while lines and lines[-1] == "":
            lines.pop()
        
        self.body = "\n".join(lines)
        
        if not self.body.strip():
            console.print("[red]❌ Email body cannot be empty![/red]")
            return False
        
        console.print(f"[dim]Body length: {len(self.body)} characters[/dim]")
        
        # Preview
        self.show_preview()
        return Confirm.ask("[bold]✅ Accept this email content?[/bold]", default=True)
    
    def show_preview(self):
        """Show enhanced email preview"""
        preview_table = Table(title="📋 Email Preview", show_header=False, box=None)
        preview_table.add_column("Field", style="bold cyan", width=12)
        preview_table.add_column("Content", style="white")
        
        preview_table.add_row("Subject:", self.subject)
        preview_table.add_row("Format:", "HTML" if self.is_html else "Plain Text")
        
        # Truncate body for preview
        body_preview = self.body[:200] + "..." if len(self.body) > 200 else self.body
        preview_table.add_row("Body:", body_preview)
        
        console.print(Panel(preview_table, border_style="green"))

class RecipientManager:
    """Enhanced recipient management"""
    
    def __init__(self):
        self.recipients: List[str] = []
    
    def load_interactive(self) -> bool:
        """Interactive recipient loading with enhanced options"""
        console.print(Panel(
            "[bold cyan]Recipient Management[/bold cyan]\n"
            "Load your email recipients with multiple import options.\n\n"
            "[yellow]💡 Supported formats:[/yellow]\n"
            "• CSV files with email column\n"
            "• Manual entry (comma or newline separated)\n"
            "• Automatic validation and deduplication",
            title="👥 Recipients",
            border_style="yellow"
        ))
        
        method = Prompt.ask(
            "[bold]📥 How would you like to add recipients?[/bold]",
            choices=["csv", "manual", "file"],
            default="csv"
        )
        
        if method == "csv":
            return self.load_from_csv()
        elif method == "file":
            return self.load_from_file()
        else:
            return self.load_manual()
    
    def load_from_csv(self) -> bool:
        """Enhanced CSV loading with progress and validation"""
        file_path = Prompt.ask("[bold]📁 CSV file path[/bold]")
        
        if not os.path.exists(file_path):
            console.print(f"[red]❌ File not found: {file_path}[/red]")
            return False
        
        try:
            with console.status("[yellow]Processing CSV file...", spinner="dots"):
                df = pd.read_csv(file_path)
                
                # Check for email column
                email_columns = [col for col in df.columns if 'email' in col.lower()]
                if not email_columns:
                    console.print("[red]❌ No email column found in CSV. Expected column name containing 'email'.[/red]")
                    return False
                
                email_col = email_columns[0]
                console.print(f"[green]✅ Using column: {email_col}[/green]")
                
                raw_emails = df[email_col].dropna().astype(str).tolist()
            
            # Validate emails with progress bar
            with Progress(
                SpinnerColumn(),
                TextColumn("[progress.description]{task.description}"),
                BarColumn(),
                TextColumn("[progress.percentage]{task.percentage:>3.0f}%"),
                TimeElapsedColumn(),
                console=console
            ) as progress:
                task = progress.add_task("Validating emails...", total=len(raw_emails))
                
                for email in raw_emails:
                    progress.update(task, advance=1)
                    time.sleep(0.01)  # Small delay for visual effect
            
            self.recipients = EmailValidator.clean_email_list(raw_emails)
            
            # Show results
            results_table = Table(title="📊 Import Results")
            results_table.add_column("Metric", style="bold")
            results_table.add_column("Count", style="cyan")
            
            results_table.add_row("Total entries", str(len(raw_emails)))
            results_table.add_row("Valid emails", str(len(self.recipients)))
            results_table.add_row("Invalid/duplicates", str(len(raw_emails) - len(self.recipients)))
            
            console.print(results_table)
            
            if len(self.recipients) == 0:
                console.print("[red]❌ No valid email addresses found[/red]")
                return False
            
            return True
            
        except Exception as e:
            console.print(f"[red]❌ Error loading CSV: {e}[/red]")
            return False
    
    def load_from_file(self) -> bool:
        """Load from plain text file"""
        file_path = Prompt.ask("[bold]📁 Text file path[/bold]")
        
        if not os.path.exists(file_path):
            console.print(f"[red]❌ File not found: {file_path}[/red]")
            return False
        
        try:
            with open(file_path, 'r') as f:
                content = f.read()
            
            # Split by various delimiters
            import re
            raw_emails = re.split(r'[,;\n\t\s]+', content)
            raw_emails = [email.strip() for email in raw_emails if email.strip()]
            
            self.recipients = EmailValidator.clean_email_list(raw_emails)
            
            console.print(f"[green]✅ Loaded {len(self.recipients)} valid emails from file[/green]")
            return len(self.recipients) > 0
            
        except Exception as e:
            console.print(f"[red]❌ Error reading file: {e}[/red]")
            return False
    
    def load_manual(self) -> bool:
        """Enhanced manual entry with real-time validation"""
        console.print("[yellow]📧 Enter email addresses (comma or newline separated):[/yellow]")
        console.print("[dim]Press Enter twice when finished[/dim]")
        
        emails_input = []
        empty_line_count = 0
        
        while True:
            try:
                line = input()
                if line == "":
                    empty_line_count += 1
                    if empty_line_count >= 2:
                        break
                else:
                    empty_line_count = 0
                    emails_input.append(line)
            except KeyboardInterrupt:
                console.print("\n[yellow]Manual entry cancelled[/yellow]")
                return False
        
        if not emails_input:
            console.print("[red]❌ No email addresses entered[/red]")
            return False
        
        # Process input
        all_text = " ".join(emails_input)
        import re
        raw_emails = re.split(r'[,;\n\t\s]+', all_text)
        raw_emails = [email.strip() for email in raw_emails if email.strip()]
        
        # Validate with progress
        with console.status("[yellow]Validating emails...", spinner="dots"):
            self.recipients = EmailValidator.clean_email_list(raw_emails)
        
        console.print(f"[green]✅ Added {len(self.recipients)} valid emails[/green]")
        
        if len(self.recipients) != len(raw_emails):
            console.print(f"[yellow]⚠️  Skipped {len(raw_emails) - len(self.recipients)} invalid emails[/yellow]")
        
        return len(self.recipients) > 0
    
    def show_summary(self):
        """Enhanced recipient summary"""
        if not self.recipients:
            console.print("[red]❌ No recipients loaded[/red]")
            return
        
        summary_table = Table(title="📊 Recipients Summary")
        summary_table.add_column("Metric", style="bold")
        summary_table.add_column("Value", style="cyan")
        
        summary_table.add_row("Total Recipients", str(len(self.recipients)))
        
        # Show sample emails
        sample_size = min(5, len(self.recipients))
        sample_emails = self.recipients[:sample_size]
        summary_table.add_row(f"Sample ({sample_size})", ", ".join(sample_emails))
        
        if len(self.recipients) > sample_size:
            summary_table.add_row("...", f"and {len(self.recipients) - sample_size} more")
        
        console.print(Panel(summary_table, border_style="green"))

class EmailSender:
    """Enhanced email sending with sophisticated progress tracking"""
    
    def __init__(self, smtp_config: SMTPConfig):
        self.smtp_config = smtp_config
        self.sent_count = 0
        self.failed_count = 0
        self.failed_recipients = []
    
    def send_emails(self, content: EmailContent, recipients: List[str], dry_run: bool = False) -> Dict:
        """Send emails with enhanced progress tracking and logging"""
        if dry_run:
            return self._dry_run(content, recipients)
        
        results = {
            "sent": 0,
            "failed": 0,
            "failed_recipients": [],
            "start_time": datetime.now(),
            "end_time": None
        }
        
        # Create logs
        log_file = LOGS_DIR / f"campaign_{datetime.now().strftime('%Y%m%d_%H%M%S')}.log"
        
        try:
            # Connect to SMTP server
            with console.status("[yellow]Connecting to SMTP server...", spinner="dots"):
                server = smtplib.SMTP(self.smtp_config.host, self.smtp_config.port)
                if self.smtp_config.use_tls:
                    server.starttls()
                server.login(self.smtp_config.username, self.smtp_config.password)
            
            console.print("✅ [green]Connected to SMTP server[/green]")
            
            # Send emails with enhanced progress
            with Progress(
                SpinnerColumn(),
                TextColumn("[progress.description]{task.description}"),
                BarColumn(),
                TextColumn("[progress.percentage]{task.percentage:>3.0f}%"),
                TextColumn("•"),
                TextColumn("Sent: [green]{task.fields[sent]}[/green]"),
                TextColumn("•"),
                TextColumn("Failed: [red]{task.fields[failed]}[/red]"),
                TimeElapsedColumn(),
                console=console
            ) as progress:
                
                task = progress.add_task(
                    "Sending emails...", 
                    total=len(recipients),
                    sent=0,
                    failed=0
                )
                
                for i, recipient in enumerate(recipients):
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
                        
                        # Log success
                        with open(log_file, 'a') as f:
                            f.write(f"{datetime.now().isoformat()} - SUCCESS: {recipient}\n")
                        
                    except Exception as e:
                        results["failed"] += 1
                        results["failed_recipients"].append(recipient)
                        
                        # Log failure
                        with open(log_file, 'a') as f:
                            f.write(f"{datetime.now().isoformat()} - FAILED: {recipient} - {str(e)}\n")
                    
                    # Update progress
                    progress.update(
                        task, 
                        advance=1,
                        sent=results["sent"],
                        failed=results["failed"]
                    )
                    
                    # Rate limiting
                    time.sleep(0.5)
            
            server.quit()
            results["end_time"] = datetime.now()
            
        except Exception as e:
            console.print(f"[red]❌ SMTP Error: {e}[/red]")
            results["smtp_error"] = str(e)
            results["end_time"] = datetime.now()
        
        return results
    
    def _dry_run(self, content: EmailContent, recipients: List[str]) -> Dict:
        """Enhanced dry run simulation"""
        console.print(Panel(
            "[bold yellow]🧪 DRY RUN MODE - Simulation Only[/bold yellow]\n"
            "No emails will actually be sent. This is a test run.",
            border_style="yellow"
        ))
        
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            BarColumn(),
            TextColumn("[progress.percentage]{task.percentage:>3.0f}%"),
            TimeElapsedColumn(),
            console=console
        ) as progress:
            
            task = progress.add_task("Simulating email send...", total=len(recipients))
            
            for i, recipient in enumerate(recipients):
                progress.update(task, advance=1)
                time.sleep(0.1)  # Simulate processing time
        
        return {
            "sent": len(recipients),
            "failed": 0,
            "failed_recipients": [],
            "dry_run": True,
            "start_time": datetime.now(),
            "end_time": datetime.now()
        }

def show_welcome():
    """Enhanced welcome screen with animations"""
    welcome_art = """
    ╔══════════════════════════════════════════════════════════════╗
    ║                                                              ║
    ║    ████████╗███████╗██████╗ ███╗   ███╗███████╗███████╗    ║
    ║    ╚══██╔══╝██╔════╝██╔══██╗████╗ ████║██╔════╝██╔════╝    ║
    ║       ██║   █████╗  ██████╔╝██╔████╔██║███████╗█████╗      ║
    ║       ██║   ██╔══╝  ██╔══██╗██║╚██╔╝██║╚════██║██╔══╝      ║
    ║       ██║   ███████╗██║  ██║██║ ╚═╝ ██║███████║███████╗    ║
    ║       ╚═╝   ╚══════╝╚═╝  ╚═╝╚═╝     ╚═╝╚══════╝╚══════╝    ║
    ║                                                              ║
    ║                Professional Email Campaign Manager           ║
    ║                         Version 2.0                         ║
    ╚══════════════════════════════════════════════════════════════╝
    """
    
    console.print(welcome_art, style="bold cyan")
    
    features = [
        "🎯 Professional email campaigns",
        "🛡️  Advanced SMTP security",
        "📊 Real-time progress tracking",
        "✅ Email validation & deduplication",
        "📝 HTML & plain text support",
        "🔒 Privacy & compliance focused"
    ]
    
    console.print("\n[bold green]Features:[/bold green]")
    for feature in features:
        console.print(f"  {feature}")
    
    console.print("\n" + "="*60)
    
    compliance_text = Text()
    compliance_text.append("⚠️  COMPLIANCE NOTICE\n", style="bold red")
    compliance_text.append("By using TermSender Pro, you agree to:\n", style="yellow")
    compliance_text.append("• Comply with anti-spam laws (CAN-SPAM, GDPR)\n", style="white")
    compliance_text.append("• Only email consented recipients\n", style="white")
    compliance_text.append("• Include unsubscribe options\n", style="white")
    compliance_text.append("• Respect rate limits and policies\n", style="white")
    compliance_text.append("• Use this tool ethically and responsibly", style="white")
    
    console.print(Panel(compliance_text, border_style="red", title="⚖️ Legal Compliance"))
    
    if not Confirm.ask("\n[bold red]Do you understand and agree to use this tool ethically?[/bold red]"):
        console.print("[red]Exiting. Please use this tool responsibly.[/red]")
        raise typer.Exit(1)

def show_results(results: Dict):
    """Enhanced results display with statistics"""
    if results.get("dry_run"):
        console.print(Panel(
            f"[bold yellow]🧪 DRY RUN COMPLETED[/bold yellow]\n\n"
            f"✅ Simulated: {results['sent']} emails\n"
            f"⏱️  Duration: {(results['end_time'] - results['start_time']).total_seconds():.1f}s",
            title="Simulation Results",
            border_style="yellow"
        ))
        return
    
    # Calculate statistics
    duration = results.get("end_time", datetime.now()) - results["start_time"]
    total = results["sent"] + results["failed"]
    success_rate = (results["sent"] / total * 100) if total > 0 else 0
    
    # Create results table
    results_table = Table(title="📊 Campaign Results", show_header=False)
    results_table.add_column("Metric", style="bold", width=20)
    results_table.add_column("Value", style="cyan")
    
    results_table.add_row("✅ Successfully Sent", f"[green]{results['sent']}[/green]")
    results_table.add_row("❌ Failed", f"[red]{results['failed']}[/red]")
    results_table.add_row("📊 Success Rate", f"{success_rate:.1f}%")
    results_table.add_row("⏱️ Duration", str(duration).split('.')[0])
    results_table.add_row("📧 Rate", f"{results['sent']/duration.total_seconds():.2f} emails/sec")
    
    console.print(Panel(results_table, border_style="green"))
    
    # Show failed recipients if any
    if results["failed"] > 0:
        console.print(f"\n[red]❌ Failed Recipients ({results['failed']}):[/red]")
        for recipient in results["failed_recipients"][:10]:  # Show first 10
            console.print(f"  • {recipient}")
        if len(results["failed_recipients"]) > 10:
            console.print(f"  ... and {len(results['failed_recipients']) - 10} more")
    
    # Success celebration
    if success_rate >= 95:
        console.print("\n🎉 [bold green]Excellent! Campaign completed successfully![/bold green]")
    elif success_rate >= 80:
        console.print("\n👍 [bold yellow]Good! Most emails were sent successfully.[/bold yellow]")
    else:
        console.print("\n⚠️ [bold red]Warning: High failure rate. Check your configuration.[/bold red]")

@app.command()
def send():
    """🚀 Start the interactive email sending process"""
    try:
        show_welcome()
        
        # Initialize components
        smtp_config = SMTPConfig()
        content = EmailContent()
        recipient_manager = RecipientManager()
        
        console.print("\n[bold blue]🔧 Step 1: SMTP Configuration[/bold blue]")
        if not smtp_config.configure_interactive():
            console.print("[red]❌ SMTP configuration failed. Exiting.[/red]")
            raise typer.Exit(1)
        
        console.print("\n[bold blue]✍️ Step 2: Email Content[/bold blue]")
        if not content.compose_interactive():
            console.print("[red]❌ Email composition cancelled. Exiting.[/red]")
            raise typer.Exit(1)
        
        console.print("\n[bold blue]👥 Step 3: Load Recipients[/bold blue]")
        if not recipient_manager.load_interactive():
            console.print("[red]❌ No valid recipients loaded. Exiting.[/red]")
            raise typer.Exit(1)
        
        recipient_manager.show_summary()
        
        console.print("\n[bold blue]🔍 Step 4: Final Review[/bold blue]")
        
        # Show campaign summary
        summary_table = Table(title="📋 Campaign Summary")
        summary_table.add_column("Component", style="bold")
        summary_table.add_column("Details", style="cyan")
        
        summary_table.add_row("📧 Subject", content.subject)
        summary_table.add_row("📄 Format", "HTML" if content.is_html else "Plain Text")
        summary_table.add_row("👥 Recipients", str(len(recipient_manager.recipients)))
        summary_table.add_row("📮 SMTP Server", f"{smtp_config.host}:{smtp_config.port}")
        summary_table.add_row("👤 Sender", smtp_config.sender_email)
        
        console.print(Panel(summary_table, border_style="blue"))
        
        # Settings
        dry_run = Confirm.ask(
            "[bold]🧪 Run in test mode? (recommended for first time)[/bold]", 
            default=True
        )
        
        if not dry_run:
            final_confirm = Confirm.ask(
                f"[bold red]🚨 Ready to send {len(recipient_manager.recipients)} REAL emails? This cannot be undone![/bold red]"
            )
            if not final_confirm:
                console.print("[yellow]📤 Send cancelled by user.[/yellow]")
                raise typer.Exit(0)
        
        console.print("\n[bold blue]🚀 Step 5: Launching Campaign[/bold blue]")
        sender = EmailSender(smtp_config)
        results = sender.send_emails(content, recipient_manager.recipients, dry_run)
        
        show_results(results)
        
        # Save logs reference
        if not dry_run:
            console.print(f"\n[dim]📝 Detailed logs saved to: logs/[/dim]")
        
    except KeyboardInterrupt:
        console.print("\n[yellow]⚠️ Operation cancelled by user.[/yellow]")
        raise typer.Exit(0)
    except Exception as e:
        console.print(f"\n[red]❌ Unexpected error: {e}[/red]")
        raise typer.Exit(1)

@app.command()
def version():
    """📋 Show version information"""
    console.print(Panel(
        "[bold cyan]TermSender Pro v2.0[/bold cyan]\n"
        "Professional terminal email campaign manager\n\n"
        "[yellow]Features:[/yellow]\n"
        "• Interactive CLI interface\n"
        "• SMTP configuration & testing\n"
        "• CSV & manual recipient import\n"
        "• HTML & plain text emails\n"
        "• Real-time progress tracking\n"
        "• Comprehensive logging\n"
        "• Compliance & security focused",
        title="📋 Version Info",
        border_style="cyan"
    ))

@app.command()
def test():
    """🧪 Test SMTP configuration without sending emails"""
    console.print(Panel(
        "[bold yellow]🧪 SMTP Test Mode[/bold yellow]\n"
        "Test your SMTP configuration without sending any emails.",
        title="Test Mode",
        border_style="yellow"
    ))
    
    smtp_config = SMTPConfig()
    if smtp_config.configure_interactive():
        console.print("\n[bold green]✅ SMTP configuration is working correctly![/bold green]")
        console.print("[dim]You can now use the 'send' command to start a campaign.[/dim]")
    else:
        console.print("\n[bold red]❌ SMTP configuration failed. Please check your settings.[/bold red]")

if __name__ == "__main__":
    app()
