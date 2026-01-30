import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Map } from 'lucide-react';
import TrafficReports from "@/components/traffic-reports";

export default function Home() {
  return (
    <div className="flex h-screen bg-background">
      <main className="flex-1 flex flex-col">
        <header className="bg-card border-b p-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-primary">Kinshasa Flow</h1>
            <p className="text-muted-foreground">Mises à jour du trafic en temps réel pour Kinshasa</p>
          </div>
          <Link href="/map">
            <Button>
              <Map className="mr-2 h-4 w-4" />
              Voir la carte
            </Button>
          </Link>
        </header>
        <div className="flex-1 p-4 overflow-hidden">
          <div className="flex flex-col h-full">
            <TrafficReports />
          </div>
        </div>
      </main>
    </div>
  );
}
