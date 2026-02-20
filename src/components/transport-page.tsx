'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TransportSubscriptionFormValues, transportSubscriptionFormSchema } from '@/lib/types';
import { useFirebase, useUser, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Target, Smile, Shield, Clock, Bus, Car, Users, Building, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const OtherTransportOptions = () => (
    <div className="grid md:grid-cols-3 gap-6">
        <Card className="flex flex-col items-center justify-center p-6 text-center">
            <Users className="w-12 h-12 text-primary mb-4" />
            <CardTitle className="mb-2">Covoiturage</CardTitle>
            <CardDescription>Partagez vos trajets quotidiens.</CardDescription>
            <Button variant="outline" className="mt-4" disabled>Bientôt disponible</Button>
        </Card>
        <Card className="flex flex-col items-center justify-center p-6 text-center">
            <Car className="w-12 h-12 text-primary mb-4" />
            <CardTitle className="mb-2">Taxi Privé</CardTitle>
            <CardDescription>Réservez une course privée.</CardDescription>
            <Button variant="outline" className="mt-4" disabled>Bientôt disponible</Button>
        </Card>
        <Card className="flex flex-col items-center justify-center p-6 text-center">
            <Bus className="w-12 h-12 text-primary mb-4" />
            <CardTitle className="mb-2">Mini-bus</CardTitle>
            <CardDescription>Itinéraires fixes à bas prix.</CardDescription>
            <Button variant="outline" className="mt-4" disabled>Bientôt disponible</Button>
        </Card>
    </div>
);

const SubscriptionForm = () => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const router = useRouter();
    const { firestore } = useFirebase();
    const { user, isUserLoading } = useUser();

    const form = useForm<TransportSubscriptionFormValues>({
        resolver: zodResolver(transportSubscriptionFormSchema),
        defaultValues: {
            residence: '',
            workplace: '',
            departureTime: '',
            returnTime: '',
        },
    });

    async function onSubmit(data: TransportSubscriptionFormValues) {
        if (!user) {
            toast({ title: 'Veuillez vous connecter', description: "Vous devez être connecté pour vous inscrire.", variant: 'destructive' });
            router.push('/login');
            return;
        }

        setIsSubmitting(true);
        try {
            const subscriptionData = {
                ...data,
                userId: user.uid,
                transportType: 'corporate',
                status: 'pending',
                createdAt: serverTimestamp(),
            };
            const subscriptionsCollection = collection(firestore, 'users', user.uid, 'transport_subscriptions');
            await addDocumentNonBlocking(subscriptionsCollection, subscriptionData);
            
            toast({ title: 'Inscription réussie !', description: "Votre demande a été enregistrée. Nous vous contacterons bientôt.", variant: 'default' });
            form.reset();
        } catch (error) {
            console.error("Error submitting subscription:", error);
            toast({ title: 'Erreur', description: "Impossible de soumettre votre demande. Veuillez réessayer.", variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Demande d'abonnement</CardTitle>
                <CardDescription>Remplissez ce formulaire pour être ajouté à notre liste d'attente. Nous vous regrouperons avec d'autres personnes ayant des trajets similaires.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="residence" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Commune de résidence</FormLabel>
                                    <FormControl><Input placeholder="Ex: Limete" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="workplace" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Lieu de travail</FormLabel>
                                    <FormControl><Input placeholder="Ex: Gombe" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="departureTime" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Heure de départ</FormLabel>
                                    <FormControl><Input type="time" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="returnTime" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Heure de retour</FormLabel>
                                    <FormControl><Input type="time" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                        <Button type="submit" disabled={isSubmitting || isUserLoading} className="w-full">
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Envoyer ma demande
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
};

export default function TransportPage() {
    return (
        <div className="w-full h-full overflow-y-auto pr-2">
            <motion.div
                className="max-w-6xl mx-auto space-y-12 py-4"
                variants={containerVariants}
                initial="hidden"
                animate="visible"
            >
                <motion.section variants={itemVariants} className="text-center">
                    <h1 className="text-4xl font-bold tracking-tight text-foreground mb-4 flex items-center justify-center gap-3">
                        <Building className="h-10 w-10 text-primary" />
                        Transport Organisé pour Travailleurs
                    </h1>
                    <p className="text-lg text-muted-foreground">Une solution d'abonnement mensuel pour vos trajets domicile-travail.</p>
                </motion.section>

                <motion.section variants={itemVariants} className="grid md:grid-cols-2 gap-8 items-center">
                    <div className="space-y-6">
                        <Alert>
                            <Target className="h-4 w-4" />
                            <AlertTitle className="font-bold">Objectif</AlertTitle>
                            <AlertDescription>
                                <ul className="list-disc list-inside space-y-1 mt-1">
                                    <li>Mettre fin au manque de transport le matin.</li>
                                    <li>Éliminer les retards au travail.</li>
                                    <li>Garantir votre sécurité.</li>
                                </ul>
                            </AlertDescription>
                        </Alert>
                        
                        <div className="space-y-4">
                           <div>
                                <h3 className="font-bold text-lg mb-2">Fonctionnement</h3>
                                <p className="text-muted-foreground">Les utilisateurs s'inscrivent et indiquent leurs trajets. Notre système les regroupe automatiquement pour assigner un véhicule.</p>
                           </div>
                           <div>
                                <h3 className="font-bold text-lg mb-2">Modèle d'abonnement</h3>
                                <p className="text-muted-foreground">Un paiement mensuel unique (100$-150$ est.) via Mobile Money pour des trajets quotidiens (aller-retour) assurés.</p>
                           </div>
                        </div>
                    </div>
                    <div>
                        <SubscriptionForm />
                    </div>
                </motion.section>

                <motion.section variants={itemVariants}>
                    <div className="text-center mb-8">
                        <h2 className="text-3xl font-bold">Autres Services de Mobilité</h2>
                        <p className="text-muted-foreground">Explorez nos futures options de transport.</p>
                    </div>
                    <OtherTransportOptions />
                </motion.section>
            </motion.div>
        </div>
    )
}
