'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Phone, MapPin, Shield, Building2 } from 'lucide-react';
import { PoliceStation } from '@/lib/types';

const kinshasaPoliceStations: PoliceStation[] = [
  { commune: "Bandalungwa", name: "Commissariat de Bandalungwa", phone: "+243810000001", address: "Av. de la Libération, Bandal" },
  { commune: "Barumbu", name: "Commissariat de Barumbu", phone: "+243810000002", address: "Av. Kasa-Vubu, Barumbu" },
  { commune: "Bumbu", name: "Commissariat de Bumbu", phone: "+243810000003", address: "Q. Bumbu, Zone de Bumbu" },
  { commune: "Gombe", name: "Commissariat Central de la Gombe", phone: "+243810000004", address: "Av. de la Justice, Gombe" },
  { commune: "Kalamu", name: "Commissariat de Kalamu (Victoire)", phone: "+243810000005", address: "Rond-point Victoire, Kalamu" },
  { commune: "Kasa-Vubu", name: "Commissariat de Kasa-Vubu", phone: "+243810000006", address: "Av. de l'Enseignement, Kasa-Vubu" },
  { commune: "Kimbanseke", name: "Commissariat de Kimbanseke", phone: "+243810000007", address: "Q. Kimbanseke, Masina/Kimbanseke" },
  { commune: "Kinshasa", name: "Commissariat de la Commune de Kinshasa", phone: "+243810000008", address: "Av. Luambo Makiadi, Kinshasa" },
  { commune: "Kintambo", name: "Commissariat de Kintambo", phone: "+243810000009", address: "Av. Bangala, Kintambo" },
  { commune: "Kisenso", name: "Commissariat de Kisenso", phone: "+243810000010", address: "Q. Kisenso, Zone Sud" },
  { commune: "Lemba", name: "Commissariat de Lemba", phone: "+243810000011", address: "Echangeur de Lemba, Lemba" },
  { commune: "Limete", name: "Commissariat de Limete", phone: "+243810000012", address: "12ème Rue, Limete Industriel" },
  { commune: "Lingwala", name: "Commissariat de Lingwala", phone: "+243810000013", address: "Av. Pierre Mulele, Lingwala" },
  { commune: "Makala", name: "Commissariat de Makala", phone: "+243810000014", address: "Av. de l'Université, Makala" },
  { commune: "Maluku", name: "Commissariat de Maluku", phone: "+243810000015", address: "Route Nationale 1, Maluku" },
  { commune: "Masina", name: "Commissariat de Masina", phone: "+243810000016", address: "Boulevard Lumumba, Masina" },
  { commune: "Matete", name: "Commissariat de Matete", phone: "+243810000017", address: "Q. Matete, Zone Est" },
  { commune: "Mont-Ngafula", name: "Commissariat de Mont-Ngafula", phone: "+243810000018", address: "Route de Matadi, Mont-Ngafula" },
  { commune: "N'djili", name: "Commissariat de N'djili", phone: "+243810000019", address: "Sainte Thérèse, N'djili" },
  { commune: "N'sele", name: "Commissariat de la N'sele", phone: "+243810000020", address: "Kinkole, N'sele" },
  { commune: "Ngaba", name: "Commissariat de Ngaba", phone: "+243810000021", address: "Av. de l'Université, Ngaba" },
  { commune: "Ngaliema", name: "Commissariat de Ngaliema", phone: "+243810000022", address: "Av. de la Montagne, Ngaliema" },
  { commune: "Ngiri-Ngiri", name: "Commissariat de Ngiri-Ngiri", phone: "+243810000023", address: "Av. de la Libération, Ngiri-Ngiri" },
  { commune: "Selembao", name: "Commissariat de Selembao", phone: "+243810000024", address: "Cité Salongo, Selembao" },
];

export default function PoliceDirectory() {
  const [searchTerm, setSearchQuery] = useState('');

  const filteredStations = kinshasaPoliceStations.filter(station =>
    station.commune.toLowerCase().includes(searchTerm.toLowerCase()) ||
    station.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-destructive/10 border-destructive/20">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-destructive flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Numéros d'Urgence
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 space-y-2">
            <div className="flex justify-between items-center bg-background/50 p-2 rounded-lg">
              <span className="font-bold">Police Nationale (PNC)</span>
              <Button asChild variant="destructive" size="sm">
                <a href="tel:112"><Phone className="h-4 w-4 mr-2"/> 112</a>
              </Button>
            </div>
            <div className="flex justify-between items-center bg-background/50 p-2 rounded-lg">
              <span className="font-bold">Intervention Rapide</span>
              <Button asChild variant="destructive" size="sm">
                <a href="tel:117"><Phone className="h-4 w-4 mr-2"/> 117</a>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-primary/10 border-primary/20">
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-primary flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Besoin d'aide ?
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0">
            <p className="text-sm text-muted-foreground leading-tight">
              Recherchez votre commune ci-dessous pour contacter le commissariat local le plus proche.
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Rechercher par commune (ex: Gombe, Limete...)"
          className="pl-10 h-12 text-lg shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredStations.length > 0 ? (
          filteredStations.map((station, index) => (
            <Card key={index} className="group hover:border-primary/50 transition-all shadow-sm">
              <CardHeader className="p-4 pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">{station.name}</CardTitle>
                    <CardDescription className="font-bold text-xs uppercase tracking-wider text-primary/70">{station.commune}</CardDescription>
                  </div>
                  <div className="p-2 bg-muted rounded-full group-hover:bg-primary/10 transition-colors">
                    <Shield className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3">
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                  <span>{station.address}</span>
                </div>
                <Button asChild className="w-full shadow-lg shadow-primary/10">
                  <a href={`tel:${station.phone}`}>
                    <Phone className="h-4 w-4 mr-2" />
                    Appeler le Commissariat
                  </a>
                </Button>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full py-12 text-center text-muted-foreground italic">
            Aucun résultat pour "{searchTerm}". Vérifiez l'orthographe de la commune.
          </div>
        )}
      </div>
    </div>
  );
}
