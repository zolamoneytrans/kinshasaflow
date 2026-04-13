
'use client';

import React, { useState } from 'react';
import { Video, videoUploadFormSchema, VideoUploadFormValues, Comment, WithId } from '@/lib/types';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Heart, MessageCircle, Send, UploadCloud, Loader2, User, MoreVertical, Trash2 } from 'lucide-react';
import { useUser, useFirebase, useCollection, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';
import { collection, query, orderBy, serverTimestamp, doc, setDoc, deleteDoc, updateDoc, increment, addDoc } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Skeleton } from './ui/skeleton';

const CommentItem = ({ comment }: { comment: WithId<Comment> }) => {
    const formattedTime = comment.createdAt ? formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true, locale: fr }) : '...';
    return (
        <div className="flex items-start gap-3">
            <Avatar className="h-8 w-8 border">
                <AvatarImage src={comment.avatar} alt={`@${comment.author}`} />
                <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
            </Avatar>
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">{comment.author}</p>
                    <span className="text-xs text-muted-foreground">{formattedTime}</span>
                </div>
                <p className="text-sm text-muted-foreground">{comment.text}</p>
            </div>
        </div>
    )
}

const VideoCard = ({ video }: { video: WithId<Video> }) => {
    const [newComment, setNewComment] = useState('');
    const [isSubmittingComment, setIsSubmittingComment] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    
    const { user } = useUser();
    const { firestore, firebaseApp } = useFirebase();
    const { toast } = useToast();
    const router = useRouter();

    const videoDocRef = useMemoFirebase(() => doc(firestore, 'videos', video.id), [firestore, video.id]);
    const commentsCollectionRef = useMemoFirebase(() => collection(videoDocRef, 'comments'), [videoDocRef]);
    const commentsQuery = useMemoFirebase(() => query(commentsCollectionRef, orderBy('createdAt', 'desc')), [commentsCollectionRef]);
    const { data: comments, isLoading: areCommentsLoading } = useCollection<Comment>(commentsQuery);

    const handleLike = async () => {
        if (!user) {
            toast({ title: "Veuillez vous connecter", description: "Vous devez être connecté pour aimer une vidéo.", variant: 'destructive' });
            router.push('/login');
            return;
        }
        await updateDoc(videoDocRef, { likes: increment(1) });
    };

    const handleAddComment = async () => {
        if (!user) {
            toast({ title: "Veuillez vous connecter", description: "Vous devez être connecté pour commenter.", variant: 'destructive' });
            router.push('/login');
            return;
        }
        if (newComment.trim() === '') return;
        
        setIsSubmittingComment(true);
        const commentData = {
            userId: user.uid,
            author: user.isAnonymous ? "Anonyme" : (user.displayName || "Utilisateur"),
            avatar: user.photoURL || "",
            text: newComment,
            createdAt: serverTimestamp(),
        };

        await addDocumentNonBlocking(commentsCollectionRef, commentData);
        setNewComment('');
        setIsSubmittingComment(false);
    };
    
    const handleDelete = async () => {
        if (user?.uid !== video.userId) return;
        setIsDeleting(true);
        try {
            const storage = getStorage(firebaseApp);
            const videoFileRef = storageRef(storage, video.videoUrl);
            await deleteObject(videoFileRef);
            await deleteDoc(videoDocRef);
            toast({ title: "Vidéo supprimée" });
        } catch (error) {
            toast({ title: "Erreur", variant: "destructive" });
            setIsDeleting(false);
        }
    };

    return (
        <Card className="overflow-hidden rounded-3xl border-none shadow-sm">
            <CardHeader className="flex-row items-center justify-between gap-3 p-4">
                <div className="flex items-center gap-3">
                    <Avatar className="h-10 w-10 border">
                        <AvatarImage src={video.userAvatar} alt={video.user} />
                        <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
                    </Avatar>
                    <div>
                        <p className="font-semibold">{video.user}</p>
                        <p className="text-sm text-muted-foreground">{video.title}</p>
                    </div>
                </div>
                {user?.uid === video.userId && (
                     <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" disabled={isDeleting}>
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                             <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive">
                                        <Trash2 className="mr-2 h-4 w-4" />
                                        Supprimer
                                    </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Supprimer cette vidéo ?</AlertDialogTitle>
                                        <AlertDialogDescription>Cette action est irréversible.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleDelete} className="bg-destructive">Supprimer</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </CardHeader>
            <CardContent className="p-0">
                <video className="w-full aspect-video bg-black" src={video.videoUrl} controls preload="metadata" />
            </CardContent>
            <CardFooter className="p-2 flex flex-col items-start gap-2">
                <div className="flex items-center gap-4 w-full px-2">
                    <button onClick={handleLike} className="flex items-center gap-1.5 text-muted-foreground hover:text-red-500 transition-colors">
                        <Heart className="h-5 w-5" />
                        <span className="text-xs font-bold">{video.likes}</span>
                    </button>
                    <button className="flex items-center gap-1.5 text-muted-foreground">
                        <MessageCircle className="h-5 w-5" />
                        <span className="text-xs font-bold">{comments?.length ?? 0}</span>
                    </button>
                </div>
            </CardFooter>
        </Card>
    );
};

const UploadVideoDialog = () => {
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { toast } = useToast();
    const { user } = useUser();
    const { firestore, firebaseApp } = useFirebase();

    const form = useForm<VideoUploadFormValues>({
        resolver: zodResolver(videoUploadFormSchema),
        defaultValues: { title: '' },
    });

    const onSubmit = async (data: VideoUploadFormValues) => {
        if (!user) return;
        setIsSubmitting(true);
        const file = data.video[0];

        try {
            const newVideoRef = doc(collection(firestore, 'videos'));
            const videoId = newVideoRef.id;
            const storage = getStorage(firebaseApp);
            const fileRef = storageRef(storage, `videos/${user.uid}/${videoId}`);

            await uploadBytes(fileRef, file);
            const videoUrl = await getDownloadURL(fileRef);

            const videoData = {
                title: data.title,
                videoUrl,
                thumbnailUrl: `https://picsum.photos/seed/${videoId}/1280/720`,
                userId: user.uid,
                user: user.isAnonymous ? "Anonyme" : (user.displayName || "Utilisateur"),
                userAvatar: user.photoURL || "",
                likes: 0,
                createdAt: serverTimestamp(),
            };

            await setDoc(newVideoRef, videoData);

            // Global Notification
            const notifRef = collection(firestore, 'notifications');
            await addDoc(notifRef, {
                type: 'video_added',
                title: 'Nouvelle vidéo !',
                message: `${videoData.user} a partagé une nouvelle vidéo de Kinshasa.`,
                timestamp: serverTimestamp(),
                link: '/videos'
            });
            
            toast({ title: 'Vidéo publiée !' });
            setOpen(false);
            form.reset();
        } catch (error) {
            toast({ title: 'Erreur', variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="rounded-2xl h-12 px-6 font-black shadow-lg">
                    <UploadCloud className="mr-2 h-5 w-5" />
                    Publier une vidéo
                </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl">
                <DialogHeader><DialogTitle>Partager une vidéo</DialogTitle></DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="title" render={({ field }) => (
                            <FormItem><FormLabel>Titre</FormLabel><FormControl><Input placeholder="Ex: Matinée à Gombe" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                         <FormField control={form.control} name="video" render={({ field }) => (
                            <FormItem><FormLabel>Fichier vidéo</FormLabel><FormControl><Input type="file" accept="video/*" onChange={(e) => field.onChange(e.target.files)} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <DialogFooter>
                            <Button type="submit" disabled={isSubmitting} className="w-full h-12 rounded-xl">
                                {isSubmitting ? <Loader2 className="animate-spin mr-2" /> : null}
                                Mettre en ligne
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    )
}

export default function VideosFeed() {
    const { firestore } = useFirebase();
    const { user } = useUser();
    const videosCollection = useMemoFirebase(() => collection(firestore, 'videos'), [firestore]);
    const videosQuery = useMemoFirebase(() => query(videosCollection, orderBy('createdAt', 'desc')), [videosCollection]);
    const { data: videos, isLoading } = useCollection<Video>(videosQuery);

    return (
        <div className="w-full h-full overflow-y-auto bg-slate-50/50">
            <div className="max-w-2xl mx-auto space-y-6 p-4 md:p-8">
                {user && <UploadVideoDialog />}
                {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => <Card key={i} className="h-64 rounded-3xl animate-pulse bg-slate-200" />)
                ) : videos && videos.length > 0 ? (
                     videos.map(video => <VideoCard key={video.id} video={video} />)
                ) : (
                    <div className="text-center py-20 bg-white rounded-[3rem] border-2 border-dashed">
                        <p className="text-muted-foreground font-bold">Aucune vidéo pour le moment.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
