const EDIT_PASSWORD = "1234";
const STORAGE_KEY = "warehouse_dashboard_v3";
const WAREHOUSE_TOTAL = 14;
const INTERVAL_MS = 5000;
const MAX_POINTS = 60;

const API_URL = "https://warehouse-backend-n4yp.onrender.com/api/latest";

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

/* =====================================================
   ✅ EDIT MODE — ЗАСВАР
   (товч 100% дардаг, state алдагдахгүй)
===================================================== */
let editMode = false;

editBtn.addEventListener("click", () => {
  if (!editMode) {
    const pw = prompt("Password:");
    if (pw !== EDIT_PASSWORD) return;
    editMode = true;
  } else {
    editMode = false;
  }

  body.className = editMode ? "edit-mode" : "view-mode";
  editBtn.textContent = editMode ? "Edit mode: ON" : "Edit mode: OFF";

  // бусад код ашиглаж байвал
  window.IS_EDIT_MODE = editMode;
});

/* =====================================================
   ✅ DROPDOWN — БҮРЭН ЗАСВАР
===================================================== */
function renderDropdown() {
  dropdownList.innerHTML = "";

  Object.keys(warehouses).forEach(k => {
    const d = document.createElement("div");
    d.className = "dropdown-item";
    d.textContent = warehouses[k].name;

    d.addEventListener("click", e => {
      e.stopPropagation();              // 🔥 ЧУХАЛ
      loadWarehouse(k);
      dropdown.classList.remove("dropdown-open");
    });

    dropdownList.appendChild(d);
  });
}

/* header click → toggle */
dropdownHeader.addEventListener("click", e => {
  e.stopPropagation();                  // 🔥 ЧУХАЛ
  dropdown.classList.toggle("dropdown-open");
});

/* outside click → close */
document.addEventListener("click", () => {
  dropdown.classList.remove("dropdown-open");
});

/* =====================================================
   LOAD WAREHOUSE (ӨӨРЧЛӨӨГҮЙ)
===================================================== */
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
    el.innerHTML = `${s.id}<br><span>${s.temp}</span>`;
    el.style.left = s.x + "%";
    el.style.top = s.y + "%";
    floor.appendChild(el);
    enableDrag(el, s);
  });
}

/* ===== NAME ===== */
nameInput.oninput = () => {
  if (!editMode) return;
  warehouses[currentKey].name = nameInput.value;
  selectedText.textContent = nameInput.value;
  saveWarehouses();
  renderDropdown();
};

/* ===== IMAGE ===== */
imageUpload.onchange = e => {
  if (!editMode) return;
  const r = new FileReader();
  r.onload = () => {
    warehouses[currentKey].image = r.result;
    floorImage.src = r.result;
    saveWarehouses();
  };
  r.readAsDataURL(e.target.files[0]);
};

/* ===== DRAG (ӨӨРЧЛӨӨГҮЙ) ===== */
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

/* ===== GRAPH (ӨӨРЧЛӨӨГҮЙ) ===== */
const ctx = document.getElementById("avgChart");
const labels = [], w = [], o = [], g = [];
let lastSensorTemps = [];

const chart = new Chart(ctx, {
  type: "line",
  data: {
    labels,
    datasets: [
      { label: "Warehouse Avg", data: w, borderColor: "#3498db" },
      { label: "Office Avg", data: o, borderColor: "#2ecc71" },
      { label: "Garage Avg", data: g, borderColor: "#9b59b6" }
    ]
  },
  options: { responsive: true, animation: false }
});

function updateGraph() {
  const wh = warehouses[currentKey];
  let ws=[], os=[], gs=[];
  lastSensorTemps = [];

  wh.sensors.forEach(s => {
    const t = +(Math.random() * 6 + 18).toFixed(1);
    s.temp = t + "°C";
    lastSensorTemps.push({ id: s.id, temp: t });

    if (s.group === "warehouse") ws.push(t);
    if (s.group === "office") os.push(t);
    if (s.group === "garage") gs.push(t);
  });

  document.querySelectorAll(".sensor").forEach((el, i) => {
    const span = el.querySelector("span");
    if (span) span.textContent = wh.sensors[i].temp;
  });

  const avg = a => a.length ? (a.reduce((x,y)=>x+y,0)/a.length).toFixed(1) : null;

  if (labels.length > MAX_POINTS) {
    labels.shift(); w.shift(); o.shift(); g.shift();
  }

  labels.push(new Date().toLocaleTimeString());
  w.push(avg(ws));
  o.push(avg(os));
  g.push(avg(gs));

  chart.update("none");
  saveWarehouses();
}

setInterval(updateGraph, INTERVAL_MS);
updateGraph();

/* ===== START ===== */
renderDropdown();
loadWarehouse(currentKey);
