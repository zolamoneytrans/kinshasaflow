
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
} as const;

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
});
export type UserProfile = z.infer<typeof userProfileSchema>;

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
  createdAt: z.instanceof(Timestamp).or(z.any()), // Allow server timestamp
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
  createdAt: z.instanceof(Timestamp).or(z.any()), // Allow server timestamp
});
export type EventReport = z.infer<typeof eventReportSchema>;

// For client-side form validation which doesn't have server timestamps yet
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


// Schemas for AI flow
export const TrafficTipsInputSchema = z.object({
  location: z.string().describe("Le lieu de l'incident de la circulation à Kinshasa."),
  description: z.string().describe("Une description de l'incident de la circulation."),
});
export type TrafficTipsInput = z.infer<typeof TrafficTipsInputSchema>;

export const TrafficTipsOutputSchema = z.object({
  tips: z.array(z.string()).describe("Une liste de conseils pratiques pour éviter les embouteillages."),
});
export type TrafficTipsOutput = z.infer<typeof TrafficTipsOutputSchema>;

// Schemas for AI Assistant Flow
export const AssistantInputSchema = z.object({
  question: z.string().describe("The user's question about a route in Kinshasa."),
});
export type AssistantInput = z.infer<typeof AssistantInputSchema>;

export const AssistantOutputSchema = z.object({
  answer: z.string().describe("The AI assistant's answer in French or Lingala."),
});
export type AssistantOutput = z.infer<typeof AssistantOutputSchema>;


// Schema for Announcements
export const annonceSchema = z.object({
  title: z.string().min(5, "Le titre doit comporter au moins 5 caractères."),
  content: z.string().min(10, "Le contenu doit comporter au moins 10 caractères."),
  source: z.string().min(3, "La source doit comporter au moins 3 caractères."),
  createdAt: z.instanceof(Timestamp).or(z.any()), // Allow server timestamp
});
export type Annonce = z.infer<typeof annonceSchema>;

export const annonceFormSchema = z.object({
    title: z.string().min(5, "Le titre doit faire au moins 5 caractères."),
    content: z.string().min(10, "Le contenu doit faire au moins 10 caractères."),
    source: z.string().min(3, "La source doit faire au moins 3 caractères."),
});
export type AnnonceFormValues = z.infer<typeof annonceFormSchema>;


// Dummy data for components that haven't been migrated to Firebase yet
export const policeReportSchema = z.object({
  location: z.string(),
  note: z.string(),
  type: z.enum(['control', 'traffic_management', 'incident']),
});
export type PoliceReport = z.infer<typeof policeReportSchema>;
export const dummyPoliceReports: (PoliceReport & { id: number, time: string })[] = [
    { id: 1, location: "Rond-point Victoire", note: "Contrôle de routine des documents.", type: "control", time: "il y a 15m" },
    { id: 2, location: "Boulevard du 30 Juin", note: "Gestion du trafic suite à un événement.", type: "traffic_management", time: "il y a 30m" },
    { id: 3, location: "Pont Matete", note: "Présence renforcée pour la sécurité.", type: "control", time: "il y a 5m" },
    { id: 4, location: "Avenue Kasa-Vubu", note: "Intervention suite à un petit accrochage.", type: "incident", time: "il y a 45m" },
    { id: 5, location: "Gombe, près de l'Hôtel de Ville", note: "Escorte d'un convoi officiel.", type: "traffic_management", time: "il y a 1h" },
    { id: 6, location: "Limete, 7ème Rue", note: "Contrôle de vitesse.", type: "control", time: "il y a 20m" },
    { id: 7, location: "UPN", note: "Présence préventive.", type: "control", time: "il y a 2h" },
    { id: 8, location: "Marché Central", note: "Patrouille pour la sécurité des commerçants.", type: "control", time: "il y a 1h 15m" },
];

export const trafficReportSchema = z.object({
  location: z.string().min(3, "Location is too short."),
  description: z.string().min(10, "Description is too short."),
  severity: z.enum(["low", "medium", "high"]),
});
export type TrafficReport = z.infer<typeof trafficReportSchema>;

// Schemas for Auth
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

// Schema for Videos to be stored in Firestore
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

// New schema for the upload form
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

// Schema for Logement
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

// Schema for the Add Logement form
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

// Schema for the Edit Logement form
export const editLogementFormSchema = z.object({
  title: z.string().min(5, "Le titre doit comporter au moins 5 caractères."),
  description: z.string().min(20, "La description doit être plus détaillée."),
  address: z.string().min(10, "L'adresse doit être plus précise."),
  pricePerMonth: z.coerce.number().positive("Le prix doit être un nombre positif."),
  amenities: z.string().min(3, "Veuillez lister quelques commodités."),
});
export type EditLogementFormValues = z.infer<typeof editLogementFormSchema>;

// Schema for Transport Subscription Form
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

// Schema for Transport Subscription document in Firestore
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


// Custom error for Firestore permissions, to be used with the global error handler
export { FirestorePermissionError } from '@/firebase/errors';

// Schema for Logement Application
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

// Schema for Inquiry
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

// Schema for Car Booking
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

// Schema for Police Station
export const policeStationSchema = z.object({
  commune: z.string(),
  name: z.string(),
  phone: z.string(),
  address: z.string(),
});
export type PoliceStation = z.infer<typeof policeStationSchema>;
