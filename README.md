# Kinshasa Flow - Guide de Déploiement iOS

Cette application est configurée pour être déployée sur l'App Store via **Codemagic**.

## ✅ CERTIFICATS CONFIGURÉS

Le certificat `CM_CERTIFICATE` (Emmanuel nduwa) est bien présent dans Codemagic.

## 🚀 DERNIÈRES ÉTAPES (Codemagic UI)

Assurez-vous que ces **2 variables** sont présentes dans votre groupe `app_store_credentials` (onglet **Environment variables**) :

1. `CM_CERTIFICATE` : Le fichier `.p12` (type **File**).
2. `CM_CERTIFICATE_PASSWORD` : Le mot de passe de votre certificat (type **Password**).

*Note : Même si vous avez uploadé le certificat dans l'onglet "iOS code signing", le script de build nécessite qu'il soit aussi présent comme variable de type "File" pour être injecté dans le trousseau de clés.*

## 🚀 LANCER LE DÉPLOIEMENT

1. **Envoyer les modifications :**
```bash
git add .
git commit -m "Build: Utilisation de la configuration clean avec certificat CM_CERTIFICATE"
git push origin main
```

2. **Suivre le build :**
Rendez-vous sur votre tableau de bord **Codemagic**. Le build va maintenant s'exécuter, signer l'IPA et l'envoyer sur TestFlight.

---
Développé par Swazi Appli Lab sarl.