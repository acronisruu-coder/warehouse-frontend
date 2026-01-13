const EDIT_PASSWORD = "1234";
const STORAGE_KEY = "warehouse_dashboard_v3";
const WAREHOUSE_TOTAL = 14;
const INTERVAL_MS = 5000;
const MAX_POINTS = 60;

const API_URL = "https://warehouse-backend-n4yp.onrender.com/api/latest";

/* ===== TIME RANGE ===== */
let currentRange = "hour"; // minute | hour | day

/* ===== DEFAULT WAREHOUSES ===== */
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

/* ===== SENSOR DEF ===== */
const SENSOR_DEF = [
  ...Array.from({ length: 8 }, (_, i) => ({ id: "W" + (i + 1), group: "warehouse" })),
  ...Array.from({ length: 5 }, (_, i) => ({ id: "O" + (i + 1), group: "office" })),
  { id: "G1", group: "garage" }
];

/* ===== DEFAULT SENSOR LAYOUT ===== */
function defaultSensors() {
  return SENSOR_DEF.map((s, i) => ({
    id: s.id,
    group: s.group,
    x: 6 + (i % 7) * 13,
    y: 18 + Math.floor(i / 7) * 18,
    temp: "--"
  }));
}

/* ===== LOAD / INIT ===== */
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

/* ===== ELEMENTS ===== */
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

/* ===== EDIT MODE ===== */
let editMode = false;
editBtn.onclick = () => {
  if (!editMode) {
    if (prompt("Password:") !== EDIT_PASSWORD) return;
    editMode = true;
  } else editMode = false;

  body.className = editMode ? "edit-mode" : "view-mode";
  editBtn.textContent = editMode ? "Edit mode: ON" : "Edit mode: OFF";
};

/* ===== DROPDOWN ===== */
function renderDropdown() {
  dropdownList.innerHTML = "";
  Object.keys(warehouses).forEach(k => {
    const d = document.createElement("div");
    d.textContent = warehouses[k].name;
    d.onclick = () => {
      loadWarehouse(k);
      dropdown.classList.remove("dropdown-open");
    };
    dropdownList.appendChild
