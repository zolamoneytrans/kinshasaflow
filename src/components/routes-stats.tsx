'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { AlertCircle, Construction, TrafficCone, MapPin } from "lucide-react";
import { type VariantProps } from 'class-variance-authority';
import { badgeVariants } from "./ui/badge";

const roadStatsData = {
  potholes: {
    total: 124,
    repaired: 45,
  },
  damagedStreets: [
    { name: "Boulevard Lumumba", status: "Réparation urgente requise", severity: "high" },
    { name: "Avenue Kasa-Vubu", status: "Dommages modérés", severity: "medium" },
    { name: "Route de Matadi", status: "Plusieurs nids-de-poule signalés", severity: "medium" },
    { name: "7ème Rue, Limete", status: "En cours de réparation", severity: "low" },
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
  const potholeRepairProgress = (roadStatsData.potholes.repaired / roadStatsData.potholes.total) * 100;

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
                    <CardDescription>Liste des rues nécessitant une attention particulière.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {roadStatsData.damagedStreets.map((street, index) => (
                            <div key={index} className="flex items-center justify-between p-2 rounded-md border">
                                <div>
                                    <p className="font-semibold">{street.name}</p>
                                    <p className="text-sm text-muted-foreground">{street.status}</p>
                                </div>
                                <SeverityBadge severity={street.severity} />
                            </div>
                        ))}
                    </div>
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
