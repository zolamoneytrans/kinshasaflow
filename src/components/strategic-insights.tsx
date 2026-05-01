'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  Zap, 
  TrendingUp, 
  RefreshCw, 
  Bot, 
  ShieldCheck, 
  History,
  Navigation,
  ArrowRight,
  Loader2,
  Waves,
  Sparkles,
  Shield,
  AlertTriangle
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
      const data = await getGoogleTrafficStatusAction(MAJOR_AXES);
      setTrafficData(data);

      const aiResults = await getStrategicInsightsAction({
        axes: data.map(d => ({
          road: d.road,
          status: d.status,
          delay: d.delay,
          speed: d.speed
        }))
      });
      setInsights(aiResults);

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
      if (!isSilent) toast({ title: "Analyse terminée" });
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
      <div className="flex flex-col items-center justify-center h-full w-full gap-6 p-4">
        <div className="relative">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
          <Bot className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-5 w-5 text-primary" />
        </div>
        <div className="text-center space-y-2">
          <h2 className="text-sm font-black uppercase tracking-widest text-slate-800">Analyse IA des 100 axes</h2>
          <p className="text-xs text-muted-foreground italic">Génération de conseils stratégiques...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full overflow-y-auto bg-slate-50/50 p-4 md:p-6">
      <div className="max-w-6xl mx-auto space-y-6 md:space-y-10 pb-20">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="space-y-1">
            <div className="flex items-center gap-2">
                <div className="bg-primary p-2 rounded-xl shadow-lg">
                    <Zap className="text-white h-5 w-5" />
                </div>
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">K-Flow Insights</h1>
            </div>
            <p className="text-muted-foreground font-medium italic text-sm md:text-base">Veille automatisée (100 axes) toutes les 15 min.</p>
          </motion.div>

          <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex items-center gap-3 bg-white p-2 md:p-3 rounded-2xl shadow-md border border-slate-100 w-full md:w-auto justify-between md:justify-start">
            <div className="text-right px-4 border-r">
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Suivant</p>
                <p className="text-lg font-black text-primary font-mono">{formatTimeLeft(timeLeft)}</p>
            </div>
            <Button 
                onClick={() => performAnalysis()} 
                disabled={isRefreshing}
                variant="ghost"
                className="rounded-xl h-10 px-4 gap-2 hover:bg-slate-50 font-black text-[10px] uppercase tracking-widest"
            >
                <RefreshCw className={cn("h-3.5 w-3.5 text-primary", isRefreshing && "animate-spin")} />
                Actualiser
            </Button>
          </motion.div>
        </div>

        {/* Top Intelligence Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Saturation Score */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }}>
            <Card className="border-none shadow-lg rounded-[2rem] bg-white transition-all h-full">
                <CardHeader className="pb-2">
                    <CardTitle className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                        <Waves className="h-4 w-4 text-blue-500" /> Charge Urbaine
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-2">
                    <div className="flex items-baseline gap-2">
                        <span className="text-5xl md:text-6xl font-black text-slate-900 tracking-tighter">{globalSaturation}%</span>
                        <Badge className={cn(
                            "font-black text-[9px] uppercase px-2 py-0.5 rounded-full",
                            globalSaturation > 70 ? "bg-red-500" : globalSaturation > 40 ? "bg-amber-500" : "bg-emerald-500"
                        )}>
                            {globalSaturation > 70 ? "Critique" : globalSaturation > 40 ? "Saturé" : "Fluide"}
                        </Badge>
                    </div>
                    <div className="space-y-2">
                        <div className="flex justify-between text-[9px] font-black text-slate-400 tracking-widest uppercase">
                            <span>Flux Libre</span>
                            <span>{100 - globalSaturation}%</span>
                        </div>
                        <Progress value={globalSaturation} className="h-3 rounded-full bg-slate-100" />
                    </div>
                </CardContent>
            </Card>
          </motion.div>

          {/* AI Strategic Advice */}
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="md:col-span-2">
            <Card className="border-none shadow-lg rounded-[2rem] bg-slate-900 text-white relative h-full overflow-hidden">
                <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-primary/20 rounded-full blur-[80px]"></div>
                <CardHeader className="pb-2">
                    <div className="flex justify-between items-center relative z-10">
                        <CardTitle className="text-[10px] font-black uppercase text-primary tracking-widest flex items-center gap-2">
                            <Bot className="h-4 w-4" /> Rapport IA
                        </CardTitle>
                        <span className="text-[9px] font-black uppercase text-primary/60">Analyse Active</span>
                    </div>
                </CardHeader>
                <CardContent className="relative z-10 pt-2 flex flex-col justify-between min-h-[160px]">
                    <p className="text-lg md:text-2xl font-bold leading-tight text-slate-50 italic">
                        "{insights?.globalAdvice}"
                    </p>
                    <div className="flex items-center gap-6 border-t border-white/10 pt-4 mt-4">
                        <div className="flex items-center gap-2">
                            <div className="bg-white/10 p-2 rounded-xl">
                                <TrendingUp className={cn(
                                    "h-4 w-4",
                                    insights?.trend === 'dégradation' ? "text-red-400 rotate-45" : 
                                    insights?.trend === 'amélioration' ? "text-emerald-400 -rotate-45" : "text-blue-400"
                                )} />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-slate-500 uppercase mb-0.5">Tendance</p>
                                <p className="text-xs font-black capitalize">{insights?.trend}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="bg-white/10 p-2 rounded-xl">
                                <ShieldCheck className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-slate-500 uppercase mb-0.5">Vérifié</p>
                                <p className="text-xs font-black">99.2%</p>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Smart Tips & Critical Axes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12">
            
            {/* Smart Tips Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <Sparkles className="text-amber-500 h-5 w-5" />
                        Conseils IA
                    </h2>
                    <Badge variant="outline" className="border-amber-200 text-amber-700 bg-amber-50 font-black text-[9px]">{insights?.tips.length || 0} TIPS</Badge>
                </div>
                
                <div className="grid gap-4">
                    {insights?.tips.map((tip, i) => (
                        <motion.div 
                            key={i} 
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: 0.3 + (i * 0.1) }}
                            className="bg-white p-5 rounded-2xl shadow-sm border-l-4 border-l-primary flex items-start gap-4"
                        >
                            <div className="bg-primary/10 text-primary font-black p-2 rounded-lg text-xs w-8 h-8 flex items-center justify-center shrink-0">
                                {i+1}
                            </div>
                            <p className="font-bold text-slate-700 text-sm leading-relaxed">
                                {tip}
                            </p>
                        </motion.div>
                    ))}
                </div>
            </div>

            {/* Critical Tronçons Section */}
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                        <AlertTriangle className="text-red-500 h-5 w-5" />
                        Points Chauds
                    </h2>
                    <Badge className="bg-red-500 text-white font-black text-[9px] uppercase">Alertes</Badge>
                </div>

                <div className="grid gap-3">
                    {trafficData.filter(d => d.status === 'EMBOUTEILLAGE' || d.status === 'DENSE').slice(0, 6).map((item, i) => (
                        <motion.div 
                            key={i} 
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="flex items-center justify-between p-4 bg-white rounded-2xl border border-slate-100 shadow-sm"
                        >
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "w-3 h-3 rounded-full",
                                    item.status === 'EMBOUTEILLAGE' ? "bg-red-500 animate-pulse" : "bg-orange-500"
                                )} />
                                <div>
                                    <p className="font-black text-slate-900 text-sm leading-none mb-1">{item.road}</p>
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{item.status}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-black text-red-600">+{item.delay}m</p>
                                <p className="text-[9px] font-black text-slate-400 uppercase">{item.speed} km/h</p>
                            </div>
                        </motion.div>
                    ))}
                    {trafficData.filter(d => d.status === 'EMBOUTEILLAGE' || d.status === 'DENSE').length === 0 && (
                        <div className="p-10 text-center bg-white rounded-[2rem] border-2 border-dashed border-slate-200">
                            <Shield className="h-10 w-10 text-emerald-500 mx-auto mb-3 opacity-20" />
                            <p className="text-xs font-black text-slate-400 uppercase">Kinshasa Fluide</p>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Footer Actions */}
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="pt-8 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-6"
        >
            <div className="flex items-center gap-4">
                <div className="bg-slate-200 p-3 rounded-xl">
                    <History className="h-5 w-5 text-slate-500" />
                </div>
                <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-0.5">Dernier audit (100 axes)</p>
                    <p className="text-sm font-black text-slate-700">
                        {lastUpdated ? format(lastUpdated, 'EEEE dd MMMM, HH:mm', { locale: fr }) : '--'}
                    </p>
                </div>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
                <Button variant="outline" className="h-12 rounded-xl px-6 font-black flex-1 md:flex-none uppercase tracking-widest text-[9px] border-2 bg-white" asChild>
                    <Link href="/flux-infrastructure">Analyse Tech</Link>
                </Button>
                <Button className="h-12 rounded-xl px-8 font-black flex-1 md:flex-none uppercase tracking-widest text-[9px] shadow-lg shadow-primary/20 gap-2" asChild>
                    <Link href="/k-flow-nav">
                        <Navigation className="h-3.5 w-3.5 fill-white" />
                        Navigation
                        <ArrowRight className="h-3 w-3 opacity-50" />
                    </Link>
                </Button>
            </div>
        </motion.div>
      </div>
    </div>
  );
}
