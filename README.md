# Kinshasa Flow - Guide de Déploiement

Cette application est configurée pour être déployée sur l'App Store via **Codemagic** et sur le Play Store via **PWABuilder**.

## 📱 Informations de l'Application
- **Nom officiel :** Kinshasa Flow
- **ID de l'application (Bundle ID) :** `app.kinshasaflow.online`
- **Version actuelle :** 2.1.0

## 🔴 SOLUTION ERREUR "NOT UPLOADED" (Vu sur votre capture)
Si vous voyez l'icône rouge **"Certificate: Not uploaded"** sur Codemagic pour l'ID `app.kinshasaflow.online` :

1. **Sur votre Mac :**
   - Ouvrez l'application **Trousseau d'accès** (Keychain Access).
   - Allez dans la catégorie **Certificats**.
   - Cherchez votre certificat **"Apple Distribution: [Votre Nom]"**.
   - Faites un clic droit dessus > **Exporter "Apple Distribution..."**.
   - Enregistrez-le au format **.p12** avec un mot de passe de votre choix.

2. **Sur Codemagic (Interface Web) :**
   - Allez dans les paramètres de votre application.
   - Menu **Distribution** > **iOS code signing**.
   - Dans la section "Signing certificate", cliquez sur **Upload certificate**.
   - Sélectionnez votre fichier `.p12` et entrez le mot de passe défini à l'étape précédente.
   - Cliquez sur **Save**.

3. **Relancez le build :** Une fois le certificat chargé, le statut passera au vert (comme pour votre autre app "CarWash") et le build réussira.

## 🚀 Synchronisation GitHub (Ligne de commande)

Pour envoyer votre code sur votre dépôt, exécutez ces commandes :

1. **Ajouter les fichiers et créer un commit** :
   ```bash
   git add .
   git commit -m "Fix: Codemagic signing and deployment documentation"
   ```

2. **Pousser les mises à jour** :
   ```bash
   git push origin main
   ```

---
Développé par Swazi Appli Lab sarl.