import { StatsGrid } from "@/components/dashboard/stats-grid";
import { Charts } from "@/components/dashboard/charts";
import { RecentInvoices } from "@/components/dashboard/recent-invoices";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, FileText, Mail, BarChart3, Settings } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Welcome back! Here's your business overview.
          </p>
        </div>
        <Link href="/create-invoice">
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Invoice
          </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <StatsGrid />

      {/* Charts */}
      <Charts />

      {/* Recent Invoices */}
      <RecentInvoices />

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Link href="/create-invoice">
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors border-2 border-dashed border-border">
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              <Plus className="h-8 w-8 text-muted-foreground mb-3" />
              <h3 className="font-medium text-foreground">Quick Invoice</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Create invoice with preset template
              </p>
            </CardContent>
          </Card>
        </Link>

        <Card className="cursor-pointer hover:bg-muted/50 transition-colors border-2 border-dashed border-border">
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <Mail className="h-8 w-8 text-muted-foreground mb-3" />
            <h3 className="font-medium text-foreground">Bulk Email</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Send reminders to pending invoices
            </p>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:bg-muted/50 transition-colors border-2 border-dashed border-border">
          <CardContent className="flex flex-col items-center justify-center p-6 text-center">
            <FileText className="h-8 w-8 text-muted-foreground mb-3" />
            <h3 className="font-medium text-foreground">Export Report</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Download monthly financial report
            </p>
          </CardContent>
        </Card>

        <Link href="/templates">
          <Card className="cursor-pointer hover:bg-muted/50 transition-colors border-2 border-dashed border-border">
            <CardContent className="flex flex-col items-center justify-center p-6 text-center">
              <Settings className="h-8 w-8 text-muted-foreground mb-3" />
              <h3 className="font-medium text-foreground">Templates</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Manage email and PDF templates
              </p>
            </CardContent>
          </Card>
        </Link>
      </div>
    </div>
  );
}
