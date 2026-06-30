# Kinshasa Flow - Guide de Déploiement

Cette application est configurée pour être déployée sur l'App Store via **Codemagic** et sur le Play Store via **PWABuilder**.

## 📱 Informations de l'Application
- **Nom officiel :** Kinshasa Flow
- **ID de l'application (Bundle ID / Package Name) :** `app.kinshasaflow.online`
- **Version actuelle :** 2.1.0

## 🔴 SOLUTION ERREUR "PRIVATE KEY" (CODEMAGIC)
Si vous voyez l'erreur `Cannot save Signing Certificates without certificate private key` dans Codemagic :

1. Sur votre Mac, ouvrez **Trousseau d'accès** (Keychain Access).
2. Trouvez votre certificat **Apple Distribution**.
3. Faites un clic droit dessus > **Exporter "Apple Distribution..."**.
4. Enregistrez-le au format **.p12** avec un mot de passe.
5. Dans **Codemagic**, allez dans les paramètres de votre app > **Distribution** > **iOS code signing**.
6. Uploadez ce fichier `.p12` et entrez le mot de passe.
7. Relancez le build.

## 🚀 Synchronisation GitHub (Ligne de commande)

Pour envoyer votre code sur votre dépôt, exécutez ces commandes :

1. **Ajouter les fichiers et créer un commit** :
   ```bash
   git add .
   git commit -m "Fix: Codemagic signing and documentation update"
   ```

2. **Pousser les mises à jour** :
   ```bash
   git push origin main
   ```

## 🍎 Déploiement iOS via Codemagic
Le fichier `codemagic.yaml` à la racine est configuré pour construire l'IPA et l'envoyer sur **TestFlight**.

## 🤖 Déploiement Android via PWABuilder
1. Allez sur [pwabuilder.com](https://www.pwabuilder.com).
2. Entrez l'URL : `https://kinshasaflow.online`.
3. Utilisez le Package Name : `app.kinshasaflow.online`.
4. Générez le fichier `.aab` pour la Google Play Console.

---
Développé par Swazi Appli Lab sarl.