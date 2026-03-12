'use client';

import { AppShell } from "@/components/app-shell";
import PolicePresenceReports from "@/components/police-presence-reports";
import PoliceDirectory from "@/components/police-directory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Siren, PhoneCall } from "lucide-react";

export default function PoliceRoutierePage() {
  return (
    <AppShell>
      <div className="w-full h-full overflow-y-auto">
        <div className="max-w-5xl mx-auto p-4 pb-12">
          <Tabs defaultValue="annuaire" className="w-full">
            <div className="sticky top-0 bg-background/95 backdrop-blur-sm z-30 pb-4 mb-2">
              <TabsList className="grid w-full grid-cols-2 h-12 shadow-sm">
                <TabsTrigger value="annuaire" className="flex items-center gap-2 text-sm md:text-base">
                  <PhoneCall className="h-4 w-4 md:h-5 md:w-5" />
                  Annuaire Communes
                </TabsTrigger>
                <TabsTrigger value="reports" className="flex items-center gap-2 text-sm md:text-base">
                  <Siren className="h-4 w-4 md:h-5 md:w-5" />
                  Signalements Route
                </TabsTrigger>
              </TabsList>
            </div>
            
            <div className="mt-2">
              <TabsContent value="annuaire" className="mt-0 outline-none">
                <PoliceDirectory />
              </TabsContent>
              <TabsContent value="reports" className="mt-0 outline-none">
                <PolicePresenceReports />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </AppShell>
  );
}
