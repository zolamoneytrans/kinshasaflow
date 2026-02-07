import { z } from "zod";
import { Timestamp } from "firebase/firestore";

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


// New schema for Announcements
export const annonceSchema = z.object({
  id: z.number(),
  title: z.string(),
  content: z.string(),
  publishedAt: z.string(),
  source: z.string(),
});
export type Annonce = z.infer<typeof annonceSchema>;

export const dummyAnnouncements: Annonce[] = [
  {
    id: 1,
    title: 'Nouvelles régulations sur le stationnement au centre-ville',
    content: "À partir du 1er septembre, de nouvelles zones de stationnement payant seront mises en place dans la commune de la Gombe pour désengorger les artères principales. Les résidents peuvent demander des vignettes à tarif préférentiel.",
    publishedAt: "2024-08-15",
    source: "Hôtel de Ville de Kinshasa"
  },
  {
    id: 2,
    title: 'Fermeture temporaire du Boulevard Lumumba pour travaux',
    content: "Le tronçon du Boulevard Lumumba entre la 1ère et la 7ème rue Limete sera fermé à la circulation du 20 au 25 août pour des travaux de réfection de la chaussée. Des déviations seront mises en place par les avenues environnantes.",
    publishedAt: "2024-08-12",
    source: "Ministère des Infrastructures et Travaux Publics"
  },
  {
    id: 3,
    title: 'Campagne de contrôle technique obligatoire pour les taxis',
    content: "Tous les véhicules à usage de taxi sont priés de se présenter pour un contrôle technique obligatoire avant le 30 septembre. Les véhicules non conformes seront immobilisés.",
    publishedAt: "2024-08-10",
    source: "Police de Circulation Routière (PCR)"
  },
  {
    id: 4,
    title: 'Introduction de nouvelles plaques d\'immatriculation',
    content: "Le programme de remplacement des plaques d'immatriculation débutera en octobre. Les modalités de remplacement seront communiquées prochainement. Les anciennes plaques resteront valides pendant une période de transition de 6 mois.",
    publishedAt: "2024-08-05",
    source: "Direction Générale des Impôts (DGI)"
  },
  {
    id: 5,
    title: 'Journée sans voiture prévue pour le centre-ville',
    content: "Dans le cadre de la semaine de la mobilité, la commune de la Gombe sera entièrement piétonne le dimanche 22 septembre. Seuls les véhicules d'urgence et de transport en commun seront autorisés.",
    publishedAt: "2024-09-01",
    source: "Hôtel de Ville de Kinshasa"
  },
  {
    id: 6,
    title: "Mise en place de radars de vitesse sur le Boulevard Lumumba",
    content: "De nouveaux radars automatiques seront activés à partir du 15 septembre sur plusieurs sections du Boulevard Lumumba pour lutter contre les excès de vitesse. La tolérance sera de 10 km/h au-dessus de la limite autorisée.",
    publishedAt: "2024-09-03",
    source: "Commission Nationale de Prévention Routière"
  },
  {
    id: 7,
    title: "Interdiction de circulation des poids lourds en journée",
    content: "Pour fluidifier le trafic, la circulation des camions de plus de 10 tonnes sera interdite de 6h à 20h dans le centre-ville à compter du 1er octobre. Des zones de transit et de déchargement nocturne sont à l'étude.",
    publishedAt: "2024-09-05",
    source: "Ministère des Transports"
  },
  {
    id: 8,
    title: "Réaménagement du rond-point Victoire",
    content: "Des travaux de réaménagement du rond-point Victoire débuteront le 10 septembre pour une durée estimée de 3 mois. La circulation sera fortement perturbée. Il est conseillé d'éviter le secteur.",
    publishedAt: "2024-09-02",
    source: "Ministère des Infrastructures et Travaux Publics"
  },
  {
    id: 9,
    title: "Application mobile pour le paiement des vignettes",
    content: "Une nouvelle application mobile sera lancée fin septembre pour permettre le paiement dématérialisé de la vignette automobile, évitant ainsi les longues files d'attente aux guichets de la DGI.",
    publishedAt: "2024-08-28",
    source: "Direction Générale des Impôts (DGI)"
  },
  {
    id: 10,
    title: "Sensibilisation au respect des passages pour piétons",
    content: "La PCR lance une grande campagne de sensibilisation 'Priorité Piéton'. Des contrôles renforcés auront lieu aux abords des écoles et des marchés pour sanctionner le non-respect des passages cloutés.",
    publishedAt: "2024-08-25",
    source: "Police de Circulation Routière (PCR)"
  }
];


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
export const dummyReports: (TrafficReport & { id: number, time: string })[] = [
    { id: 1, location: "Rond-point Victoire", description: "Forte congestion due à la journée de marché.", severity: "high", time: "il y a 10m" },
    { id: 2, location: "Boulevard du 30 Juin", description: "Accident impliquant un camion. Route partiellement bloquée.", severity: "high", time: "il y a 25m" },
    { id: 3, location: "Avenue Kasa-Vubu", description: "Trafic fluide, bonne circulation.", severity: "low", time: "il y a 5m" },
    { id: 4, location: "Pont Matete", description: "Ralentissement modéré, trafic habituel des heures de pointe.", severity: "medium", time: "il y a 15m" },
    { id: 5, location: "Avenue de la Libération", description: "Événement public entraînant des fermetures de routes autour du Palais du Peuple.", severity: "high", time: "il y a 45m" },
    { id: 6, location: "Marché Central", description: "Congestion extrême due aux camions de livraison et à la forte activité piétonne.", severity: "high", time: "il y a 1h" },
    { id: 7, location: "Gombe, près d'une grande ambassade", description: "Poste de contrôle de sécurité provoquant un ralentissement du trafic.", severity: "medium", time: "il y a 1h 30m" },
    { id: 8, location: "UPN", description: "Rassemblement d'étudiants provoquant des perturbations locales.", severity: "medium", time: "il y a 2h" },
    { id: 9, location: "Ngaliema, Cité Verte", description: "Travaux routiers entraînant une circulation sur une seule voie.", severity: "medium", time: "il y a 30m" },
    { id: 10, location: "Avenue de l'Université", description: "Dysfonctionnement des feux de circulation à l'intersection.", severity: "medium", time: "il y a 50m" },
    { id: 11, location: "Place des Artistes", description: "Routes dégagées, aucun problème signalé.", severity: "low", time: "il y a 12m" },
    { id: 12, location: "Avenue des Huileries", description: "Bus en panne bloquant une voie.", severity: "medium", time: "il y a 1h 15m" },
    { id: 13, location: "Barumbu, 6ème Rue Limete", description: "Marché local débordant sur la rue.", severity: "medium", time: "il y a 2h 30m" },
    { id: 14, location: "Kintambo Magasin", description: "Trafic intense dû à l'heure de pointe.", severity: "high", time: "il y a 40m" },
    { id: 15, location: "Rond-point Ngaba", description: "Trafic très dense, presque à l'arrêt.", severity: "high", time: "il y a 55m" },
    { id: 16, location: "Avenue Pierre Mulele (ex-24)", description: "Marche de protestation, route complètement bloquée.", severity: "high", time: "il y a 1h 5m" },
    { id: 17, location: "Lemba, près de la Place de l'Echangeur", description: "Accrochage mineur, le trafic ralentit pour regarder.", severity: "low", time: "il y a 20m" },
    { id: 18, location: "Bandale, Avenue du Commerce", description: "Vendeurs ambulants causant une obstruction.", severity: "medium", time: "il y a 3h" },
    { id: 19, location: "Matonge, Place de la Victoire", description: "Le trafic nocturne commence à s'intensifier.", severity: "medium", time: "il y a 35m" },
    { id: 20, location: "Avenue de la Démocratie (ex-Huileries)", description: "Le trafic est étonnamment fluide pour cette heure.", severity: "low", time: "il y a 8m" },
    { id: 21, location: "N'djili, Quartier 7", description: "Inondations après de fortes pluies, certaines routes impraticables.", severity: "high", time: "il y a 1h 40m" },
    { id: 22, location: "Mont-Ngafula, près de Mimosas", description: "Glissement de terrain signalé sur une route secondaire.", severity: "high", time: "il y a 4h" },
    { id: 23, location: "Selembao, près de l'Hôpital Roi Baudouin", description: "Circulation d'ambulances, cédez le passage.", severity: "low", time: "il y a 18m" },
    { id: 24, location: "Limete Industriel", description: "Camions entrant et sortant des usines, attendez-vous à des retards.", severity: "medium", time: "il y a 1h 10m" },
    { id: 25, location: "Boulevard Lumumba, Debonhomme", description: "Passage piéton très fréquenté, conduisez avec prudence.", severity: "medium", time: "il y a 48m" },
    { id: 26, location: "Masina, Pascal", description: "Projet de réhabilitation de la route démarré.", severity: "medium", time: "hier" },
    { id: 27, location: "Lingwala, près d'un bâtiment gouvernemental", description: "Cortège officiel attendu, blocage temporaire.", severity: "medium", time: "planifié" },
    { id: 28, location: "Kalamu, Yolo-Sud", description: "Conditions de circulation normales pour cette zone.", severity: "low", time: "il y a 3m" },
    { id: 29, location: "Rond-point Mandela", description: "Les feux de circulation sont en panne, la police règle la circulation.", severity: "medium", time: "il y a 1h" },
    { id: 30, location: "Binza, près de l'Ozone", description: "Le trafic est fluide.", severity: "low", time: "il y a 22m" },
    { id: 31, location: "Pont Kasa-Vubu", description: "Inspection structurelle entraînant des fermetures de voies.", severity: "high", time: "il y a 3h 15m" },
    { id: 32, location: "Avenue de l'Enseignement", description: "Heure de sortie des écoles, attendez-vous à des embouteillages.", severity: "medium", time: "il y a 5m" },
    { id: 33, location: "Kingasani, Ya Suka", description: "Congestion de taxis-motos au carrefour principal.", severity: "medium", time: "il y a 28m" },
    { id: 34, location: "Gare Centrale", description: "Arrivée du train, afflux de piétons et de taxis.", severity: "medium", time: "il y a 14m" },
    { id: 35, location: "Avenue des Poids Lourds", description: "Conteneur renversé, des retards importants sont à prévoir toute la journée.", severity: "high", time: "il y a 5h" },
    { id: 36, location: "N'sele, près de la sortie de la route de l'aéroport", description: "Mouvement VIP, brèves interruptions de la circulation.", severity: "low", time: "il y a 40m" },
    { id: 37, location: "Avenue du Tourisme", description: "Trafic léger, la route panoramique est dégagée.", severity: "low", time: "il y a 9m" },
    { id: 38, location: "Kimbanseke, Mokali", description: "Mauvais état des routes provoquant des ralentissements importants.", severity: "medium", time: "il y a 2h" },
    { id: 39, location: "Place de la Gare", description: "Dépôt de taxis et de bus extrêmement fréquenté.", severity: "high", time: "il y a 1h 20m" },
    { id: 40, location: "Avenue Nguma, Makala", description: "Rupture d'une conduite d'eau, chaussée endommagée.", severity: "high", time: "il y a 6h" },
    { id: 41, location: "Rond-Point Kimpwanza", description: "Tout est bloqué. À éviter à tout prix.", severity: "high", time: "il y a 1h" },
    { id: 42, location: "Croisement des Avenues des Forces Armées et Libération", description: "Problème de synchronisation des feux de circulation.", severity: "medium", time: "il y a 1h 25m" },
    { id: 43, location: "Camp Luka", description: "Poste de contrôle militaire plus actif que d'habitude.", severity: "medium", time: "il y a 2h 5m" },
    { id: 44, location: "Avenue de la Science, Gombe", description: "Aucun problème significatif, le trafic est fluide.", severity: "low", time: "il y a 7m" },
    { id: 45, location: "Malueka, près du péage", description: "File d'attente pour le paiement du péage provoquant un embouteillage.", severity: "medium", time: "il y a 33m" },
    { id: 46, location: "Avenue du Port", description: "Opérations portuaires provoquant la congestion des camions.", severity: "medium", time: "il y a 3h 30m" },
    { id: 47, location: "Route de Matadi, Kinsuka", description: "Les nids-de-poule s'aggravent, ralentissant tout le monde.", severity: "medium", time: "il y a 4h" },
    { id: 48, location: "Stade des Martyrs", description: "Fin de concert, attendez-vous à de forts ralentissements.", severity: "high", time: "il y a 30m" },
    { id: 49, location: "Avenue de la Justice", description: "Zone du palais de justice très fréquentée, stationnement limité.", severity: "low", time: "il y a 1h 50m" },
    { id: 50, location: "Triangle de la Cité", description: "Circulation fluide, mieux que prévu.", severity: "low", time: "il y a 19m" },
];

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
