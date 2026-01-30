import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import TrafficMap from '@/components/traffic-map';

export default function MapPage() {
  return (
    <div className="flex h-screen bg-background">
      <main className="flex-1 flex flex-col">
        <header className="bg-card border-b p-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Link href="/" legacyBehavior>
              <Button variant="outline" size="icon" asChild>
                <a><ArrowLeft /></a>
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold text-primary">Carte du Trafic en Direct</h1>
              <p className="text-muted-foreground">Points chauds de la circulation à Kinshasa</p>
            </div>
          </div>
        </header>
        <div className="flex-1 p-4">
          <TrafficMap />
        </div>
      </main>
    </div>
  );
}
