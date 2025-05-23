# Invoice Template System

This folder contains Word (.docx) templates for generating professional invoices. The system automatically replaces template codes with actual invoice data.

## Template Codes

Use these codes in your Word template documents. The system will automatically replace them with real data:

### Company Information
- `{{company_name}}` - Your company name
- `{{company_address}}` - Your company address
- `{{company_phone}}` - Your company phone number
- `{{company_email}}` - Your company email
- `{{company_website}}` - Your company website

### Invoice Details
- `{{invoice_number}}` - Invoice number (e.g., INV-001)
- `{{invoice_date}}` - Invoice date (formatted)
- `{{due_date}}` - Payment due date (formatted)
- `{{status}}` - Invoice status (draft, sent, paid, overdue)

### Client Information
- `{{client_name}}` - Client/customer name
- `{{client_email}}` - Client email address
- `{{client_address}}` - Client address
- `{{client_phone}}` - Client phone number

### Financial Information
- `{{subtotal}}` - Subtotal amount
- `{{discount_amount}}` - Discount amount (if applicable)
- `{{vat_rate}}` - VAT/tax rate percentage
- `{{vat_amount}}` - VAT/tax amount
- `{{deposit_amount}}` - Deposit amount (if applicable)
- `{{total}}` - Final total amount
- `{{currency}}` - Currency symbol (default: $)

### Items Table
For invoice items, use these codes in a table:
- `{{item_name}}` - Item/service name
- `{{item_description}}` - Item description
- `{{item_quantity}}` - Quantity
- `{{item_rate}}` - Rate per unit
- `{{item_amount}}` - Line total (quantity × rate)

### Additional Fields
- `{{notes}}` - Invoice notes/terms
- `{{payment_terms}}` - Payment terms
- `{{thank_you_message}}` - Thank you message

## Template Files

Place your Word template files in this folder:

1. **default_invoice.docx** - Main invoice template (required)
2. **estimate_template.docx** - For estimates/quotes (optional)
3. **receipt_template.docx** - For receipts (optional)

## How to Create Templates

1. **Create a new Word document**
2. **Design your invoice layout** with your branding, colors, fonts
3. **Add template codes** where you want data to appear
4. **Create a table for items** with headers and template codes
5. **Save as .docx format** in this templates folder

## Example Template Structure

```
Your Company Name                    INVOICE
123 Business St                      
City, State 12345                    Invoice #: {{invoice_number}}
Phone: (555) 123-4567                Date: {{invoice_date}}
Email: info@company.com              Due Date: {{due_date}}

---

BILL TO:
{{client_name}}
{{client_address}}
{{client_email}}

---

| Description          | Qty | Rate    | Amount     |
|---------------------|-----|---------|------------|
| {{item_name}}       | {{item_quantity}} | {{item_rate}} | {{item_amount}} |

---

                              Subtotal: {{subtotal}}
                              Discount: {{discount_amount}}
                              Tax ({{vat_rate}}%): {{vat_amount}}
                              
                              TOTAL: {{total}}

---

Payment Terms: {{payment_terms}}
Notes: {{notes}}

Thank you for your business!
```

## Template Tips

1. **Use professional fonts** like Calibri, Arial, or Times New Roman
2. **Add your logo** in the header
3. **Use tables for items** to keep things organized
4. **Include payment instructions** in the footer
5. **Test with sample data** before using in production
6. **Keep consistent styling** throughout the document

## Supported Formats

- Input: .docx (Word documents)
- Output: .pdf (automatically converted)

The system will process your templates and generate professional PDF invoices with all the template codes replaced with real invoice data.