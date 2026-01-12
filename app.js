console.log("APP.JS LOADED");

/*************************************************
 * CONFIG
 *************************************************/
const EDIT_PASSWORD = "1234";
const STORAGE_KEY = "warehouse_dashboard_v3";
const WAREHOUSE_TOTAL = 14;
const INTERVAL_MS = 5000;
const MAX_POINTS = 60;

const API_URL = "https://warehouse-backend-n4yp.onrender.com/api/latest";
const DEVICE_ID = "G1";

/*************************************************
 * API – G1 ONLY
 *************************************************/
async function fetchLatestSensor() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("API error");
    const arr = await res.json();
    if (!Array.isArray(arr)) return null;
    return arr.find(d => d.device_id === DEVICE_ID) || null;
  } catch (e) {
    console.error("API fetch failed", e);
    return null;
  }
}

/*************************************************
 * DEFAULT DATA
 *************************************************/
const DEFAULT_WAREHOUSES = [
  { name: "uvs", image: "uvs.png" }
];

const SENSOR_DEF = [
  ...Array.from({ length: 8 }, (_, i) => ({ id: "W" + (i + 1), group: "warehouse" })),
  ...Array.from({ length: 5 }, (_, i) => ({ id: "O" + (i + 1), group: "office" })),
  { id: "G1", group: "garage" }
];

function defaultSensors() {
  return SENSOR_DEF.map((s, i) => ({
    id: s.id,
    group: s.group,
    x: 6 + (i % 7) * 13,
    y: 18 + Math.floor(i / 7) * 18,
    temp: "--"
  }));
}

/*************************************************
 * STORAGE
 *************************************************/
function loadWarehouses() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved) return JSON.parse(saved);

  const data = {
    wh1: {
      name: "uvs",
      image: "uvs.png",
      sensors: defaultSensors()
    }
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  return data;
}

function saveWarehouses() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(warehouses));
}

let warehouses = loadWarehouses();
let currentKey = "wh1";

/*************************************************
 * ELEMENTS
 *************************************************/
const floor = document.getElementById("floor");
const floorImage = document.getElementById("floorImage");
const selectedText = document.getElementById("selectedWarehouse");

/*************************************************
 * LOAD WAREHOUSE
 *************************************************/
function loadWarehouse(key) {
  const wh = warehouses[key];
  selectedText.textContent = wh.name;
  floorImage.src = wh.image;

  document.querySelectorAll(".sensor").forEach(s => s.remove());

  wh.sensors.forEach(s => {
    const el = document.createElement("div");
    el.className = `sensor ${s.group}`;
    el.id = s.id;
    el.innerHTML = `${s.id}<br><span>${s.temp}</span>`;
    el.style.left = s.x + "%";
    el.style.top = s.y + "%";
    floor.appendChild(el);
  });
}

/*************************************************
 * CHART (G1 HISTORY)
 *************************************************/
const ctx = document.getElementById("avgChart");
const labels = [];
const g = [];

const chart = new Chart(ctx, {
  type: "line",
  data: {
    labels,
    datasets: [
      {
        label: "Garage Avg (G1)",
        data: g,
        borderColor: "#9b59b6",
        tension: 0.3
      }
    ]
  },
  options: {
    responsive: true,
    animation: false
  }
});

/*************************************************
 * UPDATE – SENSOR + GRAPH
 *************************************************/
async function updateGraph() {
  const wh = warehouses[currentKey];

  const apiData = await fetchLatestSensor();
  if (!apiData) return;

  const t = parseFloat(apiData.temperature);
  if (isNaN(t)) return;

  // === SENSOR UI ===
  wh.sensors.forEach(s => (s.temp = "--"));
  const g1 = wh.sensors.find(s => s.id === DEVICE_ID);
  if (g1) g1.temp = t.toFixed(1) + "°C";

  document.querySelectorAll(".sensor span").forEach((el, i) => {
    el.textContent = wh.sensors[i].temp;
  });

  // === GRAPH ===
  if (labels.length > MAX_POINTS) {
    labels.shift();
    g.shift();
  }

  labels.push(new Date().toLocaleTimeString());
  g.push(t.toFixed(1));

  chart.update("none");
  saveWarehouses();
}

/*************************************************
 * START
 *************************************************/
loadWarehouse(currentKey);
updateGraph();
setInterval(updateGraph, INTERVAL_MS);
