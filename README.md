# Kinshasa Flow - Guide de Déploiement

Cette application est configurée pour être déployée sur l'App Store via **Codemagic**.

## 📱 Informations de l'Application
- **Nom officiel :** Kinshasa Flow
- **ID de l'application (Bundle ID) :** `app.kinshasaflow.online`
- **Version actuelle :** 2.1.0

## 🔴 RÉSOLUTION DE L'ERREUR DE SIGNATURE (Vu sur votre capture)

Votre capture d'écran montre que vous avez le **Provisioning Profile**, mais les logs indiquent : 
`Cannot save Signing Certificates without certificate private key`.

### Étape 1 : Vérifier le Certificat (Action Requise)
1. Dans Codemagic, allez dans **Settings** (icône d'engrenage à gauche).
2. Allez dans l'onglet **IOS certificates** (juste à gauche de "IOS provisioning profiles" que vous avez envoyé).
3. Si vous voyez un certificat mais qu'il n'est pas "vert" ou qu'il manque la clé privée, vous devez uploader votre fichier **.p12**.

### Étape 2 : Comment obtenir le fichier .p12 ?
1. Sur votre Mac, ouvrez l'application **Trousseau d'accès** (Keychain Access).
2. Cherchez le certificat **"Apple Distribution: Emmanuel Nduwa"**.
3. Cliquez sur la petite flèche à gauche du nom pour voir la **clé privée** en dessous.
4. Sélectionnez les deux (Certificat + Clé), faites un clic droit > **Exporter 2 éléments**.
5. Enregistrez au format **.p12** avec un mot de passe.

### Étape 3 : Uploader dans Codemagic
1. Dans l'onglet **IOS certificates**, cliquez sur **Upload certificate**.
2. Sélectionnez votre fichier `.p12` et entrez le mot de passe.
3. Une fois fait, relancez le build. Le statut passera de "Not uploaded" à "Available".

## 🚀 Synchronisation GitHub (Ligne de commande)

Pour envoyer votre code sur votre dépôt, exécutez ces commandes :

1. **Ajouter les fichiers et créer un commit** :
   ```bash
   git add .
   git commit -m "Fix: Codemagic signing configuration and documentation"
   ```

2. **Pousser les mises à jour** :
   ```bash
   git push origin main
   ```

---
Développé par Swazi Appli Lab sarl.
