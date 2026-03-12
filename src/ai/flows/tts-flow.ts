'use server';
/**
 * @fileOverview A Text-To-Speech (TTS) flow for the AI Assistant.
 *
 * - generateSpeech - A function that converts text to speech data URI.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
// @ts-ignore - wav doesn't have official types and can block the build
import wav from 'wav';

const TTSInputSchema = z.string();
const TTSOutputSchema = z.object({
  media: z.string().describe('The generated audio as a data URI.'),
});

export type TTSInput = z.infer<typeof TTSInputSchema>;
export type TTSOutput = z.infer<typeof TTSOutputSchema>;

export async function generateSpeech(text: string): Promise<TTSOutput> {
  return generateSpeechFlow(text);
}

const generateSpeechFlow = ai.defineFlow(
  {
    name: 'generateSpeechFlow',
    inputSchema: TTSInputSchema,
    outputSchema: TTSOutputSchema,
  },
  async (text) => {
    // Sanitize and limit text length to avoid model errors
    const sanitizedText = text.substring(0, 1000).trim();
    if (!sanitizedText) {
      throw new Error('Le texte à convertir est vide.');
    }

    try {
      // Use the specific TTS model from Google AI with explicit modalities
      const response = await ai.generate({
        model: 'googleai/gemini-2.5-flash-preview-tts',
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Algenib' },
            },
          },
        },
        prompt: sanitizedText,
      });

      // Try multiple ways to find the media in the response
      let media = response.media;
      
      if (!media) {
        // Search in the output content parts if shortcut property is missing
        const mediaPart = response.output?.message?.content.find((p) => !!p.media);
        media = mediaPart?.media;
      }

      if (!media || !media.url) {
        console.error('TTS Model did not return media. Full response info available in Genkit logs.');
        throw new Error('Le modèle n\'a pas retourné de média audio. Cela peut être dû à des limites de quota ou à un filtrage de contenu.');
      }

      // Convert PCM to WAV format
      // Expected format: 'data:audio/pcm;base64,<data>'
      const commaIndex = media.url.indexOf(',');
      if (commaIndex === -1) {
        throw new Error('Format de données audio invalide reçu du modèle.');
      }

      const base64Data = media.url.substring(commaIndex + 1);
      const audioBuffer = Buffer.from(base64Data, 'base64');
      
      const wavBase64 = await toWav(audioBuffer);

      return {
        media: 'data:audio/wav;base64,' + wavBase64,
      };
    } catch (error: any) {
      console.error('Erreur dans le flow generateSpeech:', error);
      throw new Error(`Échec de la génération vocale: ${error.message}`);
    }
  }
);

async function toWav(
  pcmData: Buffer,
  channels = 1,
  rate = 24000,
  sampleWidth = 2
): Promise<string> {
  return new Promise((resolve, reject) => {
    const writer = new wav.Writer({
      channels,
      sampleRate: rate,
      bitDepth: sampleWidth * 8,
    });

    let bufs = [] as Buffer[];
    writer.on('error', reject);
    writer.on('data', (d: Buffer) => {
      bufs.push(d);
    });
    writer.on('end', () => {
      resolve(Buffer.concat(bufs).toString('base64'));
    });

    writer.write(pcmData);
    writer.end();
  });
}
