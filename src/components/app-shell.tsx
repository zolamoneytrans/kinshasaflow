'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, TrafficCone } from 'lucide-react';
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
    return 'Kinshasa Flow';
  }

  const getPageDescription = () => {
    if (pathname === '/') return 'Mises à jour en temps réel pour Kinshasa';
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
                    <div className="h-full w-full">
                        {children}
                    </div>
                </main>
            </div>
        </SidebarInset>
      </SidebarProvider>
    </div>
  );
}
