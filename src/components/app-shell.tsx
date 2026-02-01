'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Home, TrafficCone, Activity, Siren, PlusCircle, Megaphone, Loader2, Route, Landmark } from 'lucide-react';
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
} from '@/components/ui/sidebar';
import { UserNav } from './auth/user-nav';
import { useUser } from '@/firebase';
import React, { useEffect } from 'react';

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
  
  const getPageTitle = () => {
    if (pathname === '/') return 'Rapports de trafic';
    if (pathname === '/live-traffic') return 'Embouteillage en Temps Réel';
    if (pathname === '/police-routiere') return 'Police Routière';
    if (pathname === '/routes') return 'État des Routes';
    if (pathname === '/annonces') return 'Annonces Officielles';
    if (pathname === '/signaler-embouteillage') return 'Signaler un Embouteillage';
    if (pathname === '/evenements') return 'Événements';
    if (pathname === '/login') return 'Se connecter';
    if (pathname === '/signup') return "S'inscrire";
    return 'Kinshasa Flow';
  }

  const getPageDescription = () => {
    if (pathname === '/') return 'Mises à jour en temps réel pour Kinshasa';
    if (pathname === '/live-traffic') return 'Un flux en direct du trafic dans la ville de Kinshasa';
    if (pathname === '/police-routiere') return 'Signalements de la présence policière à Kinshasa';
    if (pathname === '/routes') return 'Statistiques sur les infrastructures routières';
    if (pathname === '/annonces') return 'Mises à jour du gouvernement pour les automobilistes';
    if (pathname === '/signaler-embouteillage') return 'Signalez un incident pour aider les autres conducteurs';
    if (pathname === '/evenements') return 'Consultez les incidents signalés par la communauté';
    if (pathname === '/login') return 'Accédez à votre compte pour contribuer.';
    if (pathname === '/signup') return 'Créez un compte pour commencer à signaler des incidents.';
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
               <div className="p-2 flex items-center gap-2">
                <TrafficCone className="text-primary" />
                <h2 className="text-xl font-bold">Kinshasa Flow</h2>
               </div>
            </SidebarHeader>
            <SidebarMenu className="p-2">
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={pathname === '/'} tooltip={{children: "Rapports"}}>
                  <Link href="/">
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
                <SidebarMenuButton asChild isActive={pathname === '/evenements'} tooltip={{children: "Événements"}}>
                  <Link href="/evenements">
                    <Megaphone />
                    <span>Événements</span>
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
                <main className="flex-1 p-4 overflow-hidden">
                    <div className="h-full w-full flex">
                        {isProtectedPage ? <ProtectedContent>{children}</ProtectedContent> : children}
                    </div>
                </main>
            </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
