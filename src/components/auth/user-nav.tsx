'use client';

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuGroup,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useUser, useFirebase, initiateSignOut } from "@/firebase";
import { Skeleton } from "../ui/skeleton";
import { LogOut, User, Loader2, Image as ImageIcon } from "lucide-react";
import Link from "next/link";
import React, { useState, useRef } from "react";
import { getStorage, ref as storageRef, uploadString, getDownloadURL } from "firebase/storage";
import { updateProfile } from "firebase/auth";
import { doc, setDoc } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";
import { Input } from "../ui/input";
  
export function UserNav() {
    const { user, isUserLoading } = useUser();
    const { auth, firebaseApp, firestore } = useFirebase();
    const { toast } = useToast();

    const [dialogOpen, setDialogOpen] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);


    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUpdateProfilePicture = async () => {
        if (!imagePreview || !user || !auth.currentUser) return;
        
        setIsUploading(true);
        try {
            const storage = getStorage(firebaseApp);
            const avatarRef = storageRef(storage, `avatars/${user.uid}`);
            
            await uploadString(avatarRef, imagePreview, 'data_url');
            const downloadURL = await getDownloadURL(avatarRef);

            await updateProfile(auth.currentUser, { photoURL: downloadURL });

            const userDocRef = doc(firestore, "users", user.uid);
            await setDoc(userDocRef, { photoURL: downloadURL }, { merge: true });

            toast({
                title: "Profile Updated",
                description: "Your profile picture has been successfully updated.",
            });
            setDialogOpen(false);
            setImagePreview(null);
        } catch (error) {
            console.error("Error updating profile picture:", error);
            toast({
                title: "Error",
                description: "Failed to update profile picture. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsUploading(false);
        }
    };


    if (isUserLoading) {
        return <Skeleton className="h-10 w-10 rounded-full" />;
    }

    if (user) {
        return (
            <>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                            <Avatar className="h-10 w-10">
                                <AvatarImage src={user.photoURL ?? ""} alt={user.displayName ?? "User"} />
                                <AvatarFallback>
                                    <User className="h-5 w-5" />
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">{user.isAnonymous ? "Utilisateur Anonyme" : (user.displayName || "Utilisateur")}</p>
                                {!user.isAnonymous && <p className="text-xs leading-none text-muted-foreground">
                                    {user.email}
                                </p>}
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuGroup>
                           <DropdownMenuItem onSelect={() => setDialogOpen(true)}>
                                <User className="mr-2 h-4 w-4" />
                                <span>Mettre à jour le profil</span>
                            </DropdownMenuItem>
                        </DropdownMenuGroup>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => initiateSignOut(auth)}>
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Se déconnecter</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Mettre à jour la photo de profil</DialogTitle>
                             <DialogDescription>
                                Téléchargez une nouvelle photo de profil.
                            </DialogDescription>
                        </DialogHeader>
                        
                        <div className="flex flex-col items-center gap-4 py-4">
                            <Avatar className="h-32 w-32">
                                <AvatarImage src={imagePreview || user.photoURL || ""} />
                                <AvatarFallback className="h-32 w-32">
                                    <div className="h-32 w-32 flex items-center justify-center bg-muted rounded-full">
                                         <User className="h-16 w-16 text-muted-foreground" />
                                    </div>
                                </AvatarFallback>
                            </Avatar>
                            <Button variant="outline" onClick={() => fileInputRef.current?.click()} disabled={isUploading}>
                                <ImageIcon className="mr-2 h-4 w-4" />
                                {imagePreview ? "Changer l\'image" : "Sélectionner une image"}
                            </Button>
                            <Input 
                                type="file"
                                ref={fileInputRef}
                                className="hidden"
                                accept="image/png, image/jpeg, image/gif"
                                onChange={handleFileChange}
                            />
                        </div>

                        <DialogFooter>
                            <Button variant="ghost" onClick={() => setDialogOpen(false)} disabled={isUploading}>Annuler</Button>
                            <Button onClick={handleUpdateProfilePicture} disabled={!imagePreview || isUploading}>
                                {isUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Enregistrer
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </>
        )
    }

    return (
        <div className="flex items-center gap-2">
            <Button asChild variant="outline">
                <Link href="/login">Se connecter</Link>
            </Button>
            <Button asChild>
                <Link href="/signup">S'inscrire</Link>
            </Button>
        </div>
    )
}