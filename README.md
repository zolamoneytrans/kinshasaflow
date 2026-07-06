# Kinshasa Flow - Guide de Déploiement iOS (Signature Automatique)

L'application est configurée pour utiliser la signature automatique de **Codemagic** via l'API App Store Connect.

## 🚀 CONFIGURATION FINALE

Pour que le build réussisse, vérifiez ces deux points dans votre projet **Codemagic** :

1.  **Environment Variables** :
    *   Dans le groupe `app_store_credentials`, assurez-vous d'avoir :
        *   `CM_CERTIFICATE` : Votre fichier `.p12` uploadé via le bouton **Select file**.
        *   `CM_CERTIFICATE_PASSWORD` : Le mot de passe du certificat (type **Password**).
        *   Les clés API Apple (`APP_STORE_CONNECT_KEY_ID`, etc.) si elles ne sont pas déjà liées via l'intégration globale.

2.  **Lancer le build** :
    *   Faites un `git push origin main`.
    *   Le script va automatiquement synchroniser les profils de provisionnement avec Apple, signer l'IPA et l'envoyer sur TestFlight.

## ✅ POURQUOI CETTE CONFIGURATION ?

La commande `fetch-signing-files --create` permet de récupérer automatiquement les profils depuis Apple. L'importation du certificat `CM_CERTIFICATE` est indispensable pour fournir la **clé privée** nécessaire au décryptage de ces profils sur les serveurs de build.

---
Développé par Swazi Appli Lab sarl.