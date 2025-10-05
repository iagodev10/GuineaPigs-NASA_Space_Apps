const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const Papa = require('papaparse');
const { getDistance } = require('geolib');

const app = express();
app.use(cors());
app.use(express.json());

// Configuration
const MAP_KEY = process.env.FIRMS_API_KEY || '014ed1e599152f03fa879183dcf045f6';
const FIRMS_PRODUCT = process.env.FIRMS_PRODUCT || 'VIIRS_NOAA20_NRT';
const CACHE_FILE = path.join(__dirname, 'cache_incendios.csv');
const CSV_DATA_FILE = path.join(__dirname, 'pasted-text.csv');
// Cache duration reduced to 20 minutes to keep data fresh
const CACHE_DURATION_MS = 20 * 60 * 1000;
const REFRESH_INTERVAL_MS = 20 * 60 * 1000;
const RADIUS_BOMBEIROS_DEFAULT = 50000; // meters

function clampDayRange(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 3;
  if (n < 1) return 1;
  if (n > 10) return 10;
  return Math.round(n);
}

const FIRMS_DAY_RANGE = clampDayRange(process.env.FIRMS_DAY_RANGE || 3);
let csvMissingLogged = false;

function fileExists(filePath) {
  try {
    fs.accessSync(filePath, fs.constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function isCacheFresh(filePath, maxAgeMs) {
  try {
    const stats = fs.statSync(filePath);
    const age = Date.now() - stats.mtimeMs;
    return age < maxAgeMs;
  } catch {
    return false;
  }
}

function toNumericConfidence(value) {
  if (value == null) return NaN;
  const num = Number(value);
  if (Number.isFinite(num)) return num;
  const s = String(value).trim().toLowerCase();
  // Map common FIRMS VIIRS labels to numeric bands
  if (s.startsWith('h') || s === 'high') return 90;
  if (s.startsWith('n') || s === 'nominal' || s === 'normal') return 60;
  if (s.startsWith('l') || s === 'low') return 25;
  return NaN;
}

function parseCsvToData(csvText) {
  const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
  const rows = parsed.data || [];

  // Compute means for imputation based on derived numeric values
  let confSum = 0, confCnt = 0;
  let frpSum = 0, frpCnt = 0;
  let tempSum = 0, tempCnt = 0;

  for (const r of rows) {
    const c = toNumericConfidence(r.confidence);
    if (Number.isFinite(c)) { confSum += c; confCnt++; }

    const f = Number(r.frp);
    if (Number.isFinite(f)) { frpSum += f; frpCnt++; }

    const t = Number(r.bright_ti4);
    if (Number.isFinite(t)) { tempSum += t; tempCnt++; }
  }

  const confMean = confCnt ? confSum / confCnt : 0;
  const frpMean = frpCnt ? frpSum / frpCnt : 0;
  const tempMean = tempCnt ? tempSum / tempCnt : 0;

  const data = rows.map((r) => {
    const latitude = Number(r.latitude);
    const longitude = Number(r.longitude);
    const confVal = toNumericConfidence(r.confidence);
    const confidence = Number.isFinite(confVal) ? confVal : confMean;
    const frp = Number.isFinite(Number(r.frp)) ? Number(r.frp) : frpMean;
    const bright_ti4 = Number.isFinite(Number(r.bright_ti4)) ? Number(r.bright_ti4) : tempMean;

    return {
      ...r,
      latitude,
      longitude,
      confidence,
      frp,
      bright_ti4,
      acq_date: String(r.acq_date || ''),
      acq_time: String(r.acq_time || ''),
      satellite: r.satellite ? String(r.satellite) : 'Unknown',
      instrument: r.instrument ? String(r.instrument) : 'Unknown',
    };
  });

  return data;
}

function sanitizeAndDedupe(rows) {
  if (!Array.isArray(rows)) return [];
  const out = [];
  const seen = new Set();
  for (const r of rows) {
    const lat = Number(r.latitude);
    const lon = Number(r.longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) continue;
    const date = String(r.acq_date || '');
    const time = String(r.acq_time || '');
    const sat = String(r.satellite || '');
    // Dedup key rounds lat/lon to ~100m and uses date+time+satellite
    const key = `${lat.toFixed(3)}|${lon.toFixed(3)}|${date}|${time}|${sat}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(r);
  }
  return out;
}

function readCsvFile(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  return parseCsvToData(text);
}

function isLikelyFirmsCsv(text) {
  // Simple validation: CSV header should contain latitude/longitude
  return typeof text === 'string' && /latitude\s*,\s*longitude/i.test(text);
}

async function fetchNasaFirmsData() {
  try {
    const areaUrl = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${MAP_KEY}/${FIRMS_PRODUCT}/world/${FIRMS_DAY_RANGE}`;
    console.log('[Backend-Node] Fetching data from NASA FIRMS API...', { product: FIRMS_PRODUCT, days: FIRMS_DAY_RANGE });
    const resp = await axios.get(areaUrl, { responseType: 'text', timeout: 60000 });

    if (!isLikelyFirmsCsv(resp.data)) {
      console.error('[Backend-Node] FIRMS API did not return valid CSV. Not caching. First 80 chars:', String(resp.data).slice(0, 80));
      return null;
    }

    const data = parseCsvToData(resp.data);
    if (!Array.isArray(data) || data.length === 0) {
      console.warn('[Backend-Node] FIRMS API returned 0 rows. Not caching.');
      return null;
    }

    // overwrite cache with valid content only
    fs.writeFileSync(CACHE_FILE, resp.data, 'utf8');
    console.log(`[Backend-Node] Successfully fetched ${data.length} fire records`);
    return data;
  } catch (e) {
    console.error('[Backend-Node] Error fetching NASA FIRMS data:', e.message);
    return null;
  }
}

function getCachedData() {
  if (fileExists(CACHE_FILE) && isCacheFresh(CACHE_FILE, CACHE_DURATION_MS)) {
    try {
      const text = fs.readFileSync(CACHE_FILE, 'utf8');
      return parseCsvToData(text);
    } catch {
      return null;
    }
  }
  return null;
}

function loadCsvData() {
  try {
    if (!fileExists(CSV_DATA_FILE)) {
      if (!csvMissingLogged) {
        console.log(`[Backend-Node] CSV file not found (skipping local CSV load): ${CSV_DATA_FILE}`);
        csvMissingLogged = true;
      }
      return null;
    }
    console.log(`[Backend-Node] Loading data from CSV file: ${CSV_DATA_FILE}`);
    return readCsvFile(CSV_DATA_FILE);
  } catch (e) {
    console.error('[Backend-Node] Error loading CSV data:', e.message);
    return null;
  }
}

async function getFireData() {
  // 1 - try local CSV
  const local = loadCsvData();
  if (local && local.length) {
    const cleaned = sanitizeAndDedupe(local);
    console.log(`[Backend-Node] Usando dados do CSV local (${cleaned.length} registros deduplicados)`);
    return cleaned;
  }

  // 2 - try cache
  const cached = getCachedData();
  if (cached && cached.length) {
    const cleaned = sanitizeAndDedupe(cached);
    console.log(`[Backend-Node] Usando dados do cache (${cleaned.length} registros deduplicados)`);
    return cleaned;
  }

  // 3 - fetch from NASA
  console.log('[Backend-Node] Nenhum CSV ou cache encontrado. Buscando na NASA FIRMS...');
  const fetched = await fetchNasaFirmsData();
  return sanitizeAndDedupe(fetched || []);
}

app.get('/api/fires', async (req, res) => {
  const df = await getFireData();
  if (!df) return res.status(500).json({ error: 'Failed to fetch fire data' });

  const fires = df.map((row) => ({
    lat: Number(row.latitude),
    lon: Number(row.longitude),
    confidence: Number.isFinite(Number(row.confidence)) ? Number(row.confidence) : 0,
    temp: Number.isFinite(Number(row.bright_ti4)) ? Number(row.bright_ti4) : 0,
    frp: Number.isFinite(Number(row.frp)) ? Number(row.frp) : 0,
    date: String(row.acq_date),
    time: String(row.acq_time),
    satellite: row.satellite ? String(row.satellite) : 'Unknown',
    instrument: row.instrument ? String(row.instrument) : 'Unknown',
  }));

  res.json({ success: true, count: fires.length, data: fires, timestamp: new Date().toISOString() });
});

app.get('/api/fires/stats', async (req, res) => {
  const df = await getFireData();
  if (!df) return res.status(500).json({ error: 'Failed to fetch fire data' });

  const total = df.length;
  const highRisk = df.filter((r) => Number(r.confidence) > 80).length;
  const avgConfidence = total ? df.reduce((acc, r) => acc + Number(r.confidence || 0), 0) / total : 0;
  // Approximate number of affected countries by unique 2°x2° cells as a proxy
  const cellSet = new Set();
  for (const r of df) {
    const lat = Math.floor(Number(r.latitude) / 2);
    const lon = Math.floor(Number(r.longitude) / 2);
    if (Number.isFinite(lat) && Number.isFinite(lon)) cellSet.add(`${lat}|${lon}`);
  }
  const countriesAffected = Math.min(200, Math.max(1, cellSet.size));

  res.json({
    success: true,
    stats: {
      totalFires: total,
      highRisk: highRisk,
      avgConfidence: Math.round(avgConfidence * 10) / 10,
      countriesAffected: countriesAffected,
    },
  });
});

app.get('/api/fires/country/:country', async (req, res) => {
  const countryName = req.params.country;
  const df = await getFireData();
  if (!df) return res.status(500).json({ error: 'Failed to fetch fire data' });

  const countryBounds = {
    'Brasil': { lat_min: -33.75, lat_max: 5.27, lon_min: -73.99, lon_max: -34.79 },
    'Estados Unidos': { lat_min: 24.52, lat_max: 49.38, lon_min: -125.0, lon_max: -66.93 },
    'Canadá': { lat_min: 41.67, lat_max: 83.11, lon_min: -141.0, lon_max: -52.62 },
    'Austrália': { lat_min: -43.64, lat_max: -10.06, lon_min: 113.34, lon_max: 153.57 },
    'Indonésia': { lat_min: -11.0, lat_max: 6.0, lon_min: 95.0, lon_max: 141.0 },
    'Rússia': { lat_min: 41.19, lat_max: 81.86, lon_min: 19.64, lon_max: 180.0 },
  };

  const bounds = countryBounds[countryName];
  if (!bounds) return res.status(404).json({ error: 'Country not found' });

  const filtered = df.filter((r) => (
    Number(r.latitude) >= bounds.lat_min &&
    Number(r.latitude) <= bounds.lat_max &&
    Number(r.longitude) >= bounds.lon_min &&
    Number(r.longitude) <= bounds.lon_max
  ));

  const fires = filtered.map((row) => ({
    lat: Number(row.latitude),
    lon: Number(row.longitude),
    confidence: Number(row.confidence) || 0,
    temp: Number(row.bright_ti4) || 0,
    date: String(row.acq_date),
    time: String(row.acq_time),
  }));

  const total = filtered.length;
  const highRisk = filtered.filter((r) => Number(r.confidence) > 80).length;
  const avgTemp = total ? filtered.reduce((a, r) => a + Number(r.bright_ti4 || 0), 0) / total : 0;
  const avgConf = total ? filtered.reduce((a, r) => a + Number(r.confidence || 0), 0) / total : 0;

  res.json({
    success: true,
    country: countryName,
    stats: {
      fires: total,
      highRisk: highRisk,
      avgTemp: Math.round(avgTemp * 10) / 10,
      confidence: Math.round(avgConf * 10) / 10,
    },
    data: fires,
  });
});

app.get('/api/fires/bbox', async (req, res) => {
  const south = Number(req.query.south ?? -90);
  const north = Number(req.query.north ?? 90);
  const west = Number(req.query.west ?? -180);
  const east = Number(req.query.east ?? 180);

  const df = await getFireData();
  if (!df) return res.status(500).json({ error: 'Failed to fetch fire data' });

  const filtered = df.filter((r) => (
    Number(r.latitude) >= south &&
    Number(r.latitude) <= north &&
    Number(r.longitude) >= west &&
    Number(r.longitude) <= east
  ));

  const fires = filtered.map((row) => ({
    lat: Number(row.latitude),
    lon: Number(row.longitude),
    confidence: Number(row.confidence) || 0,
    temp: Number(row.bright_ti4) || 0,
    date: String(row.acq_date),
    time: String(row.acq_time),
  }));

  res.json({ success: true, count: fires.length, data: fires });
});

app.get('/api/bombeiros', async (req, res) => {
  const lat = Number(req.query.lat ?? 0);
  const lon = Number(req.query.lon ?? 0);
  const radius = Number(req.query.radius ?? RADIUS_BOMBEIROS_DEFAULT);

  const overpassUrl = 'https://overpass-api.de/api/interpreter';
  const query = `
    [out:json][timeout:60];
    (
        node["amenity"="fire_station"](around:${radius},${lat},${lon});
        way["amenity"="fire_station"](around:${radius},${lat},${lon});
        relation["amenity"="fire_station"](around:${radius},${lat},${lon});
    );
    out center;
  `;

  try {
    const response = await axios.post(overpassUrl, new URLSearchParams({ data: query }).toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 30000,
    });
    const data = response.data;

    const bombeiros = [];
    for (const el of data.elements || []) {
      let bLat, bLon;
      if (el.type === 'node') {
        bLat = el.lat; bLon = el.lon;
      } else if (el.center) {
        bLat = el.center.lat; bLon = el.center.lon;
      } else {
        continue;
      }
      const name = (el.tags && el.tags.name) ? el.tags.name : 'Corpo de Bombeiros';
      const distance = getDistance({ latitude: lat, longitude: lon }, { latitude: bLat, longitude: bLon });
      bombeiros.push({ name, lat: bLat, lon: bLon, distance: Math.round(distance * 100) / 100 });
    }

    bombeiros.sort((a, b) => a.distance - b.distance);
    res.json({ success: true, count: bombeiros.length, data: bombeiros });
  } catch (e) {
    console.error('[Backend-Node] Error fetching fire stations:', e.message);
    res.status(500).json({ error: 'Failed to fetch fire stations' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Simple rule-based Chat Assistant (English default; supports PT-BR keywords too)
function normalize(text) {
  return String(text || '').toLowerCase();
}

function generateChatResponse(userText) {
  const text = normalize(userText);

  const emergencyPreamble =
    'If this is a real emergency, call your local emergency number immediately (e.g., 911 or 112 or 193).';

  // Keyword groups
  const isEmergency = /(fire|lots of smoke|explosion|unconscious|major bleeding|severe injury|gas smell|gas leak|inc[eê]ndio|fogo|muita fuma[cç]a|explos[aã]o|desmaio|inconsciente|sangramento|ferimento grave|cheiro de g[aá]s|vazamento)/.test(text);
  const isBurn = /(burn|scald|hot water|hot oil|queimadur|queimei|escald)/.test(text);
  const isExtinguisher = /(extinguisher|use extinguisher|how to put out fire|class [abc]|classe [abc])/i.test(text);
  const isChoking = /(chok|heimlich|engasg|desengasg)/.test(text);
  const isPrevention = /(prevent|prevention|safety tip|avoid fire|risk of fire|prevenir|preven[çc][aã]o|seguran[çc]a)/.test(text);
  const isGas = /(gas leak|smell gas|propane|glp|botij[aã]o|vazamento)/.test(text);
  const isElectric = /(electrical|electric shock|outlet|short circuit|wires|breaker|choque el[eé]trico|tomada|curto|fios|painel)/.test(text);

  // Responses
  if (isEmergency) {
    return [
      `${emergencyPreamble}`,
      'While you wait for help, if it is safe:',
      '- Move away from the hazard and warn nearby people.',
      '- Turn off electricity and gas only if you can do it safely.',
      '- Do not fight large fires. Evacuate immediately.',
      '- Keep escape routes clear and stay in a ventilated area.'
    ].join('\n');
  }

  if (isBurn) {
    return [
      `${emergencyPreamble}`,
      'Burns – first aid:',
      '- Cool the area with cool running water for 20 minutes.',
      '- DO NOT apply toothpaste, butter, or home ointments.',
      '- Remove rings/watches/tight clothing near the area (do not pull off fabric stuck to skin).',
      '- Cover with sterile gauze or a clean, dry cloth.',
      '- For extensive burns, face/hands/genitals, or large blisters, seek medical care immediately.'
    ].join('\n');
  }

  if (isExtinguisher) {
    return [
      `${emergencyPreamble}`,
      'How to use a fire extinguisher (PASS):',
      '- Pull the safety pin.',
      '- Aim the nozzle at the base of the fire.',
      '- Squeeze the handle.',
      '- Sweep side to side until the flames are out.',
      'Classes: A (solids), B (liquids), C (electrical). Use the correct type and keep an exit behind you.'
    ].join('\n');
  }

  if (isChoking) {
    return [
      `${emergencyPreamble}`,
      'Choking – basic response:',
      '- Adults/children: 5 back blows between the shoulder blades + Heimlich maneuver.',
      '- Infants (<1 year): 5 back blows + 5 chest thrusts (no Heimlich).',
      '- If the person can cough and breathe, encourage coughing and monitor.',
      '- If unconscious, start CPR and call emergency services.'
    ].join('\n');
  }

  if (isGas) {
    return [
      `${emergencyPreamble}`,
      'Gas leak/smell:',
      '- Open doors and windows immediately for ventilation.',
      '- DO NOT turn on lights, use lighters, or operate electrical devices.',
      '- Close the gas valve/cylinder if safe to do so.',
      '- Move away from the area and contact technical assistance and the Fire Department.'
    ].join('\n');
  }

  if (isElectric) {
    return [
      `${emergencyPreamble}`,
      'Electrical incident:',
      '- Turn off the main power before touching any equipment.',
      '- Do not use water on electrical fires.',
      '- Keep bystanders away and mark the area until a technician evaluates it.',
      '- For electrical shock with the victim stuck to the source, cut the power first and only then separate the victim with an insulating object.'
    ].join('\n');
  }

  if (isPrevention) {
    return [
      'Home fire prevention:',
      '- Keep a valid extinguisher and working smoke detectors.',
      '- Do not overload outlets/power strips; inspect wiring regularly.',
      '- Kitchen: never leave pans on the stove unattended.',
      '- Store flammable products away from heat/flames.',
      '- Have family escape routes defined and practiced.'
    ].join('\n');
  }

  // Default guidance
  return [
    `${emergencyPreamble}`,
    'I am your safety assistant. I can help with prevention, burns, use of extinguishers, choking, and electrical/gas incidents. In a few words, tell me what happened.'
  ].join('\n');
}

app.post('/api/chat', (req, res) => {
  try {
    const messages = Array.isArray(req.body?.messages) ? req.body.messages : [];
    const lastUser = messages
      .reverse()
      .find((m) => m && String(m.role) === 'user' && typeof m.content === 'string');

    const userText = lastUser?.content || String(req.body?.text || '');
    if (!userText.trim()) {
      return res.status(400).json({ error: 'Mensagem vazia' });
    }

    const reply = generateChatResponse(userText);
    res.json({ success: true, reply });
  } catch (e) {
    console.error('[Backend-Node] /api/chat error:', e?.message || e);
    res.status(500).json({ error: 'Falha ao processar a mensagem' });
  }
});

app.post('/api/refresh', async (req, res) => {
  try {
    if (fileExists(CACHE_FILE)) fs.unlinkSync(CACHE_FILE);
    const df = await fetchNasaFirmsData();
    if (!df) return res.status(500).json({ error: 'Failed to refresh data' });
    res.json({ success: true, message: 'Data refreshed successfully', count: df.length });
  } catch (e) {
    res.status(500).json({ error: String(e) });
  }
});

app.get('/api/fires/clustered', async (req, res) => {
  const df = await getFireData();
  if (!df || !df.length) return res.status(500).json({ error: 'Failed to fetch fire data' });

  // Rename-like mapping
  const rows = df.map((r) => ({
    lat: Number(r.latitude),
    lon: Number(r.longitude),
    date: r.acq_date,
    temp: Number(r.bright_ti4),
    confidence: Number(r.confidence),
    frp: Number(r.frp),
  }));

  // Round to create clusters (~0.1°)
  const map = new Map(); // key: `${lat_cluster}|${lon_cluster}`
  for (const r of rows) {
    const latCluster = Math.round(r.lat * 10) / 10; // 0.1
    const lonCluster = Math.round(r.lon * 10) / 10;
    const key = `${latCluster}|${lonCluster}`;
    if (!map.has(key)) {
      map.set(key, { latSum: 0, lonSum: 0, confSum: 0, tempSum: 0, frpSum: 0, count: 0 });
    }
    const agg = map.get(key);
    agg.latSum += r.lat;
    agg.lonSum += r.lon;
    agg.confSum += Number.isFinite(r.confidence) ? r.confidence : 0;
    agg.tempSum += Number.isFinite(r.temp) ? r.temp : 0;
    agg.frpSum += Number.isFinite(r.frp) ? r.frp : 0;
    agg.count += 1;
  }

  let clusterData = [];
  for (const [key, agg] of map.entries()) {
    clusterData.push({
      lat: agg.latSum / agg.count,
      lon: agg.lonSum / agg.count,
      count: agg.count,
      avgConfidence: Math.round((agg.confSum / agg.count) * 10) / 10,
      avgTemp: Math.round((agg.tempSum / agg.count) * 10) / 10,
      avgFrp: Math.round((agg.frpSum / agg.count) * 10) / 10,
    });
  }

  clusterData.sort((a, b) => b.count - a.count);
  clusterData = clusterData.slice(0, 1000);

  res.json({ success: true, count: clusterData.length, data: clusterData, timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT ? Number(process.env.PORT) : 5000;

if (require.main === module) {
  console.log('==================================================');
  console.log('FireWatch Backend API (Node.js)');
  console.log('==================================================');
  console.log(`Starting server on http://localhost:${PORT}`);
  console.log(`CSV Data File: ${CSV_DATA_FILE}`);
  console.log('API Endpoints:');
  console.log('  GET  /api/fires - Get all fire data');
  console.log('  GET  /api/fires/stats - Get global statistics');
  console.log('  GET  /api/fires/country/<name> - Get fires by country');
  console.log('  GET  /api/fires/bbox - Get fires by bounding box');
  console.log('  GET  /api/bombeiros - Get nearby fire stations');
  console.log('  POST /api/refresh - Force refresh data');
  console.log('  GET  /api/health - Health check');
  console.log('==================================================');
  app.listen(PORT, '0.0.0.0');
}

// Optional background auto-refresh (disabled by default). Enable with ENABLE_BACKGROUND_REFRESH=1
if (process.env.ENABLE_BACKGROUND_REFRESH === '1') {
  setInterval(async () => {
    try {
      await fetchNasaFirmsData();
    } catch (e) {
      console.log('[Backend-Node] Background refresh failed:', e?.message || e);
    }
  }, REFRESH_INTERVAL_MS);
}

module.exports = app;


