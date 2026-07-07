# Kinshasa Flow - Guide de Déploiement iOS (Signature Automatique Intégrale)

L'application est configurée pour utiliser la **Signature Automatique de Codemagic**.

## 🚀 CONFIGURATION DANS CODEMAGIC

Pour que le build réussisse, assurez-vous que les éléments suivants sont configurés :

1.  **Intégration App Store Connect** :
    *   Allez dans **User Settings** (en bas à gauche) > **Integrations**.
    *   Connectez votre clé API App Store Connect (Issuer ID, Key ID, API Key).
    *   Nommez cette intégration `app_store`.

2.  **Groupe de variables** :
    *   Créez un groupe nommé `app_store_credentials` dans votre projet.
    *   Vérifiez que l'intégration Apple Store Connect est active pour ce workflow.

3.  **Processus de build** :
    *   Le script utilise `app-store-connect fetch-signing-files --create` pour générer automatiquement le certificat de distribution et le profil de provisionnement sur votre compte Apple.
    *   L'argument `--archive-flags="-destination generic/platform=iOS"` est utilisé pour garantir la compatibilité App Store.

Faites un `git push origin main` pour déclencher le build automatique.

---
Développé par Swazi Appli Lab sarl.