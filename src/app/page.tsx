import TrafficMap from "@/components/traffic-map";
import TrafficReports from "@/components/traffic-reports";
import ReportTrafficForm from "@/components/report-traffic-form";

export default function Home() {
  return (
    <div className="flex h-screen bg-background">
      <main className="flex-1 flex flex-col">
        <header className="bg-card border-b p-4">
          <h1 className="text-2xl font-bold text-primary">Kinshasa Flow</h1>
          <p className="text-muted-foreground">Real-time traffic updates for Kinshasa</p>
        </header>
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 overflow-hidden">
          <div className="lg:col-span-2 h-full">
            <TrafficMap />
          </div>
          <div className="flex flex-col gap-4 h-[calc(100vh-100px)]">
            <ReportTrafficForm />
            <TrafficReports />
          </div>
        </div>
      </main>
    </div>
  );
}
