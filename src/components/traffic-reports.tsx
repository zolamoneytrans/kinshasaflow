'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCw, 
  Search, 
  Clock, 
  Star,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getGoogleTrafficStatusAction } from '@/app/actions';
import { useCollection, useFirebase, useMemoFirebase, useDoc } from '@/firebase';
import { collection, query, orderBy, limit, doc } from 'firebase/firestore';
import { EventReport, UserProfile } from '@/lib/types';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

type TrafficStatus = 'EMBOUTEILLAGE' | 'DENSE' | 'MODÉRÉ' | 'FLUIDE' | 'INCONNU';

interface Incident {
  id: string;
  road: string;
  description: string;
  district: string;
  status: TrafficStatus;
  speed: number;
  delay: number;
  updatedAt: string;
  source: 'gps' | 'user';
  coords?: { lat: number, lng: number };
}

const MAJOR_AXES = [
  { name: "Boulevard du 30 Juin", district: "Gombe", origin: { lat: -4.3050, lng: 15.3136 }, destination: { lat: -4.3176, lng: 15.2950 } },
  { name: "Échangeur de Limete", district: "Limete", origin: { lat: -4.3380, lng: 15.3620 }, destination: { lat: -4.3600, lng: 15.3850 } },
  { name: "Boulevard Lumumba (Est)", district: "Limete/Masina", origin: { lat: -4.360, lng: 15.365 }, destination: { lat: -4.400, lng: 15.440 } },
  { name: "Boulevard Lumumba (N'djili)", district: "N'djili/Masina", origin: { lat: -4.400, lng: 15.440 }, destination: { lat: -4.430, lng: 15.500 } },
  { name: "Avenue Kasa-Vubu", district: "Kalamu/Gombe", origin: { lat: -4.310, lng: 15.310 }, destination: { lat: -4.355, lng: 15.315 } },
  { name: "Route de Matadi (N1)", district: "Ngaliema", origin: { lat: -4.328, lng: 15.275 }, destination: { lat: -4.385, lng: 15.265 } },
  { name: "Avenue By-Pass", district: "Lemba/Ngaba", origin: { lat: -4.455, lng: 15.335 }, destination: { lat: -4.410, lng: 15.315 } },
  { name: "Route Mokali", district: "Kimbanseke/Masina", origin: { lat: -4.415, lng: 15.412 }, destination: { lat: -4.385, lng: 15.365 } },
  { name: "Avenue Mondjiba", district: "Ngaliema", origin: { lat: -4.315, lng: 15.285 }, destination: { lat: -4.350, lng: 15.260 } },
  { name: "Avenue Nguma", district: "Ngaliema", origin: { lat: -4.328, lng: 15.275 }, destination: { lat: -4.355, lng: 15.265 } },
];

export default function TrafficReports() {
  const [navIncidents, setNavIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<TrafficStatus | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const { firestore, user } = useFirebase();
  const { toast } = useToast();

  const userRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile } = useDoc<UserProfile>(userRef);

  const userReportsQuery = useMemoFirebase(() => {
    return query(collection(firestore, 'events'), orderBy('createdAt', 'desc'), limit(30));
  }, [firestore]);
  
  const { data: userReports } = useCollection<EventReport>(userReportsQuery);

  const fetchTrafficData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setIsRefreshing(true);
    if (!isRefresh) setLoading(true);
    
    try {
      const data = await getGoogleTrafficStatusAction(MAJOR_AXES);
      setLastUpdated(new Date());
      
      const analyzedAxes: Incident[] = data.map((res, idx) => {
        const axis = MAJOR_AXES[idx];
        return {
          id: `google-${idx}`,
          road: res.road,
          description: res.status === "FLUIDE" ? "Circulation fluide" : `Retard estimé de ${res.delay} min`,
          district: axis.district,
          status: res.status as TrafficStatus,
          speed: res.speed,
          delay: res.delay,
          updatedAt: "GPS Live",
          source: 'gps',
          coords: axis.origin
        };
      });

      setNavIncidents(analyzedAxes);
    } catch (err) {
      console.error("Traffic API Error:", err);
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => { fetchTrafficData(); }, [fetchTrafficData]);

  const allIncidents = useMemo(() => {
    const formattedUserReports: Incident[] = (userReports || []).map(rep => ({
        id: rep.id,
        road: rep.location,
        description: rep.description,
        district: "Citoyen",
        status: rep.severity === 'high' ? 'EMBOUTEILLAGE' : rep.severity === 'medium' ? 'DENSE' : 'MODÉRÉ',
        speed: 0, delay: 0, updatedAt: "Communauté", source: 'user'
    }));
    return [...formattedUserReports, ...navIncidents];
  }, [navIncidents, userReports]);

  const filteredIncidents = useMemo(() => {
    let result = allIncidents;
    if (filter !== 'ALL') result = result.filter(i => i.status === filter);
    if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        result = result.filter(i => i.road.toLowerCase().includes(q) || i.district.toLowerCase().includes(q));
    }
    return result;
  }, [allIncidents, filter, searchQuery]);

  return (
    <div className="flex-1 flex flex-col h-full w-full bg-slate-50/50 overflow-hidden">
      
      <div className="bg-white border-b shadow-sm z-30 p-4 md:p-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
                <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    Rapports de Circulation
                    <Badge className="bg-primary/10 text-primary border-primary/20" variant="outline">LIVE</Badge>
                </h1>
                {lastUpdated && <p className="text-[10px] font-black text-primary uppercase mt-1">Dernière mise à jour : {format(lastUpdated, 'HH:mm:ss')}</p>}
            </div>
            
            <div className="flex items-center gap-3">
                <Badge variant="secondary" className="bg-amber-100 text-amber-700 h-10 px-4 rounded-xl border-amber-200">
                    <Star className="h-4 w-4 mr-2 fill-amber-500" />
                    {profile?.currentStarsBalance || 0} Stars
                </Badge>
                <Button variant="outline" onClick={() => fetchTrafficData(true)} disabled={isRefreshing} className="rounded-xl h-10 border-2">
                    <RefreshCw className={cn("h-4 w-4 mr-2", isRefreshing && "animate-spin")} />
                    Actualiser
                </Button>
            </div>
        </div>
      </div>

      <div className="p-4 md:p-6 flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-6 pb-10">
            
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input 
                    placeholder="Rechercher une avenue ou une commune..." 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-12 h-14 bg-white border-none shadow-sm rounded-2xl font-bold"
                />
            </div>

            <div className="space-y-4">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <Loader2 className="animate-spin h-10 w-10 text-primary" />
                        <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Synchronisation avec Google Maps...</p>
                    </div>
                ) : filteredIncidents.length > 0 ? (
                    filteredIncidents.map((incident) => (
                        <Card key={incident.id} className="rounded-3xl border-none shadow-sm hover:shadow-md transition-all overflow-hidden group">
                            <div className="flex">
                                <div className={cn(
                                    "w-2",
                                    incident.status === 'EMBOUTEILLAGE' ? "bg-red-600" :
                                    incident.status === 'DENSE' ? "bg-orange-500" :
                                    incident.status === 'MODÉRÉ' ? "bg-amber-500" :
                                    incident.status === 'FLUIDE' ? "bg-emerald-500" :
                                    "bg-slate-300"
                                )} />
                                <CardContent className="p-5 flex-1 flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="space-y-1">
                                        <h3 className="font-black text-lg text-slate-900 leading-tight">{incident.road}</h3>
                                        <p className="text-sm text-slate-500 font-medium">{incident.description}</p>
                                        <div className="flex flex-wrap items-center gap-2 mt-2">
                                            <Badge variant="outline" className="text-[9px] font-black uppercase text-primary/70 py-0">{incident.district}</Badge>
                                            
                                            <Badge className={cn(
                                                "text-[9px] font-black uppercase py-0",
                                                incident.status === 'EMBOUTEILLAGE' ? "bg-red-100 text-red-700" :
                                                incident.status === 'DENSE' ? "bg-orange-100 text-orange-700" :
                                                incident.status === 'MODÉRÉ' ? "bg-amber-100 text-amber-700" :
                                                incident.status === 'FLUIDE' ? "bg-emerald-100 text-emerald-700" :
                                                "bg-slate-100 text-slate-700"
                                            )}>
                                                {incident.status}
                                            </Badge>

                                            <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                                                <Clock className="h-3 w-3" /> {incident.updatedAt}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6 shrink-0">
                                        <div className="text-center">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Vitesse</p>
                                            <p className="font-black text-slate-800 text-xl">{incident.speed > 0 ? incident.speed : '--'}<span className="text-[10px] ml-0.5">km/h</span></p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Retard</p>
                                            <p className={cn(
                                                "font-black text-xl",
                                                incident.delay > 10 ? "text-red-600" : incident.delay > 5 ? "text-orange-500" : "text-emerald-600"
                                            )}>{incident.delay > 0 ? `+${incident.delay}` : '--'}<span className="text-[10px] ml-0.5">min</span></p>
                                        </div>
                                    </div>
                                </CardContent>
                            </div>
                        </Card>
                    ))
                ) : (
                    <div className="text-center py-20 space-y-4">
                        <AlertCircle className="h-12 w-12 text-slate-200 mx-auto" />
                        <p className="text-slate-400 font-bold">Aucun rapport correspondant à votre recherche.</p>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}
