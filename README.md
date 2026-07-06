# Kinshasa Flow - Guide de Déploiement

Cette application est configurée pour être déployée sur l'App Store via **Codemagic**.

## 📱 Informations de l'Application
- **Nom officiel :** Kinshasa Flow
- **ID de l'application (Bundle ID) :** `app.kinshasaflow.online`

## ✅ CHECKLIST DE SUCCÈS (Codemagic)

Si le build échoue à l'étape "Build and Sign IPA", vérifiez ces points dans l'interface Codemagic :

1.  **Association au Groupe :**
    - Allez dans **Distribution > iOS code signing**.
    - Regardez votre certificat `.p12`.
    - **IMPORTANT :** Vérifiez qu'il est bien assigné au groupe nommé `app_store_credentials`. S'il n'y a pas de groupe, créez-en un et modifiez le `codemagic.yaml` pour qu'il corresponde.

2.  **Identité du Certificat :**
    - Votre certificat doit être de type **"Apple Distribution"** ou **"iPhone Distribution"**.
    - Il doit afficher une date d'expiration en vert.

3.  **App Store Connect :**
    - Vérifiez dans **App Store Connect > Users and Access > Keys** que votre clé API a bien accès au Bundle ID `app.kinshasaflow.online`.

## 🚀 DÉPLOIEMENT

Pour lancer une nouvelle version sur TestFlight :

1. **Envoyer les modifications :**
```bash
git add .
git commit -m "Build: Disable automatic signing and force profile fetch"
git push origin main
```

2. **Suivre le build :**
Rendez-vous sur votre tableau de bord **Codemagic** pour voir la progression.

---
Développé par Swazi Appli Lab sarl.
