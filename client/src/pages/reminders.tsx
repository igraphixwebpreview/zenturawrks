import { OverdueReminders } from "@/components/reminders/overdue-reminders";

export default function Reminders() {
  return (
    <div className="container mx-auto py-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Payment Reminders</h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Automatically send professional reminder emails to clients with overdue invoices.
        </p>
      </div>
      
      <OverdueReminders />
    </div>
  );
}