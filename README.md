# Kinshasa Flow - Guide de Déploiement iOS

Cette application est configurée pour être déployée sur l'App Store via **Codemagic** ou **GitHub Actions**.

## Option 1 : Déploiement via Codemagic (Recommandé)

Le fichier `codemagic.yaml` est déjà présent à la racine. Pour l'activer :

1.  Connectez-vous sur [Codemagic.io](https://codemagic.io).
2.  Ajoutez votre dépôt GitHub `kinshasaflow`.
3.  Dans les **Settings** de l'application sur Codemagic :
    *   Allez dans **Environment variables**.
    *   Créez un groupe nommé `app_store_credentials`.
    *   Ajoutez les variables suivantes (récupérées sur App Store Connect) :
        *   `APP_STORE_CONNECT_ISSUER_ID`
        *   `APP_STORE_CONNECT_KEY_ID`
        *   `APP_STORE_CONNECT_PRIVATE_KEY` (Le contenu du fichier .p8)
4.  Lancez un build manuellement ou faites un `git push` sur `main`.

## Option 2 : Déploiement via GitHub Actions

Utilisez le workflow présent dans `.github/workflows/ios-build.yml` en ajoutant les secrets Apple Certs dans votre dépôt GitHub.

---
### Structure Native (Capacitor)

L'application iOS fonctionne comme un "Live Wrapper" pointant vers `https://kinshasaflow.online`. Cela garantit que toutes les fonctionnalités d'IA (Genkit) et de base de données (Firebase) fonctionnent en temps réel sans latence.

Développé par Swazi Appli Lab sarl.
