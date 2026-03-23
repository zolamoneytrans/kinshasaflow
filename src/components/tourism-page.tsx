
'use client';

import React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar, Users, Star, Palmtree, ArrowRight, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TourismBookingDialog } from './tourism-booking-dialog';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { TourismEvent } from '@/lib/types';

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
    id: "jardin-botanique",
    title: "Jardin Botanique de Kinshasa",
    category: "Culture",
    description: "Une oasis de paix au cœur de la ville. Découvrez des centaines d'espèces végétales tropicales rares.",
    location: "Gombe, Kinshasa",
    price: 10,
    imageUrls: ["https://images.unsplash.com/photo-1513836279014-a89f7a76ae86?auto=format&fit=crop&q=80&w=1000"],
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
        <section className="relative h-[400px] rounded-[2.5rem] overflow-hidden shadow-2xl flex items-center justify-center text-center">
          <Image 
            src="https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&q=80&w=1200" 
            alt="Tourism Hero" 
            fill 
            className="object-cover brightness-[0.4]"
            priority
          />
          <div className="relative z-10 space-y-6 px-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              <Badge className="bg-emerald-500 text-white mb-4 px-4 py-1.5 rounded-full font-bold">
                Évasion & Découverte
              </Badge>
              <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4">
                Explorez Kinshasa<br />et ses merveilles
              </h1>
              <p className="text-slate-200 text-lg md:text-xl font-medium max-w-2xl mx-auto leading-relaxed">
                Réservez vos excursions et vivez des moments inoubliables dans les plus beaux sites touristiques de la capitale.
              </p>
            </motion.div>
          </div>
        </section>

        {/* Section Title */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-6">
          <div className="space-y-1">
            <h2 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <Palmtree className="text-emerald-500 h-8 w-8" />
              Destinations à la une
            </h2>
            <p className="text-muted-foreground font-medium italic">Les sites les plus visités ce mois-ci</p>
          </div>
        </div>

        {/* Events Grid */}
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
                        À partir de {event.price}$
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
                        <span className="text-xs font-black">4.8 (Recommandé)</span>
                      </div>
                      <TourismBookingDialog event={event as any} />
                    </div>
                  </CardFooter>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        {/* Info Banner */}
        <section className="bg-emerald-600 rounded-[2.5rem] p-10 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="space-y-4 max-w-xl">
              <h3 className="text-3xl font-black tracking-tight">Groupe ou Entreprise ?</h3>
              <p className="text-emerald-100 font-medium leading-relaxed">
                Nous organisons des sorties sur mesure pour les écoles, les entreprises et les groupes d'amis. Profitez de tarifs préférentiels et d'un accompagnement personnalisé.
              </p>
            </div>
            <Button size="lg" className="bg-white text-emerald-700 hover:bg-emerald-50 font-black h-16 px-10 rounded-2xl shadow-xl shadow-emerald-900/20 text-lg">
              Demander un devis
              <ArrowRight className="ml-2 h-6 w-6" />
            </Button>
          </div>
        </section>

      </div>
    </div>
  );
}
