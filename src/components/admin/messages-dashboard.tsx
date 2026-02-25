'use client';
import React from 'react';
import { useUser, useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { WithId, Inquiry } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, Mail } from 'lucide-react';
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

const InquiryRow = ({ inquiry }: { inquiry: WithId<Inquiry> }) => {
    const formattedDate = inquiry.createdAt?.toDate ? format(inquiry.createdAt.toDate(), 'dd MMM yyyy, HH:mm', { locale: fr }) : 'N/A';

    const typeMap = {
        inquiry: { label: 'Demande', variant: 'secondary' },
        suggestion: { label: 'Suggestion', variant: 'default' },
        complaint: { label: 'Plainte', variant: 'destructive' },
    } as const;
    const typeConfig = typeMap[inquiry.type] || { label: 'Inconnu', variant: 'secondary' };

    return (
        <TableRow>
            <TableCell>
                <div className="font-medium">{inquiry.subject}</div>
                <div className="text-sm text-muted-foreground">{inquiry.userEmail}</div>
            </TableCell>
            <TableCell>
                <Badge variant={typeConfig.variant as any}>{typeConfig.label}</Badge>
            </TableCell>
             <TableCell className="max-w-md">
                <p className="truncate">{inquiry.message}</p>
            </TableCell>
            <TableCell>{formattedDate}</TableCell>
        </TableRow>
    );
};

export default function MessagesDashboard() {
    const { firestore } = useFirebase();

    const inquiriesCollection = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'inquiries');
    }, [firestore]);

    const inquiriesQuery = useMemoFirebase(() => {
        if (!inquiriesCollection) return null;
        return query(inquiriesCollection, orderBy('createdAt', 'desc'));
    }, [inquiriesCollection]);

    const { data: inquiries, isLoading } = useCollection<Inquiry>(inquiriesQuery);

    return (
        <ProtectedAdmin>
            <div className="w-full h-full flex flex-col">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Mail /> Boîte de réception</CardTitle>
                        <CardDescription>Consultez les messages envoyés par les utilisateurs.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="border rounded-md">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Sujet / Contact</TableHead>
                                        <TableHead>Type</TableHead>
                                        <TableHead>Message</TableHead>
                                        <TableHead>Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center">
                                                <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                                            </TableCell>
                                        </TableRow>
                                    ) : inquiries && inquiries.length > 0 ? (
                                        inquiries.map(inquiry => <InquiryRow key={inquiry.id} inquiry={inquiry} />)
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="h-24 text-center">Aucun message trouvé.</TableCell>
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
