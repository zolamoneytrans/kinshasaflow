'use client';

import React from 'react';
import { Annonce, WithId } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Landmark, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, where, Timestamp } from 'firebase/firestore';

const AnnonceItem = ({ annonce }: { annonce: WithId<Annonce> }) => {
    const formattedTime = annonce.createdAt ? format(annonce.createdAt.toDate(), 'd MMMM yyyy', { locale: fr }) : '...';

    return (
        <div className="p-4 rounded-lg border bg-background transition-colors">
            <h3 className="font-semibold text-card-foreground mb-2">{annonce.title}</h3>
            <p className="text-sm text-muted-foreground mb-3 whitespace-pre-wrap">{annonce.content}</p>
            <div className="flex justify-between items-center text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                    <Landmark className="h-4 w-4" />
                    <span>{annonce.source}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>Publié le {formattedTime}</span>
                </div>
            </div>
        </div>
    );
};

const AnnonceSkeleton = () => (
    <div className="p-4 rounded-lg border space-y-3">
        <Skeleton className="h-5 w-3/4" />
        <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
        </div>
        <div className="flex justify-between mt-2">
            <Skeleton className="h-4 w-1/3" />
            <Skeleton className="h-4 w-1/4" />
        </div>
    </div>
);

export default function AnnoncesFeed() {
    const { firestore } = useFirebase();

    const annoncesCollection = useMemoFirebase(() => collection(firestore, 'annonces'), [firestore]);
    const annoncesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        // Filter for announcements from January 1st, 2025 to December 31st, 2026
        const startDate = new Date('2025-01-01T00:00:00Z');
        const endDate = new Date('2027-01-01T00:00:00Z'); // up to, but not including, Jan 1 2027
        return query(
            annoncesCollection,
            where('createdAt', '>=', Timestamp.fromDate(startDate)),
            where('createdAt', '<', Timestamp.fromDate(endDate)),
            orderBy('createdAt', 'desc')
        );
    }, [firestore, annoncesCollection]);
    const { data: announcements, isLoading } = useCollection<Annonce>(annoncesQuery);

    return (
        <Card className="flex-1 flex flex-col overflow-hidden">
            <CardHeader>
                <CardTitle>
                    <div className="flex items-center gap-2">
                        <Landmark className="text-primary" />
                        Annonces Officielles
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
                <div className="space-y-4">
                    {isLoading ? (
                        Array.from({ length: 3 }).map((_, i) => <AnnonceSkeleton key={i} />)
                    ) : announcements && announcements.length > 0 ? (
                        announcements.map(annonce => (
                            <AnnonceItem key={annonce.id} annonce={annonce} />
                        ))
                    ) : (
                        <div className="p-4 rounded-lg border bg-background text-card-foreground text-center">
                            <p className="text-muted-foreground">Aucune annonce pour la période sélectionnée.</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}