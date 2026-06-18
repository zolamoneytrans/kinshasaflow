/**
 * @fileOverview Configuration globale de l'application Kinshasa Flow.
 */

export const CONFIG = {
  // Nouvelle clé API "Kinshasaflow 3" configurée par l'utilisateur
  GOOGLE_MAPS_API_KEY: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyBgpYk0GoVsX24X5Bq1oKud0NfQUurRPFM",
  KINSHASA_BOUNDS: {
    north: -4.240,
    south: -4.516,
    west: 15.148,
    east: 15.565,
  },
  KINSHASA_CENTER: { lat: -4.330, lng: 15.313 },
};
