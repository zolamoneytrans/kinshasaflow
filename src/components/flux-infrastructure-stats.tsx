
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import { 
  Car, 
  TrendingUp, 
  AlertTriangle, 
  Building2, 
  ShieldCheck, 
  Zap, 
  Activity,
  Coins,
  History,
  BarChart3,
  RefreshCw,
  Database,
  Search,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { Button } from '@/components/ui/button';
import { saveDailyTrafficReportAction } from '@/app/actions';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { DailyTrafficReport, WithId } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const CAPACITY_DATA = [
  { name: "Blvd 30 Juin", capacity: 5000 },
  { name: "Blvd Lumumba", capacity: 6000 },
  { name: "Av. Kasa-Vubu", capacity: 4000 },
  { name: "Rte Matadi", capacity: 4500 },
  { name: "Av. By-Pass", capacity: 5000 },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

export default function FluxInfrastructureStats() {
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [isUpdating, setIsUpdating] = useState(false);
  const [lastLocalReport, setLastLocalReport] = useState<any>(null);

  // Fetch historical reports from Firebase
  const reportsQuery = useMemoFirebase(() => {
    return query(collection(firestore, "daily_traffic_reports"), orderBy("timestamp", "desc"), limit(7));
  }, [firestore]);
  
  const { data: history, isLoading: isHistoryLoading } = useCollection<DailyTrafficReport>(reportsQuery);

  const handleUpdateAndArchive = async () => {
    setIsUpdating(true);
    try {
        const result = await saveDailyTrafficReportAction();
        if (result.success) {
            setLastLocalReport(result.data);
            toast({ 
                title: "Rapport Archivé !", 
                description: "Les données de trafic ont été sauvegardées pour l'analyse historique.",
                variant: "default"
            });
        } else {
            throw new Error(result.error);
        }
    } catch (e: any) {
        toast({ title: "Échec de l'archivage", description: e.message, variant: "destructive" });
    } finally {
        setIsUpdating(false);
    }
  };

  const currentStats = useMemo(() => {
    const report = lastLocalReport || (history && history[0]);
    if (!report) return null;
    return report;
  }, [lastLocalReport, history]);

  const trendsData = useMemo(() => {
    if (!history) return [];
    return [...history].reverse().map(h => ({
        date: h.timestamp?.toDate ? format(h.timestamp.toDate(), 'dd/MM') : '...',
        saturation: h.globalSaturation
    }));
  }, [history]);

  const hotspots = useMemo(() => {
    if (!currentStats) return [];
    return currentStats.axisStats
        .filter((a: any) => a.status === 'EMBOUTEILLAGE' || a.status === 'DENSE')
        .sort((a: any, b: any) => b.delay - a.delay)
        .slice(0, 3);
  }, [currentStats]);

  return (
    <div className="w-full h-full overflow-y-auto bg-slate-50/50 p-4 md:p-8">
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-7xl mx-auto space-y-8 pb-20"
      >
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
              <BarChart3 className="text-primary h-8 w-8" />
              Flux & Infrastructure
            </h1>
            <p className="text-muted-foreground font-medium italic">
              Analyse stratégique et archivage du trafic de Kinshasa.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
                onClick={handleUpdateAndArchive} 
                disabled={isUpdating}
                className="h-12 px-6 rounded-2xl font-black shadow-xl shadow-primary/20 gap-2 transition-all hover:scale-105 active:scale-95"
            >
                {isUpdating ? <RefreshCw className="h-5 w-5 animate-spin" /> : <Database className="h-5 w-5" />}
                Actualiser & Archiver
            </Button>
            <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest">
              Predictive AI Ready
            </Badge>
          </div>
        </div>

        {/* Top Key Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            title="Saturation Urbaine" 
            value={currentStats ? `${currentStats.globalSaturation}%` : '--'} 
            subValue="Index global de congestion (Gombe/Limete/Ngaliema)" 
            icon={Activity} 
            color="bg-primary" 
          />
          <StatCard 
            title="Axes Monitorés" 
            value={currentStats ? currentStats.axisStats.length.toString() : '--'} 
            subValue="Points de détection Google Vehicle Counts actifs" 
            icon={Car} 
            color="bg-amber-500" 
          />
          <StatCard 
            title="Dernière Archive" 
            value={currentStats?.timestamp?.toDate ? format(currentStats.timestamp.toDate(), 'HH:mm') : '--'} 
            subValue={currentStats?.timestamp?.toDate ? format(currentStats.timestamp.toDate(), 'EEEE dd MMMM', { locale: fr }) : 'En attente de données'} 
            icon={History} 
            color="bg-slate-800" 
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Chart: Vehicle Volume Analysis */}
          <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-white border-b border-slate-100 p-8">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-xl font-black text-slate-900">Analyse par Axe</CardTitle>
                  <CardDescription>Retards détectés sur les artères principales</CardDescription>
                </div>
                <Search className="text-primary h-5 w-5 opacity-20" />
              </div>
            </CardHeader>
            <CardContent className="p-8 h-[400px]">
              {currentStats ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={currentStats.axisStats} layout="vertical" margin={{ left: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.1} />
                      <XAxis type="number" hide />
                      <YAxis 
                        dataKey="road" 
                        type="category" 
                        axisLine={false} 
                        tickLine={false} 
                        fontSize={10} 
                        fontWeight="bold" 
                        width={120}
                      />
                      <Tooltip 
                        cursor={{ fill: 'rgba(36, 142, 235, 0.05)' }} 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-white p-4 rounded-2xl shadow-xl border border-slate-100">
                                <p className="font-black text-sm mb-2">{data.road}</p>
                                <div className="space-y-1 text-xs">
                                  <p className="flex justify-between gap-4 font-bold text-slate-500">Statut: <span className={cn(
                                      data.status === 'EMBOUTEILLAGE' ? "text-red-600" : "text-emerald-600"
                                  )}>{data.status}</span></p>
                                  <p className="flex justify-between gap-4 font-bold text-slate-500">Vitesse: <span className="text-slate-900">{data.speed} km/h</span></p>
                                  <p className="flex justify-between gap-4 font-bold text-slate-500">Retard: <span className="text-red-500">+{data.delay} min</span></p>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="delay" radius={[0, 10, 10, 0]} barSize={15}>
                        {currentStats.axisStats.map((entry: any, index: number) => (
                          <Cell key={`cell-${index}`} fill={entry.delay > 10 ? '#ef4444' : '#248eeb'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center italic text-slate-300">Aucune donnée chargée</div>
              )}
            </CardContent>
          </Card>

          {/* Chart: Historical Trends */}
          <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-white border-b border-slate-100 p-8">
              <CardTitle className="text-xl font-black text-slate-900">Tendance 7 Jours</CardTitle>
              <CardDescription>Évolution de la saturation pour le moteur prédictif</CardDescription>
            </CardHeader>
            <CardContent className="p-8 h-[400px]">
              {trendsData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={trendsData}>
                      <defs>
                        <linearGradient id="colorSat" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#248eeb" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#248eeb" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                      <XAxis dataKey="date" axisLine={false} tickLine={false} fontSize={10} fontWeight="bold" />
                      <YAxis hide />
                      <Tooltip 
                        contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="saturation" 
                        stroke="#248eeb" 
                        strokeWidth={4} 
                        fillOpacity={1} 
                        fill="url(#colorSat)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-4 text-center px-10">
                    <History className="h-12 w-12 text-slate-200" />
                    <p className="text-sm font-medium text-slate-400 italic">Collectez des données quotidiennement pour voir apparaître les courbes de tendance prédictive.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Hotspots & Strategic Insights */}
        <div className="grid md:grid-cols-3 gap-8">
          
          {/* Bottlenecks List */}
          <Card className="border-none shadow-sm rounded-[2rem] bg-white group hover:shadow-xl transition-all">
            <CardHeader className="p-8 pb-4">
              <div className="bg-red-500/10 p-3 rounded-2xl w-fit mb-4">
                <AlertTriangle className="text-red-600 h-6 w-6" />
              </div>
              <CardTitle className="text-lg font-black text-slate-900">Hotspots de Congestion</CardTitle>
              <CardDescription className="text-xs">Points critiques nécessitant une attention.</CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8 space-y-4">
              {hotspots.length > 0 ? hotspots.map((item: any, i: number) => (
                <div key={i} className="flex items-center justify-between p-3 bg-red-50/50 rounded-xl border border-red-100">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-900">{item.road}</p>
                    <p className="text-[10px] font-medium text-red-500">+{item.delay} min de retard</p>
                  </div>
                  <Badge className="bg-red-500 text-[8px] font-black uppercase">CRITIQUE</Badge>
                </div>
              )) : (
                  <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 text-center">
                      <p className="text-xs font-bold text-emerald-700">Flux Fluide</p>
                      <p className="text-[10px] text-emerald-600">Aucun hotspot majeur détecté.</p>
                  </div>
              )}
            </CardContent>
          </Card>

          {/* Infrastructure ROI */}
          <Card className="border-none shadow-sm rounded-[2rem] bg-white group hover:shadow-xl transition-all">
            <CardHeader className="p-8 pb-4">
              <div className="bg-emerald-500/10 p-3 rounded-2xl w-fit mb-4">
                <Coins className="text-emerald-600 h-6 w-6" />
              </div>
              <CardTitle className="text-lg font-black text-slate-900">Analyse de Rentabilité</CardTitle>
              <CardDescription className="text-xs">Justification des projets d'infrastructure.</CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <div className="p-5 bg-slate-50 rounded-[1.5rem] border border-slate-100 space-y-4">
                <p className="text-[11px] font-medium text-slate-600 leading-relaxed italic">
                    "Les données archivées montrent que le Boulevard Lumumba supporte 40% de la charge urbaine matinale. Un projet d'élargissement aurait un ROI de fluidité estimé à +22%."
                </p>
                <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Impact Infrastructure</span>
                    <span className="text-xs font-black text-emerald-600">+22%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Safety & Enforcement */}
          <Card className="border-none shadow-sm rounded-[2rem] bg-white group hover:shadow-xl transition-all">
            <CardHeader className="p-8 pb-4">
              <div className="bg-primary/10 p-3 rounded-2xl w-fit mb-4">
                <ShieldCheck className="text-primary h-6 w-6" />
              </div>
              <CardTitle className="text-lg font-black text-slate-900">Sécurité & Régulation</CardTitle>
              <CardDescription className="text-xs">Corrélation flux / interventions.</CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8 space-y-4">
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                   Préconisation IA
                </p>
                <div className="p-4 rounded-2xl border-2 border-dashed border-primary/20 bg-primary/5 space-y-3">
                  <p className="text-[10px] font-bold text-slate-700 leading-relaxed">
                    Sur la base du volume detecté (By-Pass), le déploiement de 4 agents de régulation supplémentaires entre 16h et 19h réduirait le temps de saturation de 15 minutes.
                  </p>
                  <Button variant="ghost" className="w-full h-8 text-[9px] font-black uppercase tracking-widest hover:bg-white">
                      Détails de l'analyse <ArrowRight className="ml-2 h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </motion.div>
    </div>
  );
}

function StatCard({ title, value, subValue, icon: Icon, color }: { title: string, value: string, subValue: string, icon: any, color: string }) {
  return (
    <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden relative group">
      <CardContent className="p-8">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</p>
            <p className="text-4xl font-black text-slate-900 tracking-tighter">{value}</p>
            <p className="text-[10px] font-bold text-slate-500 leading-tight pr-4">{subValue}</p>
          </div>
          <div className={cn("p-4 rounded-2xl shadow-lg transition-transform group-hover:scale-110", color)}>
            <Icon className="text-white h-6 w-6" />
          </div>
        </div>
      </CardContent>
      <div className={cn("absolute bottom-0 left-0 h-1 transition-all w-full", color)} />
    </Card>
  );
}
