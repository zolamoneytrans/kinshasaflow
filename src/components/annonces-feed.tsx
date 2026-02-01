'use client';

import React from 'react';
import { Annonce, dummyAnnouncements } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Landmark, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const AnnonceCard = ({ annonce }: { annonce: Annonce }) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>{annonce.title}</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">{annonce.content}</p>
            </CardContent>
            <CardFooter className="flex justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                    <Landmark className="h-4 w-4" />
                    <span>{annonce.source}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{format(new Date(annonce.publishedAt), "d MMMM yyyy", { locale: fr })}</span>
                </div>
            </CardFooter>
        </Card>
    );
};

export default function AnnoncesFeed() {
  const sortedAnnouncements = [...dummyAnnouncements].sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
  
  return (
    <div className="w-full h-full overflow-y-auto pr-2">
        <div className="max-w-3xl mx-auto space-y-4 pb-4">
            {sortedAnnouncements.map(annonce => (
                <AnnonceCard key={annonce.id} annonce={annonce} />
            ))}
        </div>
    </div>
  );
}
