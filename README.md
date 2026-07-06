# Kinshasa Flow - Guide de Déploiement

Cette application est configurée pour être déployée sur l'App Store via **Codemagic**.

## 📱 Informations de l'Application
- **Nom officiel :** Kinshasa Flow
- **ID de l'application (Bundle ID) :** `app.kinshasaflow.online`

## ✅ CHECKLIST DE SUCCÈS (Codemagic)

Si le build échoue à l'étape "Build and Sign IPA", vérifiez ces points dans l'interface Codemagic :

1.  **Certificats (P12) :**
    - Allez dans **Distribution > iOS code signing**.
    - Vérifiez que votre certificat `.p12` est bien présent et qu'il affiche une date d'expiration (pas de message "Private key missing").

2.  **Variables d'environnement :**
    - Dans l'onglet **Environment variables**, le groupe `app_store_credentials` doit contenir :
        - `APP_STORE_CONNECT_PRIVATE_KEY` (Le contenu du fichier .p8)
        - `APP_STORE_CONNECT_KEY_IDENTIFIER`
        - `APP_STORE_CONNECT_ISSUER_ID`
        - `APP_STORE_CONNECT_TEAM_ID`

3.  **App Store Connect :**
    - Vérifiez dans votre console Apple Developer que l'identifiant `app.kinshasaflow.online` existe bien.

## 🚀 DÉPLOIEMENT

Pour lancer une nouvelle version sur TestFlight :

1. **Envoyer les modifications :**
```bash
git add .
git commit -m "Build: Configuration finalisée avec groupe de credentials"
git push origin main
```

2. **Suivre le build :**
Rendez-vous sur votre tableau de bord **Codemagic** pour voir la progression.

---
Développé par Swazi Appli Lab sarl.
