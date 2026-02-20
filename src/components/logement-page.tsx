'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useUser, useFirebase, useCollection, useMemoFirebase, errorEmitter } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, setDoc, doc } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Logement, logementFormSchema, LogementFormValues, FirestorePermissionError } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Phone, Building, DollarSign, BedDouble, PlusCircle, Loader2 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';

// --- Add Logement Dialog (for Admin) ---
const AddLogementDialog = () => {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const { user, firestore, firebaseApp } = useFirebase();

    const form = useForm<LogementFormValues>({
        resolver: zodResolver(logementFormSchema),
        defaultValues: {
            title: '',
            description: '',
            address: '',
            pricePerNight: 0,
            amenities: '',
            images: undefined,
        },
    });

    const onSubmit = async (data: LogementFormValues) => {
        if (!user || user.email !== 'drnduwa@gmail.com') {
            toast({ title: "Accès refusé", description: "Vous devez être administrateur pour ajouter un logement.", variant: "destructive" });
            return;
        }
    
        setIsSubmitting(true);
    
        try {
            const imageFiles = data.images as FileList;
            const newLogementRef = doc(collection(firestore, 'logements'));
            const logementId = newLogementRef.id;
            const storage = getStorage(firebaseApp);
    
            // Stage 1: Image Uploads
            const uploadPromises = Array.from(imageFiles).map((file) => {
                const fileRef = storageRef(storage, `logements/${logementId}/${file.name}`);
                return uploadBytes(fileRef, file).then(snapshot => getDownloadURL(snapshot.ref));
            });
    
            const imageUrls = await Promise.all(uploadPromises);
    
            // Stage 2: Firestore Document Creation
            const logementData = {
                title: data.title,
                description: data.description,
                address: data.address,
                pricePerNight: data.pricePerNight,
                amenities: data.amenities.split(',').map(a => a.trim()).filter(a => a),
                imageUrls,
                ownerId: user.uid,
                createdAt: serverTimestamp(),
            };
    
            setDoc(newLogementRef, logementData)
                .then(() => {
                    toast({ title: 'Logement ajouté !', description: 'Le nouveau logement est maintenant visible par les utilisateurs.' });
                    setOpen(false);
                    form.reset();
                })
                .catch((serverError) => {
                    const permissionError = new FirestorePermissionError({
                        path: newLogementRef.path,
                        operation: 'create',
                        requestResourceData: logementData,
                    });
                    errorEmitter.emit('permission-error', permissionError);
                })
                .finally(() => {
                    setIsSubmitting(false);
                });
    
        } catch (error: any) {
            // This catch block now primarily handles errors from the image upload stage.
            let description = 'Une erreur est survenue lors du téléversement des images. Veuillez réessayer.';
            if (error.code && error.code.startsWith('storage/')) {
                switch (error.code) {
                    case 'storage/unauthorized':
                        description = "Permission de téléversement refusée. Vérifiez les règles de Firebase Storage.";
                        break;
                    case 'storage/canceled':
                        description = "Le téléversement a été annulé.";
                        break;
                    default:
                        description = `Erreur de stockage: ${error.code}`;
                }
            }
            toast({ title: 'Erreur de téléversement', description, variant: 'destructive' });
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Ajouter un appartement
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Nouveau Logement</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="title" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Titre</FormLabel>
                                <FormControl><Input placeholder="Ex: Bel appartement moderne à Gombe" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                         <FormField control={form.control} name="address" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Adresse</FormLabel>
                                <FormControl><Input placeholder="Ex: 123 Avenue de la Justice, Gombe, Kinshasa" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="description" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Description</FormLabel>
                                <FormControl><Textarea placeholder="Décrivez le logement en détail..." {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                         <FormField control={form.control} name="pricePerNight" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Prix par nuit (USD)</FormLabel>
                                <FormControl><Input type="number" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                         <FormField control={form.control} name="amenities" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Commodités (séparées par une virgule)</FormLabel>
                                <FormControl><Input placeholder="Ex: WiFi, Climatisation, Parking" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="images" render={({ field: { onChange, ...fieldProps} }) => (
                            <FormItem>
                                <FormLabel>Images</FormLabel>
                                <FormControl><Input type="file" multiple accept="image/*" onChange={e => onChange(e.target.files)} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <DialogFooter>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Publier le logement
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

// --- Admin Dashboard (conditionally rendered) ---
const AdminDashboard = () => (
    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card className="bg-primary/5 border-primary/20">
            <CardHeader>
                <CardTitle>Tableau de Bord Administrateur</CardTitle>
                <CardDescription>Gérez les appartements disponibles sur la plateforme.</CardDescription>
            </CardHeader>
            <CardContent>
                <AddLogementDialog />
            </CardContent>
        </Card>
    </motion.div>
);

// --- Logement Card ---
const LogementCard = ({ logement }: { logement: Logement & { id: string } }) => (
    <Card className="overflow-hidden flex flex-col">
        <Carousel className="w-full">
            <CarouselContent>
                {logement.imageUrls.map((url, index) => (
                    <CarouselItem key={index}>
                        <div className="relative aspect-video bg-muted">
                            <Image src={url} alt={logement.title} fill className="object-cover" data-ai-hint="apartment interior" />
                        </div>
                    </CarouselItem>
                ))}
            </CarouselContent>
            {logement.imageUrls.length > 1 && <>
                <CarouselPrevious className="left-2" />
                <CarouselNext className="right-2" />
            </>}
        </Carousel>
        <CardHeader>
            <CardTitle>{logement.title}</CardTitle>
            <CardDescription className="flex items-center gap-1 pt-1"><Building className="h-4 w-4" /> {logement.address}</CardDescription>
        </CardHeader>
        <CardContent className="flex-1">
            <p className="text-sm text-muted-foreground mb-4">{logement.description}</p>
            <div className="flex flex-wrap gap-2">
                {logement.amenities.map(amenity => <Badge key={amenity} variant="secondary">{amenity}</Badge>)}
            </div>
        </CardContent>
        <CardFooter className="bg-muted/50 p-4 flex justify-between items-center">
            <div className="font-bold text-lg flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                {logement.pricePerNight} <span className="text-sm font-normal text-muted-foreground">/ nuit</span>
            </div>
            <Button>Réserver</Button>
        </CardFooter>
    </Card>
);

// --- Skeleton Loader ---
const LogementSkeleton = () => (
    <Card className="overflow-hidden">
        <Skeleton className="w-full aspect-video" />
        <CardHeader>
            <Skeleton className="h-6 w-3/4" />
            <Skeleton className="h-4 w-1/2 mt-1" />
        </CardHeader>
        <CardContent>
            <Skeleton className="h-4 w-full mb-2" />
            <Skeleton className="h-4 w-5/6" />
            <div className="flex gap-2 mt-4">
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-6 w-24" />
            </div>
        </CardContent>
        <CardFooter className="p-4">
             <Skeleton className="h-10 w-full" />
        </CardFooter>
    </Card>
);


// --- Main Page Component ---
export default function LogementPage() {
    const { user } = useUser();
    const { firestore } = useFirebase();
    const isAdmin = user?.email === 'drnduwa@gmail.com';

    const logementsCollection = useMemoFirebase(() => collection(firestore, 'logements'), [firestore]);
    const logementsQuery = useMemoFirebase(() => query(logementsCollection, orderBy('createdAt', 'desc')), [logementsCollection]);
    const { data: logements, isLoading } = useCollection<Logement>(logementsQuery);

    return (
        <div className="w-full h-full overflow-y-auto pr-2">
            <div className="space-y-8 max-w-7xl mx-auto py-4">
                {isAdmin && <AdminDashboard />}

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}>
                    <div className="text-center">
                        <h1 className="text-3xl md:text-4xl font-bold flex items-center justify-center gap-3"><BedDouble className="h-8 w-8 text-primary"/>Logements de Court Séjour à Kinshasa</h1>
                        <p className="mt-2 text-lg text-muted-foreground">Votre confort, notre priorité. Trouvez l'appartement idéal pour votre séjour.</p>
                    </div>
                </motion.div>

                {isLoading ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <LogementSkeleton />
                        <LogementSkeleton />
                        <LogementSkeleton />
                    </div>
                ) : logements && logements.length > 0 ? (
                    <motion.div 
                        className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                        initial="hidden"
                        animate="visible"
                        variants={{ visible: { transition: { staggerChildren: 0.1 } } }}
                    >
                        <AnimatePresence>
                            {logements.map(logement => (
                               <motion.div key={logement.id} variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0 } }} layout>
                                 <LogementCard logement={logement} />
                               </motion.div>
                            ))}
                        </AnimatePresence>
                    </motion.div>
                ) : (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}>
                        <Card className="text-center py-12">
                            <CardContent>
                                <p className="text-muted-foreground">Aucun logement disponible pour le moment.</p>
                                <p className="text-sm text-muted-foreground">Revenez bientôt pour découvrir nos offres.</p>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
                    <Card className="bg-accent/50 border-accent">
                        <CardHeader className="items-center text-center">
                            <CardTitle className="flex items-center gap-2"><Phone /> Publiez votre appartement</CardTitle>
                            <CardDescription>
                                Vous êtes propriétaire et souhaitez que votre bien soit visible sur Kinshasa Flow ? <br/>Contactez notre service client pour en savoir plus.
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
