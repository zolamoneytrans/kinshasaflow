
'use client';

import React, { useState, useMemo } from 'react';
import { AppShell } from "@/components/app-shell";
import { useUser, useFirebase, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, doc, runTransaction, serverTimestamp, orderBy } from "firebase/firestore";
import { UserProfile, WithId } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, Star, ShieldAlert, ShieldCheck, UserX, UserCheck, Plus, Minus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function AdminStarsPage() {
  const { user } = useUser();
  const { firestore } = useFirebase();
  const { toast } = useToast();
  const [search, setSearch] = useState("");
  const [isUpdating, setIsUpdating] = useState<string | null>(null);

  const isAdmin = user?.email === 'drnduwa@gmail.com';

  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !isAdmin) return null;
    return collection(firestore, 'users');
  }, [firestore, isAdmin]);

  const { data: users, isLoading } = useCollection<UserProfile>(usersQuery);

  const filteredUsers = useMemo(() => {
    if (!users) return [];
    return users.filter(u => 
      u.email.toLowerCase().includes(search.toLowerCase()) || 
      (u.name && u.name.toLowerCase().includes(search.toLowerCase()))
    );
  }, [users, search]);

  const handleAdjustStars = async (targetUser: WithId<UserProfile>, amount: number, reason: string) => {
    if (!isAdmin) return;
    setIsUpdating(targetUser.id);
    
    try {
      const userRef = doc(firestore, 'users', targetUser.id);
      const transRef = doc(collection(userRef, 'star_transactions'));

      await runTransaction(firestore, async (transaction) => {
        const userDoc = await transaction.get(userRef);
        if (!userDoc.exists()) throw new Error("Utilisateur introuvable");
        
        const currentData = userDoc.data() as UserProfile;
        const newBalance = Math.max(0, (currentData.currentStarsBalance || 0) + amount);

        transaction.update(userRef, {
          currentStarsBalance: newBalance
        });

        transaction.set(transRef, {
          userId: targetUser.id,
          type: 'admin_adjustment',
          starsChange: amount,
          balanceAfterTransaction: newBalance,
          description: `Ajustement Admin : ${reason}`,
          timestamp: serverTimestamp(),
        });
      });

      toast({ title: "Succès", description: `Le solde de ${targetUser.email} a été mis à jour.` });
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setIsUpdating(null);
    }
  };

  const handleToggleBlock = async (targetUser: WithId<UserProfile>) => {
    if (!isAdmin) return;
    const newStatus = !targetUser.isBlocked;
    setIsUpdating(targetUser.id);

    try {
      await runTransaction(firestore, async (transaction) => {
        const userRef = doc(firestore, 'users', targetUser.id);
        transaction.update(userRef, { isBlocked: newStatus });
      });
      toast({ 
        title: newStatus ? "Utilisateur Bloqué" : "Utilisateur Débloqué", 
        description: `Le compte ${targetUser.email} a été mis à jour.` 
      });
    } catch (e: any) {
      toast({ title: "Erreur", description: e.message, variant: "destructive" });
    } finally {
      setIsUpdating(null);
    }
  };

  if (!isAdmin) return (
    <AppShell>
      <div className="flex flex-col items-center justify-center h-full gap-4">
        <ShieldAlert className="h-16 w-16 text-destructive" />
        <h1 className="text-2xl font-black">Accès Interdit</h1>
        <p className="text-muted-foreground">Espace réservé à l'administrateur système.</p>
      </div>
    </AppShell>
  );

  return (
    <AppShell>
      <div className="w-full h-full overflow-y-auto p-4 md:p-8 space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-black tracking-tight flex items-center gap-2">
              <Star className="text-amber-500 fill-amber-500" />
              Gestion des Utilisateurs & Stars
            </h1>
            <p className="text-muted-foreground">Pilotez les comptes et les soldes de la communauté.</p>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Rechercher email ou nom..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="pl-10 h-12 rounded-xl"
            />
          </div>
        </div>

        <Card className="border-none shadow-sm overflow-hidden">
          <CardHeader className="bg-slate-50/50">
            <CardTitle>Liste des Kinois ({filteredUsers.length})</CardTitle>
            <CardDescription>Actions directes sur les profils et portefeuilles.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Solde Stars</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={4} className="h-32 text-center"><Loader2 className="animate-spin mx-auto" /></TableCell></TableRow>
                ) : filteredUsers.length > 0 ? (
                  filteredUsers.map(u => (
                    <TableRow key={u.id} className={u.isBlocked ? "bg-red-50/30" : ""}>
                      <TableCell>
                        <div className="font-bold">{u.name || "Sans nom"}</div>
                        <div className="text-xs text-muted-foreground">{u.email}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-amber-100 text-amber-700 font-black">
                          {u.currentStarsBalance || 0} ⭐
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {u.isBlocked ? (
                          <Badge variant="destructive" className="flex items-center gap-1 w-fit">
                            <UserX className="h-3 w-3" /> Bloqué
                          </Badge>
                        ) : (
                          <Badge variant="success" className="flex items-center gap-1 w-fit bg-emerald-100 text-emerald-700">
                            <UserCheck className="h-3 w-3" /> Actif
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button size="sm" variant="outline" className="rounded-lg h-8">
                              Ajuster Stars
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Ajuster Stars pour {u.email}</DialogTitle>
                            </DialogHeader>
                            <StarAdjustmentForm 
                              user={u} 
                              onAdjust={(amt, reason) => handleAdjustStars(u, amt, reason)} 
                              isLoading={isUpdating === u.id} 
                            />
                          </DialogContent>
                        </Dialog>

                        <Button 
                          size="icon" 
                          variant={u.isBlocked ? "success" : "destructive"} 
                          className="h-8 w-8 rounded-lg"
                          onClick={() => handleToggleBlock(u)}
                          disabled={isUpdating === u.id}
                        >
                          {isUpdating === u.id ? <Loader2 className="h-4 w-4 animate-spin" /> : (u.isBlocked ? <UserCheck className="h-4 w-4" /> : <UserX className="h-4 w-4" />)}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow><TableCell colSpan={4} className="h-32 text-center text-muted-foreground italic">Aucun utilisateur trouvé.</TableCell></TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </AppShell>
  );
}

function StarAdjustmentForm({ user, onAdjust, isLoading }: { user: UserProfile, onAdjust: (amt: number, reason: string) => void, isLoading: boolean }) {
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-2">
        <Label>Montant (positif pour ajouter, négatif pour retirer)</Label>
        <Input 
          type="number" 
          placeholder="Ex: 50 ou -20" 
          value={amount} 
          onChange={e => setAmount(e.target.value)} 
        />
      </div>
      <div className="space-y-2">
        <Label>Motif de l'ajustement</Label>
        <Input 
          placeholder="Ex: Récompense événement spécial" 
          value={reason} 
          onChange={e => setReason(e.target.value)} 
        />
      </div>
      <DialogFooter>
        <Button 
          disabled={isLoading || !amount || !reason} 
          onClick={() => {
            onAdjust(parseInt(amount), reason);
            setAmount("");
            setReason("");
          }}
          className="w-full"
        >
          {isLoading ? <Loader2 className="animate-spin mr-2" /> : <Plus className="mr-2 h-4 w-4" />}
          Appliquer l'ajustement
        </Button>
      </DialogFooter>
    </div>
  );
}
