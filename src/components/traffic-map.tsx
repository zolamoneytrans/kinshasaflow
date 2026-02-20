'use client';

import React, { useEffect, useState } from 'react';
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search } from 'lucide-react';

const API_KEY = "AIzaSyAATKzCB1cHlHHcef9WaiWREIs5Whe7uKk";

// Coordinates for a known congested area in Kinshasa, Rond-point Victoire
const initialCenter = { lat: -4.330, lng: 15.313 };

const TrafficLayerComponent = () => {
    const map = useMap();

    useEffect(() => {
        if (!map) return;

        const g = (window as any).google;
        if (!g) return;

        const trafficLayer = new g.maps.TrafficLayer();
        trafficLayer.setMap(map);

        return () => {
            trafficLayer.setMap(null);
        };
    }, [map]);

    return null;
};

export default function TrafficMap() {
    const [searchQuery, setSearchQuery] = useState('');
    const [center, setCenter] = useState(initialCenter);
    const [zoom, setZoom] = useState(15);

    const handleSearch = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        try {
            // Geocoding request biased towards Kinshasa
            const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(searchQuery)}&key=${API_KEY}&components=country:CD&bounds=-4.55,15.15|-4.1,15.6`);
            const data = await response.json();

            if (data.status === 'OK' && data.results[0]) {
                const location = data.results[0].geometry.location;
                setCenter(location);
                setZoom(16); // Zoom in closer on search result
            } else {
                console.error('Geocoding search failed:', data.status);
                // In a real app, you'd show a toast notification here.
            }
        } catch (error) {
            console.error('Error during geocoding API call:', error);
        }
    };

    if (!API_KEY) {
        return (
            <div className="flex h-full w-full items-center justify-center rounded-lg bg-muted border">
                <p className="text-destructive-foreground bg-destructive p-4 rounded-md">
                    La clé API Google Maps n'est pas configurée correctement.
                </p>
            </div>
        );
    }

    return (
        <div className="w-full h-full rounded-lg overflow-hidden shadow-lg relative">
             <APIProvider apiKey={API_KEY}>
                <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 w-full max-w-md px-4">
                    <form onSubmit={handleSearch} className="flex w-full items-center gap-2">
                        <Input 
                            type="text"
                            placeholder="Rechercher une avenue, un quartier..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-background/90 shadow-md"
                        />
                        <Button type="submit" size="icon" className="shadow-md">
                            <Search />
                            <span className="sr-only">Rechercher</span>
                        </Button>
                    </form>
                </div>

                <Map
                    zoom={zoom}
                    center={center}
                    onZoomChanged={(e) => setZoom(e.detail.zoom)}
                    onCenterChanged={(e) => setCenter(e.detail.center)}
                    gestureHandling={'greedy'}
                    disableDefaultUI={true}
                    className="w-full h-full"
                    mapId="kinshasa_traffic_map" // Good practice for styling/control
                >
                    <TrafficLayerComponent />
                </Map>
            </APIProvider>
        </div>
    );
}
