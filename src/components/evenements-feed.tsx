'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { EventReport, Comment as CommentType, WithId } from '@/lib/types';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Clock, MessageSquare, Send, ThumbsUp, ThumbsDown, Loader2 } from 'lucide-react';
import { Badge, badgeVariants } from '@/components/ui/badge';
import { type VariantProps } from 'class-variance-authority';
import { Separator } from '@/components/ui/separator';
import { useCollection, useFirebase, useUser, useMemoFirebase, addDocumentNonBlocking, initiateAnonymousSignIn } from '@/firebase';
import { collection, query, orderBy, serverTimestamp, Timestamp, doc } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Skeleton } from './ui/skeleton';

const SeverityBadge = ({ severity }: { severity: EventReport['severity'] }) => {
    const variant: VariantProps<typeof badgeVariants>['variant'] = {
        low: 'success',
        medium: 'secondary',
        high: 'destructive',
    }[severity];
    
    const severityText = {
        low: 'Faible',
        medium: 'Moyen',
        high: 'Élevé'
    }[severity];

    return <Badge variant={variant}>{severityText}</Badge>;
}

const Comment = ({ comment }: { comment: WithId<CommentType> }) => {
    const formattedTime = comment.createdAt ? formatDistanceToNow(comment.createdAt.toDate(), { addSuffix: true, locale: fr }) : '...';
    return (
        <div className="flex items-start gap-3">
            <Avatar className="h-8 w-8 border">
                <AvatarImage src={comment.avatar} alt={`@${comment.author}`} />
                <AvatarFallback>{comment.author.charAt(0)}</AvatarFallback>
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

const EventCard = ({ event }: { event: WithId<EventReport> }) => {
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const { firestore, auth } = useFirebase();
    const { user, isUserLoading } = useUser();
    
    const commentsCollection = useMemoFirebase(() => collection(firestore, 'events', event.id, 'comments'), [firestore, event.id]);
    const commentsQuery = useMemoFirebase(() => query(commentsCollection, orderBy('createdAt', 'desc')), [commentsCollection]);
    const { data: comments, isLoading: isLoadingComments } = useCollection<CommentType>(commentsQuery);

    const handleAddComment = async () => {
        if (newComment.trim() === '' || !user) {
             if (!user && !isUserLoading) {
                initiateAnonymousSignIn(auth);
            }
            return;
        }

        setIsSubmitting(true);
        const commentData = {
            userId: user.uid,
            author: user.isAnonymous ? "Utilisateur Anonyme" : (user.displayName || "Utilisateur Anonyme"),
            avatar: user.photoURL || `https://i.pravatar.cc/150?u=${user.uid}`,
            text: newComment,
            createdAt: serverTimestamp(),
        };

        await addDocumentNonBlocking(commentsCollection, commentData);
        setNewComment('');
        setIsSubmitting(false);
    };

    const formattedTime = event.createdAt ? formatDistanceToNow(event.createdAt.toDate(), { addSuffix: true, locale: fr }) : '...';

    return (
        <Card className="overflow-hidden">
            <CardHeader className="p-4">
                <div className="flex items-start gap-4">
                    <Avatar className="border">
                        <AvatarImage src={event.userAvatar} alt={`@${event.user}`} />
                        <AvatarFallback>{event.user.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                        <div className="flex items-center justify-between">
                            <p className="font-semibold">{event.user}</p>
                            <SeverityBadge severity={event.severity} />
                        </div>
                        <p className="text-sm text-muted-foreground">{event.location}</p>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <p className="mb-4">{event.description}</p>
                {event.picture && (
                    <div className="relative aspect-video w-full rounded-lg overflow-hidden border">
                        <Image src={event.picture} alt={`Image for ${event.location}`} fill objectFit="cover" />
                    </div>
                )}
            </CardContent>
            <CardFooter className="p-4 pt-0 flex-col items-start gap-4">
                <div className="flex items-center justify-between w-full">
                     <div className="flex items-center text-xs text-muted-foreground">
                        <Clock className="w-3 h-3 mr-1.5" />
                        <span>Signalé {formattedTime}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="gap-1 px-2 h-auto text-muted-foreground">
                            <ThumbsUp className="w-4 h-4"/> 
                            <span className="text-xs">0</span>
                        </Button>
                         <Button variant="ghost" size="sm" className="gap-1 px-2 h-auto text-muted-foreground">
                            <ThumbsDown className="w-4 h-4"/>
                             <span className="text-xs">0</span>
                        </Button>
                    </div>
                </div>
                
                <Separator />

                <Collapsible className="w-full">
                    <CollapsibleTrigger asChild>
                        <Button variant="link" className="p-0 h-auto text-sm">
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Voir les {comments?.length ?? 0} commentaires
                        </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-4 pt-4">
                        {isLoadingComments ? (
                            <div className="text-center text-sm text-muted-foreground">Chargement...</div>
                        ) : comments && comments.length > 0 ? (
                            comments.map(comment => <Comment key={comment.id} comment={comment} />)
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">Aucun commentaire pour le moment. Soyez le premier à réagir !</p>
                        )}
                        
                        <div className="flex items-center gap-2 pt-4">
                            <Input 
                                placeholder="Ajouter un commentaire..." 
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                                disabled={isSubmitting || isUserLoading}
                            />
                            <Button size="icon" onClick={handleAddComment} disabled={!newComment.trim() || isSubmitting || isUserLoading}>
                                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin"/> : <Send className="w-4 h-4" />}
                                <span className="sr-only">Envoyer le commentaire</span>
                            </Button>
                        </div>
                    </CollapsibleContent>
                </Collapsible>
            </CardFooter>
        </Card>
    );
}

const EventCardSkeleton = () => (
    <Card>
        <CardHeader className="p-4">
            <div className="flex items-start gap-4">
                <Skeleton className="w-10 h-10 rounded-full" />
                <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/2" />
                </div>
            </div>
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="aspect-video w-full rounded-lg" />
        </CardContent>
        <CardFooter className="p-4 pt-0">
             <Skeleton className="h-8 w-full" />
        </CardFooter>
    </Card>
);


export default function EvenementsFeed() {
    const { firestore } = useFirebase();
    const eventsCollection = useMemoFirebase(() => collection(firestore, 'events'), [firestore]);
    const eventsQuery = useMemoFirebase(() => query(eventsCollection, orderBy('createdAt', 'desc')), [eventsCollection]);
    const { data: events, isLoading } = useCollection<EventReport>(eventsQuery);

  return (
    <div className="w-full h-full overflow-y-auto pr-2">
        <div className="max-w-3xl mx-auto space-y-4 pb-4">
            {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => <EventCardSkeleton key={i} />)
            ) : events && events.length > 0 ? (
                events.map(event => (
                    <EventCard key={event.id} event={event} />
                ))
            ) : (
                <div className="text-center py-10">
                    <p className="text-muted-foreground">Aucun événement signalé pour le moment.</p>
                </div>
            )}
        </div>
    </div>
  );
}
