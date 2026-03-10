'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Bot, Send, User, Loader2, Volume2, VolumeX } from 'lucide-react';
import { askAssistantAction, generateSpeechAction } from '@/app/actions';
import { useUser } from '@/firebase';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

type Message = {
  role: 'user' | 'assistant';
  content: string;
};

export default function AssistantChat() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeakingId, setIsSpeakingId] = useState<number | null>(null);
  const { user } = useUser();
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Clean up audio on unmount
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
      if (audioRef.current) {
        audioRef.current.pause();
      }
      setIsSpeakingId(null);
      return;
    }

    setIsSpeakingId(index);
    try {
      if (audioRef.current) {
        audioRef.current.pause();
      }

      const result = await generateSpeechAction(text);
      if (!result || !result.media) {
        throw new Error('Données audio manquantes');
      }

      const audio = new Audio(result.media);
      audioRef.current = audio;
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.error("Audio playback failed:", error);
          setIsSpeakingId(null);
        });
      }

      audio.onended = () => {
        setIsSpeakingId(null);
        audioRef.current = null;
      };
      
      audio.onerror = (e) => {
        console.error("Audio element error:", e);
        setIsSpeakingId(null);
        audioRef.current = null;
      };

    } catch (error: any) {
      console.error('Error generating speech:', error);
      toast({
        title: "Erreur audio",
        description: error.message || "Impossible de lire le message. Veuillez réessayer.",
        variant: "destructive"
      });
      setIsSpeakingId(null);
    }
  };
  
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const result = await askAssistantAction({ question: input });
      const assistantMessage: Message = { role: 'assistant', content: result.answer };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Error getting assistant response:', error);
      const errorMessage: Message = { role: 'assistant', content: "Désolé, une erreur s'est produite. Veuillez réessayer." };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full h-full flex justify-center items-center">
      <Card className="w-full max-w-3xl h-[90%] flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            <Avatar className="h-9 w-9">
              <AvatarFallback className="bg-primary text-primary-foreground"><Bot /></AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
                <span className="text-lg">Assistant K-Flow</span>
                <span className="text-xs text-muted-foreground font-normal">Expert en routes de Kinshasa</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col gap-4 overflow-hidden">
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-6">
              {messages.length === 0 && (
                  <div className="text-center py-10 text-muted-foreground italic">
                      "Mbote! Naza K-Flow Assistant. Ndenge nini nakoki kosalisa yo lelo?"
                  </div>
              )}
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    'flex items-start gap-3',
                    message.role === 'user' ? 'justify-end' : 'justify-start'
                  )}
                >
                  {message.role === 'assistant' && (
                    <Avatar className="h-8 w-8 border">
                      <AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      'max-w-md rounded-lg p-3 text-sm relative group',
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-muted'
                    )}
                  >
                    {message.content}
                    {message.role === 'assistant' && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className={cn(
                              "absolute -right-10 top-0 transition-opacity h-8 w-8",
                              isSpeakingId === index ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                            )}
                            onClick={() => handleSpeech(index, message.content)}
                            disabled={isSpeakingId !== null && isSpeakingId !== index}
                        >
                            {isSpeakingId === index ? (
                                <Loader2 className="h-4 w-4 animate-spin text-primary" />
                            ) : (
                                <Volume2 className="h-4 w-4" />
                            )}
                        </Button>
                    )}
                  </div>
                  {message.role === 'user' && (
                    <Avatar className="h-8 w-8 border">
                      <AvatarImage src={user?.photoURL ?? ''} />
                      <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="flex items-start gap-3 justify-start">
                    <Avatar className="h-8 w-8 border">
                      <AvatarFallback><Bot className="h-4 w-4" /></AvatarFallback>
                    </Avatar>
                    <div className="bg-muted p-3 rounded-lg">
                        <Loader2 className="h-5 w-5 animate-spin" />
                    </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </ScrollArea>
          <form onSubmit={handleSendMessage} className="flex items-center gap-2 border-t pt-4">
            <Input
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Posez votre question (ex: Itinéraire Victoire vers Gombe...)"
              disabled={isLoading}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={isLoading || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
