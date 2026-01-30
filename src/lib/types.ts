import { z } from "zod";

export const trafficReportSchema = z.object({
  location: z.string().min(3, "Location is too short."),
  description: z.string().min(10, "Description is too short."),
  severity: z.enum(["low", "medium", "high"]),
});

export type TrafficReport = z.infer<typeof trafficReportSchema>;

// Dummy data for now
export const dummyReports: (TrafficReport & { id: number, time: string })[] = [
    { id: 1, location: "Rond-point Victoire", description: "Heavy congestion due to market day.", severity: "high", time: "10m ago" },
    { id: 2, location: "Boulevard du 30 Juin", description: "Accident involving a truck. Road partially blocked.", severity: "high", time: "25m ago" },
    { id: 3, location: "Avenue Kasa-Vubu", description: "Fluid traffic, moving well.", severity: "low", time: "5m ago" },
    { id: 4, location: "Pont Matete", description: "Moderate slowdown, usual rush hour traffic.", severity: "medium", time: "15m ago" },
    { id: 5, location: "Avenue de la Libération", description: "Public event causing road closures around the Palais du Peuple.", severity: "high", time: "45m ago" },
    { id: 6, location: "Marché Central", description: "Extreme congestion due to delivery trucks and high pedestrian activity.", severity: "high", time: "1h ago" },
    { id: 7, location: "Gombe, near a major embassy", description: "Security checkpoint causing slow-moving traffic.", severity: "medium", time: "1h 30m ago" },
    { id: 8, location: "UPN", description: "Student gathering causing local disruption.", severity: "medium", time: "2h ago" },
    { id: 9, location: "Ngaliema, Cité Verte", description: "Roadwork causing single-lane traffic.", severity: "medium", time: "30m ago" },
    { id: 10, location: "Avenue de l'Université", description: "Traffic light malfunction at intersection.", severity: "medium", time: "50m ago" },
    { id: 11, location: "Place des Artistes", description: "Clear roads, no issues reported.", severity: "low", time: "12m ago" },
    { id: 12, location: "Avenue des Huileries", description: "Broken down bus blocking one lane.", severity: "medium", time: "1h 15m ago" },
    { id: 13, location: "Barumbu, 6ème Rue Limete", description: "Local market overflowing onto the street.", severity: "medium", time: "2h 30m ago" },
    { id: 14, location: "Kintambo Magasin", description: "Heavy traffic due to rush hour.", severity: "high", time: "40m ago" },
    { id: 15, location: "Rond-point Ngaba", description: "Very heavy traffic, almost at a standstill.", severity: "high", time: "55m ago" },
    { id: 16, location: "Avenue Pierre Mulele (ex-24)", description: "Protest march, road completely blocked.", severity: "high", time: "1h 5m ago" },
    { id: 17, location: "Lemba, near Place de l'Echangeur", description: "Minor fender bender, traffic slowing to look.", severity: "low", time: "20m ago" },
    { id: 18, location: "Bandale, Avenue du Commerce", description: "Street vendors causing obstruction.", severity: "medium", time: "3h ago" },
    { id: 19, location: "Matonge, Place de la Victoire", description: "Nightlife traffic starting to build up.", severity: "medium", time: "35m ago" },
    { id: 20, location: "Avenue de la Démocratie (ex-Huileries)", description: "Traffic flowing surprisingly well for this time.", severity: "low", time: "8m ago" },
    { id: 21, location: "N'djili, Quartier 7", description: "Flooding after heavy rain, some roads impassable.", severity: "high", time: "1h 40m ago" },
    { id: 22, location: "Mont-Ngafula, near Mimosas", description: "Landslide reported on a secondary road.", severity: "high", time: "4h ago" },
    { id: 23, location: "Selembao, near Hôpital Roi Baudouin", description: "Ambulance traffic, give way.", severity: "low", time: "18m ago" },
    { id: 24, location: "Limete Industriel", description: "Trucks entering and leaving factories, expect delays.", severity: "medium", time: "1h 10m ago" },
    { id: 25, location: "Boulevard Lumumba, Debonhomme", description: "Heavy pedestrian crossing, drive with caution.", severity: "medium", time: "48m ago" },
    { id: 26, location: "Masina, Pascal", description: "Road rehabilitation project started.", severity: "medium", time: "yesterday" },
    { id: 27, location: "Lingwala, near a government building", description: "Official motorcade expected, temporary blockage.", severity: "medium", time: "planning" },
    { id: 28, location: "Kalamu, Yolo-Sud", description: "Normal traffic conditions for this area.", severity: "low", time: "3m ago" },
    { id: 29, location: "Rond-point Mandela", description: "Traffic lights are out, police directing traffic.", severity: "medium", time: "1h ago" },
    { id: 30, location: "Binza, near Ozone", description: "Traffic moving smoothly.", severity: "low", time: "22m ago" },
    { id: 31, location: "Pont Kasa-Vubu", description: "Structural inspection causing lane closures.", severity: "high", time: "3h 15m ago" },
    { id: 32, location: "Avenue de l'Enseignement", description: "School pickup time, expect congestion.", severity: "medium", time: "5m ago" },
    { id: 33, location: "Kingasani, Ya Suka", description: "Motorcycle taxi congestion at main junction.", severity: "medium", time: "28m ago" },
    { id: 34, location: "Gare Centrale", description: "Train arrival, surge in pedestrians and taxis.", severity: "medium", time: "14m ago" },
    { id: 35, location: "Avenue des Poids Lourds", description: "Overturned container, major delays expected all day.", severity: "high", time: "5h ago" },
    { id: 36, location: "N'sele, near airport road turnoff", description: "VIP movement, brief holds on traffic.", severity: "low", time: "40m ago" },
    { id: 37, location: "Avenue du Tourisme", description: "Light traffic, scenic route is clear.", severity: "low", time: "9m ago" },
    { id: 38, location: "Kimbanseke, Mokali", description: "Poor road conditions causing significant slowdowns.", severity: "medium", time: "2h ago" },
    { id: 39, location: "Place de la Gare", description: "Taxi and bus depot extremely busy.", severity: "high", time: "1h 20m ago" },
    { id: 40, location: "Avenue Nguma, Makala", description: "Water pipe burst, road surface damaged.", severity: "high", time: "6h ago" },
    { id: 41, location: "Rond-Point Kimpwanza", description: "Everything is blocked. Avoid at all costs.", severity: "high", time: "1h ago" },
    { id: 42, location: "Croisement des Avenues des Forces Armées et Libération", description: "Traffic signal synchronization issue.", severity: "medium", time: "1h 25m ago" },
    { id: 43, location: "Camp Luka", description: "Military checkpoint more active than usual.", severity: "medium", time: "2h 5m ago" },
    { id: 44, location: "Avenue de la Science, Gombe", description: "No significant issues, traffic is fluid.", severity: "low", time: "7m ago" },
    { id: 45, location: "Malueka, near the toll booth", description: "Queue for toll payment causing backup.", severity: "medium", time: "33m ago" },
    { id: 46, location: "Avenue du Port", description: "Port operations causing truck congestion.", severity: "medium", time: "3h 30m ago" },
    { id: 47, location: "Route de Matadi, Kinsuka", description: "Potholes are getting worse, slowing everyone down.", severity: "medium", time: "4h ago" },
    { id: 48, location: "Stade des Martyrs", description: "Concert letting out, expect heavy delays.", severity: "high", time: "30m ago" },
    { id: 49, location: "Avenue de la Justice", description: "Courthouse area busy, limited parking.", severity: "low", time: "1h 50m ago" },
    { id: 50, location: "Triangle de la Cité", description: "Smooth sailing, better than expected.", severity: "low", time: "19m ago" },
];

export const TrafficTipsInputSchema = z.object({
  location: z.string().describe('The location of the traffic incident in Kinshasa.'),
  description: z.string().describe('A description of the traffic incident.'),
});
export type TrafficTipsInput = z.infer<typeof TrafficTipsInputSchema>;

export const TrafficTipsOutputSchema = z.object({
  tips: z.array(z.string()).describe('A list of actionable tips to avoid the traffic.'),
});
export type TrafficTipsOutput = z.infer<typeof TrafficTipsOutputSchema>;
