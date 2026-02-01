'use client';

import {
    Avatar,
    AvatarFallback,
    AvatarImage,
} from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
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
import { LogOut } from "lucide-react";
import Link from "next/link";
  
export function UserNav() {
    const { user, isUserLoading } = useUser();
    const { auth } = useFirebase();

    if (isUserLoading) {
        return <Skeleton className="h-10 w-10 rounded-full" />;
    }

    if (user) {
        return (
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                        <Avatar className="h-10 w-10">
                            <AvatarImage src={user.photoURL ?? ""} alt={user.displayName ?? "User"} />
                            <AvatarFallback>{user.displayName?.charAt(0) ?? user.email?.charAt(0)}</AvatarFallback>
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
                        {/* Add other menu items here if needed */}
                    </DropdownMenuGroup>
                    <DropdownMenuItem onClick={() => initiateSignOut(auth)}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Se déconnecter</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
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
