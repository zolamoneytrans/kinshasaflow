import { z } from "zod";

export const trafficReportSchema = z.object({
  location: z.string().min(3, "Location is too short."),
  description: z.string().min(10, "Description is too short."),
  severity: z.enum(["low", "medium", "high"]),
});

export type TrafficReport = z.infer<typeof trafficReportSchema>;

// Dummy data for now
export const dummyReports: (TrafficReport & { id: number, time: string })[] = [
    {
        id: 1,
        location: "Rond-point Victoire",
        description: "Heavy congestion due to market day.",
        severity: "high",
        time: "10m ago",
    },
    {
        id: 2,
        location: "Boulevard du 30 Juin",
        description: "Accident involving a truck. Road partially blocked.",
        severity: "high",
        time: "25m ago",
    },
    {
        id: 3,
        location: "Avenue Kasa-Vubu",
        description: "Fluid traffic, moving well.",
        severity: "low",
        time: "5m ago",
    },
    {
        id: 4,
        location: "Pont Matete",
        description: "Moderate slowdown, usual rush hour traffic.",
        severity: "medium",
        time: "15m ago",
    },
    {
        id: 5,
        location: "Avenue de la Libération",
        description: "Public event causing road closures around the Palais du Peuple.",
        severity: "high",
        time: "45m ago",
    },
    {
        id: 6,
        location: "Marché Central",
        description: "Extreme congestion due to delivery trucks and high pedestrian activity.",
        severity: "high",
        time: "1h ago",
    },
    {
        id: 7,
        location: "Gombe, near a major embassy",
        description: "Security checkpoint causing slow-moving traffic.",
        severity: "medium",
        time: "1h 30m ago",
    },
    {
        id: 8,
        location: "UPN",
        description: "Student gathering causing local disruption.",
        severity: "medium",
        time: "2h ago",
    },
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
