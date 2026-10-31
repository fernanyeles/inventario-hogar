import { createStore } from "./store.js";

const SECS = {
  congelador: ["Congelador", "🧊"],
  nevera: ["Nevera", "🥛"],
  despensa: ["Despensa", "🥫"],
  hogar: ["Cama y baño", "🛏️"],
  ropa: ["Ropa", "👕"],
};
const DEF = {
  congelador: { "Carne": 180, "Pescado": 120, "Verdura": 300, "Platos cocinados": 90, "Pan": 90, "Otros": 180 },
  nevera: { "Lácteos": 14, "Carne": 3, "Pescado": 2, "Fruta y verdura": 7, "Sobras": 3, "Otros": 7 },
  despensa: { "Conservas": 730, "Pasta y arroz": 540, "Legumbres": 540, "Desayuno": 270, "Otros": 365 },
  hogar: { "Mantas": 0, "Sábanas": 0, "Juegos de cama": 0, "Toallas": 0, "Otros": 0 },
  ropa: { "Camisetas": 0, "Pantalones": 0, "Ropa interior": 0, "Calcetines": 0, "Abrigos": 0, "Calzado": 0, "Otros": 0 },
};
const NOEXP = (s) => s === "hogar" || s === "ropa";
const SOON = 3; // días para considerar "caduca pronto"

let store, items = [], days = {}, tab = "avisos", user = null;
const $ = (s) => document.querySelector(s);
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const ymd = (d) => d.getFullYear() + "-" + String(d.getMonth() + 1).padStart(2, "0") + "-" + String(d.getDate()).padStart(2, "0");
const at = (s) => new Date(s + "T12:00:00");
const add = (s, n) => { const d = at(s); d.setDate(d.getDate() + n); return ymd(d); };
const left = (s) => Math.round((at(s) - at(ymd(new Date()))) / 864e5);
const dur = (sec, cat) => days[sec + "|" + cat] ?? DEF[sec][cat] ?? 0;
const when = (n) => n < 0 ? "caducado hace " + -n + " d" : n === 0 ? "caduca hoy" : n === 1 ? "caduca mañana" : "caduca en " + n + " d";
const cls = (n) => (n <= 0 ? "r" : n <= SOON ? "w" : "mu");
const urgent = () => items.filter((i) => i.exp && i.qty > 0 && !NOEXP(i.sec) && left(i.exp) <= SOON).sort((x, y) => left(x.exp) - left(y.exp));

function itemHtml(i, showSec) {
  const n = i.exp ? left(i.exp) : null;
  return `<div class="card ${i.qty <= 0 ? "off" : ""}" data-id="${esc(i.id)}"><div class="row">
  <div class="grow"><div class="nm">${esc(i.name)}</div>
  <div class="mu">${showSec ? SECS[i.sec][1] + " " + SECS[i.sec][0] + " · " : ""}${esc(i.cat)}${n !== null ? ` · <span class="${cls(n)}">${when(n)}</span>` : ""}</div></div>
  <button class="x" data-a="del" aria-label="Borrar">✕</button></div>
  <div class="row" style="margin-top:8px"><button data-a="q" data-d="-5">−5</button><button data-a="q" data-d="-1">−1</button>
  <div class="q">${i.qty}</div><button class="p" data-a="q" data-d="1">+1</button><button class="p" data-a="q" data-d="5">+5</button>
  ${!NOEXP(i.sec) ? `<input type="date" data-a="exp" value="${esc(i.exp || "")}" aria-label="Fecha de caducidad" style="margin-left:auto">` : ""}</div></div>`;
}

function view() {
  if (!user) return;
  let h = "";
  if (tab === "avisos") {
    const a = urgent();
    h += a.length
      ? `<p class="mu" style="margin:8px 4px">Consúmelo primero:</p>` + a.map((i) => itemHtml(i, true)).join("")
      : `<div class="card mu">Nada caduca en los próximos ${SOON} días. 🎉</div>`;
  } else if (tab === "ajustes") {
    h += `<div class="card"><div class="nm">Duración por categoría (días)</div><div class="mu">0 = sin caducidad. Se aplica a los productos nuevos.</div></div>`;
    for (const s of ["congelador", "nevera", "despensa"]) {
      h += `<div class="card"><div class="nm">${SECS[s][1]} ${SECS[s][0]}</div>` +
        Object.keys(DEF[s]).map((c) => `<div class="row" style="margin-top:8px"><div class="grow">${esc(c)}</div><input type="number" min="0" inputmode="numeric" style="width:90px" data-a="dur" data-k="${esc(s + "|" + c)}" value="${dur(s, c)}"></div>`).join("") + `</div>`;
    }
    h += `<div class="card"><button data-a="export" style="width:100%">Exportar copia de seguridad (JSON)</button>
    <button data-a="csv" style="width:100%;margin-top:8px">Exportar a CSV (Excel / Google Sheets)</button></div>`;
  } else {
    const list = items.filter((i) => i.sec === tab).sort((a, b) => (b.qty > 0) - (a.qty > 0) || (a.exp || "9").localeCompare(b.exp || "9") || a.name.localeCompare(b.name));
    h += `<div class="card"><div class="row"><input id="nn" class="grow" placeholder="Producto nuevo" autocomplete="off">
    <select id="nc">${Object.keys(DEF[tab]).map((c) => `<option>${esc(c)}</option>`).join("")}</select>
    <input id="nq" type="number" min="1" value="1" inputmode="numeric" style="width:72px"><button class="p" data-a="new">Añadir</button></div></div>`;
    h += list.length ? list.map((i) => itemHtml(i, false)).join("") : `<div class="card mu">Todavía no hay nada aquí.</div>`;
  }
  const keep = document.activeElement && document.activeElement.id;
  $("#m").innerHTML = h;
  if (keep && keep !== "nn" && $("#" + keep)) $("#" + keep).focus();
  const al = urgent().length;
  $("#nav").innerHTML = [["avisos", "🔔", "Avisos" + (al ? " (" + al + ")" : "")], ...Object.keys(SECS).map((s) => [s, SECS[s][1], SECS[s][0]]), ["ajustes", "⚙️", "Ajustes"]]
    .map(([k, e, l]) => `<button data-t="${k}" class="${tab === k ? "on" : ""}"><span>${e}</span>${esc(l)}</button>`).join("");
}

const fail = (e) => { $("#st").textContent = "Error: " + ((e && e.message) || e); };

async function save(filename, data, type) {
  const url = URL.createObjectURL(new Blob([data], { type }));
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  document.body.append(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const csvCell = (v) => '"' + String(v ?? "").replace(/"/g, '""') + '"';

document.addEventListener("click", async (e) => {
  const t = e.target.closest("[data-t]");
  if (t) { tab = t.dataset.t; view(); scrollTo(0, 0); return; }
  const b = e.target.closest("[data-a]");
  if (!b || !user) return;
  const a = b.dataset.a, card = b.closest("[data-id]"), it = card && items.find((x) => x.id === card.dataset.id);
  try {
    if (a === "q" && it) {
      const q = Math.max(0, it.qty + Number(b.dataset.d));
      it.qty = q; view();
      await store.update(it.id, { qty: q });
    } else if (a === "del" && it) {
      if (confirm("¿Borrar " + it.name + "?")) await store.remove(it.id);
    } else if (a === "new") {
      const name = $("#nn").value.trim();
      if (!name) return $("#nn").focus();
      const cat = $("#nc").value, qty = Math.max(1, parseInt($("#nq").value) || 1), d = dur(tab, cat);
      await store.add({ name, sec: tab, cat, qty, exp: d > 0 ? add(ymd(new Date()), d) : "", created: ymd(new Date()) });
    } else if (a === "export") {
      save("inventario-" + ymd(new Date()) + ".json", JSON.stringify({ items, days }, null, 1), "application/json");
    } else if (a === "csv") {
      const rows = [["Sección", "Categoría", "Producto", "Cantidad", "Caduca", "Creado"], ...items.map((i) => [SECS[i.sec]?.[0] ?? i.sec, i.cat, i.name, i.qty, i.exp, i.created])];
      save("inventario-" + ymd(new Date()) + ".csv", "﻿" + rows.map((r) => r.map(csvCell).join(",")).join("\n"), "text/csv");
    }
  } catch (x) { fail(x); }
});

document.addEventListener("change", async (e) => {
  const b = e.target.closest("[data-a]");
  if (!b || !user) return;
  try {
    if (b.dataset.a === "exp") await store.update(b.closest("[data-id]").dataset.id, { exp: b.value });
    if (b.dataset.a === "dur") { days = { ...days, [b.dataset.k]: Math.max(0, parseInt(b.value) || 0) }; await store.setDays(days); }
  } catch (x) { fail(x); }
});
document.addEventListener("keydown", (e) => { if (e.key === "Enter" && e.target.id === "nn") $("[data-a=new]").click(); });

$("#loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  $("#loginErr").textContent = "";
  try { await store.signIn($("#em").value.trim(), $("#pw").value); }
  catch (x) { $("#loginErr").textContent = "No se pudo entrar: revisa el correo y la contraseña."; }
});

$("#gBtn").addEventListener("click", async () => {
  $("#loginErr").textContent = "";
  try { await store.signInGoogle(); }
  catch (x) { $("#loginErr").textContent = x.code === "auth/unauthorized-domain" ? "Falta autorizar el dominio en Firebase." : x.code === "auth/popup-closed-by-user" ? "" : "No se pudo entrar con Google."; }
});

let unsub = [];
(async () => {
  store = await createStore();
  window.__store = store;
  store.redirectResult().catch(() => {});
  store.onAuth((u) => {
    user = u;
    unsub.forEach((f) => f && f()); unsub = [];
    $("#login").hidden = !!u; $("#m").hidden = !u; $("#nav").hidden = !u;
    if (!u) { $("#st").textContent = "Inicia sesión"; return; }
    $("#st").textContent = store.error || (store.mode === "firebase" ? "Compartido y sincronizado" : "Modo prueba: datos solo en este dispositivo");
    unsub.push(store.onItems((l) => { items = l; view(); }, fail));
    unsub.push(store.onDays((d) => { days = d; view(); }, fail));
  });
})();

if ("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js").catch(() => {});
