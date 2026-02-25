import { AppShell } from "@/components/app-shell";
import MessagesDashboard from "@/components/admin/messages-dashboard";

export default function AdminMessagesPage() {
  return (
    <AppShell>
      <MessagesDashboard />
    </AppShell>
  );
}
