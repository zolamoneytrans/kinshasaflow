# Kinshasa Flow - Guide de Déploiement

Cette application est configurée pour être déployée sur l'App Store via **Codemagic** et sur le Play Store via **PWABuilder**.

## 📱 Informations de l'Application
- **Nom officiel :** Kinshasa Flow
- **ID de l'application (Bundle ID / Package Name) :** `app.kinshasaflow.online`
- **Version actuelle :** 2.1.0

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
   git commit -m "Initial commit - Kinshasa Flow avec identifiants Store"
   ```

4. **Pousser les mises à jour** :
   ```bash
   git branch -M main
   git push -u origin main
   ```

## 🍎 Déploiement iOS via Codemagic
Le fichier `codemagic.yaml` à la racine est configuré pour construire l'IPA et l'envoyer sur **TestFlight**.

1. Connectez-vous sur [Codemagic.io](https://codemagic.io).
2. Utilisez le Bundle ID : `app.kinshasaflow.online`.
3. Dans les **Environment variables**, créez un groupe nommé `app_store_credentials` et ajoutez vos clés Apple (Issuer ID, Key ID, Private Key).
4. Lancez le build.

## 🤖 Déploiement Android via PWABuilder
1. Allez sur [pwabuilder.com](https://www.pwabuilder.com).
2. Entrez l'URL : `https://kinshasaflow.online`.
3. Utilisez le Package Name : `app.kinshasaflow.online`.
4. Générez le fichier `.aab` pour la Google Play Console.

---
Développé par Swazi Appli Lab sarl.
