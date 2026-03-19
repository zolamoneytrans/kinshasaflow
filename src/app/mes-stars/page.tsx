'use client';

import React, { useState, useMemo, useEffect, useRef } from 'react';
import { AppShell } from '@/components/app-shell';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useUser, useFirebase, useDoc, useCollection, useMemoFirebase } from '@/firebase';
import { doc, collection, query, orderBy, limit, serverTimestamp, runTransaction, getDoc } from 'firebase/firestore';
import { UserProfile, StarTransaction, WithId, AdvertVideo } from '@/lib/types';
import { initiateMbiyoPaymentAction, checkMbiyoTransactionStatusAction } from '@/app/actions';
import { 
  Star, 
  TrendingUp, 
  ShoppingCart, 
  ArrowDownCircle, 
  Gift, 
  PlayCircle, 
  Loader2, 
  CheckCircle2, 
  Smartphone, 
  AlertCircle,
  Clock,
  Share2,
  X,
  Volume2,
  VolumeX,
  UserPlus,
  RefreshCw
} from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
  const [currency, setCurrency] = useState<'CDF' | 'USD'>('CDF');
  const [isLoading, setIsLoading] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [pendingTransactionId, setPendingTransactionId] = useState<string | null>(null);
  const { user, firestore } = useFirebase();
  const { toast } = useToast();

  const packs = [
    { id: 'starter', stars: 50, prices: { CDF: 5000, USD: 2 }, labels: { CDF: '5 000 CDF', USD: '2 USD' }, label: 'Starter' },
    { id: 'standard', stars: 150, prices: { CDF: 12000, USD: 5 }, labels: { CDF: '12 000 CDF', USD: '5 USD' }, label: 'Standard', popular: true },
    { id: 'pro', stars: 400, prices: { CDF: 25000, USD: 10 }, labels: { CDF: '25 000 CDF', USD: '10 USD' }, label: 'Pro' },
    { id: 'business', stars: 1200, prices: { CDF: 60000, USD: 25 }, labels: { CDF: '60 000 CDF', USD: '25 USD' }, label: 'Business' },
  ];

  const handlePurchase = async () => {
    if (!user || !selectedPack || !operator || !phone) {
        toast({ title: "Incomplet", description: "Veuillez remplir toutes les informations.", variant: "destructive" });
        return;
    }
    
    setIsLoading(true);
    
    let sanitizedPhone = phone.replace(/\D/g, '');
    if (sanitizedPhone.startsWith('0')) {
        sanitizedPhone = '243' + sanitizedPhone.substring(1);
    } else if (!sanitizedPhone.startsWith('243')) {
        sanitizedPhone = '243' + sanitizedPhone;
    }

    // Génération d'un order_id unique
    const orderId = `stars_${user.uid.substring(0, 5)}_${Date.now()}`;

    try {
        const result = await initiateMbiyoPaymentAction({
            amount: selectedPack.prices[currency],
            currency: currency,
            phone: sanitizedPhone,
            network: operator,
            order_id: orderId,
            description: `Achat de ${selectedPack.stars} Stars - Kinshasa Flow`,
        });

        if (result.success && result.data) {
            setPendingTransactionId(result.data.id);
            setStep(3);
            toast({ 
                title: 'Demande envoyée !', 
                description: `Veuillez valider la demande USSD sur votre téléphone (${operator.toUpperCase()}).` 
            });
        } else {
            toast({ 
                title: 'Échec', 
                description: result.error || "Une erreur est survenue lors de l'initialisation.", 
                variant: 'destructive' 
            });
        }
    } catch (e: any) {
        toast({ title: 'Erreur technique', description: 'Impossible de joindre le serveur de paiement.', variant: 'destructive' });
    } finally {
        setIsLoading(false);
    }
  };

  const checkStatus = async () => {
    if (!pendingTransactionId || !user || !selectedPack) return;
    setIsChecking(true);
    try {
        const result = await checkMbiyoTransactionStatusAction(pendingTransactionId);
        if (result.success && result.data) {
            const status = result.data.status; // successful, failed, canceled, pending
            
            if (status === 'successful') {
                const userRef = doc(firestore, 'users', user.uid);
                // Utiliser l'ID de transaction Mbiyo comme ID de document pour éviter les doubles crédits
                const transRef = doc(firestore, 'users', user.uid, 'star_transactions', pendingTransactionId);

                const transSnap = await getDoc(transRef);
                if (transSnap.exists()) {
                    toast({ title: "Déjà crédité", description: "Ces stars sont déjà sur votre compte." });
                    setIsChecking(false);
                    return;
                }

                await runTransaction(firestore, async (transaction) => {
                    const userDoc = await transaction.get(userRef);
                    if (!userDoc.exists()) return;
                    
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
                        description: `Pack ${selectedPack.label} (${operator.toUpperCase()})`,
                        timestamp: serverTimestamp(),
                        relatedObjectId: pendingTransactionId,
                        relatedObjectType: 'MbiyoPayTransaction'
                    });
                });

                toast({ title: "Paiement confirmé !", description: `+${selectedPack.stars} Stars ajoutées.` });
                setTimeout(() => window.location.reload(), 2000);
            } else if (status === 'failed' || status === 'canceled') {
                toast({ title: "Paiement annulé", description: "La transaction n'a pas pu être complétée.", variant: "destructive" });
            } else {
                toast({ title: "En attente", description: "Veuillez valider le message USSD sur votre téléphone." });
            }
        } else {
            toast({ title: "Erreur", description: result.error || "Vérification impossible.", variant: "destructive" });
        }
    } catch (e) {
        toast({ title: "Erreur technique", description: "Une erreur est survenue lors de la vérification.", variant: "destructive" });
    } finally {
        setIsChecking(false);
    }
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
          <DialogTitle className="text-2xl font-black">Recharger mon compte</DialogTitle>
          <DialogDescription className="text-amber-100 font-medium">Étape {step} sur 3</DialogDescription>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-slate-800">Devise :</p>
                  <Tabs value={currency} onValueChange={(v: any) => setCurrency(v)}>
                    <TabsList className="bg-slate-100">
                      <TabsTrigger value="CDF" className="text-[10px] font-bold">CDF</TabsTrigger>
                      <TabsTrigger value="USD" className="text-[10px] font-bold">USD</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
                
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
                        <p className="font-bold text-amber-600">{pack.labels[currency]}</p>
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
                  <p className="font-bold text-slate-800">Réseau :</p>
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
                    Validation via <strong>MbiyoPay</strong> (RDC).
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => setStep(1)} className="flex-1 font-bold">Retour</Button>
                  <Button disabled={!operator || phone.length < 9 || isLoading} onClick={handlePurchase} className="flex-[2] h-12 rounded-xl font-bold">
                    {isLoading ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : <CheckCircle2 className="mr-2 h-5 w-5" />}
                    Payer {selectedPack?.labels[currency]}
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
                  <h3 className="text-2xl font-black text-slate-900">Demande USSD envoyée !</h3>
                  <p className="text-slate-500 font-medium text-sm">Entrez votre code secret sur votre téléphone. Une fois fait, cliquez sur le bouton ci-dessous pour créditer vos {selectedPack?.stars} stars.</p>
                </div>
                <div className="bg-slate-50 p-4 rounded-xl border-2 border-dashed border-slate-200">
                  <p className="text-xs font-black uppercase text-slate-400 tracking-widest">Nouveau solde estimé</p>
                  <p className="text-3xl font-black text-amber-500">{currentBalance + selectedPack?.stars} ⭐</p>
                </div>
                <div className="space-y-2">
                    <Button onClick={checkStatus} disabled={isChecking} variant="outline" className="w-full h-12 rounded-xl font-bold border-amber-500 text-amber-600 hover:bg-amber-50">
                        {isChecking ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                        Vérifier mon paiement
                    </Button>
                    <Button onClick={() => window.location.reload()} className="w-full h-12 rounded-xl font-bold bg-slate-900">Fermer</Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// --- Ad Player Component ---
const AdPlayer = ({ video, onComplete, onClose }: { video: WithId<AdvertVideo>, onComplete: () => void, onClose: () => void }) => {
    const [timeLeft, setTimeLeft] = useState(30);
    const [isMuted, setIsMuted] = useState(false);
    const [isFinished, setIsFinished] = useState(false);
    const videoRef = useRef<HTMLVideoElement>(null);

    useEffect(() => {
        const interval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(interval);
                    setIsFinished(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="fixed inset-0 z-[100] bg-black flex items-center justify-center overflow-hidden">
            <div className="relative w-full h-full max-w-lg aspect-[9/16] bg-slate-900">
                <video 
                    ref={videoRef}
                    src={video.videoUrl} 
                    className="w-full h-full object-cover" 
                    autoPlay 
                    muted={isMuted}
                    playsInline
                />
                
                <div className="absolute top-0 left-0 right-0 p-4 flex justify-between items-center bg-gradient-to-b from-black/60 to-transparent">
                    <Badge variant="secondary" className="bg-white/20 backdrop-blur-md text-white font-bold px-3 py-1">
                        {timeLeft > 0 ? `Récompense dans ${timeLeft}s` : "Vidéo terminée !"}
                    </Badge>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={() => setIsMuted(!isMuted)}>
                            {isMuted ? <VolumeX /> : <Volume2 />}
                        </Button>
                        {timeLeft === 0 && (
                            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20" onClick={onClose}>
                                <X />
                            </Button>
                        )}
                    </div>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-8 space-y-6 bg-gradient-to-t from-black/80 to-transparent">
                    <div className="space-y-2">
                        <h3 className="text-xl font-bold text-white">{video.title}</h3>
                        <p className="text-sm text-slate-300 font-medium">Soutenez Kinshasa Flow en regardant cette publicité.</p>
                    </div>
                    
                    <AnimatePresence>
                        {isFinished && (
                            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                                <Button onClick={onComplete} className="w-full h-16 rounded-2xl bg-amber-500 hover:bg-amber-600 text-white font-black text-xl shadow-2xl shadow-amber-500/40">
                                    Récupérer +2 ⭐
                                </Button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/10">
                    <motion.div 
                        className="h-full bg-amber-500" 
                        initial={{ width: "0%" }} 
                        animate={{ width: `${((30 - timeLeft) / 30) * 100}%` }}
                        transition={{ duration: 1, ease: "linear" }}
                    />
                </div>
            </div>
        </div>
    );
};

export default function MesStarsPage() {
  const { user, firestore } = useFirebase();
  const { toast } = useToast();
  const router = useRouter();

  const [activeAd, setActiveAd] = useState<WithId<AdvertVideo> | null>(null);

  const userRef = useMemoFirebase(() => user ? doc(firestore, 'users', user.uid) : null, [firestore, user]);
  const { data: profile, isLoading: isProfileLoading } = useDoc<UserProfile>(userRef);

  const advertsQuery = useMemoFirebase(() => collection(firestore, 'adverts'), [firestore]);
  const { data: adverts } = useCollection<AdvertVideo>(advertsQuery);

  const transactionsQuery = useMemoFirebase(() => {
    if (!user) return null;
    return query(collection(firestore, 'users', user.uid, 'star_transactions'), orderBy('timestamp', 'desc'), limit(20));
  }, [firestore, user]);
  const { data: transactions, isLoading: isTransLoading } = useCollection<StarTransaction>(transactionsQuery);

  const handleEarn = async (action: string, amount: number) => {
    if (!user || !profile) return;
    
    try {
      const transRef = doc(collection(firestore, 'users', user.uid, 'star_transactions'));
      await runTransaction(firestore, async (transaction) => {
        const userDoc = await transaction.get(userRef!);
        const currentData = userDoc.data() as UserProfile;
        
        const newBalance = (currentData.currentStarsBalance || 0) + amount;
        const newTotalEarned = (currentData.totalStarsEarned || 0) + amount;

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
      toast({ title: 'Félicitations !', description: `Vous avez gagné ${amount} stars.` });
    } catch (e) {
      console.error(e);
      toast({ title: 'Erreur', description: 'Action impossible.', variant: 'destructive' });
    }
  };

  const earningActions = [
    { title: "Signaler un incident", amount: 5, icon: AlertCircle, color: "bg-red-500", desc: "Aidez la communauté et gagnez des stars" },
    { title: "Parrainer un ami", amount: 15, icon: UserPlus, color: "bg-blue-500", desc: "Gagnez 15 stars en invitant un proche" },
    { title: "Regarder une vidéo", amount: 2, icon: PlayCircle, color: "bg-slate-700", desc: "Récompense immédiate après visionnage" },
  ];

  const handleActionClick = async (action: any) => {
    if (action.title === "Parrainer un ami") {
      const message = encodeURIComponent("Salut ! J'utilise Kinshasa Flow pour éviter les bouchons. Rejoins-moi : https://kinshasaflow.online");
      window.open(`https://wa.me/?text=${message}`, '_blank');
      await handleEarn(action.title, action.amount);
    } else if (action.title === "Signaler un incident") {
      router.push('/signaler-embouteillage');
    } else if (action.title === "Regarder une vidéo") {
      if (!adverts?.length) {
          toast({ title: "Oups", description: "Aucune vidéo disponible.", variant: "destructive" });
          return;
      }
      setActiveAd(adverts[Math.floor(Math.random() * adverts.length)]);
    }
  };

  if (isProfileLoading) return <AppShell><div className="h-full w-full flex items-center justify-center"><Loader2 className="animate-spin h-10 w-10 text-primary" /></div></AppShell>;

  return (
    <AppShell>
      <div className="w-full h-full overflow-y-auto bg-slate-50/50 pb-20">
        <div className="max-w-6xl mx-auto p-4 md:p-8 space-y-8">
          
          {activeAd && (
              <AdPlayer 
                video={activeAd} 
                onClose={() => setActiveAd(null)} 
                onComplete={() => {
                    handleEarn("Publicité Vidéo", 2);
                    setActiveAd(null);
                }} 
              />
          )}

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Solde actuel" value={`${profile?.currentStarsBalance || 0} ⭐`} icon={Star} color="bg-amber-500" subValue="Disponible" />
            <StatCard title="Stars Gagnées" value={`${profile?.totalStarsEarned || 0} ⭐`} icon={Gift} color="bg-emerald-500" subValue="Total cumulé" />
            <StatCard title="Stars Achetées" value={`${profile?.totalStarsPurchased || 0} ⭐`} icon={ShoppingCart} color="bg-blue-500" subValue="Mobile Money" />
            <StatCard title="Utilisées" value={`${profile?.totalStarsUsed || 0} ⭐`} icon={TrendingUp} color="bg-orange-500" subValue="Mois en cours" />
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <Card className="bg-slate-900 text-white border-none overflow-hidden relative group">
                <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-amber-500/20 rounded-full blur-3xl transition-all"></div>
                <CardHeader className="relative z-10">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-3xl font-black flex items-center gap-2">
                        {profile?.currentStarsBalance || 0}
                        <span className="text-amber-500">Stars</span>
                      </CardTitle>
                      <CardDescription className="text-slate-400 font-bold">Votre solde de carburant digital</CardDescription>
                    </div>
                    <Badge variant="outline" className="text-amber-500 border-amber-500/30 bg-amber-500/10">Premium</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-6 relative z-10">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-black uppercase tracking-widest">
                      <span>Progression</span>
                      <span className="text-amber-500">{Math.min(100, ((profile?.currentStarsBalance || 0) / 500) * 100).toFixed(0)}%</span>
                    </div>
                    <Progress value={Math.min(100, ((profile?.currentStarsBalance || 0) / 500) * 100)} className="h-3 bg-white/10" />
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <BuyStarsDialog currentBalance={profile?.currentStarsBalance || 0} />
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <h2 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Gift className="text-emerald-500" />
                  Gagner des Stars gratuitement
                </h2>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {earningActions.map((action, i) => (
                    <motion.div key={i} whileHover={{ y: -5 }}>
                      <Card 
                        className="cursor-pointer border-slate-100 hover:border-emerald-200 transition-all group"
                        onClick={() => handleActionClick(action)}
                      >
                        <CardContent className="p-5 space-y-3">
                          <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center text-white relative", action.color)}>
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

            <div className="lg:col-span-1">
              <Card className="h-full border-none shadow-sm flex flex-col">
                <CardHeader className="pb-2 border-b">
                  <CardTitle className="text-lg font-black flex items-center gap-2">
                    <Clock className="text-blue-500 h-5 w-5" />
                    Journal récent
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0 flex-1 overflow-y-auto max-h-[600px]">
                  {isTransLoading ? (
                    <div className="p-10 flex flex-col items-center gap-2 text-muted-foreground">
                      <Loader2 className="animate-spin h-6 w-6" />
                    </div>
                  ) : transactions?.length ? (
                    transactions.map(t => <TransactionRow key={t.id} transaction={t} />)
                  ) : (
                    <div className="p-10 text-center space-y-4">
                      <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto text-slate-300">
                        <Smartphone className="h-8 w-8" />
                      </div>
                      <p className="text-xs text-muted-foreground font-medium italic">Aucune transaction.</p>
                    </div>
                  )}
                </CardContent>
                <CardFooter className="p-4 border-t bg-slate-50/50">
                  <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                    Les recharges Mobile Money (RDC) sont créditées après confirmation de l'opérateur.
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
