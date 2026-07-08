# Kinshasa Flow - Guide de Déploiement iOS (Signature Automatique Native)

L'application est configurée pour utiliser la **Signature Automatique de Codemagic** via l'intégration App Store Connect.

## 🚀 CONFIGURATION DANS CODEMAGIC

Pour que le build réussisse, assurez-vous que les éléments suivants sont configurés :

1.  **Intégration App Store Connect** :
    *   Allez dans **User Settings** (en bas à gauche) > **Integrations**.
    *   Connectez votre clé API App Store Connect (Issuer ID, Key ID, API Key).
    *   Nommez cette intégration `app_store`.

2.  **Groupe de variables** :
    *   Créez un groupe nommé `app_store_credentials` dans votre projet.
    *   Assurez-vous que l'intégration Apple Store Connect est active pour ce workflow.

3.  **Signature Automatique** :
    *   Le fichier `codemagic.yaml` utilise maintenant la section `ios_signing` pour gérer automatiquement les certificats et les profils.
    *   Aucun script de signature manuel n'est requis dans la section `scripts`.

Faites un `git push origin main` pour déclencher le build automatique. Codemagic créera les certificats et profils nécessaires sur votre compte Apple et publiera l'IPA sur TestFlight.

---
Développé par Swazi Appli Lab sarl.