
'use client';

import React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar, Users, Star, Palmtree, ArrowRight, Loader2, Plane, Hotel, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TourismBookingDialog } from './tourism-booking-dialog';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { TourismEvent } from '@/lib/types';

const featuredPackage = {
  id: "10-jours-kinshasa",
  title: "Pack 10 Jours à Kinshasa",
  category: "Séjour Complet",
  provider: "Congo na Motema",
  description: "Profitez de votre séjour confortablement sans vous ruiner. Une immersion totale de 10 jours incluant les sites les plus prestigieux et une logistique clé en main.",
  location: "Kinshasa & Environs",
  price: 990,
  imageUrls: ["https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&q=80&w=1000"],
  inclusions: [
    "Hébergement adapté à votre formule",
    "Transport Aéroport aller-retour",
    "GOPASS Inclus",
    "Visite du Parc de la Nsele & Safari",
    "Activités à la carte possibles"
  ],
  pricing: [
    { label: "Solo", price: "990€", desc: "Voyageur indépendant" },
    { label: "Duo", price: "1980€", desc: "Idéal en couple / amis" },
    { label: "Trio", price: "2970€", desc: "Famille ou petit groupe" }
  ]
};

const defaultEvents = [
  {
    id: "lola-ya-bonobo",
    title: "Lola ya Bonobo",
    category: "Sanctuaire",
    description: "Visitez le seul sanctuaire au monde pour les bonobos orphelins. Une expérience unique de conservation en pleine nature.",
    location: "Kimwenza, Kinshasa",
    price: 25,
    imageUrls: ["https://images.unsplash.com/photo-1540573133985-87b6da6d54a9?auto=format&fit=crop&q=80&w=1000"],
  },
  {
    id: "chutes-zongo",
    title: "Chutes de la Zongo",
    category: "Nature",
    description: "Évadez-vous vers l'une des plus belles chutes d'eau du pays. Randonnée, baignade et détente garanties.",
    location: "Kongo Central (3h de Kin)",
    price: 45,
    imageUrls: ["https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=1000"],
  },
  {
    id: "ma-vallee",
    title: "Lac de Ma Vallée",
    category: "Loisirs",
    description: "Activités nautiques, pêche et restaurants au bord de l'eau. Idéal pour un dimanche en famille ou entre amis.",
    location: "Mont-Ngafula",
    price: 15,
    imageUrls: ["https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=80&w=1000"],
  }
];

export default function TourismPage() {
  const { firestore } = useFirebase();
  const tourismRef = useMemoFirebase(() => collection(firestore, 'tourism_events'), [firestore]);
  const tourismQuery = useMemoFirebase(() => query(tourismRef, orderBy('createdAt', 'desc')), [tourismRef]);
  const { data: dbEvents, isLoading } = useCollection<TourismEvent>(tourismQuery);

  const events = dbEvents && dbEvents.length > 0 ? dbEvents : defaultEvents;

  return (
    <div className="w-full h-full overflow-y-auto bg-slate-50/50">
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-12 pb-24">
        
        {/* Hero Section */}
        <section className="relative h-[450px] rounded-[2.5rem] overflow-hidden shadow-2xl flex items-center justify-center text-center">
          <Image 
            src="https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&q=80&w=1200" 
            alt="Tourism Hero" 
            fill 
            className="object-cover brightness-[0.35]"
            priority
          />
          <div className="relative z-10 space-y-6 px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Badge className="bg-amber-500 text-white mb-4 px-4 py-1.5 rounded-full font-bold animate-pulse">
                DESTINATION CONGO
              </Badge>
              <h1 className="text-4xl md:text-7xl font-black text-white tracking-tighter mb-4">
                Kinshasa vous attend.
              </h1>
              <p className="text-slate-200 text-lg md:text-2xl font-medium max-w-3xl mx-auto leading-relaxed">
                Des séjours immersifs conçus pour vous faire découvrir le cœur battant de l'Afrique en toute sérénité.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Featured Package Section */}
        <section className="space-y-8">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center">
              <Star className="text-primary fill-primary" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-slate-900 tracking-tight">Offre Exclusive</h2>
              <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">Congo na Motema</p>
            </div>
          </div>

          <Card className="border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white group border border-slate-100">
            <div className="grid lg:grid-cols-2">
              <div className="relative h-[300px] lg:h-auto overflow-hidden">
                <Image 
                  src={featuredPackage.imageUrls[0]} 
                  alt={featuredPackage.title} 
                  fill 
                  className="object-cover transition-transform duration-1000 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent lg:hidden"></div>
                <div className="absolute bottom-6 left-6 lg:hidden">
                  <Badge className="bg-amber-500 text-white font-black text-lg px-4 py-1">Dès 990€</Badge>
                </div>
              </div>
              <div className="p-8 lg:p-12 space-y-8">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Badge className="bg-primary/10 text-primary border-primary/20 font-black">10 JOURS</Badge>
                    <Badge variant="outline" className="text-emerald-600 border-emerald-200 font-bold uppercase tracking-tighter">Tout Inclus</Badge>
                  </div>
                  <h3 className="text-4xl font-black text-slate-900 mb-4 tracking-tighter leading-none">
                    {featuredPackage.title}
                  </h3>
                  <p className="text-slate-500 text-lg leading-relaxed font-medium">
                    {featuredPackage.description}
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="font-black text-slate-900 uppercase tracking-widest text-xs">Ce qui est inclus :</h4>
                    <ul className="space-y-3">
                      {featuredPackage.inclusions.map((inc, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm font-bold text-slate-600">
                          <CheckCircle2 className="h-5 w-5 text-emerald-500 shrink-0" />
                          {inc}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-4">
                    <h4 className="font-black text-slate-900 uppercase tracking-widest text-xs">Nos Formules :</h4>
                    <div className="space-y-3">
                      {featuredPackage.pricing.map((p, i) => (
                        <div key={i} className="flex justify-between items-center p-3 rounded-xl bg-slate-50 border border-slate-100 transition-colors hover:bg-primary/5">
                          <div>
                            <p className="text-sm font-black text-slate-900">{p.label}</p>
                            <p className="text-[10px] text-slate-400 font-bold">{p.desc}</p>
                          </div>
                          <span className="text-lg font-black text-primary">{p.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-4 flex flex-col sm:flex-row gap-4">
                  <TourismBookingDialog event={featuredPackage as any} />
                  <Button variant="outline" className="h-12 rounded-xl font-bold border-2 px-8">
                    Voir l'itinéraire complet
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* Other destinations Section */}
        <div className="space-y-8">
          <div className="flex items-center justify-between border-b border-slate-200 pb-6">
            <div className="space-y-1">
              <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                <Palmtree className="text-emerald-500 h-8 w-8" />
                Découvertes à la carte
              </h2>
              <p className="text-muted-foreground font-medium italic">Excursions d'une journée ou week-end</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {isLoading ? (
              <div className="col-span-full py-20 flex flex-col items-center gap-4">
                <Loader2 className="h-12 w-12 animate-spin text-emerald-500" />
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Chargement des offres...</p>
              </div>
            ) : (
              events.map((event, idx) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                >
                  <Card className="group overflow-hidden border-none shadow-lg rounded-[2rem] bg-white h-full flex flex-col hover:shadow-2xl transition-all">
                    <div className="relative aspect-[16/10] overflow-hidden">
                      <Image 
                        src={event.imageUrls[0]} 
                        alt={event.title} 
                        fill 
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-white/90 backdrop-blur-md text-emerald-700 font-black shadow-lg">
                          {event.category}
                        </Badge>
                      </div>
                      <div className="absolute bottom-4 right-4">
                        <div className="bg-emerald-500 text-white px-4 py-2 rounded-2xl font-black shadow-xl">
                          {event.price}$ / pers.
                        </div>
                      </div>
                    </div>
                    
                    <CardHeader className="p-6 pb-2">
                      <CardTitle className="text-2xl font-black text-slate-900 group-hover:text-emerald-600 transition-colors">
                        {event.title}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-1.5 font-bold text-slate-400">
                        <MapPin className="h-4 w-4 text-emerald-500" />
                        {event.location}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="p-6 pt-2 flex-1">
                      <p className="text-slate-500 text-sm leading-relaxed line-clamp-3 font-medium">
                        {event.description}
                      </p>
                    </CardContent>

                    <CardFooter className="p-6 pt-0 border-t border-slate-50 bg-slate-50/50">
                      <div className="w-full flex items-center justify-between gap-4">
                        <div className="flex items-center gap-1 text-emerald-600">
                          <Star className="h-4 w-4 fill-current" />
                          <span className="text-xs font-black">Recommandé</span>
                        </div>
                        <TourismBookingDialog event={event as any} />
                      </div>
                    </CardFooter>
                  </Card>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Info Banner */}
        <section className="bg-slate-900 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-primary/20 rounded-full blur-3xl"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4 max-w-xl text-center md:text-left">
              <h3 className="text-3xl font-black tracking-tight">Contact Direct & Devis</h3>
              <p className="text-slate-400 font-medium leading-relaxed">
                Pour toute personnalisation ou question sur nos packs, nos agents sont à votre écoute sur WhatsApp ou par e-mail.
              </p>
              <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm font-bold">
                <span className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                  <Palmtree className="h-4 w-4 text-primary" /> congonamotema@gmail.com
                </span>
                <span className="flex items-center gap-2 bg-white/5 px-4 py-2 rounded-full border border-white/10">
                  <Users className="h-4 w-4 text-primary" /> +33 665 626 422
                </span>
              </div>
            </div>
            <Button size="lg" className="bg-primary text-white hover:bg-primary/90 font-black h-16 px-10 rounded-2xl shadow-xl shadow-primary/20 text-lg">
              Demander un devis Groupe
              <ArrowRight className="ml-2 h-6 w-6" />
            </Button>
          </div>
        </section>

      </div>
    </div>
  );
}
