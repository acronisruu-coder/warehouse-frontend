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
 * API – G1 ONLY (FIXED)
 *************************************************/
async function fetchLatestSensor() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("API error");

    const arr = await res.json();
    console.log("API RAW:", arr);

    if (!Array.isArray(arr)) return null;

    return (
      arr.find(
        d =>
          d.device_id === DEVICE_ID ||
          d.sensor_id === DEVICE_ID ||
          d.device === DEVICE_ID
      ) || null
    );
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
let editMode = false;

/*************************************************
 * ELEMENTS
 *************************************************/
const floor = document.getElementById("floor");
const floorImage = document.getElementById("floorImage");
const selectedText = document.getElementById("selectedWarehouse");
const warehouseSelect = document.getElementById("warehouseSelect");
const editBtn = document.getElementById("editBtn");

/*************************************************
 * LOAD WAREHOUSE
 *************************************************/
function loadWarehouse() {
  const wh = warehouses[currentKey];

  selectedText.textContent = wh.name;
  floorImage.src = wh.image;

  document.querySelectorAll(".sensor").forEach(el => el.remove());

  wh.sensors.forEach(s => {
    const el = document.createElement("div");
    el.className = `sensor ${s.group}`;
    el.id = s.id;
    el.style.left = s.x + "%";
    el.style.top = s.y + "%";
    el.innerHTML = `${s.id}<br><span>${s.temp}</span>`;

    floor.appendChild(el);
  });
}

/*************************************************
 * WAREHOUSE SELECT (FIXED)
 *************************************************/
if (warehouseSelect) {
  warehouseSelect.addEventListener("change", e => {
    currentKey = e.target.value;
    loadWarehouse();
  });
}

/*************************************************
 * EDIT MODE BUTTON (FIXED)
 *************************************************/
if (editBtn) {
  editBtn.addEventListener("click", () => {
    const pwd = prompt("Edit password:");
    if (pwd !== EDIT_PASSWORD) {
      alert("Wrong password");
      return;
    }

    editMode = !editMode;
    alert("Edit mode: " + (editMode ? "ON" : "OFF"));
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
        label: "Garage (G1)",
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
 * UPDATE – SENSOR + GRAPH (FINAL FIX)
 *************************************************/
async function updateData() {
  const wh = warehouses[currentKey];
  const apiData = await fetchLatestSensor();
  if (!apiData) return;

  const t = parseFloat(apiData.temperature);
  if (isNaN(t)) return;

  // RESET
  wh.sensors.forEach(s => (s.temp = "--"));

  // G1
  const g1 = wh.sensors.find(s => s.id === DEVICE_ID);
  if (g1) g1.temp = t.toFixed(1) + "°C";

  // DOM
  wh.sensors.forEach(s => {
    const el = document.getElementById(s.id);
    if (el) el.querySelector("span").textContent = s.temp;
  });

  // CHART
  if (labels.length >= MAX_POINTS) {
    labels.shift();
    g.shift();
  }

  labels.push(new Date().toLocaleTimeString());
  g.push(Number(t.toFixed(1)));

  chart.update("none");
}

/*************************************************
 * START
 *************************************************/
loadWarehouse();
updateData();
setInterval(updateData, INTERVAL_MS);
