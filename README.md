# Kinshasa Flow - Guide de Déploiement iOS (Signature Automatique Intégrale)

L'application est configurée pour utiliser la **Signature Automatique de Codemagic** via l'API App Store Connect.

## 🚀 CONFIGURATION DANS CODEMAGIC

Pour que le build réussisse, assurez-vous que les éléments suivants sont configurés :

1.  **Intégration App Store Connect** :
    *   Allez dans **User Settings** (en bas à gauche) > **Integrations**.
    *   Connectez votre clé API App Store Connect (Issuer ID, Key ID, API Key).
    *   Nommez cette intégration `app_store`.

2.  **Groupe de variables** :
    *   Créez un groupe nommé `app_store_credentials` dans votre projet.
    *   Ajoutez votre certificat de distribution `.p12` dans ce groupe sous le nom `CM_CERTIFICATE` (Type: **File**).
    *   Ajoutez le mot de passe du certificat sous le nom `CM_CERTIFICATE_PASSWORD` (Type: **Variable**).

3.  **Signature Automatique** :
    *   Le script utilise maintenant `app-store-connect fetch-signing-files` avec l'option `--create`. 
    *   Codemagic créera ou récupérera automatiquement le profil de provisionnement et le certificat sur votre compte Apple.

Faites un `git push origin main` pour déclencher le build. Codemagic s'occupera de la signature et publiera l'IPA sur TestFlight.

---
Développé par Swazi Appli Lab sarl.