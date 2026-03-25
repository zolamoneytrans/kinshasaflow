'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Loader2, Star, PlusCircle, Trash2, Mail, Phone, Search, X, ChevronLeft, ChevronRight, MessageCircle, SlidersHorizontal } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TourismBookingDialog } from './tourism-booking-dialog';
import { useFirebase, useCollection, useMemoFirebase, useUser, errorEmitter } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { TourismEvent, TourismEventFormValues, tourismEventFormSchema, FirestorePermissionError, WithId } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';

// ─── Image Lightbox ────────────────────────────────────────────────────────────
const Lightbox = ({ images, initialIndex, onClose }: { images: string[]; initialIndex: number; onClose: () => void }) => {
  const [current, setCurrent] = useState(initialIndex);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      if (e.key === 'ArrowRight') setCurrent(c => (c + 1) % images.length);
      if (e.key === 'ArrowLeft') setCurrent(c => (c - 1 + images.length) % images.length);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [images.length, onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
      onClick={onClose}
    >
      <button
        className="absolute top-5 right-5 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-2 transition-all"
        onClick={onClose}
      >
        <X className="h-6 w-6" />
      </button>

      {images.length > 1 && (
        <>
          <button
            className="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-3 transition-all z-10"
            onClick={e => { e.stopPropagation(); setCurrent(c => (c - 1 + images.length) % images.length); }}
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <button
            className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white bg-white/10 hover:bg-white/20 rounded-full p-3 transition-all z-10"
            onClick={e => { e.stopPropagation(); setCurrent(c => (c + 1) % images.length); }}
          >
            <ChevronRight className="h-6 w-6" />
          </button>
        </>
      )}

      <motion.div
        key={current}
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-5xl max-h-[85vh] mx-6"
        onClick={e => e.stopPropagation()}
      >
        <Image
          src={images[current]}
          alt={`Photo ${current + 1}`}
          width={1200}
          height={800}
          className="w-full h-full object-contain rounded-xl max-h-[80vh]"
        />
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {images.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-1.5 h-1.5 rounded-full transition-all ${i === current ? 'bg-white w-4' : 'bg-white/40'}`}
              />
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

// ─── Event Card ────────────────────────────────────────────────────────────────
const EventCard = ({ event, isAdmin, onDelete, index }: {
  event: WithId<TourismEvent>;
  isAdmin: boolean;
  onDelete: (id: string) => void;
  index: number;
}) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const images = event.imageUrls || [];

  const openLightbox = (idx: number, e: React.MouseEvent) => {
    e.preventDefault();
    setLightboxIndex(idx);
    setLightboxOpen(true);
  };

  return (
    <>
      <motion.article
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-60px' }}
        transition={{ delay: index * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="group relative bg-white rounded-[2rem] overflow-hidden border border-stone-100 shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 flex flex-col"
      >
        {/* Image gallery */}
        <div className="relative aspect-[16/10] overflow-hidden bg-stone-100">
          <Image
            src={images[0] || 'https://picsum.photos/seed/tourism/800/500'}
            alt={event.title}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-105 cursor-zoom-in"
            onClick={e => openLightbox(0, e)}
          />

          {/* Category badge */}
          <div className="absolute top-4 left-4">
            <span className="bg-white/95 backdrop-blur-sm text-stone-700 text-[10px] font-bold px-3 py-1.5 rounded-full uppercase tracking-widest shadow-sm">
              {event.category}
            </span>
          </div>

          {/* Price badge */}
          <div className="absolute bottom-4 left-4">
            <div className="bg-black/80 backdrop-blur-sm text-white px-4 py-2 rounded-xl font-bold text-sm">
              {event.price === 0 ? 'Gratuit' : `${event.price} $`}
              <span className="text-white/50 font-normal text-[11px] ml-1">/ pers.</span>
            </div>
          </div>

          {/* Thumbnail strip (if multiple images) */}
          {images.length > 1 && (
            <div className="absolute bottom-4 right-4 flex gap-1.5">
              {images.slice(1, 4).map((img, i) => (
                <div
                  key={i}
                  className="w-10 h-10 rounded-lg overflow-hidden border-2 border-white/80 cursor-zoom-in shadow-md"
                  onClick={e => openLightbox(i + 1, e)}
                >
                  <Image src={img} alt={`Photo ${i + 2}`} width={40} height={40} className="object-cover w-full h-full" />
                </div>
              ))}
              {images.length > 4 && (
                <div
                  className="w-10 h-10 rounded-lg bg-black/60 backdrop-blur-sm border-2 border-white/80 cursor-pointer flex items-center justify-center text-white text-[10px] font-bold shadow-md"
                  onClick={e => openLightbox(4, e)}
                >
                  +{images.length - 4}
                </div>
              )}
            </div>
          )}

          {/* Admin delete */}
          {isAdmin && (
            <button
              onClick={() => onDelete(event.id)}
              className="absolute top-4 right-4 p-2 bg-red-500/90 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-red-600 shadow-lg"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Card body */}
        <div className="flex flex-col flex-1 p-6">
          <div className="flex items-start gap-2 mb-2">
            <MapPin className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
            <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-widest leading-tight">{event.location}</span>
          </div>

          <h3 className="text-xl font-bold text-stone-900 leading-snug mb-3 group-hover:text-amber-700 transition-colors">
            {event.title}
          </h3>

          <p className="text-stone-500 text-sm leading-relaxed line-clamp-3 flex-1 mb-5">
            {event.description}
          </p>

          {/* Contact links */}
          {(event.phone || event.whatsapp || event.email) && (
            <div className="flex flex-wrap gap-3 mb-5 pb-5 border-b border-stone-100">
              {event.phone && (
                <a href={`tel:${event.phone}`} className="flex items-center gap-1.5 text-[12px] font-semibold text-stone-500 hover:text-stone-800 transition-colors">
                  <Phone className="h-3 w-3" /> Appeler
                </a>
              )}
              {event.whatsapp && (
                <a href={`https://wa.me/${event.whatsapp.replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="flex items-center gap-1.5 text-[12px] font-semibold text-emerald-600 hover:text-emerald-800 transition-colors">
                  <MessageCircle className="h-3 w-3" /> WhatsApp
                </a>
              )}
              {event.email && (
                <a href={`mailto:${event.email}`} className="flex items-center gap-1.5 text-[12px] font-semibold text-stone-500 hover:text-stone-800 transition-colors">
                  <Mail className="h-3 w-3" /> Email
                </a>
              )}
            </div>
          )}

          <TourismBookingDialog event={event as any} />
        </div>
      </motion.article>

      <AnimatePresence>
        {lightboxOpen && (
          <Lightbox images={images} initialIndex={lightboxIndex} onClose={() => setLightboxOpen(false)} />
        )}
      </AnimatePresence>
    </>
  );
};

// ─── Add Event Dialog (unchanged logic, restyled) ─────────────────────────────
const AddEventDialog = () => {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { firestore, firebaseApp, user } = useFirebase();
  const { toast } = useToast();

  const form = useForm<TourismEventFormValues>({
    resolver: zodResolver(tourismEventFormSchema),
    defaultValues: { title: '', description: '', location: '', price: 0, category: 'Excursion', whatsapp: '', phone: '', email: '' }
  });

  const onSubmit = async (data: TourismEventFormValues) => {
    if (!user || user.email !== 'drnduwa@gmail.com') {
      toast({ title: "Accès refusé", description: "Seul l'administrateur peut effectuer cette action.", variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);
    const eventRef = doc(collection(firestore, 'tourism_events'));
    try {
      let imageUrls: string[] = [];
      if (data.images && data.images.length > 0) {
        const storage = getStorage(firebaseApp);
        const files = Array.from(data.images as FileList);
        const uploadPromises = files.map((file, index) => {
          const fileName = `img_${Date.now()}_${index}.jpg`;
          const fileRef = storageRef(storage, `tourism/${eventRef.id}/${fileName}`);
          return uploadBytes(fileRef, file).then(snap => getDownloadURL(snap.ref));
        });
        try {
          imageUrls = await Promise.all(uploadPromises);
        } catch (storageErr: any) {
          setIsSubmitting(false);
          toast({
            title: "Erreur de stockage (Étape 1/2)",
            description: `Le serveur a refusé l'accès aux images. Code: ${storageErr.code}.`,
            variant: "destructive",
            action: <ToastAction altText="Réessayer" onClick={() => onSubmit(data)}>Réessayer</ToastAction>
          });
          return;
        }
      }
      await setDoc(eventRef, {
        title: data.title, description: data.description, location: data.location,
        price: data.price, category: data.category, whatsapp: data.whatsapp || '',
        phone: data.phone || '', email: data.email || '',
        imageUrls: imageUrls.length > 0 ? imageUrls : ["https://picsum.photos/seed/tourism/1000/600"],
        createdAt: serverTimestamp(),
      });
      toast({ title: "Offre publiée !", description: "L'offre touristique est maintenant en ligne." });
      setOpen(false);
      form.reset();
    } catch (e: any) {
      toast({ title: "Erreur technique", description: e.message || "Une erreur est survenue.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="rounded-full h-11 px-6 font-bold text-sm bg-stone-900 hover:bg-stone-700 text-white gap-2">
          <PlusCircle className="h-4 w-4" /> Nouvelle offre
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl">
        <DialogHeader><DialogTitle className="text-xl font-bold">Ajouter une offre touristique</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
            <FormField control={form.control} name="title" render={({ field }) => (
              <FormItem><FormLabel>Titre de l'offre</FormLabel><FormControl><Input placeholder="Ex: Safari à la N'sele" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem><FormLabel>Catégorie</FormLabel><FormControl><Input placeholder="Ex: Nature" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="price" render={({ field }) => (
                <FormItem><FormLabel>Prix ($)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="location" render={({ field }) => (
              <FormItem><FormLabel>Lieu</FormLabel><FormControl><Input placeholder="Ex: Kinshasa Est" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="description" render={({ field }) => (
              <FormItem><FormLabel>Description détaillée</FormLabel><FormControl><Textarea className="min-h-[100px]" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-3 gap-4">
              <FormField control={form.control} name="whatsapp" render={({ field }) => (
                <FormItem><FormLabel>WhatsApp</FormLabel><FormControl><Input placeholder="243..." {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="phone" render={({ field }) => (
                <FormItem><FormLabel>Téléphone</FormLabel><FormControl><Input placeholder="08..." {...field} /></FormControl><FormMessage /></FormItem>
              )} />
              <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" placeholder="contact@..." {...field} /></FormControl><FormMessage /></FormItem>
              )} />
            </div>
            <FormField control={form.control} name="images" render={({ field: { onChange, ...fieldProps } }) => (
              <FormItem>
                <FormLabel>Photos de l'excursion</FormLabel>
                <FormControl><Input type="file" multiple accept="image/*" onChange={e => onChange(e.target.files)} className="cursor-pointer" /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <DialogFooter className="pt-4">
              <Button type="submit" disabled={isSubmitting} className="w-full h-12 rounded-2xl font-bold bg-stone-900 hover:bg-stone-700 text-white">
                {isSubmitting ? <><Loader2 className="animate-spin mr-2 h-4 w-4" />Publication en cours...</> : "Publier l'offre"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

// ─── Main Page ─────────────────────────────────────────────────────────────────
export default function TourismPage() {
  const { firestore, user } = useFirebase();
  const { toast } = useToast();
  const isAdmin = user?.email === 'drnduwa@gmail.com';

  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Tous');
  const [sortBy, setSortBy] = useState<'recent' | 'price-asc' | 'price-desc'>('recent');
  const [showFilters, setShowFilters] = useState(false);

  const tourismRef = useMemoFirebase(() => collection(firestore, 'tourism_events'), [firestore]);
  const tourismQuery = useMemoFirebase(() => query(tourismRef, orderBy('createdAt', 'desc')), [tourismRef]);
  const { data: events, isLoading } = useCollection<TourismEvent>(tourismQuery);

  const heroImage = PlaceHolderImages.find(img => img.id === 'tourism-hero')?.imageUrl;

  // Derive category list
  const categories = useMemo(() => {
    if (!events) return ['Tous'];
    const cats = Array.from(new Set(events.map(e => e.category).filter(Boolean)));
    return ['Tous', ...cats];
  }, [events]);

  // Filter + sort
  const filteredEvents = useMemo(() => {
    if (!events) return [];
    let result = events.filter(e => {
      const matchSearch = !search || e.title.toLowerCase().includes(search.toLowerCase()) || e.location?.toLowerCase().includes(search.toLowerCase());
      const matchCat = activeCategory === 'Tous' || e.category === activeCategory;
      return matchSearch && matchCat;
    });
    if (sortBy === 'price-asc') result = [...result].sort((a, b) => a.price - b.price);
    if (sortBy === 'price-desc') result = [...result].sort((a, b) => b.price - a.price);
    return result;
  }, [events, search, activeCategory, sortBy]);

  const handleDelete = async (id: string) => {
    try {
      await deleteDoc(doc(firestore, 'tourism_events', id));
      toast({ title: "Supprimé", description: "L'offre a été retirée." });
    } catch {
      toast({ title: "Erreur", description: "Impossible de supprimer.", variant: "destructive" });
    }
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-[#FAFAF8]">
      {/* ── Hero ── */}
      <div className="relative h-[520px] overflow-hidden">
        <Image
          src={heroImage || "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&q=80&w=1600"}
          alt="Tourism Hero"
          fill
          className="object-cover"
          priority
        />
        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-black/10" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/40 to-transparent" />

        {/* Hero content */}
        <div className="absolute inset-0 flex flex-col justify-end pb-16 px-8 md:px-16 max-w-7xl mx-auto w-full">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
            <p className="text-amber-400 text-[11px] font-bold uppercase tracking-[0.25em] mb-3">
              Explorez · Découvrez · Vivez
            </p>
            <h1 className="text-5xl md:text-7xl font-black text-white leading-[0.95] tracking-tight mb-4">
              Kinshasa<br />
              <em className="not-italic text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-amber-500">Authentique</em>
            </h1>
            <p className="text-white/70 text-base md:text-lg max-w-lg leading-relaxed">
              Des expériences locales soigneusement sélectionnées pour vous faire découvrir l'âme de la ville.
            </p>
          </motion.div>
        </div>

        {/* Stat pills */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="absolute bottom-6 right-8 md:right-16 flex gap-3"
        >
          {[
            { label: 'Expériences', value: events?.length || '—' },
            { label: 'Catégories', value: categories.length - 1 || '—' },
          ].map(stat => (
            <div key={stat.label} className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl px-4 py-2.5 text-center">
              <p className="text-white text-lg font-black leading-none">{stat.value}</p>
              <p className="text-white/60 text-[10px] font-semibold uppercase tracking-widest mt-0.5">{stat.label}</p>
            </div>
          ))}
        </motion.div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8">

        {/* ── Admin bar ── */}
        {isAdmin && (
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 bg-amber-50 border border-amber-200/60 rounded-2xl px-6 py-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-xl">
                <Star className="h-4 w-4 text-amber-600 fill-amber-400" />
              </div>
              <div>
                <p className="text-sm font-bold text-amber-900">Mode Administrateur</p>
                <p className="text-xs text-amber-700/70">Gérez vos offres et réservations</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" asChild className="rounded-full h-9 border-amber-200 text-amber-800 hover:bg-amber-100 text-sm font-semibold">
                <Link href="/admin/tourism">Réservations</Link>
              </Button>
              <AddEventDialog />
            </div>
          </motion.div>
        )}

        {/* ── Search + Filter bar ── */}
        <div className="mt-8 mb-6 space-y-4">
          <div className="flex gap-3">
            {/* Search input */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400" />
              <input
                type="text"
                placeholder="Rechercher une expérience, un lieu..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full h-12 pl-11 pr-10 rounded-2xl bg-white border border-stone-200 text-sm text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400 transition-all"
              />
              {search && (
                <button className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-stone-100 rounded-lg" onClick={() => setSearch('')}>
                  <X className="h-3.5 w-3.5 text-stone-400" />
                </button>
              )}
            </div>
            {/* Sort toggle */}
            <button
              onClick={() => setShowFilters(v => !v)}
              className={`h-12 px-4 rounded-2xl border text-sm font-semibold flex items-center gap-2 transition-all ${showFilters ? 'bg-stone-900 text-white border-stone-900' : 'bg-white border-stone-200 text-stone-600 hover:border-stone-300'}`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Filtrer</span>
            </button>
          </div>

          {/* Expandable filter panel */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="bg-white border border-stone-200 rounded-2xl p-4 flex flex-col sm:flex-row gap-4">
                  <div className="flex-1">
                    <p className="text-[11px] font-bold uppercase tracking-widest text-stone-400 mb-2">Trier par</p>
                    <div className="flex gap-2 flex-wrap">
                      {[
                        { val: 'recent', label: 'Plus récent' },
                        { val: 'price-asc', label: 'Prix ↑' },
                        { val: 'price-desc', label: 'Prix ↓' },
                      ].map(opt => (
                        <button
                          key={opt.val}
                          onClick={() => setSortBy(opt.val as typeof sortBy)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${sortBy === opt.val ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'}`}
                        >
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Category pills */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-none">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`shrink-0 px-4 py-2 rounded-full text-[12px] font-bold transition-all whitespace-nowrap ${
                  activeCategory === cat
                    ? 'bg-stone-900 text-white shadow-sm'
                    : 'bg-white text-stone-500 border border-stone-200 hover:border-stone-300 hover:text-stone-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* ── Results count ── */}
        {!isLoading && events && events.length > 0 && (
          <p className="text-[12px] font-semibold text-stone-400 mb-6 uppercase tracking-widest">
            {filteredEvents.length} expérience{filteredEvents.length !== 1 ? 's' : ''}
            {activeCategory !== 'Tous' && ` · ${activeCategory}`}
            {search && ` · "${search}"`}
          </p>
        )}

        {/* ── Event grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7 pb-24">
          {isLoading ? (
            <div className="col-span-full py-32 flex flex-col items-center gap-4">
              <Loader2 className="h-8 w-8 animate-spin text-stone-300" />
              <p className="text-stone-400 text-xs font-bold uppercase tracking-widest">Chargement...</p>
            </div>
          ) : filteredEvents.length > 0 ? (
            filteredEvents.map((event, idx) => (
              <EventCard key={event.id} event={event} isAdmin={isAdmin} onDelete={handleDelete} index={idx} />
            ))
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="col-span-full py-32 text-center"
            >
              <div className="text-6xl mb-4">🌿</div>
              <p className="text-stone-400 font-bold text-base mb-1">Aucune expérience trouvée</p>
              <p className="text-stone-300 text-sm">
                {search ? `Aucun résultat pour "${search}"` : 'Aucune offre disponible pour cette catégorie.'}
              </p>
              {(search || activeCategory !== 'Tous') && (
                <button
                  className="mt-4 text-sm font-semibold text-amber-600 hover:underline"
                  onClick={() => { setSearch(''); setActiveCategory('Tous'); }}
                >
                  Réinitialiser les filtres
                </button>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
