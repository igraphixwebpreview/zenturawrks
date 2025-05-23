#!/usr/bin/env python3
"""
Automated Reminder Service for Overdue Invoices
Handles sending reminder emails for overdue invoices
"""

import json
import sys
import smtplib
import ssl
import os
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from datetime import datetime, timedelta
from typing import List, Dict, Any

class ReminderService:
    def __init__(self):
        # SMTP Configuration
        self.smtp_server = os.getenv('SMTP_SERVER', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
        self.smtp_username = os.getenv('SMTP_USERNAME', '')
        self.smtp_password = os.getenv('SMTP_PASSWORD', '')
        self.from_email = os.getenv('FROM_EMAIL', self.smtp_username)
        
        # Reminder templates
        self.reminder_templates = {
            'gentle': {
                'subject': 'Friendly Payment Reminder - Invoice {invoice_number}',
                'body': """Dear {client_name},

I hope this email finds you well. This is a friendly reminder that your invoice #{invoice_number} for ${total_amount} was due on {due_date}.

Invoice Details:
- Invoice Number: {invoice_number}
- Amount: ${total_amount}
- Due Date: {due_date}
- Days Overdue: {days_overdue}

We understand that sometimes invoices can be overlooked. If you have any questions about this invoice or need to discuss payment terms, please don't hesitate to reach out.

You can view and download your invoice at any time from our system.

Thank you for your business!

Best regards,
{company_name}"""
            },
            'urgent': {
                'subject': 'URGENT: Payment Required - Invoice {invoice_number}',
                'body': """Dear {client_name},

This is an urgent reminder that your invoice #{invoice_number} for ${total_amount} is now {days_overdue} days overdue.

Invoice Details:
- Invoice Number: {invoice_number}
- Amount: ${total_amount}
- Due Date: {due_date}
- Days Overdue: {days_overdue}

To avoid any service interruption, please arrange payment immediately. If you have already made this payment, please disregard this notice and accept our apologies for any inconvenience.

If you're experiencing difficulties with payment, please contact us immediately to discuss alternative arrangements.

Thank you for your prompt attention to this matter.

Best regards,
{company_name}"""
            },
            'final': {
                'subject': 'FINAL NOTICE - Invoice {invoice_number} - Immediate Action Required',
                'body': """Dear {client_name},

This is a FINAL NOTICE regarding your overdue invoice #{invoice_number} for ${total_amount}, which is now {days_overdue} days past due.

Invoice Details:
- Invoice Number: {invoice_number}
- Amount: ${total_amount}
- Due Date: {due_date}
- Days Overdue: {days_overdue}

IMMEDIATE ACTION REQUIRED: Payment must be received within 7 days to avoid further collection action.

If payment is not received by {final_deadline}, we may be forced to:
- Suspend services
- Forward this account to a collection agency
- Take legal action to recover the debt

Please contact us immediately if you need to discuss payment arrangements.

Best regards,
{company_name}"""
            }
        }
    
    def get_reminder_type(self, days_overdue: int) -> str:
        """Determine reminder type based on days overdue"""
        if days_overdue <= 7:
            return 'gentle'
        elif days_overdue <= 30:
            return 'urgent'
        else:
            return 'final'
    
    def send_reminder_email(self, invoice: Dict[str, Any], reminder_type: str = None) -> bool:
        """Send reminder email for overdue invoice"""
        try:
            # Calculate days overdue
            due_date = datetime.fromisoformat(invoice['dueDate'].replace('Z', '+00:00'))
            days_overdue = (datetime.now(due_date.tzinfo) - due_date).days
            
            # Auto-determine reminder type if not specified
            if not reminder_type:
                reminder_type = self.get_reminder_type(days_overdue)
            
            template = self.reminder_templates[reminder_type]
            
            # Calculate final deadline (7 days from now)
            final_deadline = (datetime.now() + timedelta(days=7)).strftime('%B %d, %Y')
            
            # Prepare email data
            email_data = {
                'client_name': invoice['clientName'],
                'invoice_number': invoice['invoiceNumber'],
                'total_amount': invoice['total'],
                'due_date': due_date.strftime('%B %d, %Y'),
                'days_overdue': days_overdue,
                'company_name': invoice.get('companyName', 'Your Company'),
                'final_deadline': final_deadline
            }
            
            # Replace placeholders in subject and body
            subject = template['subject'].format(**email_data)
            body = template['body'].format(**email_data)
            
            # Create email message
            msg = MIMEMultipart()
            msg['From'] = self.from_email
            msg['To'] = invoice['clientEmail']
            msg['Subject'] = subject
            
            # Add body to email
            msg.attach(MIMEText(body, 'plain'))
            
            # Send email
            server = smtplib.SMTP(self.smtp_server, self.smtp_port)
            server.starttls()
            server.login(self.smtp_username, self.smtp_password)
            
            text = msg.as_string()
            server.sendmail(self.from_email, invoice['clientEmail'], text)
            server.quit()
            
            return True
            
        except Exception as e:
            print(f"Error sending reminder email: {str(e)}", file=sys.stderr)
            return False
    
    def process_overdue_invoices(self, invoices: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Process all overdue invoices and send reminders"""
        results = {
            'processed': 0,
            'sent': 0,
            'failed': 0,
            'skipped': 0,
            'details': []
        }
        
        current_time = datetime.now()
        
        for invoice in invoices:
            try:
                # Check if invoice is overdue
                due_date = datetime.fromisoformat(invoice['dueDate'].replace('Z', '+00:00'))
                days_overdue = (current_time.replace(tzinfo=due_date.tzinfo) - due_date).days
                
                if days_overdue <= 0 or invoice['status'] == 'paid':
                    results['skipped'] += 1
                    results['details'].append({
                        'invoice': invoice['invoiceNumber'],
                        'status': 'skipped',
                        'reason': 'Not overdue or already paid'
                    })
                    continue
                
                results['processed'] += 1
                
                # Send reminder
                reminder_type = self.get_reminder_type(days_overdue)
                success = self.send_reminder_email(invoice, reminder_type)
                
                if success:
                    results['sent'] += 1
                    results['details'].append({
                        'invoice': invoice['invoiceNumber'],
                        'status': 'sent',
                        'type': reminder_type,
                        'days_overdue': days_overdue,
                        'client': invoice['clientName']
                    })
                else:
                    results['failed'] += 1
                    results['details'].append({
                        'invoice': invoice['invoiceNumber'],
                        'status': 'failed',
                        'reason': 'Email sending failed'
                    })
                    
            except Exception as e:
                results['failed'] += 1
                results['details'].append({
                    'invoice': invoice.get('invoiceNumber', 'Unknown'),
                    'status': 'failed',
                    'reason': str(e)
                })
        
        return results

def main():
    """Command line interface for reminder service"""
    try:
        # Read JSON input from stdin
        input_data = json.loads(sys.stdin.read())
        
        # Create reminder service
        reminder_service = ReminderService()
        
        # Process reminders
        invoices = input_data.get('invoices', [])
        results = reminder_service.process_overdue_invoices(invoices)
        
        # Return results
        result = {
            "success": True,
            "results": results,
            "message": f"Processed {results['processed']} overdue invoices, sent {results['sent']} reminders"
        }
        
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {
            "success": False,
            "error": str(e),
            "message": "Failed to process reminder emails"
        }
        print(json.dumps(error_result), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()