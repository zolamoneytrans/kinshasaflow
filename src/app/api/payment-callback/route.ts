
import { NextResponse } from 'next/server';

/**
 * Route pour recevoir les notifications de paiement (webhooks) de MbiyoPay.
 * Note: En production, cette route devrait vérifier la signature et mettre à jour Firestore.
 */
export async function POST(request: Request) {
  try {
    const payload = await request.json();
    console.log('MbiyoPay Callback Received:', payload);

    // TODO: Implémenter la logique de validation et de crédit final ici
    // reference: payload.reference
    // status: payload.status (success/failed)

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (error) {
    console.error('Error processing MbiyoPay callback:', error);
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }
}
