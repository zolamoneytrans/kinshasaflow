'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Landmark, 
  Calendar, 
  Bus, 
  UserCheck, 
  ShieldAlert, 
  Radio, 
  FileText,
  ExternalLink,
  ChevronRight,
  Info,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

type Category = 'Accord' | 'Flotte' | 'Sécurité' | 'Régulation' | 'Tarifs';

interface Annonce {
  id: string;
  category: Category;
  title: string;
  details: string;
  date: string;
  source: string[];
}

const announcements: Record<string, Annonce[]> = {
  '2026': [
    {
      id: '2026-1',
      category: 'Accord',
      title: 'Reprise du transport après accord gouvernement–chauffeurs (AC.CO)',
      details: "Suite à la grève sèche du 16 mars, le ministre provincial des Transports Jésus-Noël Sheke a conclu un accord avec l'Association des Chauffeurs du Congo (AC.CO). Les mesures incluent : suspension de certains contrôles contraignants, interdiction de l'usage abusif des « Mbasu » sur la chaussée, moratoire sur le contrôle de l'état des véhicules, et publication d'une circulaire officielle que les conducteurs pourront présenter aux agents de contrôle. Les activités ont repris le 17 mars.",
      date: '16–17 mars 2026',
      source: ['Strong2kin Moov', 'RTNC']
    },
    {
      id: '2026-2',
      category: 'Flotte',
      title: '800 bus prévus pour relancer la STK — annonce du gouverneur Bumba',
      details: "Le gouverneur Daniel Bumba a annoncé l'acquisition prochaine de 800 véhicules pour relancer la Société de transports de Kinshasa (STK), en marge de la grève des chauffeurs. Il a également rappelé que sur plus d'un million de véhicules recensés, environ 100 000 seulement sont en règle avec la vignette.",
      date: '16 mars 2026',
      source: ['Netic News (RTNC)']
    },
    {
      id: '2026-3',
      category: 'Flotte',
      title: 'Transco : objectif 2 000 bus en 5 ans — premier CODIR du nouveau DG',
      details: "Le directeur général ad intérim de Transco, Jérémie Kilubu, a annoncé lors de son premier Conseil de direction l'ambition d'atteindre une flotte de 2 000 bus sur cinq ans, conformément à la vision du Chef de l'État Félix Tshisekedi. Il a appelé l'ensemble du personnel à s'impliquer pour concrétiser cet objectif.",
      date: '6 mars 2026',
      source: ['Netic News']
    },
    {
      id: '2026-4',
      category: 'Sécurité',
      title: 'Géolocalisation et carte professionnelle obligatoires dès le 23 mars 2026',
      details: "Le gouverneur Daniel Bumba Lubaki a annoncé via communiqué officiel qu'à partir du 23 mars, tous les chauffeurs devront présenter leur carte professionnelle et chaque véhicule sera identifié et géolocalisé. Les véhicules non conformes seront immédiatement immobilisés et conduits en fourrière (RFCK). Les normes couvrent éclairage, rétroviseurs, pneumatiques et émissions. Cette mesure vise à contrer la recrudescence des enlèvements liés aux VTC.",
      date: '8 mars 2026',
      source: ['Radio Okapi', 'Congo Quotidien']
    },
    {
      id: '2026-5',
      category: 'Flotte',
      title: 'Acquisition de 1 000 bus TRANSCO via partenariat public-privé (Foton)',
      details: "Le gouvernement a annoncé un projet d'acquisition de 1 000 nouveaux bus de marque Foton via un partenariat public-privé pour renforcer le réseau de la société TRANSCO.",
      date: '9 février 2026',
      source: ['Gouvernement provincial de Kinshasa']
    },
    {
      id: '2026-6',
      category: 'Régulation',
      title: 'Déploiement de 3 000 agents de régulation mixtes',
      details: "Lancement d'une mission de grande envergure avec 3 000 agents mixtes pour lutter contre les embouteillages et contrôler la conformité des véhicules (permis, assurances, contrôle technique).",
      date: '26 janvier 2026',
      source: ['Gouvernement provincial de Kinshasa']
    },
    {
      id: '2026-7',
      category: 'Régulation',
      title: 'Restrictions horaires pour les poids lourds (Route Nationale 1)',
      details: "Le gouverneur a instauré une interdiction de circuler pour les véhicules de plus de 20 tonnes de 22h00 à 05h00 les lundis, mardis et mercredis sur certains axes majeurs comme la Route Nationale 1.",
      date: '19 janvier 2026',
      source: ['Gouvernement provincial de Kinshasa']
    }
  ],
  '2025': [
    {
      id: '2025-1',
      category: 'Sécurité',
      title: 'Permis de conduire biométrique : contrôle effectif lancé à Kinshasa',
      details: "Après deux faux départs, le contrôle du nouveau permis de conduire biométrique sécurisé avec puce a officiellement débuté le 17 novembre dans l'ensemble de la ville de Kinshasa. Les conducteurs sans ce document ne sont pas autorisés à circuler sous peine de sanctions. L'opération est conjointe entre la PNC et la Division urbaine des transports.",
      date: '17 novembre 2025',
      source: ['Actualite.cd', 'Congo Quotidien']
    },
    {
      id: '2025-2',
      category: 'Régulation',
      title: 'Contrôle technique obligatoire annuel — Opération « Tosa ba tosa yo »',
      details: "Lancée en septembre 2025 et rendue effective le 19 novembre, cette campagne impose un contrôle technique annuel obligatoire à tous les véhicules privés et publics. Tout véhicule défectueux est conduit en fourrière (RFCK). La mesure a été contestée juridiquement car elle contrevient aux périodicités fixées par la législation nationale.",
      date: '19 novembre 2025 (lancé le 29 sept. 2025)',
      source: ['Le Potentiel', 'Afrik-Info']
    },
    {
      id: '2025-3',
      category: 'Flotte',
      title: 'TRANSCO réceptionne 30 bus Mercedes-Benz (Suprême Automobile)',
      details: "Transco a réceptionné le 25 août 2025 un premier lot de 30 nouveaux bus Mercedes-Benz assemblés localement par Suprême Automobile à Kinshasa. Ce lot fait partie d'un partenariat visant 230 bus. Le plan d'investissement public 2025–2027 prévoit 82,5 millions USD pour l'acquisition de 750 bus supplémentaires et l'aménagement de garages de maintenance.",
      date: '25 août 2025',
      source: ['Radio Okapi', 'Bankable Africa']
    },
    {
      id: '2025-4',
      category: 'Tarifs',
      title: 'Nouvelle grille tarifaire des transports en commun — Arrêté du gouverneur',
      details: "Le gouverneur Bumba a publié le 7 janvier 2025 un arrêté provincial fixant de nouveaux tarifs officiels pour bus, mini-bus et taxi-bus sur l'ensemble de Kinshasa. Le tarif plancher est fixé à 500 FC ; les trajets longs (ex. Marché central–N'Djili) sont plafonnés à 1 000 FC. Le « demi-terrain » et les pratiques de sectionnement d'itinéraires sont expressément interdits. Amendes de 50 à 1 000 USD prévues en cas d'infraction. Tout conducteur doit afficher les tarifs et itinéraires à l'intérieur du véhicule.",
      date: '7–8 janvier 2025',
      source: ['ACP', 'Top Congo FM']
    }
  ]
};

const CategoryBadge = ({ category }: { category: Category }) => {
  const styles = {
    Accord: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
    Flotte: "bg-blue-500/10 text-blue-500 border-blue-500/20",
    Sécurité: "bg-red-500/10 text-red-500 border-red-500/20",
    Régulation: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    Tarifs: "bg-amber-500/10 text-amber-500 border-amber-500/20",
  };

  return (
    <Badge variant="outline" className={cn("text-[10px] font-black uppercase tracking-widest", styles[category])}>
      {category}
    </Badge>
  );
};

const AnnonceCard = ({ annonce }: { annonce: Annonce }) => (
  <Card className="border-none shadow-sm bg-slate-900/40 hover:bg-slate-900/60 transition-colors rounded-2xl overflow-hidden group">
    <CardContent className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <CategoryBadge category={annonce.category} />
        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
          <Calendar className="h-3 w-3" />
          {annonce.date}
        </div>
      </div>
      
      <h3 className="text-lg font-bold text-slate-100 group-hover:text-primary transition-colors leading-tight">
        {annonce.title}
      </h3>
      
      <p className="text-sm text-slate-400 leading-relaxed">
        {annonce.details}
      </p>
      
      <div className="pt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-slate-800/50">
        <span className="text-[10px] font-black uppercase text-slate-600 tracking-widest">Sources :</span>
        {annonce.source.map((s, i) => (
          <span key={i} className="text-[10px] font-bold text-primary flex items-center gap-1">
            <ChevronRight className="h-3 w-3" />
            {s}
          </span>
        ))}
      </div>
    </CardContent>
  </Card>
);

const StatCard = ({ icon: Icon, label, value, subLabel }: { icon: any, label: string, value: string | number, subLabel: string }) => (
  <Card className="bg-slate-900/50 border-none shadow-xl rounded-2xl">
    <CardContent className="p-6">
      <div className="flex items-start justify-between">
        <div className="space-y-4">
          <div className="p-2 bg-primary/10 rounded-xl w-fit">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <p className="text-3xl font-black text-white">{value}</p>
            <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest mt-1">{label}</p>
          </div>
        </div>
        <Badge variant="secondary" className="bg-slate-800 text-[10px] font-bold text-slate-400">{subLabel}</Badge>
      </div>
    </CardContent>
  </Card>
);

export default function AnnoncesFeed() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { toast } = useToast();

  const handleRefresh = () => {
    setIsRefreshing(true);
    // Simuler un appel API
    setTimeout(() => {
      setIsRefreshing(false);
      toast({
        title: "Données actualisées",
        description: "Les dernières annonces officielles ont été récupérées avec succès.",
      });
    }, 1500);
  };

  return (
    <div className="w-full h-full overflow-y-auto bg-slate-950/50">
      <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-12 pb-20">
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={FileText} label="Annonces" value="11" subLabel="2025–2026" />
          <StatCard icon={Bus} label="Bus annoncés" value="830" subLabel="(TRANSCO + STK)" />
          <StatCard icon={UserCheck} label="Agents déployés" value="3000" subLabel="Régulation" />
          <StatCard icon={Radio} label="Géolocalisation" value="23/03" subLabel="Dès mars 2026" />
        </div>

        {/* Section Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6">
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white flex items-center gap-3">
              <Landmark className="text-primary h-6 w-6" />
              Annonces Officielles (2025–2026)
            </h2>
            <p className="text-slate-500 text-sm font-medium">Mises à jour du gouvernement pour les automobilistes • Actualisé le 18 mars 2026</p>
          </div>
          <Button 
            variant="outline" 
            onClick={handleRefresh} 
            disabled={isRefreshing}
            className="rounded-xl border-primary/20 text-primary font-bold bg-primary/5 hover:bg-primary/10 h-11 px-6"
          >
            {isRefreshing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
            Actualiser
          </Button>
        </div>

        {/* Announcements by Year */}
        {Object.keys(announcements).sort((a, b) => parseInt(b) - parseInt(a)).map(year => (
          <div key={year} className="space-y-6">
            <div className="flex items-center gap-4">
              <span className="flex-none text-xl font-black text-primary">📌 Annonces de {year}</span>
              <div className="flex-1 h-px bg-gradient-to-r from-primary/30 to-transparent"></div>
            </div>
            
            <div className="grid gap-6">
              {announcements[year].map(annonce => (
                <AnnonceCard key={annonce.id} annonce={annonce} />
              ))}
            </div>
          </div>
        ))}

        {/* Footer Sources */}
        <Card className="bg-primary/5 border border-primary/10 rounded-2xl">
          <CardContent className="p-6 flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="bg-primary p-2 rounded-lg">
                <Info className="h-4 w-4 text-white" />
              </div>
              <p className="text-xs font-bold text-slate-400">
                Sources : Radio Okapi • RTNC • Actualite.cd • ACP • Congo Quotidien • Bankable Africa • Le Potentiel • Strong2kin Moov • Netic News • Top Congo FM
              </p>
            </div>
            <Button variant="outline" size="sm" className="rounded-xl border-primary/20 text-primary font-bold">
              Tous les arrêtés
              <ExternalLink className="ml-2 h-3 w-3" />
            </Button>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}