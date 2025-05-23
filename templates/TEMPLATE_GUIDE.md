# Quick Start Guide: Word Invoice Templates

## What You Get

✓ **Professional Word Templates** - Use Microsoft Word to design your invoices exactly how you want them  
✓ **Automatic Data Replacement** - Your invoice data fills in automatically  
✓ **PDF Generation** - Word templates convert to professional PDFs  
✓ **Complete Customization** - Add your logo, colors, fonts, and branding  

## Template Codes Reference Card

Copy and paste these codes into your Word document:

### Basic Information
```
{{company_name}}        - Your business name
{{invoice_number}}      - Invoice number (INV-001)
{{invoice_date}}        - Invoice date
{{due_date}}           - Payment due date
{{client_name}}        - Customer name
{{client_email}}       - Customer email
{{total}}              - Final amount ($1,234.56)
```

### For Items Table
```
{{item_name}}          - Service/product name
{{item_description}}   - Description
{{item_quantity}}      - Quantity (1, 2, 3...)
{{item_rate}}          - Price per item ($50.00)
{{item_amount}}        - Line total ($100.00)
```

### Financial Details
```
{{subtotal}}           - Subtotal amount
{{discount_amount}}    - Discount amount
{{vat_amount}}         - Tax amount
{{notes}}              - Invoice notes
```

## Step-by-Step Setup

1. **Open Microsoft Word** and create a new document
2. **Design your invoice layout** with your company branding
3. **Add the template codes** where you want data to appear
4. **Create a table** for invoice items with the item codes
5. **Save as "default_invoice.docx"** in this templates folder
6. **Test it** by creating an invoice in your app!

## Example Layout

```
[Your Company Logo]               INVOICE

Your Company Name                 Invoice #: {{invoice_number}}
123 Business Street               Date: {{invoice_date}}
City, State 12345                 Due Date: {{due_date}}
Phone: (555) 123-4567
Email: info@company.com

BILL TO:
{{client_name}}
{{client_email}}

┌─────────────────┬─────┬─────────┬────────────┐
│ Description     │ Qty │ Rate    │ Amount     │
├─────────────────┼─────┼─────────┼────────────┤
│ {{item_name}}   │ {{item_quantity}} │ {{item_rate}} │ {{item_amount}} │
└─────────────────┴─────┴─────────┴────────────┘

                               Subtotal: {{subtotal}}
                               Tax: {{vat_amount}}
                               Total: {{total}}

Notes: {{notes}}
Thank you for your business!
```

## Ready to Create Your Template?

1. Create your Word template using the codes above
2. Save it as `default_invoice.docx` in this folder
3. Your invoice generator will automatically use it!

The system works with both Word templates (professional) and has a built-in backup system, so you're covered either way!