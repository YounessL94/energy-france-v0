# Energy France — prototype V0

Prototype local d’un parcours de diagnostic énergétique pour particuliers : landing page, questionnaire en trois étapes, analyse déterministe et recommandations Électricité/Gaz, Solaire et Chauffage.

## Lancer le prototype

Prérequis : Node.js 18 ou plus récent.

```powershell
node server.js
```

Puis ouvrir `http://127.0.0.1:4173`.

## Préparer la version de production

```powershell
node build-static.mjs
```

La commande recrée `dist/` avec uniquement les quatre ressources publiques de la V0. Les documents de recherche, rapports et fichiers locaux ne font pas partie du déploiement.

## Vérifier les règles de diagnostic

```powershell
node --test
```

Le prototype n’utilise ni backend métier, ni base de données, ni service externe. Les réponses restent en mémoire dans le navigateur et sont perdues au rechargement de la page. Les CTA finaux sont volontairement simulés.
