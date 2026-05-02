'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  Home, Activity, Siren, PlusCircle, Megaphone, Loader2, Route, 
  Landmark, Video, AreaChart, Bot, Map, Hotel, Bus, Shield, BedDouble, 
  Mail, Car, Star, Share2, Users, ShieldAlert, AlertCircle, 
  Palmtree, Compass, LayoutGrid, Utensils, Bell, Send, Navigation,
  BarChart3, Zap
} from 'lucide-react';
import {
  Sidebar,
  SidebarProvider,
  SidebarTrigger,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarInset,
  SidebarHeader,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { UserNav } from './auth/user-nav';
import { useUser, useFirebase, useDoc, useMemoFirebase, useCollection } from '@/firebase';
import React, { useEffect, useState, useCallback } from 'react';
import { Logo } from './logo';
import { NotificationPermission } from './notification-permission';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { doc, collection, query, orderBy, limit } from 'firebase/firestore';
import { UserProfile, AppNavigationSettings, AppSubscriptionSettings, AppNotification, EventReport } from '@/lib/types';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { sendEmailVerification } from 'firebase/auth';

function ProtectedContent({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const { firestore, auth } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  const [isResending, setIsResending] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const profileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile } = useDoc<UserProfile>(profileRef);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router, isMounted]);

  if (!isMounted || isUserLoading || !user) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  const isSpecialUser = user.email === 'drnduwa@gmail.com' || user.email === 'contact.congonamotema@gmail.com';

  if (profile?.isBlocked) {
    return (
      <div className="fixed inset-0 z-[9999] bg-background/95 backdrop-blur-md flex items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-6">
          <div className="bg-destructive/10 p-6 rounded-full w-24 h-24 flex items-center justify-center mx-auto">
            <ShieldAlert className="h-12 w-12 text-destructive" />
          </div>
          <div className="space-y-2">
            <h2 className="text-3xl font-black tracking-tight">Compte Suspendu</h2>
            <p className="text-muted-foreground">Votre accès à Kinshasa Flow a été restreint par l'administration suite à un non-respect des conditions d'utilisation.</p>
          </div>
          <div className="p-4 bg-muted rounded-xl text-xs font-medium text-muted-foreground italic">
            Pour toute contestation, veuillez contacter le support à drnduwa@gmail.com
          </div>
          <Link href="/contact" className="inline-block text-primary font-bold hover:underline">Nous contacter</Link>
        </div>
      </div>
    );
  }

  if (!user.emailVerified && !user.isAnonymous && user.providerData.some(p => p.providerId === 'password') && !isSpecialUser) {
    const handleResend = async () => {
        setIsResending(true);
        try {
            if (auth.currentUser) {
                await sendEmailVerification(auth.currentUser);
                toast({ title: "Email envoyé !", description: "Véfifiez votre boîte de réception (et vos spams)." });
            }
        } catch (e) {
            toast({ title: "Erreur", description: "Veuillez patienter avant de réessayer.", variant: "destructive" });
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[9998] bg-background/90 backdrop-blur-xl flex items-center justify-center p-6 text-center">
            <div className="max-w-md space-y-8 bg-white p-10 rounded-[2.5rem] shadow-2xl border border-slate-100">
                <div className="bg-primary/10 p-6 rounded-full w-24 h-24 flex items-center justify-center mx-auto ring-4 ring-primary/5">
                    <Mail className="h-12 w-12 text-primary animate-bounce" />
                </div>
                <div className="space-y-3">
                    <h2 className="text-3xl font-black tracking-tight text-slate-900">Activez votre compte</h2>
                    <p className="text-slate-500 font-medium leading-relaxed">
                        Un e-mail de confirmation a été envoyé à <span className="font-bold text-primary">{user.email}</span>. 
                        Veuillez cliquer sur le lien pour activer votre accès premium.
                    </p>
                </div>
                
                <div className="flex flex-col gap-3">
                    <Button onClick={() => window.location.reload()} size="lg" className="h-14 rounded-2xl text-lg font-black shadow-xl shadow-primary/20">
                        J'ai vérifié mon email
                    </Button>
                    <Button variant="outline" onClick={handleResend} disabled={isResending} className="h-12 rounded-2xl font-bold border-2">
                        {isResending ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : "Renvoyer l'email"}
                    </Button>
                </div>

                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                    Pensez à vérifier vos courriers indésirables (Spams).
                </p>
            </div>
        </div>
    );
  }

  return <>{children}</>;
}


export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useUser();
  const { firestore } = useFirebase();
  const { toast } = useToast();

  const userProfileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile } = useDoc<UserProfile>(userProfileRef);

  const subSettingsRef = useMemoFirebase(() => doc(firestore, 'app_settings', 'subscription'), [firestore]);
  const { data: subSettings } = useDoc<AppSubscriptionSettings>(subSettingsRef);

  const navSettingsRef = useMemoFirebase(() => doc(firestore, 'app_settings', 'navigation'), [firestore]);
  const { data: navSettings } = useDoc<AppNavigationSettings>(navSettingsRef);

  const notifsRef = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, 'notifications'), orderBy('timestamp', 'desc'), limit(20));
  }, [firestore, user]);
  const { data: notifs } = useCollection<AppNotification>(notifsRef);
  const [unreadNotifications, setUnreadNotifications] = useState(0);

  const eventsRef = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, 'events'), orderBy('createdAt', 'desc'), limit(20));
  }, [firestore, user]);
  const { data: events } = useCollection<EventReport>(eventsRef);
  const [unreadReports, setUnreadReports] = useState(0);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    
    const lastSeenReportsStr = localStorage.getItem('last_seen_reports');
    const lastSeenReports = lastSeenReportsStr ? parseInt(lastSeenReportsStr) : 0;

    if (pathname === '/reports') {
      localStorage.setItem('last_seen_reports', Date.now().toString());
      setUnreadReports(0);
    } else if (events) {
      const count = events.filter(e => {
        const ts = e.createdAt?.toMillis ? e.createdAt.toMillis() : Date.now();
        return ts > lastSeenReports;
      }).length;
      setUnreadReports(count);
    }

    const lastSeenNotifsStr = localStorage.getItem('last_seen_notifications');
    const lastSeenNotifs = lastSeenNotifsStr ? parseInt(lastSeenNotifsStr) : 0;

    if (pathname === '/notifications') {
      localStorage.setItem('last_seen_notifications', Date.now().toString());
      setUnreadNotifications(0);
    } else if (notifs) {
      const count = notifs.filter(n => {
        const ts = n.timestamp?.toMillis ? n.timestamp.toMillis() : Date.now();
        return ts > lastSeenNotifs;
      }).length;
      setUnreadNotifications(count);
    }
  }, [events, notifs, pathname]);

  useEffect(() => {
    if (!profile || !subSettings) return;

    if (subSettings.mode === 'stars') {
      if (profile.currentStarsBalance < 5 && pathname !== '/mes-stars' && !['/', '/privacy'].includes(pathname)) {
        toast({
          title: 'Solde faible — ' + profile.currentStarsBalance + ' stars restantes',
          description: 'Votre solde est presque épuisé.',
          variant: 'destructive',
          action: (
            <ToastAction altText="Recharger" onClick={() => window.location.href = '/mes-stars'}>
              Recharger
            </ToastAction>
          ),
        });
      }
    } else {
      const isExpired = profile.cashSubscriptionExpiry?.toDate() ? profile.cashSubscriptionExpiry.toDate() < new Date() : true;
      if (isExpired && pathname !== '/mes-stars' && !['/', '/privacy'].includes(pathname)) {
        toast({
          title: 'Abonnement expiré',
          description: 'Veuillez renouveler votre abonnement.',
          variant: 'destructive',
          action: (
            <ToastAction altText="S'abonner" onClick={() => window.location.href = '/mes-stars'}>
              S'abonner
            </ToastAction>
          ),
        });
      }
    }
  }, [profile, subSettings, pathname, toast]);

  const isAdmin = user?.email === 'drnduwa@gmail.com';
  const isPartnerAdmin = user?.email === 'contact.congonamotema@gmail.com' || isAdmin;
  
  const getPageTitle = () => {
    if (pathname === '/reports') return 'Rapports de trafic';
    if (pathname === '/live-traffic') return 'Embouteillage en Temps Réel';
    if (pathname === '/police-routiere') return 'Police Routière';
    if (pathname === '/routes') return 'État des Routes';
    if (pathname === '/annonces') return 'Annonces Officielles';
    if (pathname === '/logement') return 'Logement (Courte durée)';
    if (pathname === '/transport') return 'Solutions de Transport';
    if (pathname === '/location-voiture') return 'Location de Véhicules';
    if (pathname === '/tourisme') return 'Tourisme & Découverte';
    if (pathname === '/restaurants') return 'Restaurants & Saveurs';
    if (pathname === '/contact') return 'Contactez-nous';
    if (pathname === '/signaler-embouteillage') return 'Signaler un Embouteillage';
    if (pathname === '/evenements') return 'Événements';
    if (pathname === '/videos') return 'Vidéos';
    if (pathname === '/kinshasa') return 'Statistiques de Kinshasa';
    if (pathname === '/assistant') return 'Assistant IA';
    if (pathname === '/map') return 'Carte du Trafic';
    if (pathname === '/notifications') return 'Notifications';
    if (pathname === '/k-flow-nav') return 'K-Flow Nav';
    if (pathname === '/flux-infrastructure') return 'Flux & Infrastructure';
    if (pathname === '/insights') return 'K-Flow Insights';
    if (pathname === '/mes-stars') return subSettings?.mode === 'cash' ? 'Mon Abonnement' : 'Mes Stars';
    if (pathname === '/privacy') return 'Confidentialité & CGU';
    if (pathname.startsWith('/admin')) return 'Administration';
    return 'Kinshasa Flow';
  }

  const getPageDescription = () => {
    if (pathname === '/notifications') return 'Découvrez ce qui se passe dans la communauté.';
    if (pathname === '/k-flow-nav') return 'Votre copilote GPS intelligent.';
    if (pathname === '/insights') return 'Analyse stratégique et conseils IA (15 min).';
    if (pathname === '/flux-infrastructure') return 'Analyse stratégique basée sur Google Vehicle Counts.';
    if (pathname.startsWith('/admin')) return 'Gestion interne de la plateforme.';
    return "Naviguez facilement dans le trafic de Kinshasa.";
  }

  const isProtectedPage = ![
    '/',
    '/login',
    '/signup',
    '/privacy',
  ].includes(pathname);

  const isEnabled = useCallback((feature: keyof AppNavigationSettings) => {
    if (!navSettings) return true;
    if (navSettings[feature] === undefined) return true;
    return navSettings[feature] !== false;
  }, [navSettings]);

  return (
    <div className="flex h-screen bg-background">
      <SidebarProvider>
        <Sidebar className="border-r-0 shadow-2xl">
          <SidebarContent>
            <SidebarHeader className="border-b border-sidebar-border/50">
               <div className="p-4 flex items-center justify-center">
                <Logo className="h-9 w-auto text-sidebar-foreground" />
               </div>
            </SidebarHeader>
            <SidebarMenu className="p-3 gap-1">
              
              {isEnabled('reports') && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === '/reports'} className="hover:bg-sidebar-accent">
                    <Link href="/reports" className="font-medium flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <Home className={pathname === '/reports' ? "text-accent" : "text-primary"} />
                        <span>Rapports</span>
                      </div>
                      {unreadReports > 0 && (
                        <Badge variant="destructive" className="h-5 px-1.5 min-w-[20px] justify-center text-[10px] animate-pulse rounded-full font-black">
                          {unreadReports}
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {isEnabled('liveTraffic') && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === '/live-traffic'} className="hover:bg-sidebar-accent">
                    <Link href="/live-traffic" className="font-medium">
                      <Activity className={pathname === '/live-traffic' ? "text-accent" : "text-primary"} />
                      <span>Temps Réel</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {isEnabled('kFlowNav') && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === '/k-flow-nav'} className="bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 mb-1 shadow-sm">
                    <Link href="/k-flow-nav" className="font-bold flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <Navigation className={pathname === '/k-flow-nav' ? "text-accent" : "text-primary"} />
                        <span>K-Flow Nav</span>
                      </div>
                      <Badge className="bg-primary/20 text-primary text-[8px]">PREMIUM</Badge>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {isEnabled('insights') && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === '/insights'} className="bg-primary/5 hover:bg-primary/10 border border-primary/10 mb-2">
                    <Link href="/insights" className="font-bold flex items-center justify-between w-full text-primary">
                      <div className="flex items-center gap-2">
                        <Zap className={pathname === '/insights' ? "text-accent" : "text-primary"} />
                        <span>K-Flow Insights</span>
                      </div>
                      <Badge className="bg-primary/20 text-primary text-[8px]">AI</Badge>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {isEnabled('fluxInfrastructure') && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === '/flux-infrastructure'} className="hover:bg-sidebar-accent">
                    <Link href="/flux-infrastructure" className="font-medium flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <BarChart3 className={pathname === '/flux-infrastructure' ? "text-accent" : "text-primary"} />
                        <span>Flux & Infrastructure</span>
                      </div>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {isEnabled('routes') && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === '/routes'} className="hover:bg-sidebar-accent mb-2">
                    <Link href="/routes" className="font-medium flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <Route className={pathname === '/routes' ? "text-accent" : "text-primary"} />
                        <span>État des Routes</span>
                      </div>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {isEnabled('map') && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === '/map'} className="hover:bg-sidebar-accent">
                    <Link href="/map" className="font-medium">
                      <Map className={pathname === '/map' ? "text-accent" : "text-primary"} />
                      <span>Carte</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {isEnabled('assistant') && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === '/assistant'} className="hover:bg-sidebar-accent">
                    <Link href="/assistant" className="font-medium flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <Bot className={pathname === '/assistant' ? "text-accent" : "text-primary"} />
                        <span>Assistant IA</span>
                      </div>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {isEnabled('notifications') && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === '/notifications'} className="hover:bg-sidebar-accent">
                    <Link href="/notifications" className="font-medium flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        <Bell className={pathname === '/notifications' ? "text-accent" : "text-primary"} />
                        <span>Notifications</span>
                      </div>
                      {unreadNotifications > 0 && (
                        <Badge variant="destructive" className="h-5 px-1.5 min-w-[20px] justify-center text-[10px] animate-pulse rounded-full font-black">
                          {unreadNotifications}
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {isEnabled('myStars') && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === '/mes-stars'} className="hover:bg-sidebar-accent">
                    <Link href="/mes-stars" className="font-medium flex items-center justify-between w-full">
                      <div className="flex items-center gap-2">
                        {subSettings?.mode === 'cash' ? <Shield className={pathname === '/mes-stars' ? "text-accent" : "text-primary"} /> : <Star className={pathname === '/mes-stars' ? "text-accent" : "text-primary"} />}
                        <span>{subSettings?.mode === 'cash' ? "Mon Accès" : "Mes Stars"}</span>
                      </div>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              <SidebarSeparator className="my-2 opacity-20" />

              {isEnabled('report') && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === '/signaler-embouteillage'} className="bg-primary/10 hover:bg-primary/20 mt-2 border border-primary/20">
                    <Link href="/signaler-embouteillage" className="font-bold">
                      <PlusCircle className={pathname === '/signaler-embouteillage' ? "text-accent" : "text-primary"} />
                      <span>Signaler</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {isEnabled('police') && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === '/police-routiere'} className="hover:bg-sidebar-accent">
                    <Link href="/police-routiere" className="font-medium">
                      <Siren className={pathname === '/police-routiere' ? "text-accent" : "text-primary"} />
                      <span>Police</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {isEnabled('announcements') && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === '/annonces'} className="hover:bg-sidebar-accent">
                    <Link href="/annonces" className="font-medium">
                      <Landmark className={pathname === '/annonces' ? "text-accent" : "text-primary"} />
                      <span>Annonces</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {isEnabled('logement') && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === '/logement'} className="hover:bg-sidebar-accent">
                    <Link href="/logement" className="font-medium">
                      <Hotel className={pathname === '/logement' ? "text-accent" : "text-primary"} />
                      <span>Logement</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {isEnabled('transport') && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === '/transport'} className="hover:bg-sidebar-accent">
                    <Link href="/transport" className="font-medium">
                      <Bus className={pathname === '/transport' ? "text-accent" : "text-primary"} />
                      <span>Transport</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {isEnabled('carRental') && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === '/location-voiture'} className="hover:bg-sidebar-accent">
                    <Link href="/location-voiture" className="font-medium">
                      <Car className={pathname === '/location-voiture' ? "text-accent" : "text-primary"} />
                      <span>Location</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {isEnabled('tourism') && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === '/tourisme'} className="hover:bg-sidebar-accent">
                    <Link href="/tourisme" className="font-medium">
                      <Palmtree className={pathname === '/tourisme' ? "text-accent" : "text-primary"} />
                      <span>Tourisme</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {isEnabled('restaurants') && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === '/restaurants'} className="hover:bg-sidebar-accent">
                    <Link href="/restaurants" className="font-medium">
                      <Utensils className={pathname === '/restaurants' ? "text-accent" : "text-primary"} />
                      <span>Restaurants</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {isEnabled('events') && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === '/evenements'} className="hover:bg-sidebar-accent">
                    <Link href="/evenements" className="font-medium">
                      <Megaphone className={pathname === '/evenements' ? "text-accent" : "text-primary"} />
                      <span>Événements</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {isEnabled('videos') && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === '/videos'} className="hover:bg-sidebar-accent">
                    <Link href="/videos" className="font-medium">
                      <Video className={pathname === '/videos' ? "text-accent" : "text-primary"} />
                      <span>Vidéos</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {isEnabled('kinshasa') && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === '/kinshasa'} className="hover:bg-sidebar-accent">
                    <Link href="/kinshasa" className="font-medium">
                      <AreaChart className={pathname === '/kinshasa' ? "text-accent" : "text-primary"} />
                      <span>Kinshasa</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {isEnabled('contact') && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild isActive={pathname === '/contact'} className="hover:bg-sidebar-accent">
                    <Link href="/contact" className="font-medium">
                      <Mail className={pathname === '/contact' ? "text-accent" : "text-primary"} />
                      <span>Contact</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}

              {isEnabled('share') && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild className="hover:bg-sidebar-accent">
                    <a 
                      href={`https://wa.me/?text=${encodeURIComponent("Salut ! J'utilise Kinshasa Flow pour éviter les embouteillages. Inscris-toi : https://kinshasaflow.online")}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="font-medium"
                    >
                      <Share2 className="text-primary" />
                      <span>Partager</span>
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              

              {isPartnerAdmin && (
                <>
                  <SidebarSeparator className="my-4 bg-sidebar-border/30" />
                  <div className="px-4 mb-2 text-[10px] font-black uppercase text-destructive/60 tracking-widest">Admin</div>
                  
                  {isAdmin && (
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={pathname === '/admin/navigation'} className="hover:bg-sidebar-accent">
                        <Link href="/admin/navigation" className="font-medium flex items-center gap-2">
                          <LayoutGrid className="text-destructive" />
                          <span>Navigation</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}

                  {isAdmin && (
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={pathname === '/admin/stars'} className="hover:bg-sidebar-accent">
                        <Link href="/admin/stars" className="font-medium flex items-center gap-2">
                          <Users className="text-destructive" />
                          <span>Stars & Utilisateurs</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}

                  {isAdmin && (
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={pathname === '/admin/notifications'} className="hover:bg-sidebar-accent">
                        <Link href="/admin/notifications" className="font-medium flex items-center gap-2">
                          <Send className="text-destructive" />
                          <span>Notifications Admin</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}

                  {isAdmin && (
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={pathname === '/admin/adverts'} className="hover:bg-sidebar-accent">
                        <Link href="/admin/adverts" className="font-medium flex items-center gap-2">
                          <Video className="text-destructive" />
                          <span>Publicités</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}

                  {isAdmin && (
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={pathname === '/admin/transport'} className="hover:bg-sidebar-accent">
                        <Link href="/admin/transport" className="font-medium flex items-center gap-2">
                          <Bus className="text-destructive" />
                          <span>Transport</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}

                  {isAdmin && (
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={pathname === '/admin/logement'} className="hover:bg-sidebar-accent">
                        <Link href="/admin/logement" className="font-medium flex items-center gap-2">
                          <BedDouble className="text-destructive" />
                          <span>Logement</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}

                  {isAdmin && (
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={pathname === '/admin/car-rental'} className="hover:bg-sidebar-accent">
                        <Link href="/admin/car-rental" className="font-medium flex items-center gap-2">
                          <Car className="text-destructive" />
                          <span>Location</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}

                  {isPartnerAdmin && (
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={pathname === '/admin/tourism'} className="hover:bg-sidebar-accent">
                        <Link href="/admin/tourism" className="font-medium flex items-center gap-2">
                          <Palmtree className="text-destructive" />
                          <span>Tourisme</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}

                  {isAdmin && (
                    <SidebarMenuItem>
                      <SidebarMenuButton asChild isActive={pathname === '/admin/messages'} className="hover:bg-sidebar-accent">
                        <Link href="/admin/messages" className="font-medium flex items-center gap-2">
                          <Mail className="text-destructive" />
                          <span>Messages</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  )}
                </>
              )}
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
            <div className="flex flex-col h-full">
                <header className="bg-card border-b p-4 flex items-center justify-between gap-4 shadow-sm z-20">
                    <div className="flex items-center gap-4">
                      <SidebarTrigger className="md:hidden" />
                      <div>
                        <h1 className="text-2xl font-black text-foreground tracking-tight">{getPageTitle()}</h1>
                        <p className="text-sm font-medium text-muted-foreground">{getPageDescription()}</p>
                      </div>
                    </div>
                    <UserNav />
                </header>
                <main className="flex-1 p-4 flex flex-col gap-4 overflow-hidden bg-background">
                    <NotificationPermission />
                    <div className="flex-1 h-full w-full flex">
                        {isProtectedPage ? <ProtectedContent>{children}</ProtectedContent> : children}
                    </div>
                </main>
                <footer className="text-center p-3 text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60 border-t bg-card">
                    <a href="http://www.swaziapplilab.co.za" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                        &copy; {new Date().getFullYear()} Swazi Appli Lab sarl
                    </a>
                </footer>
            </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
