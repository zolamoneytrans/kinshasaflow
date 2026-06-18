/**
 * @fileOverview Configuration globale de l'application Kinshasa Flow.
 */

export const CONFIG = {
  // Priorité à la variable d'environnement, sinon clé de secours
  GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyAATKzCB1cHlHHcef9WaiWREIs5Whe7uKk",
  KINSHASA_BOUNDS: {
    north: -4.240,
    south: -4.516,
    west: 15.148,
    east: 15.565,
  },
  KINSHASA_CENTER: { lat: -4.330, lng: 15.313 },
};
