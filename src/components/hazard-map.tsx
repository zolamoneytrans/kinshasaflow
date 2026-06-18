'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Map, 
  useMap, 
  Marker,
  InfoWindow
} from '@vis.gl/react-google-maps';
import { 
  LocateFixed, 
  RefreshCw, 
  ThumbsUp,
  ShieldAlert
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useUser, useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit, doc, updateDoc, increment } from 'firebase/firestore';
import { RoadConditionReport, WithId } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { ReportHazardDialog } from './report-hazard-dialog';
import Image from 'next/image';
import { CONFIG } from '@/lib/config';

const HAZARD_TYPES = {
  pothole: { label: "Nid-de-poule", color: "#f59e0b", icon: "🕳️" },
  blockage: { label: "Route Barrée", color: "#ef4444", icon: "🚧" },
  police: { label: "Police", color: "#3b82f6", icon: "🚓" },
  damaged_road: { label: "Route Dégradée", color: "#78350f", icon: "⚠️" },
};

export default function HazardMap() {
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [selectedReport, setSelectedReport] = useState<WithId<RoadConditionReport> | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  const { user, firestore } = useFirebase();
  const { toast } = useToast();

  // GPS Tracking
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.warn("GPS Access Denied")
      );
    }
  }, []);

  const reportsQuery = useMemoFirebase(() => {
    return query(collection(firestore, 'road_condition_reports'), orderBy('createdAt', 'desc'), limit(100));
  }, [firestore]);

  const { data: reports, isLoading } = useCollection<RoadConditionReport>(reportsQuery);

  const handleConfirm = async (report: WithId<RoadConditionReport>) => {
    if (!user) return;
    try {
      const reportRef = doc(firestore, 'road_condition_reports', report.id);
      await updateDoc(reportRef, { votes: increment(1) });
      toast({ title: "Merci !", description: "Votre confirmation aide la communauté." });
    } catch (e) {
      toast({ title: "Erreur", variant: "destructive" });
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-50 relative overflow-hidden rounded-[2rem] border shadow-2xl">
      {/* Top Controls Overlay */}
      <div className="absolute top-4 left-0 right-0 z-10 pointer-events-none p-4 flex justify-between items-start">
          <motion.div initial={{ y: -50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="pointer-events-auto">
              <Card className="bg-white/90 backdrop-blur-xl border-none shadow-2xl rounded-2xl overflow-hidden p-2 flex items-center gap-3">
                  <div className="bg-destructive p-2 rounded-xl">
                      <ShieldAlert className="text-white h-5 w-5" />
                  </div>
                  <div>
                      <h2 className="text-sm font-black tracking-tight">Carte des Dangers</h2>
                      <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Kinshasa en direct</p>
                  </div>
                  <div className="h-8 w-px bg-slate-100 mx-1" />
                  <ReportHazardDialog location={location} />
              </Card>
          </motion.div>

          <div className="flex flex-col gap-2 pointer-events-auto">
              <Button 
                  variant="secondary" 
                  size="icon" 
                  className="rounded-xl shadow-xl bg-white/90 backdrop-blur-xl h-12 w-12"
                  onClick={() => setLocation(prev => prev ? {...prev} : CONFIG.KINSHASA_CENTER)}
              >
                  <LocateFixed className="h-5 w-5 text-primary" />
              </Button>
              <Button 
                  variant="secondary" 
                  size="icon" 
                  className="rounded-xl shadow-xl bg-white/90 backdrop-blur-xl h-12 w-12"
                  onClick={() => setIsRefreshing(true)}
              >
                  <RefreshCw className={cn("h-5 w-5 text-slate-500", isRefreshing && "animate-spin")} />
              </Button>
          </div>
      </div>

      {/* Map View */}
      <div className="flex-1">
        <Map
            defaultCenter={CONFIG.KINSHASA_CENTER}
            center={location}
            defaultZoom={13}
            gestureHandling={'greedy'}
            disableDefaultUI={true}
            mapId="hazard_map_v1"
            className="w-full h-full"
        >
          {location && (
              <Marker 
                  position={location}
                  icon={{
                      path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5a2.5 2.5 0 110-5 2.5 2.5 0 010 5z",
                      fillColor: '#248eeb',
                      fillOpacity: 1,
                      strokeColor: 'white',
                      strokeWeight: 2,
                      scale: 1.5
                  } as any}
              />
          )}

          {reports?.map((report) => (
              <Marker 
                  key={report.id}
                  position={report.coords}
                  onClick={() => setSelectedReport(report)}
                  label={{
                      text: HAZARD_TYPES[report.type].icon,
                      fontSize: "20px"
                  }}
              />
          ))}

          {selectedReport && (
              <InfoWindow 
                  position={selectedReport.coords}
                  onCloseClick={() => setSelectedReport(null)}
              >
                  <div className="w-64 p-1 space-y-3">
                      {selectedReport.imageUrl && (
                          <div className="relative aspect-video rounded-lg overflow-hidden border">
                              <Image src={selectedReport.imageUrl} alt="Report" fill className="object-cover" />
                          </div>
                      )}
                      <div>
                          <div className="flex justify-between items-center mb-1">
                              <Badge className="text-[10px] font-black uppercase" style={{ backgroundColor: HAZARD_TYPES[selectedReport.type].color }}>
                                  {HAZARD_TYPES[selectedReport.type].label}
                              </Badge>
                              <span className="text-[10px] font-bold text-slate-400">
                                  {selectedReport.createdAt?.toDate ? formatDistanceToNow(selectedReport.createdAt.toDate(), { addSuffix: true, locale: fr }) : '...'}
                              </span>
                          </div>
                          <p className="text-xs font-bold text-slate-700 leading-relaxed">{selectedReport.description}</p>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t">
                          <div className="flex items-center gap-1 text-[10px] font-black text-primary uppercase">
                              <ThumbsUp className="h-3 w-3" />
                              {selectedReport.votes} confirmations
                          </div>
                          <Button size="sm" variant="ghost" className="h-7 text-[10px] font-black uppercase text-emerald-600 hover:bg-emerald-50" onClick={() => handleConfirm(selectedReport)}>
                              Confirmer
                          </Button>
                      </div>
                  </div>
              </InfoWindow>
          )}
        </Map>
      </div>

      {/* Legend Overlay */}
      <div className="absolute bottom-6 left-4 right-4 z-10 pointer-events-none">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="max-w-md mx-auto pointer-events-auto">
              <Card className="bg-white/90 backdrop-blur-xl border-none shadow-2xl rounded-2xl p-4">
                  <div className="flex justify-between items-center gap-2">
                      {Object.entries(HAZARD_TYPES).map(([key, config]) => (
                          <div key={key} className="flex flex-col items-center gap-1">
                              <div className="text-xl">{config.icon}</div>
                              <span className="text-[8px] font-black uppercase text-slate-400 text-center leading-none">{config.label}</span>
                          </div>
                      ))}
                  </div>
              </Card>
          </motion.div>
      </div>
    </div>
  );
}
