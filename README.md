# Kinshasa Flow - Guide de Déploiement iOS (Signature Automatique Intégrale)

L'application est configurée pour utiliser la signature automatique de **Codemagic** via l'API App Store Connect. Codemagic gérera lui-même la création des certificats et des profils nécessaires.

## 🚀 CONFIGURATION DANS CODEMAGIC

Pour que le build réussisse sans action manuelle :

1.  **Vérification de l'intégration** :
    *   Assurez-vous que votre clé API App Store Connect est connectée globalement dans Codemagic.
    *   Le groupe de variables `app_store_credentials` doit être lié à votre workflow.

2.  **Fonctionnement du script** :
    *   La commande `app-store-connect fetch-signing-files` se connecte à Apple et crée les profils manquants pour le Bundle ID `app.kinshasaflow.online`.
    *   Le projet Xcode est automatiquement forcé en mode "Manual Signing" pour permettre l'injection des profils sur le serveur.

3.  **Lancer le build** :
    *   Faites un `git push origin main`.
    *   Codemagic téléchargera tout le nécessaire depuis Apple Store Connect, signera l'IPA et l'enverra sur TestFlight.

---
Développé par Swazi Appli Lab sarl.