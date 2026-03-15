
'use client';

import React, { useState } from 'react';
import { useFirebase, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AdvertVideo, advertUploadFormSchema, AdvertUploadFormValues, WithId } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2, Loader2, Video as VideoIcon, UploadCloud, Play } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function AdvertsManager() {
    const { firestore, firebaseApp, user } = useFirebase();
    const { toast } = useToast();
    
    const advertsCollection = useMemoFirebase(() => collection(firestore, 'adverts'), [firestore]);
    const advertsQuery = useMemoFirebase(() => query(advertsCollection, orderBy('createdAt', 'desc')), [advertsCollection]);
    const { data: adverts, isLoading } = useCollection<AdvertVideo>(advertsQuery);

    const [isUploading, setIsUploading] = useState(false);
    const [uploadDialogOpen, setUploadDialogOpen] = useState(false);

    const form = useForm<AdvertUploadFormValues>({
        resolver: zodResolver(advertUploadFormSchema),
        defaultValues: { title: '' },
    });

    const onSubmit = async (data: AdvertUploadFormValues) => {
        if (!user || user.email !== 'drnduwa@gmail.com') return;

        setIsUploading(true);
        const file = data.video[0];

        try {
            const newAdRef = doc(collection(firestore, 'adverts'));
            const adId = newAdRef.id;
            
            const storage = getStorage(firebaseApp);
            const fileRef = storageRef(storage, `adverts/${adId}`);

            await uploadBytes(fileRef, file);
            const videoUrl = await getDownloadURL(fileRef);

            const adData: AdvertVideo = {
                title: data.title,
                videoUrl,
                thumbnailUrl: `https://picsum.photos/seed/${adId}/1280/720`,
                duration: 30, // Default 30s as per requirement
                createdAt: serverTimestamp() as any,
            };

            await setDoc(newAdRef, adData);
            
            toast({ title: 'Publicité ajoutée !', description: 'La vidéo est prête à être visionnée par les utilisateurs.' });
            setUploadDialogOpen(false);
            form.reset();
        } catch (error) {
            console.error("Error uploading ad:", error);
            toast({ title: 'Erreur', description: "Une erreur est survenue lors du téléversement.", variant: 'destructive' });
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (ad: WithId<AdvertVideo>) => {
        try {
            const storage = getStorage(firebaseApp);
            const fileRef = storageRef(storage, ad.videoUrl);
            await deleteObject(fileRef);
            await deleteDoc(doc(firestore, 'adverts', ad.id));
            toast({ title: "Supprimé", description: "La publicité a été retirée." });
        } catch (error) {
            console.error("Error deleting ad:", error);
            toast({ title: "Erreur", description: "Impossible de supprimer la publicité.", variant: "destructive" });
        }
    };

    return (
        <div className="w-full h-full overflow-y-auto p-4 md:p-8">
            <div className="max-w-5xl mx-auto space-y-8">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-black flex items-center gap-3">
                            <VideoIcon className="text-primary h-8 w-8" />
                            Gestion des Publicités
                        </h1>
                        <p className="text-muted-foreground">Uploadez des vidéos de 30 secondes pour le système de stars.</p>
                    </div>

                    <Dialog open={uploadDialogOpen} onOpenChange={setUploadDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="h-12 px-6 rounded-xl font-bold shadow-lg shadow-primary/20">
                                <UploadCloud className="mr-2 h-5 w-5" />
                                Nouvelle Publicité
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader><DialogTitle>Ajouter une publicité vidéo</DialogTitle></DialogHeader>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    <FormField control={form.control} name="title" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nom de la campagne</FormLabel>
                                            <FormControl><Input placeholder="Ex: Campagne Bracongo 2026" {...field} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="video" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Fichier vidéo (MP4/MOV)</FormLabel>
                                            <FormControl><Input type="file" accept="video/*" onChange={e => field.onChange(e.target.files)} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <DialogFooter>
                                        <Button type="submit" disabled={isUploading} className="w-full">
                                            {isUploading ? <Loader2 className="animate-spin mr-2" /> : null}
                                            Démarrer le téléversement
                                        </Button>
                                    </DialogFooter>
                                </form>
                            </Form>
                        </DialogContent>
                    </Dialog>
                </div>

                {isLoading ? (
                    <div className="flex justify-center py-20"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div>
                ) : adverts && adverts.length > 0 ? (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {adverts.map(ad => (
                            <Card key={ad.id} className="overflow-hidden group">
                                <div className="aspect-video bg-slate-900 relative flex items-center justify-center">
                                    <video src={ad.videoUrl} className="w-full h-full object-cover opacity-60" />
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Play className="h-12 w-12 text-white fill-white" />
                                    </div>
                                </div>
                                <CardHeader className="p-4">
                                    <CardTitle className="text-lg line-clamp-1">{ad.title}</CardTitle>
                                    <CardDescription>30 secondes • +2 ⭐</CardDescription>
                                </CardHeader>
                                <CardFooter className="p-4 pt-0 justify-between">
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10">
                                                <Trash2 className="h-4 w-4 mr-2" /> Supprimer
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Supprimer cette publicité ?</AlertDialogTitle>
                                                <AlertDialogDescription>Elle ne sera plus disponible pour les utilisateurs.</AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(ad)} className="bg-destructive text-white">Supprimer</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-20 bg-muted/30 rounded-3xl border-2 border-dashed">
                        <VideoIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="font-bold">Aucune publicité active</p>
                        <p className="text-sm text-muted-foreground">Commencez par en uploader une.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
