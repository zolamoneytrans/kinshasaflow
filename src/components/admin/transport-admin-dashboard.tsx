'use client';
import React, { useState, useMemo } from 'react';
import { useUser, useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collectionGroup, query, orderBy, where, Query } from 'firebase/firestore';
import { WithId, TransportSubscription } from '@/lib/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge, badgeVariants } from '@/components/ui/badge';
import { type VariantProps } from 'class-variance-authority';
import { Button } from '@/components/ui/button';
import { Loader2, Shield, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ManageSubscriptionDialog } from './manage-subscription-dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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

const SubscriptionRow = ({ subscription }: { subscription: WithId<TransportSubscription> & { path: string } }) => {
    const [dialogOpen, setDialogOpen] = useState(false);

    const statusMap: Record<string, { variant: VariantProps<typeof badgeVariants>['variant'], label: string }> = {
        pending: { variant: "secondary", label: "En attente" },
        approved: { variant: "default", label: "Approuvé" },
        active: { variant: "success", label: "Actif" },
        rejected: { variant: "destructive", label: "Rejeté" },
        cancelled: { variant: "destructive", label: "Annulé" },
    };

    const statusConfig = statusMap[subscription.status] ?? { variant: "secondary", label: "Inconnu" };


    return (
        <TableRow>
            <TableCell>
                <div className="font-medium">{subscription.fullName}</div>
                <div className="text-sm text-muted-foreground">{subscription.email}</div>
            </TableCell>
            <TableCell>{subscription.city}</TableCell>
            <TableCell>{subscription.workplace}</TableCell>
            <TableCell>
                <Badge variant={statusConfig.variant}>{statusConfig.label}</Badge>
            </TableCell>
            <TableCell>
                <ManageSubscriptionDialog subscription={subscription} open={dialogOpen} onOpenChange={setDialogOpen}>
                    <Button variant="outline" size="sm">Gérer</Button>
                </ManageSubscriptionDialog>
            </TableCell>
        </TableRow>
    );
};


export default function TransportAdminDashboard() {
    const { firestore } = useFirebase();
    const [activeTab, setActiveTab] = useState<string>('pending');
    
    // Fetch all subscriptions without server-side filtering/sorting to avoid complex index requirements.
    const subscriptionsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return collectionGroup(firestore, 'transport_subscriptions');
    }, [firestore]);

    const { data: allSubscriptions, isLoading } = useCollection<TransportSubscription>(subscriptionsQuery);

    // Perform filtering and sorting on the client-side.
    const subscriptions = useMemo(() => {
        if (!allSubscriptions) return null;
        
        const filtered = activeTab === 'all'
            ? allSubscriptions
            : allSubscriptions.filter(sub => sub.status === activeTab);

        // Sort by creation date descending.
        return filtered.sort((a, b) => {
            const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
            const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
            return dateB.getTime() - dateA.getTime();
        });

    }, [allSubscriptions, activeTab]);
    
    const subscriptionsWithPath = subscriptions?.map(sub => ({
        ...sub,
        path: `users/${sub.userId}/transport_subscriptions/${sub.id}`
    }));


    const tabs = [
        { value: 'pending', label: 'En attente' },
        { value: 'approved', label: 'Approuvées' },
        { value: 'active', label: 'Actives' },
        { value: 'rejected', label: 'Rejetées' },
        { value: 'all', label: 'Toutes' },
    ];

    return (
        <ProtectedAdmin>
            <div className="w-full h-full flex flex-col">
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2"><Shield /> Tableau de bord Transport</CardTitle>
                        <CardDescription>Gérer les demandes d'abonnement au transport.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs value={activeTab} onValueChange={setActiveTab}>
                            <TabsList>
                                {tabs.map(tab => (
                                    <TabsTrigger key={tab.value} value={tab.value}>
                                        {tab.label}
                                        {subscriptions && activeTab === tab.value && (
                                            <Badge variant="secondary" className="ml-2">{subscriptions.length}</Badge>
                                        )}
                                     </TabsTrigger>
                                ))}
                            </TabsList>
                            <div className="mt-4 border rounded-md">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead>Utilisateur</TableHead>
                                            <TableHead>Départ</TableHead>
                                            <TableHead>Destination</TableHead>
                                            <TableHead>Statut</TableHead>
                                            <TableHead>Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {isLoading ? (
                                            <TableRow>
                                                <TableCell colSpan={5} className="h-24 text-center">
                                                    <Loader2 className="mx-auto h-8 w-8 animate-spin" />
                                                </TableCell>
                                            </TableRow>
                                        ) : subscriptionsWithPath && subscriptionsWithPath.length > 0 ? (
                                            subscriptionsWithPath.map(sub => <SubscriptionRow key={sub.id} subscription={sub} />)
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={5} className="h-24 text-center">Aucune demande trouvée.</TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </Tabs>
                    </CardContent>
                </Card>
            </div>
        </ProtectedAdmin>
    );
}
