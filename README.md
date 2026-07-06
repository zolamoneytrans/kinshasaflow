# Kinshasa Flow - Guide de Déploiement iOS (Signature Automatique)

L'application est configurée pour utiliser la signature automatique de **Codemagic** via l'API App Store Connect, combinée à votre clé privée exportée.

## 🚀 CONFIGURATION FINALE

Pour que le build réussisse, vérifiez ces points dans votre projet **Codemagic** :

1.  **Environment Variables** :
    *   Dans le groupe `app_store_credentials`, assurez-vous d'avoir :
        *   `CM_CERTIFICATE` : Votre fichier `.p12` uploadé via le bouton **Select file** (type FILE).
        *   `CM_CERTIFICATE_PASSWORD` : Le mot de passe du certificat (type PASSWORD).
        *   Les clés API Apple liées automatiquement par Codemagic via l'intégration globale.

2.  **Fonctionnement du script** :
    *   La commande `fetch-signing-files --create` permet de récupérer automatiquement les profils depuis Apple. 
    *   L'importation de `CM_CERTIFICATE` fournit la **clé privée** nécessaire au décryptage de ces profils sur les serveurs de build.

3.  **Lancer le build** :
    *   Faites un `git push origin main`.
    *   Le script va désactiver le mode automatique de Xcode, synchroniser les profils, signer l'IPA et l'envoyer sur TestFlight.

---
Développé par Swazi Appli Lab sarl.