'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Landmark, Calendar, TrendingUp } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const announcements = {
  2025: [
    {
      date: "19 mai 2025",
      title: "Réforme de la circulation",
      details: "Restrictions pour camions et véhicules privés afin de réduire les embouteillages chroniques."
    },
    {
      date: "27 novembre 2025",
      title: "Modernisation du transport public",
      details: "Mise en place de taxis fluviaux, billetterie numérique, règles tarifaires renforcées et lutte contre les conducteurs non autorisés."
    },
    {
      date: "1er décembre 2025",
      title: "Collaboration avec les motocyclistes (Fenamo)",
      details: "Partenariat avec la Fédération nationale des motos-taxis pour restaurer discipline et solidarité dans le secteur."
    }
  ],
  2026: [
    {
      date: "9 février 2026",
      title: "Projet de 1 000 bus Transco",
      details: "Acquisition prévue de 1 000 bus Foton via un partenariat public-privé pour renforcer le transport collectif."
    },
    {
      date: "Début 2026 (suite des annonces de fin 2025)",
      title: "Transport électrique",
      details: "Lancement d’un projet ambitieux : 10 000 taxis, 100 000 motos et 500 bus électriques pour moderniser la mobilité et réduire les embouteillages."
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
    const years = Object.keys(announcements).sort((a, b) => parseInt(a) - parseInt(b));

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
                                {announcements[year as keyof typeof announcements].map((annonce, index) => (
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
                             <strong>2025 :</strong> Accent sur la régulation, la discipline et la diversification (taxis fluviaux, encadrement des motos-taxis).
                           </p>
                           <p>
                             <strong>2026 :</strong> Passage à des projets de grande envergure, avec une forte orientation vers la <strong>modernisation écologique</strong> (bus électriques, taxis et motos électriques) et l’expansion massive du transport collectif.
                           </p>
                           <Separator />
                           <p className="font-semibold">
                            En clair, Kinshasa est passée d’une phase de <strong>réorganisation et discipline</strong> en 2025 à une phase de <strong>modernisation et transition énergétique</strong> en 2026.
                           </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}