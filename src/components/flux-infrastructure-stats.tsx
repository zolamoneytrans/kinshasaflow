'use client';

import React, { useMemo } from 'react';
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
  LineChart,
  Line,
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
  ArrowUpRight,
  Route,
  Activity,
  Coins,
  History,
  BarChart3
} from 'lucide-react';
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Données simulées basées sur les concepts Google Maps Vehicle Counts
const AXIS_VOLUME_DATA = [
  { name: "Blvd 30 Juin", volume: 4500, capacity: 5000, risk: "Faible", incidents: 2 },
  { name: "Blvd Lumumba", volume: 8200, capacity: 6000, risk: "Élevé", incidents: 12 },
  { name: "Av. Kasa-Vubu", volume: 3800, capacity: 4000, risk: "Moyen", incidents: 5 },
  { name: "Rte Matadi", volume: 5500, capacity: 4500, risk: "Élevé", incidents: 8 },
  { name: "Av. By-Pass", volume: 6100, capacity: 5000, risk: "Critique", incidents: 15 },
  { name: "Av. Libération", volume: 2900, capacity: 3500, risk: "Moyen", incidents: 3 },
];

const HOURLY_FLUX_TREND = [
  { time: "06h", vehicles: 1200 },
  { time: "07h", vehicles: 4500 },
  { time: "08h", vehicles: 7800 },
  { time: "09h", vehicles: 6200 },
  { time: "10h", vehicles: 4100 },
  { time: "11h", vehicles: 3500 },
  { time: "12h", vehicles: 3900 },
  { time: "13h", vehicles: 4200 },
  { time: "14h", vehicles: 4800 },
  { time: "15h", vehicles: 5500 },
  { time: "16h", vehicles: 7200 },
  { time: "17h", vehicles: 9100 },
  { time: "18h", vehicles: 8500 },
  { time: "19h", vehicles: 5200 },
];

const INVESTMENT_PRIORITY = [
  { project: "Extension Blvd Lumumba", impact: 95, cost: "12M$", priority: "P1" },
  { project: "Réfection Pont Matete", impact: 88, cost: "4.5M$", priority: "P1" },
  { project: "Signalisation By-Pass", impact: 72, cost: "0.8M$", priority: "P2" },
  { project: "Élargissement Ngaliema", impact: 65, cost: "8M$", priority: "P3" },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { y: 20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: { duration: 0.5 } }
};

export default function FluxInfrastructureStats() {
  const totalVolume = useMemo(() => AXIS_VOLUME_DATA.reduce((acc, curr) => acc + curr.volume, 0), []);
  const avgSaturation = useMemo(() => {
    const totalSat = AXIS_VOLUME_DATA.reduce((acc, curr) => acc + (curr.volume / curr.capacity), 0);
    return Math.round((totalSat / AXIS_VOLUME_DATA.length) * 100);
  }, []);

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
              Analyse prédictive basée sur Google Vehicle Counts pour Kinshasa.
            </p>
          </div>
          <Badge className="bg-primary/10 text-primary border-primary/20 px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-widest">
            Expert Dashboard v2.0
          </Badge>
        </div>

        {/* Top Key Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            title="Volume Global / Heure" 
            value={totalVolume.toLocaleString()} 
            subValue="Véhicules détectés sur les axes suivis" 
            icon={Car} 
            color="bg-primary" 
          />
          <StatCard 
            title="Saturation Moyenne" 
            value={`${avgSaturation}%`} 
            subValue="Capacité routière exploitée en Gombe/Limete" 
            icon={Activity} 
            color="bg-amber-500" 
          />
          <StatCard 
            title="Zones de Risque Réel" 
            value="3" 
            subValue="Tronçons où Volume &gt; Capacité + Incidents" 
            icon={AlertTriangle} 
            color="bg-red-500" 
          />
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Chart: Vehicle Volume Analysis */}
          <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-white border-b border-slate-100 p-8">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-xl font-black">Volume par Axe Routier</CardTitle>
                  <CardDescription>Comparaison Volume réel vs Capacité théorique</CardDescription>
                </div>
                <Zap className="text-primary h-5 w-5 animate-pulse" />
              </div>
            </CardHeader>
            <CardContent className="p-8 h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={AXIS_VOLUME_DATA} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.1} />
                  <XAxis type="number" hide />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    axisLine={false} 
                    tickLine={false} 
                    fontSize={12} 
                    fontWeight="bold" 
                    width={100}
                  />
                  <Tooltip 
                    cursor={{ fill: 'rgba(36, 142, 235, 0.05)' }} 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white p-4 rounded-2xl shadow-xl border border-slate-100">
                            <p className="font-black text-sm mb-2">{data.name}</p>
                            <div className="space-y-1 text-xs">
                              <p className="flex justify-between gap-4 font-bold text-slate-500">Volume: <span className="text-slate-900">{data.volume} v/h</span></p>
                              <p className="flex justify-between gap-4 font-bold text-slate-500">Capacité: <span className="text-slate-900">{data.capacity} v/h</span></p>
                              <p className="flex justify-between gap-4 font-bold text-slate-500">Incidents: <span className="text-red-500">{data.incidents}</span></p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="volume" radius={[0, 10, 10, 0]} barSize={20}>
                    {AXIS_VOLUME_DATA.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.volume > entry.capacity ? '#ef4444' : '#248eeb'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Chart: Hourly Trends */}
          <Card className="border-none shadow-sm rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-white border-b border-slate-100 p-8">
              <CardTitle className="text-xl font-black">Tendance Journalière</CardTitle>
              <CardDescription>Flux horaire moyenné sur la ville</CardDescription>
            </CardHeader>
            <CardContent className="p-8 h-[400px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={HOURLY_FLUX_TREND}>
                  <defs>
                    <linearGradient id="colorVehicles" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#248eeb" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#248eeb" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} fontSize={10} fontWeight="bold" />
                  <YAxis hide />
                  <Tooltip 
                    contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    itemStyle={{ fontWeight: 'bold', color: '#248eeb' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="vehicles" 
                    stroke="#248eeb" 
                    strokeWidth={4} 
                    fillOpacity={1} 
                    fill="url(#colorVehicles)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Decision Support Features */}
        <div className="grid md:grid-cols-3 gap-8">
          
          {/* Feature 1: Evaluate Capital Projects */}
          <Card className="border-none shadow-sm rounded-[2rem] bg-white group hover:shadow-xl transition-all">
            <CardHeader className="p-8 pb-4">
              <div className="bg-primary/10 p-3 rounded-2xl w-fit mb-4 group-hover:scale-110 transition-transform">
                <Building2 className="text-primary h-6 w-6" />
              </div>
              <CardTitle className="text-lg font-black">Évaluer les Projets</CardTitle>
              <CardDescription className="text-xs">Priorisation basée sur les volumes Google.</CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8 space-y-4">
              {INVESTMENT_PRIORITY.map((item, i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="space-y-0.5">
                    <p className="text-xs font-bold text-slate-900">{item.project}</p>
                    <p className="text-[10px] font-medium text-slate-400">Impact : {item.impact}%</p>
                  </div>
                  <Badge className={cn(
                    "text-[8px] font-black",
                    item.priority === 'P1' ? "bg-red-500" : "bg-slate-400"
                  )}>{item.priority}</Badge>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Feature 2: Justify Budgeting Decisions */}
          <Card className="border-none shadow-sm rounded-[2rem] bg-white group hover:shadow-xl transition-all">
            <CardHeader className="p-8 pb-4">
              <div className="bg-emerald-500/10 p-3 rounded-2xl w-fit mb-4 group-hover:scale-110 transition-transform">
                <Coins className="text-emerald-600 h-6 w-6" />
              </div>
              <CardTitle className="text-lg font-black">Optimisation Budgétaire</CardTitle>
              <CardDescription className="text-xs">Justifier les dépenses par les données de flux.</CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8">
              <div className="bg-emerald-50 p-6 rounded-[1.5rem] border border-emerald-100 space-y-4">
                <div className="flex justify-between items-end">
                  <p className="text-[10px] font-black uppercase text-emerald-800 tracking-widest">ROI Estimé</p>
                  <p className="text-2xl font-black text-emerald-600">+14%</p>
                </div>
                <p className="text-[11px] font-medium text-emerald-700/80 leading-relaxed italic">
                  "L'analyse des flux réels permet de remplacer les estimations vagues par des données d'exploitation objectives."
                </p>
                <div className="h-2 w-full bg-emerald-200/50 rounded-full overflow-hidden">
                  <motion.div initial={{ width: 0 }} animate={{ width: "85%" }} className="h-full bg-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Feature 3: Targeted Safety Improvements */}
          <Card className="border-none shadow-sm rounded-[2rem] bg-white group hover:shadow-xl transition-all">
            <CardHeader className="p-8 pb-4">
              <div className="bg-red-500/10 p-3 rounded-2xl w-fit mb-4 group-hover:scale-110 transition-transform">
                <ShieldCheck className="text-red-600 h-6 w-6" />
              </div>
              <CardTitle className="text-lg font-black">Amélioration Sécurité</CardTitle>
              <CardDescription className="text-xs">Corrélation Flux / Historique Incidents.</CardDescription>
            </CardHeader>
            <CardContent className="px-8 pb-8 space-y-6">
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                  <History className="h-3 w-3" /> Zones de Risque Identifiées
                </p>
                <div className="p-4 rounded-2xl border-2 border-dashed border-red-200 bg-red-50/50 space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                    <p className="text-xs font-black text-red-700 uppercase">Alerte : Blvd Lumumba</p>
                  </div>
                  <p className="text-[10px] font-bold text-red-600/70">
                    Ratio volume/sécurité critique détecté (Volume &gt; 8000 v/h + 12 incidents/mois). 
                    Installation prioritaire de radars ou signalisation recommandée.
                  </p>
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
    <Card className="border-none shadow-sm rounded-[2rem] bg-white overflow-hidden relative">
      <CardContent className="p-8">
        <div className="flex justify-between items-start">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</p>
            <p className="text-4xl font-black text-slate-900 tracking-tighter">{value}</p>
            <p className="text-[10px] font-bold text-slate-500">{subValue}</p>
          </div>
          <div className={cn("p-4 rounded-2xl shadow-lg", color)}>
            <Icon className="text-white h-6 w-6" />
          </div>
        </div>
      </CardContent>
      <div className={cn("absolute bottom-0 left-0 h-1 transition-all", color)} style={{ width: '100%' }} />
    </Card>
  );
}
