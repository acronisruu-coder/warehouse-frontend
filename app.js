console.log("APP.JS LOADED");

/*************************************************
 * CONFIG
 *************************************************/
const EDIT_PASSWORD = "1234";
const STORAGE_KEY = "warehouse_dashboard_v3";
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
 * DATA
 *************************************************/
const warehouses = {
  wh1: {
    name: "uvs",
    image: "uvs.png",
    sensors: [
      { id: "W1", group: "warehouse", x: 6, y: 10, temp: "--" },
      { id: "W2", group: "warehouse", x: 20, y: 10, temp: "--" },
      { id: "W3", group: "warehouse", x: 34, y: 10, temp: "--" },
      { id: "W4", group: "warehouse", x: 48, y: 10, temp: "--" },
      { id: "W5", group: "warehouse", x: 62, y: 10, temp: "--" },
      { id: "W6", group: "warehouse", x: 76, y: 10, temp: "--" },
      { id: "W7", group: "warehouse", x: 90, y: 10, temp: "--" },

      { id: "O1", group: "office", x: 8, y: 40, temp: "--" },
      { id: "O2", group: "office", x: 20, y: 40, temp: "--" },
      { id: "O3", group: "office", x: 32, y: 40, temp: "--" },
      { id: "O4", group: "office", x: 44, y: 40, temp: "--" },
      { id: "O5", group: "office", x: 56, y: 40, temp: "--" },

      { id: "G1", group: "garage", x: 80, y: 55, temp: "--" }
    ]
  }
};

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
function loadWarehouse() {
  const wh = warehouses[currentKey];
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
 * CHART – G1 HISTORY
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
async function updateData() {
  const wh = warehouses[currentKey];
  const apiData = await fetchLatestSensor();
  if (!apiData) return;

  const t = parseFloat(apiData.temperature);
  if (isNaN(t)) return;

  // SENSOR UI
  wh.sensors.forEach(s => (s.temp = "--"));
  const g1 = wh.sensors.find(s => s.id === DEVICE_ID);
  if (g1) g1.temp = t.toFixed(1) + "°C";

  document.querySelectorAll(".sensor span").forEach((el, i) => {
    el.textContent = wh.sensors[i].temp;
  });

  // GRAPH
  if (labels.length > MAX_POINTS) {
    labels.shift();
    g.shift();
  }

  labels.push(new Date().toLocaleTimeString());
  g.push(t.toFixed(1));
  chart.update("none");
}

/*************************************************
 * START  ✅ ЭНЭ ХЭСЭГ Л ДУТУУ БАЙСАН
 *************************************************/
loadWarehouse();
updateData();
setInterval(updateData, INTERVAL_MS);
