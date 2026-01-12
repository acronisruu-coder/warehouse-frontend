console.log("APP.JS LOADED");

/*************************************************
 * CONFIG
 *************************************************/
const EDIT_PASSWORD = "1234";
const STORAGE_KEY = "warehouse_dashboard_v3";
const WAREHOUSE_TOTAL = 14;
const INTERVAL_MS = 5000;
const MAX_POINTS = 60;

// 🔑 API
const API_URL = "https://warehouse-backend-n4yp.onrender.com/api/latest";
const DEVICE_ID = "G1"; // ← ЭНЭ SENSOR-ООР FRONTEND ХОЛБОНО

/*************************************************
 * API (DEVICE_ID → LAST RECORD)
 *************************************************/
async function fetchLatestSensor() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("API response error");

    const arr = await res.json();
    if (!Array.isArray(arr)) return null;

    // ✅ G1 device-ийг олж авна
    const sensor = arr.find(d => d.device_id === DEVICE_ID);
    return sensor || null;

  } catch (err) {
    console.error("Fetch API failed:", err);
    return null;
  }
}

/*************************************************
 * DEFAULT DATA
 *************************************************/
const DEFAULT_WAREHOUSES = [
  { name: "uvs", image: "uvs.png" },
  { name: "East Warehouse", image: "east.png" },
  { name: "West Warehouse", image: "west.png" },
  { name: "North Warehouse", image: "north.png" },
  { name: "South Warehouse", image: "south.png" },
  { name: "Cold Storage", image: "cold.png" },
  { name: "Dry Storage", image: "dry.png" },
  { name: "Spare Parts", image: "spare.png" },
  { name: "Finished Goods", image: "finished.png" },
  { name: "Raw Materials", image: "raw.png" },
  { name: "Overflow 1", image: "overflow1.png" },
  { name: "Overflow 2", image: "overflow2.png" },
  { name: "Temporary Storage", image: "temporary.png" },
  { name: "Backup Warehouse", image: "backup.png" }
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

  const data = {};
  for (let i = 0; i < WAREHOUSE_TOTAL; i++) {
    data["wh" + (i + 1)] = {
      name: DEFAULT_WAREHOUSES[i].name,
      image: DEFAULT_WAREHOUSES[i].image,
      sensors: defaultSensors()
    };
  }
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
const body = document.body;
const editBtn = document.getElementById("editToggle");
const nameInput = document.getElementById("warehouseNameInput");
const imageUpload = document.getElementById("imageUpload");
const floor = document.getElementById("floor");
const floorImage = document.getElementById("floorImage");

const dropdown = document.querySelector(".warehouse-dropdown");
const dropdownHeader = document.getElementById("dropdownHeader");
const dropdownList = document.getElementById("dropdownList");
const selectedText = document.getElementById("selectedWarehouse");

/*************************************************
 * EDIT MODE
 *************************************************/
let editMode = false;
editBtn.onclick = () => {
  if (!editMode) {
    if (prompt("Password:") !== EDIT_PASSWORD) return;
    editMode = true;
  } else editMode = false;

  body.className = editMode ? "edit-mode" : "view-mode";
  editBtn.textContent = editMode ? "Edit mode: ON" : "Edit mode: OFF";
};

/*************************************************
 * DROPDOWN
 *************************************************/
function renderDropdown() {
  dropdownList.innerHTML = "";
  Object.keys(warehouses).forEach(k => {
    const d = document.createElement("div");
    d.textContent = warehouses[k].name;
    d.onclick = () => {
      loadWarehouse(k);
      dropdown.classList.remove("dropdown-open");
    };
    dropdownList.appendChild(d);
  });
}
dropdownHeader.onclick = () =>
  dropdown.classList.toggle("dropdown-open");

/*************************************************
 * LOAD WAREHOUSE
 *************************************************/
function loadWarehouse(key) {
  currentKey = key;
  const wh = warehouses[key];

  selectedText.textContent = wh.name;
  nameInput.value = wh.name;
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
    enableDrag(el, s);
  });
}

/*************************************************
 * DRAG
 *************************************************/
function enableDrag(el, data) {
  let dragging = false, ox = 0, oy = 0;

  el.addEventListener("mousedown", e => {
    if (!editMode) return;
    dragging = true;
    ox = e.offsetX;
    oy = e.offsetY;
  });

  document.addEventListener("mousemove", e => {
    if (!dragging) return;
    const r = floor.getBoundingClientRect();
    data.x = ((e.clientX - r.left - ox) / r.width) * 100;
    data.y = ((e.clientY - r.top - oy) / r.height) * 100;
    el.style.left = data.x + "%";
    el.style.top = data.y + "%";
  });

  document.addEventListener("mouseup", () => {
    if (dragging) {
      dragging = false;
      saveWarehouses();
    }
  });
}

/*************************************************
 * UPDATE GRAPH (G1 DATA)
 *************************************************/
async function updateGraph() {
  const wh = warehouses[currentKey];

  // 1️⃣ API-аас G1 data авах
  const apiData = await fetchLatestSensor();
  if (!apiData) return;

  const t = parseFloat(apiData.temperature);
  const valid = !isNaN(t);

  // 2️⃣ ЭХЛЭЭД БҮХ SENSOR-ЫГ "--" БОЛГОНО
  wh.sensors.forEach(s => {
    s.temp = "--";
  });

  // 3️⃣ ЗӨВХӨН G1-Д УТГА ӨГНӨ
  const g1 = wh.sensors.find(s => s.id === DEVICE_ID);
  if (g1 && valid) {
    g1.temp = t.toFixed(1) + "°C";
  }

  // 4️⃣ UI-г ШИНЭЧИЛНЭ
  document.querySelectorAll(".sensor span").forEach((el, i) => {
    el.textContent = wh.sensors[i].temp;
  });

  saveWarehouses();
}


/*************************************************
 * START
 *************************************************/
setInterval(updateGraph, INTERVAL_MS);
updateGraph();
renderDropdown();
loadWarehouse(currentKey);

