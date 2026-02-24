'use client';
import React from 'react';
import { useUser, useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { WithId, LogementApplication } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, BedDouble } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

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

const ApplicationRow = ({ application }: { application: WithId<LogementApplication> }) => {
    const formattedDate = application.createdAt?.toDate ? format(application.createdAt.toDate(), 'dd MMM yyyy, HH:mm', { locale: fr }) : 'N/A';

    return (
        <TableRow>
            <TableCell>
                <div className="font-medium">{application.name}</div>
                <div className="text-sm text-muted-foreground">{application.email}</div>
                <div className="text-sm text-muted-foreground">{application.phone}</div>
            </TableCell>
            <TableCell>
                <div>{application.address}</div>
                <div className="text-sm text-muted-foreground">{application.city}, {application.country}</div>
                {application.whatsapp && <div className="text-sm text-muted-foreground">WhatsApp: {application.whatsapp}</div>}
            </TableCell>
            <TableCell>
                 <div className="font-medium">{application.logementTitle}</div>
            </TableCell>
            <TableCell>{formattedDate}</TableCell>
        </TableRow>
    );
};

export default function LogementAdminDashboard() {
    const { firestore } = useFirebase();

    const applicationsCollection = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'logement_applications');
    }, [firestore]);

    const applicationsQuery = useMemoFirebase(() => {
        if (!applicationsCollection) return null;
        return query(applicationsCollection, orderBy('createdAt', 'desc'));
    }, [applicationsCollection]);

    const { data: applications, isLoading } = useCollection<LogementApplication>(applicationsQuery);

    return (
        <ProtectedAdmin>
            <div className="w-full h-full flex flex-col">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><BedDouble /> Tableau de Bord Logement</CardTitle>
                        <CardDescription>Consultez les candidatures pour les appartements.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Candidat</TableHead>
                                        <TableHead>Coordonnées</TableHead>
                                        <TableHead>Appartement</TableHead>
                                        <TableHead>Date de candidature</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center">
                                                <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                                            </TableCell>
                                        </TableRow>
                                    ) : applications && applications.length > 0 ? (
                                        applications.map(app => <ApplicationRow key={app.id} application={app} />)
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center">Aucune candidature trouvée.</TableCell>
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
