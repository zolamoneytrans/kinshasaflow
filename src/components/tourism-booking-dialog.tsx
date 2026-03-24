
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
import { Loader2, Calendar, Users, Phone, User, CheckCircle2, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

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
        bookingDate: serverTimestamp(),
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
        <Button className="bg-primary hover:bg-primary/90 text-white font-black rounded-2xl h-12 px-8 shadow-xl shadow-primary/20 uppercase tracking-widest text-[10px] transition-all hover:scale-105 active:scale-95">
          Réserver l'expérience
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md rounded-[3rem] p-0 overflow-hidden border-none shadow-3xl">
        <div className="bg-primary p-10 text-white relative">
          <div className="absolute top-[-30%] right-[-10%] w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
          <div className="absolute bottom-[-10%] left-[-5%] w-24 h-24 bg-accent/20 rounded-full blur-2xl"></div>
          
          <div className="relative z-10 space-y-4">
            <Badge className="bg-white/20 border-white/30 text-white font-bold mb-2">DEMANDE DE RÉSERVATION</Badge>
            <DialogTitle className="text-3xl font-black tracking-tighter leading-tight">{event.title}</DialogTitle>
            <div className="flex items-center gap-4 text-primary-foreground/80 font-bold text-sm">
              <div className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {event.location}
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-white font-black">{event.price}$</span>
                <span className="text-[10px] uppercase">/ pers.</span>
              </div>
            </div>
          </div>
        </div>

        <div className="p-10">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <div className="space-y-6">
                <FormField control={form.control} name="userName" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-3 text-slate-500 font-black uppercase tracking-[0.15em] text-[10px] mb-2">
                      <User className="h-3.5 w-3.5 text-primary" />
                      Nom complet
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Votre nom" className="h-14 rounded-2xl border-2 border-slate-100 focus-visible:ring-primary font-bold shadow-inner bg-slate-50/50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="userPhone" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-3 text-slate-500 font-black uppercase tracking-[0.15em] text-[10px] mb-2">
                      <Phone className="h-3.5 w-3.5 text-primary" />
                      Téléphone mobile
                    </FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: 08..." className="h-14 rounded-2xl border-2 border-slate-100 focus-visible:ring-primary font-bold shadow-inner bg-slate-50/50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="numberOfPeople" render={({ field }) => (
                  <FormItem>
                    <FormLabel className="flex items-center gap-3 text-slate-500 font-black uppercase tracking-[0.15em] text-[10px] mb-2">
                      <Users className="h-3.5 w-3.5 text-primary" />
                      Nombre de participants
                    </FormLabel>
                    <FormControl>
                      <Input type="number" min={1} className="h-14 rounded-2xl border-2 border-slate-100 focus-visible:ring-primary font-bold shadow-inner bg-slate-50/50" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <div className="p-5 bg-emerald-50 rounded-[1.5rem] border border-emerald-100 flex items-start gap-4">
                <div className="bg-emerald-500 p-1.5 rounded-full text-white shrink-0 mt-0.5">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                </div>
                <p className="text-[11px] text-emerald-800 font-bold leading-relaxed">
                  Cette demande n'est pas un paiement final. Notre équipe vous appellera sous 24h pour confirmer les dates et vous envoyer le lien de paiement MbiyoPay.
                </p>
              </div>

              <Button type="submit" disabled={isSubmitting} className="w-full h-16 rounded-[1.5rem] bg-primary hover:bg-primary/90 text-lg font-black shadow-2xl shadow-primary/30 uppercase tracking-widest transition-all hover:scale-[1.02]">
                {isSubmitting ? <Loader2 className="animate-spin mr-3 h-6 w-6" /> : null}
                Envoyer ma demande
              </Button>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
};
