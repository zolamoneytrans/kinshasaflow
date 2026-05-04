
import { z } from "zod";
import { Timestamp } from "firebase/firestore";

// Star Costs Constants
export const STAR_COSTS = {
  AI_MESSAGE: 5,
  MAP_VIEW: 3,
  ROAD_VERIFY: 1,
  ROUTE_PLAN: 4,
  ALERTS_DAILY: 2,
  EXPORT_REPORT: 10,
  SIGNUP_BONUS: 25,
  NAVIGATION_SESSION: 3,
} as const;

// App Navigation Features
export const navFeatures = [
  'reports', 'liveTraffic', 'localTraffic', 'map', 'assistant', 'notifications', 'myStars', 'report', 'police', 
  'routes', 'announcements', 'logement', 'transport', 'carRental', 'tourism', 
  'events', 'videos', 'kinshasa', 'restaurants', 'contact', 'share', 'fluxInfrastructure', 'kFlowNav', 'insights'
] as const;
export type NavFeature = typeof navFeatures[number];

export const appNavigationSettingsSchema = z.object({
  reports: z.boolean().default(true),
  liveTraffic: z.boolean().default(true),
  localTraffic: z.boolean().default(true),
  map: z.boolean().default(true),
  assistant: z.boolean().default(true),
  notifications: z.boolean().default(true),
  myStars: z.boolean().default(true),
  report: z.boolean().default(true),
  police: z.boolean().default(true),
  routes: z.boolean().default(true),
  announcements: z.boolean().default(true),
  logement: z.boolean().default(true),
  transport: z.boolean().default(true),
  carRental: z.boolean().default(true),
  tourism: z.boolean().default(true),
  events: z.boolean().default(true),
  videos: z.boolean().default(true),
  kinshasa: z.boolean().default(true),
  restaurants: z.boolean().default(true),
  contact: z.boolean().default(true),
  share: z.boolean().default(true),
  fluxInfrastructure: z.boolean().default(true),
  kFlowNav: z.boolean().default(true),
  insights: z.boolean().default(true),
});
export type AppNavigationSettings = z.infer<typeof appNavigationSettingsSchema>;

export interface AppSubscriptionSettings {
  mode: 'stars' | 'cash';
  lastUpdated?: any;
}

// User profile extension for Stars System
export const userProfileSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  name: z.string().optional(),
  photoURL: z.string().optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  currentStarsBalance: z.number().default(0),
  totalStarsEarned: z.number().default(0),
  totalStarsPurchased: z.number().default(0),
  totalStarsUsed: z.number().default(0),
  lastLoginTimestamp: z.instanceof(Timestamp).or(z.any()).optional(),
  consecutiveLoginDays: z.number().default(0),
  referralCode: z.string().optional(),
  isProfileComplete: z.boolean().default(false),
  isBlocked: z.boolean().default(false),
  isCashSubscribed: z.boolean().default(false),
  cashSubscriptionExpiry: z.instanceof(Timestamp).or(z.any()).optional(),
  hasUsedFreeTrial: z.boolean().default(false),
  createdAt: z.instanceof(Timestamp).or(z.any()).optional(),
});
export type UserProfile = z.infer<typeof userProfileSchema>;

// Notification Schema
export const appNotificationSchema = z.object({
  type: z.enum(['user_joined', 'traffic_report', 'video_added', 'system_alert']),
  title: z.string(),
  message: z.string(),
  timestamp: z.instanceof(Timestamp).or(z.any()),
  link: z.string().optional(),
  userId: z.string().optional(),
});
export type AppNotification = z.infer<typeof appNotificationSchema>;

// Daily Traffic Report
export const dailyTrafficReportSchema = z.object({
  timestamp: z.instanceof(Timestamp).or(z.any()),
  globalSaturation: z.number(),
  axisStats: z.array(z.object({
    road: z.string(),
    status: z.string(),
    speed: z.number(),
    delay: z.number(),
    vehicleCount: z.number().optional(),
    capacity: z.number().optional(),
  })),
});
export type DailyTrafficReport = z.infer<typeof dailyTrafficReportSchema>;

// Traffic Insight (AI Analysis)
export const trafficInsightSchema = z.object({
  userId: z.string(),
  timestamp: z.instanceof(Timestamp).or(z.any()),
  globalStatus: z.string(),
  saturationScore: z.number(),
  recommendations: z.array(z.string()),
  criticalAxes: z.array(z.string()),
});
export type TrafficInsight = z.infer<typeof trafficInsightSchema>;

// Star Transaction
export const starTransactionSchema = z.object({
  userId: z.string(),
  type: z.enum(['purchase', 'earned', 'spent', 'admin_adjustment']),
  starsChange: z.number(),
  balanceAfterTransaction: z.number(),
  description: z.string(),
  timestamp: z.instanceof(Timestamp).or(z.any()),
  relatedObjectId: z.string().optional(),
  relatedObjectType: z.string().optional(),
});
export type StarTransaction = z.infer<typeof starTransactionSchema>;

// Advert Video
export const advertVideoSchema = z.object({
  title: z.string(),
  videoUrl: z.string().url(),
  thumbnailUrl: z.string().url().optional(),
  duration: z.number().default(30),
  createdAt: z.instanceof(Timestamp).or(z.any()),
});
export type AdvertVideo = z.infer<typeof advertVideoSchema>;

export const advertUploadFormSchema = z.object({
    title: z.string().min(5, "Le titre doit comporter au moins 5 caractères."),
    video: z.any().refine(file => file?.length == 1, "Un fichier vidéo est requis."),
});
export type AdvertUploadFormValues = z.infer<typeof advertUploadFormSchema>;

// Schema for comments to be stored in Firestore
export const commentSchema = z.object({
  userId: z.string(),
  author: z.string(),
  avatar: z.string(),
  text: z.string().min(1, "Le commentaire ne peut pas être vide."),
  createdAt: z.instanceof(Timestamp).or(z.any()),
});
export type Comment = z.infer<typeof commentSchema>;
export type WithId<T> = T & { id: string };

// Schema for event reports to be stored in Firestore
export const eventReportSchema = z.object({
  location: z.string(),
  description: z.string(),
  severity: z.enum(['low', 'medium', 'high']),
  userId: z.string(),
  user: z.string(),
  userAvatar: z.string(),
  picture: z.string().optional(),
  createdAt: z.instanceof(Timestamp).or(z.any()),
});
export type EventReport = z.infer<typeof eventReportSchema>;

export const reportFormSchema = z.object({
  location: z.string().min(5, {
    message: 'Le lieu doit comporter au moins 5 caractères.',
  }),
  description: z.string().min(10, {
    message: 'La description doit comporter au moins 10 caractères.',
  }),
  severity: z.enum(['low', 'medium', 'high'], {
    required_error: 'Vous devez sélectionner une sévérité.',
  }),
  picture: z.any().optional(),
});
export type ReportFormValues = z.infer<typeof reportFormSchema>;

export const TrafficTipsInputSchema = z.object({
  location: z.string().describe("Le lieu de l'incident de la circulation à Kinshasa."),
  description: z.string().describe("Une description de l'incident de la circulation."),
});
export type TrafficTipsInput = z.infer<typeof TrafficTipsInputSchema>;

export const TrafficTipsOutputSchema = z.object({
  tips: z.array(z.string()).describe("Une liste de conseils pratiques pour éviter les embouteillages."),
});
export type TrafficTipsOutput = z.infer<typeof TrafficTipsOutputSchema>;

export const StrategicInsightsInputSchema = z.object({
  axes: z.array(z.object({
    road: z.string(),
    status: z.string(),
    delay: z.number(),
    speed: z.number()
  })),
});
export type StrategicInsightsInput = z.infer<typeof StrategicInsightsInputSchema>;

export const StrategicInsightsOutputSchema = z.object({
  globalAdvice: z.string().describe("Conseil global sur l'état de la ville."),
  tips: z.array(z.string()).describe("3 conseils stratégiques d'évitement."),
  trend: z.enum(['amélioration', 'dégradation', 'stable']).describe("Tendance pour les 30 prochaines minutes."),
});
export type StrategicInsightsOutput = z.infer<typeof StrategicInsightsOutputSchema>;

export const AssistantInputSchema = z.object({
  question: z.string().describe("The user's question about a route in Kinshasa."),
});
export type AssistantInput = z.infer<typeof AssistantInputSchema>;

export const AssistantOutputSchema = z.object({
  answer: z.string().describe("The AI assistant's answer in French or Lingala."),
});
export type AssistantOutput = z.infer<typeof AssistantOutputSchema>;

export const policeReportSchema = z.object({
  location: z.string(),
  note: z.string(),
  type: z.enum(['control', 'traffic_management', 'incident']),
});
export type PoliceReport = z.infer<typeof policeReportSchema>;

export const loginSchema = z.object({
  email: z.string().email({ message: "Veuillez entrer une adresse e-mail valide." }),
  password: z.string().min(1, { message: "Veuillez entrer votre mot de passe." }),
});
export type LoginValues = z.infer<typeof loginSchema>;

export const signupSchema = z.object({
  name: z.string().min(2, { message: "Le nom doit comporter au moins 2 caractères." }),
  email: z.string().email({ message: "Veuillez entrer une adresse e-mail valide." }),
  password: z.string().min(8, { message: "Le mot de passe doit comporter au moins 8 caractères." }),
  phone: z.string().min(9, { message: "Veuillez entrer un numéro de téléphone valide." }),
  city: z.string().min(2, { message: "Veuillez entrer votre ville." }),
  country: z.string().min(2, { message: "Veuillez entrer votre pays." }),
});
export type SignupValues = z.infer<typeof signupSchema>;

export const videoSchema = z.object({
  title: z.string(),
  user: z.string(),
  userAvatar: z.string(),
  userId: z.string(),
  videoUrl: z.string().url(),
  thumbnailUrl: z.string().url(),
  likes: z.number(),
  createdAt: z.instanceof(Timestamp).or(z.any()),
});
export type Video = z.infer<typeof videoSchema>;

export const videoUploadFormSchema = z.object({
    title: z.string().min(5, "Le titre doit comporter au moins 5 caractères."),
    video: z.any().refine(file => file?.length == 1, "Un fichier vidéo est requis."),
});
export type VideoUploadFormValues = z.infer<typeof videoUploadFormSchema>;

export const pushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  expirationTime: z.number().nullable(),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});
export type PushSubscription = z.infer<typeof pushSubscriptionSchema>;

export const logementSchema = z.object({
  title: z.string().min(5, "Le titre doit comporter au moins 5 caractères."),
  description: z.string().min(20, "La description doit être plus détaillée."),
  address: z.string().min(10, "L'adresse doit être plus précise."),
  pricePerMonth: z.coerce.number().positive("Le prix doit être un nombre positif."),
  imageUrls: z.array(z.string().url()).min(1, "Au moins une image est requise."),
  amenities: z.array(z.string()),
  ownerId: z.string(),
  createdAt: z.instanceof(Timestamp).or(z.any()),
});
export type Logement = z.infer<typeof logementSchema>;

export const logementFormSchema = z.object({
  title: z.string().min(5, "Le titre doit comporter au moins 5 caractères."),
  description: z.string().min(20, "La description doit être plus détaillée."),
  address: z.string().min(10, "L'adresse doit être plus précise."),
  pricePerMonth: z.coerce.number().positive("Le prix doit être un nombre positif."),
  amenities: z.string().min(3, "Veuillez lister quelques commodités."),
  images: z.any()
    .refine((files) => files?.length >= 1, "Au moins une image est requise.")
    .refine((files) => Array.from(files).every((file: any) => file.size <= 5 * 1024 * 1024), `Chaque image doit faire moins de 5MB.`),
});
export type LogementFormValues = z.infer<typeof logementFormSchema>;

export const editLogementFormSchema = z.object({
  title: z.string().min(5, "Le titre doit comporter au moins 5 caractères."),
  description: z.string().min(20, "La description doit être plus détaillée."),
  address: z.string().min(10, "L'adresse doit être plus précise."),
  pricePerMonth: z.coerce.number().positive("Le prix doit être un nombre positif."),
  amenities: z.string().min(3, "Veuillez lister quelques commodités."),
});
export type EditLogementFormValues = z.infer<typeof editLogementFormSchema>;

export const transportSubscriptionFormSchema = z.object({
  fullName: z.string().min(3, "Le nom complet est requis."),
  phone: z.string().min(9, "Un numéro de téléphone valide est requis."),
  email: z.string().email("L'adresse e-mail n'est pas valide."),
  address: z.string().min(5, "L'adresse de résidence est requise."),
  district: z.string().min(3, "Le quartier de résidence est requis."),
  city: z.string().min(3, "La commune de résidence est requise."),
  workplace: z.string().min(3, "Le lieu de travail est requis."),
  departureTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Veuillez entrer une heure valide (HH:MM)."),
  returnTime: z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, "Veuillez entrer une heure valide (HH:MM)."),
});
export type TransportSubscriptionFormValues = z.infer<typeof transportSubscriptionFormSchema>;

export const transportSubscriptionSchema = transportSubscriptionFormSchema.extend({
    userId: z.string(),
    transportType: z.enum(['covoiturage', 'taxi_prive', 'mini_bus', 'entreprise']),
    status: z.enum(['pending', 'approved', 'active', 'rejected', 'cancelled']),
    price: z.number().positive().optional(),
    rejectionReason: z.string().optional(),
    subscriptionDate: z.instanceof(Timestamp).or(z.any()).optional(),
    carType: z.string().optional(),
    carColor: z.string().optional(),
    licensePlate: z.string().optional(),
    driverName: z.string().optional(),
    driverPhone: z.string().optional(),
    createdAt: z.instanceof(Timestamp).or(z.any()),
});
export type TransportSubscription = z.infer<typeof transportSubscriptionSchema>;

export { FirestorePermissionError } from '@/firebase/errors';

export const logementApplicationSchema = z.object({
  logementId: z.string(),
  logementTitle: z.string(),
  applicantId: z.string(),
  name: z.string().min(2, "Le nom est requis."),
  address: z.string().min(5, "L'adresse est requise."),
  email: z.string().email("L'email est invalide."),
  phone: z.string().min(9, "Le téléphone est invalide."),
  country: z.string().min(2, "Le pays est requis."),
  city: z.string().min(2, "La ville est requise."),
  whatsapp: z.string().optional(),
  status: z.enum(['pending', 'approved', 'rejected']),
  createdAt: z.instanceof(Timestamp).or(z.any()),
});
export type LogementApplication = z.infer<typeof logementApplicationSchema>;

export const logementApplicationFormSchema = logementApplicationSchema.omit({
  logementId: true,
  logementTitle: true,
  applicantId: true,
  status: true,
  createdAt: true,
});
export type LogementApplicationFormValues = z.infer<typeof logementApplicationFormSchema>;

export const inquirySchema = z.object({
  userId: z.string(),
  userEmail: z.string().email(),
  fullName: z.string(),
  phone: z.string(),
  type: z.enum(['inquiry', 'suggestion', 'complaint']),
  subject: z.string().min(5, "Le sujet doit comporter au moins 5 caractères."),
  message: z.string().min(10, "Le message doit comporter au moins 10 caractères."),
  createdAt: z.instanceof(Timestamp).or(z.any()),
});
export type Inquiry = z.infer<typeof inquirySchema>;

export const inquiryFormSchema = z.object({
  fullName: z.string().min(3, { message: "Le nom complet est requis." }),
  phone: z.string().min(9, { message: "Un numéro de téléphone valide est requis." }),
  type: z.enum(['inquiry', 'suggestion', 'complaint'], {
    required_error: 'Vous devez sélectionner un type de message.',
  }),
  subject: z.string().min(5, "Le sujet doit comporter au moins 5 caractères."),
  message: z.string().min(10, "Le message doit comporter au moins 10 caractères."),
});
export type InquiryFormValues = z.infer<typeof inquiryFormSchema>;

export const carBookingSchema = z.object({
  userId: z.string(),
  carId: z.string(),
  carName: z.string(),
  userName: z.string(),
  userPhone: z.string(),
  userAddress: z.string(),
  numberOfDays: z.number().optional(),
  startDate: z.instanceof(Timestamp).or(z.any()).optional().nullable(),
  endDate: z.instanceof(Timestamp).or(z.any()).optional().nullable(),
  status: z.enum(['pending', 'confirmed', 'completed', 'cancelled']),
  createdAt: z.instanceof(Timestamp).or(z.any()),
});
export type CarBooking = z.infer<typeof carBookingSchema>;

export const carBookingFormSchema = z.object({
  userName: z.string().min(3, "Le nom est requis."),
  userPhone: z.string().min(9, "Le numéro de téléphone est requis."),
  userAddress: z.string().min(5, "L'adresse est requise."),
  numberOfDays: z.coerce.number().int().min(1, "Veuillez entrer un nombre de jours valide."),
});
export type CarBookingFormValues = z.infer<typeof carBookingFormSchema>;

export const policeStationSchema = z.object({
  commune: z.string(),
  name: z.string(),
  phone: z.string(),
  address: z.string(),
});
export type PoliceStation = z.infer<typeof policeStationSchema>;

// Tourism
export const tourismEventSchema = z.object({
  title: z.string().min(5, "Le titre est requis."),
  description: z.string().min(20, "La description est requise."),
  location: z.string().min(5, "Le lieu est requis."),
  price: z.coerce.number().positive(),
  imageUrls: z.array(z.string().url()),
  category: z.string().min(3),
  whatsapp: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  createdAt: z.instanceof(Timestamp).or(z.any()),
});
export type TourismEvent = z.infer<typeof tourismEventSchema>;

export const tourismEventFormSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(20),
  location: z.string().min(5),
  price: z.coerce.number().positive(),
  category: z.string().min(3),
  whatsapp: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional().or(z.literal('')),
  images: z.any().optional(),
});
export type TourismEventFormValues = z.infer<typeof tourismEventFormSchema>;

export const tourismBookingSchema = z.object({
  userId: z.string(),
  eventId: z.string(),
  eventTitle: z.string(),
  userName: z.string(),
  userPhone: z.string(),
  bookingDate: z.instanceof(Timestamp).or(z.any()),
  numberOfPeople: z.number(),
  status: z.enum(['pending', 'confirmed', 'cancelled']),
  createdAt: z.instanceof(Timestamp).or(z.any()),
});
export type TourismBooking = z.infer<typeof tourismBookingSchema>;

export const tourismBookingFormSchema = z.object({
  userName: z.string().min(3, "Le nom est requis."),
  userPhone: z.string().min(9, "Le téléphone est requis."),
  numberOfPeople: z.coerce.number().int().min(1, "Minimum 1 personne."),
});
export type TourismBookingFormValues = z.infer<typeof tourismBookingFormSchema>;

export interface Restaurant {
  id: string;
  name: string;
  commune: string;
  address: string;
  rating: number;
  image: string;
  coords: { lat: number; lng: number };
  cuisine: string;
  priceRange: '$' | '$$' | '$$$' | '$$$$';
}
