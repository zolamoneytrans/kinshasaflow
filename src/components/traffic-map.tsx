'use client';

import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// Simulating traffic hotspots with high severity
const trafficHotspots = [
    { name: "Rond-point Victoire", top: "45%", left: "55%" },
    { name: "Boulevard du 30 Juin", top: "30%", left: "40%" },
    { name: "Pont Matete", top: "65%", left: "70%" },
    { name: "Marché Central", top: "40%", left: "48%" },
    { name: "Rond-point Ngaba", top: "75%", left: "60%" },
    { name: "Kintambo Magasin", top: "25%", left: "30%" },
    { name: "Stade des Martyrs", top: "38%", left: "65%" },
    { name: "N'djili, Quartier 7", top: "80%", left: "85%" },
    { name: "Avenue des Poids Lourds", top: "50%", left: "20%" },
];

export default function TrafficMap() {
  const mapPlaceholder = PlaceHolderImages.find(p => p.id === 'kinshasa-map-placeholder');

  return (
    <Card className="h-full w-full">
      <CardContent className="p-0 h-full">
        <TooltipProvider>
          <div className="relative h-full w-full rounded-lg overflow-hidden">
            {mapPlaceholder && (
              <Image
                src={mapPlaceholder.imageUrl}
                alt="Carte de Kinshasa"
                fill
                className="object-cover"
                data-ai-hint={mapPlaceholder.imageHint}
              />
            )}
            {trafficHotspots.map((spot, index) => (
              <Tooltip key={index}>
                <TooltipTrigger asChild>
                  <div
                    className="absolute w-4 h-4 rounded-full bg-destructive border-2 border-white cursor-pointer transform -translate-x-1/2 -translate-y-1/2 animate-pulse"
                    style={{ top: spot.top, left: spot.left }}
                  >
                     <span className="sr-only">{spot.name}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p className="font-bold">{spot.name}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </div>
        </TooltipProvider>
      </CardContent>
    </Card>
  );
}
