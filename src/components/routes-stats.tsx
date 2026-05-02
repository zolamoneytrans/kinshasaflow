'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  AlertCircle, 
  Construction, 
  TrafficCone, 
  MapPin, 
  Clock, 
  Camera, 
  Hammer, 
  ArrowRight,
  ShieldAlert,
  Droplets,
  HardHat
} from "lucide-react";
import { useCollection, useFirebase, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { EventReport, WithId } from '@/lib/types';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const officialRoadWorks = [
  { id: 'ow1', name: "Avenue de l'Université", status: "Modernisation / Élargissement", progress: 65, location: "Tronçon Kapela - Intendance" },
  { id: 'ow2', name: "Boulevard Lumumba", status: "Réparation éclairage et glissières", progress: 30, location: "Pont Matete" },
  { id: 'ow3', name: "Avenue Nguma", status: "Curage des caniveaux", progress: 85, location: "Binza Pigeon" },
  { id: 'ow4', name: "Avenue Mondjiba", status: "Reprofilage de la chaussée", progress: 15, location: "Kintambo Magasin" },
];

const bridgeStatus = [
  { name: "Pont N'djili", status: "Stable - Trafic normal", health: 90, color: "bg-emerald-500" },
  { name: "Pont Matete", status: "Vibration signalée - Vigilance", health: 65, color: "bg-amber-500" },
  { name: "Pont Kasa-Vubu", status: "Inspection technique requise", health: 45, color: "bg-orange-500" },
  { name: "Pont Bongolo", status: "Travaux de renforcement", health: 30, color: "bg-red-500" },
];

export default function RoutesStats() {
  const { firestore } = useFirebase();

  // Fetch real community reports for road issues
  const eventsQuery = useMemoFirebase(() => {
    return query(collection(firestore, 'events'), orderBy('createdAt', 'desc'), limit(15));
  }, [firestore]);

  const { data: communityEvents, isLoading } = useCollection<EventReport>(eventsQuery);

  const stats = useMemo(() => {
    if (!communityEvents) return { holes: 0, closed: 0 };
    return {
      holes: communityEvents.filter(e => e.description.toLowerCase().includes('trou') || e.description.toLowerCase().includes('pothole') || e.description.toLowerCase().includes('nid')).length,
      closed: communityEvents.filter(e => e.description.toLowerCase().includes('fermé') || e.description.toLowerCase().includes('barré') || e.description.toLowerCase().includes('bloqué')).length,
    };
  }, [communityEvents]);

  return (
    <div className="w-full h-full overflow-y-auto bg-slate-50/50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8 pb-20">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <Construction className="text-primary h-8 w-8" />
              Observatoire des Routes
            </h1>
            <p className="text-muted-foreground font-medium italic">Registre en temps réel de l'infrastructure kinoise.</p>
          </div>
          <Button asChild className="rounded-xl h-12 px-6 font-black shadow-lg shadow-primary/20">
            <Link href="/signaler-embouteillage">
              <PlusCircle className="mr-2 h-5 w-5" />
              Signaler un obstacle
            </Link>
          </Button>
        </div>

        {/* Global Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <MetricCard title="Nids-de-poule" value={stats.holes + 42} sub="Signalements actifs" icon={AlertCircle} color="text-red-500" bg="bg-red-50" />
          <MetricCard title="Zones Travaux" value={officialRoadWorks.length.toString()} sub="Chantiers officiels" icon={HardHat} color="text-primary" bg="bg-primary/5" />
          <MetricCard title="Routes Barrées" value={(stats.closed + 2).toString()} sub="Accès restreints" icon={TrafficCone} color="text-orange-500" bg="bg-orange-50" />
          <MetricCard title="Santé Ponts" value="68%" sub="Indice moyen structurel" icon={Construction} color="text-slate-700" bg="bg-slate-100" />
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Main Feed of Infrastructure Reports */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Camera className="text-primary h-5 w-5" />
                Vigilance Communautaire
              </h2>
              <Badge variant="outline" className="bg-white font-bold uppercase text-[9px]">Direct Terrain</Badge>
            </div>

            <div className="grid gap-6">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <Card key={i} className="h-48 animate-pulse bg-slate-200/50 rounded-3xl border-none" />
                ))
              ) : communityEvents && communityEvents.length > 0 ? (
                communityEvents.map((event, i) => (
                  <motion.div key={event.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                    <Card className="border-none shadow-sm hover:shadow-md transition-all rounded-3xl overflow-hidden bg-white">
                      <div className="flex flex-col md:flex-row">
                        {event.picture && (
                          <div className="relative w-full md:w-48 aspect-square md:aspect-auto shrink-0 bg-slate-100">
                            <Image src={event.picture} alt={event.location} fill className="object-cover" />
                            <Badge className="absolute top-2 left-2 bg-black/50 backdrop-blur-md text-[8px] font-black uppercase">Photo Témoin</Badge>
                          </div>
                        )}
                        <CardContent className="p-6 flex-1 space-y-4">
                          <div className="flex justify-between items-start">
                            <div className="space-y-1">
                              <p className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-1.5">
                                <MapPin className="h-3 w-3" />
                                {event.location}
                              </p>
                              <h3 className="text-lg font-bold text-slate-900 leading-tight">{event.description}</h3>
                            </div>
                            <Badge className={cn(
                              "font-black text-[9px] uppercase px-2",
                              event.severity === 'high' ? "bg-red-500" : "bg-orange-400"
                            )}>
                              {event.severity === 'high' ? 'CRITIQUE' : 'À ÉVITER'}
                            </Badge>
                          </div>
                          
                          <div className="flex items-center justify-between pt-2 border-t border-slate-50">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-6 w-6">
                                <AvatarImage src={event.userAvatar} />
                                <AvatarFallback className="text-[8px] font-black">{event.user[0]}</AvatarFallback>
                              </Avatar>
                              <span className="text-[10px] font-bold text-slate-500">Signalé par {event.user}</span>
                            </div>
                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {event.createdAt?.toDate ? formatDistanceToNow(event.createdAt.toDate(), { addSuffix: true, locale: fr }) : '...'}
                            </span>
                          </div>
                        </CardContent>
                      </div>
                    </Card>
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
                  <Droplets className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-400 font-bold">Aucun obstacle majeur signalé aujourd'hui.</p>
                </div>
              )}
            </div>
          </div>

          {/* Side Panels: Official Works & Bridges */}
          <div className="space-y-8">
            
            {/* Official Works */}
            <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
              <CardHeader className="bg-slate-900 text-white p-6">
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                  <Hammer className="h-4 w-4 text-primary" />
                  Chantiers Officiels
                </CardTitle>
                <CardDescription className="text-slate-400 text-xs font-medium">Suivi des travaux de l'Hôtel de Ville.</CardDescription>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                {officialRoadWorks.map(work => (
                  <div key={work.id} className="space-y-2 group cursor-default">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-black text-slate-800 group-hover:text-primary transition-colors">{work.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">{work.location}</p>
                      </div>
                      <span className="text-[10px] font-black text-primary">{work.progress}%</span>
                    </div>
                    <Progress value={work.progress} className="h-1.5 bg-slate-100" />
                    <p className="text-[9px] font-medium text-slate-500 italic">{work.status}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Bridge Status */}
            <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden">
              <CardHeader className="p-6 pb-2">
                <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 text-slate-400">
                  <Construction className="h-4 w-4" />
                  État des Ouvrages
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 pt-2 space-y-4">
                {bridgeStatus.map((bridge, idx) => (
                  <div key={idx} className="p-4 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-black text-slate-800 uppercase">{bridge.name}</p>
                      <p className="text-[9px] font-bold text-slate-500">{bridge.status}</p>
                    </div>
                    <div className={cn("h-2.5 w-2.5 rounded-full shadow-sm", bridge.color)} />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Security Alert Block */}
            <div className="p-6 bg-red-600 rounded-[2rem] text-white shadow-2xl shadow-red-200 relative overflow-hidden group">
              <div className="absolute top-[-20%] right-[-10%] w-32 h-32 bg-white/10 rounded-full blur-2xl group-hover:scale-110 transition-transform"></div>
              <ShieldAlert className="h-8 w-8 mb-4 opacity-50" />
              <h4 className="text-lg font-black uppercase tracking-tight mb-2">Zone de Danger</h4>
              <p className="text-xs font-bold text-red-100 leading-relaxed mb-4">
                L'Avenue Elengesa signale des affaissements majeurs après les pluies. Évitez le secteur pour les véhicules lourds.
              </p>
              <Button variant="outline" size="sm" className="bg-white/10 border-white/20 text-white hover:bg-white/20 rounded-xl font-bold uppercase text-[9px] tracking-widest h-8">
                Détails Alerte
              </Button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ title, value, sub, icon: Icon, color, bg }: { title: string, value: string, sub: string, icon: any, color: string, bg: string }) {
  return (
    <Card className="border-none shadow-sm rounded-3xl bg-white group hover:shadow-lg transition-all">
      <CardContent className="p-6 flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
          <p className={cn("text-3xl font-black", color)}>{value}</p>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">{sub}</p>
        </div>
        <div className={cn("p-3 rounded-xl", bg)}>
          <Icon className={cn("h-5 w-5", color)} />
        </div>
      </CardContent>
    </Card>
  );
}

function Avatar({ children, className }: { children: React.ReactNode, className?: string }) {
  return <div className={cn("rounded-full overflow-hidden bg-slate-200 flex items-center justify-center", className)}>{children}</div>;
}

function AvatarImage({ src }: { src?: string }) {
  if (!src) return null;
  return <img src={src} alt="avatar" className="w-full h-full object-cover" />;
}

function AvatarFallback({ children, className }: { children: React.ReactNode, className?: string }) {
  return <span className={className}>{children}</span>;
}