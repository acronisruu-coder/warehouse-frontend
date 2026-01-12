console.log("APP.JS LOADED");

const EDIT_PASSWORD = "1234";
const STORAGE_KEY = "warehouse_dashboard_v3";
const INTERVAL_MS = 5000;
const MAX_POINTS = 60;

const API_URL = "https://warehouse-backend-n4yp.onrender.com/api/latest";

/* =========================
   LOAD / INIT
========================= */
function defaultSensors() {
  return [
    { id: "W1", group: "warehouse", x: 10, y: 10, temp: "--" },
    { id: "O1", group: "office", x: 30, y: 40, temp: "--" },
    { id: "G1", group: "garage", x: 70, y: 60, temp: "--" }
  ];
}

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

/* =========================
   ELEMENTS
========================= */
const body = document.body;
const editBtn = document.getElementById("editToggle");
const floor = document.getElementById("floor");
const floorImage = document.getElementById("floorImage");
const selectedText = document.getElementById("selectedWarehouse");

const dropdown = document.querySelector(".warehouse-dropdown");
const dropdownHeader = document.getElementById("dropdownHeader");
const dropdownList = document.getElementById("dropdownList");

/* =========================
   EDIT MODE
========================= */
let editMode = false;

editBtn.onclick = () => {
  if (!editMode) {
    if (prompt("Password:") !== EDIT_PASSWORD) return;
  }
  editMode = !editMode;
  body.className = editMode ? "edit-mode" : "view-mode";
  editBtn.textContent = editMode ? "Edit mode: ON" : "Edit mode: OFF";
};

/* =========================
   DROPDOWN
========================= */
function renderDropdown() {
  dropdownList.innerHTML = "";
  Object.keys(warehouses).forEach(k => {
    const d = document.createElement("div");
    d.className = "dropdown-item";
    d.textContent = warehouses[k].name;
    d.onclick = e => {
      e.stopPropagation();
      loadWarehouse(k);
      dropdown.classList.remove("dropdown-open");
    };
    dropdownList.appendChild(d);
  });
}

dropdownHeader.onclick = e => {
  e.stopPropagation();
  dropdown.classList.toggle("dropdown-open");
};

document.onclick = () => dropdown.classList.remove("dropdown-open");

/* =========================
   LOAD WAREHOUSE
========================= */
function loadWarehouse(key) {
  currentKey = key;
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
    floor
