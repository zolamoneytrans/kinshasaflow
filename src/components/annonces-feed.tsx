'use client';

import React, { useState, useEffect } from 'react';
import { Annonce, dummyAnnouncements } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Landmark, Calendar, RefreshCw, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

const AnnonceItem = ({ annonce }: { annonce: Annonce }) => {
    return (
        <div className="p-4 rounded-lg border bg-background transition-colors">
            <h3 className="font-semibold text-card-foreground mb-2">{annonce.title}</h3>
            <p className="text-sm text-muted-foreground mb-3">{annonce.content}</p>
            <div className="flex justify-between items-center text-xs text-muted-foreground">
                <div className="flex items-center gap-2">
                    <Landmark className="h-4 w-4" />
                    <span>{annonce.source}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    <span>{format(new Date(annonce.publishedAt), "d MMMM yyyy", { locale: fr })}</span>
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
    const [announcements, setAnnouncements] = useState<Annonce[]>([]);
    const [loading, setLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchData = (isRefresh = false) => {
        if (isRefresh) {
            setIsRefreshing(true);
        }
        setLoading(true);

        // Simulate fetching data
        setTimeout(() => {
            // Shuffle for refresh effect
            const data = isRefresh ? [...dummyAnnouncements].sort(() => Math.random() - 0.5) : [...dummyAnnouncements];
            setAnnouncements(data.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()));
            setLoading(false);
            if (isRefresh) {
                setIsRefreshing(false);
            }
        }, 1000);
    };

    useEffect(() => {
        fetchData();
        const interval = setInterval(() => {
            fetchData(true);
        }, 15 * 60 * 1000); // 15 minutes

        return () => clearInterval(interval);
    }, []);

    return (
        <Card className="flex-1 flex flex-col overflow-hidden">
            <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <Landmark className="text-primary" />
                        Annonces Officielles
                    </div>
                    <Button size="icon" variant="outline" onClick={() => fetchData(true)} disabled={isRefreshing}>
                        {isRefreshing ? <Loader2 className="animate-spin" /> : <RefreshCw />}
                        <span className="sr-only">Mettre à jour les annonces</span>
                    </Button>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
                <div className="space-y-4">
                    {loading && !isRefreshing ? (
                        Array.from({ length: 10 }).map((_, i) => <AnnonceSkeleton key={i} />)
                    ) : (
                        announcements.map(annonce => (
                            <AnnonceItem key={annonce.id} annonce={annonce} />
                        ))
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
