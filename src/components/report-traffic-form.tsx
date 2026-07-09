'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Camera, Send, Loader2, MapPin, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { reportFormSchema, ReportFormValues, UserProfile, STAR_COSTS } from '@/lib/types';
import { useFirebase, useUser } from '@/firebase';
import { collection, serverTimestamp, doc, runTransaction } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadString, getDownloadURL } from 'firebase/storage';
import { broadcastEmailAction } from '@/app/actions';
import { cn } from '@/lib/utils';


export default function ReportTrafficForm() {
    const { toast } = useToast();
    const router = useRouter();
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const { firestore, firebaseApp } = useFirebase();
    const { user } = useUser();

    const form = useForm<ReportFormValues>({
        resolver: zodResolver(reportFormSchema),
        defaultValues: {
            location: '',
            description: '',
            severity: 'medium',
            picture: undefined,
        },
    });

    function handlePictureChange(event: React.ChangeEvent<HTMLInputElement>) {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setImagePreview(null);
        }
    }

    async function onSubmit(data: ReportFormValues) {
        if (!user) {
            toast({ title: 'Veuillez vous connecter', variant: 'destructive' });
            router.push('/login');
            return;
        }

        setIsSubmitting(true);
        try {
            // Étape 1 : Téléversement de l'image sur Storage si présente
            let pictureUrl = "";
            if (imagePreview) {
                const storage = getStorage(firebaseApp);
                const fileRef = storageRef(storage, `reports/${user.uid}/${Date.now()}.jpg`);
                // Nous téléversons la chaîne data_url capturée par le lecteur de fichiers
                await uploadString(fileRef, imagePreview, 'data_url');
                pictureUrl = await getDownloadURL(fileRef);
            }

            const eventData = {
                location: data.location,
                description: data.description,
                severity: data.severity,
                userId: user.uid,
                user: user.isAnonymous ? "Anonyme" : (user.displayName || "Utilisateur"),
                userAvatar: user.photoURL || "",
                picture: pictureUrl,
                createdAt: serverTimestamp(),
            };

            const eventsCollection = collection(firestore, 'events');
            
            // Étape 2 : Transaction pour ajouter le rapport et créditer les Stars
            await runTransaction(firestore, async (transaction) => {
                const userRef = doc(firestore, 'users', user.uid);
                const userDoc = await transaction.get(userRef);
                const profile = userDoc.data() as UserProfile;
                
                const reward = STAR_COSTS.REPORT_HAZARD_REWARD; // 10 Stars
                const newBalance = (profile?.currentStarsBalance || 0) + reward;
                
                transaction.update(userRef, { 
                    currentStarsBalance: newBalance, 
                    totalStarsEarned: (profile?.totalStarsEarned || 0) + reward 
                });
                
                const newEventRef = doc(eventsCollection);
                transaction.set(newEventRef, eventData);
            });

            // Étape 3 : Notification BROADCAST par e-mail
            await broadcastEmailAction({
                title: `ALERTE TRAFIC (${data.severity.toUpperCase()})`,
                message: data.description,
                userName: user.displayName || "Un utilisateur",
                type: 'report',
                location: data.location
            });

            toast({ title: `Rapport envoyé +${STAR_COSTS.REPORT_HAZARD_REWARD} ⭐!` });
            router.push('/reports');
        } catch (error: any) {
            console.error("Error submitting report:", error);
            toast({ 
                title: 'Échec de l\'envoi', 
                description: "Impossible d'enregistrer le rapport. Vérifiez votre connexion.",
                variant: 'destructive' 
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Card className="w-full border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
            <CardHeader className="bg-primary p-10 text-white relative">
                <div className="absolute top-[-20%] right-[-10%] w-48 h-48 bg-white/10 rounded-full blur-3xl"></div>
                <div className="relative z-10 space-y-2">
                    <div className="bg-white/20 p-3 rounded-2xl w-fit mb-4">
                        <AlertTriangle className="text-white h-8 w-8" />
                    </div>
                    <CardTitle className="text-3xl font-black tracking-tight leading-none uppercase">Signaler un Incident</CardTitle>
                    <CardDescription className="text-white/80 font-medium pt-2 text-base">
                        Partagez l'état de la route pour aider les autres Kinois à gagner du temps.
                    </CardDescription>
                </div>
            </CardHeader>

            <CardContent className="p-10">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
                        <div className="space-y-6">
                            <FormField control={form.control} name="location" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-3 text-slate-500 font-black uppercase tracking-[0.15em] text-[10px] mb-2 ml-1">
                                        <MapPin className="h-3.5 w-3.5 text-primary" />
                                        Localisation précise
                                    </FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: Rond-point Mandela, Blvd du 30 Juin..." className="h-14 rounded-2xl border-2 border-slate-100 focus-visible:ring-primary font-bold shadow-inner bg-slate-50/50" {...field} disabled={isSubmitting} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            
                            <FormField control={form.control} name="description" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-3 text-slate-500 font-black uppercase tracking-[0.15em] text-[10px] mb-2 ml-1">
                                        Description du trafic
                                    </FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Détaillez la situation (ex: Accident, Camion en panne, Gros bouchon...)" className="resize-none min-h-[120px] rounded-2xl border-2 border-slate-100 focus-visible:ring-primary font-bold shadow-inner bg-slate-50/50" {...field} disabled={isSubmitting} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="severity" render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-3 text-slate-500 font-black uppercase tracking-[0.15em] text-[10px] mb-2 ml-1">
                                        Impact sur le flux
                                    </FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                                        <FormControl>
                                            <SelectTrigger className="h-14 rounded-2xl border-2 border-slate-100 bg-slate-50/50 font-bold">
                                                <SelectValue placeholder="Sélectionnez la gravité" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                                            <SelectItem value="low" className="font-bold h-12 text-emerald-600">🟢 Faible (Ralentissement)</SelectItem>
                                            <SelectItem value="medium" className="font-bold h-12 text-amber-600">🟡 Moyen (Gros Bouchon)</SelectItem>
                                            <SelectItem value="high" className="font-bold h-12 text-red-600">🔴 Élevé (Blocage Total)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </FormItem>
                            )} />

                            <FormField control={form.control} name="picture" render={({ field: { onChange } }) => (
                                <FormItem>
                                    <FormLabel className="flex items-center gap-3 text-slate-500 font-black uppercase tracking-[0.15em] text-[10px] mb-2 ml-1">
                                        Preuve visuelle (Facultatif)
                                    </FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input type="file" accept="image/*" className="hidden" id="pic" onChange={e => { onChange(e.target.files); handlePictureChange(e); }} disabled={isSubmitting} />
                                            <label htmlFor="pic" className="flex flex-col items-center justify-center w-full h-48 border-2 border-dashed border-slate-200 rounded-[2rem] cursor-pointer hover:bg-slate-50 transition-all overflow-hidden bg-slate-50/50 group">
                                                {imagePreview ? (
                                                    <div className="relative w-full h-full">
                                                        <Image src={imagePreview} alt="Preview" fill className="object-cover" />
                                                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-all flex items-center justify-center">
                                                            <Camera className="text-white h-10 w-10 opacity-60" />
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <Camera className="h-10 w-10 text-slate-300 mb-3 group-hover:scale-110 transition-transform" />
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Prendre une photo</span>
                                                    </>
                                                )}
                                            </label>
                                        </div>
                                    </FormControl>
                                </FormItem>
                            )} />
                        </div>

                        <div className="p-6 bg-emerald-50 rounded-[1.75rem] border border-emerald-100 flex items-center justify-between shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className="bg-emerald-500 p-2.5 rounded-xl text-white shadow-lg shadow-emerald-200">
                                    <CheckCircle2 className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-emerald-800 uppercase tracking-widest leading-none mb-1">Bonus Citoyen</p>
                                    <p className="text-[11px] text-emerald-600 font-bold italic">Aidez les autres & gagnez</p>
                                </div>
                            </div>
                            <span className="text-2xl font-black text-emerald-600">+{STAR_COSTS.REPORT_HAZARD_REWARD} ⭐</span>
                        </div>

                        <Button type="submit" className="w-full h-16 rounded-[1.5rem] text-lg font-black uppercase tracking-widest shadow-2xl shadow-primary/30 transition-all hover:scale-[1.02] active:scale-95" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-3 h-6 w-6 animate-spin" />
                                    Synchronisation...
                                </>
                            ) : (
                                <>
                                    <Send className="mr-3 h-6 w-6" />
                                    Diffuser le rapport
                                </>
                            )}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
