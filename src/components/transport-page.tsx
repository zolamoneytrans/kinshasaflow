'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TransportSubscription, transportSubscriptionFormSchema, TransportSubscriptionFormValues, WithId } from '@/lib/types';
import { useFirebase, useUser, useCollection, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection, query, where, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { differenceInDays, addDays } from 'date-fns';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Bus, Car, Users, Building, Loader2, Home, Briefcase, Clock, FilePlus, UserCheck, DollarSign, Timer, CarTaxiFront, Info, X } from 'lucide-react';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};
const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } };

const transportModes = [
  {
    name: "Covoiturage",
    icon: Users,
    description: "Partagez un véhicule avec d'autres travailleurs sur un trajet similaire. Économique et écologique.",
    advantages: ["Coût réduit (partage des frais)", "Réduction du nombre de voitures sur la route", "Convivialité et réseautage"]
  },
  {
    name: "Taxi Privé",
    icon: CarTaxiFront,
    description: "Un service de taxi dédié pour vos trajets, offrant confort et flexibilité.",
    advantages: ["Confort et confidentialité", "Flexibilité des horaires", "Service porte-à-porte"]
  },
  {
    name: "Mini-bus par itinéraire fixe",
    icon: Bus,
    description: "Des mini-bus suivant des itinéraires prédéfinis à des heures fixes.",
    advantages: ["Option la plus économique", "Itinéraires optimisés pour les zones de bureaux", "Moins d'attente que les transports publics traditionnels"]
  },
  {
    name: "Transport d’entreprise",
    icon: Building,
    description: "Une solution B2B où les entreprises contractent des véhicules pour leurs employés.",
    advantages: ["Ponctualité et fiabilité garanties", "Prise en charge directe par l'employeur", "Renforcement de la sécurité des employés"]
  }
];

const ModeInfoDialog = ({ mode, children }: { mode: typeof transportModes[0], children: React.ReactNode }) => (
  <Dialog>
    <DialogTrigger asChild>{children}</DialogTrigger>
    <DialogContent>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2"><mode.icon className="h-6 w-6 text-primary" />{mode.name}</DialogTitle>
        <DialogDescription>{mode.description}</DialogDescription>
      </DialogHeader>
      <div>
        <h4 className="font-semibold mb-2">Avantages :</h4>
        <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
          {mode.advantages.map((adv, i) => <li key={i}>{adv}</li>)}
        </ul>
      </div>
    </DialogContent>
  </Dialog>
);

const SubscriptionForm = ({ setDialogOpen }: { setDialogOpen: (open: boolean) => void }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const router = useRouter();
    const { firestore, user } = useFirebase();

    const form = useForm<TransportSubscriptionFormValues>({
        resolver: zodResolver(transportSubscriptionFormSchema),
        defaultValues: { residence: '', workplace: '', departureTime: '', returnTime: '' },
    });

    async function onSubmit(data: TransportSubscriptionFormValues) {
        if (!user) {
            toast({ title: 'Veuillez vous connecter', description: "Vous devez être connecté pour vous inscrire.", variant: 'destructive' });
            return router.push('/login');
        }
        setIsSubmitting(true);
        try {
            const subscriptionData = {
                ...data,
                userId: user.uid,
                transportType: 'entreprise', // Defaulting to this as it's the main featured one
                status: 'pending',
                price: 150, // Default price
                createdAt: serverTimestamp(),
            };
            const subscriptionsCollection = collection(firestore, 'users', user.uid, 'transport_subscriptions');
            await addDocumentNonBlocking(subscriptionsCollection, subscriptionData);
            toast({ title: 'Demande envoyée !', description: "Votre demande a été enregistrée. Nous vous contacterons bientôt.", variant: 'default' });
            form.reset();
            setDialogOpen(false);
        } catch (error) {
            console.error("Error submitting subscription:", error);
            toast({ title: 'Erreur', description: "Impossible de soumettre votre demande. Veuillez réessayer.", variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                    <FormField control={form.control} name="residence" render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center gap-1"><Home className="h-4 w-4"/> Commune de résidence</FormLabel>
                            <FormControl><Input placeholder="Ex: Limete" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="workplace" render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center gap-1"><Briefcase className="h-4 w-4"/>Lieu de travail</FormLabel>
                            <FormControl><Input placeholder="Ex: Gombe" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="departureTime" render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center gap-1"><Clock className="h-4 w-4"/>Heure de départ</FormLabel>
                            <FormControl><Input type="time" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="returnTime" render={({ field }) => (
                        <FormItem>
                            <FormLabel className="flex items-center gap-1"><Clock className="h-4 w-4"/>Heure de retour</FormLabel>
                            <FormControl><Input type="time" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full">
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Envoyer ma demande
                </Button>
            </form>
        </Form>
    );
};

const SubscriptionDialog = () => {
    const [open, setOpen] = useState(false);
    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button><FilePlus className="mr-2 h-4 w-4" />S'abonner</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                    <DialogTitle>Demande d'abonnement</DialogTitle>
                    <DialogDescription>Remplissez ce formulaire pour être ajouté à notre liste d'attente. Nous vous regrouperons avec d'autres personnes ayant des trajets similaires.</DialogDescription>
                </DialogHeader>
                <SubscriptionForm setDialogOpen={setOpen} />
            </DialogContent>
        </Dialog>
    );
};

const SubscriptionStatus = () => {
    const { user, isUserLoading } = useUser();
    const { firestore } = useFirebase();

    const subscriptionsCollection = useMemoFirebase(() => user ? collection(firestore, 'users', user.uid, 'transport_subscriptions') : null, [firestore, user]);
    const subscriptionsQuery = useMemoFirebase(() => subscriptionsCollection ? query(subscriptionsCollection, orderBy('createdAt', 'desc'), limit(1)) : null, [subscriptionsCollection]);
    const { data: subscriptions, isLoading: isSubscriptionLoading } = useCollection<TransportSubscription>(subscriptionsQuery);
    const subscription = subscriptions?.[0];

    const [daysRemaining, setDaysRemaining] = useState<number | null>(null);

    useEffect(() => {
        if (subscription?.status === 'active' && subscription.subscriptionDate) {
            const startDate = subscription.subscriptionDate.toDate();
            const endDate = addDays(startDate, 30);
            const remaining = differenceInDays(endDate, new Date());
            setDaysRemaining(remaining > 0 ? remaining : 0);
        }
    }, [subscription]);

    if (isUserLoading || isSubscriptionLoading) {
        return <Skeleton className="h-48 w-full" />;
    }

    if (!subscription) {
        return (
            <Card className="text-center">
                <CardHeader>
                    <CardTitle>Aucun Abonnement Actif</CardTitle>
                    <CardDescription>Vous n'avez pas d'abonnement en cours. Faites une demande pour commencer.</CardDescription>
                </CardHeader>
                <CardContent>
                    <SubscriptionDialog />
                </CardContent>
            </Card>
        );
    }
    
    const StatusBadge = () => {
        const statusConfig = {
            pending: { variant: "secondary", label: "En attente", icon: Timer },
            approved: { variant: "default", label: "Approuvé", icon: UserCheck },
            active: { variant: "success", label: "Actif", icon: UserCheck },
            rejected: { variant: "destructive", label: "Rejeté", icon: X },
            cancelled: { variant: "destructive", label: "Annulé", icon: X },
        }[subscription.status] || { variant: "secondary", label: "Inconnu", icon: Info };
        
        return <Badge variant={statusConfig.variant} className="flex items-center gap-1.5"><statusConfig.icon className="h-3 w-3"/>{statusConfig.label}</Badge>;
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Statut de votre abonnement</CardTitle>
                    <StatusBadge />
                </div>
            </CardHeader>
            <CardContent className="space-y-4">
                {subscription.status === 'pending' && <Alert><Timer className="h-4 w-4" /><AlertTitle>Demande en cours d'examen</AlertTitle><AlertDescription>Votre demande est en cours de traitement. Nous vous notifierons dès qu'elle sera approuvée.</AlertDescription></Alert>}
                {subscription.status === 'rejected' && <Alert variant="destructive"><X className="h-4 w-4" /><AlertTitle>Demande Rejetée</AlertTitle><AlertDescription>{subscription.rejectionReason || "Votre demande n'a pas pu être approuvée pour le moment. Veuillez contacter le support pour plus d'informations."}</AlertDescription></Alert>}
                {subscription.status === 'approved' && <Alert variant="default"><DollarSign className="h-4 w-4" /><AlertTitle>Abonnement Approuvé !</AlertTitle><AlertDescription>Votre abonnement a été approuvé. Veuillez procéder au paiement de ${subscription.price} pour l'activer.</AlertDescription><Button className="mt-4 w-full"><DollarSign className="mr-2 h-4 w-4" /> Payer ${subscription.price}</Button></Alert>}
                
                {subscription.status === 'active' && (
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                        <div className="space-y-2">
                            <p><strong>Trajet:</strong> {subscription.residence} ↔ {subscription.workplace}</p>
                            <p><strong>Heures:</strong> {subscription.departureTime} → {subscription.returnTime}</p>
                            <p><strong>Chauffeur:</strong> {subscription.driverName || 'Non assigné'}</p>
                            <p><strong>Tel. Chauffeur:</strong> {subscription.driverPhone || 'N/A'}</p>
                        </div>
                         <div className="space-y-2">
                            <p><strong>Voiture:</strong> {subscription.carType || 'Non assigné'}</p>
                            <p><strong>Couleur:</strong> {subscription.carColor || 'N/A'}</p>
                            <p><strong>Plaque:</strong> {subscription.licensePlate || 'N/A'}</p>
                            {daysRemaining !== null && <p><strong>Jours restants:</strong> <span className="font-bold text-lg text-primary">{daysRemaining}</span> / 30</p>}
                        </div>
                    </div>
                )}
            </CardContent>
            {['rejected', 'cancelled'].includes(subscription.status) && (
                <CardFooter>
                    <SubscriptionDialog />
                </CardFooter>
            )}
        </Card>
    );
}

export default function TransportPage() {
    return (
        <div className="w-full h-full overflow-y-auto pr-2">
            <motion.div className="max-w-6xl mx-auto space-y-12 py-4" variants={containerVariants} initial="hidden" animate="visible">
                
                <motion.section variants={itemVariants} className="text-center">
                    <h1 className="text-4xl font-bold tracking-tight text-foreground mb-2">Transport Organisé pour Travailleurs</h1>
                    <p className="text-lg text-muted-foreground">Une solution d'abonnement mensuel pour vos trajets domicile-travail.</p>
                </motion.section>

                <motion.section variants={itemVariants} className="p-6 rounded-lg bg-card border">
                     <h3 className="font-semibold text-lg mb-1">Modèle d'abonnement</h3>
                     <p className="text-muted-foreground">Un paiement mensuel unique via Mobile Money pour des trajets quotidiens (aller-retour) assurés.</p>
                </motion.section>

                <motion.section variants={itemVariants}>
                    <div className="text-center mb-6">
                        <h2 className="text-2xl font-bold">Modes de Transport</h2>
                         <p className="text-muted-foreground">Cliquez sur un mode pour en savoir plus.</p>
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {transportModes.map(mode => (
                           <ModeInfoDialog key={mode.name} mode={mode}>
                             <Button variant="outline" className="h-24 flex-col gap-2">
                                <mode.icon className="h-6 w-6" />
                                <span>{mode.name}</span>
                             </Button>
                           </ModeInfoDialog>
                        ))}
                    </div>
                </motion.section>

                <motion.section variants={itemVariants}>
                    <h2 className="text-2xl font-bold text-center mb-6">Mon Abonnement</h2>
                    <SubscriptionStatus />
                </motion.section>

            </motion.div>
        </div>
    );
}
