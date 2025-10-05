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
const MAP_KEY = '014ed1e599152f03fa879183dcf045f6';
const CACHE_FILE = path.join(__dirname, 'cache_incendios.csv');
const CSV_DATA_FILE = path.join(__dirname, 'pasted-text.csv');
// Cache duration reduced to 20 minutes to keep data fresh
const CACHE_DURATION_MS = 20 * 60 * 1000;
const REFRESH_INTERVAL_MS = 20 * 60 * 1000;
const RADIUS_BOMBEIROS_DEFAULT = 50000; // meters

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

function parseCsvToData(csvText) {
  const parsed = Papa.parse(csvText, { header: true, skipEmptyLines: true });
  const rows = parsed.data;

  // Normalize numeric fields similar to the Python version
  const numeric = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n : NaN;
  };

  // Compute means for imputation
  let confSum = 0, confCnt = 0;
  let frpSum = 0, frpCnt = 0;
  let tempSum = 0, tempCnt = 0;

  for (const r of rows) {
    const c = numeric(r.confidence);
    if (!Number.isNaN(c)) { confSum += c; confCnt++; }

    const f = numeric(r.frp);
    if (!Number.isNaN(f)) { frpSum += f; frpCnt++; }

    const t = numeric(r.bright_ti4);
    if (!Number.isNaN(t)) { tempSum += t; tempCnt++; }
  }

  const confMean = confCnt ? confSum / confCnt : 0;
  const frpMean = frpCnt ? frpSum / frpCnt : 0;
  const tempMean = tempCnt ? tempSum / tempCnt : 0;

  const data = rows.map((r) => {
    const latitude = Number(r.latitude);
    const longitude = Number(r.longitude);
    const confidence = Number.isFinite(Number(r.confidence)) ? Number(r.confidence) : confMean;
    const frp = Number.isFinite(Number(r.frp)) ? Number(r.frp) : frpMean;
    const bright_ti4 = Number.isFinite(Number(r.bright_ti4)) ? Number(r.bright_ti4) : tempMean;

    return {
      ...r,
      latitude: latitude,
      longitude: longitude,
      confidence: confidence,
      frp: frp,
      bright_ti4: bright_ti4,
    };
  });

  return data;
}

function readCsvFile(filePath) {
  const text = fs.readFileSync(filePath, 'utf8');
  return parseCsvToData(text);
}

async function fetchNasaFirmsData() {
  try {
    const areaUrl = `https://firms.modaps.eosdis.nasa.gov/api/area/csv/${MAP_KEY}/VIIRS_NOAA20_NRT/world/`;
    console.log('[Backend-Node] Fetching data from NASA FIRMS API...');
    const resp = await axios.get(areaUrl, { responseType: 'text', timeout: 30000 });
    const data = parseCsvToData(resp.data);
    // overwrite cache with the latest fetch only
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
      console.log(`[Backend-Node] CSV file not found: ${CSV_DATA_FILE}`);
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
    console.log(`[Backend-Node] Usando dados do CSV local (${local.length} registros)`);
    return local;
  }

  // 2 - try cache
  const cached = getCachedData();
  if (cached && cached.length) {
    console.log(`[Backend-Node] Usando dados do cache (${cached.length} registros)`);
    return cached;
  }

  // 3 - fetch from NASA
  console.log('[Backend-Node] Nenhum CSV ou cache encontrado. Buscando na NASA FIRMS...');
  return await fetchNasaFirmsData();
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

// Background auto-refresh every 20 minutes to keep cache fresh
setInterval(async () => {
  try {
    await fetchNasaFirmsData();
    console.log('[Backend-Node] Background refresh completed');
  } catch (e) {
    console.log('[Backend-Node] Background refresh failed:', e?.message || e);
  }
}, REFRESH_INTERVAL_MS);

module.exports = app;


