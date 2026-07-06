# Kinshasa Flow - Guide de Déploiement

Cette application est configurée pour être déployée sur l'App Store via **Codemagic**.

## 📱 Informations de l'Application
- **Nom officiel :** Kinshasa Flow
- **ID de l'application (Bundle ID) :** `app.kinshasaflow.online`

## ✅ CHECKLIST DE SUCCÈS (Codemagic)

Si le build échoue, vérifiez ces points dans l'interface Codemagic :

1.  **Certificats (P12) :**
    - Allez dans **Distribution > iOS code signing**.
    - Vérifiez que votre certificat `.p12` est bien présent, lié au groupe `app_store_credentials` et qu'il affiche une date d'expiration (statut vert).

2.  **Variables d'environnement (App Store Connect) :**
    - Dans l'onglet **Environment variables**, le groupe `app_store_credentials` doit contenir :
        - `APP_STORE_CONNECT_PRIVATE_KEY` (Contenu du fichier .p8)
        - `APP_STORE_CONNECT_KEY_IDENTIFIER`
        - `APP_STORE_CONNECT_ISSUER_ID`
        - `APP_STORE_CONNECT_TEAM_ID`

3.  **App Store Connect :**
    - Vérifiez dans votre console Apple Developer que l'identifiant `app.kinshasaflow.online` existe bien et que les profils de provisionnement "App Store" sont créés.

## 🚀 DÉPLOIEMENT

Pour lancer une nouvelle version sur TestFlight :

1. **Envoyer les modifications :**
```bash
git add .
git commit -m "Build: Correction syntaxe build-ipa et optimisation signature"
git push origin main
```

2. **Suivre le build :**
Rendez-vous sur votre tableau de bord **Codemagic** pour voir la progression.

---
Développé par Swazi Appli Lab sarl.
