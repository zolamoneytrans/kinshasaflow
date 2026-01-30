'use server';

/**
 * @fileOverview A flow to verify that an uploaded photo contains a clear image of a face.
 *
 * - verifyUploadedPhoto - A function that handles the photo verification process.
 * - VerifyUploadedPhotoInput - The input type for the verifyUploadedPhoto function.
 * - VerifyUploadedPhotoOutput - The return type for the verifyUploadedPhoto function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const VerifyUploadedPhotoInputSchema = z.object({
  photoDataUri: z
    .string()
    .describe(
      'A photo of a person, as a data URI that must include a MIME type and use Base64 encoding. Expected format: \'data:<mimetype>;base64,<encoded_data>\'.' 
    ),
});
export type VerifyUploadedPhotoInput = z.infer<typeof VerifyUploadedPhotoInputSchema>;

const VerifyUploadedPhotoOutputSchema = z.object({
  containsFace: z.boolean().describe('Whether the photo contains a clear image of a face.'),
  isClear: z.boolean().describe('Whether the face in the photo is clear.'),
});
export type VerifyUploadedPhotoOutput = z.infer<typeof VerifyUploadedPhotoOutputSchema>;

export async function verifyUploadedPhoto(input: VerifyUploadedPhotoInput): Promise<VerifyUploadedPhotoOutput> {
  return verifyUploadedPhotoFlow(input);
}

const prompt = ai.definePrompt({
  name: 'verifyUploadedPhotoPrompt',
  input: {schema: VerifyUploadedPhotoInputSchema},
  output: {schema: VerifyUploadedPhotoOutputSchema},
  prompt: `You are an AI expert in image analysis. Your task is to verify if the uploaded photo contains a clear image of a face.

Analyze the following photo and determine if it contains a face and if the face is clear.

Photo: {{media url=photoDataUri}}

Consider these factors:
- Presence of a face: Is there a face visible in the photo?
- Clarity: Is the face in focus and easily recognizable?
- Obstruction: Is the face obstructed by any objects or is it only partially visible?

Based on your analysis, determine whether the photo contains a face and whether it is clear. Return the result as a JSON object.
`,
});

const verifyUploadedPhotoFlow = ai.defineFlow(
  {
    name: 'verifyUploadedPhotoFlow',
    inputSchema: VerifyUploadedPhotoInputSchema,
    outputSchema: VerifyUploadedPhotoOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
