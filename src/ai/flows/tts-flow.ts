'use server';
/**
 * @fileOverview Un flow de Text-To-Speech pour l'Assistant Vocal K-Flow.
 * 
 * - generateSpeech - Convertit le texte de l'assistant en fichier audio WAV.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';
// @ts-ignore
import wav from 'wav';

const TTSInputSchema = z.string();
const TTSOutputSchema = z.object({
  media: z.string().describe('Audio généré au format data URI (base64).'),
});

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
    const cleanText = text.substring(0, 800).trim();
    if (!cleanText) throw new Error('Texte vide.');

    try {
      const response = await ai.generate({
        model: 'googleai/gemini-2.5-flash-preview-tts',
        config: {
          responseModalities: ['AUDIO'],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName: 'Algenib' }, // Voix claire et posée
            },
          },
        },
        prompt: cleanText,
      });

      let media = response.media;
      if (!media) {
        const mediaPart = response.output?.message?.content.find((p: any) => !!p.media);
        media = mediaPart?.media;
      }

      if (!media || !media.url) {
        throw new Error('Le modèle TTS n\'a pas retourné d\'audio.');
      }

      const commaIndex = media.url.indexOf(',');
      const base64Data = media.url.substring(commaIndex + 1);
      const audioBuffer = Buffer.from(base64Data, 'base64');
      
      const wavBase64 = await toWav(audioBuffer);

      return {
        media: 'data:audio/wav;base64,' + wavBase64,
      };
    } catch (error: any) {
      console.error('Erreur TTS:', error);
      throw new Error(`Échec vocal: ${error.message}`);
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
    writer.on('data', (d: Buffer) => bufs.push(d));
    writer.on('end', () => resolve(Buffer.concat(bufs).toString('base64')));

    writer.write(pcmData);
    writer.end();
  });
}
