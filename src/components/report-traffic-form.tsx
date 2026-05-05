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
import { collection, serverTimestamp, doc, runTransaction } from 'firebase/firestore';


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
            const eventData = {
                ...data,
                userId: user.uid,
                user: user.isAnonymous ? "Anonyme" : (user.displayName || "Utilisateur"),
                userAvatar: user.photoURL || "",
                picture: imagePreview || '',
                createdAt: serverTimestamp(),
            };
            const eventsCollection = collection(firestore, 'events');
            await runTransaction(firestore, async (transaction) => {
                const userRef = doc(firestore, 'users', user.uid);
                const userSnap = await transaction.get(userRef);
                const profile = userSnap.data() as UserProfile;
                const newBalance = (profile?.currentStarsBalance || 0) + 5;
                transaction.update(userRef, { currentStarsBalance: newBalance, totalStarsEarned: (profile?.totalStarsEarned || 0) + 5 });
                transaction.set(doc(eventsCollection), eventData);
            });
            toast({ title: 'Rapport envoyé +5 ⭐!' });
            router.push('/reports');
        } catch (error) {
            toast({ title: 'Erreur', variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Signaler un incident</CardTitle>
                <CardDescription>Partagez l'état du trafic en temps réel.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField control={form.control} name="location" render={({ field }) => (
                            <FormItem><FormLabel>Lieu</FormLabel><FormControl><Input {...field} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="description" render={({ field }) => (
                            <FormItem><FormLabel>Description</FormLabel><FormControl><Textarea {...field} disabled={isSubmitting} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="severity" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Sévérité</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting}>
                                    <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                                    <SelectContent>
                                        <SelectItem value="low">Faible</SelectItem>
                                        <SelectItem value="medium">Moyen</SelectItem>
                                        <SelectItem value="high">Élevé</SelectItem>
                                    </SelectContent>
                                </Select>
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="picture" render={({ field: { onChange } }) => (
                            <FormItem>
                                <FormLabel>Ajouter une photo</FormLabel>
                                <FormControl>
                                    <div className="relative">
                                        <Input type="file" accept="image/*" className="hidden" id="pic" onChange={e => { onChange(e.target.files); handlePictureChange(e); }} disabled={isSubmitting} />
                                        <label htmlFor="pic" className="flex items-center justify-center w-full h-32 border-2 border-dashed rounded-md cursor-pointer">
                                            {imagePreview ? <div className="relative w-28 h-28"><Image src={imagePreview} alt="Preview" fill className="object-cover rounded-md" /></div> : <Camera className="w-8 h-8 text-muted-foreground" />}
                                        </label>
                                    </div>
                                </FormControl>
                            </FormItem>
                        )} />
                        <Button type="submit" className="w-full h-14" disabled={isSubmitting}>{isSubmitting ? <Loader2 className="mr-2 animate-spin" /> : <Send className="mr-2" />}Soumettre</Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
