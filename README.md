# Kinshasa Flow - Guide de Déploiement iOS

Cette application est configurée pour être déployée sur l'App Store via **Codemagic**.

## ✅ CONFIGURATION REQUISE (Codemagic UI)

Si le build échoue à l'étape "Build and Sign IPA", effectuez ces **3 actions** dans l'interface Codemagic :

### 1. Variables d'Environnement (Crucial)
Allez dans **Teams > [Votre Team] > Environment variables** :
- Ajoutez au groupe `app_store_credentials` :
    - `CM_CERTIFICATE` : Cliquez sur le bouton "File" et uploadez votre fichier `.p12`.
    - `CM_CERTIFICATE_PASSWORD` : Le mot de passe de votre certificat.

### 2. Apple Store Connect API
Dans **Teams > Personal Team > Integrations** :
- Vérifiez que l'intégration **App Store Connect** est active.
- La clé API doit être liée au groupe `app_store_credentials`.

### 3. Sélection du Groupe
Dans les paramètres de votre **Workflow** iOS :
- Sous **Build > Environment variables**, assurez-vous que le groupe `app_store_credentials` est bien coché.

## 🚀 DÉPLOIEMENT

Pour lancer une nouvelle version sur TestFlight :

1. **Envoyer les modifications :**
```bash
git add .
git commit -m "Build: Fix signing logic and force Bundle ID"
git push origin main
```

2. **Suivre le build :**
Rendez-vous sur votre tableau de bord **Codemagic**. Le script va maintenant automatiquement aligner le projet Xcode avec vos certificats Apple.

---
Développé par Swazi Appli Lab sarl.
