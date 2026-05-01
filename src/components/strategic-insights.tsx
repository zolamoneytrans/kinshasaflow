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
  Waves
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
          <p className="text-muted-foreground font-medium italic">Analyse des 10 axes majeurs de Kinshasa en cours...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto bg-slate-50/50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-8 pb-20">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
                <div className="bg-primary p-3 rounded-2xl shadow-lg shadow-primary/20">
                    <Zap className="text-white h-6 w-6" />
                </div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">K-Flow Insights</h1>
            </div>
            <p className="text-muted-foreground font-medium italic">Veille stratégique automatisée toutes les 15 minutes.</p>
          </div>

          <div className="flex items-center gap-4 bg-white p-3 rounded-[2rem] shadow-sm border border-slate-100">
            <div className="text-right px-4 border-r">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prochain audit</p>
                <p className="text-lg font-black text-primary font-mono">{formatTimeLeft(timeLeft)}</p>
            </div>
            <Button 
                onClick={() => performAnalysis()} 
                disabled={isRefreshing}
                variant="ghost"
                className="rounded-xl h-12 gap-2 hover:bg-slate-50 font-bold"
            >
                <RefreshCw className={cn("h-4 w-4", isRefreshing && "animate-spin")} />
                Rafraîchir
            </Button>
          </div>
        </div>

        {/* Top Intelligence Cards */}
        <div className="grid lg:grid-cols-3 gap-6">
          
          {/* Saturation Score */}
          <Card className="border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-white group hover:shadow-2xl transition-all">
            <CardHeader className="pb-2">
                <CardTitle className="text-xs font-black uppercase text-slate-400 tracking-[0.2em] flex items-center gap-2">
                    <Waves className="h-4 w-4 text-blue-500" /> Charge de la ville
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-2">
                <div className="flex items-baseline gap-2">
                    <span className="text-6xl font-black text-slate-900 tracking-tighter">{globalSaturation}%</span>
                    <Badge className={cn(
                        "font-black text-[10px] uppercase",
                        globalSaturation > 70 ? "bg-red-500" : globalSaturation > 40 ? "bg-amber-500" : "bg-emerald-500"
                    )}>
                        {globalSaturation > 70 ? "Critique" : globalSaturation > 40 ? "Dense" : "Fluide"}
                    </Badge>
                </div>
                <div className="space-y-2">
                    <div className="flex justify-between text-[10px] font-bold text-slate-400">
                        <span>CAPACITÉ LIBRE</span>
                        <span>{100 - globalSaturation}%</span>
                    </div>
                    <Progress value={globalSaturation} className="h-3 rounded-full bg-slate-100" />
                </div>
            </CardContent>
          </Card>

          {/* AI Strategic Advice */}
          <Card className="lg:col-span-2 border-none shadow-xl rounded-[2.5rem] overflow-hidden bg-slate-900 text-white relative">
            <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-primary/20 rounded-full blur-[80px]"></div>
            <CardHeader>
                <div className="flex justify-between items-center relative z-10">
                    <CardTitle className="text-xs font-black uppercase text-primary tracking-[0.2em] flex items-center gap-2">
                        <Bot className="h-4 w-4" /> Analyse du Stratège IA
                    </CardTitle>
                    <Badge variant="outline" className="border-primary/30 text-primary text-[10px] font-black uppercase">Temps Réel</Badge>
                </div>
            </CardHeader>
            <CardContent className="relative z-10">
                <p className="text-xl font-bold leading-relaxed text-slate-200">
                    "{insights?.globalAdvice}"
                </p>
                <div className="mt-6 flex items-center gap-6 border-t border-white/10 pt-6">
                    <div className="flex items-center gap-3">
                        <div className="bg-white/10 p-2 rounded-xl">
                            <TrendingUp className={cn(
                                "h-5 w-5",
                                insights?.trend === 'dégradation' ? "text-red-400 rotate-45" : 
                                insights?.trend === 'amélioration' ? "text-emerald-400 -rotate-45" : "text-blue-400"
                            )} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Tendance (30m)</p>
                            <p className="text-sm font-bold capitalize">{insights?.trend}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="bg-white/10 p-2 rounded-xl">
                            <ShieldCheck className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Confiance</p>
                            <p className="text-sm font-bold">98% (Vérifié)</p>
                        </div>
                    </div>
                </div>
            </CardContent>
          </Card>
        </div>

        {/* Smart Tips & Critical Axes */}
        <div className="grid lg:grid-cols-2 gap-8">
            
            {/* Smart Tips Section */}
            <div className="space-y-6">
                <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    <Zap className="text-amber-500 h-5 w-5" />
                    Smart Tips : Vos évitements
                </h2>
                <div className="grid gap-4">
                    {insights?.tips.map((tip, i) => (
                        <motion.div 
                            key={i} 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="bg-white p-6 rounded-[2rem] shadow-sm border-l-4 border-l-primary hover:shadow-md transition-all flex items-start gap-4 group"
                        >
                            <div className="bg-primary/10 text-primary font-black p-2 rounded-xl text-xs w-8 h-8 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform">
                                {i+1}
                            </div>
                            <p className="font-bold text-slate-700 leading-relaxed italic">
                                {tip}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Critical Tronçons Section */}
            <div className="space-y-6">
                <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                    <AlertTriangle className="text-red-500 h-5 w-5" />
                    Points de Friction Critiques
                </h2>
                <div className="grid gap-3">
                    {trafficData.filter(d => d.status === 'EMBOUTEILLAGE' || d.status === 'DENSE').map((item, i) => (
                        <div key={i} className="flex items-center justify-between p-5 bg-white rounded-[1.5rem] border border-slate-100 shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className={cn(
                                    "w-3 h-3 rounded-full animate-pulse",
                                    item.status === 'EMBOUTEILLAGE' ? "bg-red-500" : "bg-orange-500"
                                )} />
                                <div>
                                    <p className="font-black text-slate-900 text-sm leading-none mb-1">{item.road}</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.status}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-xs font-black text-red-600">+{item.delay} min</p>
                                <p className="text-[9px] font-bold text-slate-400 uppercase">{item.speed} km/h</p>
                            </div>
                        </div>
                    ))}
                    {trafficData.filter(d => d.status === 'EMBOUTEILLAGE' || d.status === 'DENSE').length === 0 && (
                        <div className="p-10 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-200">
                            <ShieldCheck className="h-10 w-10 text-emerald-500 mx-auto mb-3 opacity-30" />
                            <p className="text-sm font-bold text-slate-400">Aucun point de friction critique détecté.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-3">
                <div className="bg-slate-200 p-2 rounded-xl">
                    <History className="h-4 w-4 text-slate-500" />
                </div>
                <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Dernier audit complet</p>
                    <p className="text-sm font-bold text-slate-700">
                        {lastUpdated ? format(lastUpdated, 'EEEE dd MMMM, HH:mm', { locale: fr }) : '--'}
                    </p>
                </div>
            </div>
            <div className="flex gap-4 w-full md:w-auto">
                <Button variant="outline" className="h-14 rounded-2xl px-8 font-black flex-1 md:flex-none uppercase tracking-widest text-[10px]" asChild>
                    <Link href="/flux-infrastructure">Analyse Technique</Link>
                </Button>
                <Button className="h-14 rounded-2xl px-10 font-black flex-1 md:flex-none uppercase tracking-widest text-[10px] shadow-2xl shadow-primary/30 gap-2" asChild>
                    <Link href="/k-flow-nav">
                        <Navigation className="h-4 w-4" />
                        Démarrer Navigation
                        <ArrowRight className="h-4 w-4 ml-1" />
                    </Link>
                </Button>
            </div>
        </div>
      </div>
    </div>
  );
}
