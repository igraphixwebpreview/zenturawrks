#!/usr/bin/env python3
"""
Accounting Software Export Module
Exports invoice data to various accounting software formats
"""

import json
import sys
import csv
from io import StringIO
from datetime import datetime
from typing import Dict, List, Any, Optional
import xml.etree.ElementTree as ET

class AccountingExporter:
    def __init__(self):
        self.supported_formats = [
            'quickbooks_iif',
            'xero_csv', 
            'sage_csv',
            'freshbooks_csv',
            'wave_csv',
            'generic_csv'
        ]
    
    def export_to_quickbooks_iif(self, invoices: List[Dict[str, Any]]) -> str:
        """Export invoices to QuickBooks IIF format"""
        iif_content = []
        iif_content.append("!HDR\tPROD\tVER\tREL\tIIFVER\tDATE\tTIME\tACCNT")
        iif_content.append("HDR\tQuickBooks Pro\t2023\tRelease\t1\t" + 
                          datetime.now().strftime("%m/%d/%Y") + "\t" +
                          datetime.now().strftime("%H:%M:%S") + "\tN")
        
        iif_content.append("!TRNS\tTRNSTYPE\tDATE\tACCNT\tNAME\tCLASS\tAMOUNT\tDOCNUM\tMEMO\tCLEAR\tTOPRINT\tNAMEADDR1\tNAMEADDR2\tNAMEADDR3\tNAMEADDR4\tNAMEADDR5\tDUEDATE\tTERMS\tPAID\tSHIPDATE")
        
        for invoice in invoices:
            # Transaction header
            date_str = datetime.fromisoformat(invoice['invoiceDate'].replace('Z', '+00:00')).strftime("%m/%d/%Y")
            due_date_str = datetime.fromisoformat(invoice['dueDate'].replace('Z', '+00:00')).strftime("%m/%d/%Y")
            
            iif_content.append(f"TRNS\tINVOICE\t{date_str}\tAccounts Receivable\t{invoice['clientName']}\t\t{invoice['total']}\t{invoice['invoiceNumber']}\t\tN\tY\t{invoice['addressLine1']}\t{invoice['city']}\t{invoice['country']}\t\t\t{due_date_str}\tNet 30\tN\t")
            
            # Items
            items = json.loads(invoice['items']) if isinstance(invoice['items'], str) else invoice['items']
            for item in items:
                iif_content.append(f"SPL\t{date_str}\tSales\t{invoice['clientName']}\t\t-{item['amount']}\t{invoice['invoiceNumber']}\t{item['name']}: {item.get('description', '')}\tN\tY")
        
        iif_content.append("ENDTRNS")
        return "\n".join(iif_content)
    
    def export_to_xero_csv(self, invoices: List[Dict[str, Any]]) -> str:
        """Export invoices to Xero CSV format"""
        output = StringIO()
        fieldnames = [
            'ContactName', 'EmailAddress', 'POAddressLine1', 'POCity', 'POCountry',
            'InvoiceNumber', 'InvoiceDate', 'DueDate', 'Total', 'Status',
            'Description', 'Quantity', 'UnitAmount', 'AccountCode', 'TaxType'
        ]
        
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        
        for invoice in invoices:
            items = json.loads(invoice['items']) if isinstance(invoice['items'], str) else invoice['items']
            
            for item in items:
                row = {
                    'ContactName': invoice['clientName'],
                    'EmailAddress': invoice['clientEmail'],
                    'POAddressLine1': invoice['addressLine1'],
                    'POCity': invoice['city'],
                    'POCountry': invoice['country'],
                    'InvoiceNumber': invoice['invoiceNumber'],
                    'InvoiceDate': datetime.fromisoformat(invoice['invoiceDate'].replace('Z', '+00:00')).strftime("%d/%m/%Y"),
                    'DueDate': datetime.fromisoformat(invoice['dueDate'].replace('Z', '+00:00')).strftime("%d/%m/%Y"),
                    'Total': invoice['total'],
                    'Status': invoice['status'].upper(),
                    'Description': f"{item['name']}: {item.get('description', '')}",
                    'Quantity': item['quantity'],
                    'UnitAmount': item['rate'],
                    'AccountCode': '200',  # Sales account
                    'TaxType': 'GST'
                }
                writer.writerow(row)
        
        return output.getvalue()
    
    def export_to_sage_csv(self, invoices: List[Dict[str, Any]]) -> str:
        """Export invoices to Sage CSV format"""
        output = StringIO()
        fieldnames = [
            'Customer', 'Invoice_No', 'Date', 'Due_Date', 'Reference',
            'Description', 'Net_Amount', 'Tax_Amount', 'Total_Amount',
            'Status', 'Currency'
        ]
        
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        
        for invoice in invoices:
            vat_amount = float(invoice.get('vat', 0)) / 100 * float(invoice['subtotal']) if invoice.get('vat') else 0
            
            row = {
                'Customer': invoice['clientName'],
                'Invoice_No': invoice['invoiceNumber'],
                'Date': datetime.fromisoformat(invoice['invoiceDate'].replace('Z', '+00:00')).strftime("%d/%m/%Y"),
                'Due_Date': datetime.fromisoformat(invoice['dueDate'].replace('Z', '+00:00')).strftime("%d/%m/%Y"),
                'Reference': invoice['invoiceNumber'],
                'Description': f"Invoice for {invoice['clientName']}",
                'Net_Amount': invoice['subtotal'],
                'Tax_Amount': f"{vat_amount:.2f}",
                'Total_Amount': invoice['total'],
                'Status': invoice['status'].title(),
                'Currency': 'USD'
            }
            writer.writerow(row)
        
        return output.getvalue()
    
    def export_to_wave_csv(self, invoices: List[Dict[str, Any]]) -> str:
        """Export invoices to Wave CSV format"""
        output = StringIO()
        fieldnames = [
            'Customer name', 'Customer email', 'Invoice number', 'Invoice date',
            'Due date', 'Product/Service', 'Description', 'Quantity', 'Rate',
            'Amount', 'Tax name', 'Tax rate', 'Invoice total', 'Invoice status'
        ]
        
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        
        for invoice in invoices:
            items = json.loads(invoice['items']) if isinstance(invoice['items'], str) else invoice['items']
            
            for i, item in enumerate(items):
                row = {
                    'Customer name': invoice['clientName'],
                    'Customer email': invoice['clientEmail'],
                    'Invoice number': invoice['invoiceNumber'],
                    'Invoice date': datetime.fromisoformat(invoice['invoiceDate'].replace('Z', '+00:00')).strftime("%Y-%m-%d"),
                    'Due date': datetime.fromisoformat(invoice['dueDate'].replace('Z', '+00:00')).strftime("%Y-%m-%d"),
                    'Product/Service': item['name'],
                    'Description': item.get('description', ''),
                    'Quantity': item['quantity'],
                    'Rate': f"{item['rate']:.2f}",
                    'Amount': f"{item['amount']:.2f}",
                    'Tax name': 'VAT' if invoice.get('vat') and float(invoice['vat']) > 0 else '',
                    'Tax rate': f"{invoice.get('vat', 0)}%" if invoice.get('vat') else '',
                    'Invoice total': invoice['total'] if i == 0 else '',  # Only show total on first item
                    'Invoice status': invoice['status'].title()
                }
                writer.writerow(row)
        
        return output.getvalue()
    
    def export_to_generic_csv(self, invoices: List[Dict[str, Any]]) -> str:
        """Export invoices to generic CSV format"""
        output = StringIO()
        fieldnames = [
            'Invoice Number', 'Client Name', 'Client Email', 'Invoice Date',
            'Due Date', 'Subtotal', 'Discount', 'Tax Rate', 'Tax Amount',
            'Total', 'Status', 'Notes', 'Items JSON'
        ]
        
        writer = csv.DictWriter(output, fieldnames=fieldnames)
        writer.writeheader()
        
        for invoice in invoices:
            row = {
                'Invoice Number': invoice['invoiceNumber'],
                'Client Name': invoice['clientName'],
                'Client Email': invoice['clientEmail'],
                'Invoice Date': datetime.fromisoformat(invoice['invoiceDate'].replace('Z', '+00:00')).strftime("%Y-%m-%d"),
                'Due Date': datetime.fromisoformat(invoice['dueDate'].replace('Z', '+00:00')).strftime("%Y-%m-%d"),
                'Subtotal': invoice['subtotal'],
                'Discount': invoice.get('discount', '0'),
                'Tax Rate': f"{invoice.get('vat', '0')}%",
                'Tax Amount': f"{float(invoice.get('vat', 0)) / 100 * float(invoice['subtotal']) if invoice.get('vat') else 0:.2f}",
                'Total': invoice['total'],
                'Status': invoice['status'].title(),
                'Notes': invoice.get('notes', ''),
                'Items JSON': invoice['items'] if isinstance(invoice['items'], str) else json.dumps(invoice['items'])
            }
            writer.writerow(row)
        
        return output.getvalue()
    
    def export_invoices(self, invoices: List[Dict[str, Any]], format_type: str) -> str:
        """Export invoices to specified format"""
        if format_type not in self.supported_formats:
            raise ValueError(f"Unsupported format: {format_type}")
        
        if format_type == 'quickbooks_iif':
            return self.export_to_quickbooks_iif(invoices)
        elif format_type == 'xero_csv':
            return self.export_to_xero_csv(invoices)
        elif format_type == 'sage_csv':
            return self.export_to_sage_csv(invoices)
        elif format_type == 'wave_csv':
            return self.export_to_wave_csv(invoices)
        elif format_type == 'generic_csv':
            return self.export_to_generic_csv(invoices)
        else:
            return self.export_to_generic_csv(invoices)

def main():
    """Command line interface for accounting export"""
    try:
        # Read JSON input from stdin
        input_data = json.loads(sys.stdin.read())
        
        # Create exporter
        exporter = AccountingExporter()
        
        # Get parameters
        invoices = input_data.get('invoices', [])
        format_type = input_data.get('format', 'generic_csv')
        
        # Export data
        exported_content = exporter.export_invoices(invoices, format_type)
        
        # Return result
        result = {
            "success": True,
            "content": exported_content,
            "format": format_type,
            "count": len(invoices)
        }
        
        print(json.dumps(result))
        
    except Exception as e:
        error_result = {
            "success": False,
            "error": str(e),
            "message": "Failed to export invoices"
        }
        print(json.dumps(error_result), file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()