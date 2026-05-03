'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Activity, Bot, Megaphone, Download, ArrowRight, MapPin, ShieldCheck, Zap, Car, Shield, Monitor, Laptop } from 'lucide-react';
import { Button } from './ui/button';
import { Logo } from './logo';
import React, { useState, useEffect } from 'react';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Badge } from './ui/badge';

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
        whileHover={{ 
            y: -12, 
            scale: 1.02,
            transition: { duration: 0.3, ease: "backOut" } 
        }}
        className="group bg-card/60 backdrop-blur-xl p-8 rounded-3xl border border-primary/10 shadow-xl hover:shadow-2xl hover:bg-card/80 transition-all cursor-default"
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
    const heroImageData = PlaceHolderImages.find(img => img.id === 'kinshasa-hero');
    
    // Fallback image urls if custom images are not provided
    const echangeurBgUrl = "https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&q=80&w=1200";
    const heroImageUrl = "https://images.unsplash.com/photo-1449824913935-59a10b8d2000?auto=format&fit=crop&q=80&w=1600";

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

    const handleInstallClick = async () => {
        if (!installPrompt) {
            alert("Pour installer Kinshasa Flow sur Windows ou Mac :\n1. Utilisez Google Chrome ou Edge.\n2. Cliquez sur l'icône d'ordinateur avec une flèche dans la barre d'adresse.");
            return;
        }
        await installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        console.log(`[PWA] Install outcome: ${outcome}`);
        setInstallPrompt(null);
    };

    return (
        <div className="relative min-h-screen w-full text-foreground overflow-x-hidden flex flex-col">
            {/* --- BACKGROUND LAYERS --- */}
            <div className="fixed inset-0 -z-50 bg-background"></div>
            <div className="fixed inset-0 -z-40 bg-[radial-gradient(hsl(var(--primary))_0.5px,transparent_0.5px)] [background-size:24px_24px] opacity-[0.12]"></div>
            
            <div className="fixed top-[-5%] left-[-5%] -z-30 h-[600px] w-[600px] rounded-full bg-primary/15 blur-[120px] pointer-events-none"></div>
            <div className="fixed top-[30%] right-[-10%] -z-30 h-[500px] w-[500px] rounded-full bg-accent/10 blur-[130px] pointer-events-none"></div>
            <div className="fixed bottom-[-10%] left-[10%] -z-30 h-[600px] w-[600px] rounded-full bg-blue-400/10 blur-[150px] pointer-events-none"></div>

            <div className="fixed inset-0 -z-20 pointer-events-none overflow-hidden">
                <Image
                    src={echangeurBgUrl}
                    alt=""
                    fill
                    className="object-cover object-center"
                    style={{ opacity: 0.15 }}
                    priority
                    data-ai-hint="city traffic"
                />
            </div>

            {/* --- PAGE CONTENT --- */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="container mx-auto p-6 flex justify-between items-center z-50"
            >
                <Logo className="h-10 w-auto text-primary" />
                <div className="flex items-center gap-4">
                    <Link href="/login">
                        <Button variant="ghost" className="hidden sm:inline-flex hover:bg-primary/10">
                            Se connecter
                        </Button>
                    </Link>
                    <Link href="/signup">
                        <Button className="shadow-lg shadow-primary/20">
                            Commencer
                        </Button>
                    </Link>
                </div>
            </motion.header>

            <main className="container mx-auto px-4 py-8 md:py-16 text-center flex-grow flex flex-col items-center justify-center gap-12 relative z-10">
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
                            <Link href="/reports">
                                <Button size="lg" className="text-xl py-8 px-10 rounded-2xl shadow-2xl shadow-primary/30 group">
                                    Accéder au Direct
                                    <ArrowRight className="ml-2 w-6 h-6 transition-transform group-hover:translate-x-1" />
                                </Button>
                            </Link>
                        </motion.div>
                        
                        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                            <Button onClick={handleInstallClick} size="lg" variant="outline" className="text-xl py-8 px-10 rounded-2xl border-2 border-primary/20 bg-card/50 backdrop-blur-sm shadow-sm hover:bg-primary/5 group">
                                <Laptop className="mr-2 h-6 w-6 text-primary group-hover:animate-bounce" />
                                Télécharger pour Windows/Mac
                            </Button>
                        </motion.div>
                    </motion.div>
                </motion.div>

                {/* Hero Image Container */}
                <div className="w-full max-w-7xl px-4 flex flex-col items-center gap-12 group">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 40 }}
                        whileInView={{ opacity: 1, scale: 1, y: 0 }}
                        viewport={{ once: true, amount: 0.3 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.98 }}
                        transition={{ 
                            type: "spring", 
                            stiffness: 260, 
                            damping: 20,
                            opacity: { duration: 0.8 },
                            y: { duration: 0.8 }
                        }}
                        className="relative w-full cursor-pointer"
                    >
                        <div className="absolute -inset-4 bg-gradient-to-r from-primary via-accent to-blue-400 rounded-[2.5rem] blur-2xl opacity-15 group-hover:opacity-30 transition duration-1000"></div>
                        <div className="relative aspect-[4/3] md:aspect-video lg:aspect-[21/9] rounded-[2.5rem] overflow-hidden shadow-2xl border-4 border-white/50 ring-1 ring-white/20 bg-white">
                            <Image 
                                src={heroImageUrl} 
                                alt={heroImageData?.description || "Kinshasa Flow Hero"} 
                                fill 
                                className="object-cover transition-transform duration-700 group-hover:scale-105"
                                priority
                                data-ai-hint="city roads"
                            />
                        </div>
                    </motion.div>
                    
                    <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.5, duration: 0.6 }}
                        className="text-center md:text-left md:self-start bg-white/60 backdrop-blur-xl p-6 md:p-8 rounded-2xl border border-white/50 shadow-sm md:ml-10 z-20 relative"
                    >
                        <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-primary mb-1">Ville de Kinshasa</p>
                        <h4 className="text-lg md:text-2xl font-bold flex items-center justify-center md:justify-start gap-2">
                            <Monitor className="w-4 h-4 md:w-6 md:h-6 text-primary animate-pulse"/> 
                            Logiciel disponible sur PC & Mac
                        </h4>
                    </motion.div>
                </div>
            </main>

            <motion.section 
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.1 }}
                variants={{ 
                    hidden: { opacity: 1 }, 
                    visible: { transition: { staggerChildren: 0.1 } } 
                }}
                className="container mx-auto px-4 py-24 z-10"
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
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5 }}
                className="text-center p-12 border-t border-primary/10 bg-white/80 backdrop-blur-md z-20 mt-auto"
            >
                <div className="flex flex-col items-center gap-6">
                    <Logo className="h-8 w-auto text-muted-foreground opacity-60" />
                    <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm font-medium text-muted-foreground">
                        <Link href="/privacy" className="hover:text-primary transition-colors flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Confidentialité & CGU
                        </Link>
                        <Link href="/contact" className="hover:text-primary transition-colors">Contact</Link>
                    </div>
                    <p className="text-xs text-muted-foreground max-w-sm font-medium">
                        Simplifier la vie des Kinois, un kilomètre à la fois.
                    </p>
                    <a href="http://www.swaziapplilab.co.za" target="_blank" rel="noopener noreferrer" className="text-[10px] font-semibold hover:text-primary transition-colors uppercase tracking-widest opacity-50">
                        &copy; {new Date().getFullYear()} Swazi Appli Lab sarl. Tous droits réservés.
                    </a>
                </div>
            </motion.footer>
        </div>
    );
}
