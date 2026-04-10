'use client';

import React from 'react';
import { useUser, useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { WithId, TourismBooking } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, Palmtree, Users, Calendar, Phone, User } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';

export default function TourismAdminDashboard() {
    const { user, isUserLoading } = useUser();
    const { firestore } = useFirebase();
    const router = useRouter();

    const bookingsRef = useMemoFirebase(() => collection(firestore, 'tourism_bookings'), [firestore]);
    const bookingsQuery = useMemoFirebase(() => query(bookingsRef, orderBy('createdAt', 'desc')), [bookingsRef]);
    const { data: bookings, isLoading } = useCollection<TourismBooking>(bookingsQuery);

    if (isUserLoading) return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;

    const isAdmin = user?.email === 'drnduwa@gmail.com';
    const isTourismAdmin = user?.email === 'contact.congonamotema@gmail.com' || isAdmin;

    if (!user || !isTourismAdmin) {
        return (
            <div className="flex flex-col h-full w-full items-center justify-center gap-4">
                <AlertTriangle className="h-12 w-12 text-destructive" />
                <h2 className="text-2xl font-bold">Accès Refusé</h2>
                <p className="text-muted-foreground">Espace réservé à l'administration du tourisme.</p>
                <Button onClick={() => router.push('/')}>Retour à l'accueil</Button>
            </div>
        );
    }

    return (
        <div className="w-full h-full overflow-y-auto p-4 md:p-8 space-y-8">
            <div className="max-w-6xl mx-auto space-y-8">
                <div>
                    <h1 className="text-3xl font-black flex items-center gap-3">
                        <Palmtree className="text-primary h-8 w-8" />
                        Réservations Touristiques
                    </h1>
                    <p className="text-muted-foreground font-medium">Suivi des demandes d'excursions et de séjours.</p>
                </div>

                <Card className="border-none shadow-sm overflow-hidden">
                    <CardHeader className="bg-slate-50/50">
                        <CardTitle className="text-lg">Dernières Demandes ({bookings?.length || 0})</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Client</TableHead>
                                    <TableHead>Expérience</TableHead>
                                    <TableHead>Participants</TableHead>
                                    <TableHead>Date demande</TableHead>
                                    <TableHead>Statut</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan={5} className="h-32 text-center"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
                                ) : bookings && bookings.length > 0 ? (
                                    bookings.map((booking) => (
                                        <TableRow key={booking.id}>
                                            <TableCell>
                                                <div className="font-bold flex items-center gap-2"><User className="h-3 w-3" /> {booking.userName}</div>
                                                <div className="text-xs text-muted-foreground flex items-center gap-2"><Phone className="h-3 w-3" /> {booking.userPhone}</div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="font-medium text-primary">{booking.eventTitle}</div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="flex items-center gap-1 w-fit">
                                                    <Users className="h-3 w-3" /> {booking.numberOfPeople} pers.
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {booking.createdAt?.toDate ? format(booking.createdAt.toDate(), 'dd MMM yyyy, HH:mm', { locale: fr }) : '...'}
                                            </TableCell>
                                            <TableCell>
                                                <Badge className={booking.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}>
                                                    {booking.status === 'pending' ? 'En attente' : 'Confirmé'}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                ) : (
                                    <TableRow><TableCell colSpan={5} className="h-32 text-center italic text-muted-foreground">Aucune réservation pour le moment.</TableCell></TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
