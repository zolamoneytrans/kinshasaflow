'use client';
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CarBookingFormValues, carBookingFormSchema } from '@/lib/types';
import { useFirebase, useUser, addDocumentNonBlocking } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { collection, serverTimestamp } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

type BookingDialogProps = {
  car: { id: string; name: string; price: number; };
};

export const BookingDialog = ({ car }: BookingDialogProps) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const { user, firestore } = useFirebase();
  const router = useRouter();

  const form = useForm<CarBookingFormValues>({
    resolver: zodResolver(carBookingFormSchema),
    defaultValues: {
      userName: user?.displayName || '',
      userPhone: user?.phoneNumber || '',
      userAddress: '',
      numberOfDays: 1,
    },
  });

  useEffect(() => {
    if (user && open) {
      form.reset({
        userName: user.displayName || '',
        userPhone: user.phoneNumber || '',
        userAddress: '',
        numberOfDays: 1,
      });
    }
  }, [user, open, form]);

  const onSubmit = async (data: CarBookingFormValues) => {
    if (!user) {
      toast({ title: "Connexion requise", description: "Vous devez être connecté pour réserver.", variant: "destructive" });
      return router.push('/login');
    }
    
    setIsSubmitting(true);
    try {
      const bookingData = {
        userId: user.uid,
        carId: car.id,
        carName: car.name,
        userName: data.userName,
        userPhone: data.userPhone,
        userAddress: data.userAddress,
        numberOfDays: data.numberOfDays,
        status: 'pending',
        createdAt: serverTimestamp(),
      };

      const bookingsCollection = collection(firestore, 'car_bookings');
      await addDocumentNonBlocking(bookingsCollection, bookingData);
      
      toast({ title: 'Réservation envoyée !', description: 'Votre demande a été enregistrée. Nous vous contacterons bientôt.' });
      setOpen(false);
    } catch (error) {
      console.error('Failed to create booking:', error);
      toast({ title: 'Erreur', description: 'Impossible de soumettre votre réservation.', variant: 'destructive' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Réserver</Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[525px]">
        <DialogHeader>
          <DialogTitle>Réserver: {car.name}</DialogTitle>
          <DialogDescription>
            Remplissez vos informations pour réserver ce véhicule. Les dates seront confirmées par téléphone.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField control={form.control} name="userName" render={({ field }) => (
                <FormItem><FormLabel>Nom complet</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="userPhone" render={({ field }) => (
                <FormItem><FormLabel>Téléphone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="userAddress" render={({ field }) => (
                <FormItem><FormLabel>Adresse</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
             <FormField control={form.control} name="numberOfDays" render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre de jours</FormLabel>
                  <FormControl>
                    <Input type="number" min={1} {...field} onChange={event => field.onChange(+event.target.value)} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
            )} />

            <DialogFooter>
              <Button type="submit" disabled={isSubmitting} className="w-full">
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Envoyer la demande
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
