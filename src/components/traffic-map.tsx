'use client';

import React, { useEffect } from 'react';
import { APIProvider, Map, useMap } from '@vis.gl/react-google-maps';

const API_KEY = "AIzaSyAATKzCB1cHlHHcef9WaiWREIs5Whe7uKk";

// Coordinates for a known congested area in Kinshasa, Rond-point Victoire
const congestedAreaPosition = { lat: -4.330, lng: 15.313 };

// This component uses the useMap hook to get the map instance and add the traffic layer.
// It must be a child of the <Map> component.
const TrafficLayerComponent = () => {
    const map = useMap();

    useEffect(() => {
        if (!map) return;

        // The google object is globally available after the APIProvider loads the script.
        // We need to tell TypeScript to expect it on the window object.
        const g = (window as any).google;
        if (!g) return;

        const trafficLayer = new g.maps.TrafficLayer();
        trafficLayer.setMap(map);

        // Cleanup function to remove the layer when the component unmounts.
        return () => {
            trafficLayer.setMap(null);
        };
    }, [map]);

    return null; // This component does not render anything itself.
};

export default function TrafficMap() {
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
        <div className="w-full h-full rounded-lg overflow-hidden shadow-lg">
             <APIProvider apiKey={API_KEY}>
                <Map
                    defaultZoom={15}
                    defaultCenter={congestedAreaPosition}
                    className="w-full h-full"
                >
                    <TrafficLayerComponent />
                </Map>
            </APIProvider>
        </div>
    );
}
