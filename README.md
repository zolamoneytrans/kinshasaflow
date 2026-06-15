# Kinshasa Flow - Guide de Déploiement

Cette application est configurée pour être déployée sur l'App Store via **Codemagic** et synchronisée sur **GitHub**.

## 🚀 Synchronisation GitHub

Pour envoyer votre code sur votre dépôt `zolamoneytrans/kinshasaflow`, ouvrez votre terminal et exécutez ces commandes :

1. **Initialiser Git** (si ce n'est pas fait) :
   ```bash
   git init
   ```

2. **Ajouter votre dépôt distant** :
   ```bash
   git remote add origin https://github.com/zolamoneytrans/kinshasaflow.git
   ```

3. **Envoyer le code** :
   ```bash
   git add .
   git commit -m "Initial commit - Kinshasa Flow"
   git branch -M main
   git push -u origin main
   ```

*Note : Le fichier `.env` est automatiquement ignoré pour protéger vos mots de passe SMTP.*

## 📱 Déploiement iOS via Codemagic (Recommandé)

Le fichier `codemagic.yaml` est présent à la racine. Pour l'activer :

1. Connectez-vous sur [Codemagic.io](https://codemagic.io).
2. Ajoutez votre dépôt GitHub `kinshasaflow`.
3. Dans les **Settings** de l'application sur Codemagic :
    * Allez dans **Environment variables**.
    * Créez un groupe nommé `app_store_credentials`.
    * Ajoutez les variables Apple (Issuer ID, Key ID, Private Key).
4. Lancez un build manuellement.

---
### Structure Native (Capacitor)

L'application iOS fonctionne comme un "Live Wrapper" pointant vers `https://kinshasaflow.online`. 

Développé par Swazi Appli Lab sarl.
# kinshasaflow
# kinshasaflow
