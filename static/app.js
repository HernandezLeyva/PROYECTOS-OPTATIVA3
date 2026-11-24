// =============================================
// MAPA — Leaflet centrado en Puebla
// =============================================
const mapa = L.map("mapa").setView([19.0414, -98.2063], 13);

L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(mapa);

const capaParadas        = L.layerGroup().addTo(mapa);
let   marcadorSeleccionado = null;
let   marcadorClickMapa    = null;

// Captura de coordenadas al hacer clic en el mapa
mapa.on("click", (e) => {
  const { lat, lng } = e.latlng;
  document.getElementById("latitud").value  = lat.toFixed(6);
  document.getElementById("longitud").value = lng.toFixed(6);

  if (marcadorClickMapa) mapa.removeLayer(marcadorClickMapa);
  marcadorClickMapa = L.marker([lat, lng], {
    icon: L.divIcon({
      className: "",
      html: '<div style="background:#0057b8;width:14px;height:14px;border-radius:50%;border:2px solid white;box-shadow:0 0 4px rgba(0,0,0,.4)"></div>',
      iconAnchor: [7, 7],
    }),
  })
    .addTo(mapa)
    .bindPopup(`📍 Lat: ${lat.toFixed(5)}, Lng: ${lng.toFixed(5)}`)
    .openPopup();
});

// =============================================
// REFERENCIAS DOM
// =============================================
const API        = "/paradas";
const form       = document.getElementById("form-parada");
const listaEl    = document.getElementById("lista-paradas");
const mensajeEl  = document.getElementById("mensaje");
const btnCancelar= document.getElementById("btn-cancelar");
const btnGuardar = document.getElementById("btn-guardar");
const titulo     = document.getElementById("titulo-formulario");
const buscador   = document.getElementById("buscador");
const estadoBadge= document.getElementById("estado-redis");

let todasParadas = [];   // caché local para el filtro de búsqueda

// =============================================
// ESTADO REDIS
// =============================================
async function verificarRedis() {
  try {
    const r = await fetch("/estado");
    const d = await r.json();
    if (d.redis_conectado) {
      estadoBadge.className = "badge badge-ok";
      estadoBadge.innerHTML = '<i class="fas fa-circle"></i> Redis conectado';
    } else {
      estadoBadge.className = "badge badge-fail";
      estadoBadge.innerHTML = '<i class="fas fa-circle"></i> Redis desconectado';
    }
  } catch {
    estadoBadge.className = "badge badge-fail";
    estadoBadge.innerHTML = '<i class="fas fa-circle"></i> Sin conexión';
  }
}

// =============================================
// MENSAJES
// =============================================
let msgTimer = null;
function mostrarMensaje(texto, tipo) {
  mensajeEl.textContent = texto;
  mensajeEl.className   = tipo;
  clearTimeout(msgTimer);
  msgTimer = setTimeout(() => {
    mensajeEl.className = "";
    mensajeEl.textContent = "";
  }, 4000);
}

// =============================================
// LIMPIAR FORMULARIO
// =============================================
function limpiarFormulario() {
  form.reset();
  document.getElementById("parada-id").value = "";
  btnCancelar.classList.add("oculto");
  btnGuardar.innerHTML  = '<i class="fas fa-save"></i> Guardar';
  titulo.innerHTML      = '<i class="fas fa-plus-circle"></i> Registrar parada';
  if (marcadorClickMapa) {
    mapa.removeLayer(marcadorClickMapa);
    marcadorClickMapa = null;
  }
}

// =============================================
// RENDERIZAR TARJETA
// =============================================
function crearTarjeta(parada) {
  const art = document.createElement("article");
  art.className = "parada-card";
  art.dataset.nombre  = parada.nombre.toLowerCase();
  art.dataset.colonia = parada.colonia.toLowerCase();

  const chips = parada.rutas.length
    ? parada.rutas.map(r => `<span class="ruta-chip">${r}</span>`).join("")
    : '<span class="ruta-chip" style="background:#f9f9f9;color:#999">Sin rutas</span>';

  art.innerHTML = `
    <div class="parada-card-header">
      <span class="parada-nombre">${parada.nombre}</span>
      <span class="parada-id">${parada.id}</span>
    </div>
    <div class="parada-info">
      <span><i class="fas fa-map-marker-alt"></i>${parada.colonia}</span>
      <span><i class="fas fa-city"></i>${parada.municipio}</span>
      <span><i class="fas fa-arrows-alt-v"></i>${parada.latitud.toFixed(4)}</span>
      <span><i class="fas fa-arrows-alt-h"></i>${parada.longitud.toFixed(4)}</span>
    </div>
    <div class="parada-rutas">${chips}</div>
    <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:8px">
      <span class="parada-status ${parada.activa ? 'status-activa' : 'status-inactiva'}">
        ${parada.activa ? '✅ Activa' : '❌ Inactiva'}
      </span>
      <div class="parada-acciones">
        <button class="btn btn-locate btn-ubicar" data-id="${parada.id}">
          <i class="fas fa-map-pin"></i> Ver mapa
        </button>
        <button class="btn btn-edit btn-editar" data-id="${parada.id}">
          <i class="fas fa-edit"></i> Editar
        </button>
        <button class="btn btn-delete btn-eliminar" data-id="${parada.id}">
          <i class="fas fa-trash"></i> Eliminar
        </button>
      </div>
    </div>
  `;
  return art;
}

// =============================================
// CARGAR PARADAS
// =============================================
async function cargarParadas() {
  try {
    const r = await fetch(API);
    if (!r.ok) throw new Error("No se pudo obtener las paradas");
    const datos = await r.json();

    todasParadas = datos.paradas || [];
    renderizarLista(todasParadas);
    renderizarMapa(todasParadas);

    // Stats
    document.getElementById("total-paradas").textContent = todasParadas.length;
    document.getElementById("total-activas").textContent =
      todasParadas.filter(p => p.activa).length;

  } catch (e) {
    mostrarMensaje(e.message, "error");
  }
}

function renderizarLista(paradas) {
  listaEl.innerHTML = "";
  if (!paradas.length) {
    listaEl.innerHTML = `
      <div style="text-align:center;padding:30px;color:#999">
        <i class="fas fa-bus" style="font-size:2rem;margin-bottom:8px;display:block"></i>
        No hay paradas registradas.
      </div>`;
    return;
  }
  paradas.forEach(p => listaEl.appendChild(crearTarjeta(p)));
}

function renderizarMapa(paradas) {
  capaParadas.clearLayers();
  paradas.forEach(p => {
    const marker = L.marker([p.latitud, p.longitud]).addTo(capaParadas);
    marker.bindPopup(`
      <strong>${p.nombre}</strong><br>
      <small>${p.colonia}, ${p.municipio}</small><br>
      <small>Rutas: ${p.rutas.join(", ") || "Sin rutas"}</small>
    `);
    marker.bindTooltip(p.nombre, { permanent: false });
  });
}

// =============================================
// BUSCADOR EN TIEMPO REAL
// =============================================
buscador.addEventListener("input", () => {
  const q = buscador.value.toLowerCase().trim();
  if (!q) {
    renderizarLista(todasParadas);
    return;
  }
  const filtradas = todasParadas.filter(
    p => p.nombre.toLowerCase().includes(q) || p.colonia.toLowerCase().includes(q)
  );
  renderizarLista(filtradas);
});

// =============================================
// UBICAR EN MAPA
// =============================================
async function ubicarEnMapa(id) {
  const parada = todasParadas.find(p => p.id === id);
  if (!parada) return;

  if (marcadorSeleccionado) mapa.removeLayer(marcadorSeleccionado);

  marcadorSeleccionado = L.marker([parada.latitud, parada.longitud]).addTo(mapa);
  marcadorSeleccionado
    .bindPopup(`
      <strong>${parada.nombre}</strong><br>
      ${parada.colonia}<br>
      Rutas: ${parada.rutas.join(", ") || "Sin rutas"}
    `)
    .openPopup();

  mapa.setView([parada.latitud, parada.longitud], 16);
  document.querySelector(".panel-mapa").scrollIntoView({ behavior: "smooth" });
}

// =============================================
// EDITAR
// =============================================
async function editarParada(id) {
  const r = await fetch(`${API}/${id}`);
  const p = await r.json();

  document.getElementById("parada-id").value  = p.id;
  document.getElementById("nombre").value     = p.nombre;
  document.getElementById("colonia").value    = p.colonia;
  document.getElementById("latitud").value    = p.latitud;
  document.getElementById("longitud").value   = p.longitud;
  document.getElementById("rutas").value      = p.rutas.join(", ");
  document.getElementById("activa").value     = String(p.activa);

  btnCancelar.classList.remove("oculto");
  btnGuardar.innerHTML = '<i class="fas fa-save"></i> Actualizar';
  titulo.innerHTML     = '<i class="fas fa-edit"></i> Editar parada';
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// =============================================
// ELIMINAR
// =============================================
async function eliminarParada(id) {
  if (!confirm("¿Deseas eliminar esta parada?")) return;
  const r = await fetch(`${API}/${id}`, { method: "DELETE" });
  if (r.ok) {
    mostrarMensaje("Parada eliminada correctamente.", "exito");
    cargarParadas();
  } else {
    mostrarMensaje("No se pudo eliminar la parada.", "error");
  }
}

// =============================================
// SUBMIT — CREAR / ACTUALIZAR
// =============================================
form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const id    = document.getElementById("parada-id").value;
  const rutas = document.getElementById("rutas").value
    .split(",").map(r => r.trim()).filter(r => r !== "");

  const datos = {
    nombre:    document.getElementById("nombre").value,
    colonia:   document.getElementById("colonia").value,
    municipio: "Puebla",
    latitud:   parseFloat(document.getElementById("latitud").value),
    longitud:  parseFloat(document.getElementById("longitud").value),
    rutas,
    activa: document.getElementById("activa").value === "true",
  };

  const url    = id ? `${API}/${id}` : API;
  const metodo = id ? "PUT" : "POST";

  try {
    const r = await fetch(url, {
      method: metodo,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(datos),
    });
    if (!r.ok) {
      const err = await r.json();
      throw new Error(err.detail || "Error al guardar");
    }
    mostrarMensaje(
      id ? "Parada actualizada correctamente." : "Parada registrada correctamente.",
      "exito"
    );
    limpiarFormulario();
    cargarParadas();
  } catch (err) {
    mostrarMensaje(err.message, "error");
  }
});

// =============================================
// EVENTOS — lista de paradas
// =============================================
listaEl.addEventListener("click", (e) => {
  const btn = e.target.closest("button");
  if (!btn) return;
  const id = btn.dataset.id;
  if (!id) return;

  if (btn.classList.contains("btn-ubicar"))   ubicarEnMapa(id);
  if (btn.classList.contains("btn-editar"))   editarParada(id);
  if (btn.classList.contains("btn-eliminar")) eliminarParada(id);
});

btnCancelar.addEventListener("click", limpiarFormulario);
document.getElementById("btn-recargar").addEventListener("click", cargarParadas);

// =============================================
// INICIO
// =============================================
verificarRedis();
cargarParadas();
