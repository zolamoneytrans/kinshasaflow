'use client';

import React from 'react';
import Image from 'next/image';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Phone, Car } from 'lucide-react';
import { motion } from 'framer-motion';

const carData = [
    { id: "mercedes-viano", name: "Mercedes Viano", price: 500, imageUrl: "https://picsum.photos/seed/viano/600/400", imageHint: "mercedes van" },
    { id: "jeep-wrangle", name: "Jeep Wrangle", price: 500, imageUrl: "https://picsum.photos/seed/wrangler/600/400", imageHint: "jeep wrangler" },
    { id: "mercedes-glc", name: "Mercedes GLC", price: 500, imageUrl: "https://picsum.photos/seed/glc/600/400", imageHint: "mercedes suv" },
    { id: "jaguar-silver", name: "Jaguar (Classic)", price: 500, imageUrl: "https://picsum.photos/seed/jaguarsilver/600/400", imageHint: "classic jaguar" },
    { id: "jaguar-white", name: "Jaguar (Modern)", price: 500, imageUrl: "https://picsum.photos/seed/jaguarwhite/600/400", imageHint: "jaguar sedan" },
    { id: "mercedes-amg", name: "Mercedes AMG (G-Wagon)", price: 600, imageUrl: "https://picsum.photos/seed/gwagon/600/400", imageHint: "mercedes g-wagon" },
    { id: "mercedes-gle", name: "Mercedes GLE", price: 600, imageUrl: "https://picsum.photos/seed/gle/600/400", imageHint: "mercedes gle" },
    { id: "lexus-lx570", name: "Lexus LX570", price: 600, imageUrl: "https://picsum.photos/seed/lexus/600/400", imageHint: "lexus suv" }
];

const CarCard = ({ car }: { car: typeof carData[0] }) => {
    return (
        <Card className="overflow-hidden flex flex-col">
            <div className="relative aspect-video bg-muted">
                <Image src={car.imageUrl} alt={car.name} fill className="object-cover" data-ai-hint={car.imageHint} />
            </div>
            <CardHeader>
                <CardTitle>{car.name}</CardTitle>
            </CardHeader>
            <CardContent className="flex-1" />
            <CardFooter className="bg-muted/50 p-4 flex justify-between items-center">
                <div className="font-bold text-lg flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    {car.price} <span className="text-sm font-normal text-muted-foreground">/ jour</span>
                </div>
                 <a href="tel:0857767040">
                    <Button>Réserver</Button>
                </a>
            </CardFooter>
        </Card>
    );
};


export default function CarRentalPage() {
    return (
        <div className="w-full h-full overflow-y-auto pr-2">
            <div className="space-y-8 max-w-7xl mx-auto py-4">
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                    <div className="text-center">
                        <h1 className="text-3xl md:text-4xl font-bold flex items-center justify-center gap-3"><Car className="h-8 w-8 text-primary"/>Location de Véhicules</h1>
                        <p className="mt-2 text-lg text-muted-foreground">Des véhicules de luxe pour vos déplacements en ville.</p>
                    </div>
                </motion.div>
                
                <motion.div 
                    className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                    initial="hidden"
                    animate="visible"
                    variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
                >
                    {carData.map(car => (
                        <motion.div key={car.id} variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} layout>
                            <CarCard car={car} />
                        </motion.div>
                    ))}
                </motion.div>

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
                    <Card className="bg-accent/50 border-accent">
                        <CardHeader className="items-center text-center">
                            <CardTitle className="flex items-center gap-2"><Phone /> Contact pour Réservation</CardTitle>
                            <CardDescription>
                                Pour réserver un véhicule ou pour toute question, n'hésitez pas à nous appeler.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="text-center">
                            <a href="tel:0857767040" className="text-2xl font-bold text-primary hover:underline">
                                0857767040
                            </a>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}
