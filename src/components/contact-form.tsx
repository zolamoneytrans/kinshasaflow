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
import { Send, Loader2 } from 'lucide-react';
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
        <Card className="w-full">
            <CardHeader>
                <CardTitle>Contactez-nous</CardTitle>
                <CardDescription>Envoyez-nous vos questions, suggestions ou plaintes.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                         <FormField
                            control={form.control}
                            name="fullName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nom complet</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Votre nom complet" {...field} disabled={isSubmitting || isUserLoading} />
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
                                    <FormLabel>Numéro de téléphone</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Votre numéro de téléphone" {...field} disabled={isSubmitting || isUserLoading} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                                <FormItem>
                                <FormLabel>Type de message</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value} disabled={isSubmitting || isUserLoading}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Sélectionnez le type de message" />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    <SelectItem value="inquiry">Demande d'information</SelectItem>
                                    <SelectItem value="suggestion">Suggestion</SelectItem>
                                    <SelectItem value="complaint">Plainte</SelectItem>
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
                                    <FormLabel>Sujet</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Sujet de votre message" {...field} disabled={isSubmitting || isUserLoading} />
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
                                    <FormLabel>Message</FormLabel>
                                    <FormControl>
                                        <Textarea
                                        placeholder="Écrivez votre message ici..."
                                        className="resize-y min-h-[150px]"
                                        {...field}
                                        disabled={isSubmitting || isUserLoading}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        
                        <Button type="submit" className="w-full" disabled={isSubmitting || isUserLoading}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Envoi en cours...
                                </>
                            ) : (
                                <>
                                    <Send className="mr-2 h-4 w-4" />
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
