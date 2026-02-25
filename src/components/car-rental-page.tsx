'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Phone, Car } from 'lucide-react';
import { motion } from 'framer-motion';

const rentalCarDetails = [
    { id: "mercedes-viano", name: "Mercedes Viano", price: 500 },
    { id: "jeep-wrangler", name: "Jeep Wrangler", price: 500 },
    { id: "mercedes-glc", name: "Mercedes GLC", price: 500 },
    { id: "classic-jaguar", name: "Jaguar (Classic)", price: 500 },
    { id: "modern-jaguar", name: "Jaguar (Modern)", price: 500 },
    { id: "mercedes-g-wagon", name: "Mercedes AMG (G-Wagon)", price: 600 },
    { id: "mercedes-gle", name: "Mercedes GLE", price: 600 },
    { id: "lexus-lx570", name: "Lexus LX570", price: 600 }
];

const CarCard = ({ car }: { car: { id: string; name: string; price: number; } }) => {
    return (
        <Card className="overflow-hidden flex flex-col h-full">
            <CardHeader className="flex-grow">
                <CardTitle className="flex items-center gap-2">
                    <Car className="h-6 w-6 text-primary" />
                    <span>{car.name}</span>
                </CardTitle>
            </CardHeader>
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
                    {rentalCarDetails.map(car => (
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
