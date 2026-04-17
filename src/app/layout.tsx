import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { FirebaseClientProvider } from '@/firebase';

export const metadata: Metadata = {
  metadataBase: new URL('https://kinshasaflow.online'),
  title: {
    default: 'Kinshasa Flow - Trafic en Temps Réel et Mobilité à Kinshasa',
    template: '%s | Kinshasa Flow',
  },
  description: "Évitez les embouteillages à Kinshasa. Rapports de trafic en direct, navigation GPS intelligente K-Flow, alertes de police, solutions de transport et logements RBNB en RDC.",
  keywords: [
    'Kinshasa', 'trafic Kinshasa', 'embouteillage Kinshasa', 'RDC', 'Congo', 
    'transport Kinshasa', 'location voiture Kinshasa', 'logement Kinshasa', 
    'route Kinshasa', 'navigation GPS RDC', 'assistant IA Lingala', 
    'nzela Kinshasa', 'bouchon Kinshasa', 'alerte police Kinshasa'
  ],
  authors: [{ name: 'Swazi Appli Lab sarl' }],
  creator: 'Swazi Appli Lab sarl',
  alternates: {
    canonical: '/',
    languages: {
      'fr-FR': '/',
    },
  },
  openGraph: {
    type: 'website',
    locale: 'fr_FR',
    url: 'https://kinshasaflow.online',
    siteName: 'Kinshasa Flow',
    title: 'Kinshasa Flow - Votre copilote sur les routes de Kinshasa',
    description: 'Évitez les embouteillages à Kinshasa grâce à nos rapports en temps réel et notre assistant IA intelligent.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Kinshasa Flow - Navigation et Trafic',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Kinshasa Flow - Naviguez Kinshasa sans stress',
    description: 'La première application de navigation intelligente dédiée à la ville de Kinshasa.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/icon.svg',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    "name": "Kinshasa Flow",
    "operatingSystem": "Android, iOS, Web",
    "applicationCategory": "TravelApplication, NavigationApplication",
    "description": "Application de gestion de trafic et de mobilité pour la ville de Kinshasa, RDC.",
    "aggregateRating": {
      "@type": "AggregateRating",
      "ratingValue": "4.8",
      "ratingCount": "1250"
    },
    "offers": {
      "@type": "Offer",
      "price": "0",
      "priceCurrency": "USD"
    }
  };

  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <meta name="application-name" content="Kinshasa Flow" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Kinshasa Flow" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#248eeb" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="theme-color" content="#f7f9fb" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var handleError = function(e) {
                  var error = e.error || e.reason || e;
                  var msg = error && (error.message || error.toString()) || "";
                  if (msg.indexOf("Loading chunk") > -1 || msg.indexOf("ChunkLoadError") > -1 || msg.indexOf("timeout") > -1) {
                    console.warn("Problème de module détecté, rechargement de sécurité...");
                    var lastReload = sessionStorage.getItem("last-chunk-reload");
                    var now = Date.now();
                    if (!lastReload || (now - parseInt(lastReload)) > 5000) {
                      sessionStorage.setItem("last-chunk-reload", now);
                      window.location.reload();
                    }
                  }
                };
                window.addEventListener("error", handleError, true);
                window.addEventListener("unhandledrejection", handleError);
              })();
            `,
          }}
        />
      </head>
      <body className="font-body antialiased">
        <FirebaseClientProvider>
          {children}
        </FirebaseClientProvider>
        <Toaster />
      </body>
    </html>
  );
}
