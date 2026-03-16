'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Activity, Bot, Megaphone, Siren, Download, ArrowRight, MapPin, ShieldCheck, Zap } from 'lucide-react';
import { Button } from './ui/button';
import { Logo } from './logo';
import React, { useState, useEffect } from 'react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Badge } from './ui/badge';

// Import de l'image personnalisée echangeur2 depuis le dossier src/myimages
import echangeurBg from '@/myimages/echangeur2.png';

const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
        opacity: 1,
        transition: {
            staggerChildren: 0.15,
        },
    },
};

const itemVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
};

const FeatureCard = ({ icon, title, description, color }: { icon: React.ReactNode, title: string, description: string, color: string }) => (
    <motion.div
        variants={itemVariants}
        whileHover={{ y: -10, transition: { duration: 0.2 } }}
        className="group bg-card/60 backdrop-blur-xl p-8 rounded-2xl border border-primary/10 shadow-xl hover:shadow-2xl hover:bg-card/80 transition-all cursor-default"
    >
        <div className={`inline-flex p-4 rounded-xl mb-6 transition-transform group-hover:scale-110 group-hover:rotate-3 shadow-lg ${color}`}>
            {icon}
        </div>
        <h3 className="text-xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors">{title}</h3>
        <p className="text-muted-foreground leading-relaxed text-sm">{description}</p>
    </motion.div>
);

export default function WelcomePage() {
    const [installPrompt, setInstallPrompt] = useState<any>(null);
    const heroImage = PlaceHolderImages.find(img => img.id === 'kinshasa-hero');

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
            setInstallPrompt(null);
        });
    };

    return (
        <div className="relative min-h-screen w-full bg-background text-foreground overflow-x-hidden flex flex-col">
            {/* Dots Background - Couche la plus basse */}
            <div className="absolute inset-0 -z-30 h-full w-full bg-[radial-gradient(hsl(var(--primary))_0.5px,transparent_0.5px)] [background-size:24px_24px] opacity-[0.15] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
            
            {/* Mesh Gradients - Couche intermédiaire */}
            <div className="absolute top-[-5%] left-[-5%] -z-20 h-[600px] w-[600px] rounded-full bg-primary/25 blur-[120px] animate-pulse"></div>
            <div className="absolute top-[20%] right-[-10%] -z-20 h-[500px] w-[500px] rounded-full bg-accent/15 blur-[130px]"></div>
            <div className="absolute bottom-[-10%] left-[10%] -z-20 h-[600px] w-[600px] rounded-full bg-blue-400/20 blur-[150px]"></div>

            {/* Arrière-plan personnalisé (Echangeur 2) - Positionné pour une visibilité maximale derrière le titre */}
            <div className="absolute top-[10%] left-1/2 -translate-x-1/2 -z-10 w-full max-w-6xl h-[600px] opacity-50 pointer-events-none flex items-center justify-center">
                <Image 
                    src={echangeurBg} 
                    alt="Echangeur Kinshasa Background" 
                    fill 
                    className="object-contain"
                    priority
                />
            </div>

            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="container mx-auto p-6 flex justify-between items-center z-50"
            >
                <Logo className="h-10 w-auto text-primary" />
                <div className="flex items-center gap-4">
                    <Button asChild variant="ghost" className="hidden sm:inline-flex hover:bg-primary/10">
                        <Link href="/login">Se connecter</Link>
                    </Button>
                    <Button asChild className="shadow-lg shadow-primary/20">
                        <Link href="/signup">Commencer</Link>
                    </Button>
                </div>
            </motion.header>

            <main className="container mx-auto px-4 py-12 md:py-20 text-center flex-grow flex flex-col items-center justify-center gap-16 relative z-10">
                 <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="max-w-4xl"
                >
                    <motion.div variants={itemVariants} className="flex justify-center mb-6">
                        <Badge variant="outline" className="px-4 py-1.5 border-primary/30 bg-primary/10 text-primary text-sm font-semibold rounded-full animate-bounce shadow-sm">
                            <Zap className="w-3 h-3 mr-2 fill-current" />
                            Votre copilote intelligent sur les routes de Kinshasa
                        </Badge>
                    </motion.div>

                    <motion.h1 variants={itemVariants} className="text-5xl md:text-8xl font-black tracking-tighter text-foreground mb-8 leading-[1.1]">
                        Naviguez <span className="text-primary bg-clip-text text-transparent bg-gradient-to-r from-primary to-blue-600">Kinshasa</span><br /> 
                        <span className="relative inline-block">
                            sans stress.
                            <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 338 12" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M1 10C56.3333 3.66667 188.6 -5.2 337 10" stroke="hsl(var(--accent))" strokeWidth="6" strokeLinecap="round"/>
                            </svg>
                        </span>
                    </motion.h1>

                    <motion.p variants={itemVariants} className="max-w-2xl mx-auto text-xl md:text-2xl text-muted-foreground mb-12 font-medium leading-relaxed">
                        Évitez les bouchons et trouvez vos meilleurs itinéraires avec notre assistant IA. Le futur de la mobilité urbaine est ici.
                    </motion.p>

                    <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-center gap-6">
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button asChild size="lg" className="text-xl py-8 px-10 rounded-2xl shadow-2xl shadow-primary/30 group">
                                <Link href="/reports">
                                    Accéder au Direct
                                    <ArrowRight className="ml-2 w-6 h-6 transition-transform group-hover:translate-x-1" />
                                </Link>
                            </Button>
                        </motion.div>
                        
                        {installPrompt && (
                             <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                                <Button onClick={handleInstallClick} size="lg" variant="outline" className="text-xl py-8 px-10 rounded-2xl border-2 border-primary/20 bg-card/50 backdrop-blur-sm shadow-sm hover:bg-primary/5">
                                    <Download className="mr-2 h-6 w-6" />
                                    Installer l'app
                                </Button>
                            </motion.div>
                        )}
                    </motion.div>
                </motion.div>

                {heroImage && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 40 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        transition={{ delay: 0.8, duration: 1, ease: "easeOut" }}
                        className="w-full max-w-5xl px-4 relative group"
                    >
                        <div className="absolute -inset-2 bg-gradient-to-r from-primary via-accent to-blue-400 rounded-[2.5rem] blur-xl opacity-20 group-hover:opacity-40 transition duration-1000"></div>
                        <div className="relative aspect-video rounded-[2rem] overflow-hidden shadow-2xl border-4 border-white/50 ring-1 ring-white/20">
                            <Image 
                                src={heroImage.imageUrl} 
                                alt={heroImage.description} 
                                fill 
                                className="object-cover"
                                style={{ transition: 'transform 10s linear' }}
                                priority
                                data-ai-hint={heroImage.imageHint}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                            <div className="absolute bottom-8 left-8 text-left text-white">
                                <p className="text-xs font-bold uppercase tracking-widest text-accent mb-2">Ville de Kinshasa</p>
                                <h4 className="text-2xl font-bold flex items-center gap-2 drop-shadow-md"><MapPin className="w-5 h-5 text-accent"/> Une vision aérienne de la capitale</h4>
                            </div>
                        </div>
                    </motion.div>
                )}
            </main>

            <motion.section 
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.1 }}
                variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
                className="container mx-auto px-4 py-24"
            >
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <FeatureCard
                        icon={<Activity size={32} className="text-white" />}
                        title="Trafic en Temps Réel"
                        description="Vivez l'info trafic en direct grâce aux rapports communautaires vérifiés."
                        color="bg-red-500 shadow-red-200"
                    />
                    <FeatureCard
                        icon={<ShieldCheck size={32} className="text-white" />}
                        title="Alertes Sécurité"
                        description="Soyez prévenu de la présence policière et des zones de contrôle."
                        color="bg-primary shadow-blue-200"
                    />
                    <FeatureCard
                        icon={<Megaphone size={32} className="text-white" />}
                        title="Annonces Officielles"
                        description="Les dernières communications de l'Hôtel de Ville directement sur votre écran."
                        color="bg-orange-500 shadow-orange-200"
                    />
                    <FeatureCard
                        icon={<Bot size={32} className="text-white" />}
                        title="Assistant IA Vocal"
                        description="L'IA qui vous répond et vous guide oralement en Français et en Lingala."
                        color="bg-accent shadow-yellow-200"
                    />
                </div>
            </motion.section>
            
            <motion.footer 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5, delay: 1 }}
                className="text-center p-12 border-t border-primary/10 bg-card/40 backdrop-blur-md"
            >
                <div className="flex flex-col items-center gap-6">
                    <Logo className="h-8 w-auto text-muted-foreground opacity-60" />
                    <p className="text-sm text-muted-foreground max-w-sm font-medium">
                        Simplifier la vie des Kinois, un kilomètre à la fois.
                    </p>
                    <a href="http://www.swaziapplilab.co.za" target="_blank" rel="noopener noreferrer" className="text-xs font-semibold hover:text-primary transition-colors">
                        &copy; {new Date().getFullYear()} Swazi Appli Lab sarl. Tous droits réservés.
                    </a>
                </div>
            </motion.footer>
        </div>
    );
}
