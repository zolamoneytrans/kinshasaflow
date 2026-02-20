'use client';

import React from 'react';
import { Annonce, WithId } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Landmark, Calendar } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, where, Timestamp } from 'firebase/firestore';

const AnnonceItem = ({ annonce }: { annonce: WithId<Annonce> }) => {
    const formattedTime = annonce.createdAt ? formatDistanceToNow(annonce.createdAt.toDate(), { addSuffix: true, locale: fr }) : '...';

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
                    <span>Publié {formattedTime}</span>
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

const EmptyStateContent = () => (
    <div className="p-4 rounded-lg border bg-background text-card-foreground">
        <h3 className="font-bold text-lg mb-4">Principales annonces en 2025 🚦</h3>
        <h4 className="font-semibold mb-2">Tendances observées</h4>
        <ul className="list-disc pl-5 mb-4 space-y-2 text-muted-foreground">
            <li>
                <span className="font-semibold text-card-foreground">Digitalisation :</span> Introduction des tickets numériques et règles tarifaires plus strictes.
            </li>
            <li>
                <span className="font-semibold text-card-foreground">Diversification :</span> Développement des taxis fluviaux pour élargir les options de transport.
            </li>
            <li>
                <span className="font-semibold text-card-foreground">Régulation et discipline :</span> Encadrement des camions, voitures privées et motos-taxis pour instaurer plus d’ordre dans la circulation.
            </li>
        </ul>
        <p className="text-sm">
            <span className="font-semibold">En résumé,</span> 2025 a marqué une volonté claire de Kinshasa : réduire la congestion, moderniser les systèmes de transport et intégrer les acteurs informels dans une structure plus organisée.
        </p>
    </div>
)

export default function AnnoncesFeed() {
    const { firestore } = useFirebase();

    const annoncesCollection = useMemoFirebase(() => collection(firestore, 'annonces'), [firestore]);
    const annoncesQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        // Filter for announcements from January 1st, 2025 onwards
        const startDate = new Date('2025-01-01T00:00:00Z');
        return query(annoncesCollection, where('createdAt', '>=', Timestamp.fromDate(startDate)), orderBy('createdAt', 'desc'));
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
                        <EmptyStateContent />
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
