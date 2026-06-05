# Kinshasa Flow - iOS Deployment Guide

Cette application est configurée pour être déployée sur l'App Store via GitHub Actions, ce qui permet de construire le paquet iOS (`.ipa`) sans posséder de Mac.

## Configuration GitHub (Obligatoire)

Pour que l'upload automatique fonctionne, vous devez ajouter les secrets suivants dans votre dépôt GitHub (`Settings > Secrets and variables > Actions`) :

1.  **APPLE_CERTIFICATE_P12** : Votre certificat de distribution Apple (exporté de Trousseau d'accès au format `.p12`) encodé en base64.
2.  **APPLE_CERTIFICATE_PASSWORD** : Le mot de passe que vous avez défini lors de l'exportation du certificat `.p12`.
3.  **APPLE_ISSUER_ID** : L'ID de l'émetteur visible sur App Store Connect > Utilisateurs et accès > Clés.
4.  **APPLE_API_KEY_ID** : L'ID de la clé d'API générée sur App Store Connect.
5.  **APPLE_API_KEY_CONTENT** : Le contenu textuel complet du fichier `.p8` téléchargé lors de la création de la clé.

## Flux de travail

1.  **Push** : Dès que vous poussez votre code sur la branche `main` de GitHub, le workflow démarre.
2.  **Build Cloud** : GitHub Actions installe les dépendances, construit l'application Next.js et génère le projet natif iOS.
3.  **Sign & Upload** : Le système signe l'application avec vos certificats et l'envoie sur **TestFlight** ou l'**App Store**.

## Structure Native (Capacitor)

L'application iOS fonctionne comme un "Live Wrapper" pointant vers `https://kinshasaflow.online`. Cela garantit que toutes les fonctionnalités d'IA (Genkit) et de base de données (Firebase) fonctionnent en temps réel sans latence.

---
Développé par Swazi Appli Lab sarl.
