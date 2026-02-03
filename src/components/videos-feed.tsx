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
import { collection, query, orderBy, serverTimestamp, doc, setDoc, deleteDoc, updateDoc, increment } from 'firebase/firestore';
import { getStorage, ref as storageRef, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Skeleton } from './ui/skeleton';

// --- Comment Component ---
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

// --- Video Card Component ---
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
            author: user.isAnonymous ? "Utilisateur Anonyme" : (user.displayName || "Utilisateur Anonyme"),
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
            // Delete video from storage
            const storage = getStorage(firebaseApp);
            const videoFileRef = storageRef(storage, video.videoUrl);
            await deleteObject(videoFileRef);

            // Delete video document from firestore
            await deleteDoc(videoDocRef);

            toast({ title: "Vidéo supprimée", description: "Votre vidéo a été supprimée avec succès." });
        } catch (error) {
            console.error("Error deleting video:", error);
            toast({ title: "Erreur", description: "Impossible de supprimer la vidéo. Veuillez réessayer.", variant: "destructive" });
            setIsDeleting(false);
        }
        // The component will unmount on successful deletion, so no need to setIsDeleting(false) in success path
    };

    return (
        <Card className="overflow-hidden">
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
                                        <AlertDialogTitle>Êtes-vous sûr?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Cette action est irréversible. La vidéo sera définitivement supprimée de nos serveurs.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Annuler</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                                            {isDeleting ? <Loader2 className="mr-2 animate-spin" /> : null}
                                            Supprimer
                                        </AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
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
                        <Button variant="ghost" size="sm" className="flex items-center gap-1.5 text-muted-foreground" onClick={handleLike}>
                            <Heart className="h-4 w-4" />
                            <span>{video.likes}</span>
                        </Button>
                        <CollapsibleTrigger asChild>
                            <Button variant="ghost" size="sm" className="flex items-center gap-1.5 text-muted-foreground">
                                <MessageCircle className="h-4 w-4" />
                                <span>{comments?.length ?? 0}</span>
                            </Button>
                        </CollapsibleTrigger>
                        <span className="text-xs text-muted-foreground ml-auto">Source: Kinshasa Flow</span>
                    </div>
                    <CollapsibleContent className="w-full space-y-4 pt-2">
                        <div className="space-y-3 max-h-60 overflow-y-auto px-2">
                            {areCommentsLoading ? <div className="text-center text-sm text-muted-foreground py-4">Chargement des commentaires...</div>
                               : comments && comments.length > 0 ? (
                                comments.map(comment => <CommentItem key={comment.id} comment={comment} />)
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
                                disabled={isSubmittingComment || !user}
                            />
                            <Button size="icon" onClick={handleAddComment} disabled={!newComment.trim() || isSubmittingComment || !user}>
                                {isSubmittingComment ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4" />}
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
        if (!user) {
            toast({ title: "Veuillez vous connecter", description: "Vous devez être connecté pour publier une vidéo.", variant: 'destructive' });
            return;
        }

        setIsSubmitting(true);
        const file = data.video[0];

        if (file.size > 60 * 1024 * 1024) { // Limit to ~60MB as a proxy for 1 minute
            toast({ title: "Fichier trop volumineux", description: "Veuillez sélectionner une vidéo de moins d'une minute.", variant: 'destructive'});
            setIsSubmitting(false);
            return;
        }

        try {
            const newVideoRef = doc(collection(firestore, 'videos'));
            const videoId = newVideoRef.id;
            
            const storage = getStorage(firebaseApp);
            const fileRef = storageRef(storage, `videos/${user.uid}/${videoId}`);

            await uploadBytes(fileRef, file);
            const videoUrl = await getDownloadURL(fileRef);

            const videoData: Video = {
                title: data.title,
                videoUrl,
                thumbnailUrl: `https://picsum.photos/seed/${videoId}/1280/720`,
                userId: user.uid,
                user: user.isAnonymous ? "Utilisateur Anonyme" : (user.displayName || "Utilisateur"),
                userAvatar: user.photoURL || "",
                likes: 0,
                createdAt: serverTimestamp() as any,
            };

            await setDoc(newVideoRef, videoData);
            
            toast({ title: 'Vidéo mise en ligne !', description: 'Votre vidéo a été ajoutée au fil.' });
            setOpen(false);
            form.reset();
        } catch (error) {
            console.error("Error uploading video:", error);
            toast({ title: 'Erreur', description: "Une erreur est survenue lors de la mise en ligne.", variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
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

const VideoSkeleton = () => (
    <Card>
        <CardHeader className="flex-row items-center gap-3 p-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-2">
                <Skeleton className="h-4 w-[150px]" />
                <Skeleton className="h-3 w-[100px]" />
            </div>
        </CardHeader>
        <CardContent className="p-0">
            <Skeleton className="w-full aspect-video" />
        </CardContent>
        <CardFooter className="p-2">
            <Skeleton className="h-8 w-full" />
        </CardFooter>
    </Card>
);

// --- Main Feed Component ---
export default function VideosFeed() {
    const { firestore } = useFirebase();
    const { user } = useUser();
    
    const videosCollection = useMemoFirebase(() => collection(firestore, 'videos'), [firestore]);
    const videosQuery = useMemoFirebase(() => query(videosCollection, orderBy('createdAt', 'desc')), [videosCollection]);
    const { data: videos, isLoading } = useCollection<Video>(videosQuery);

    return (
        <div className="w-full h-full overflow-y-auto pr-2">
            <div className="max-w-3xl mx-auto space-y-6 pb-4">
                {user && 
                    <div className="p-4 border rounded-lg bg-card">
                        <UploadVideoDialog />
                    </div>
                }
                {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => <VideoSkeleton key={i} />)
                ) : videos && videos.length > 0 ? (
                     videos.map(video => (
                        <VideoCard key={video.id} video={video} />
                    ))
                ) : (
                    <div className="text-center py-10 rounded-lg border bg-card">
                        <p className="text-muted-foreground">Aucune vidéo pour le moment.</p>
                        <p className="text-sm text-muted-foreground">Soyez le premier à en mettre une en ligne !</p>
                    </div>
                )}
            </div>
        </div>
    );
}
