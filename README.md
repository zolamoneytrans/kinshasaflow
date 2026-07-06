# Kinshasa Flow - Guide de Déploiement

Cette application est configurée pour être déployée sur l'App Store via **Codemagic**.

## 📱 Informations de l'Application
- **Nom officiel :** Kinshasa Flow
- **ID de l'application (Bundle ID) :** `app.kinshasaflow.online`

## ✅ CHECKLIST DE SUCCÈS (Codemagic)

Si le build échoue à l'étape "Build and Sign IPA", vérifiez ces 3 points :

1. **Le fichier .p12 :**
   - Allez dans **Distribution > iOS code signing**.
   - Assurez-vous que le certificat listé est bien de type **"iPhone Distribution"** (et non Development).
   - Le statut doit être **"Expires in ..."** (en vert). Si c'est rouge, supprimez-le et uploadez-le à nouveau avec le bon mot de passe.

2. **Le Bundle ID :**
   - Votre Bundle ID Apple doit être exactement `app.kinshasaflow.online`.
   - Vérifiez qu'il n'y a pas d'espace caché dans la configuration Codemagic.

3. **Accès API :**
   - Assurez-vous que votre clé API App Store Connect a bien le rôle **"App Manager"** ou **"Admin"**.

## 🚀 DÉPLOIEMENT

Pour lancer une nouvelle version sur TestFlight :

1. **Envoyer les modifications :**
```bash
git add .
git commit -m "Build: Resolve signing issues"
git push origin main
```

2. **Suivre le build :**
Rendez-vous sur votre tableau de bord **Codemagic** pour voir la progression.

---
Développé par Swazi Appli Lab sarl.
