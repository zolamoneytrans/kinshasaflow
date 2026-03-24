
'use client';

import React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MapPin, Calendar, Users, Star, Palmtree, ArrowRight, Loader2, Plane, Hotel, ShieldCheck, CheckCircle2, Map, Compass } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { TourismBookingDialog } from './tourism-booking-dialog';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy } from 'firebase/firestore';
import { TourismEvent } from '@/lib/types';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const featuredPackage = {
  id: "10-jours-kinshasa",
  title: "Séjour Immersion : 10 Jours à Kinshasa",
  category: "Séjour Complet",
  provider: "Congo na Motema",
  description: "Vivez une immersion totale et sans stress dans la capitale. Nous gérons toute la logistique pour vous permettre de savourer chaque instant, de la Gombe à la N'sele.",
  location: "Kinshasa & Environs",
  price: 990,
  imageUrls: ["https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&q=80&w=1000"],
  inclusions: [
    { text: "Hébergement adapté (Gombe/Lingwala)", icon: Hotel },
    { text: "Transferts Aéroport A/R inclus", icon: Plane },
    { text: "Taxes GOPASS pré-payées", icon: ShieldCheck },
    { text: "Excursion Safari Parc de la Nsele", icon: Compass },
    { text: "Guide local dédié 24/7", icon: Users }
  ],
  pricing: [
    { label: "Formule Solo", price: "990€", desc: "Voyageur indépendant" },
    { label: "Formule Duo", price: "1980€", desc: "Parfait pour les couples" },
    { label: "Formule Trio", price: "2970€", desc: "Famille ou Amis" }
  ]
};

const defaultEvents = [
  {
    id: "lola-ya-bonobo",
    title: "Lola ya Bonobo",
    category: "Sanctuaire",
    description: "Le seul sanctuaire au monde pour les bonobos orphelins. Une rencontre émouvante avec nos cousins les plus proches dans un cadre naturel préservé.",
    location: "Kimwenza, Kinshasa",
    price: 25,
    imageUrls: ["https://images.unsplash.com/photo-1540573133985-87b6da6d54a9?auto=format&fit=crop&q=80&w=1000"],
  },
  {
    id: "chutes-zongo",
    title: "Chutes de la Zongo",
    category: "Nature & Aventure",
    description: "Un spectacle naturel époustouflant à quelques heures de la capitale. Idéal pour une randonnée ressourçante et une évasion loin du tumulte urbain.",
    location: "Kongo Central",
    price: 45,
    imageUrls: ["https://images.unsplash.com/photo-1441974231531-c6227db76b6e?auto=format&fit=crop&q=80&w=1000"],
  },
  {
    id: "ma-vallee",
    title: "Lac de Ma Vallée",
    category: "Détente",
    description: "Havre de paix niché dans les collines. Profitez d'une balade en pédalo, d'une partie de pêche ou d'un déjeuner paisible au bord de l'eau.",
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
  const heroImage = PlaceHolderImages.find(img => img.id === 'tourism-hero')?.imageUrl;

  return (
    <div className="w-full h-full overflow-y-auto bg-slate-50/30">
      <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-16 pb-24">
        
        {/* --- High-End Hero Section --- */}
        <section className="relative h-[500px] rounded-[3rem] overflow-hidden shadow-2xl flex items-center justify-center text-center">
          <Image 
            src={heroImage || "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?auto=format&fit=crop&q=80&w=1200"} 
            alt="Tourism Hero" 
            fill 
            className="object-cover brightness-[0.4]"
            priority
          />
          <div className="relative z-10 space-y-8 px-6 max-w-4xl">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="flex justify-center mb-6">
                <Badge className="bg-accent text-accent-foreground px-6 py-2 rounded-full font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-accent/20">
                  Explorer la RD Congo
                </Badge>
              </div>
              <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter mb-6 leading-none">
                Kinshasa, <br /><span className="text-primary italic">autrement.</span>
              </h1>
              <p className="text-slate-200 text-xl md:text-2xl font-medium max-w-2xl mx-auto leading-relaxed opacity-90">
                Découvrez l'authenticité de la capitale avec des séjours clés en main et des expériences locales uniques.
              </p>
            </motion.div>
          </div>
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce">
            <div className="w-1 h-12 bg-gradient-to-b from-white/60 to-transparent rounded-full"></div>
          </div>
        </section>

        {/* --- Featured 10-Day Pack --- */}
        <section className="space-y-10">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div className="space-y-2">
              <h2 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                <div className="h-12 w-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                  <Star className="text-primary fill-primary h-6 w-6" />
                </div>
                L'Offre Signature
              </h2>
              <p className="text-muted-foreground font-bold uppercase tracking-widest text-xs">Partenariat Exclusif avec Congo na Motema</p>
            </div>
          </div>

          <Card className="border-none shadow-3xl rounded-[3rem] overflow-hidden bg-white group border border-slate-100/50">
            <div className="grid lg:grid-cols-2">
              <div className="relative h-[400px] lg:h-auto overflow-hidden">
                <Image 
                  src={featuredPackage.imageUrls[0]} 
                  alt={featuredPackage.title} 
                  fill 
                  className="object-cover transition-transform duration-[2s] group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent"></div>
                <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end">
                  <div className="space-y-1">
                    <p className="text-white/70 text-xs font-black uppercase tracking-widest">À partir de</p>
                    <p className="text-white text-5xl font-black tracking-tighter">990€</p>
                  </div>
                  <Badge className="bg-white/20 backdrop-blur-md text-white border-white/30 px-4 py-2 font-bold">10 Jours / 9 Nuits</Badge>
                </div>
              </div>
              
              <div className="p-10 lg:p-16 space-y-10 flex flex-col justify-center">
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Badge variant="success" className="font-black px-3 py-1">TOUT INCLUS</Badge>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-tighter">Logistique & Sérénité</span>
                  </div>
                  <h3 className="text-4xl md:text-5xl font-black text-slate-900 mb-4 tracking-tighter leading-[0.95]">
                    {featuredPackage.title}
                  </h3>
                  <p className="text-slate-500 text-lg leading-relaxed font-medium">
                    {featuredPackage.description}
                  </p>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                  <div className="space-y-5">
                    <h4 className="font-black text-slate-900 uppercase tracking-[0.15em] text-[10px]">Prestations incluses</h4>
                    <ul className="space-y-4">
                      {featuredPackage.inclusions.map((inc, i) => (
                        <li key={i} className="flex items-center gap-4 text-sm font-bold text-slate-600 group/item">
                          <div className="p-2 bg-slate-50 rounded-xl group-hover/item:bg-primary/10 transition-colors">
                            <inc.icon className="h-4 w-4 text-primary" />
                          </div>
                          {inc.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="space-y-5">
                    <h4 className="font-black text-slate-900 uppercase tracking-[0.15em] text-[10px]">Grille tarifaire</h4>
                    <div className="space-y-3">
                      {featuredPackage.pricing.map((p, i) => (
                        <div key={i} className="flex justify-between items-center p-4 rounded-2xl bg-slate-50/50 border border-slate-100 hover:bg-white hover:shadow-lg transition-all cursor-default">
                          <div>
                            <p className="text-sm font-black text-slate-900">{p.label}</p>
                            <p className="text-[10px] text-slate-400 font-bold">{p.desc}</p>
                          </div>
                          <span className="text-xl font-black text-primary">{p.price}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-6 flex flex-col sm:flex-row gap-4">
                  <TourismBookingDialog event={featuredPackage as any} />
                  <Button variant="outline" className="h-14 rounded-2xl font-black border-2 px-10 hover:bg-slate-50 transition-all text-sm uppercase tracking-widest">
                    Voir le programme
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        </section>

        {/* --- À la Carte Grid --- */}
        <div className="space-y-12">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-200/60 pb-10">
            <div className="space-y-2">
              <h2 className="text-4xl font-black text-slate-900 tracking-tight flex items-center gap-4">
                <Palmtree className="text-emerald-500 h-10 w-10" />
                Évasions & Loisirs
              </h2>
              <p className="text-muted-foreground text-lg font-medium">Des expériences locales à vivre sur une journée.</p>
            </div>
            <Button variant="ghost" className="font-black text-primary hover:bg-primary/5 uppercase tracking-widest text-xs">
              Tout afficher <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {isLoading ? (
              <div className="col-span-full py-24 flex flex-col items-center gap-6">
                <div className="relative">
                  <Loader2 className="h-16 w-16 animate-spin text-primary opacity-20" />
                  <Compass className="h-8 w-8 text-primary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                </div>
                <p className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px]">Mise à jour des disponibilités...</p>
              </div>
            ) : (
              events.map((event, idx) => (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 40 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.1, duration: 0.6 }}
                >
                  <Card className="group overflow-hidden border-none shadow-xl rounded-[2.5rem] bg-white h-full flex flex-col hover:shadow-3xl transition-all duration-500 hover:-translate-y-2">
                    <div className="relative aspect-[4/3] overflow-hidden">
                      <Image 
                        src={event.imageUrls[0]} 
                        alt={event.title} 
                        fill 
                        className="object-cover transition-transform duration-[1.5s] group-hover:scale-110"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      <div className="absolute top-6 left-6">
                        <Badge className="bg-white/95 backdrop-blur-md text-slate-900 font-black px-4 py-1.5 shadow-lg rounded-full text-[10px] uppercase tracking-widest">
                          {event.category}
                        </Badge>
                      </div>
                      <div className="absolute bottom-6 right-6">
                        <div className="bg-primary text-white px-5 py-2.5 rounded-2xl font-black shadow-2xl scale-90 group-hover:scale-100 transition-transform">
                          {event.price}$ <span className="text-[10px] opacity-70">/ pers.</span>
                        </div>
                      </div>
                    </div>
                    
                    <CardHeader className="p-8 pb-4">
                      <CardTitle className="text-2xl font-black text-slate-900 group-hover:text-primary transition-colors leading-tight">
                        {event.title}
                      </CardTitle>
                      <CardDescription className="flex items-center gap-2 font-bold text-slate-400 uppercase text-[10px] tracking-widest pt-2">
                        <MapPin className="h-3 w-3 text-emerald-500" />
                        {event.location}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="px-8 pb-8 pt-0 flex-1">
                      <p className="text-slate-500 text-sm leading-relaxed line-clamp-3 font-medium opacity-80 group-hover:opacity-100 transition-opacity">
                        {event.description}
                      </p>
                    </CardContent>

                    <CardFooter className="px-8 py-6 border-t border-slate-50 bg-slate-50/30">
                      <div className="w-full flex items-center justify-between">
                        <div className="flex -space-x-2">
                          {[1,2,3].map(i => (
                            <div key={i} className="w-7 h-7 rounded-full border-2 border-white bg-slate-200 flex items-center justify-center overflow-hidden">
                              <Image src={`https://picsum.photos/seed/user${i + idx}/100`} alt="user" fill className="object-cover" />
                            </div>
                          ))}
                          <div className="w-7 h-7 rounded-full border-2 border-white bg-primary flex items-center justify-center text-[8px] font-black text-white">
                            +12
                          </div>
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

        {/* --- Professional Footer Banner --- */}
        <section className="bg-slate-900 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-3xl">
          <div className="absolute top-[-50%] right-[-10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px]"></div>
          <div className="absolute bottom-[-20%] left-[-5%] w-[300px] h-[300px] bg-accent/10 rounded-full blur-[80px]"></div>
          
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-12">
            <div className="space-y-6 max-w-2xl text-center lg:text-left">
              <Badge className="bg-white/10 text-white border-white/20 px-4 py-1.5 font-bold uppercase tracking-[0.2em] text-[10px]">Besoin d'un séjour sur mesure ?</Badge>
              <h3 className="text-4xl md:text-5xl font-black tracking-tighter leading-none">
                Votre projet de voyage <br /><span className="text-primary italic">commence ici.</span>
              </h3>
              <p className="text-slate-400 text-lg font-medium leading-relaxed">
                Groupes, entreprises ou séjours privés : nos experts conçoivent votre itinéraire idéal à Kinshasa et dans tout le pays.
              </p>
              <div className="flex flex-wrap justify-center lg:justify-start gap-6 pt-4">
                <a href="mailto:congonamotema@gmail.com" className="flex items-center gap-3 text-sm font-black group transition-colors hover:text-primary">
                  <div className="p-2 bg-white/5 rounded-xl border border-white/10 group-hover:bg-primary/20 transition-colors">
                    <Palmtree className="h-5 w-5 text-primary" />
                  </div>
                  congonamotema@gmail.com
                </a>
                <a href="https://wa.me/33665626422" target="_blank" className="flex items-center gap-3 text-sm font-black group transition-colors hover:text-emerald-400">
                  <div className="p-2 bg-white/5 rounded-xl border border-white/10 group-hover:bg-emerald-500/20 transition-colors">
                    <Users className="h-5 w-5 text-emerald-500" />
                  </div>
                  +33 665 626 422 (WhatsApp)
                </a>
              </div>
            </div>
            <div className="flex flex-col gap-4 shrink-0 w-full sm:w-auto">
              <Button size="lg" className="bg-primary text-white hover:bg-primary/90 font-black h-20 px-12 rounded-[2rem] shadow-3xl shadow-primary/30 text-xl group">
                Demander un Devis
                <ArrowRight className="ml-3 h-6 w-6 transition-transform group-hover:translate-x-2" />
              </Button>
              <p className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Réponse sous 24 heures</p>
            </div>
          </div>
        </section>

      </div>
    </div>
  );
}
