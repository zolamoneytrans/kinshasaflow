# Kinshasa Flow - Guide de Déploiement

Cette application est configurée pour être déployée sur l'App Store via **Codemagic**.

## 📱 Informations de l'Application
- **Nom officiel :** Kinshasa Flow
- **ID de l'application (Bundle ID) :** `app.kinshasaflow.online`

## 🔴 RÉSOLUTION CRITIQUE : "Certificate: Not uploaded"

Votre build échoue avec l'erreur `Cannot save Signing Certificates without certificate private key`. Cela signifie que vous avez configuré l'API Apple, mais que vous n'avez pas donné à Codemagic le "droit de signer" via votre clé privée.

### Étape 1 : Exporter le certificat (.p12) depuis votre Mac
1. Sur le Mac qui a servi à créer le certificat, ouvrez **Trousseau d'accès** (Keychain Access).
2. Allez dans la catégorie **Certificats**.
3. Cherchez **"Apple Distribution: Emmanuel Nduwa"**.
4. **Important :** Cliquez sur la petite flèche à gauche du nom pour voir la clé privée en dessous.
5. Sélectionnez les deux lignes (Le certificat ET la clé privée).
6. Faites un clic droit > **Exporter 2 éléments...**
7. Choisissez le format **.p12** et définissez un mot de passe (notez-le).

### Étape 2 : Uploader dans Codemagic
1. Allez sur votre tableau de bord **Codemagic**.
2. Cliquez sur votre application **Kinshasa Flow**.
3. Allez dans l'onglet **Distribution** (menu de gauche) > **iOS code signing**.
4. Dans la section **Certificate**, cliquez sur **Upload certificate**.
5. Sélectionnez votre fichier `.p12` et entrez le mot de passe.
6. Une fois fait, l'icône rouge **"Not uploaded"** de votre capture d'écran doit devenir **verte**.

### Étape 3 : Relancer le build
Dès que le certificat est "Available" (en vert) dans Codemagic, relancez le build. Il passera l'étape de signature avec succès.

## 🚀 Synchronisation GitHub

Pour envoyer les corrections de configuration :
```bash
git add .
git commit -m "Fix: Finalizing Codemagic signing configuration"
git push origin main
```

---
Développé par Swazi Appli Lab sarl.
