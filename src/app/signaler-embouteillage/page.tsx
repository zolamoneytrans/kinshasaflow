import { AppShell } from "@/components/app-shell";
import ReportTrafficForm from "@/components/report-traffic-form";

export default function SignalerEmbouteillagePage() {
  return (
    <AppShell>
      <div className="w-full h-full overflow-y-auto bg-slate-50/50">
        <div className="max-w-3xl mx-auto py-8 px-4 md:px-8">
            <ReportTrafficForm />
        </div>
      </div>
    </AppShell>
  );
}
