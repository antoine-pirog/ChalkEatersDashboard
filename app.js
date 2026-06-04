// =============================================================================
//  CHALK EATERS - app.js
//  Fetches weather data from Open-Meteo (no API key needed), computes climbing
//  scores, and renders the dashboard cards.
// =============================================================================

// == Constants ================================================================

const OPEN_METEO_BASE = "https://api.open-meteo.com/v1/forecast";

// How many past days to show in the history strip
const HISTORY_DAYS = 4;
const FORECAST_DAYS = 7;

// Aspect → ideal sun hours range (hours of direct sun the aspect receives peak season)
const ASPECT_SUN = {
  N:  { label: "Nord",     peak: 2,  icon: "↑" },
  NE: { label: "Nord-Est", peak: 4,  icon: "↗" },
  E:  { label: "Est",      peak: 6,  icon: "→" },
  SE: { label: "Sud-Est",  peak: 8,  icon: "↘" },
  S:  { label: "Sud",      peak: 10, icon: "↓" },
  SW: { label: "Sud-Ouest",peak: 9,  icon: "↙" },
  W:  { label: "Ouest",    peak: 7,  icon: "←" },
  NW: { label: "Nord-Ouest",peak: 3, icon: "↖" },
};

// WMO weather code → short French label + emoji
const WMO = {
  0:  ["Ciel dégagé",    "☀️"],
  1:  ["Peu nuageux",    "🌤"],
  2:  ["Partiellement nuageux","⛅"],
  3:  ["Couvert",        "☁️"],
  45: ["Brouillard",     "🌫"],
  48: ["Brouillard givrant","🌫"],
  51: ["Bruine légère",  "🌦"],
  53: ["Bruine modérée", "🌦"],
  55: ["Bruine forte",   "🌧"],
  61: ["Pluie légère",   "🌧"],
  63: ["Pluie modérée",  "🌧"],
  65: ["Pluie forte",    "🌧"],
  71: ["Neige légère",   "🌨"],
  73: ["Neige modérée",  "🌨"],
  75: ["Neige forte",    "❄️"],
  80: ["Averses légères","🌦"],
  81: ["Averses modérées","🌧"],
  82: ["Averses fortes", "⛈"],
  95: ["Orage",          "⛈"],
  96: ["Orage + grêle",  "⛈"],
  99: ["Orage fort",     "⛈"],
};

// == Helpers ==================================================================

function wmo(code) {
  return WMO[code] || ["Inconnu", "❓"];
}

function fmt(date) {
  return date.toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
}

function today() {
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

function dateMinusDays(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function datePlusDays(n) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}

// == Score computation =========================================================

/**
 * Compute rain/humidity climbing score (0–100) based on:
 * - Total rain in past HISTORY_DAYS days      → rock dryness
 * - Current relative humidity                 → grip/sweat factor
 * - Rain forecast in next 3 days              → planning horizon
 * Returns { score, label, color, detail }
 */
function computeRainScore(pastPrecip, currentHumidity, forecastPrecip) {
  // Past rain penalty: >20mm = very wet rock
  const pastTotal = pastPrecip.reduce((a, b) => a + b, 0);
  let pastPenalty = Math.min(pastTotal / 20, 1) * 40; // 0–40 pts deducted

  // Humidity penalty: ideal is <60%, nightmare is >90%
  let humidPenalty = 0;
  if (currentHumidity > 90) humidPenalty = 30;
  else if (currentHumidity > 75) humidPenalty = 15;
  else if (currentHumidity > 60) humidPenalty = 5;

  // Forecast rain in next 3 days penalty
  const forecastTotal = forecastPrecip.reduce((a, b) => a + b, 0);
  let forecastPenalty = Math.min(forecastTotal / 15, 1) * 30; // 0–30 pts

  const score = Math.max(0, Math.round(100 - pastPenalty - humidPenalty - forecastPenalty));

  let label, color;
  if (score >= 75) { label = "Excellent"; color = "green"; }
  else if (score >= 55) { label = "Bon";      color = "amber"; }
  else if (score >= 35) { label = "Moyen";    color = "orange"; }
  else                  { label = "Mauvais";  color = "red"; }

  const detail = `Pluie passée: ${pastTotal.toFixed(1)}mm · Humidité: ${Math.round(currentHumidity)}% · Pluie prévue: ${forecastTotal.toFixed(1)}mm`;
  return { score, label, color, detail };
}

/**
 * Compute sun exposure score (0–100) based on:
 * - Crag aspect vs actual sunshine duration today
 * Returns { score, label, color, detail }
 */
function computeSunScore(aspect, sunshineHoursToday, tempMax) {
  const ideal = ASPECT_SUN[aspect] || ASPECT_SUN["S"];
  // Full score if sunshine ≈ peak for this aspect
  // Clamp: having less sun than ideal is penalised; too much heat (>32°C) also penalises
  const sunRatio = Math.min(sunshineHoursToday / Math.max(ideal.peak, 1), 1);
  let score = Math.round(sunRatio * 100);

  // Heat penalty
  if (tempMax > 35) score = Math.max(0, score - 30);
  else if (tempMax > 32) score = Math.max(0, score - 15);

  // Cold penalty (< 8°C → cold fingers)
  if (tempMax < 5) score = Math.max(0, score - 40);
  else if (tempMax < 8) score = Math.max(0, score - 20);

  let label, color;
  if (score >= 75) { label = "Idéal";    color = "green"; }
  else if (score >= 50) { label = "Correct"; color = "amber"; }
  else if (score >= 30) { label = "Médiocre";color = "orange"; }
  else                  { label = "Mauvais"; color = "red"; }

  const detail = `Ensoleillement: ${sunshineHoursToday.toFixed(1)}h · Orientation: ${ideal.label} · Tmax: ${Math.round(tempMax)}°C`;
  return { score, label, color, detail };
}

// == Open-Meteo fetch ==========================================================

async function fetchWeather(lat, lon) {
  const startDate = dateMinusDays(HISTORY_DAYS);
  const endDate = datePlusDays(FORECAST_DAYS); // today() ?
  const url = new URL(OPEN_METEO_BASE);
  url.searchParams.set("latitude", lat);
  url.searchParams.set("longitude", lon);
  url.searchParams.set("daily", [
    "precipitation_sum",
    "weathercode",
    "temperature_2m_max",
    "temperature_2m_min",
    "sunshine_duration",
    "windspeed_10m_max",
  ].join(","));
  url.searchParams.set("hourly", "relativehumidity_2m");
  url.searchParams.set("timezone", "Europe/Paris");
  url.searchParams.set("start_date", startDate);
  url.searchParams.set("end_date", endDate);

  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`Open-Meteo error ${res.status}`);
  return res.json();
}

// == Render helpers ============================================================

function scoreBar(score, color) {
  const w = Math.max(0, Math.min(100, score));
  return `<div class="score-bar-track"><div class="score-bar-fill score-color-${color}" style="width:${w}%"></div></div>`;
}

function renderHistory(dates, precip, codes, tmax, tmin) {
  // Show only past days (not today or future)
  const t = today();
  const items = dates
    .map((d, i) => ({ d, precip: precip[i], code: codes[i], tmax: tmax[i], tmin: tmin[i] }))
    .filter(x => x.d < t)
    .slice(-HISTORY_DAYS);

  return items.map(x => {
    const [desc, icon] = wmo(x.code);
    const date = new Date(x.d + "T12:00:00");
    const wet = x.precip > 2;
    return `
      <div class="hist-day ${wet ? "hist-day--wet" : ""}">
        <span class="hist-date">${fmt(date)}</span>
        <span class="hist-icon" title="${desc}">${icon}</span>
        <span class="hist-precip">${x.precip > 0 ? x.precip.toFixed(1) + " mm" : "-"}</span>
        <span class="hist-temp">${Math.round(x.tmin)}–${Math.round(x.tmax)}°C</span>
      </div>`;
  }).join("");
}

function renderForecast(dates, precip, codes, tmax, tmin, sunshine) {
  const t = today();
  const items = dates
    .map((d, i) => ({ d, precip: precip[i], code: codes[i], tmax: tmax[i], tmin: tmin[i], sun: sunshine[i] }))
    .filter(x => x.d >= t)
    .slice(0, 5);

  return items.map((x, idx) => {
    const [desc, icon] = wmo(x.code);
    const date = new Date(x.d + "T12:00:00");
    const isToday = idx === 0;
    const sunH = (x.sun / 3600).toFixed(1);
    return `
      <div class="fc-day ${isToday ? "fc-day--today" : ""}">
        <span class="fc-label">${isToday ? "Auj." : fmt(date)}</span>
        <span class="fc-icon" title="${desc}">${icon}</span>
        <span class="fc-temp">${Math.round(x.tmax)}°</span>
        <span class="fc-precip">${x.precip > 0 ? "💧" + x.precip.toFixed(1) : ""}</span>
        <span class="fc-sun">☀ ${sunH}h</span>
      </div>`;
  }).join("");
}

// == Card renderer =============================================================

function renderCard(crag, data) {
  const d = data.daily;
  const t = today();

  // Indices
  const allDates = d.time; // array of "YYYY-MM-DD"
  const todayIdx = allDates.indexOf(t);

  // Current humidity: average of last 3 hours
  const hIdx = todayIdx * 24 + new Date().getHours();
  const humSlice = data.hourly.relativehumidity_2m.slice(Math.max(0, hIdx - 2), hIdx + 1);
  const currentHumidity = humSlice.reduce((a, b) => a + b, 0) / (humSlice.length || 1);

  // Past precipitation (days before today)
  const pastPrecip = d.precipitation_sum
    .filter((_, i) => d.time[i] < t)
    .slice(-HISTORY_DAYS);

  // Forecast precipitation (next 3 days)
  const forecastPrecip = d.precipitation_sum
    .filter((_, i) => d.time[i] > t)
    .slice(0, 3);

  // Sunshine today
  const sunshineToday = todayIdx >= 0 ? (d.sunshine_duration[todayIdx] || 0) / 3600 : 0;
  const tempMaxToday = todayIdx >= 0 ? d.temperature_2m_max[todayIdx] : 20;

  const rainScore = computeRainScore(pastPrecip, currentHumidity, forecastPrecip);
  const sunScore  = computeSunScore(crag.aspect, sunshineToday, tempMaxToday);

  const aspect = ASPECT_SUN[crag.aspect] || ASPECT_SUN["S"];

  return `
<article class="crag-card" id="crag-${crag.id}">

  <header class="crag-header">
    <div class="crag-title-block">
      <h2 class="crag-name">${crag.name}</h2>
      <span class="crag-sector">${crag.sector}</span>
    </div>
    <div class="crag-aspect-badge" title="Orientation: ${aspect.label}">
      <span class="aspect-arrow">${aspect.icon}</span>
      <span class="aspect-label">${crag.aspect}</span>
    </div>
  </header>

  <!-- == Scores == -->
  <section class="scores-row">
    <div class="score-block">
      <div class="score-header">
        <span class="score-title">Rocher sec</span>
        <span class="score-value score-color-${rainScore.color}">${rainScore.score}<small>/100</small></span>
      </div>
      ${scoreBar(rainScore.score, rainScore.color)}
      <span class="score-label-pill score-pill-${rainScore.color}">${rainScore.label}</span>
      <p class="score-detail">${rainScore.detail}</p>
    </div>
    <div class="score-block">
      <div class="score-header">
        <span class="score-title">Ensoleillement</span>
        <span class="score-value score-color-${sunScore.color}">${sunScore.score}<small>/100</small></span>
      </div>
      ${scoreBar(sunScore.score, sunScore.color)}
      <span class="score-label-pill score-pill-${sunScore.color}">${sunScore.label}</span>
      <p class="score-detail">${sunScore.detail}</p>
    </div>
  </section>

  <!-- == History == -->
  <section class="section-block">
    <h3 class="section-title">Historique - ${HISTORY_DAYS} derniers jours</h3>
    <div class="history-strip">
      ${renderHistory(d.time, d.precipitation_sum, d.weathercode, d.temperature_2m_max, d.temperature_2m_min)}
    </div>
  </section>

  <!-- == Forecast == -->
  <section class="section-block">
    <h3 class="section-title">Prévisions - 5 jours</h3>
    <div class="forecast-strip">
      ${renderForecast(d.time, d.precipitation_sum, d.weathercode, d.temperature_2m_max, d.temperature_2m_min, d.sunshine_duration)}
    </div>
  </section>

  <!-- == WeatherWidget (current conditions + full forecast widget) == -->
  <section class="section-block section-widget">
    <h3 class="section-title">Widget météo détaillé</h3>
    <div class="widget-wrap">
      <a class="weatherwidget-io"
         href="${crag.weatherUrl}"
         data-label_1="${crag.name.toUpperCase()}"
         data-label_2="${crag.sector.toUpperCase()}"
         data-theme="original">${crag.name} ${crag.sector}</a>
    </div>
  </section>

  <!-- == Itinerary == -->
  <footer class="crag-footer">
    <span class="crag-address">📍 ${crag.address}</span>
    <a class="itinerary-btn" href="${crag.mapsUrl}" target="_blank" rel="noopener">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>
      Itinéraire
    </a>
  </footer>

</article>`;
}

// Skeleton while loading
function renderSkeleton(crag) {
  return `
<article class="crag-card crag-card--loading" id="crag-${crag.id}">
  <header class="crag-header">
    <div class="crag-title-block">
      <h2 class="crag-name">${crag.name}</h2>
      <span class="crag-sector">${crag.sector}</span>
    </div>
  </header>
  <div class="skeleton-block"></div>
  <div class="skeleton-block skeleton-block--short"></div>
  <div class="skeleton-block"></div>
</article>`;
}

// Error state
function renderError(crag, msg) {
  return `
<article class="crag-card crag-card--error" id="crag-${crag.id}">
  <header class="crag-header">
    <div class="crag-title-block">
      <h2 class="crag-name">${crag.name}</h2>
      <span class="crag-sector">${crag.sector}</span>
    </div>
  </header>
  <p class="error-msg">⚠ Impossible de charger les données météo.<br><small>${msg}</small></p>
  <footer class="crag-footer">
    <span class="crag-address">📍 ${crag.address}</span>
    <a class="itinerary-btn" href="${crag.mapsUrl}" target="_blank" rel="noopener">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>
      Itinéraire
    </a>
  </footer>
</article>`;
}

// == Main ======================================================================

async function initDashboard() {
  const container = document.getElementById("crags-container");

  // Render skeletons immediately
  container.innerHTML = CRAGS.map(renderSkeleton).join("");

  // Update timestamp
  const now = new Date();
  document.getElementById("last-update").textContent =
    "Mise à jour : " + now.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  // Fetch + render each crag independently so one failure doesn't block others
  await Promise.allSettled(CRAGS.map(async (crag) => {
    const el = document.getElementById(`crag-${crag.id}`);
    try {
      const data = await fetchWeather(crag.lat, crag.lon);
      el.outerHTML = renderCard(crag, data);
    } catch (err) {
      el.outerHTML = renderError(crag, err.message);
    }
  }));

  // Re-init weatherwidget for newly inserted anchors
  if (window.__weatherwidget_init) {
    window.__weatherwidget_init();
  }
}

document.addEventListener("DOMContentLoaded", initDashboard);
