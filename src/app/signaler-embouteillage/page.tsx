import { AppShell } from "@/components/app-shell";
import ReportTrafficForm from "@/components/report-traffic-form";

export default function SignalerEmbouteillagePage() {
  return (
    <AppShell>
      <div className="w-full h-full overflow-y-auto">
        <div className="max-w-2xl mx-auto py-4">
            <ReportTrafficForm />
        </div>
      </div>
    </AppShell>
  );
}
