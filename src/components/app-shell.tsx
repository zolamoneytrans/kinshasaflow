'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, TrafficCone, Activity, Siren, PlusCircle, Megaphone, Loader2, Route, Landmark, Video, AreaChart, Bot, Bell, Map, Hotel, Bus, Shield, BedDouble } from 'lucide-react';
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
        <Sidebar>
          <SidebarContent>
            <SidebarHeader className="border-b">
               <div className="p-3 flex items-center justify-center">
                <Logo className="h-9 w-auto text-sidebar-primary" />
               </div>
            </SidebarHeader>
            <SidebarMenu className="p-2">
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/reports'} tooltip={{children: "Rapports"}}>
                  <Link href="/reports">
                    <Home />
                    <span>Rapports</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/live-traffic'} tooltip={{children: "Embouteillage en Temps Réel"}}>
                  <Link href="/live-traffic">
                    <Activity />
                    <span>Temps Réel</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/map'} tooltip={{children: "Carte"}}>
                  <Link href="/map">
                    <Map />
                    <span>Carte</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/assistant'} tooltip={{children: "Assistant IA"}}>
                  <Link href="/assistant">
                    <Bot />
                    <span>Assistant</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/signaler-embouteillage'} tooltip={{children: "Signaler un Embouteillage"}}>
                  <Link href="/signaler-embouteillage">
                    <PlusCircle />
                    <span>Signaler</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/police-routiere'} tooltip={{children: "Police Routière"}}>
                  <Link href="/police-routiere">
                    <Siren />
                    <span>Police</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
               <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/routes'} tooltip={{children: "État des Routes"}}>
                  <Link href="/routes">
                    <Route />
                    <span>Routes</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/annonces'} tooltip={{children: "Annonces"}}>
                  <Link href="/annonces">
                    <Landmark />
                    <span>Annonces</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/logement'} tooltip={{children: "Logement"}}>
                  <Link href="/logement">
                    <Hotel />
                    <span>Logement</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/transport'} tooltip={{children: "Transport"}}>
                  <Link href="/transport">
                    <Bus />
                    <span>Transport</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/evenements'} tooltip={{children: "Événements"}}>
                  <Link href="/evenements">
                    <Megaphone />
                    <span>Événements</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/videos'} tooltip={{children: "Vidéos"}}>
                  <Link href="/videos">
                    <Video />
                    <span>Vidéos</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/kinshasa'} tooltip={{children: "Statistiques"}}>
                  <Link href="/kinshasa">
                    <AreaChart />
                    <span>Kinshasa</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              

              {isAdmin && (
                <>
                  <SidebarSeparator className="my-2" />
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === '/admin/transport'} tooltip={{children: "Admin Transport"}}>
                      <Link href="/admin/transport">
                        <Shield />
                        <span>Admin Transport</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  <SidebarMenuItem>
                    <SidebarMenuButton asChild isActive={pathname === '/admin/logement'} tooltip={{children: "Admin Logement"}}>
                      <Link href="/admin/logement">
                        <BedDouble />
                        <span>Admin Logement</span>
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
                <header className="bg-card border-b p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <SidebarTrigger className="md:hidden" />
                      <div>
                        <h1 className="text-2xl font-bold text-foreground">{getPageTitle()}</h1>
                        <p className="text-muted-foreground">{getPageDescription()}</p>
                      </div>
                    </div>
                    <UserNav />
                </header>
                <main className="flex-1 p-4 flex flex-col gap-4 overflow-hidden">
                    <NotificationPermission />
                    <div className="flex-1 h-full w-full flex">
                        {isProtectedPage ? <ProtectedContent>{children}</ProtectedContent> : children}
                    </div>
                </main>
                <footer className="text-center p-2 text-xs text-muted-foreground border-t">
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
