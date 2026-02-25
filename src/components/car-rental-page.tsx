'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardFooter, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DollarSign, Phone, Car } from 'lucide-react';
import { motion } from 'framer-motion';
import { BookingDialog } from './car-rental-booking-dialog';

type CarInfo = { id: string; name: string; price: number; };

const rentalCarDetails: CarInfo[] = [
    { id: "toyota-ist", name: "Toyota IST", price: 50 },
    { id: "toyota-yaris", name: "Toyota Yaris", price: 60 },
    { id: "toyota-corolla", name: "Toyota Corolla", price: 70 },
    { id: "toyota-premio", name: "Toyota Premio", price: 80 },
    { id: "toyota-harrier", name: "Toyota Harrier", price: 100 },
    { id: "nissan-juke", name: "Nissan Juke", price: 100 },
    { id: "toyota-noah-alphard", name: "Toyota Noah ou Alphard", price: 100 },
    { id: "toyota-rav4", name: "Toyota RAV4", price: 100 },
    { id: "toyota-vanguard", name: "Toyota Vanguard", price: 110 },
    { id: "hyundai-sonata", name: "Hyundai Sonata", price: 120 },
    { id: "hyundai-creta", name: "Hyundai Creta", price: 120 },
    { id: "toyota-rav4-new", name: "Toyota RAV4 New", price: 130 },
    { id: "toyota-crown", name: "Toyota Crown", price: 130 },
    { id: "prado-txl", name: "Prado TXL", price: 200 },
    { id: "range-rover", name: "Range Rover", price: 350 },
    { id: "lexus-lx570-new", name: "Lexus LX570 New", price: 500 },
].sort((a, b) => a.price - b.price);


const CarCard = ({ car }: { car: CarInfo }) => {
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
                    {car.price}$ <span className="text-sm font-normal text-muted-foreground">/ jour</span>
                </div>
                 <BookingDialog car={car} />
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
                        <p className="mt-2 text-lg text-muted-foreground">Découvrez notre flotte de véhicules et réservez en quelques clics.</p>
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
            </div>
        </div>
    );
}
