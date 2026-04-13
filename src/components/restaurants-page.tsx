'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { 
  Search, 
  MapPin, 
  Star, 
  Navigation, 
  Utensils, 
  X, 
  SlidersHorizontal,
  ChevronRight,
  Loader2,
  Navigation2
} from 'lucide-react';
import { Restaurant } from '@/lib/types';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { APIProvider, Map, Marker } from '@vis.gl/react-google-maps';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

const GOOGLE_MAPS_API_KEY = "AIzaSyAATKzCB1cHlHHcef9WaiWREIs5Whe7uKk";

const MOCK_RESTAURANTS: Restaurant[] = [
  {
    id: '1',
    name: "Chez Flore",
    commune: "Gombe",
    address: "Av. de la Justice, Gombe",
    cuisine: "Congo & Européenne",
    rating: 4.5,
    priceRange: '$$$',
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&q=80&w=800",
    coords: { lat: -4.308, lng: 15.305 }
  },
  {
    id: '2',
    name: "A l'Epicerie",
    commune: "Gombe",
    address: "Boulevard du 30 Juin, Gombe",
    cuisine: "Française",
    rating: 4.8,
    priceRange: '$$$$',
    image: "https://images.unsplash.com/photo-1552566626-52f8b828add9?auto=format&fit=crop&q=80&w=800",
    coords: { lat: -4.312, lng: 15.310 }
  },
  {
    id: '3',
    name: "O'Poeta",
    commune: "Ngaliema",
    address: "Ma Campagne, Ngaliema",
    cuisine: "Italienne",
    rating: 4.2,
    priceRange: '$$',
    image: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?auto=format&fit=crop&q=80&w=800",
    coords: { lat: -4.348, lng: 15.268 }
  },
  {
    id: '4',
    name: "Le Cercle Gourmand",
    commune: "Gombe",
    address: "Cercle Français, Gombe",
    cuisine: "Fine Dining",
    rating: 4.7,
    priceRange: '$$$$',
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?auto=format&fit=crop&q=80&w=800",
    coords: { lat: -4.305, lng: 15.295 }
  },
  {
    id: '5',
    name: "Petit Restaurant",
    commune: "Limete",
    address: "7ème Rue Limete",
    cuisine: "Locale",
    rating: 3.9,
    priceRange: '$',
    image: "https://images.unsplash.com/photo-1559339352-11d035aa65de?auto=format&fit=crop&q=80&w=800",
    coords: { lat: -4.360, lng: 15.362 }
  },
  {
    id: '6',
    name: "Zinnia",
    commune: "Gombe",
    address: "Avenue du Port, Gombe",
    cuisine: "Fusion",
    rating: 4.6,
    priceRange: '$$$',
    image: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?auto=format&fit=crop&q=80&w=800",
    coords: { lat: -4.302, lng: 15.315 }
  }
];

const COMMUNES = ["Gombe", "Ngaliema", "Limete", "Kalamu", "Kintambo", "Lingwala"];

export default function RestaurantsPage() {
  const [search, setSearch] = useState('');
  const [activeCommune, setActiveCommune] = useState('Tous');
  const [minRating, setMinRating] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [navTarget, setNavTarget] = useState<Restaurant | null>(null);

  // Demander la localisation au chargement
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.warn("Geolocation denied", err)
      );
    }
  }, []);

  const calculateDistance = (p1: {lat: number, lng: number}, p2: {lat: number, lng: number}) => {
    const R = 6371; // Rayon de la terre en km
    const dLat = (p2.lat - p1.lat) * Math.PI / 180;
    const dLng = (p2.lng - p1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) * 
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const filteredRestaurants = useMemo(() => {
    return MOCK_RESTAURANTS.filter(r => {
      const matchSearch = r.name.toLowerCase().includes(search.toLowerCase()) || 
                          r.cuisine.toLowerCase().includes(search.toLowerCase());
      const matchCommune = activeCommune === 'Tous' || r.commune === activeCommune;
      const matchRating = r.rating >= minRating;
      return matchSearch && matchCommune && matchRating;
    }).sort((a, b) => {
      if (userLocation) {
        const distA = calculateDistance(userLocation, a.coords);
        const distB = calculateDistance(userLocation, b.coords);
        return distA - distB;
      }
      return 0;
    });
  }, [search, activeCommune, minRating, userLocation]);

  return (
    <div className="w-full h-full flex flex-col bg-slate-50/50 overflow-hidden">
      
      {/* Header & Search */}
      <div className="bg-white border-b p-4 md:p-6 shadow-sm z-30">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <Input 
                placeholder="Nom du restaurant ou cuisine..." 
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-12 h-14 rounded-2xl border-2 border-slate-100 bg-slate-50 font-bold focus-visible:ring-primary shadow-inner"
              />
            </div>
            <Button 
              variant="outline" 
              onClick={() => setShowFilters(!showFilters)}
              className={cn("h-14 px-6 rounded-2xl border-2 font-black gap-2", showFilters ? "bg-primary text-white border-primary" : "bg-white")}
            >
              <SlidersHorizontal className="h-5 w-5" />
              Filtres
            </Button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className="grid md:grid-cols-2 gap-6 pt-2 pb-4">
                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Filtrer par Commune</p>
                    <div className="flex flex-wrap gap-2">
                      {['Tous', ...COMMUNES].map(c => (
                        <Badge 
                          key={c}
                          onClick={() => setActiveCommune(c)}
                          className={cn(
                            "cursor-pointer px-3 py-1.5 rounded-full font-bold transition-all",
                            activeCommune === c ? "bg-primary text-white" : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-100"
                          )}
                        >
                          {c}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Note Minimale</p>
                    <div className="flex gap-2">
                      {[0, 3, 4, 4.5].map(r => (
                        <Button
                          key={r}
                          variant="ghost"
                          onClick={() => setMinRating(r)}
                          className={cn(
                            "h-10 rounded-xl px-4 font-black flex items-center gap-1.5",
                            minRating === r ? "bg-amber-100 text-amber-700" : "bg-slate-100 text-slate-500"
                          )}
                        >
                          <Star className={cn("h-4 w-4", minRating === r && "fill-amber-500 text-amber-500")} />
                          {r === 0 ? "Toutes" : `${r}+`}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="flex-1 grid lg:grid-cols-2 overflow-hidden">
        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          <div className="max-w-xl mx-auto space-y-6">
            {filteredRestaurants.length > 0 ? (
              filteredRestaurants.map((res, i) => (
                <motion.div
                  key={res.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Card className="rounded-[2rem] border-none shadow-sm hover:shadow-xl transition-all overflow-hidden group">
                    <div className="relative aspect-[21/9] overflow-hidden">
                      <Image 
                        src={res.image} 
                        alt={res.name} 
                        fill 
                        className="object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                      <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg">
                        <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                        <span className="font-black text-slate-900">{res.rating}</span>
                      </div>
                      <div className="absolute bottom-4 left-4">
                        <Badge className="bg-primary/90 text-white border-none px-3 py-1 font-black uppercase tracking-tighter shadow-lg">
                          {res.cuisine}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-2xl font-black text-slate-900 tracking-tight group-hover:text-primary transition-colors">{res.name}</h3>
                          <p className="text-sm text-slate-500 font-medium flex items-center gap-1 mt-1">
                            <MapPin className="h-3.5 w-3.5 text-primary" />
                            {res.commune} • {res.address}
                          </p>
                        </div>
                        <div className="text-emerald-600 font-black tracking-widest">{res.priceRange}</div>
                      </div>
                      
                      <div className="flex gap-3 pt-2">
                        <Button 
                          onClick={() => setNavTarget(res)}
                          className="flex-1 rounded-2xl h-12 font-black shadow-lg shadow-primary/20 gap-2"
                        >
                          <Navigation className="h-4 w-4" />
                          Y Aller
                        </Button>
                        <Button variant="outline" className="rounded-2xl h-12 px-6 font-bold border-2">
                          Détails
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
                <div className="bg-slate-100 p-6 rounded-full">
                  <Utensils className="h-12 w-12 text-slate-300" />
                </div>
                <div className="space-y-1">
                  <p className="text-xl font-bold text-slate-800">Aucun restaurant trouvé</p>
                  <p className="text-slate-500">Essayez de modifier vos critères de recherche ou vos filtres.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Map View */}
        <div className="hidden lg:block h-full relative">
          <APIProvider apiKey={GOOGLE_MAPS_API_KEY}>
            <Map
              defaultCenter={userLocation || { lat: -4.330, lng: 15.313 }}
              defaultZoom={13}
              gestureHandling={'greedy'}
              disableDefaultUI={true}
              mapId="kinshasa_restaurants_map"
              className="w-full h-full"
            >
              {filteredRestaurants.map(res => (
                <Marker 
                  key={res.id} 
                  position={res.coords} 
                  onClick={() => setNavTarget(res)}
                  title={res.name}
                />
              ))}
            </Map>
          </APIProvider>
        </div>
      </div>

      {/* Navigation Modal */}
      <Dialog open={!!navTarget} onOpenChange={(open) => !open && setNavTarget(null)}>
        <DialogContent className="max-w-5xl h-[90vh] p-0 overflow-hidden rounded-[2.5rem] border-none shadow-2xl">
          <div className="flex flex-col h-full">
            <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="bg-primary p-3 rounded-2xl">
                  <Navigation2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-black">Navigation vers {navTarget?.name}</DialogTitle>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">{navTarget?.address}</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full" onClick={() => setNavTarget(null)}>
                <X className="h-6 w-6" />
              </Button>
            </div>
            <div className="flex-1 bg-slate-100 relative">
              {navTarget && (
                <iframe
                  width="100%"
                  height="100%"
                  style={{ border: 0 }}
                  loading="lazy"
                  allowFullScreen
                  src={`https://www.google.com/maps/embed/v1/directions?key=${GOOGLE_MAPS_API_KEY}&origin=${userLocation ? `${userLocation.lat},${userLocation.lng}` : '-4.313,15.313'}&destination=${navTarget.coords.lat},${navTarget.coords.lng}&mode=driving`}
                ></iframe>
              )}
            </div>
            <div className="p-6 bg-white border-t flex justify-center">
              <Button variant="destructive" onClick={() => setNavTarget(null)} className="rounded-2xl font-black h-14 px-10 text-lg shadow-xl shadow-red-200">
                Terminer la navigation
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
