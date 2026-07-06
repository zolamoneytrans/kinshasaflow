# Kinshasa Flow - Guide de Déploiement iOS

Cette application est configurée pour être déployée sur l'App Store via **Codemagic**.

## ✅ DERNIÈRE ÉTAPE CRITIQUE (Interface Codemagic)

Le script de build a besoin d'accéder physiquement à votre certificat. Suivez ces étapes :

1. Allez dans votre projet sur **Codemagic**.
2. Cliquez sur l'onglet **Environment variables**.
3. Dans le groupe `app_store_credentials`, ajoutez ces deux variables :
   - `CM_CERTIFICATE` : Cliquez sur **Select file** et uploadez votre fichier `.p12`.
   - `CM_CERTIFICATE_PASSWORD` : Saisissez le mot de passe de votre certificat (type **Password**).
4. **IMPORTANT** : Assurez-vous que la case "Secure" est cochée pour les deux.

*Note : Le build échouait car même si le certificat était dans l'onglet "Code signing", il n'était pas disponible pour les scripts de ligne de commande sans ces variables.*

## 🚀 LANCER LE DÉPLOIEMENT

1. **Envoyer les modifications :**
```bash
git add .
git commit -m "Build: Importation explicite du certificat .p12"
git push origin main
```

2. **Suivre le build :**
Rendez-vous sur votre tableau de bord **Codemagic**. Le script va maintenant extraire le `.p12`, créer le profil chez Apple et générer l'IPA.

---
Développé par Swazi Appli Lab sarl.