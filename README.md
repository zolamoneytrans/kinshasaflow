# Kinshasa Flow - Guide de Déploiement iOS (Signature Automatique)

L'application est configurée pour utiliser la signature automatique de **Codemagic** via l'API App Store Connect, combinée à votre clé privée exportée.

## 🚀 CONFIGURATION FINALE DANS CODEMAGIC

Pour que le build réussisse, vérifiez ces points dans votre projet **Codemagic** :

1.  **Environment Variables** (Groupe `app_store_credentials`) :
    *   `CM_CERTIFICATE` : Votre fichier `.p12` uploadé via le bouton **Select file** (type FILE).
    *   `CM_CERTIFICATE_PASSWORD` : Le mot de passe du certificat (type PASSWORD).
    *   Les clés API Apple (`Issuer ID`, `Key ID`, etc.) liées automatiquement par Codemagic via l'intégration globale.

2.  **Vérification Manuelle** :
    *   Dans **Distribution > iOS code signing**, assurez-vous que votre certificat est bien listé et qu'il n'y a plus de message d'erreur concernant la clé privée.

3.  **Fonctionnement du script** :
    *   Le script importe d'abord votre certificat `CM_CERTIFICATE` dans le trousseau de la machine virtuelle.
    *   La commande `fetch-signing-files --create` utilise ensuite vos accès Apple pour générer les profils correspondants.

4.  **Lancer le build** :
    *   Faites un `git push origin main`.
    *   Le script va désactiver le mode automatique de Xcode, synchroniser les profils, signer l'IPA et l'envoyer sur TestFlight.

---
Développé par Swazi Appli Lab sarl.