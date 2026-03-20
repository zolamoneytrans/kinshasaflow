'use client';

import { AppShell } from "@/components/app-shell";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, FileText, Scale, Info } from "lucide-react";

export default function PrivacyPage() {
  return (
    <AppShell>
      <div className="w-full h-full overflow-y-auto bg-slate-50/50 pb-20">
        <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-8">
          <div className="text-center space-y-2">
            <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-slate-900">
              Cadre Légal & <span className="text-primary">Confidentialité</span>
            </h1>
            <p className="text-muted-foreground font-medium italic">
              Dernière mise à jour : 20 mars 2026 • Version 1.0
            </p>
          </div>

          <Card className="border-none shadow-xl rounded-[2rem] overflow-hidden bg-white">
            <CardHeader className="bg-primary p-8 text-white">
              <div className="flex items-center gap-4">
                <div className="bg-white/20 p-3 rounded-2xl backdrop-blur-md">
                  <Shield className="h-8 w-8 text-white" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-black">Kinshasa Flow</CardTitle>
                  <p className="text-primary-foreground/80 font-bold uppercase tracking-widest text-[10px]">
                    www.kinshasaflow.online
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-8 md:p-12">
              <div className="prose prose-slate max-w-none space-y-12 text-slate-700 leading-relaxed">
                
                <section className="bg-slate-50 p-6 rounded-2xl border border-slate-100 flex items-start gap-4">
                  <Info className="h-6 w-6 text-primary shrink-0 mt-1" />
                  <div>
                    <h3 className="text-lg font-black text-slate-900 mb-2 uppercase tracking-tight">Base Juridique</h3>
                    <p className="text-sm font-medium">
                      Conforme à l'Ordonnance-Loi n° 23/010 portant Code du Numérique de la République Démocratique du Congo, notamment les Livres I et III.
                    </p>
                  </div>
                </section>

                <div className="space-y-8">
                  <div className="flex items-center gap-3 border-b-2 border-primary/10 pb-2">
                    <FileText className="text-primary h-6 w-6" />
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">PARTIE I : Politique de Confidentialité</h2>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-800">Article 1. Identité du responsable de traitement</h3>
                    <p>
                      La plateforme KinshasaFlow, accessible à l'adresse www.kinshasaflow.online, est éditée et exploitée par l'équipe KinshasaFlow, ci-après dénommé "le Responsable de traitement" ou "KinshasaFlow".
                    </p>
                    <div className="bg-slate-50 p-4 rounded-xl text-sm space-y-1 border border-slate-100 font-medium">
                      <p><strong>Dénomination :</strong> KinshasaFlow</p>
                      <p><strong>Site web :</strong> www.kinshasaflow.online</p>
                      <p><strong>Contact :</strong> kinshasaflow@gmail.com</p>
                      <p><strong>Adresse :</strong> Av. de l’église/ C/Basoko Q/Ngaliema</p>
                      <p><strong>Pays :</strong> République Démocratique du Congo</p>
                    </div>

                    <h3 className="text-xl font-bold text-slate-800">Article 2. Objet de la politique de confidentialité</h3>
                    <p>
                      La présente Politique de confidentialité a pour objet d'informer les utilisateurs de la plateforme KinshasaFlow des conditions dans lesquelles leurs données à caractère personnel sont collectées, traitées, conservées et protégées, conformément aux dispositions du Code du Numérique de la RDC.
                    </p>

                    <h3 className="text-xl font-bold text-slate-800">Article 3. Données collectées</h3>
                    <div className="space-y-4">
                      <p><strong>3.1 Données collectées de manière automatique</strong></p>
                      <ul className="list-disc list-inside space-y-1 pl-4">
                        <li>Adresse IP, navigateur et système d'exploitation.</li>
                        <li>Pages consultées et durée de visite.</li>
                        <li>Date et heure de connexion.</li>
                      </ul>
                      <p><strong>3.2 Données fournies volontairement</strong></p>
                      <p>Nom, prénom, adresse e-mail, numéro de téléphone et toute information communiquée volontairement.</p>
                      <p><strong>3.3 Données de localisation</strong></p>
                      <p>KinshasaFlow peut, avec votre consentement explicite, accéder à vos données de localisation géographique pour fournir des informations de trafic pertinentes.</p>
                    </div>

                    <h3 className="text-xl font-bold text-slate-800">Article 10. Droits de l'utilisateur</h3>
                    <p>Conformément aux Articles 209 à 216 du Code du Numérique, vous disposez d'un droit d'accès, de rectification, d'effacement ("droit à l'oubli"), d'opposition et à la portabilité de vos données.</p>
                  </div>
                </div>

                <div className="space-y-8 pt-8">
                  <div className="flex items-center gap-3 border-b-2 border-primary/10 pb-2">
                    <Scale className="text-primary h-6 w-6" />
                    <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tighter">PARTIE II : Conditions Générales d'Utilisation</h2>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-xl font-bold text-slate-800">Article 14. Présentation de KinshasaFlow</h3>
                    <p>
                      KinshasaFlow est une plateforme numérique de surveillance et de diffusion d'informations sur le trafic routier en temps réel dans la ville de Kinshasa.
                    </p>

                    <h3 className="text-xl font-bold text-slate-800">Article 16. Obligations de l'utilisateur</h3>
                    <p>L'utilisateur s'engage à utiliser le service à des fins licites, à ne pas tenter d'intrusion et à ne pas usurper d'identité.</p>

                    <h3 className="text-xl font-bold text-slate-800">Article 21. Droit applicable</h3>
                    <p>Les présentes CGU sont soumises au droit congolais. Tout litige sera soumis à la juridiction compétente en République Démocratique du Congo.</p>
                  </div>
                </div>

                <footer className="pt-12 border-t border-slate-100 text-center space-y-4">
                  <p className="text-sm font-black uppercase tracking-widest text-slate-400">Nous Contacter</p>
                  <div className="flex flex-col md:flex-row justify-center items-center gap-6">
                    <a href="mailto:kinshasaflow@gmail.com" className="text-primary font-bold hover:underline">kinshasaflow@gmail.com</a>
                    <span className="hidden md:block text-slate-300">|</span>
                    <a href="tel:+26878515970" className="text-slate-600 font-bold">+268 78515970</a>
                  </div>
                </footer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
