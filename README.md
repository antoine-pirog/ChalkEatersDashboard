# ChalkEatersDashboard

A dashboard to prep for my next climbing expeditions. I live in Bordeaux, so all climbing sites are in southwest France.

Visit on https://antoine-pirog.github.io/ChalkEatersDashboard/

## Features

* **Weather widgets** : weather forecast via weatherwidget.io
* **Past weather history** : Open-Meteo API
* **Climbing scores** : computed from Open-Meteo data (rain last days, humidity, sun hours)
* **Itinerary** : links to Google Maps directions

## Architecture

* `index.html` : the page skeleton, loads everything else.
* `crags.js` : site configuration (list of crags and their properties). Edit this file to add/remove crags. Each entry has: coordinates, orientation, weatherwidget URL, and a Google Maps destination link
* `app.js` : all the logic. On load, it renders skeleton cards, then hits Open-Meteo for each crag
* `style.css` : dark slate / chalk-white / amber aesthetic. Fully responsive.