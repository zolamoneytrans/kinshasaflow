'use client';

import React, { useState } from 'react';
import { Video, VideoComment, dummyVideos, videoUploadFormSchema, VideoUploadFormValues } from '@/lib/types';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Heart, MessageCircle, Send, UploadCloud, Loader2, User } from 'lucide-react';
import { useUser } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

// --- Comment Component ---
const CommentItem = ({ comment }: { comment: VideoComment }) => {
    return (
        <div className="flex items-start gap-3">
            <Avatar className="h-8 w-8 border">
                <AvatarImage src={comment.avatar} alt={`@${comment.user}`} />
                <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
            </Avatar>
            <div className="flex-1">
                <p className="font-semibold text-sm">{comment.user}</p>
                <p className="text-sm text-muted-foreground">{comment.text}</p>
            </div>
        </div>
    )
}

// --- Video Card Component ---
const VideoCard = ({ video, onLike, onAddComment }: { video: Video, onLike: (videoId: number) => void, onAddComment: (videoId: number, commentText: string) => void }) => {
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = useUser();
    const { toast } = useToast();
    const router = useRouter();

    const handleAddComment = () => {
        if (!user) {
            toast({ title: "Veuillez vous connecter", description: "Vous devez être connecté pour commenter.", variant: 'destructive' });
            router.push('/login');
            return;
        }
        if (newComment.trim() === '') return;
        
        setIsSubmitting(true);
        setTimeout(() => {
            onAddComment(video.id, newComment);
            setNewComment('');
            setIsSubmitting(false);
        }, 500);
    };

    return (
        <Card className="overflow-hidden">
            <CardHeader className="flex-row items-center gap-3 p-4">
                <Avatar className="h-10 w-10 border">
                    <AvatarImage src={video.userAvatar} alt={video.user} />
                    <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-semibold">{video.user}</p>
                    <p className="text-sm text-muted-foreground">{video.title}</p>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <video
                    className="w-full h-auto aspect-video bg-muted"
                    src={video.videoUrl}
                    controls
                    poster={video.thumbnailUrl}
                    preload="metadata"
                >
                    Votre navigateur ne supporte pas la balise vidéo.
                </video>
            </CardContent>
            <Collapsible>
                <CardFooter className="p-2 flex flex-col items-start gap-2">
                    <div className="flex items-center gap-2 w-full">
                        <Button variant="ghost" size="sm" className="flex items-center gap-1.5 text-muted-foreground" onClick={() => onLike(video.id)}>
                            <Heart className="h-4 w-4" />
                            <span>{video.likes}</span>
                        </Button>
                        <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="flex items-center gap-1.5 text-muted-foreground">
                                <MessageCircle className="h-4 w-4" />
                                <span>{video.comments.length}</span>
                            </Button>
                        </CollapsibleTrigger>
                        <span className="text-xs text-muted-foreground ml-auto">Source: Facebook</span>
                    </div>
                    <CollapsibleContent className="w-full space-y-4 pt-2">
                        <div className="space-y-3 max-h-60 overflow-y-auto px-2">
                            {video.comments.length > 0 ? (
                                video.comments.map(comment => <CommentItem key={comment.id} comment={comment} />)
                            ) : (
                                <p className="text-sm text-muted-foreground text-center py-4">Aucun commentaire. Soyez le premier !</p>
                            )}
                        </div>
                        <div className="flex items-center gap-2 pt-2 border-t">
                            <Input 
                                placeholder="Ajouter un commentaire..." 
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                                disabled={isSubmitting || !user}
                            />
                            <Button size="icon" onClick={handleAddComment} disabled={!newComment.trim() || isSubmitting || !user}>
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4" />}
                                <span className="sr-only">Envoyer</span>
                            </Button>
                        </div>
                    </CollapsibleContent>
                </CardFooter>
            </Collapsible>
        </Card>
    );
};

// --- Upload Dialog Component ---
const UploadVideoDialog = ({ onVideoUpload }: { onVideoUpload: (title: string, videoUrl: string) => void }) => {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();

    const form = useForm<VideoUploadFormValues>({
        resolver: zodResolver(videoUploadFormSchema),
        defaultValues: { title: '' },
    });

    const onSubmit = (data: VideoUploadFormValues) => {
        setIsSubmitting(true);
        const file = data.video[0];

        if (file.size > 60 * 1024 * 1024) { // Limit to ~60MB as a proxy for 1 minute
            toast({ title: "Fichier trop volumineux", description: "Veuillez sélectionner une vidéo de moins d'une minute.", variant: 'destructive'});
            setIsSubmitting(false);
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            onVideoUpload(data.title, e.target?.result as string);
            toast({ title: 'Vidéo mise en ligne !', description: 'Votre vidéo a été ajoutée au fil.' });
            setIsSubmitting(false);
            setOpen(false);
            form.reset();
        };
        reader.onerror = () => {
            toast({ title: 'Erreur', description: 'Impossible de lire le fichier vidéo.', variant: 'destructive' });
            setIsSubmitting(false);
        };
        reader.readAsDataURL(file);
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="w-full md:w-auto">
                    <UploadCloud className="mr-2" />
                    Mettre en ligne une vidéo
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Mettre en ligne votre vidéo</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="title"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Titre de la vidéo</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Ex: Incroyable ambiance à Matonge" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="video"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Fichier vidéo (max 1 min)</FormLabel>
                                    <FormControl>
                                        <Input 
                                            type="file" 
                                            accept="video/mp4,video/quicktime" 
                                            onChange={(e) => field.onChange(e.target.files)}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="secondary" disabled={isSubmitting}>Annuler</Button>
                            </DialogClose>
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 animate-spin" />}
                                Mettre en ligne
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

// --- Main Feed Component ---
export default function VideosFeed() {
    const [videos, setVideos] = useState<Video[]>(dummyVideos);
    const { user } = useUser();
    const router = useRouter();
    const { toast } = useToast();

    const handleLike = (videoId: number) => {
        setVideos(prevVideos => 
            prevVideos.map(v => 
                v.id === videoId ? { ...v, likes: v.likes + 1 } : v
            )
        );
    };

    const handleAddComment = (videoId: number, commentText: string) => {
        if (!user) return; // Should be handled in VideoCard but as a safeguard
        const newComment: VideoComment = {
            id: `c${Date.now()}`,
            user: user.isAnonymous ? "Utilisateur Anonyme" : (user.displayName || "Utilisateur"),
            avatar: user.photoURL || "",
            text: commentText,
        };
        setVideos(prevVideos => 
            prevVideos.map(v => 
                v.id === videoId ? { ...v, comments: [...v.comments, newComment] } : v
            )
        );
    };

    const handleVideoUpload = (title: string, videoUrl: string) => {
        if (!user) {
            toast({ title: "Veuillez vous connecter", description: "Vous devez être connecté pour publier une vidéo.", variant: 'destructive'});
            router.push('/login');
            return;
        }
        const newVideo: Video = {
            id: Date.now(),
            title,
            videoUrl,
            user: user.isAnonymous ? "Utilisateur Anonyme" : (user.displayName || "Utilisateur"),
            userAvatar: user.photoURL || "",
            thumbnailUrl: 'https://picsum.photos/seed/new/1280/720', // generic thumbnail
            likes: 0,
            comments: [],
        };
        setVideos(prevVideos => [newVideo, ...prevVideos]);
    };

    return (
        <div className="w-full h-full overflow-y-auto pr-2">
            <div className="max-w-3xl mx-auto space-y-6 pb-4">
                 <div className="p-4 border rounded-lg bg-card">
                   <UploadVideoDialog onVideoUpload={handleVideoUpload} />
                </div>
                {videos.map(video => (
                    <VideoCard key={video.id} video={video} onLike={handleLike} onAddComment={handleAddComment} />
                ))}
            </div>
        </div>
    );
}