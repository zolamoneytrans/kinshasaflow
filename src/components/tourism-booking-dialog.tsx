
'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { TourismBookingFormValues, tourismBookingFormSchema, WithId, TourismEvent } from '@/lib/types';
import { useFirebase, useUser, addDocumentNonBlocking } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { collection, serverTimestamp } from 'firebase/firestore';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2, Calendar, Users, Phone, User, CheckCircle2 } from 'lucide-react';
import { useRouter } from 'next/navigation';

export const TourismBookingDialog = ({ event }: { event: WithId<TourismEvent> }) => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { user, firestore } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();

  const form = useForm<TourismBookingFormValues>({
    resolver: zodResolver(tourismBookingFormSchema),
    defaultValues: {
      userName: user?.displayName || '',
      userPhone: user?.phoneNumber || '',
      numberOfPeople: 1,
    },
  });

  const onSubmit = async (data: TourismBookingFormValues) => {
    if (!user) {
      toast({ title: "Connexion requise", description: "Connectez-vous pour réserver cette excursion.", variant: "destructive" });
      router.push('/login');
      return;
    }

    setIsSubmitting(true);
    try {
      const bookingData = {
        userId: user.uid,
        eventId: event.id,
        eventTitle: event.title,
        userName: data.userName,
        userPhone: data.userPhone,
        numberOfPeople: data.numberOfPeople,
        bookingDate: serverTimestamp(), // Dates confirmed via phone usually
        status: 'pending',
        createdAt: serverTimestamp(),
      };

      const bookingsRef = collection(firestore, 'tourism_bookings');
      await addDocumentNonBlocking(bookingsRef, bookingData);

      toast({ 
        title: "Demande envoyée !", 
        description: "Nous vous contacterons par téléphone pour confirmer la date et les détails." 
      });
      setOpen(false);
      form.reset();
    } catch (error) {
      toast({ title: "Erreur", description: "Impossible d'envoyer votre réservation.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white font-black rounded-xl h-11 px-6 shadow-lg shadow-emerald-200">
          Réserver
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-[2.5rem] p-0 overflow-hidden border-none shadow-2xl">
        <div className="bg-emerald-600 p-8 text-white relative">
          <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <DialogTitle className="text-2xl font-black mb-2">Excursion : {event.title}</DialogTitle>
          <DialogDescription className="text-emerald-100 font-medium">
            Tarif estimé : <span className="font-black text-white">{event.price}$ / personne</span>
          </DialogDescription>
        </div>

        <div className="p-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField control={form.control} name="userName" render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-slate-600 font-bold"><User className="h-4 w-4" />Nom complet</FormLabel>
                  <FormControl><Input placeholder="John Doe" className="h-12 rounded-xl border-2 border-slate-100 focus-visible:ring-emerald-500" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="userPhone" render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-slate-600 font-bold"><Phone className="h-4 w-4" />Numéro de téléphone</FormLabel>
                  <FormControl><Input placeholder="08..." className="h-12 rounded-xl border-2 border-slate-100 focus-visible:ring-emerald-500" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="numberOfPeople" render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2 text-slate-600 font-bold"><Users className="h-4 w-4" />Nombre de personnes</FormLabel>
                  <FormControl><Input type="number" min={1} className="h-12 rounded-xl border-2 border-slate-100 focus-visible:ring-emerald-500" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-start gap-3">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
                <p className="text-[10px] text-emerald-800 font-medium leading-relaxed">
                  Après votre demande, notre équipe vous appellera pour fixer la date exacte et les modalités de paiement (Mobile Money accepté).
                </p>
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full h-14 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-lg font-black shadow-xl shadow-emerald-200">
                {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : null}
                Confirmer ma demande
              </Button>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
