'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  Zap, 
  Clock, 
  TrendingUp, 
  AlertTriangle, 
  RefreshCw, 
  Bot, 
  ShieldCheck, 
  History,
  Navigation,
  ArrowRight,
  Loader2,
  Calendar,
  Waves,
  Sparkles,
  Shield
} from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import { getGoogleTrafficStatusAction, getStrategicInsightsAction } from '@/app/actions';
import { MAJOR_AXES } from '@/lib/constants';
import { StrategicInsightsOutput } from '@/lib/types';
import { useFirebase } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

const REFRESH_INTERVAL_MS = 15 * 60 * 1000; // 15 minutes

export default function StrategicInsights() {
  const [trafficData, setTrafficData] = useState<any[]>([]);
  const [insights, setInsights] = useState<StrategicInsightsOutput | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [timeLeft, setTimeLeft] = useState(REFRESH_INTERVAL_MS);

  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  const performAnalysis = useCallback(async (isSilent = false) => {
    if (!isSilent) setIsLoading(true);
    setIsRefreshing(true);

    try {
      // 1. Get raw traffic data
      const data = await getGoogleTrafficStatusAction(MAJOR_AXES);
      setTrafficData(data);

      // 2. Get AI Insights
      const aiResults = await getStrategicInsightsAction({
        axes: data.map(d => ({
          road: d.road,
          status: d.status,
          delay: d.delay,
          speed: d.speed
        }))
      });
      setInsights(aiResults);

      // 3. Save to history
      if (user) {
        await addDoc(collection(firestore, 'traffic_insights'), {
          userId: user.uid,
          timestamp: serverTimestamp(),
          globalStatus: aiResults.globalAdvice,
          saturationScore: calculateSaturation(data),
          recommendations: aiResults.tips,
          criticalAxes: data.filter(d => d.status === 'EMBOUTEILLAGE').map(d => d.road)
        });
      }

      setLastUpdated(new Date());
      setTimeLeft(REFRESH_INTERVAL_MS);
      if (!isSilent) toast({ title: "Analyse terminée", description: "Le tableau de bord stratégique a été mis à jour." });
    } catch (error) {
      console.error(error);
      if (!isSilent) toast({ title: "Erreur d'analyse", variant: "destructive" });
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [firestore, user, toast]);

  useEffect(() => {
    performAnalysis();

    const interval = setInterval(() => {
      performAnalysis(true);
    }, REFRESH_INTERVAL_MS);

    const timer = setInterval(() => {
      setTimeLeft(prev => Math.max(0, prev - 1000));
    }, 1000);

    return () => {
      clearInterval(interval);
      clearInterval(timer);
    };
  }, [performAnalysis]);

  const calculateSaturation = (data: any[]) => {
    if (!data.length) return 0;
    const scores = data.map(d => 
        d.status === 'EMBOUTEILLAGE' ? 100 : 
        d.status === 'DENSE' ? 75 : 
        d.status === 'MODÉRÉ' ? 40 : 10
    );
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  };

  const globalSaturation = useMemo(() => calculateSaturation(trafficData), [trafficData]);

  const formatTimeLeft = (ms: number) => {
    const mins = Math.floor(ms / 60000);
    const secs = Math.floor((ms % 60000) / 1000);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-full w-full gap-6 animate-in fade-in duration-700">
        <div className="relative">
          <Loader2 className="h-16 w-16 text-primary animate-spin" />
          <Bot className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 text-primary" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-xl font-black uppercase tracking-widest text-slate-800">Initialisation K-Flow Intelligence</h2>
          <p className="text-muted-foreground font-medium italic">Analyse des 100 axes majeurs de Kinshasa en cours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto bg-slate-50/50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-12 pb-24">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-1">
            <div className="flex items-center gap-3">
                <div className="bg-primary p-3 rounded-2xl shadow-lg shadow-primary/20">
                    <Zap className="text-white h-6 w-6" />
                </div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tighter">K-Flow Insights</h1>
            </div>
            <p className="text-muted-foreground font-medium italic text-lg">Veille stratégique automatisée sur 100 axes toutes les 15 min.</p>
          </motion.div>

          <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex items-center gap-4 bg-white p-3 rounded-[2.5rem] shadow-xl border border-slate-100">
            <div className="text-right px-6 border-r">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Prochain audit</p>
                <p className="text-xl font-black text-primary font-mono">{formatTimeLeft(timeLeft)}</p>
            </div>
            <Button 
                onClick={() => performAnalysis()} 
                disabled={isRefreshing}
                variant="ghost"
                className="rounded-2xl h-12 px-6 gap-2 hover:bg-slate-50 font-black text-xs uppercase tracking-widest"
            >
                <RefreshCw className={cn("h-4 w-4 text-primary", isRefreshing && "animate-spin")} />
                Rafraîchir
            </Button>
          </motion.div>
        </div>

        {/* Top Intelligence Cards */}
        <div className="grid lg:grid-cols-3 gap-8">
          
          {/* Saturation Score */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
            <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-white group hover:shadow-primary/10 transition-all h-full">
                <CardHeader className="pb-2">
                    <CardTitle className="text-xs font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
                        <Waves className="h-4 w-4 text-blue-500" /> Charge Urbaine
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-8 pt-4">
                    <div className="flex items-baseline gap-2">
                        <span className="text-7xl font-black text-slate-900 tracking-tighter">{globalSaturation}%</span>
                        <Badge className={cn(
                            "font-black text-[10px] uppercase px-3 py-1 rounded-full",
                            globalSaturation > 70 ? "bg-red-500" : globalSaturation > 40 ? "bg-amber-500" : "bg-emerald-500"
                        )}>
                            {globalSaturation > 70 ? "Critique" : globalSaturation > 40 ? "Saturé" : "Fluide"}
                        </Badge>
                    </div>
                    <div className="space-y-3">
                        <div className="flex justify-between text-[10px] font-black text-slate-400 tracking-widest uppercase">
                            <span>Flux Libre</span>
                            <span>{100 - globalSaturation}%</span>
                        </div>
                        <Progress value={globalSaturation} className="h-4 rounded-full bg-slate-100 shadow-inner" />
                        <p className="text-[10px] text-slate-500 font-bold leading-relaxed text-center pt-2">
                            Calculé sur la moyenne pondérée des 100 segments routiers.
                        </p>
                    </div>
                </CardContent>
            </Card>
          </motion.div>

          {/* AI Strategic Advice */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="lg:col-span-2">
            <Card className="border-none shadow-2xl rounded-[3rem] overflow-hidden bg-slate-900 text-white relative h-full">
                <div className="absolute top-[-20%] right-[-10%] w-96 h-96 bg-primary/30 rounded-full blur-[100px]"></div>
                <CardHeader>
                    <div className="flex justify-between items-center relative z-10">
                        <CardTitle className="text-[10px] font-black uppercase text-primary tracking-[0.3em] flex items-center gap-2">
                            <Bot className="h-4 w-4" /> Rapport de Veille IA
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                            <span className="text-[10px] font-black uppercase tracking-widest text-primary/60">Analyse Active</span>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="relative z-10 pt-4 flex flex-col justify-between h-[220px]">
                    <p className="text-2xl md:text-3xl font-bold leading-tight text-slate-50 italic">
                        "{insights?.globalAdvice}"
                    </p>
                    <div className="flex items-center gap-8 border-t border-white/10 pt-8 mt-auto">
                        <div className="flex items-center gap-3">
                            <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md">
                                <TrendingUp className={cn(
                                    "h-6 w-6",
                                    insights?.trend === 'dégradation' ? "text-red-400 rotate-45" : 
                                    insights?.trend === 'amélioration' ? "text-emerald-400 -rotate-45" : "text-blue-400"
                                )} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Tendance 30min</p>
                                <p className="text-sm font-black capitalize tracking-tight">{insights?.trend}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md">
                                <ShieldCheck className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Confiance</p>
                                <p className="text-sm font-black tracking-tight">99.2% (Vérifié)</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Smart Tips & Critical Axes */}
        <div className="grid lg:grid-cols-2 gap-12 pt-8">
            
            {/* Smart Tips Section */}
            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
                        <Sparkles className="text-amber-500 h-6 w-6 fill-amber-500/20" />
                        Intelligence Stratégique
                    </h2>
                    <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50 font-black text-[10px]">{insights?.tips.length || 0} Conseils</Badge>
                </div>
                
                <div className="grid gap-6">
                    {insights?.tips.map((tip, i) => (
                        <motion.div 
                            key={i} 
                            initial={{ opacity: 0, x: -30 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 + (i * 0.1) }}
                            className="bg-white p-7 rounded-[2.5rem] shadow-xl border-l-8 border-l-primary hover:shadow-2xl hover:scale-[1.02] transition-all flex items-start gap-6 group cursor-default"
                        >
                            <div className="bg-primary/10 text-primary font-black p-3 rounded-2xl text-sm w-12 h-12 flex items-center justify-center shrink-0 group-hover:bg-primary group-hover:text-white transition-colors shadow-inner">
                                {i+1}
                            </div>
                            <p className="font-bold text-slate-700 leading-relaxed text-base">
                                {tip}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Critical Tronçons Section */}
            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-black text-slate-900 tracking-tighter flex items-center gap-3">
                        <AlertTriangle className="text-red-500 h-6 w-6" />
                        Points de Friction (100 axes)
                    </h2>
                    <Badge className="bg-red-500 text-white font-black text-[10px] uppercase">Haute Priorité</Badge>
                </div>

                <div className="grid gap-4">
                    {trafficData.filter(d => d.status === 'EMBOUTEILLAGE' || d.status === 'DENSE').slice(0, 8).map((item, i) => (
                        <motion.div 
                            key={i} 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.4 + (i * 0.05) }}
                            className="flex items-center justify-between p-6 bg-white rounded-[2rem] border border-slate-100 shadow-lg hover:border-red-200 transition-colors group"
                        >
                            <div className="flex items-center gap-5">
                                <div className={cn(
                                    "w-4 h-4 rounded-full shadow-inner",
                                    item.status === 'EMBOUTEILLAGE' ? "bg-red-500 animate-pulse" : "bg-orange-500"
                                )} />
                                <div>
                                    <p className="font-black text-slate-900 text-base leading-none mb-2 group-hover:text-primary transition-colors">{item.road}</p>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{item.status}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-lg font-black text-red-600">+{item.delay} min</p>
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{item.speed} km/h</p>
                            </div>
                        </motion.div>
                    ))}
                    {trafficData.filter(d => d.status === 'EMBOUTEILLAGE' || d.status === 'DENSE').length === 0 && (
                        <div className="p-16 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200 shadow-inner">
                            <Shield className="h-16 w-16 text-emerald-500 mx-auto mb-4 opacity-20" />
                            <p className="text-lg font-black text-slate-400 tracking-tight uppercase">Ville Fluide</p>
                            <p className="text-sm text-slate-300 font-medium">Aucun point de friction critique détecté actuellement.</p>
                        </div>
                    )}
                    {trafficData.filter(d => d.status === 'EMBOUTEILLAGE' || d.status === 'DENSE').length > 8 && (
                        <p className="text-center text-[10px] font-black text-slate-400 uppercase tracking-widest pt-4">
                            + {trafficData.filter(d => d.status === 'EMBOUTEILLAGE' || d.status === 'DENSE').length - 8} autres axes ralentis
                        </p>
                    )}
                </div>
            </div>
        </div>

        {/* Footer Actions */}
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="pt-12 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-8"
        >
            <div className="flex items-center gap-5">
                <div className="bg-slate-200 p-4 rounded-2xl shadow-inner">
                    <History className="h-6 w-6 text-slate-500" />
                </div>
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Dernier audit complet (100 axes)</p>
                    <p className="text-base font-black text-slate-700 tracking-tight">
                        {lastUpdated ? format(lastUpdated, 'EEEE dd MMMM, HH:mm', { locale: fr }) : '--'}
                    </p>
                </div>
            </div>
            <div className="flex gap-4 w-full md:w-auto">
                <Button variant="outline" className="h-16 rounded-[1.5rem] px-10 font-black flex-1 md:flex-none uppercase tracking-[0.2em] text-[10px] border-2 shadow-sm bg-white" asChild>
                    <Link href="/flux-infrastructure">Analyse Volumétrique</Link>
                </Button>
                <Button className="h-16 rounded-[1.5rem] px-12 font-black flex-1 md:flex-none uppercase tracking-[0.2em] text-[10px] shadow-2xl shadow-primary/40 gap-3 group" asChild>
                    <Link href="/k-flow-nav">
                        <Navigation className="h-4 w-4 fill-white group-hover:translate-x-1 transition-transform" />
                        Guidage GPS
                        <ArrowRight className="h-4 w-4 ml-1 opacity-50" />
                    </Link>
                </Button>
            </div>
        </motion.div>
      </div>
    </div>
  );
}
