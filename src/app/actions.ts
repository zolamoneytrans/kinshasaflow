"use server";

import { getTrafficTips } from "@/ai/flows/traffic-tips-flow";
import { TrafficTipsInput } from "@/lib/types";

export async function getTrafficTipsAction(input: TrafficTipsInput) {
    return await getTrafficTips(input);
}
