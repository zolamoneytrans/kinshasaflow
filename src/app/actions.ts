"use server";

import { verifyUploadedPhoto } from "@/ai/flows/verify-uploaded-photo";

export async function verifyPhotoAction(photoDataUri: string): Promise<{
  success: boolean;
  message: string;
}> {
  if (!photoDataUri) {
    return { success: false, message: "No photo data provided." };
  }

  try {
    const result = await verifyUploadedPhoto({ photoDataUri });
    
    if (!result.containsFace) {
      return { success: false, message: "No face detected in the photo. Please upload a clear picture of a face." };
    }
    
    if (!result.isClear) {
      return { success: false, message: "The face in the photo is not clear. Please use a photo that is in focus and not obstructed." };
    }

    return { success: true, message: "Photo verified successfully!" };

  } catch (error) {
    console.error("Error verifying photo:", error);
    return { success: false, message: "An unexpected error occurred during photo verification." };
  }
}
