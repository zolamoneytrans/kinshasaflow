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
import { Send, Loader2, MessageCircle } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { inquiryFormSchema, InquiryFormValues } from '@/lib/types';
import { useFirebase, useUser, addDocumentNonBlocking } from '@/firebase';
import { collection, serverTimestamp } from 'firebase/firestore';


export function ContactForm() {
    const { toast } = useToast();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const { firestore } = useFirebase();
    const { user, isUserLoading } = useUser();
    const whatsappBusinessUrl = "https://wa.me/243892293178";

    const form = useForm<InquiryFormValues>({
        resolver: zodResolver(inquiryFormSchema),
        defaultValues: {
            fullName: '',
            phone: '',
            subject: '',
            message: '',
            type: 'inquiry',
        },
    });

    useEffect(() => {
        if (user) {
            form.reset({
                fullName: user.displayName || '',
                phone: user.phoneNumber || '',
                subject: '',
                message: '',
                type: 'inquiry',
            });
        }
    }, [user, form]);


    async function onSubmit(data: InquiryFormValues) {
        if (!user) {
            toast({
                title: 'Veuillez vous connecter',
                description: "Vous devez être connecté pour envoyer un message.",
                variant: 'destructive',
            });
            router.push('/login');
            return;
        }

        setIsSubmitting(true);
        
        try {
            const inquiryData = {
                ...data,
                userId: user.uid,
                userEmail: user.email,
                createdAt: serverTimestamp(),
            };

            const inquiriesCollection = collection(firestore, 'inquiries');
            addDocumentNonBlocking(inquiriesCollection, inquiryData);

            toast({
                title: 'Message envoyé !',
                description: "Merci pour votre message. Nous vous répondrons bientôt.",
                variant: 'default',
            });
            
            form.reset();
        } catch (error) {
            console.error("Error submitting inquiry:", error);
            toast({
                title: 'Oh oh! Une erreur est survenue.',
                description: "Impossible d'envoyer votre message. Veuillez réessayer.",
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    }

    return (
        <Card className="w-full border-none shadow-xl rounded-[2rem] overflow-hidden">
            <CardHeader className="bg-primary p-8 text-white">
                <CardTitle className="text-2xl font-black">Contactez-nous</CardTitle>
                <CardDescription className="text-primary-foreground/80">Posez vos questions ou envoyez-nous vos suggestions.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
                
                <div className="bg-emerald-50 border border-emerald-100 p-6 rounded-2xl space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-emerald-500 p-2 rounded-xl">
                            <MessageCircle className="text-white h-5 w-5" />
                        </div>
                        <p className="font-black text-emerald-900 uppercase text-xs tracking-widest">Support Rapide</p>
                    </div>
                    <p className="text-sm text-emerald-800 font-medium">
                        Pour une réponse immédiate, contactez notre équipe directement sur WhatsApp.
                    </p>
                    <Button asChild className="w-full h-12 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-lg shadow-emerald-200">
                        <a href={whatsappBusinessUrl} target="_blank" rel="noopener noreferrer">
                            DISCUTER SUR WHATSAPP
                        </a>
                    </Button>
                </div>

                <div className="relative">
                    <div className="absolute inset-0 flex items-center"><span className="w-full border-t" /></div>
                    <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest text-slate-400">
                        <span className="bg-white px-4">Ou par formulaire</span>
                    </div>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                         <div className="grid md:grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="fullName"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] font-black uppercase text-slate-400">Nom complet</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Votre nom" className="h-12 rounded-xl border-2" {...field} disabled={isSubmitting || isUserLoading} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="phone"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="text-[10px] font-black uppercase text-slate-400">Téléphone</FormLabel>
                                        <FormControl>
                                            <Input placeholder="08..." className="h-12 rounded-xl border-2" {...field} disabled={isSubmitting || isUserLoading} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                         <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel className="text-[10px] font-black uppercase text-slate-400">Objet de la demande</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting || isUserLoading}>
                                    <FormControl>
                                    <SelectTrigger className="h-12 rounded-xl border-2">
                                        <SelectValue placeholder="Sélectionnez le type" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent className="rounded-xl">
                                    <SelectItem value="inquiry" className="font-bold">Demande d'information</SelectItem>
                                    <SelectItem value="suggestion" className="font-bold">Suggestion</SelectItem>
                                    <SelectItem value="complaint" className="font-bold">Plainte</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="subject"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-[10px] font-black uppercase text-slate-400">Sujet</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Bref résumé" className="h-12 rounded-xl border-2" {...field} disabled={isSubmitting || isUserLoading} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="message"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="text-[10px] font-black uppercase text-slate-400">Message détaillé</FormLabel>
                                    <FormControl>
                                        <Textarea
                                        placeholder="Écrivez votre message ici..."
                                        className="resize-y min-h-[150px] rounded-xl border-2"
                                        {...field}
                                        disabled={isSubmitting || isUserLoading}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        
                        <Button type="submit" className="w-full h-14 rounded-2xl text-lg font-black shadow-lg shadow-primary/20 transition-all active:scale-95" disabled={isSubmitting || isUserLoading}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    Envoi en cours...
                                </>
                            ) : (
                                <>
                                    <Send className="mr-2 h-5 w-5" />
                                    Envoyer le message
                                </>
                            )}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
