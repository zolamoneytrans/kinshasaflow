'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { PlaceHolderImages, type ImagePlaceholder } from '@/lib/placeholder-images';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

// Simulating traffic hotspots with high severity
const trafficHotspots = [
    { name: "Rond-point Victoire", top: "45%", left: "55%", imageId: "rond-point-victoire-traffic" },
    { name: "Boulevard du 30 Juin", top: "30%", left: "40%", imageId: "boulevard-30-juin-traffic" },
    { name: "Pont Matete", top: "65%", left: "70%", imageId: "pont-matete-traffic" },
    { name: "Marché Central", top: "40%", left: "48%", imageId: "marche-central-traffic" },
    { name: "Rond-point Ngaba", top: "75%", left: "60%", imageId: "pont-matete-traffic" },
    { name: "Kintambo Magasin", top: "25%", left: "30%", imageId: "boulevard-30-juin-traffic" },
    { name: "Stade des Martyrs", top: "38%", left: "65%", imageId: "rond-point-victoire-traffic" },
    { name: "N'djili, Quartier 7", top: "80%", left: "85%", imageId: "pont-matete-traffic" },
    { name: "Avenue des Poids Lourds", top: "50%", left: "20%", imageId: "marche-central-traffic" },
];

export default function TrafficMap() {
  const mapPlaceholder = PlaceHolderImages.find(p => p.id === 'kinshasa-map-placeholder');
  
  const [selectedHotspot, setSelectedHotspot] = useState<{name: string, image: ImagePlaceholder | undefined} | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const getHotspotImage = (imageId: string) => {
    return PlaceHolderImages.find(p => p.id === imageId);
  }

  const handleHotspotClick = (spot: typeof trafficHotspots[0]) => {
    setSelectedHotspot({name: spot.name, image: getHotspotImage(spot.imageId)});
    setIsDialogOpen(true);
  }

  return (
    <>
      <Card className="h-full w-full">
        <CardContent className="p-0 h-full">
          <div className="relative h-full w-full rounded-lg overflow-hidden">
              {mapPlaceholder && (
                <Image
                  src={mapPlaceholder.imageUrl}
                  alt="Carte de Kinshasa"
                  fill
                  className="object-cover"
                  data-ai-hint={mapPlaceholder.imageHint}
                  priority
                />
              )}

              <div className="absolute inset-0">
                {trafficHotspots.map((spot, index) => (
                    <div
                        key={index}
                        className="absolute flex flex-col items-center cursor-pointer group"
                        style={{ top: spot.top, left: spot.left, transform: 'translate(-50%, -50%)' }}
                        onClick={() => handleHotspotClick(spot)}
                    >
                        <div className="w-max mb-1 rounded-md bg-black/70 px-2 py-0.5 text-xs font-semibold text-white shadow-md transition-all group-hover:scale-110">
                            {spot.name}
                        </div>
                        <div className="w-4 h-4 rounded-full bg-destructive border-2 border-white animate-pulse transition-all group-hover:scale-125">
                            <span className="sr-only">{spot.name}</span>
                        </div>
                    </div>
                ))}
              </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-3xl">
              <DialogHeader>
                  <DialogTitle>Vue de la rue : {selectedHotspot?.name}</DialogTitle>
                  <DialogDescription>
                      Image représentative du trafic à cet endroit.
                  </DialogDescription>
              </DialogHeader>
              {selectedHotspot?.image ? (
                  <div className="mt-4 rounded-lg overflow-hidden aspect-video relative">
                      <Image
                          src={selectedHotspot.image.imageUrl}
                          alt={`Vue de la rue de ${selectedHotspot.name}`}
                          fill
                          className="object-cover"
                          data-ai-hint={selectedHotspot.image.imageHint}
                      />
                  </div>
              ) : selectedHotspot ? (
                <div className="flex flex-col items-center justify-center h-48 text-muted-foreground text-center">
                  <p className="font-medium">Image non disponible pour {selectedHotspot.name}.</p>
                  <p className="text-sm">Il y a peut-être un problème avec la configuration de l'image.</p>
                </div>
              ) : null}
          </DialogContent>
      </Dialog>
    </>
  );
}
