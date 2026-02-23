'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Landmark, Calendar, TrendingUp } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const announcements: Record<string, { date: string; title: string; details: string }[]> = {
  '2026': [
    {
      date: "9 février 2026",
      title: "Acquisition de 1 000 bus TRANSCO",
      details: "Le gouvernement a annoncé un projet d'acquisition de 1 000 nouveaux bus de marque Foton via un partenariat public-privé pour renforcer le réseau de la société TRANSCO."
    },
    {
      date: "26 janvier 2026",
      title: "Déploiement de 3 000 agents de régulation",
      details: "Lancement d'une mission de grande envergure avec 3 000 agents mixtes pour lutter contre les embouteillages et contrôler la conformité des véhicules (permis, assurances, contrôle technique)."
    },
    {
      date: "19 janvier 2026",
      title: "Restrictions horaires pour les poids lourds",
      details: "Le gouverneur a instauré une interdiction de circuler pour les véhicules de plus de 20 tonnes de 22h00 à 05h00 les lundis, mardis et mercredis sur certains axes majeurs comme la Route Nationale 1."
    },
    {
      date: "15 janvier 2026",
      title: "Réflexion scientifique sur la mobilité",
      details: "L'Université de Kinshasa (UNIKIN) a organisé un atelier pour proposer des solutions académiques et techniques aux problèmes de saturation du trafic urbain."
    }
  ],
  '2025': [
    {
      date: "29 décembre 2025",
      title: "Partenariat pour les véhicules électriques",
      details: "Signature d'un accord entre la ville de Kinshasa et le groupe Vingroup pour le déploiement de taxis et bus électriques VinFast, incluant la mise en place de bornes de recharge."
    },
    {
      date: "8 septembre 2025",
      title: "Reprise du train Kinshasa-Matadi",
      details: "Annonce de la reprise officielle du trafic ferroviaire entre Kinshasa et le port de Matadi par la SCTP (ex-ONATRA) pour désengorger la route."
    },
    {
      date: "12 mai 2025",
      title: "Avancement du projet MetroKin",
      details: "Confirmation du lancement de la première phase du train urbain (25 km reliant la Gare Centrale à l'aéroport de N'Djili). Le projet prévoit de transporter 520 000 passagers par jour."
    },
    {
      date: "10 mars 2025",
      title: "Alternance de sens unique sur Nguma",
      details: "Mise en place de mesures de circulation alternée sur les avenues Nguma et de la Tourisme pour fluidifier le trafic pendant les heures de pointe."
    }
  ]
};

const AnnonceItem = ({ annonce }: { annonce: { date: string; title: string; details: string } }) => {
    return (
        <div className="p-4 rounded-lg border bg-background transition-colors">
            <h3 className="font-semibold text-card-foreground mb-2">{annonce.title}</h3>
            <p className="text-sm text-muted-foreground mb-3 whitespace-pre-wrap">{annonce.details}</p>
            <div className="flex items-center text-xs text-muted-foreground">
                <Calendar className="h-4 w-4 mr-2" />
                <span>Publié le {annonce.date}</span>
            </div>
        </div>
    );
};

export default function AnnoncesFeed() {
    const years = Object.keys(announcements).sort((a, b) => parseInt(b) - parseInt(a));

    return (
        <Card className="flex-1 flex flex-col overflow-hidden">
            <CardHeader>
                <CardTitle>
                    <div className="flex items-center gap-2">
                        <Landmark className="text-primary" />
                        Annonces Officielles (2025-2026)
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto">
                <div className="space-y-8">
                    {years.map(year => (
                        <div key={year}>
                            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                                <span role="img" aria-label="pin">📌</span>
                                Annonces de {year}
                            </h2>
                            <div className="space-y-4">
                                {announcements[year].map((annonce, index) => (
                                    <AnnonceItem key={index} annonce={annonce} />
                                ))}
                            </div>
                        </div>
                    ))}

                    <Separator className="my-8" />
                    
                    <div>
                        <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
                            <TrendingUp className="text-primary" />
                            Évolution entre 2025 et 2026
                        </h2>
                        <div className="p-4 rounded-lg border bg-accent/50 text-accent-foreground space-y-4">
                           <p>
                             <strong>2025 :</strong> L'année a été marquée par des projets d'infrastructure majeurs (MetroKin, reprise du train Kinshasa-Matadi) et l'introduction de solutions de mobilité modernes (véhicules électriques, circulation alternée) pour désengorger la ville.
                           </p>
                           <p>
                             <strong>2026 :</strong> L'accent est mis sur la régulation et le renforcement. Des mesures strictes (restrictions pour poids lourds, déploiement d'agents) sont combinées à une expansion massive du transport en commun (1 000 bus TRANSCO) pour maîtriser le trafic.
                           </p>
                           <Separator />
                           <p className="font-semibold">
                            En clair, Kinshasa évolue d'une phase d'investissement dans de <strong>nouvelles infrastructures</strong> en 2025 vers une phase de <strong>régulation et de renforcement de l'existant</strong> en 2026.
                           </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
