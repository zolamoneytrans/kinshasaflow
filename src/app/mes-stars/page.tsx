'use client';

import React, { useState, useMemo } from 'react';
import { AppShell } from '@/components/app-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useUser, useFirebase, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, orderBy, limit, serverTimestamp, runTransaction } from 'firebase/firestore';
import { UserProfile, StarTransaction, WithId } from '@/lib/types';
import { 
  Star, 
  TrendingUp, 
  ShoppingCart, 
  ArrowDownCircle, 
  Gift, 
  Users, 
  Calendar, 
  StarHalf, 
  UserPlus, 
  PlayCircle, 
  Loader2, 
  CheckCircle2, 
  Smartphone, 
  AlertCircle,
  Clock
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';

// --- Components ---

const StatCard = ({ title, value, icon: Icon, color, subValue }: { title: string, value: string | number, icon: any, color: string, subValue?: string }) => (
  <Card className="border-none shadow-sm">
    <CardContent className="p-6 flex justify-between items-start">
      <div className="space-y-1">
        <p className="text-xs font-black text-muted-foreground uppercase tracking-widest">{title}</p>
        <p className="text-3xl font-black">{value}</p>
        {subValue && <p className="text-[10px] font-medium text-muted-foreground">{subValue}</p>}
      </div>
      <div className={cn("p-3 rounded-2xl", color)}>
        <Icon className="h-6 w-6 text-white" />
      </div>
    </CardContent>
  </Card>
);

const TransactionRow = ({ transaction }: { transaction: WithId<StarTransaction> }) => {
  const isGain = transaction.type !== 'spent';
  const date = transaction.timestamp?.toDate ? format(transaction.timestamp.toDate(), 'dd MMM, HH:mm', { locale: fr }) : '...';

  return (
    <div className="flex items-center justify-between p-4 border-b last:border-0 hover:bg-muted/30 transition-colors">
      <div className="flex items-center gap-4">
        <div className={cn(
          "p-2 rounded-full",
          transaction.type === 'purchase' ? "bg-blue-100 text-blue-600" :
          transaction.type === 'earned' ? "bg-emerald-100 text-emerald-600" :
          "bg-orange-100 text-orange-600"
        )}>
          {transaction.type === 'purchase' ? <ShoppingCart className="h-4 w-4" /> :
           transaction.type === 'earned' ? <Gift className="h-4 w-4" /> :
           <ArrowDownCircle className="h-4 w-4" />}
        </div>
        <div>
          <p className="text-sm font-bold">{transaction.description}</p>
          <p className="text-[10px] text-muted-foreground">{date}</p>
        </div>
      </div>
      <div className="text-right">
        <p className={cn("text-sm font-black", isGain ? "text-emerald-600" : "text-orange-600")}>
          {isGain ? '+' : '-'}{Math.abs(transaction.starsChange)} ⭐
        </p>
        <p className="text-[10px] text-muted-foreground">Solde: {transaction.balanceAfterTransaction}</p>
      </div>
    </div>
  );
};

const BuyStarsDialog = ({ currentBalance }: { currentBalance: number }) => {
  const [step, setStep] = useState(1);
  const [selectedPack, setSelectedPack] = useState<any>(null);
  const [phone, setPhone] = useState('');
  const [operator, setSelectedOperator] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { user, firestore } = useFirebase();
  const { toast } = useToast();

  const packs = [
    { id: 'starter', stars: 50, price: '5 000 CDF', label: 'Starter' },
    { id: 'standard', stars: 150, price: '12 000 CDF', label: 'Standard', popular: true },
    { id: 'pro', stars: 400, price: '25 000 CDF', label: 'Pro' },
    { id: 'business', stars: 1200, price: '60 000 CDF', label: 'Business' },
  ];

  const handlePurchase = async () => {
    if (!user || !selectedPack) return;
    setIsLoading(true);
    
    // Simulate payment process
    setTimeout(async () => {
      try {
        const userRef = doc(firestore, 'users', user.uid);
        const transRef = doc(collection(userRef, 'star_transactions'));

        await runTransaction(firestore, async (transaction) => {
          const userDoc = await transaction.get(userRef);
          const currentData = userDoc.data() as UserProfile;
          const newBalance = (currentData.currentStarsBalance || 0) + selectedPack.stars;
          const newTotalPurchased = (currentData.totalStarsPurchased || 0) + selectedPack.stars;

          transaction.update(userRef, {
            currentStarsBalance: newBalance,
            totalStarsPurchased: newTotalPurchased
          });

          transaction.set(transRef, {
            userId: user.uid,
            type: 'purchase',
            starsChange: selectedPack.stars,
            balanceAfterTransaction: newBalance,
            description: `Achat Pack ${selectedPack.label}`,
            timestamp: serverTimestamp(),
          });
        });

        setStep(3);
        toast({ title: 'Créditation réussie !', description: `${selectedPack.stars} stars ajoutées.` });
      } catch (e) {
        console.error(e);
        toast({ title: 'Erreur', description: 'Transaction échouée.', variant: 'destructive' });
      } finally {
        setIsLoading(false);
      }
    }, 2000);
  };

  return (
    <Dialog onOpenChange={(open) => !open && setStep(1)}>
      <DialogTrigger asChild>
        <Button className="bg-amber-500 hover:bg-amber-600 text-white font-bold h-12 px-8 rounded-xl shadow-lg shadow-amber-200">
          <ShoppingCart className="mr-2 h-5 w-5" />
          Acheter des Stars
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md overflow-hidden p-0 rounded-2xl">
        <div className="bg-amber-500 p-6 text-white">
          <DialogTitle className="text-2xl font-black">Achat de Stars</DialogTitle>
          <DialogDescription className="text-amber-100 font-medium">Étape {step} sur 3</DialogDescription>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <p className="font-bold text-slate-800">Choisissez votre forfait :</p>
                <div className="grid grid-cols-1 gap-3">
                  {packs.map(pack => (
                    <div 
                      key={pack.id} 
                      onClick={() => setSelectedPack(pack)}
                      className={cn(
                        "relative p-4 rounded-xl border-2 cursor-pointer transition-all",
                        selectedPack?.id === pack.id ? "border-amber-500 bg-amber-50" : "border-slate-100 hover:border-amber-200"
                      )}
                    >
                      {pack.popular && <Badge className="absolute -top-2 right-4 bg-amber-500">Populaire</Badge>}
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-black text-lg">{pack.stars} ⭐</p>
                          <p className="text-xs text-muted-foreground uppercase font-bold tracking-tighter">{pack.label}</p>
                        </div>
                        <p className="font-bold text-amber-600">{pack.price}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <Button disabled={!selectedPack} onClick={() => setStep(2)} className="w-full h-12 rounded-xl mt-4 font-bold">Suivant</Button>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                <div className="space-y-4">
                  <p className="font-bold text-slate-800">Choisissez votre opérateur :</p>
                  <RadioGroup value={operator} onValueChange={setSelectedOperator} className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'airtel', name: 'Airtel', color: 'bg-red-500' },
                      { id: 'orange', name: 'Orange', color: 'bg-orange-500' },
                      { id: 'mpesa', name: 'M-Pesa', color: 'bg-emerald-500' },
                    ].map(op => (
                      <div key={op.id}>
                        <RadioGroupItem value={op.id} id={op.id} className="peer sr-only" />
                        <Label htmlFor={op.id} className="flex flex-col items-center justify-center p-3 rounded-xl border-2 peer-data-[state=checked]:border-amber-500 cursor-pointer hover:bg-muted transition-all">
                          <div className={cn("w-10 h-10 rounded-full mb-2 flex items-center justify-center text-white font-black text-xs", op.color)}>
                            {op.name[0]}
                          </div>
                          <span className="text-[10px] font-black uppercase">{op.name}</span>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="space-y-2">
                  <Label className="font-bold text-slate-800">Numéro de téléphone :</Label>
                  <div className="flex items-center gap-2">
                    <span className="bg-slate-100 p-2.5 rounded-lg text-sm font-bold">+243</span>
                    <Input placeholder="000 000 000" value={phone} onChange={e => setPhone(e.target.value)} className="h-11 rounded-lg border-2" />
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    <AlertCircle className="h-3 w-3 inline mr-1" />
                    Vous recevrez une demande USSD sur votre téléphone pour valider le paiement.
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setStep(1)} className="flex-1 font-bold">Retour</Button>
                  <Button disabled={!operator || phone.length < 9 || isLoading} onClick={handlePurchase} className="flex-[2] h-12 rounded-xl font-bold">
                    {isLoading ? <Loader2 className="animate-spin mr-2" /> : <CheckCircle2 className="mr-2 h-5 w-5" />}
                    Confayer {selectedPack?.price}
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="py-10 text-center space-y-6">
                <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="h-12 w-12" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-900">Créditation instantanée !</h3>
                  <p className="text-slate-500 font-medium">{selectedPack?.stars} stars ont été ajoutées à votre compte.</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border-2 border-dashed border-slate-200">
                  <p className="text-xs font-black uppercase text-slate-400 tracking-widest">Nouveau solde</p>
                  <p className="text-3xl font-black text-amber-500">{currentBalance + selectedPack?.stars} ⭐</p>
                </div>
                <Button onClick={() => window.location.reload()} className="w-full h-12 rounded-xl font-bold bg-slate-900">Terminer</Button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default function MesStarsPage() {
  const { user, firestore } = useFirebase();
  const { toast } = useToast();

  const userRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile, isLoading: isProfileLoading } = useDoc<UserProfile>(userRef);

  const transactionsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, 'users', user.uid, 'star_transactions'), orderBy('timestamp', 'desc'), limit(20));
  }, [firestore, user]);
  const { data: transactions, isLoading: isTransLoading } = useCollection<StarTransaction>(transactionsQuery);

  const handleEarnSim = async (action: string, amount: number) => {
    if (!user || !profile) return;
    
    try {
      const transRef = doc(collection(firestore, 'users', user.uid, 'star_transactions'));
      await runTransaction(firestore, async (transaction) => {
        const newBalance = profile.currentStarsBalance + amount;
        const newTotalEarned = profile.totalStarsEarned + amount;

        transaction.update(userRef!, {
          currentStarsBalance: newBalance,
          totalStarsEarned: newTotalEarned
        });

        transaction.set(transRef, {
          userId: user.uid,
          type: 'earned',
          starsChange: amount,
          balanceAfterTransaction: newBalance,
          description: action,
          timestamp: serverTimestamp(),
        });
      });
      toast({ title: 'Félicitations !', description: `Vous avez gagné ${amount} stars pour : ${action}` });
    } catch (e) {
      toast({ title: 'Erreur', description: 'Action impossible.', variant: 'destructive' });
    }
  };

  const earningActions = [
    { title: "Signaler un incident", amount: 5, icon: AlertCircle, color: "bg-red-500", desc: "Améliore la précision des données" },
    { title: "Parrainer un ami", amount: 15, icon: UserPlus, color: "bg-blue-500", desc: "Croissance organique" },
    { title: "Streak de 7 jours", amount: 10, icon: Calendar, color: "bg-amber-500", desc: "Récompense de fidélité" },
    { title: "Évaluer l'application", amount: 5, icon: StarHalf, color: "bg-emerald-500", desc: "Visibilité sur les stores" },
    { title: "Compléter profil", amount: 5, icon: Users, color: "bg-purple-500", desc: "Personnalisation du service" },
    { title: "Regarder une vidéo", amount: 2, icon: PlayCircle, color: "bg-slate-700", desc: "Soutenez le service" },
  ];

  if (isProfileLoading) return <AppShell><div className="h-full w-full flex items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div></AppShell>;

  return (
    <AppShell>
      <div className="w-full h-full overflow-y-auto bg-slate-50/50 pb-20">
        <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
          
          {/* Dashboard Statistique */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Solde actuel" value={`${profile?.currentStarsBalance || 0} ⭐`} icon={Star} color="bg-amber-500" subValue="Disponible" />
            <StatCard title="Stars Gagnées" value={`${profile?.totalStarsEarned || 0} ⭐`} icon={Gift} color="bg-emerald-500" subValue="Total cumulé" />
            <StatCard title="Stars Achetées" value={`${profile?.totalStarsPurchased || 0} ⭐`} icon={ShoppingCart} color="bg-blue-500" subValue="Mobile Money" />
            <StatCard title="Utilisées" value={`${profile?.totalStarsUsed || 0} ⭐`} icon={TrendingUp} color="bg-orange-500" subValue="Mois en cours" />
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            
            {/* Colonne de gauche: Balance Hero & Gagner */}
            <div className="lg:col-span-2 space-y-8">
              
              {/* Balance Hero */}
              <Card className="bg-slate-900 text-white border-none overflow-hidden relative group">
                <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-amber-500/20 rounded-full blur-3xl group-hover:bg-amber-500/30 transition-all"></div>
                <CardHeader className="relative z-10">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-3xl font-black flex items-center gap-2">
                        {profile?.currentStarsBalance || 0}
                        <span className="text-amber-500">Stars</span>
                      </CardTitle>
                      <CardDescription className="text-slate-400 font-bold">Votre niveau de carburant digital</CardDescription>
                    </div>
                    <Badge variant="outline" className="text-amber-500 border-amber-500/30 bg-amber-500/10">Premium</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 relative z-10">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                      <span>Niveau de solde</span>
                      <span className="text-amber-500">{Math.min(100, ((profile?.currentStarsBalance || 0) / 500) * 100).toFixed(0)}%</span>
                    </div>
                    <Progress value={Math.min(100, ((profile?.currentStarsBalance || 0) / 500) * 100)} className="h-3 bg-white/10" />
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <BuyStarsDialog currentBalance={profile?.currentStarsBalance || 0} />
                    <Button variant="outline" className="bg-transparent border-white/20 hover:bg-white/10 font-bold text-white h-12 px-8 rounded-xl">
                      Historique complet
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Gagner Gratuitement */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <Gift className="text-emerald-500" />
                    Gagner gratuitement
                  </h2>
                  <Badge variant="secondary" className="font-bold">6 façons</Badge>
                </div>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {earningActions.map((action, i) => (
                    <motion.div key={i} whileHover={{ y: -5 }}>
                      <Card 
                        className="cursor-pointer border-slate-100 hover:border-emerald-200 transition-all"
                        onClick={() => handleEarnSim(action.title, action.amount)}
                      >
                        <CardContent className="p-5 space-y-3">
                          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white", action.color)}>
                            <action.icon className="h-5 w-5" />
                          </div>
                          <div>
                            <p className="font-bold text-sm">{action.title}</p>
                            <p className="text-[10px] text-muted-foreground font-medium">{action.desc}</p>
                          </div>
                          <div className="flex items-center gap-1.5 text-emerald-600 font-black text-xs bg-emerald-50 w-fit px-2 py-1 rounded-full">
                            +{action.amount} ⭐
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* Colonne de droite: Historique */}
            <div className="lg:col-span-1">
              <Card className="h-full border-none shadow-sm flex flex-col">
                <CardHeader className="pb-2 border-b">
                  <CardTitle className="text-lg font-black flex items-center gap-2">
                    <Clock className="text-blue-500 h-5 w-5" />
                    Transactions
                  </CardTitle>
                  <CardDescription className="text-[10px] font-bold uppercase tracking-tighter">Journal récent</CardDescription>
                </CardHeader>
                <CardContent className="p-0 flex-1 overflow-y-auto max-h-[600px]">
                  {isTransLoading ? (
                    <div className="p-10 flex flex-col items-center gap-2 text-muted-foreground">
                      <Loader2 className="animate-spin h-6 w-6" />
                      <p className="text-xs font-bold">Chargement...</p>
                    </div>
                  ) : transactions && transactions.length > 0 ? (
                    transactions.map(t => <TransactionRow key={transaction.id} transaction={t} />)
                  ) : (
                    <div className="p-10 text-center space-y-4">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300">
                        <Smartphone className="h-8 w-8" />
                      </div>
                      <p className="text-xs text-muted-foreground font-medium italic">Aucune transaction trouvée.</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="p-4 border-t bg-slate-50/50">
                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                    Les transactions Mobile Money peuvent prendre jusqu'à 2 minutes pour apparaître dans ce journal.
                  </p>
                </CardFooter>
              </Card>
            </div>

          </div>
        </div>
      </div>
    </AppShell>
  );
}
