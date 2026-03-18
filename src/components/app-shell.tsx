'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, TrafficCone, Activity, Siren, PlusCircle, Megaphone, Loader2, Route, Landmark, Video, AreaChart, Bot, Bell, Map, Hotel, Bus, Shield, BedDouble, Mail, Car, Star, Share2, Users, ShieldAlert, CheckCircle, AlertCircle } from 'lucide-react';
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
import { useUser, useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import React, { useEffect, useState } from 'react';
import { Logo } from './logo';
import { NotificationPermission } from './notification-permission';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { doc } from 'firebase/firestore';
import { UserProfile } from '@/lib/types';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { sendEmailVerification } from 'firebase/auth';

function ProtectedContent({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const { firestore, auth } = useFirebase();
  const router = useRouter();
  const { toast } = useToast();
  const [isResending, setIsResending] = useState(false);

  // Watch blocking status
  const profileRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile } = useDoc<UserProfile>(profileRef);

  useEffect(() => {
    if (!isUserLoading && !user) {
      router.push('/login');
    }
  }, [user, isUserLoading, router]);

  if (isUserLoading || !user) {
    return (
      <div className="flex h-full w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  // 1. Blocking overlay (Banned)
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

  // 2. Verification overlay (Unactivated)
  if (!user.emailVerified && !user.isAnonymous && user.providerData.some(p => p.providerId === 'password')) {
    const handleResend = async () => {
        setIsResending(true);
        try {
            if (auth.currentUser) {
                await sendEmailVerification(auth.currentUser);
                toast({ title: "Email envoyé !", description: "Vérifiez votre boîte de réception (et vos spams)." });
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
                        Veuillez cliquer sur le lien pour débloquer vos <span className="text-amber-600 font-bold">25 stars</span> et l'accès à l'application.
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

  useEffect(() => {
    if (profile && profile.currentStarsBalance < 5 && pathname !== '/mes-stars') {
      toast({
        title: 'Solde faible — ' + profile.currentStarsBalance + ' stars restantes',
        description: 'Certaines fonctionnalités premium seront bientôt bloquées.',
        variant: 'destructive',
        action: (
          <ToastAction altText="Recharger" onClick={() => window.location.href = '/mes-stars'}>
            Recharger
          </ToastAction>
        ),
      });
    }
  }, [profile, pathname, toast]);

  const isAdmin = user?.email === 'drnduwa@gmail.com';
  
  const getPageTitle = () => {
    if (pathname === '/reports') return 'Rapports de trafic';
    if (pathname === '/live-traffic') return 'Embouteillage en Temps Réel';
    if (pathname === '/police-routiere') return 'Police Routière';
    if (pathname === '/routes') return 'État des Routes';
    if (pathname === '/annonces') return 'Annonces Officielles';
    if (pathname === '/logement') return 'Logement (Courte durée)';
    if (pathname === '/transport') return 'Solutions de Transport';
    if (pathname === '/location-voiture') return 'Location de Véhicules';
    if (pathname === '/contact') return 'Contactez-nous';
    if (pathname === '/signaler-embouteillage') return 'Signaler un Embouteillage';
    if (pathname === '/evenements') return 'Événements';
    if (pathname === '/videos') return 'Vidéos';
    if (pathname === '/kinshasa') return 'Statistiques de Kinshasa';
    if (pathname === '/assistant') return 'Assistant IA';
    if (pathname === '/map') return 'Carte du Trafic';
    if (pathname === '/mes-stars') return 'Mes Stars';
    if (pathname === '/admin/stars') return 'Admin Stars';
    if (pathname === '/admin/transport') return 'Admin Transport';
    if (pathname === '/admin/logement') return 'Admin Logement';
    if (pathname === '/admin/car-rental') return 'Admin Location';
    if (pathname === '/admin/adverts') return 'Admin Publicités';
    if (pathname === '/admin/messages') return 'Admin Messages';
    return 'Kinshasa Flow';
  }

  const getPageDescription = () => {
    if (pathname === '/reports') return 'Mises à jour en temps réel pour Kinshasa';
    if (pathname === '/live-traffic') return 'Un flux en direct du trafic dans la ville de Kinshasa';
    if (pathname === '/police-routiere') return 'Signalements de la présence policière à Kinshasa';
    if (pathname === '/routes') return 'Statistiques sur les infrastructures routières';
    if (pathname === '/annonces') return 'Mises à jour du gouvernement pour les automobilistes';
    if (pathname === '/logement') return 'Trouvez un appartement de type RBNB à Kinshasa.';
    if (pathname === '/transport') return 'Abonnements, covoiturage, et plus.';
    if (pathname === '/location-voiture') return 'Louez un véhicule pour vos déplacements à Kinshasa.';
    if (pathname === '/contact') return 'Envoyez-nous vos questions, suggestions ou plaintes.';
    if (pathname === '/signaler-embouteillage') return 'Signalez un incident pour aider les autres conducteurs';
    if (pathname === '/evenements') return 'Consultez les incidents signalés par la communauté';
    if (pathname === '/videos') return 'Un aperçu de la vie à Kinshasa en vidéos.';
    if (pathname === '/kinshasa') return 'Informations et statistiques sur la ville.';
    if (pathname === '/assistant') return 'Posez des questions sur les itinéraires à Kinshasa.';
    if (pathname === '/map') return 'Visualisez le trafic en temps réel à Kinshasa.';
    if (pathname === '/mes-stars') return 'Gérez votre solde de stars et monétisez votre usage.';
    if (pathname.startsWith('/admin')) return 'Espace réservé à l\'administration système.';
    return "Naviguez facilement dans le trafic de Kinshasa.";
  }

  const isProtectedPage = ![
    '/',
    '/login',
    '/signup',
  ].includes(pathname);

  const shareMessage = "Salut ! J'utilise Kinshasa Flow pour éviter les embouteillages à Kinshasa. Inscris-toi ici : https://kinshasaflow.online";

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
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/reports'} tooltip={{children: "Rapports"}} className="hover:bg-sidebar-accent transition-all duration-200">
                  <Link href="/reports" className="font-medium flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <Home className={pathname === '/reports' ? "text-accent" : "text-primary"} />
                      <span>Rapports</span>
                    </div>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/live-traffic'} tooltip={{children: "Embouteillage en Temps Réel"}} className="hover:bg-sidebar-accent">
                  <Link href="/live-traffic" className="font-medium">
                    <Activity className={pathname === '/live-traffic' ? "text-accent" : "text-primary"} />
                    <span>Temps Réel</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/map'} tooltip={{children: "Carte"}} className="hover:bg-sidebar-accent">
                  <Link href="/map" className="font-medium">
                    <Map className={pathname === '/map' ? "text-accent" : "text-primary"} />
                    <span>Carte</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/assistant'} tooltip={{children: "Assistant IA"}} className="hover:bg-sidebar-accent">
                  <Link href="/assistant" className="font-medium flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <Bot className={pathname === '/assistant' ? "text-accent" : "text-primary"} />
                      <span>Assistant</span>
                    </div>
                    <Badge variant="success" className="h-4 px-1.5 text-[8px] font-black uppercase tracking-tighter">NEW</Badge>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/mes-stars'} tooltip={{children: "Mes Stars"}} className="hover:bg-sidebar-accent">
                  <Link href="/mes-stars" className="font-medium flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <Star className={pathname === '/mes-stars' ? "text-accent" : "text-primary"} />
                      <span>Mes Stars</span>
                    </div>
                    {profile && (
                      <Badge variant="outline" className="h-5 bg-amber-500/10 border-amber-500/30 text-amber-600 font-bold px-1.5 text-[10px]">
                        {profile.currentStarsBalance}
                      </Badge>
                    )}
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/signaler-embouteillage'} tooltip={{children: "Signaler un Embouteillage"}} className="bg-primary/10 hover:bg-primary/20 mt-2 border border-primary/20">
                  <Link href="/signaler-embouteillage" className="font-bold text-primary-foreground">
                    <PlusCircle className={pathname === '/signaler-embouteillage' ? "text-accent" : "text-primary"} />
                    <span>Signaler</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/police-routiere'} tooltip={{children: "Police Routière"}} className="hover:bg-sidebar-accent">
                  <Link href="/police-routiere" className="font-medium flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <Siren className={pathname === '/police-routiere' ? "text-accent" : "text-primary"} />
                      <span>Police</span>
                    </div>
                    <div className="bg-red-500 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] font-black shadow-sm">!</div>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/routes'} tooltip={{children: "État des Routes"}} className="hover:bg-sidebar-accent">
                  <Link href="/routes" className="font-medium">
                    <Route className={pathname === '/routes' ? "text-accent" : "text-primary"} />
                    <span>Routes</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/annonces'} tooltip={{children: "Annonces"}} className="hover:bg-sidebar-accent">
                  <Link href="/annonces" className="font-medium flex items-center justify-between w-full">
                    <div className="flex items-center gap-2">
                      <Landmark className={pathname === '/annonces' ? "text-accent" : "text-primary"} />
                      <span>Annonces</span>
                    </div>
                    <Badge variant="secondary" className="h-4 px-1 text-[9px] font-bold">2</Badge>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/logement'} tooltip={{children: "Logement"}} className="hover:bg-sidebar-accent">
                  <Link href="/logement" className="font-medium">
                    <Hotel className={pathname === '/logement' ? "text-accent" : "text-primary"} />
                    <span>Logement</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/transport'} tooltip={{children: "Transport"}} className="hover:bg-sidebar-accent">
                  <Link href="/transport" className="font-medium">
                    <Bus className={pathname === '/transport' ? "text-accent" : "text-primary"} />
                    <span>Transport</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/location-voiture'} tooltip={{children: "Location de Véhicules"}} className="hover:bg-sidebar-accent">
                  <Link href="/location-voiture" className="font-medium">
                    <Car className={pathname === '/location-voiture' ? "text-accent" : "text-primary"} />
                    <span>Location Voiture</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/evenements'} tooltip={{children: "Événements"}} className="hover:bg-sidebar-accent">
                  <Link href="/evenements" className="font-medium">
                    <Megaphone className={pathname === '/evenements' ? "text-accent" : "text-primary"} />
                    <span>Événements</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/videos'} tooltip={{children: "Vidéos"}} className="hover:bg-sidebar-accent">
                  <Link href="/videos" className="font-medium">
                    <Video className={pathname === '/videos' ? "text-accent" : "text-primary"} />
                    <span>Vidéos</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/kinshasa'} tooltip={{children: "Statistiques"}} className="hover:bg-sidebar-accent">
                  <Link href="/kinshasa" className="font-medium">
                    <AreaChart className={pathname === '/kinshasa' ? "text-accent" : "text-primary"} />
                    <span>Kinshasa</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/contact'} tooltip={{children: "Contact"}} className="hover:bg-sidebar-accent">
                  <Link href="/contact" className="font-medium">
                    <Mail className={pathname === '/contact' ? "text-accent" : "text-primary"} />
                    <span>Contact</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild tooltip={{children: "Partager"}} className="hover:bg-sidebar-accent">
                  <a 
                    href={`https://wa.me/?text=${encodeURIComponent(shareMessage)}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="font-medium"
                  >
                    <Share2 className="text-primary" />
                    <span>Partager</span>
                  </a>
                </SidebarMenuButton>
              </SidebarMenuItem>
              

              {isAdmin && (
                <>
                  <SidebarSeparator className="my-4 bg-sidebar-border/30" />
                  <div className="px-4 mb-2 text-[10px] font-black uppercase text-destructive/60 tracking-widest">Administration</div>
                  
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === '/admin/stars'} className="hover:bg-sidebar-accent">
                      <Link href="/admin/stars" className="font-medium">
                        <Users className="text-destructive" />
                        <span>Admin Stars & Users</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === '/admin/transport'} className="hover:bg-sidebar-accent">
                      <Link href="/admin/transport" className="font-medium">
                        <Shield className="text-destructive" />
                        <span>Admin Transport</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === '/admin/logement'} className="hover:bg-sidebar-accent">
                      <Link href="/admin/logement" className="font-medium">
                        <BedDouble className="text-destructive" />
                        <span>Admin Logement</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === '/admin/car-rental'} className="hover:bg-sidebar-accent">
                      <Link href="/admin/car-rental" className="font-medium">
                        <Car className="text-destructive" />
                        <span>Admin Location</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === '/admin/adverts'} className="hover:bg-sidebar-accent">
                      <Link href="/admin/adverts" className="font-medium">
                        <Megaphone className="text-destructive" />
                        <span>Admin Publicités</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>

                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === '/admin/messages'} className="hover:bg-sidebar-accent">
                      <Link href="/admin/messages" className="font-medium">
                        <Mail className="text-destructive" />
                        <span>Admin Messages</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
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
