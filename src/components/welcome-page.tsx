'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Activity, Bot, Megaphone, Siren, Download } from 'lucide-react';
import { Button } from './ui/button';
import { Logo } from './logo';
import React, { useState, useEffect } from 'react';

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

const featureCardVariants = {
    hidden: { opacity: 0, y: 50 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
}

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
    <motion.div
        variants={featureCardVariants}
        className="bg-card/50 backdrop-blur-sm p-6 rounded-lg border border-border/20 text-center"
    >
        <div className="inline-block p-4 bg-primary/10 text-primary rounded-full mb-4">
            {icon}
        </div>
        <h3 className="text-xl font-bold mb-2 text-foreground">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
    </motion.div>
);

export default function WelcomePage() {
    const [installPrompt, setInstallPrompt] = useState<any>(null);

    useEffect(() => {
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setInstallPrompt(e);
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = () => {
        if (!installPrompt) return;
        installPrompt.prompt();
        installPrompt.userChoice.then((choiceResult: { outcome: string }) => {
            if (choiceResult.outcome === 'accepted') {
                console.log('User accepted the install prompt');
            } else {
                console.log('User dismissed the install prompt');
            }
            setInstallPrompt(null);
        });
    };

    return (
        <div className="min-h-screen w-full bg-background text-foreground overflow-hidden flex flex-col">
            <div className="absolute inset-0 -z-10 h-full w-full bg-background bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:14px_24px]">
                <div className="absolute left-0 right-0 top-0 -z-10 m-auto h-[310px] w-[310px] rounded-full bg-primary/20 opacity-20 blur-[100px]"></div>
            </div>
            
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="p-4 flex justify-between items-center"
            >
                <Logo className="h-9 w-auto text-primary" />
                 <Button asChild variant="ghost">
                    <Link href="/login">Se connecter</Link>
                </Button>
            </motion.header>

            <main className="container mx-auto px-4 py-16 md:py-24 text-center flex-grow flex items-center justify-center">
                 <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="max-w-3xl"
                >
                    <motion.div variants={itemVariants}>
                        <Badge className="mb-4 bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">Votre copilote pour les routes de Kinshasa</Badge>
                    </motion.div>
                    <motion.h1 variants={itemVariants} className="text-4xl md:text-6xl font-bold tracking-tight text-foreground mb-6">
                        Naviguez Kinshasa,<br /> sans embouteillage.
                    </motion.h1>
                    <motion.p variants={itemVariants} className="max-w-2xl mx-auto text-lg md:text-xl text-muted-foreground mb-10">
                        Recevez des mises à jour sur le trafic en temps réel, signalez les incidents et utilisez notre assistant IA pour trouver le meilleur itinéraire. Roulez plus intelligemment avec Kinshasa Flow.
                    </motion.p>
                    <motion.div variants={itemVariants} className="flex flex-wrap justify-center gap-4">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                        >
                            <Button asChild size="lg" className="text-lg py-7 px-8">
                                <Link href="/reports">Entrer dans l'application</Link>
                            </Button>
                        </motion.div>
                        {installPrompt && (
                             <motion.div
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                            >
                                <Button onClick={handleInstallClick} size="lg" variant="outline" className="text-lg py-7 px-8">
                                    <Download className="mr-2 h-5 w-5" />
                                    Installer l'app
                                </Button>
                            </motion.div>
                        )}
                    </motion.div>
                </motion.div>
            </main>

            <motion.section 
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                variants={{ visible: { transition: { staggerChildren: 0.2 } } }}
                className="container mx-auto px-4 pb-16"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <FeatureCard
                        icon={<Activity size={28} />}
                        title="Trafic en Temps Réel"
                        description="Visualisez les embouteillages et les rapports d'incidents partagés par la communauté."
                    />
                    <FeatureCard
                        icon={<Siren size={28} />}
                        title="Alertes Police"
                        description="Restez informé de la présence policière, des contrôles et des interventions."
                    />
                    <FeatureCard
                        icon={<Megaphone size={28} />}
                        title="Annonces Officielles"
                        description="Accédez aux dernières communications des autorités concernant la circulation."
                    />
                    <FeatureCard
                        icon={<Bot size={28} />}
                        title="Assistant IA"
                        description="Demandez le meilleur itinéraire en français ou lingala et laissez notre IA vous guider."
                    />
                </div>
            </motion.section>
            
            <motion.footer 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
                className="text-center p-6 text-sm text-muted-foreground"
            >
                <a href="http://www.swaziapplilab.co.za" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
                    &copy; {new Date().getFullYear()} Swazi Appli Lab sarl
                </a>
            </motion.footer>
        </div>
    );
}

// Temporary Badge component to avoid full import
const Badge = ({className, children}: {className?: string, children: React.ReactNode}) => (
    <span className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors ${className}`}>
        {children}
    </span>
);
