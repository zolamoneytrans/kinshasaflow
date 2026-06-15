# Kinshasa Flow - Guide de Déploiement

Cette application est configurée pour être déployée sur l'App Store via **Codemagic** et synchronisée sur **GitHub**.

## 🚀 Synchronisation GitHub (Ligne de commande)

Pour envoyer votre code sur votre dépôt `zolamoneytrans/kinshasaflow`, ouvrez votre terminal dans le dossier du projet et exécutez ces commandes :

1. **Initialiser Git** (si ce n'est pas fait) :
   ```bash
   git init
   ```

2. **Ajouter votre dépôt distant** :
   ```bash
   git remote add origin https://github.com/zolamoneytrans/kinshasaflow.git
   ```

3. **Ajouter les fichiers et créer le premier commit** :
   ```bash
   git add .
   git commit -m "Initial commit - Kinshasa Flow avec correctifs Codemagic et SMTP"
   ```

4. **Pousser les mises à jour** :
   ```bash
   git branch -M main
   git push -u origin main
   ```

**Note de sécurité :** Le fichier `.env` est automatiquement ignoré par Git grâce au fichier `.gitignore`. Vos mots de passe SMTP ne seront jamais visibles publiquement.

## 📱 Déploiement iOS via Codemagic

Le fichier `codemagic.yaml` à la racine est configuré pour construire l'IPA et l'envoyer sur **TestFlight**.

1. Connectez-vous sur [Codemagic.io](https://codemagic.io).
2. Liez votre dépôt GitHub `kinshasaflow`.
3. Dans les **Environment variables**, créez un groupe nommé `app_store_credentials` et ajoutez vos clés Apple (Issuer ID, Key ID, Private Key).
4. Lancez le build.

---
Développé par Swazi Appli Lab sarl.