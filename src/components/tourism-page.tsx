'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar, Users, Star, Palmtree, ArrowRight, Loader2, Plane, Hotel, ShieldCheck, CheckCircle2, Map, Compass, PlusCircle, Trash2, Pencil, Mail, Phone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TourismBookingDialog } from './tourism-booking-dialog';
import { useFirebase, useCollection, useMemoFirebase, useUser, errorEmitter } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { TourismEvent, TourismEventFormValues, tourismEventFormSchema, WithId, FirestorePermissionError } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';

const AddEventDialog = () => {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { firestore, firebaseApp, user } = useFirebase();
    const { toast } = useToast();

    const form = useForm<TourismEventFormValues>({
        resolver: zodResolver(tourismEventFormSchema),
        defaultValues: {
            title: '',
            description: '',
            location: '',
            price: 0,
            category: 'Excursion',
            whatsapp: '',
            phone: '',
            email: '',
        }
    });

    const onSubmit = async (data: TourismEventFormValues) => {
        if (!user || user.email !== 'drnduwa@gmail.com') {
            toast({ title: "Accès refusé", description: "Seul l'administrateur peut effectuer cette action.", variant: 'destructive' });
            return;
        }

        setIsSubmitting(true);
        const eventRef = doc(collection(firestore, 'tourism_events'));
        const eventId = eventRef.id;

        try {
            let imageUrls: string[] = [];

            // ÉTAPE 1 : Gérer les images si présentes
            if (data.images && data.images.length > 0) {
                console.log("Tentative d'upload pour l'utilisateur:", user.email, "UID:", user.uid);
                const storage = getStorage(firebaseApp);
                const files = Array.from(data.images as FileList);
                
                try {
                    const uploadPromises = files.map(file => {
                        // Nettoyage du nom de fichier pour éviter les caractères spéciaux
                        const safeFileName = file.name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
                        const fileRef = storageRef(storage, `tourism/${eventId}/${safeFileName}`);
                        return uploadBytes(fileRef, file).then(snap => getDownloadURL(snap.ref));
                    });
                    imageUrls = await Promise.all(uploadPromises);
                } catch (storageErr: any) {
                    console.error("Erreur technique Storage:", storageErr);
                    setIsSubmitting(false);
                    
                    let description = "Impossible d'uploader les images. Vérifiez votre connexion.";
                    if (storageErr.code === 'storage/unauthorized') {
                        description = "Permissions insuffisantes. Vérifiez que vous êtes bien connecté avec drnduwa@gmail.com.";
                    }

                    toast({ 
                        title: "Erreur de stockage", 
                        description: `${description} (Code: ${storageErr.code})`,
                        variant: "destructive",
                        duration: 10000
                    });
                    return;
                }
            }

            // ÉTAPE 2 : Enregistrer dans Firestore
            const eventData = {
                title: data.title,
                description: data.description,
                location: data.location,
                price: data.price,
                category: data.category,
                whatsapp: data.whatsapp || '',
                phone: data.phone || '',
                email: data.email || '',
                imageUrls: imageUrls.length > 0 ? imageUrls : ["https://picsum.photos/seed/tourism/1000/600"],
                createdAt: serverTimestamp(),
            };

            try {
                await setDoc(eventRef, eventData);
                toast({ title: "Offre publiée !", description: "L'offre touristique est maintenant en ligne." });
                setOpen(false);
                form.reset();
            } catch (firestoreErr: any) {
                console.error("Firestore Error:", firestoreErr);
                const permissionError = new FirestorePermissionError({
                    path: eventRef.path,
                    operation: 'create',
                    requestResourceData: eventData,
                });
                errorEmitter.emit('permission-error', permissionError);
            }

        } catch (e: any) {
            console.error("General Error:", e);
            toast({ title: "Erreur", description: e.message || "Une erreur inattendue est survenue.", variant: "destructive" });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="rounded-full h-12 px-6 font-black shadow-xl shadow-primary/20">
                    <PlusCircle className="mr-2 h-5 w-5" />
                    Nouvelle Offre
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Ajouter une offre touristique</DialogTitle></DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                        <FormField control={form.control} name="title" render={({ field }) => (
                            <FormItem><FormLabel>Titre de l'offre</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="category" render={({ field }) => (
                            <FormItem><FormLabel>Catégorie</FormLabel><FormControl><Input placeholder="Ex: Safari, Nature, Séjour" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="location" render={({ field }) => (
                            <FormItem><FormLabel>Lieu</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="price" render={({ field }) => (
                            <FormItem><FormLabel>Prix ($)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="description" render={({ field }) => (
                            <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <div className="grid grid-cols-3 gap-4">
                            <FormField control={form.control} name="whatsapp" render={({ field }) => (
                                <FormItem><FormLabel>WhatsApp</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="phone" render={({ field }) => (
                                <FormItem><FormLabel>Téléphone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name="email" render={({ field }) => (
                                <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                        <FormField control={form.control} name="images" render={({ field: { onChange, ...fieldProps} }) => (
                            <FormItem><FormLabel>Images</FormLabel><FormControl><Input type="file" multiple accept="image/*" onChange={e => onChange(e.target.files)} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <DialogFooter>
                            <Button type="submit" disabled={isSubmitting} className="w-full h-12 rounded-xl">
                                {isSubmitting ? (
                                    <>
                                        <Loader2 className="animate-spin mr-2 h-5 w-5" />
                                        Publication en cours...
                                    </>
                                ) : "Publier l'excursion"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

export default function TourismPage() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const isAdmin = user?.email === 'drnduwa@gmail.com';

  const tourismRef = useMemoFirebase(() => collection(firestore, 'tourism_events'), [firestore]);
  const tourismQuery = useMemoFirebase(() => query(tourismRef, orderBy('createdAt', 'desc')), [tourismRef]);
  const { data: events, isLoading } = useCollection<TourismEvent>(tourismQuery);

  const heroImage = PlaceHolderImages.find(img => img.id === 'tourism-hero')?.imageUrl;

  const handleDelete = async (id: string) => {
      try {
          await deleteDoc(doc(firestore, 'tourism_events', id));
          toast({ title: "Supprimé", description: "L'offre a été retirée." });
      } catch (e) {
          toast({ title: "Erreur", description: "Impossible de supprimer.", variant: "destructive" });
      }
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-slate-50/30">
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-16 pb-24">
        
        {/* --- Hero Section --- */}
        <section className="relative h-[400px] rounded-[3rem] overflow-hidden shadow-2xl flex items-center justify-center text-center">
          <Image 
            src={heroImage || "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&q=80&w=1200"} 
            alt="Tourism Hero" 
            fill 
            className="object-cover brightness-[0.4]"
            priority
          />
          <div className="relative z-10 space-y-6 px-6 max-w-4xl">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter leading-none mb-4">
                Explorez <span className="text-primary italic">Kinshasa</span>
              </h1>
              <p className="text-slate-200 text-lg md:text-xl font-medium max-w-2xl mx-auto opacity-90">
                Découvrez des trésors cachés et vivez des expériences locales inoubliables.
              </p>
            </motion.div>
          </div>
        </section>

        {/* --- Admin Toolbar --- */}
        {isAdmin && (
            <div className="bg-primary/5 border-2 border-primary/10 p-6 rounded-[2rem] flex flex-col md:flex-row items-center justify-between gap-4">
                <div className="space-y-1">
                    <h2 className="text-xl font-black text-primary flex items-center gap-2">
                        <Star className="fill-primary h-5 w-5" />
                        Outils Administrateur
                    </h2>
                    <p className="text-sm text-muted-foreground font-medium">Gérez vos offres et consultez les réservations.</p>
                </div>
                <div className="flex gap-3">
                    <Button variant="outline" asChild className="rounded-full h-12 border-2 px-6 font-bold">
                        <Link href="/admin/tourism">Consulter les réservations</Link>
                    </Button>
                    <AddEventDialog />
                </div>
            </div>
        )}

        {/* --- Events Grid --- */}
        <div className="space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200/60 pb-10">
            <div className="space-y-2">
              <h2 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                <Palmtree className="text-emerald-500 h-10 w-10" />
                Nos Expériences
              </h2>
              <p className="text-muted-foreground text-lg font-medium">Les meilleures destinations sélectionnées pour vous.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {isLoading ? (
              <div className="col-span-full py-24 flex flex-col items-center gap-6">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-slate-400 font-black uppercase tracking-widest text-[10px]">Chargement des offres...</p>
              </div>
            ) : events && events.length > 0 ? (
              events.map((event, idx) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="group overflow-hidden border-none shadow-xl rounded-[2.5rem] bg-white h-full flex flex-col hover:-translate-y-2 transition-all duration-500">
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <Image 
                        src={event.imageUrls[0]} 
                        alt={event.title} 
                        fill 
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute top-6 left-6">
                        <Badge className="bg-white/95 text-slate-900 font-black px-4 py-1.5 shadow-lg rounded-full text-[10px] uppercase tracking-widest">
                          {event.category}
                        </Badge>
                      </div>
                      <div className="absolute bottom-6 right-6">
                        <div className="bg-primary text-white px-5 py-2.5 rounded-2xl font-black shadow-2xl">
                          {event.price}$ <span className="text-[10px] opacity-70">/ pers.</span>
                        </div>
                      </div>
                    </div>
                    
                    <CardHeader className="p-8 pb-4">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-2xl font-black text-slate-900 leading-tight">
                            {event.title}
                        </CardTitle>
                        {isAdmin && (
                            <Button variant="ghost" size="icon" onClick={() => handleDelete(event.id)} className="text-destructive hover:bg-destructive/10">
                                <Trash2 className="h-5 w-5" />
                            </Button>
                        )}
                      </div>
                      <CardDescription className="flex items-center gap-2 font-bold text-slate-400 uppercase text-[10px] tracking-widest pt-2">
                        <MapPin className="h-3 w-3 text-emerald-500" />
                        {event.location}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="px-8 pb-8 pt-0 flex-1">
                      <p className="text-slate-500 text-sm leading-relaxed line-clamp-3 font-medium">
                        {event.description}
                      </p>
                      
                      {(event.phone || event.whatsapp || event.email) && (
                          <div className="mt-6 pt-6 border-t border-slate-100 space-y-3">
                              <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-2">Contacts direct</p>
                              <div className="flex flex-wrap gap-4">
                                {event.phone && <a href={`tel:${event.phone}`} className="text-xs font-bold text-slate-600 flex items-center gap-1.5 hover:text-primary"><Phone className="h-3 w-3" /> Appeler</a>}
                                {event.whatsapp && <a href={`https://wa.me/${event.whatsapp.replace(/\D/g, '')}`} target="_blank" className="text-xs font-bold text-emerald-600 flex items-center gap-1.5 hover:underline"><Palmtree className="h-3 w-3" /> WhatsApp</a>}
                                {event.email && <a href={`mailto:${event.email}`} className="text-xs font-bold text-slate-600 flex items-center gap-1.5 hover:text-primary"><Mail className="h-3 w-3" /> Email</a>}
                              </div>
                          </div>
                      )}
                    </CardContent>

                    <CardFooter className="px-8 py-6 border-t border-slate-50 bg-slate-50/30">
                      <TourismBookingDialog event={event as any} />
                    </CardFooter>
                  </Card>
                </motion.div>
              ))
            ) : (
                <div className="col-span-full py-24 text-center bg-white rounded-[3rem] border-2 border-dashed">
                    <Palmtree className="h-16 w-16 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold">Aucune offre disponible pour le moment.</p>
                </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}