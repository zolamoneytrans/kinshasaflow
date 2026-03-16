
'use client';

import React, { useState, useEffect } from 'react';
import { TrafficReport, dummyReports, STAR_COSTS, UserProfile } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, Activity, Star, Lock, Loader2, ExternalLink } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Button } from './ui/button';
import { useFirebase, useUser, useDoc, useMemoFirebase } from '@/firebase';
import { doc, runTransaction, serverTimestamp, collection } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

type LiveReport = TrafficReport & { id: number; time: string; verified?: boolean };

const MAX_LIVE_REPORTS = 15;
const UPDATE_INTERVAL = 15 * 60 * 1000;

const SeverityBadge = ({ severity }: { severity: TrafficReport['severity'] }) => {
    const severityMap = {
        low: { variant: 'success', text: 'Faible' },
        medium: { variant: 'secondary', text: 'Moyen' },
        high: { variant: 'destructive', text: 'Élevé' },
    } as const;
    const { variant, text } = severityMap[severity];
    return <Badge variant={variant} className="font-bold">{text}</Badge>;
}

const LiveReportItem = ({ report, onVerify, isVerifying }: { report: LiveReport, onVerify: (id: number) => void, isVerifying: boolean }) => {
    const { user } = useUser();
    
    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 rounded-2xl border bg-white shadow-sm hover:shadow-md transition-all group"
        >
            <div className="flex justify-between items-start mb-3">
                <div className="flex flex-col">
                    <h3 className="font-black text-slate-800 text-base">{report.location}</h3>
                    <div className="flex items-center text-[10px] text-slate-400 font-bold uppercase mt-1">
                        <Clock className="w-3 h-3 mr-1" />
                        <span>{report.time}</span>
                    </div>
                </div>
                <SeverityBadge severity={report.severity} />
            </div>
            
            <div className="relative">
                <p className={cn(
                    "text-sm text-slate-600 leading-relaxed mb-4",
                    !report.verified && "blur-[3px] select-none pointer-events-none"
                )}>
                    {report.description}
                </p>
                
                {!report.verified && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <Button 
                            variant="outline" 
                            size="sm" 
                            className="bg-white/90 backdrop-blur-sm border-amber-200 text-amber-700 font-black h-9 px-4 rounded-full shadow-lg"
                            onClick={() => onVerify(report.id)}
                            disabled={isVerifying}
                        >
                            {isVerifying ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Star className="h-3 w-3 mr-2 fill-amber-500 text-amber-500" />}
                            Vérifier segment ({STAR_COSTS.ROAD_VERIFY} ⭐)
                        </Button>
                    </div>
                )}
            </div>

            {report.verified && (
                <div className="flex items-center gap-2 pt-3 border-t border-slate-50 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                    <Activity className="h-3 w-3" />
                    Segment vérifié
                </div>
            )}
        </motion.div>
    );
};

let reportIdCounter = 100;

import { cn } from '@/lib/utils';

export default function LiveTrafficFeed() {
  const [liveReports, setLiveReports] = useState<LiveReport[]>([]);
  const [verifyingId, setVerifyingId] = useState<number | null>(null);

  const { user, firestore } = useFirebase();
  const { toast } = useToast();
  const userRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile } = useDoc<UserProfile>(userRef);

  useEffect(() => {
    const initialData = dummyReports
      .slice(0, 5)
      .map((r, i) => ({ ...r, id: reportIdCounter++, time: `il y a ${5 + i*2}m`, verified: false }))
      .reverse();
    setLiveReports(initialData);

    const interval = setInterval(() => {
      setLiveReports(prevReports => {
        const randomReport = dummyReports[Math.floor(Math.random() * dummyReports.length)];
        const newReport: LiveReport = {
          ...randomReport,
          id: reportIdCounter++,
          time: "à l'instant",
          verified: false
        };
        const updatedReports = [newReport, ...prevReports.slice(0, MAX_LIVE_REPORTS - 1)];
        return updatedReports;
      });
    }, UPDATE_INTERVAL);

    return () => clearInterval(interval);
  }, []);

  const handleVerify = async (id: number) => {
    if (!user || !profile) return;

    if (profile.currentStarsBalance < STAR_COSTS.ROAD_VERIFY) {
        toast({
            title: "Solde insuffisant",
            description: `Vérifier un segment coûte ${STAR_COSTS.ROAD_VERIFY} star.`,
            variant: "destructive",
            action: <Button asChild variant="outline" size="sm"><Link href="/mes-stars">Recharger</Link></Button>
        });
        return;
    }

    setVerifyingId(id);
    try {
        await runTransaction(firestore, async (transaction) => {
            const userDoc = await transaction.get(userRef!);
            const data = userDoc.data() as UserProfile;
            const newBalance = data.currentStarsBalance - STAR_COSTS.ROAD_VERIFY;
            
            transaction.update(userRef!, {
                currentStarsBalance: newBalance,
                totalStarsUsed: (data.totalStarsUsed || 0) + STAR_COSTS.ROAD_VERIFY
            });

            const starTransRef = doc(collection(userRef!, 'star_transactions'));
            transaction.set(starTransRef, {
                userId: user.uid,
                type: 'spent',
                starsChange: -STAR_COSTS.ROAD_VERIFY,
                balanceAfterTransaction: newBalance,
                description: `Vérification segment #${id}`,
                timestamp: serverTimestamp(),
            });
        });

        setLiveReports(prev => prev.map(r => r.id === id ? { ...r, verified: true } : r));
        toast({ title: "Segment vérifié", description: "Les détails de l'incident sont maintenant visibles." });
    } catch (error) {
        toast({ title: "Erreur", description: "Impossible de déduire les stars.", variant: "destructive" });
    } finally {
        setVerifyingId(null);
    }
  };

  return (
    <Card className="flex-1 flex flex-col overflow-hidden border-none shadow-none bg-transparent">
        <CardHeader className="px-0 pb-6">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-red-500 p-2 rounded-xl shadow-lg shadow-red-200">
                <Activity className="text-white h-5 w-5 animate-pulse" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight leading-none">Flux en direct</h2>
                <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Données communautaires</p>
              </div>
            </div>
            <Badge variant="outline" className="border-slate-200 bg-white text-slate-500 font-bold">
                {liveReports.length} rapports
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto px-0 pr-4">
          <div className="space-y-4 pb-10">
            <AnimatePresence mode="popLayout">
                {liveReports.map((report) => (
                    <LiveReportItem 
                        key={report.id} 
                        report={report} 
                        onVerify={handleVerify}
                        isVerifying={verifyingId === report.id}
                    />
                ))}
            </AnimatePresence>
          </div>
        </CardContent>
    </Card>
  );
}
