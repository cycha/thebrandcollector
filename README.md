# Backend OMDB

## Stack

Node.js avec Typescript et le framework Express

## Installation

- Création du fichier `.env` à la racine du projet avec la clé API à utiliser pour notre backend, la clé API d'OMDb,
les credentials Google service account ansi que l'id de la spreadsheet utilisée par le projet.
```
PORT=8000
API_KEY=TEST
OMDB_API_KEY=#####
GOOGLE_SERVICE_ACCOUNT_EMAIL=###@####.com
GOOGLE_PRIVATE_KEY=########
SPREADSHEET_ID=#########
```
- Installation des dépendances :
```
npm install
```
- Build du project :
```
npm build
```

## Usage
### Démarrage du serveur :
```
npm start
```

### Endpoints :

#### - GET `/films` : Récupération de la liste des films "Fast & Furious"
```bash
curl --location --request GET 'localhost:8000/films' \
--header 'x-api-key: TEST'
```

#### - GET `/spreadsheet` : Récupération de la liste des films "Pirate des caraïbes" et enregistrement de cette liste dans une Google Spreadsheet 
```bash
curl --location --request GET 'localhost:8000/spreadsheet' \
--header 'x-api-key: TEST'
```
Exemple de spreadsheet : https://docs.google.com/spreadsheets/d/13IEPKjOS2DRsek_JhFqFJ6CBff0rrWOuAKq2cUrqf2g/edit?usp=sharing


## Hébergement
Pour aller le plus vite possible sans considération de scalability j'utiliserai Railway.app avec un Github hook.

## Scalability

Pour monter en charge, il faudrait utiliser un cache comme Redis pour éviter de faire trop d'appel à l'api Omdb et
mettre les résultats en cache, faire de l'horizontal scaling avec un load balancer et des conteneurs Docker par exemple.

## Conclusion

Le projet en l'état persiste ses données au format Json mais cette solution n'est pas viable pour une grosse quantité de
données ou si on utilise plusieurs conteneurs.

Il faudrait :
- comme dit plus haut utiliser un cache.
- rajouter des tests unitaires.
- améliorer le monitoring.
- séparer la data layer du service pour isoler la logique
métier, éviter des dépendances et une meilleure modularité.

Sa force est sa simplicité et la rapidité à mettre en place, cela correspond très bien à un besoin de MVP.

Les next steps pour une mise en prod rapide serait d'utiliser comme dit plus haut le service Railway qui ne demande
quasiment aucune configuration en termes de devops, juste un hook sur le repo Git sans oublier d'importer les variables
d'environnement de prod dans le service.