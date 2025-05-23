import { AccountingExport } from "@/components/export/accounting-export";

export default function Export() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Export Data</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Export your invoices to popular accounting software platforms for seamless bookkeeping.
        </p>
      </div>
      
      <AccountingExport />
    </div>
  );
}