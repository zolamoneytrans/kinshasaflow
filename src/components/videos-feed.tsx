'use client';

import React from 'react';
import { Video, dummyVideos } from '@/lib/types';
import { Card, CardContent, CardHeader, CardFooter } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Heart, MessageCircle } from 'lucide-react';

const VideoCard = ({ video }: { video: Video }) => {
    return (
        <Card className="overflow-hidden">
            <CardHeader className="flex-row items-center gap-3 p-4">
                <Avatar className="h-10 w-10 border">
                    <AvatarImage src={video.userAvatar} alt={video.user} />
                    <AvatarFallback>{video.user.charAt(0)}</AvatarFallback>
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
            <CardFooter className="p-2 flex items-center gap-2">
                 <Button variant="ghost" size="sm" className="flex items-center gap-1.5 text-muted-foreground">
                    <Heart className="h-4 w-4" />
                    <span>{Math.floor(Math.random() * 1000)}</span>
                </Button>
                <Button variant="ghost" size="sm" className="flex items-center gap-1.5 text-muted-foreground">
                    <MessageCircle className="h-4 w-4" />
                    <span>{Math.floor(Math.random() * 100)}</span>
                </Button>
                 <span className="text-xs text-muted-foreground ml-auto">Source: Facebook</span>
            </CardFooter>
        </Card>
    );
};

export default function VideosFeed() {
    return (
        <div className="w-full h-full overflow-y-auto pr-2">
            <div className="max-w-3xl mx-auto space-y-6 pb-4">
                {dummyVideos.map(video => (
                    <VideoCard key={video.id} video={video} />
                ))}
            </div>
        </div>
    );
}
