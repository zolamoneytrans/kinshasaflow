
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
  REPORT_HAZARD_REWARD: 10,
} as const;

// App Navigation Features
export const navFeatures = [
  'reports', 'liveTraffic', 'localTraffic', 'map', 'hazardMap', 'assistant', 'notifications', 'myStars', 'report', 'police', 
  'routes', 'announcements', 'logement', 'transport', 'carRental', 'tourism', 
  'events', 'videos', 'kinshasa', 'restaurants', 'contact', 'share', 'fluxInfrastructure', 'kFlowNav', 'insights'
] as const;
export type NavFeature = typeof navFeatures[number];

export const appNavigationSettingsSchema = z.object({
  reports: z.boolean().default(true),
  liveTraffic: z.boolean().default(true),
  localTraffic: z.boolean().default(true),
  map: z.boolean().default(true),
  hazardMap: z.boolean().default(true),
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

// Road Condition Reports
export const roadConditionTypeSchema = z.enum(["pothole", "blockage", "police", "damaged_road"]);
export type RoadConditionType = z.infer<typeof roadConditionTypeSchema>;

export const roadConditionReportSchema = z.object({
  id: z.string(),
  userId: z.string(),
  userName: z.string(),
  type: roadConditionTypeSchema,
  description: z.string(),
  imageUrl: z.string().optional(),
  locationName: z.string(),
  coords: z.object({
    lat: z.number(),
    lng: z.number()
  }),
  votes: z.number().default(0),
  status: z.enum(["active", "expired"]).default("active"),
  createdAt: z.instanceof(Timestamp).or(z.any()),
});
export type RoadConditionReport = z.infer<typeof roadConditionReportSchema>;

export const reportHazardFormSchema = z.object({
  type: roadConditionTypeSchema,
  description: z.string().min(5, "Description trop courte"),
  image: z.any().optional(),
});
export type ReportHazardFormValues = z.infer<typeof reportHazardFormSchema>;

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

// ... rest of the existing types from src/lib/types.ts
export type WithId<T> = T & { id: string };
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
