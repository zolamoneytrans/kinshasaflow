'use client';
import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TransportSubscription, WithId } from '@/lib/types';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { z } from 'zod';
import { useFirebase } from '@/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

type ManageSubscriptionDialogProps = {
    subscription: WithId<TransportSubscription> & { path: string };
    children: React.ReactNode;
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

const manageFormSchema = z.object({
    status: z.enum(['pending', 'approved', 'active', 'rejected', 'cancelled']),
    price: z.coerce.number().positive().optional(),
    rejectionReason: z.string().optional(),
    carType: z.string().optional(),
    carColor: z.string().optional(),
    licensePlate: z.string().optional(),
    driverName: z.string().optional(),
    driverPhone: z.string().optional(),
});
type ManageFormValues = z.infer<typeof manageFormSchema>;

export const ManageSubscriptionDialog = ({ subscription, children, open, onOpenChange }: ManageSubscriptionDialogProps) => {
    const { firestore } = useFirebase();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = React.useState(false);

    const form = useForm<ManageFormValues>({
        resolver: zodResolver(manageFormSchema),
        defaultValues: {
            status: subscription.status,
            price: subscription.price || 150,
            rejectionReason: subscription.rejectionReason || '',
            carType: subscription.carType || '',
            carColor: subscription.carColor || '',
            licensePlate: subscription.licensePlate || '',
            driverName: subscription.driverName || '',
            driverPhone: subscription.driverPhone || '',
        },
    });

    const status = form.watch('status');

    const onSubmit = async (data: ManageFormValues) => {
        setIsSubmitting(true);
        try {
            const subDocRef = doc(firestore, subscription.path);
            await updateDoc(subDocRef, {
                ...data,
                rejectionReason: data.status === 'rejected' ? data.rejectionReason : '',
            });
            toast({ title: "Mise à jour réussie", description: "L'abonnement a été mis à jour." });
            onOpenChange(false);
        } catch (error) {
            console.error("Failed to update subscription:", error);
            toast({ title: "Erreur", description: "Impossible de mettre à jour l'abonnement.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="sm:max-w-[625px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Gérer l'abonnement de {subscription.fullName}</DialogTitle>
                    <DialogDescription>
                        Mettez à jour le statut, le prix et les détails du véhicule/chauffeur.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
                        <div className="grid grid-cols-2 gap-4">
                            <FormField control={form.control} name="status" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Statut</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="pending">En attente</SelectItem>
                                            <SelectItem value="approved">Approuvé</SelectItem>
                                            <SelectItem value="active">Actif</SelectItem>
                                            <SelectItem value="rejected">Rejeté</SelectItem>
                                            <SelectItem value="cancelled">Annulé</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="price" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Prix (USD)</FormLabel>
                                    <FormControl><Input type="number" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>

                        {status === 'rejected' && (
                             <FormField control={form.control} name="rejectionReason" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Raison du rejet</FormLabel>
                                    <FormControl><Textarea placeholder="Expliquez pourquoi la demande est rejetée..." {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        )}

                        <h4 className="text-lg font-medium pt-4 border-t">Détails du Véhicule & Chauffeur</h4>
                        <div className="grid grid-cols-2 gap-4">
                             <FormField control={form.control} name="carType" render={({ field }) => (
                                <FormItem><FormLabel>Type de voiture</FormLabel><FormControl><Input placeholder="Ex: Toyota IST" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={form.control} name="carColor" render={({ field }) => (
                                <FormItem><FormLabel>Couleur</FormLabel><FormControl><Input placeholder="Ex: Blanche" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="licensePlate" render={({ field }) => (
                                <FormItem><FormLabel>Plaque d'immatriculation</FormLabel><FormControl><Input placeholder="Ex: 1234AB01" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={form.control} name="driverName" render={({ field }) => (
                                <FormItem><FormLabel>Nom du chauffeur</FormLabel><FormControl><Input placeholder="Ex: Jean Dupont" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="driverPhone" render={({ field }) => (
                                <FormItem><FormLabel>Téléphone du chauffeur</FormLabel><FormControl><Input placeholder="Ex: 081..." {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>

                        <DialogFooter>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Enregistrer les modifications
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};
