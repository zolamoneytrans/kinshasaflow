'use client';

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, Construction, TrafficCone, MapPin, Search } from "lucide-react";
import { type VariantProps } from 'class-variance-authority';
import { badgeVariants } from "./ui/badge";
import { Input } from "./ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const roadStatsData = {
  potholes: {
    total: 124,
    repaired: 45,
  },
  damagedStreets: [
    { name: "Boulevard Lumumba", status: "Réparation urgente requise", severity: "high", commune: "Matete" },
    { name: "Avenue Kasa-Vubu", status: "Dommages modérés", severity: "medium", commune: "Kasa-Vubu" },
    { name: "Route de Matadi", status: "Plusieurs nids-de-poule signalés", severity: "medium", commune: "Mont-Ngafula" },
    { name: "7ème Rue, Limete", status: "En cours de réparation", severity: "low", commune: "Limete" },
    { name: "Avenue de l'Université", status: "Affaissement de la chaussée", severity: "high", commune: "Ngaliema" },
    { name: "Croisement Victoire", status: "Nid-de-poule géant", severity: "high", commune: "Kalamu" },
    { name: "Avenue de la Paix", status: "Fissures et dégradations", severity: "medium", commune: "Gombe" },
    { name: "Avenue Sendwe", status: "Route défoncée", severity: "medium", commune: "Kalamu" },
    { name: "Boulevard Triomphal", status: "Bon état général", severity: "low", commune: "Lingwala" },
    { name: "Avenue du Tourisme", status: "Quelques déformations", severity: "low", commune: "Ngaliema" },
  ],
  bridges: [
    { name: "Pont Matete", status: "Opérationnel", ok: true },
    { name: "Pont Kasa-Vubu", status: "Inspection requise", ok: false },
    { name: "Pont N'djili", status: "Opérationnel", ok: true },
  ],
};

const SeverityBadge = ({ severity }: { severity: string }) => {
    const variant = {
        low: 'success',
        medium: 'secondary',
        high: 'destructive',
    }[severity] as VariantProps<typeof badgeVariants>['variant'];

    const severityText = {
        low: 'Faible',
        medium: 'Moyen',
        high: 'Élevé'
    }[severity];

    return <Badge variant={variant}>{severityText}</Badge>;
}

export default function RoutesStats() {
  const [searchQuery, setSearchQuery] = useState('');
  const potholeRepairProgress = (roadStatsData.potholes.repaired / roadStatsData.potholes.total) * 100;

  const groupedAndFilteredStreets = useMemo(() => {
    const filtered = roadStatsData.damagedStreets.filter(street =>
      street.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      street.commune.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return filtered.reduce((acc, street) => {
      const { commune } = street;
      if (!acc[commune]) {
        acc[commune] = [];
      }
      acc[commune].push(street);
      return acc;
    }, {} as Record<string, typeof roadStatsData.damagedStreets>);
  }, [searchQuery]);

  const communesWithDamagedStreets = Object.keys(groupedAndFilteredStreets);

  return (
    <div className="w-full h-full overflow-y-auto pr-2">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="text-destructive" />
                        Nids-de-poule Signalés
                    </CardTitle>
                    <CardDescription>État des réparations des nids-de-poule à Kinshasa.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="text-4xl font-bold">{roadStatsData.potholes.total}</div>
                    <p className="text-xs text-muted-foreground">Total des nids-de-poule signalés</p>
                    <div className="mt-4">
                        <div className="flex justify-between items-center mb-1">
                            <span className="text-sm font-medium">Réparés: {roadStatsData.potholes.repaired}</span>
                            <span className="text-sm font-medium">{potholeRepairProgress.toFixed(0)}%</span>
                        </div>
                        <Progress value={potholeRepairProgress} aria-label={`${potholeRepairProgress.toFixed(0)}% des nids-de-poule réparés`} />
                    </div>
                </CardContent>
            </Card>

            <Card className="lg:col-span-2">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Construction className="text-primary" />
                        Rues Endommagées
                    </CardTitle>
                    <CardDescription>Recherchez et consultez les rues par commune.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Rechercher une rue ou une commune..."
                            className="pl-9"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    {communesWithDamagedStreets.length > 0 ? (
                        <Accordion type="multiple" className="w-full">
                            {communesWithDamagedStreets.map((commune) => (
                                <AccordionItem value={commune} key={commune}>
                                    <AccordionTrigger className="hover:no-underline">
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4" />
                                            <span>{commune}</span>
                                            <Badge variant="outline">{groupedAndFilteredStreets[commune].length}</Badge>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className="space-y-2 pl-6">
                                            {groupedAndFilteredStreets[commune].map((street, index) => (
                                                <div key={index} className="flex items-center justify-between p-2 rounded-md border bg-muted/20">
                                                    <div>
                                                        <p className="font-semibold">{street.name}</p>
                                                        <p className="text-sm text-muted-foreground">{street.status}</p>
                                                    </div>
                                                    <SeverityBadge severity={street.severity} />
                                                </div>
                                            ))}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    ) : (
                        <div className="text-center text-muted-foreground py-8">
                            <p>Aucune rue endommagée trouvée pour votre recherche.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
            
            <Card className="lg:col-span-3">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <TrafficCone className="text-secondary-foreground" />
                        État des Ponts
                    </CardTitle>
                    <CardDescription>Statut actuel des ponts majeurs de la ville.</CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {roadStatsData.bridges.map((bridge, index) => (
                             <div key={index} className="flex items-center gap-4 p-4 rounded-lg border">
                                <MapPin className={`h-8 w-8 ${bridge.ok ? 'text-success' : 'text-destructive'}`} />
                                <div>
                                    <p className="font-semibold">{bridge.name}</p>
                                    <p className={`text-sm ${bridge.ok ? 'text-success' : 'text-destructive'}`}>{bridge.status}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
