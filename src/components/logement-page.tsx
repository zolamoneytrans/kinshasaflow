'use client';

import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, Users, Target, ListChecks, Home as HomeIcon } from 'lucide-react';
import { motion } from 'framer-motion';
import Image from 'next/image';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const InfoCard = ({ icon, title, items }: { icon: React.ReactNode, title: string, items: string[] }) => (
    <Card className="h-full bg-card/50 backdrop-blur-sm">
        <CardContent className="pt-6">
             <h3 className="font-bold text-xl mb-4 flex items-center gap-3">{icon} {title}</h3>
            <ul className="space-y-3">
                {items.map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                        <CheckCircle className="h-5 w-5 text-primary mt-0.5 shrink-0" />
                        <span className="text-muted-foreground">{item}</span>
                    </li>
                ))}
            </ul>
        </CardContent>
    </Card>
);


export default function LogementPage() {
    const objectifItems = [
        "Trouver facilement un appartement",
        "Réserver en toute sécurité",
        "Payer en ligne"
    ];

    const fonctionnalitesItems = [
        "Publication de logements",
        "Photos et vidéos",
        "Géolocalisation",
        "Réservation directe",
        "Paiement sécurisé",
        "Notation des hôtes"
    ];

    const ciblesItems = [
        "Diaspora",
        "Expatriés",
        "Voyageurs professionnels",
        "Couples",
        "Touristes"
    ];

    return (
        <div className="w-full h-full overflow-y-auto pr-2">
            <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-8"
            >
                <motion.div variants={itemVariants}>
                    <Card className="overflow-hidden">
                        <div className="grid md:grid-cols-2 items-center">
                             <div className="p-8">
                                <h1 className="text-3xl font-bold mb-2 flex items-center gap-2"><HomeIcon className="h-8 w-8 text-primary"/>Location Courte Durée</h1>
                                <p className="text-lg text-muted-foreground mb-6">(Type RBNB)</p>
                                <p className="text-foreground/90 leading-relaxed">
                                    Bientôt sur Kinshasa Flow : un service dédié pour permettre aux visiteurs, expatriés et à la diaspora de trouver et réserver facilement des logements pour de courts séjours à Kinshasa.
                                </p>
                            </div>
                            <div className="relative h-64 md:h-full min-h-[250px] md:min-h-[300px]">
                                <Image
                                    src="https://picsum.photos/seed/kinshasa-apt/800/600"
                                    alt="Appartement moderne à Kinshasa"
                                    fill
                                    className="object-cover"
                                    data-ai-hint="modern apartment"
                                />
                            </div>
                        </div>
                    </Card>
                </motion.div>

                <motion.div 
                    className="grid md:grid-cols-1 lg:grid-cols-3 gap-6"
                    variants={containerVariants}
                >
                    <motion.div variants={itemVariants}>
                        <InfoCard icon={<Target className="text-primary"/>} title="Objectif" items={objectifItems} />
                    </motion.div>
                    <motion.div variants={itemVariants}>
                         <InfoCard icon={<ListChecks className="text-primary"/>} title="Fonctionnalités" items={fonctionnalitesItems} />
                    </motion.div>
                    <motion.div variants={itemVariants}>
                        <InfoCard icon={<Users className="text-primary"/>} title="Cibles" items={ciblesItems} />
                    </motion.div>
                </motion.div>

            </motion.div>
        </div>
    );
}
