
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useUser, useFirebase, useCollection, useMemoFirebase, errorEmitter } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, setDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Logement, logementFormSchema, LogementFormValues, FirestorePermissionError, editLogementFormSchema, EditLogementFormValues, LogementApplication, LogementApplicationFormValues, logementApplicationFormSchema } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious } from '@/components/ui/carousel';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { Phone, Building, DollarSign, BedDouble, PlusCircle, Loader2, MoreVertical, Trash2, Pencil } from 'lucide-react';
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
            pricePerMonth: 0,
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

        const newLogementRef = doc(collection(firestore, 'logements'));
        const logementId = newLogementRef.id;

        // STAGE 1: Handle image uploads.
        let imageUrls: string[] = [];
        try {
            const imageFiles = data.images as FileList;
            const storage = getStorage(firebaseApp);
            
            const uploadPromises = Array.from(imageFiles).map(file => {
                const fileRef = storageRef(storage, `logements/${logementId}/${file.name}`);
                return uploadBytes(fileRef, file).then(snapshot => getDownloadURL(snapshot.ref));
            });

            imageUrls = await Promise.all(uploadPromises);

        } catch (error: any) {
            console.error("Image upload error:", error);

            if (error?.code === 'storage/retry-limit-exceeded' || error?.code === 'storage/unknown') {
                toast({
                    title: 'Erreur de Téléversement',
                    description: "La limite de tentatives a été dépassée ou une erreur inconnue est survenue. Veuillez vérifier vos règles puis réessayez.",
                    variant: 'destructive',
                    duration: 20000,
                    action: <ToastAction altText="Réessayer le téléversement" onClick={() => onSubmit(data)}>Réessayer</ToastAction>,
                });
                setIsSubmitting(false);
                return;
            }

            let description = 'Une erreur est survenue lors du téléversement des images. Veuillez réessayer.';
            toast({ title: 'Erreur Storage', description, variant: 'destructive', duration: 10000 });
            setIsSubmitting(false);
            return;
        }

        const logementData = {
            title: data.title,
            description: data.description,
            address: data.address,
            pricePerMonth: data.pricePerMonth,
            amenities: data.amenities.split(',').map(a => a.trim()).filter(a => a),
            imageUrls,
            ownerId: user.uid,
            createdAt: serverTimestamp(),
        };

        try {
            await setDoc(newLogementRef, logementData);
            toast({ title: 'Logement ajouté !' });
            setOpen(false);
            form.reset();
        } catch (serverError: any) {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: newLogementRef.path,
                operation: 'create',
                requestResourceData: logementData,
            }));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button><PlusCircle className="mr-2 h-4 w-4" />Ajouter un appartement</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Nouveau Logement</DialogTitle></DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="title" render={({ field }) => (
                            <FormItem><FormLabel>Titre</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="address" render={({ field }) => (
                            <FormItem><FormLabel>Adresse</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="description" render={({ field }) => (
                            <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="pricePerMonth" render={({ field }) => (
                            <FormItem><FormLabel>Prix/mois ($)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="amenities" render={({ field }) => (
                            <FormItem><FormLabel>Commodités</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="images" render={({ field: { onChange } }) => (
                            <FormItem><FormLabel>Images</FormLabel><FormControl><Input type="file" multiple accept="image/*" onChange={e => onChange(e.target.files)} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <DialogFooter><Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Publier</Button></DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

const EditLogementDialog = ({ open, onOpenChange, logement }: { open: boolean, onOpenChange: (open: boolean) => void, logement: Logement & { id: string } }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const { firestore } = useFirebase();

    const form = useForm<EditLogementFormValues>({
        resolver: zodResolver(editLogementFormSchema),
        defaultValues: {
            title: logement.title,
            description: logement.description,
            address: logement.address,
            pricePerMonth: logement.pricePerMonth,
            amenities: logement.amenities.join(', '),
        },
    });

    const onSubmit = async (data: EditLogementFormValues) => {
        setIsSubmitting(true);
        const logementDocRef = doc(firestore, 'logements', logement.id);
        const updateData = { ...data, amenities: data.amenities.split(',').map(a => a.trim()).filter(a => a) };
        try {
            await updateDoc(logementDocRef, updateData);
            toast({ title: 'Mise à jour réussie!' });
            onOpenChange(false);
        } catch (error) {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: logementDocRef.path,
                operation: 'update',
                requestResourceData: updateData,
            }));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader><DialogTitle>Modifier le logement</DialogTitle></DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                        <FormField control={form.control} name="title" render={({ field }) => (
                            <FormItem><FormLabel>Titre</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="address" render={({ field }) => (
                            <FormItem><FormLabel>Adresse</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="description" render={({ field }) => (
                            <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="pricePerMonth" render={({ field }) => (
                            <FormItem><FormLabel>Prix ($)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="amenities" render={({ field }) => (
                            <FormItem><FormLabel>Commodités</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Annuler</Button>
                            <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Enregistrer</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};

const AdminDashboard = () => (
    <Card className="bg-primary/5 border-primary/20">
        <CardHeader>
            <CardTitle>Administration Logement</CardTitle>
            <CardDescription>Gérez les appartements de court séjour.</CardDescription>
        </CardHeader>
        <CardContent><AddLogementDialog /></CardContent>
    </Card>
);

const ApplyDialog = ({ logement }: { logement: Logement & { id: string } }) => {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const { user, firestore } = useFirebase();
    const router = useRouter();

    const form = useForm<LogementApplicationFormValues>({
        resolver: zodResolver(logementApplicationFormSchema),
        defaultValues: { name: user?.displayName || '', email: user?.email || '', address: '', phone: '', country: '', city: '', whatsapp: '' },
    });
    
    const onSubmit = async (data: LogementApplicationFormValues) => {
        if (!user) return router.push('/login');
        setIsSubmitting(true);
        const applicationData: Omit<LogementApplication, 'id' | 'createdAt'> = {
            ...data,
            logementId: logement.id,
            logementTitle: logement.title,
            applicantId: user.uid,
            status: 'pending',
        };
        const newApplicationRef = doc(collection(firestore, 'logement_applications'));
        try {
            await setDoc(newApplicationRef, { ...applicationData, createdAt: serverTimestamp() });
            toast({ title: "Candidature envoyée !" });
            setOpen(false);
            form.reset();
        } catch (error) {
            errorEmitter.emit('permission-error', new FirestorePermissionError({
                path: newApplicationRef.path,
                operation: 'create',
                requestResourceData: applicationData,
            }));
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild><Button>Postuler</Button></DialogTrigger>
            <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader><DialogTitle>Postuler : {logement.title}</DialogTitle></DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                        <div className="grid md:grid-cols-2 gap-4">
                             <FormField control={form.control} name="name" render={({ field }) => (
                                <FormItem><FormLabel>Nom</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={form.control} name="phone" render={({ field }) => (
                                <FormItem><FormLabel>Téléphone</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                        <FormField control={form.control} name="email" render={({ field }) => (
                            <FormItem><FormLabel>Email</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="address" render={({ field }) => (
                            <FormItem><FormLabel>Adresse</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <div className="grid md:grid-cols-2 gap-4">
                             <FormField control={form.control} name="city" render={({ field }) => (
                                <FormItem><FormLabel>Ville</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                             <FormField control={form.control} name="country" render={({ field }) => (
                                <FormItem><FormLabel>Pays</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setOpen(false)}>Annuler</Button>
                            <Button type="submit" disabled={isSubmitting}>{isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Envoyer</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

const LogementCard = ({ logement }: { logement: Logement & { id: string } }) => {
    const { user } = useUser();
    const { firestore, firebaseApp } = useFirebase();
    const { toast } = useToast();
    const isAdmin = user?.email === 'drnduwa@gmail.com';
    const [isDeleting, setIsDeleting] = useState(false);
    const [editDialogOpen, setEditDialogOpen] = useState(false);

    const handleDelete = async () => {
        if (!isAdmin) return;
        setIsDeleting(true);
        try {
            const storage = getStorage(firebaseApp);
            await Promise.all(logement.imageUrls.map(url => deleteObject(storageRef(storage, url))));
            await deleteDoc(doc(firestore, 'logements', logement.id));
            toast({ title: "Succès", description: "Le logement a été supprimé." });
        } catch (error) {
            toast({ title: "Erreur", variant: "destructive" });
            setIsDeleting(false);
        }
    };
    
    return (
        <>
        <Card className="overflow-hidden flex flex-col">
            <Carousel className="w-full">
                <CarouselContent>
                    {logement.imageUrls.map((url, index) => (
                        <CarouselItem key={index}>
                            <div className="relative aspect-video bg-muted"><Image src={url} alt={logement.title} fill className="object-cover" /></div>
                        </CarouselItem>
                    ))}
                </CarouselContent>
                {logement.imageUrls.length > 1 && <><CarouselPrevious className="left-2" /><CarouselNext className="right-2" /></>}
            </Carousel>
            <CardHeader className="relative">
                <CardTitle>{logement.title}</CardTitle>
                <CardDescription className="flex items-center gap-1 pt-1"><Building className="h-4 w-4" /> {logement.address}</CardDescription>
                {isAdmin && (
                    <div className="absolute top-4 right-2">
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" disabled={isDeleting}><MoreVertical className="h-4 w-4" /></Button></DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem onSelect={() => setEditDialogOpen(true)}><Pencil className="mr-2 h-4 w-4" />Modifier</DropdownMenuItem>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild><DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive"><Trash2 className="mr-2 h-4 w-4" />Supprimer</DropdownMenuItem></AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader><AlertDialogTitle>Supprimer ?</AlertDialogTitle><AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription></AlertDialogHeader>
                                        <AlertDialogFooter><AlertDialogCancel disabled={isDeleting}>Annuler</AlertDialogCancel><AlertDialogAction onClick={handleDelete} disabled={isDeleting} className="bg-destructive">Supprimer</AlertDialogAction></AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                )}
            </CardHeader>
            <CardContent className="flex-1">
                <p className="text-sm text-muted-foreground mb-4">{logement.description}</p>
                <div className="flex flex-wrap gap-2">{logement.amenities.map(amenity => <Badge key={amenity} variant="secondary">{amenity}</Badge>)}</div>
            </CardContent>
            <CardFooter className="bg-muted/50 p-4 flex justify-between items-center">
                <div className="font-bold text-lg flex items-center gap-2"><DollarSign className="h-5 w-5" />{logement.pricePerMonth} <span className="text-sm font-normal">/ mois</span></div>
                <ApplyDialog logement={logement} />
            </CardFooter>
        </Card>
        <EditLogementDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} logement={logement} />
        </>
    );
};

export default function LogementPage() {
    const { user } = useUser();
    const { firestore } = useFirebase();
    const isAdmin = user?.email === 'drnduwa@gmail.com';
    const logementsQuery = useMemoFirebase(() => query(collection(firestore, 'logements'), orderBy('createdAt', 'desc')), [firestore]);
    const { data: logements, isLoading } = useCollection<Logement>(logementsQuery);

    return (
        <div className="w-full h-full overflow-y-auto pr-2">
            <div className="space-y-8 max-w-7xl mx-auto py-4">
                {isAdmin && <AdminDashboard />}
                <div className="text-center">
                    <h1 className="text-3xl md:text-4xl font-bold flex items-center justify-center gap-3"><BedDouble className="h-8 w-8 text-primary"/>Logements Kinshasa</h1>
                    <p className="mt-2 text-lg text-muted-foreground">Appartements et studios meublés de court séjour.</p>
                </div>
                {isLoading ? <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"><Skeleton className="h-64 w-full" /><Skeleton className="h-64 w-full" /></div> : logements?.map(logement => <LogementCard key={logement.id} logement={logement} />)}
            </div>
        </div>
    );
}
