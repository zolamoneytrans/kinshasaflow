# Kinshasa Flow - Guide de Déploiement

Cette application est configurée pour être déployée sur l'App Store via **Codemagic**.

## 📱 Informations de l'Application
- **Nom officiel :** Kinshasa Flow
- **ID de l'application (Bundle ID) :** `app.kinshasaflow.online`

## ✅ ÉTAPE 1 : CERTIFICAT RÉUSSI
Le certificat Apple Distribution (.p12) a été correctement chargé dans Codemagic. Le système de signature est désormais opérationnel.

## 🚀 ÉTAPE 2 : DÉPLOIEMENT

Pour lancer une nouvelle version sur TestFlight :

1. **Envoyer les modifications :**
```bash
git add .
git commit -m "Build: Start automated App Store deployment"
git push origin main
```

2. **Suivre le build :**
Rendez-vous sur votre tableau de bord **Codemagic** pour voir la progression de la construction de l'IPA.

3. **Vérification TestFlight :**
Une fois le build terminé (environ 10-15 minutes), l'application apparaîtra automatiquement sur **App Store Connect > TestFlight**.

## 🛠️ En cas de besoin de mise à jour
Si vous changez le Bundle ID ou ajoutez de nouvelles capacités (comme les notifications Push), le profil de provisionnement sera automatiquement recréé lors du prochain build grâce à l'option `--create`.

---
Développé par Swazi Appli Lab sarl.
