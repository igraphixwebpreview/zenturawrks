#!/usr/bin/env python3
"""
SMTP Email Service for Invoice Generator
Handles sending invoices via SMTP without external dependencies
"""

import smtplib
import ssl
import os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
import json
import sys
from typing import Optional

class SMTPEmailService:
    def __init__(self):
        # SMTP Configuration - these can be set via environment variables
        self.smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
        self.smtp_username = os.getenv('SMTP_USERNAME', '')
        self.smtp_password = os.getenv('SMTP_PASSWORD', '')
        self.from_email = os.getenv('FROM_EMAIL', self.smtp_username)
        
    def send_invoice_email(self, to_email: str, subject: str, body: str, 
                          pdf_path: Optional[str] = None) -> bool:
        """
        Send an invoice email with optional PDF attachment
        
        Args:
            to_email: Recipient email address
            subject: Email subject line
            body: Email body content
            pdf_path: Optional path to PDF attachment
            
        Returns:
            bool: True if email sent successfully, False otherwise
        """
        try:
            # Create message container
            msg = MIMEMultipart()
            msg['From'] = self.from_email
            msg['To'] = to_email
            msg['Subject'] = subject
            
            # Add body to email
            msg.attach(MIMEText(body, 'plain'))
            
            # Add PDF attachment if provided
            if pdf_path and os.path.exists(pdf_path):
                with open(pdf_path, "rb") as attachment:
                    part = MIMEBase('application', 'octet-stream')
                    part.set_payload(attachment.read())
                
                encoders.encode_base64(part)
                part.add_header(
                    'Content-Disposition',
                    f'attachment; filename= {os.path.basename(pdf_path)}',
                )
                msg.attach(part)
            
            # Create SMTP session
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()  # Enable TLS encryption
            server.login(self.smtp_username, self.smtp_password)
            
            # Send email
            text = msg.as_string()
            server.sendmail(self.from_email, to_email, text)
            server.quit()
            
            return True
            
        except Exception as e:
            print(f"Error sending email: {str(e)}", file=sys.stderr)
            return False
    
    def test_connection(self) -> bool:
        """
        Test SMTP connection without sending an email
        
        Returns:
            bool: True if connection successful, False otherwise
        """
        try:
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.smtp_username, self.smtp_password)
            server.quit()
            return True
        except Exception as e:
            print(f"SMTP connection test failed: {str(e)}", file=sys.stderr)
            return False

def main():
    """
    Main function for command-line usage
    Expected JSON input format:
    {
        "to_email": "client@example.com",
        "subject": "Your Invoice",
        "body": "Email body content",
        "pdf_path": "/path/to/invoice.pdf" (optional)
    }
    """
    try:
        # Read JSON input from stdin
        input_data = json.loads(sys.stdin.read())
        
        # Create email service instance
        email_service = SMTPEmailService()
        
        # Send email
        success = email_service.send_invoice_email(
            to_email=input_data['to_email'],
            subject=input_data['subject'],
            body=input_data['body'],
            pdf_path=input_data.get('pdf_path')
        )
        
        # Return result as JSON
        result = {"success": success}
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {"success": False, "error": str(e)}
        print(json.dumps(error_result), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()