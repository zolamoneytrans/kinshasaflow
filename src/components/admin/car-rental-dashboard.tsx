'use client';
import React from 'react';
import { useUser, useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { WithId, CarBooking } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, Car } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '../ui/badge';

// Wrapper to protect the admin page
const ProtectedAdmin = ({ children }: { children: React.ReactNode }) => {
    const { user, isUserLoading } = useUser();
    const router = useRouter();

    if (isUserLoading) {
        return <div className="flex h-full w-full items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (!user || user.email !== 'drnduwa@gmail.com') {
        return (
            <div className="flex flex-col h-full w-full items-center justify-center gap-4">
                <AlertTriangle className="h-12 w-12 text-destructive" />
                <h2 className="text-2xl font-bold">Accès Refusé</h2>
                <p className="text-muted-foreground">Vous n'avez pas les autorisations nécessaires pour voir cette page.</p>
                <Button onClick={() => router.push('/')}>Retour à l'accueil</Button>
            </div>
        );
    }
    return <>{children}</>;
};

const BookingRow = ({ booking }: { booking: WithId<CarBooking> }) => {
    const formattedCreatedDate = booking.createdAt?.toDate ? format(booking.createdAt.toDate(), 'dd MMM yyyy, HH:mm', { locale: fr }) : 'N/A';
    
    const durationDisplay = booking.numberOfDays 
        ? `${booking.numberOfDays} jour${booking.numberOfDays > 1 ? 's' : ''}` 
        : 'N/A';

    return (
        <TableRow>
            <TableCell>
                <div className="font-medium">{booking.userName}</div>
                <div className="text-sm text-muted-foreground">{booking.userPhone}</div>
                 <div className="text-sm text-muted-foreground">{booking.userAddress}</div>
            </TableCell>
            <TableCell>
                 <div className="font-medium">{booking.carName}</div>
            </TableCell>
            <TableCell>
                <div>{durationDisplay}</div>
            </TableCell>
            <TableCell>
                <Badge variant={booking.status === 'pending' ? 'secondary' : 'default'}>{booking.status}</Badge>
            </TableCell>
            <TableCell>{formattedCreatedDate}</TableCell>
        </TableRow>
    );
};

export default function CarRentalAdminDashboard() {
    const { firestore } = useFirebase();

    const bookingsCollection = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'car_bookings');
    }, [firestore]);

    const bookingsQuery = useMemoFirebase(() => {
        if (!bookingsCollection) return null;
        return query(bookingsCollection, orderBy('createdAt', 'desc'));
    }, [bookingsCollection]);

    const { data: bookings, isLoading } = useCollection<CarBooking>(bookingsQuery);

    return (
        <ProtectedAdmin>
            <div className="w-full h-full flex flex-col">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Car /> Tableau de Bord Location</CardTitle>
                        <CardDescription>Consultez les réservations de véhicules.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Client</TableHead>
                                        <TableHead>Véhicule</TableHead>
                                        <TableHead>Durée</TableHead>
                                        <TableHead>Statut</TableHead>
                                        <TableHead>Date de réservation</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center">
                                                <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                                            </TableCell>
                                        </TableRow>
                                    ) : bookings && bookings.length > 0 ? (
                                        bookings.map(booking => <BookingRow key={booking.id} booking={booking} />)
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="h-24 text-center">Aucune réservation trouvée.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </ProtectedAdmin>
    );
}
