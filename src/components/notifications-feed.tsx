
'use client';

import React from 'react';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';
import { AppNotification, WithId } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  UserPlus, 
  AlertTriangle, 
  Video, 
  Clock, 
  MessageSquare, 
  Zap,
  Info
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import Link from 'next/link';

const NOTIF_ICONS = {
  user_joined: { icon: UserPlus, color: "bg-blue-100 text-blue-600", label: "Communauté" },
  traffic_report: { icon: AlertTriangle, color: "bg-orange-100 text-orange-600", label: "Trafic" },
  video_added: { icon: Video, color: "bg-emerald-100 text-emerald-600", label: "Vidéo" },
  system_alert: { icon: Zap, color: "bg-red-100 text-red-600", label: "Alerte IA" },
};

const NotificationCard = ({ notif, index }: { notif: WithId<AppNotification>, index: number }) => {
  const config = NOTIF_ICONS[notif.type] || { icon: Info, color: "bg-slate-100 text-slate-600", label: "Info" };
  const Icon = config.icon;
  const time = notif.timestamp?.toDate ? formatDistanceToNow(notif.timestamp.toDate(), { addSuffix: true, locale: fr }) : 'À l\'instant';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="border-none shadow-sm hover:shadow-md transition-all rounded-3xl overflow-hidden group bg-white">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className={cn("p-4 rounded-2xl shrink-0 transition-transform group-hover:scale-110", config.color)}>
              <Icon className="h-6 w-6" />
            </div>
            <div className="flex-1 space-y-1">
              <div className="flex justify-between items-start">
                <Badge variant="outline" className="text-[9px] font-black uppercase tracking-widest border-none px-0 text-muted-foreground">
                  {config.label}
                </Badge>
                <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                  <Clock className="h-3 w-3" /> {time}
                </span>
              </div>
              <h3 className="text-lg font-black text-slate-900 leading-tight">{notif.title}</h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">{notif.message}</p>
              
              {notif.link && (
                <Link href={notif.link} className="inline-block pt-3 text-xs font-black text-primary uppercase tracking-widest hover:underline">
                  Voir plus →
                </Link>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default function NotificationsFeed() {
  const { firestore } = useFirebase();
  
  const notifsQuery = useMemoFirebase(() => {
    return query(collection(firestore, 'notifications'), orderBy('timestamp', 'desc'), limit(50));
  }, [firestore]);

  const { data: notifications, isLoading } = useCollection<AppNotification>(notifsQuery);

  return (
    <div className="w-full h-full overflow-y-auto bg-slate-50/50 pb-20">
      <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-6">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Kinshasa Flow Live</h1>
            <p className="text-muted-foreground font-medium">Découvrez tout ce qui se passe en ville en temps réel.</p>
          </div>
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100">
            <Bell className="text-primary h-6 w-6" />
          </div>
        </div>

        <div className="space-y-4">
          {isLoading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="rounded-3xl border-none shadow-sm h-32 animate-pulse bg-slate-200/50" />
            ))
          ) : notifications && notifications.length > 0 ? (
            notifications.map((notif, i) => (
              <NotificationCard key={notif.id} notif={notif} index={i} />
            ))
          ) : (
            <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
              <div className="bg-slate-50 p-8 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-4">
                <Bell className="h-10 w-10 text-slate-300" />
              </div>
              <p className="text-xl font-bold text-slate-800">Aucune notification</p>
              <p className="text-sm text-slate-500">Revenez plus tard pour voir les mises à jour.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
