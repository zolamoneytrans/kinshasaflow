# Kinshasa Flow - Guide de Déploiement

Cette application est configurée pour être déployée sur l'App Store via **Codemagic**.

## 📱 Informations de l'Application
- **Nom officiel :** Kinshasa Flow
- **ID de l'application (Bundle ID) :** `app.kinshasaflow.online`

## ✅ CHECKLIST DE SUCCÈS (Codemagic)

Si le build échoue à l'étape de signature, vérifiez ces points :

1.  **Certificats (P12) :**
    - Dans Codemagic, allez dans **Distribution > iOS code signing**.
    - Votre certificat doit être lié au groupe `app_store_credentials`.
    - Le statut doit afficher une date d'expiration (vert).

2.  **App Store Connect (API Keys) :**
    - Dans Codemagic, allez dans **Teams > Personal Team > Integrations**.
    - Vérifiez que l'intégration **App Store Connect** est active.
    - Votre clé API doit avoir les permissions "Admin" ou "App Manager" pour créer des profils automatiquement.

3.  **Identifiant Apple :**
    - Connectez-vous sur [developer.apple.com](https://developer.apple.com/account/resources/identifiers/list).
    - Vérifiez que l'identifiant `app.kinshasaflow.online` existe bien. Si ce n'est pas le cas, le script de build tentera de le créer (nécessite les droits Admin).

## 🚀 DÉPLOIEMENT

Pour lancer une nouvelle version sur TestFlight :

1. **Envoyer les modifications :**
```bash
git add .
git commit -m "Build: Ajout de l'argument --create pour forcer la génération des profils"
git push origin main
```

2. **Suivre le build :**
Rendez-vous sur votre tableau de bord **Codemagic** pour voir la progression.

---
Développé par Swazi Appli Lab sarl.
