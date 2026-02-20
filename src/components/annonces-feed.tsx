'use client';

import React, { useState } from 'react';
import { Annonce, WithId, annonceFormSchema, AnnonceFormValues } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Landmark, Calendar, PlusCircle, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollection, useFirebase, useUser, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';

// Admin form to add new announcements
const AddAnnonceForm = ({ setDialogOpen }: { setDialogOpen: (open: boolean) => void }) => {
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<AnnonceFormValues>({
        resolver: zodResolver(annonceFormSchema),
        defaultValues: {
            title: '',
            content: '',
            source: '',
        },
    });

    const onSubmit = async (data: AnnonceFormValues) => {
        setIsSubmitting(true);
        try {
            const annoncesCollection = collection(firestore, 'annonces');
            await addDocumentNonBlocking(annoncesCollection, {
                ...data,
                createdAt: serverTimestamp(),
            });

            toast({
                title: 'Annonce ajoutée !',
                description: "L'annonce a été publiée avec succès.",
            });
            form.reset();
            setDialogOpen(false);
        } catch (error) {
            console.error("Error adding announcement:", error);
            toast({
                title: 'Erreur',
                description: "Impossible d'ajouter l'annonce.",
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Titre</FormLabel>
                            <FormControl><Input placeholder="Nouvelles régulations..." {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="source"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Source</FormLabel>
                            <FormControl><Input placeholder="Hôtel de Ville de Kinshasa" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="content"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Contenu</FormLabel>
                            <FormControl><Textarea placeholder="À partir du..." className="resize-none" rows={5} {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <DialogFooter>
                    <DialogClose asChild><Button type="button" variant="secondary" disabled={isSubmitting}>Annuler</Button></DialogClose>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 animate-spin" />}
                        Publier
                    </Button>
                </DialogFooter>
            </form>
        </Form>
    )
}

const AddAnnonceDialog = () => {
    const [open, setOpen] = useState(false);
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nouvelle Annonce
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Créer une nouvelle annonce</DialogTitle>
                </DialogHeader>
                <AddAnnonceForm setDialogOpen={setOpen} />
            </DialogContent>
        </Dialog>
    )
}

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

export default function AnnoncesFeed() {
    const { firestore } = useFirebase();
    const { user } = useUser();

    const annoncesCollection = useMemoFirebase(() => collection(firestore, 'annonces'), [firestore]);
    const annoncesQuery = useMemoFirebase(() => query(annoncesCollection, orderBy('createdAt', 'desc')), [annoncesCollection]);
    const { data: announcements, isLoading } = useCollection<Annonce>(annoncesQuery);

    const isAdmin = user?.email === process.env.NEXT_PUBLIC_ADMIN_EMAIL;

    return (
        <Card className="flex-1 flex flex-col overflow-hidden">
            <CardHeader>
                <CardTitle className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                        <Landmark className="text-primary" />
                        Annonces Officielles
                    </div>
                    {isAdmin && <AddAnnonceDialog />}
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
                <div className="space-y-4">
                    {isLoading ? (
                        Array.from({ length: 5 }).map((_, i) => <AnnonceSkeleton key={i} />)
                    ) : announcements && announcements.length > 0 ? (
                        announcements.map(annonce => (
                            <AnnonceItem key={annonce.id} annonce={annonce} />
                        ))
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-muted-foreground text-center py-10">
                            <Landmark className="w-12 h-12 mb-4" />
                            <p className="font-medium">Aucune annonce pour le moment.</p>
                            <p className="text-sm">Revenez plus tard pour les dernières mises à jour.</p>
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
