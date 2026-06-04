// =============================================================================
//  CHALK EATERS - Configuration des falaises
//  Modifiez ce fichier pour ajouter, retirer ou éditer un site d'escalade.
// =============================================================================

const CRAGS = [
  // {
  //   id: identifiant
  //   name: titre affiché
  //   sector: sous-titre affiché
  //   lat: latitude gps
  //   lon: longitude gps
  //   aspect: Orientation de la falaise (N S E W NE NW SE SW) Utilisé pour calculer le score d'ensoleillement
  //   weatherUrl: URL du widget météo (weatherwidget.io)
  //   mapsUrl: Lien itinéraire Google Maps (point d'arrivée = parking falaise)
  //   address: Adresse affichée
  // },
  {
    id: "frontenac",
    name: "Frontenac",
    sector: "La Lirette",
    lat: 44.733455362670576,
    lon: -0.16304270867069112,
    aspect: "SE",
    weatherUrl: "https://forecast7.com/fr/44d74n0d16/frontenac/",
    mapsUrl: "https://www.google.com/maps/dir/?api=1&destination=44.733455362670576,-0.16304270867069112&travelmode=driving",
    address: "Frontenac, Gironde (33)",
  },
  {
    id: "chateauneuf",
    name: "Châteauneuf-sur-Charente",
    sector: "La Font qui Pisse",
    lat: 45.59552538034501, 
    lon: -0.07898577775795936,
    aspect: "SW",
    weatherUrl: "https://forecast7.com/fr/45d60n0d05/chateauneuf-sur-charente/",
    mapsUrl: "https://www.google.com/maps/dir/?api=1&destination=45.59552538034501,-0.07898577775795936&travelmode=driving",
    address: "Châteauneuf-sur-Charente, Charente (16)",
  },
  {
    id: "angouleme",
    name: "Angoulême",
    sector: "Les Eaux Claires",
    lat: 45.61002879088452, 
    lon: 0.16176680503774446,
    aspect: "S",
    weatherUrl: "https://forecast7.com/fr/45d650d16/angouleme/",
    mapsUrl: "https://www.google.com/maps/dir/?api=1&destination=45.61002879088452,0.1679902721380975&travelmode=driving",
    address: "Angoulême, Charente (16)",
  },
  {
    id: "autoire",
    name: "Autoire",
    sector: "Autoire",
    lat: 44.85528586494887,
    lon: 1.8141523800394717,
    aspect: "E",
    weatherUrl: "https://forecast7.com/fr/44d851d82/autoire/",
    mapsUrl: "https://www.google.com/maps/dir/?api=1&destination=44.85528586494887,1.8141523800394717&travelmode=driving",
    address: "Autoire, Lot (46)",
  },
  {
    id: "sarlat",
    name: "Sarlat-la-Canéda",
    sector: "Le Céou",
    lat: 44.807701110839844,
    lon: 1.1577999591827393,
    aspect: "SW",
    weatherUrl: "https://forecast7.com/fr/44d891d22/sarlat-la-caneda/",
    mapsUrl: "https://www.google.com/maps/dir/?api=1&destination=44.807701110839844,1.1577999591827393&travelmode=driving",
    address: "Sarlat-la-Canéda, Dordogne (24)",
  },
  {
    id: "montory",
    name: "Montory",
    sector: "Arguibelle",
    lat: 43.08259963989258,
    lon: -0.7943419814109802,
    aspect: "SE",
    weatherUrl: "https://forecast7.com/fr/43d10n0d82/montory/",
    mapsUrl: "https://www.google.com/maps/dir/?api=1&destination=43.08259963989258,-0.7943419814109802&travelmode=driving",
    address: "Montory, Pyrénées-Atlantiques (64)",
  },
  {
    id: "roquefixade",
    name: "Roquefixade",
    sector: "Roquefixade",
    lat: 42.935699462890625,
    lon: 1.7552599906921387,
    aspect: "SW",
    weatherUrl: "https://forecast7.com/fr/42d941d75/roquefixade/",
    mapsUrl: "https://www.google.com/maps/dir/?api=1&destination=42.935699462890625,1.7552599906921387&travelmode=driving",
    address: "Roquefixade, Ariège (09)",
  },
];
