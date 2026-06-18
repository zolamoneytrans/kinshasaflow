/**
 * @fileOverview Configuration globale de l'application Kinshasa Flow.
 */

export const CONFIG = {
  // Clé API synchronisée avec le projet studio-874039458-d0447
  GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyD_wEf8tEk9ZffJfUnLI7ndITSt5p05FoU",
  KINSHASA_BOUNDS: {
    north: -4.240,
    south: -4.516,
    west: 15.148,
    east: 15.565,
  },
  KINSHASA_CENTER: { lat: -4.330, lng: 15.313 },
};
