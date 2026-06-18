'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
  Loader2,
  Navigation2,
  Navigation as NavigationIcon
} from 'lucide-react';
import { Restaurant } from '@/lib/types';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';
import { Map, useMap, useMapsLibrary, Marker } from '@vis.gl/react-google-maps';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { CONFIG } from '@/lib/config';

const COMMUNES = ["Gombe", "Ngaliema", "Limete", "Kalamu", "Kintambo", "Lingwala", "Bandalungwa", "Barumbu", "Kinshasa", "Lemba", "Matete"];

export default function RestaurantsPage() {
  const [search, setSearch] = useState('');
  const [activeCommune, setActiveCommune] = useState('Tous');
  const [minRating, setMinRating] = useState(0);
  const [showFilters, setShowFilters] = useState(false);
  const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);
  const [navTarget, setNavTarget] = useState<Restaurant | null>(null);
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const filterTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Auto-fold logic for filters
  useEffect(() => {
    if (showFilters) {
      if (filterTimeoutRef.current) clearTimeout(filterTimeoutRef.current);
      filterTimeoutRef.current = setTimeout(() => {
        setShowFilters(false);
      }, 8000);
    }
    return () => {
      if (filterTimeoutRef.current) clearTimeout(filterTimeoutRef.current);
    };
  }, [showFilters, activeCommune, minRating]);

  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => console.warn("Géolocalisation refusée", err)
      );
    }
  }, []);

  const calculateDistance = (p1: {lat: number, lng: number}, p2: {lat: number, lng: number}) => {
    const R = 6371; 
    const dLat = (p2.lat - p1.lat) * Math.PI / 180;
    const dLng = (p2.lng - p1.lng) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(p1.lat * Math.PI / 180) * Math.cos(p2.lat * Math.PI / 180) * 
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const sortedRestaurants = useMemo(() => {
    if (!userLocation) return restaurants;
    return [...restaurants].sort((a, b) => {
      const distA = calculateDistance(userLocation, a.coords);
      const distB = calculateDistance(userLocation, b.coords);
      return distA - distB;
    });
  }, [restaurants, userLocation]);

  return (
    <div className="w-full h-full flex flex-col bg-slate-50/50 overflow-hidden">
        {/* Header & Search */}
        <div className="bg-white border-b p-4 md:p-6 shadow-sm z-30">
          <div className="max-w-6xl mx-auto space-y-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <Input 
                  placeholder="Chercher un restaurant à Kinshasa (ex: Pizza, Gombe, Nganda)..." 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && setShowFilters(false)}
                  className="pl-12 h-14 rounded-2xl border-2 border-slate-100 bg-slate-50 font-bold focus-visible:ring-primary shadow-inner"
                />
              </div>
              <Button 
                variant="outline" 
                onClick={() => setShowFilters(!showFilters)}
                className={cn("h-14 px-6 rounded-2xl border-2 font-black gap-2 transition-all", showFilters ? "bg-primary text-white border-primary shadow-lg scale-95" : "bg-white")}
              >
                <SlidersHorizontal className="h-5 w-5" />
                Filtres
              </Button>
            </div>

            <AnimatePresence>
              {showFilters && (
                <motion.div 
                  initial={{ height: 0, opacity: 0, y: -10 }}
                  animate={{ height: 'auto', opacity: 1, y: 0 }}
                  exit={{ height: 0, opacity: 0, y: -10 }}
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
                  <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden mb-2">
                    <motion.div 
                      className="h-full bg-primary/30" 
                      initial={{ width: "100%" }} 
                      animate={{ width: "0%" }} 
                      transition={{ duration: 8, ease: "linear" }}
                    />
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
              <PlacesSearchHandler 
                search={search} 
                commune={activeCommune} 
                minRating={minRating}
                setRestaurants={setRestaurants}
                setIsLoading={setIsLoading}
              />

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-32 gap-4">
                  <Loader2 className="h-12 w-12 text-primary animate-spin" />
                  <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Recherche sur Google Maps...</p>
                </div>
              ) : sortedRestaurants.length > 0 ? (
                sortedRestaurants.map((res, i) => (
                  <motion.div
                    key={res.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                  >
                    <Card className="rounded-[2.5rem] border-none shadow-sm hover:shadow-xl transition-all overflow-hidden group bg-white">
                      <div className="relative aspect-[21/9] overflow-hidden bg-slate-100">
                        {res.image ? (
                          <Image 
                            src={res.image} 
                            alt={res.name} 
                            fill 
                            className="object-cover group-hover:scale-105 transition-transform duration-700 group-hover:cursor-zoom-in" 
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Utensils className="h-12 w-12 text-slate-300" />
                          </div>
                        )}
                        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-lg border border-white/20">
                          <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                          <span className="font-black text-slate-900">{res.rating || '--'}</span>
                        </div>
                        <div className="absolute bottom-4 left-4">
                          <Badge className="bg-primary/90 text-white border-none px-4 py-1.5 rounded-xl font-black uppercase tracking-tighter shadow-lg">
                            {res.cuisine}
                          </Badge>
                        </div>
                      </div>
                      <CardContent className="p-8">
                        <div className="flex justify-between items-start mb-6">
                          <div className="space-y-1">
                            <h3 className="text-2xl font-black text-slate-900 tracking-tight group-hover:text-primary transition-colors leading-none">{res.name}</h3>
                            <p className="text-sm text-slate-500 font-bold flex items-center gap-1.5 pt-2">
                              <MapPin className="h-4 w-4 text-primary" />
                              {res.commune} • {res.address}
                            </p>
                          </div>
                          <div className="text-emerald-600 font-black tracking-widest bg-emerald-50 px-3 py-1 rounded-lg text-xs">{res.priceRange}</div>
                        </div>
                        
                        <div className="flex gap-3">
                          <Button 
                            onClick={() => setNavTarget(res)}
                            className="flex-1 rounded-[1.25rem] h-14 font-black shadow-xl shadow-primary/20 gap-3 text-lg"
                          >
                            <NavigationIcon className="h-5 w-5" />
                            Y Aller
                          </Button>
                          <Button variant="outline" className="rounded-[1.25rem] h-14 px-8 font-bold border-2 hover:bg-slate-50">
                            Détails
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center py-32 text-center space-y-4 bg-white rounded-[3rem] border-2 border-dashed">
                  <div className="bg-slate-100 p-8 rounded-full">
                    <Utensils className="h-16 w-16 text-slate-300" />
                  </div>
                  <div className="space-y-1 px-8">
                    <p className="text-2xl font-black text-slate-800 tracking-tight">Aucun établissement trouvé</p>
                    <p className="text-sm text-slate-500 font-medium">Nous n'avons trouvé aucun restaurant correspondant à vos critères à Kinshasa.</p>
                  </div>
                  <Button variant="link" onClick={() => { setSearch(''); setActiveCommune('Tous'); setMinRating(0); }} className="text-primary font-bold">
                    Réinitialiser les filtres
                  </Button>
                </div>
              )}
            </div>
          </div>

          {/* Map View */}
          <div className="hidden lg:block h-full relative">
            <Map
              defaultCenter={CONFIG.KINSHASA_CENTER}
              defaultZoom={13}
              gestureHandling={'greedy'}
              disableDefaultUI={true}
              className="w-full h-full"
            >
              {restaurants.map(res => (
                <Marker 
                  key={res.id} 
                  position={res.coords} 
                  onClick={() => setNavTarget(res)}
                  title={res.name}
                />
              ))}
            </Map>
          </div>
        </div>

        {/* Navigation Modal */}
        <Dialog open={!!navTarget} onOpenChange={(open) => !open && setNavTarget(null)}>
          <DialogContent className="max-w-5xl h-[90vh] p-0 overflow-hidden rounded-[3rem] border-none shadow-2xl">
            <div className="flex flex-col h-full">
              <div className="p-6 bg-slate-900 text-white flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="bg-primary p-4 rounded-[1.25rem] shadow-lg shadow-primary/20">
                    <Navigation2 className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <DialogTitle className="text-2xl font-black tracking-tight leading-none">{navTarget?.name}</DialogTitle>
                    <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mt-2">{navTarget?.address}</p>
                  </div>
                </div>
                <Button variant="ghost" size="icon" className="text-white hover:bg-white/10 rounded-full h-12 w-12" onClick={() => setNavTarget(null)}>
                  <X className="h-8 w-8" />
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
                    src={`https://www.google.com/maps/embed/v1/directions?key=${CONFIG.GOOGLE_MAPS_API_KEY}&origin=${userLocation ? `${userLocation.lat},${userLocation.lng}` : '-4.313,15.313'}&destination=${navTarget.coords.lat},${navTarget.coords.lng}&mode=driving`}
                  ></iframe>
                )}
              </div>
              <div className="p-8 bg-white border-t flex justify-center">
                <Button variant="destructive" onClick={() => setNavTarget(null)} className="rounded-2xl font-black h-16 px-12 text-xl shadow-2xl shadow-red-200 uppercase tracking-widest">
                  Terminer la navigation
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
    </div>
  );
}

function PlacesSearchHandler({ search, commune, minRating, setRestaurants, setIsLoading }: { 
  search: string, 
  commune: string, 
  minRating: number,
  setRestaurants: (res: Restaurant[]) => void,
  setIsLoading: (loading: boolean) => void
}) {
  const map = useMap();
  const placesLibrary = useMapsLibrary('places');

  const performSearch = useCallback(() => {
    if (!map || !placesLibrary) return;

    setIsLoading(true);
    const service = new placesLibrary.PlacesService(map);
    
    let queryParts = ['restaurant'];
    if (search) queryParts.push(search);
    if (commune !== 'Tous') queryParts.push(commune);
    queryParts.push('Kinshasa');

    const request: google.maps.places.TextSearchRequest = {
      query: queryParts.join(' '),
      location: new google.maps.LatLng(CONFIG.KINSHASA_CENTER.lat, CONFIG.KINSHASA_CENTER.lng),
      radius: 15000, 
      type: 'restaurant'
    };

    service.textSearch(request, (results, status) => {
      if (status === placesLibrary.PlacesServiceStatus.OK && results) {
        const formatted: Restaurant[] = results
          .filter(r => (r.rating || 0) >= minRating)
          .map(r => ({
            id: r.place_id || Math.random().toString(),
            name: r.name || 'Restaurant sans nom',
            commune: commune !== 'Tous' ? commune : (r.vicinity || 'Kinshasa'),
            address: r.formatted_address || r.vicinity || 'Kinshasa',
            rating: r.rating || 0,
            cuisine: r.types?.includes('bakery') ? 'Boulangerie' : 
                     r.types?.includes('cafe') ? 'Café' : 'Restaurant',
            priceRange: r.price_level === 0 ? '$' : r.price_level === 1 ? '$$' : r.price_level === 2 ? '$$$' : '$$$$',
            image: r.photos?.[0]?.getUrl({ maxWidth: 800 }) || `https://picsum.photos/seed/${r.place_id}/800/400`,
            coords: {
              lat: r.geometry?.location?.lat() || CONFIG.KINSHASA_CENTER.lat,
              lng: r.geometry?.location?.lng() || CONFIG.KINSHASA_CENTER.lng
            }
          }));
        setRestaurants(formatted);
      } else {
        setRestaurants([]);
      }
      setIsLoading(false);
    });
  }, [map, placesLibrary, search, commune, minRating, setRestaurants, setIsLoading]);

  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch();
    }, 500); 
    return () => clearTimeout(timer);
  }, [performSearch]);

  return null;
}
