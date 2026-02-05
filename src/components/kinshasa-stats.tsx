'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users, Building, AreaChart, DollarSign, University, Hospital } from "lucide-react";

const statsData = {
  general: {
    population: "17 Million (Estimation 2024)",
    area: "9,965 km²",
    density: "1,706 hab./km²",
  },
  economy: {
    gdp: "Approx. 55 Milliards USD (Ville-province)",
    keySectors: ["Services", "Commerce", "Construction", "Industrie légère"],
  },
  projections2026: {
    population: "18.5 Million (projection)",
    economicGrowth: "+4.5% (prévision)",
    focusAreas: ["Infrastructures numériques", "Transport urbain", "Énergies renouvelables"],
  },
  infrastructure: {
    universities: "Plus de 50 institutions",
    hospitals: "Plus de 300 centres de santé et hôpitaux",
  }
};

export default function KinshasaStats() {
  return (
    <div className="w-full h-full overflow-y-auto pr-2">
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="text-primary" />
              Démographie
            </CardTitle>
            <CardDescription>Population et superficie de Kinshasa.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
              <p className="font-semibold">Population</p>
              <p className="text-muted-foreground">{statsData.general.population}</p>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
              <p className="font-semibold">Superficie</p>
              <p className="text-muted-foreground">{statsData.general.area}</p>
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
              <p className="font-semibold">Densité</p>
              <p className="text-muted-foreground">{statsData.general.density}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="text-success" />
              Économie
            </CardTitle>
             <CardDescription>Aperçu économique de la ville-province.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-3 rounded-lg border bg-muted/30">
                <p className="font-semibold mb-1">PIB (estimation)</p>
                <p className="text-2xl font-bold text-success">{statsData.economy.gdp}</p>
            </div>
             <div className="p-3 rounded-lg border bg-muted/30">
                <p className="font-semibold mb-2">Secteurs Clés</p>
                <div className="flex flex-wrap gap-2">
                    {statsData.economy.keySectors.map(sector => (
                        <div key={sector} className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">{sector}</div>
                    ))}
                </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AreaChart className="text-primary" />
              Projections 2026
            </CardTitle>
            <CardDescription>Perspectives de développement futures.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
              <p className="font-semibold">Population Projetée</p>
              <p className="text-muted-foreground">{statsData.projections2026.population}</p>
            </div>
             <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30">
              <p className="font-semibold">Croissance Économique</p>
              <p className="text-muted-foreground">{statsData.projections2026.economicGrowth}</p>
            </div>
             <div className="p-3 rounded-lg border bg-muted/30">
                <p className="font-semibold mb-2">Axes de Développement</p>
                 <div className="flex flex-wrap gap-2">
                    {statsData.projections2026.focusAreas.map(area => (
                        <div key={area} className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded-full">{area}</div>
                    ))}
                </div>
            </div>
          </CardContent>
        </Card>

        <Card className="md:col-span-2 lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="text-primary" />
              Infrastructures
            </CardTitle>
            <CardDescription>Infrastructures sociales clés de la ville.</CardDescription>
          </CardHeader>
          <CardContent className="grid md:grid-cols-2 gap-4">
            <div className="flex items-start gap-4 p-4 rounded-lg border">
              <div className="bg-primary/10 text-primary p-3 rounded-full">
                <University className="h-6 w-6" />
              </div>
              <div>
                <p className="font-bold text-xl">{statsData.infrastructure.universities}</p>
                <p className="text-muted-foreground">Universités & Instituts Supérieurs</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 rounded-lg border">
              <div className="bg-success/10 text-success p-3 rounded-full">
                <Hospital className="h-6 w-6" />
              </div>
              <div>
                <p className="font-bold text-xl">{statsData.infrastructure.hospitals}</p>
                <p className="text-muted-foreground">Hôpitaux & Centres de Santé</p>
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
