'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, TrafficCone, Activity, Siren, PlusCircle, Megaphone, Loader2, Route, Landmark, Video, AreaChart, Bot, Bell, Map, Hotel, Bus, Shield, BedDouble, Mail, Car } from 'lucide-react';
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
import { useUser } from '@/firebase';
import React, { useEffect } from 'react';
import { Logo } from './logo';
import { NotificationPermission } from './notification-permission';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';

function ProtectedContent({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();

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

  return <>{children}</>;
}


export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user } = useUser();
  const { toast } = useToast();

  useEffect(() => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      const handleControllerChange = () => {
        toast({
          title: 'Mise à jour disponible',
          description: "Une nouvelle version de l'application est prête.",
          duration: Infinity,
          action: (
            <ToastAction altText="Actualiser" onClick={() => window.location.reload()}>
              Actualiser
            </ToastAction>
          ),
        });
      };
      
      navigator.serviceWorker.addEventListener('controllerchange', handleControllerChange);

      return () => {
        navigator.serviceWorker.removeEventListener('controllerchange', handleControllerChange);
      };
    }
  }, [toast]);

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
    if (pathname === '/login') return 'Se connecter';
    if (pathname === '/signup') return "S'inscrire";
    if (pathname === '/admin/transport') return 'Admin Transport';
    if (pathname === '/admin/logement') return 'Admin Logement';
    if (pathname === '/admin/messages') return 'Messages';
    if (pathname === '/admin/car-rental') return 'Admin Location';
    if (pathname === '/admin/test-push') return 'Test Notifications';
    if (pathname.startsWith('/admin')) return 'Tableau de Bord Admin';
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
    if (pathname === '/login') return 'Accédez à votre compte pour contribuer.';
    if (pathname === '/signup') return 'Créez un compte pour commencer à signaler des incidents.';
    if (pathname === '/admin/transport') return 'Gérer les abonnements au transport.';
    if (pathname === '/admin/logement') return 'Gérer les candidatures pour les logements.';
    if (pathname === '/admin/messages') return 'Consulter les messages des utilisateurs.';
    if (pathname === '/admin/car-rental') return 'Gérer les réservations de véhicules.';
    if (pathname === '/admin/test-push') return 'Envoyer une notification de test.';
    return "Naviguez facilement dans le trafic de Kinshasa.";
  }

  const isProtectedPage = ![
    '/',
    '/login',
    '/signup',
  ].includes(pathname);

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
                  <Link href="/reports" className="font-medium">
                    <Home className={pathname === '/reports' ? "text-accent" : "text-primary"} />
                    <span>Rapports</span>
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
                  <Link href="/assistant" className="font-medium">
                    <Bot className={pathname === '/assistant' ? "text-accent" : "text-primary"} />
                    <span>Assistant</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/signaler-embouteillage'} tooltip={{children: "Signaler un Embouteillage"}} className="bg-primary/10 hover:bg-primary/20 mt-2 border border-primary/20">
                  <Link href="/signaler-embouteillage" className="font-bold text-primary-foreground">
                    <PlusCircle className="text-accent animate-pulse" />
                    <span>Signaler</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/police-routiere'} tooltip={{children: "Police Routière"}} className="hover:bg-sidebar-accent">
                  <Link href="/police-routiere" className="font-medium">
                    <Siren className={pathname === '/police-routiere' ? "text-accent" : "text-primary"} />
                    <span>Police</span>
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
                  <Link href="/annonces" className="font-medium">
                    <Landmark className={pathname === '/annonces' ? "text-accent" : "text-primary"} />
                    <span>Annonces</span>
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
              

              {isAdmin && (
                <>
                  <SidebarSeparator className="my-4 bg-sidebar-border/30" />
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === '/admin/transport'} tooltip={{children: "Admin Transport"}} className="hover:bg-sidebar-accent">
                      <Link href="/admin/transport" className="font-medium">
                        <Shield className="text-destructive" />
                        <span>Admin Transport</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === '/admin/logement'} tooltip={{children: "Admin Logement"}} className="hover:bg-sidebar-accent">
                      <Link href="/admin/logement" className="font-medium">
                        <BedDouble className="text-destructive" />
                        <span>Admin Logement</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                   <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === '/admin/messages'} tooltip={{children: "Messages"}} className="hover:bg-sidebar-accent">
                      <Link href="/admin/messages" className="font-medium">
                        <Mail className="text-destructive" />
                        <span>Messages</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === '/admin/car-rental'} tooltip={{children: "Admin Location"}} className="hover:bg-sidebar-accent">
                      <Link href="/admin/car-rental" className="font-medium">
                        <Car className="text-destructive" />
                        <span>Admin Location</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === '/admin/test-push'} tooltip={{children: "Test Push"}} className="hover:bg-sidebar-accent">
                      <Link href="/admin/test-push" className="font-medium">
                        <Bell className="text-destructive" />
                        <span>Test Push</span>
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