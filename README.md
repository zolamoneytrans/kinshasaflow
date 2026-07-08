# Kinshasa Flow - Guide de Déploiement iOS

L'application est configurée pour utiliser la **Signature Automatique de Codemagic** et la génération automatique d'icônes.

## 🛠 CONFIGURATION DES ICÔNES (Nouveau)

Pour que l'icône de l'application apparaisse sur l'iPhone :
1.  Créez un fichier image PNG carré de **1024x1024 pixels**.
2.  Nommez ce fichier `icon.png`.
3.  Placez-le dans le dossier `/assets` à la racine du projet.
4.  Faites un `git push`. Le script `npx @capacitor/assets generate --ios` s'occupera du reste.

## 🚀 CONFIGURATION DANS CODEMAGIC

1.  **Intégration App Store Connect** :
    *   Allez dans **User Settings** > **Integrations**.
    *   Connectez votre clé API App Store Connect (Issuer ID, Key ID, API Key).
    *   Nommez cette intégration `app_store`.

2.  **Variables d'environnement** :
    *   Créez un groupe nommé `app_store_credentials`.
    *   Ajoutez votre certificat `.p12` comme variable de type **File** nommée `CM_CERTIFICATE`.
    *   Ajoutez le mot de passe du certificat comme variable nommée `CM_CERTIFICATE_PASSWORD`.

Faites un `git push origin main` pour déclencher le build. Codemagic signera l'app et l'enverra sur TestFlight avec son icône.

---
Développé par Swazi Appli Lab sarl.