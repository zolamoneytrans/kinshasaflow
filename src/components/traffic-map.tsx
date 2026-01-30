'use client';

import Image from 'next/image';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Card, CardContent } from '@/components/ui/card';

export default function TrafficMap() {
  const mapPlaceholder = PlaceHolderImages.find(p => p.id === 'kinshasa-map-placeholder');

  return (
    <Card className="h-full w-full">
      <CardContent className="p-0 h-full">
        <div className="relative h-full w-full rounded-lg overflow-hidden">
          {mapPlaceholder && (
             <Image
                src={mapPlaceholder.imageUrl}
                alt="Map of Kinshasa"
                fill
                className="object-cover"
                data-ai-hint={mapPlaceholder.imageHint}
             />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
          <div className="absolute bottom-4 left-4 text-white">
            <h2 className="text-2xl font-bold">Kinshasa Traffic Map</h2>
            <p>Live hotspots will be shown here</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
