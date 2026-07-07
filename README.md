# Kinshasa Flow - Guide de Déploiement iOS (Signature Automatique Intégrale)

L'application est désormais configurée pour utiliser la **Signature Automatique de Codemagic**. Vous n'avez plus besoin d'importer manuellement de fichiers `.p12` ou `.mobileprovision`.

## 🚀 CONFIGURATION DANS CODEMAGIC

Pour que le build réussisse :

1.  **Intégration Apple Store Connect** :
    *   Allez dans **User Settings** (en bas à gauche) > **Integrations**.
    *   Connectez votre clé API Apple Store Connect (Issuer ID, Key ID, API Key).
    *   Nommez cette intégration `app_store`.

2.  **Configuration du Workflow** :
    *   Dans votre projet Codemagic, allez dans l'onglet **Environment Variables**.
    *   Créez un groupe nommé `app_store_credentials`.
    *   Assurez-vous que l'intégration Apple Store Connect est bien activée pour ce workflow.

3.  **Lancer le build** :
    *   Faites un `git push origin main`.
    *   Le script `app-store-connect fetch-signing-files --create` va automatiquement générer le certificat de distribution et le profil de provisionnement sur votre compte Apple et signer l'application.

---
Développé par Swazi Appli Lab sarl.