
'use client';

import React, { useState } from 'react';
import { useFirebase, useCollection, useMemoFirebase, errorEmitter } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AdvertVideo, advertUploadFormSchema, AdvertUploadFormValues, WithId, FirestorePermissionError } from '@/lib/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Trash2, Loader2, Video as VideoIcon, UploadCloud, Play, Info, AlertTriangle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ToastAction } from '@/components/ui/toast';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';

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
        if (!user || user.email !== 'drnduwa@gmail.com') {
            toast({ title: "Accès refusé", description: "Seul l'administrateur peut effectuer cette action.", variant: 'destructive' });
            return;
        }

        setIsUploading(true);
        const file = data.video[0];
        const newAdRef = doc(collection(firestore, 'adverts'));
        const adId = newAdRef.id;

        // ÉTAPE 1: Téléversement vers Firebase Storage
        let videoUrl = '';
        try {
            const storage = getStorage(firebaseApp);
            const fileRef = storageRef(storage, `videos/${user.uid}/adverts/${adId}`);
            
            const snapshot = await uploadBytes(fileRef, file);
            videoUrl = await getDownloadURL(snapshot.ref);
        } catch (storageError: any) {
            console.error("Storage Error:", storageError);
            setIsUploading(false);
            
            let errorMessage = storageError.message || "Une erreur inconnue est survenue.";
            if (storageError.code === 'storage/unauthorized') {
                errorMessage = "Permissions Storage insuffisantes. Vérifiez vos règles de sécurité.";
            }

            toast({
                title: "Échec du téléversement (Étape 1/2)",
                description: `Code: ${storageError.code} - ${errorMessage}`,
                variant: "destructive",
                duration: 15000,
                action: <ToastAction altText="Réessayer" onClick={() => onSubmit(data)}>Réessayer</ToastAction>
            });
            return;
        }

        // ÉTAPE 2: Création du document dans Firestore
        const adData = {
            title: data.title,
            videoUrl,
            thumbnailUrl: `https://picsum.photos/seed/${adId}/1280/720`,
            duration: 30,
            createdAt: serverTimestamp(),
        };

        try {
            await setDoc(newAdRef, adData);
            
            toast({ title: 'Publicité ajoutée !', description: 'La vidéo est prête à être visionnée.' });
            setUploadDialogOpen(false);
            form.reset();
        } catch (firestoreError: any) {
            console.error("Firestore Error:", firestoreError);
            
            const permissionError = new FirestorePermissionError({
                path: newAdRef.path,
                operation: 'create',
                requestResourceData: adData,
            });
            errorEmitter.emit('permission-error', permissionError);

            toast({
                title: "Erreur de base de données (Étape 2/2)",
                description: "La vidéo a été téléversée mais les informations n'ont pas pu être enregistrées.",
                variant: "destructive"
            });
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (ad: WithId<AdvertVideo>) => {
        try {
            const storage = getStorage(firebaseApp);
            try {
                const fileRef = storageRef(storage, ad.videoUrl);
                await deleteObject(fileRef);
            } catch (e) {
                console.warn("Fichier Storage non trouvé:", e);
            }

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
                        <p className="text-muted-foreground">Uploadez des vidéos pour récompenser vos utilisateurs.</p>
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
                            
                            <Alert variant="default" className="bg-amber-50 border-amber-200">
                                <Info className="h-4 w-4 text-amber-600" />
                                <AlertTitle className="text-amber-800 font-bold">Conseil</AlertTitle>
                                <AlertDescription className="text-amber-700 text-xs">
                                    Utilisez des vidéos de 30 secondes maximum au format MP4.
                                </AlertDescription>
                            </Alert>

                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 pt-4">
                                    <FormField control={form.control} name="title" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Nom de la campagne</FormLabel>
                                            <FormControl><Input placeholder="Ex: Promotion Taxi Kin 2026" {...field} disabled={isUploading} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="video" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Fichier vidéo (MP4/MOV)</FormLabel>
                                            <FormControl><Input type="file" accept="video/*" onChange={e => field.onChange(e.target.files)} disabled={isUploading} /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <DialogFooter className="pt-4">
                                        <Button type="submit" disabled={isUploading} className="w-full h-12 rounded-xl">
                                            {isUploading ? (
                                                <>
                                                    <Loader2 className="animate-spin mr-2 h-5 w-5" />
                                                    Téléversement en cours...
                                                </>
                                            ) : "Publier la vidéo"}
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
                            <Card key={ad.id} className="overflow-hidden group border-none shadow-sm flex flex-col">
                                <div className="aspect-video bg-slate-900 relative flex items-center justify-center">
                                    <video src={ad.videoUrl} className="w-full h-full object-cover opacity-60" />
                                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Play className="h-12 w-12 text-white fill-white" />
                                    </div>
                                    <Badge className="absolute top-2 right-2 bg-black/50 backdrop-blur-md">30s</Badge>
                                </div>
                                <CardHeader className="p-4 flex-1">
                                    <CardTitle className="text-lg line-clamp-1">{ad.title}</CardTitle>
                                    <CardDescription>+2 ⭐ par visionnage</CardDescription>
                                </CardHeader>
                                <CardFooter className="p-4 pt-0 justify-between">
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10 rounded-lg w-full">
                                                <Trash2 className="h-4 w-4 mr-2" /> Supprimer la campagne
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Supprimer cette publicité ?</AlertDialogTitle>
                                                <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(ad)} className="bg-destructive text-white hover:bg-destructive/90">Confirmer</AlertDialogAction>
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
                        <p className="font-bold text-slate-600">Aucune publicité active</p>
                        <p className="text-sm text-muted-foreground">Cliquez sur "Nouvelle Publicité" pour commencer.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
