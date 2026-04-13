
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
import { Camera, Send, Loader2 } from 'lucide-react';
import { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { reportFormSchema, ReportFormValues, UserProfile } from '@/lib/types';
import { useFirebase, useUser } from '@/firebase';
import { collection, serverTimestamp, doc, runTransaction, addDoc } from 'firebase/firestore';


export default function ReportTrafficForm() {
    const { toast } = useToast();
    const router = useRouter();
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const { firestore } = useFirebase();
    const { user, isUserLoading } = useUser();

    const form = useForm<ReportFormValues>({
        resolver: zodResolver(reportFormSchema),
        defaultValues: {
            location: '',
            description: '',
            severity: 'medium',
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
            toast({
                title: 'Veuillez vous connecter',
                description: "Vous devez être connecté pour signaler un incident.",
                variant: 'destructive',
            });
            router.push('/login');
            return;
        }

        setIsSubmitting(true);
        
        try {
            const eventData = {
                ...data,
                userId: user.uid,
                user: user.isAnonymous ? "Utilisateur Anonyme" : (user.displayName || "Utilisateur Anonyme"),
                userAvatar: user.photoURL || "",
                picture: imagePreview || '',
                createdAt: serverTimestamp(),
            };

            const eventsCollection = collection(firestore, 'events');
            
            await runTransaction(firestore, async (transaction) => {
                const userRef = doc(firestore, 'users', user.uid);
                const userSnap = await transaction.get(userRef);
                
                let currentBalance = 0;
                let totalEarned = 0;
                
                if (userSnap.exists()) {
                    const profile = userSnap.data() as UserProfile;
                    currentBalance = profile.currentStarsBalance || 0;
                    totalEarned = profile.totalStarsEarned || 0;
                }
                
                const newBalance = currentBalance + 5;
                const newTotalEarned = totalEarned + 5;

                transaction.update(userRef, {
                    currentStarsBalance: newBalance,
                    totalStarsEarned: newTotalEarned
                });

                const newEventRef = doc(eventsCollection);
                transaction.set(newEventRef, eventData);

                const starTransRef = doc(collection(userRef, 'star_transactions'));
                transaction.set(starTransRef, {
                    userId: user.uid,
                    type: 'earned',
                    starsChange: 5,
                    balanceAfterTransaction: newBalance,
                    description: "Signalement d'incident",
                    timestamp: serverTimestamp(),
                });

                // Global Notification
                const notifRef = collection(firestore, 'notifications');
                transaction.set(doc(notifRef), {
                    type: 'traffic_report',
                    title: 'Nouvel incident signalé',
                    message: `Un incident de type ${data.severity} a été signalé à ${data.location}.`,
                    timestamp: serverTimestamp(),
                    link: '/reports'
                });
            });

            toast({
                title: 'Rapport envoyé +5 ⭐!',
                description: "Merci ! Vous avez gagné 5 stars pour votre contribution.",
                variant: 'default',
            });
            
            form.reset();
            setImagePreview(null);
            router.push('/evenements');
        } catch (error) {
            console.error("Error submitting report:", error);
            toast({
                title: 'Oh oh!',
                description: "Impossible de soumettre votre rapport.",
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Signaler un incident</CardTitle>
                <CardDescription>Aidez les autres conducteurs en partageant des informations en temps réel.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="location"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Lieu de l'incident</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: Rond-point Victoire" {...field} disabled={isSubmitting || isUserLoading} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea
                                        placeholder="Décrivez ce qui se passe..."
                                        className="resize-none"
                                        {...field}
                                        disabled={isSubmitting || isUserLoading}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="severity"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Sévérité</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting || isUserLoading}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sélectionnez le niveau de sévérité" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    <SelectItem value="low">Faible</SelectItem>
                                    <SelectItem value="medium">Moyen</SelectItem>
                                    <SelectItem value="high">Élevé</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="picture"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Ajouter une photo</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Input 
                                                id="picture"
                                                type="file" 
                                                accept="image/*" 
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                onChange={handlePictureChange}
                                                disabled={isSubmitting || isUserLoading}
                                            />
                                            <label htmlFor="picture" className="flex items-center justify-center w-full h-32 border-2 border-dashed rounded-md cursor-pointer hover:bg-muted/50 transition-colors">
                                                {imagePreview ? (
                                                     <div className="relative w-28 h-28">
                                                        <Image src={imagePreview} alt="Aperçu" fill style={{ objectFit: 'cover' }} className="rounded-md" />
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                        <Camera className="w-8 h-8" />
                                                        <span>Ajouter une image</span>
                                                    </div>
                                                )}
                                            </label>
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        
                        <div className="p-4 bg-emerald-50 rounded-xl border border-emerald-100 flex items-center justify-between shadow-inner">
                            <div className="flex flex-col">
                                <p className="text-xs font-black text-emerald-800 uppercase tracking-widest">Récompense</p>
                                <p className="text-sm font-medium text-emerald-600">Contribution au trafic</p>
                            </div>
                            <span className="text-2xl font-black text-emerald-600">+5 ⭐</span>
                        </div>

                        <Button type="submit" className="w-full h-14 text-lg font-black" disabled={isSubmitting || isUserLoading}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-6 w-6 animate-spin" />
                                    Envoi en cours...
                                </>
                            ) : (
                                <>
                                    <Send className="mr-2 h-6 w-6" />
                                    Soumettre le rapport
                                </>
                            )}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
