import { AccountingExport } from "@/components/export/accounting-export";
import { QuickExport } from "@/components/export/quick-export";

export default function Export() {
  return (
    <div className="container mx-auto py-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Export Data</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Export your invoices to popular accounting software platforms for seamless bookkeeping.
        </p>
      </div>
      
      {/* Quick Export Section */}
      <QuickExport />
      
      {/* Advanced Export Section */}
      <AccountingExport />
    </div>
  );
}