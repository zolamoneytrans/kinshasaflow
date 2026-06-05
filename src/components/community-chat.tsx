'use client';

import React, { useState, useRef, useEffect } from 'react';
import { useFirebase, useUser, useCollection, useMemoFirebase, errorEmitter } from '@/firebase';
import { collection, query, orderBy, limit, addDoc, serverTimestamp, doc } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL } from 'firebase/storage';
import { CommunityMessage, WithId, FirestorePermissionError } from '@/lib/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { 
  Send, 
  Image as ImageIcon, 
  Video, 
  Mic, 
  MicOff, 
  Loader2, 
  MapPin, 
  User, 
  Clock, 
  Play, 
  Pause, 
  AlertTriangle, 
  MessagesSquare 
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import Image from 'next/image';

const MessageBubble = ({ message, isOwn }: { message: WithId<CommunityMessage>, isOwn: boolean }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const time = message.timestamp?.toDate ? formatDistanceToNow(message.timestamp.toDate(), { addSuffix: true, locale: fr }) : '...';

  const toggleAudio = () => {
    if (!audioRef.current) {
      audioRef.current = new Audio(message.mediaUrl);
      audioRef.current.onended = () => setIsPlaying(false);
    }
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: isOwn ? 20 : -20 }}
      animate={{ opacity: 1, x: 0 }}
      className={cn("flex items-end gap-2 mb-6", isOwn ? "flex-row-reverse" : "flex-row")}
    >
      <Avatar className="h-8 w-8 shrink-0 border border-slate-100 shadow-sm">
        <AvatarImage src={message.userAvatar} />
        <AvatarFallback className="bg-slate-50 text-[10px] font-black uppercase text-slate-400">
          <User className="h-4 w-4" />
        </AvatarFallback>
      </Avatar>

      <div className={cn("max-w-[75%] flex flex-col", isOwn ? "items-end" : "items-start")}>
        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest mb-1 px-1">
          {isOwn ? "Moi" : message.userName}
        </span>
        
        <div className={cn(
          "p-4 rounded-[1.5rem] shadow-sm relative",
          isOwn 
            ? "bg-primary text-white rounded-br-none" 
            : "bg-white border border-slate-100 text-slate-800 rounded-bl-none"
        )}>
          {message.mediaUrl && message.mediaType === 'image' && (
            <div className="relative aspect-video rounded-xl overflow-hidden mb-3 border border-black/5">
              <Image src={message.mediaUrl} alt="Partage" fill className="object-cover" />
            </div>
          )}

          {message.mediaUrl && message.mediaType === 'video' && (
            <video src={message.mediaUrl} controls className="rounded-xl mb-3 max-h-60 bg-black" />
          )}

          {message.mediaUrl && message.mediaType === 'audio' && (
            <div className="flex items-center gap-3 py-1 pr-2">
              <Button 
                onClick={toggleAudio} 
                size="icon" 
                variant="ghost" 
                className={cn("rounded-full h-10 w-10 shrink-0", isOwn ? "text-white hover:bg-white/10" : "text-primary hover:bg-primary/10")}
              >
                {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 fill-current" />}
              </Button>
              <div className="flex-1 h-1.5 bg-current/20 rounded-full min-w-[120px]">
                <div className="h-full bg-current rounded-full" style={{ width: isPlaying ? '100%' : '0%', transition: 'width 2s linear' }} />
              </div>
            </div>
          )}

          {message.text && (
            <p className={cn("text-sm leading-relaxed", isOwn ? "font-medium" : "font-medium text-slate-700")}>
              {message.text}
            </p>
          )}

          <div className={cn(
            "flex items-center gap-1.5 mt-2",
            isOwn ? "text-white/60" : "text-slate-400"
          )}>
            <Clock className="h-2.5 w-2.5" />
            <span className="text-[9px] font-black uppercase">{time}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default function CommunityChat() {
  const [inputText, setInputText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { user, firestore, firebaseApp } = useFirebase();
  const { toast } = useToast();

  const messagesQuery = useMemoFirebase(() => {
    return query(collection(firestore, 'community_chat'), orderBy('timestamp', 'desc'), limit(50));
  }, [firestore]);

  const { data: messages, isLoading } = useCollection<CommunityMessage>(messagesQuery);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const handleSend = async (text?: string, mediaFile?: File, mediaType?: 'image' | 'video' | 'audio') => {
    if (!user) {
      toast({ title: "Connexion requise", variant: "destructive" });
      return;
    }
    if (!text?.trim() && !mediaFile) return;

    setIsUploading(true);
    const chatCollection = collection(firestore, 'community_chat');
    
    try {
      let mediaUrl = "";
      if (mediaFile) {
        const storage = getStorage(firebaseApp);
        
        // Sanitization extrême du nom de fichier pour éviter les rejets de Storage Rules
        const extension = mediaFile.name.split('.').pop() || 'file';
        const rawName = mediaFile.name.split('.')[0] || 'upload';
        const cleanName = rawName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 30);
        const fileName = `${Date.now()}_${cleanName}.${extension}`;
        
        const fileRef = storageRef(storage, `chat/${user.uid}/${fileName}`);
        
        try {
          const snapshot = await uploadBytes(fileRef, mediaFile);
          mediaUrl = await getDownloadURL(snapshot.ref);
        } catch (storageError: any) {
          console.error("Storage Error Detail:", storageError);
          toast({ 
            title: "Accès Storage refusé", 
            description: "Vérifiez vos permissions ou réessayez.", 
            variant: "destructive" 
          });
          setIsUploading(false);
          return;
        }
      }

      const messageData = {
        userId: user.uid,
        userName: user.displayName || "Kinois Anonyme",
        userAvatar: user.photoURL || "",
        text: text?.trim() || "",
        mediaUrl,
        mediaType: mediaType || null,
        timestamp: serverTimestamp(),
      };

      await addDoc(chatCollection, messageData).catch((err) => {
        errorEmitter.emit('permission-error', new FirestorePermissionError({
          path: chatCollection.path,
          operation: 'create',
          requestResourceData: messageData
        }));
        throw err;
      });

      setInputText('');
    } catch (e: any) {
      console.error("Global Send Error:", e);
      toast({ title: "Erreur d'envoi", description: e.message || "Impossible de poster.", variant: "destructive" });
    } finally {
      setIsUploading(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        const audioFile = new File([audioBlob], "voice.wav", { type: 'audio/wav' });
        handleSend(undefined, audioFile, 'audio');
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      toast({ title: "Microphone inaccessible", description: "Veuillez autoriser l'accès au micro.", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <div className="w-full h-full flex flex-col bg-slate-50/50">
      
      {/* Header Info */}
      <div className="p-4 bg-white border-b flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-3">
          <div className="bg-primary p-2 rounded-xl shadow-lg shadow-primary/20">
            <MessagesSquare className="text-white h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-black text-slate-900 tracking-tight leading-none">Radio Trottoir Live</h2>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse"></div>
              <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Discussion Directe</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <Badge variant="outline" className="border-amber-200 text-amber-600 bg-amber-50 font-black text-[9px] uppercase">Alerte Travaux</Badge>
            <Badge variant="outline" className="border-red-200 text-red-600 bg-red-50 font-black text-[9px] uppercase">Police</Badge>
        </div>
      </div>

      {/* Chat Area */}
      <ScrollArea className="flex-1 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100 flex items-center gap-4 mb-10">
            <div className="bg-primary p-3 rounded-2xl text-white shrink-0">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <p className="text-xs font-bold text-slate-600 leading-relaxed italic">
              "Signalez ici tout incident sur la route : inondations, bouchons anormaux, ou présence policière. Soyez courtois et aidez les autres conducteurs."
            </p>
          </div>

          <div className="flex flex-col">
            <AnimatePresence>
              {[...(messages || [])].reverse().map((msg) => (
                <MessageBubble key={msg.id} message={msg} isOwn={msg.userId === user?.uid} />
              ))}
            </AnimatePresence>
            <div ref={scrollRef} />
          </div>

          {isLoading && (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Connexion au salon...</p>
            </div>
          )}
        </div>
      </ScrollArea>

      {/* Input Bar */}
      <div className="p-4 md:p-6 bg-white border-t">
        <div className="max-w-4xl mx-auto flex items-center gap-2 md:gap-4">
          <div className="flex items-center gap-1 md:gap-2">
            <input 
              type="file" 
              id="chat-image" 
              className="hidden" 
              accept="image/*" 
              disabled={isUploading}
              onChange={e => e.target.files?.[0] && handleSend(undefined, e.target.files[0], 'image')} 
            />
            <Button asChild variant="ghost" size="icon" className="rounded-full h-12 w-12 text-slate-400 hover:text-primary hover:bg-primary/5">
              <label htmlFor="chat-image" className={cn("cursor-pointer", isUploading && "opacity-50 pointer-events-none")}><ImageIcon className="h-5 w-5" /></label>
            </Button>

            <input 
              type="file" 
              id="chat-video" 
              className="hidden" 
              accept="video/*" 
              disabled={isUploading}
              onChange={e => e.target.files?.[0] && handleSend(undefined, e.target.files[0], 'video')} 
            />
            <Button asChild variant="ghost" size="icon" className="rounded-full h-12 w-12 text-slate-400 hover:text-primary hover:bg-primary/5">
              <label htmlFor="chat-video" className={cn("cursor-pointer", isUploading && "opacity-50 pointer-events-none")}><Video className="h-5 w-5" /></label>
            </Button>
          </div>

          <div className="flex-1 relative">
            <Input 
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !isUploading && handleSend(inputText)}
              placeholder="Écrivez un signalement..."
              disabled={isUploading}
              className="h-14 rounded-2xl border-2 border-slate-100 bg-slate-50 focus-visible:ring-primary font-bold pl-6 pr-12"
            />
            {isUploading ? (
              <div className="absolute right-4 top-1/2 -translate-y-1/2">
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
              </div>
            ) : (
              <Button 
                onClick={() => handleSend(inputText)}
                disabled={!inputText.trim()}
                variant="ghost" 
                size="icon" 
                className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-xl text-primary hover:bg-transparent"
              >
                <Send className="h-5 w-5" />
              </Button>
            )}
          </div>

          <div className="flex items-center">
            {isRecording ? (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-3 py-2 bg-red-50 rounded-full border border-red-100 animate-pulse">
                  <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                  <span className="text-[10px] font-black text-red-600 uppercase">Enregistre</span>
                </div>
                <Button onClick={stopRecording} className="h-12 w-12 rounded-full bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200">
                  <MicOff className="h-5 w-5 text-white" />
                </Button>
              </div>
            ) : (
              <Button onClick={startRecording} variant="outline" size="icon" disabled={isUploading} className="h-12 w-12 rounded-full border-2 border-slate-100 text-slate-400 hover:border-primary hover:text-primary transition-all">
                <Mic className="h-5 w-5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}