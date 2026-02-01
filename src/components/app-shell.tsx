'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, TrafficCone, Activity, Siren, PlusCircle, Megaphone } from 'lucide-react';
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

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  const getPageTitle = () => {
    if (pathname === '/') return 'Rapports de trafic';
    if (pathname === '/live-traffic') return 'Embouteillage en Temps Réel';
    if (pathname === '/police-routiere') return 'Police Routière';
    if (pathname === '/signaler-embouteillage') return 'Signaler un Embouteillage';
    if (pathname === '/evenements') return 'Événements';
    return 'Kinshasa Flow';
  }

  const getPageDescription = () => {
    if (pathname === '/') return 'Mises à jour en temps réel pour Kinshasa';
    if (pathname === '/live-traffic') return 'Un flux en direct du trafic dans la ville de Kinshasa';
    if (pathname === '/police-routiere') return 'Signalements de la présence policière à Kinshasa';
    if (pathname === '/signaler-embouteillage') return 'Signalez un incident pour aider les autres conducteurs';
    if (pathname === '/evenements') return 'Consultez les incidents signalés par la communauté';
    return "Naviguez facilement dans le trafic de Kinshasa.";
  }

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
                <Link href="/" legacyBehavior passHref>
                  <SidebarMenuButton asChild isActive={pathname === '/'} tooltip={{children: "Rapports"}}>
                    <a>
                      <Home />
                      <span>Rapports</span>
                    </a>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/live-traffic" legacyBehavior passHref>
                  <SidebarMenuButton asChild isActive={pathname === '/live-traffic'} tooltip={{children: "Embouteillage en Temps Réel"}}>
                    <a>
                      <Activity />
                      <span>Temps Réel</span>
                    </a>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/police-routiere" legacyBehavior passHref>
                  <SidebarMenuButton asChild isActive={pathname === '/police-routiere'} tooltip={{children: "Police Routière"}}>
                    <a>
                      <Siren />
                      <span>Police</span>
                    </a>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/evenements" legacyBehavior passHref>
                  <SidebarMenuButton asChild isActive={pathname === '/evenements'} tooltip={{children: "Événements"}}>
                    <a>
                      <Megaphone />
                      <span>Événements</span>
                    </a>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <Link href="/signaler-embouteillage" legacyBehavior passHref>
                  <SidebarMenuButton asChild isActive={pathname === '/signaler-embouteillage'} tooltip={{children: "Signaler un Embouteillage"}}>
                    <a>
                      <PlusCircle />
                      <span>Signaler</span>
                    </a>
                  </SidebarMenuButton>
                </Link>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
        <SidebarInset>
            <div className="flex flex-col h-full">
                <header className="bg-card border-b p-4 flex items-center gap-4">
                    <SidebarTrigger className="md:hidden" />
                    <div>
                      <h1 className="text-2xl font-bold text-foreground">{getPageTitle()}</h1>
                      <p className="text-muted-foreground">{getPageDescription()}</p>
                    </div>
                </header>
                <main className="flex-1 p-4 overflow-hidden">
                    <div className="h-full w-full flex">
                        {children}
                    </div>
                </main>
            </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
