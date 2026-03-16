
'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bot, Send, User, Loader2, Volume2, Star, AlertCircle } from 'lucide-react';
import { askAssistantAction, generateSpeechAction } from '@/app/actions';
import { useUser, useFirebase, useDoc, useMemoFirebase } from '@/firebase';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { doc, runTransaction, serverTimestamp, collection } from 'firebase/firestore';
import { STAR_COSTS, UserProfile } from '@/lib/types';
import { Badge } from './ui/badge';
import Link from 'next/link';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export default function AssistantChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeakingId, setIsSpeakingId] = useState<number | null>(null);
  const { user, firestore } = useFirebase();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const userRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile } = useDoc<UserProfile>(userRef);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  const handleSpeech = async (index: number, text: string) => {
    if (isSpeakingId === index) {
      if (audioRef.current) audioRef.current.pause();
      setIsSpeakingId(null);
      return;
    }

    setIsSpeakingId(index);
    try {
      if (audioRef.current) audioRef.current.pause();
      const result = await generateSpeechAction(text);
      if (!result || !result.media) throw new Error('Données audio manquantes');
      const audio = new Audio(result.media);
      audioRef.current = audio;
      audio.play().catch(e => setIsSpeakingId(null));
      audio.onended = () => setIsSpeakingId(null);
    } catch (error: any) {
      toast({ title: "Erreur audio", description: error.message, variant: "destructive" });
      setIsSpeakingId(null);
    }
  };
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !user || !profile) return;

    if (profile.currentStarsBalance < STAR_COSTS.AI_MESSAGE) {
        toast({
            title: "Solde insuffisant",
            description: `Un message coûte ${STAR_COSTS.AI_MESSAGE} stars. Veuillez recharger votre compte.`,
            variant: "destructive",
            action: <Button asChild variant="outline" size="sm"><Link href="/mes-stars">Recharger</Link></Button>
        });
        return;
    }

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // 1. Deduct stars first
      await runTransaction(firestore, async (transaction) => {
          const userDoc = await transaction.get(userRef!);
          const data = userDoc.data() as UserProfile;
          const newBalance = data.currentStarsBalance - STAR_COSTS.AI_MESSAGE;
          
          transaction.update(userRef!, {
              currentStarsBalance: newBalance,
              totalStarsUsed: (data.totalStarsUsed || 0) + STAR_COSTS.AI_MESSAGE
          });

          const starTransRef = doc(collection(userRef!, 'star_transactions'));
          transaction.set(starTransRef, {
              userId: user.uid,
              type: 'spent',
              starsChange: -STAR_COSTS.AI_MESSAGE,
              balanceAfterTransaction: newBalance,
              description: "Message Assistant IA",
              timestamp: serverTimestamp(),
          });
      });

      // 2. Call AI
      const result = await askAssistantAction({ question: input });
      const assistantMessage: Message = { role: 'assistant', content: result.answer };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error:', error);
      const errorMessage: Message = { role: 'assistant', content: "Désolé, une erreur s'est produite lors du traitement de votre demande." };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex justify-center items-center">
      <Card className="w-full max-w-3xl h-[90%] flex flex-col shadow-2xl border-none">
        <CardHeader className="border-b bg-slate-50/50">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10 ring-2 ring-primary/10">
                <AvatarFallback className="bg-primary text-primary-foreground"><Bot /></AvatarFallback>
                </Avatar>
                <div className="flex flex-col">
                    <span className="text-lg font-black tracking-tight">K-Flow Assistant</span>
                    <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">Expert Mobilité Kinshasa</span>
                </div>
            </div>
            <Badge variant="secondary" className="bg-amber-100 text-amber-700 border-amber-200 font-bold">
                <Star className="h-3 w-3 mr-1 fill-amber-500 text-amber-500" />
                {STAR_COSTS.AI_MESSAGE} stars / msg
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden p-6">
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6">
              {messages.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                      <div className="bg-primary/5 p-6 rounded-full">
                        <Bot className="h-12 w-12 text-primary animate-pulse" />
                      </div>
                      <div className="max-w-sm space-y-2">
                        <p className="text-lg font-bold text-slate-800">"Mbote! Naza K-Flow Assistant."</p>
                        <p className="text-sm text-slate-500 leading-relaxed">Je peux vous guider à travers les embouteillages de Kinshasa. Posez-moi vos questions d'itinéraires !</p>
                      </div>
                  </div>
              )}
              {messages.map((message, index) => (
                <div key={index} className={cn('flex items-start gap-3', message.role === 'user' ? 'justify-end' : 'justify-start')}>
                  {message.role === 'assistant' && (
                    <Avatar className="h-8 w-8 border shadow-sm">
                      <AvatarFallback className="bg-slate-100 text-slate-600"><Bot className="h-4 w-4" /></AvatarFallback>
                    </Avatar>
                  )}
                  <div className={cn('max-w-[80%] rounded-2xl p-4 text-sm relative group shadow-sm', message.role === 'user' ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-white border rounded-tl-none text-slate-700')}>
                    {message.content}
                    {message.role === 'assistant' && (
                        <Button variant="ghost" size="icon" className={cn("absolute -right-10 top-0 transition-opacity h-8 w-8", isSpeakingId === index ? "opacity-100" : "opacity-0 group-hover:opacity-100")} onClick={() => handleSpeech(index, message.content)} disabled={isSpeakingId !== null && isSpeakingId !== index}>
                            {isSpeakingId === index ? <Loader2 className="h-4 w-4 animate-spin text-primary" /> : <Volume2 className="h-4 w-4" />}
                        </Button>
                    )}
                  </div>
                  {message.role === 'user' && (
                    <Avatar className="h-8 w-8 border shadow-sm">
                      <AvatarImage src={user?.photoURL ?? ''} />
                      <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex items-start gap-3 justify-start animate-in fade-in slide-in-from-bottom-2">
                    <Avatar className="h-8 w-8 border">
                      <AvatarFallback className="bg-slate-100"><Bot className="h-4 w-4 animate-bounce" /></AvatarFallback>
                    </Avatar>
                    <div className="bg-slate-50 border p-4 rounded-2xl rounded-tl-none">
                        <div className="flex gap-1">
                            <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></span>
                        </div>
                    </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </ScrollArea>
          
          <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase text-slate-400 tracking-widest">
                <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                Coût du message : {STAR_COSTS.AI_MESSAGE} stars
            </div>
            <div className="text-[10px] font-black text-slate-600">
                Solde : {profile?.currentStarsBalance || 0} ⭐
            </div>
          </div>

          <form onSubmit={handleSendMessage} className="flex items-center gap-2 pt-2">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Ex: Quel est le meilleur chemin de Victoire vers Gombe ?"
              disabled={isLoading}
              className="flex-1 h-12 rounded-xl border-2 focus-visible:ring-primary shadow-inner"
            />
            <Button type="submit" size="icon" className="h-12 w-12 rounded-xl shadow-lg" disabled={isLoading || !input.trim()}>
              <Send className="h-5 w-5" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
