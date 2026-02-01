'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { EventReport, dummyEvents, Comment as CommentType } from '@/lib/types';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import { Clock, MessageSquare, Send, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Badge, badgeVariants } from '@/components/ui/badge';
import { type VariantProps } from 'class-variance-authority';
import { Separator } from '@/components/ui/separator';

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

const Comment = ({ comment }: { comment: CommentType }) => {
    return (
        <div className="flex items-start gap-3">
            <Avatar className="h-8 w-8 border">
                <AvatarImage src={comment.avatar} alt={`@${comment.author}`} />
                <AvatarFallback>{comment.author.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
                <div className="flex items-center gap-2">
                    <p className="font-semibold text-sm">{comment.author}</p>
                    <span className="text-xs text-muted-foreground">{comment.timestamp}</span>
                </div>
                <p className="text-sm text-muted-foreground">{comment.text}</p>
            </div>
        </div>
    )
}

const EventCard = ({ event: initialEvent }: { event: EventReport }) => {
    const [event, setEvent] = useState(initialEvent);
    const [newComment, setNewComment] = useState('');

    const handleAddComment = () => {
        if (newComment.trim() === '') return;

        const commentToAdd: CommentType = {
            id: `c${event.id}-${event.comments.length + 1}`,
            author: "Vous", // Placeholder for current user
            avatar: "https://i.pravatar.cc/150?u=a042581f4e29026704z",
            text: newComment,
            timestamp: "à l'instant",
        };

        setEvent(prevEvent => ({
            ...prevEvent,
            comments: [...prevEvent.comments, commentToAdd],
        }));
        setNewComment('');
    };

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
                        <span>Signalé {event.time}</span>
                    </div>
                    {/* Placeholder for reactions */}
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" className="gap-1 px-2 h-auto text-muted-foreground">
                            <ThumbsUp className="w-4 h-4"/> 
                            <span className="text-xs">12</span>
                        </Button>
                         <Button variant="ghost" size="sm" className="gap-1 px-2 h-auto text-muted-foreground">
                            <ThumbsDown className="w-4 h-4"/>
                             <span className="text-xs">2</span>
                        </Button>
                    </div>
                </div>
                
                <Separator />

                <Collapsible className="w-full">
                    <CollapsibleTrigger asChild>
                        <Button variant="link" className="p-0 h-auto text-sm">
                            <MessageSquare className="w-4 h-4 mr-2" />
                            Voir les {event.comments.length} commentaires
                        </Button>
                    </CollapsibleTrigger>
                    <CollapsibleContent className="space-y-4 pt-4">
                        {event.comments.map(comment => <Comment key={comment.id} comment={comment} />)}
                        {event.comments.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Aucun commentaire pour le moment. Soyez le premier à réagir !</p>}
                        
                        <div className="flex items-center gap-2 pt-4">
                            <Input 
                                placeholder="Ajouter un commentaire..." 
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleAddComment()}
                            />
                            <Button size="icon" onClick={handleAddComment} disabled={!newComment.trim()}>
                                <Send className="w-4 h-4" />
                                <span className="sr-only">Envoyer le commentaire</span>
                            </Button>
                        </div>
                    </CollapsibleContent>
                </Collapsible>
            </CardFooter>
        </Card>
    );
}


export default function EvenementsFeed() {
  const [events, setEvents] = useState<EventReport[]>(dummyEvents);

  return (
    <div className="w-full h-full overflow-y-auto pr-2">
        <div className="max-w-3xl mx-auto space-y-4 pb-4">
            {events.map(event => (
                <EventCard key={event.id} event={event} />
            ))}
        </div>
    </div>
  );
}
