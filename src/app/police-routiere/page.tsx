'use client';

import { AppShell } from "@/components/app-shell";
import PolicePresenceReports from "@/components/police-presence-reports";
import PoliceDirectory from "@/components/police-directory";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Siren, PhoneCall } from "lucide-react";

export default function PoliceRoutierePage() {
  return (
    <AppShell>
      <div className="w-full h-full flex flex-col overflow-hidden">
        <Tabs defaultValue="annuaire" className="flex-1 flex flex-col">
          <div className="px-4 pt-2">
            <TabsList className="grid w-full grid-cols-2 mb-4">
              <TabsTrigger value="annuaire" className="flex items-center gap-2">
                <PhoneCall className="h-4 w-4" />
                Annuaire Communes
              </TabsTrigger>
              <TabsTrigger value="reports" className="flex items-center gap-2">
                <Siren className="h-4 w-4" />
                Signalements Route
              </TabsTrigger>
            </TabsList>
          </div>
          
          <div className="flex-1 overflow-y-auto px-4 pb-4">
            <TabsContent value="annuaire" className="mt-0 h-full">
              <PoliceDirectory />
            </TabsContent>
            <TabsContent value="reports" className="mt-0 h-full">
              <PolicePresenceReports />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </AppShell>
  );
}
