'use client';
import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { CarBookingFormValues, carBookingFormSchema } from '@/lib/types';
import { useFirebase, useUser, addDocumentNonBlocking } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { collection, serverTimestamp } from 'firebase/firestore';
import { format, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { CalendarIcon, Loader2 } from 'lucide-react';

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
      startDate: undefined,
      numberOfDays: 1,
    },
  });

  useEffect(() => {
    if (user && open) {
      form.reset({
        userName: user.displayName || '',
        userPhone: user.phoneNumber || '',
        userAddress: '',
        startDate: undefined,
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
      const endDate = addDays(data.startDate, data.numberOfDays);

      const bookingData = {
        userId: user.uid,
        carId: car.id,
        carName: car.name,
        userName: data.userName,
        userPhone: data.userPhone,
        userAddress: data.userAddress,
        startDate: data.startDate,
        endDate: endDate,
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
            Remplissez vos informations pour réserver ce véhicule. Nous vous contacterons pour confirmer.
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
            
            <div className="grid grid-cols-2 gap-4">
                <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Date de début</FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button
                                            variant={"outline"}
                                            className={cn(
                                                "w-full pl-3 text-left font-normal",
                                                !field.value && "text-muted-foreground"
                                            )}
                                        >
                                            {field.value ? (
                                                format(field.value, "PPP", { locale: fr })
                                            ) : (
                                                <span>Choisissez une date</span>
                                            )}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={field.value}
                                        onSelect={field.onChange}
                                        disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                                        initialFocus
                                        locale={fr}
                                    />
                                </PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField
                    control={form.control}
                    name="numberOfDays"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Nombre de jours</FormLabel>
                            <FormControl>
                                <Input type="number" min="1" placeholder="Ex: 3" {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 1)} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>


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
