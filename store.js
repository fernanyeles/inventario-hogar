// Capa de datos: Firebase (compartido y en tiempo real) o localStorage (modo prueba).
import { firebaseConfig } from "./firebase-config.js";

const FB = "https://www.gstatic.com/firebasejs/11.0.2/";

async function firebaseStore(cfg) {
  const [{ initializeApp }, auth, fs] = await Promise.all([
    import(FB + "firebase-app.js"),
    import(FB + "firebase-auth.js"),
    import(FB + "firebase-firestore.js"),
  ]);
  const app = initializeApp(cfg);
  const a = auth.getAuth(app);
  const db = fs.initializeFirestore(app, {
    localCache: fs.persistentLocalCache({ tabManager: fs.persistentMultipleTabManager() }),
  });
  const list = (name) => (cb, err) =>
    fs.onSnapshot(fs.collection(db, name), (s) => cb(s.docs.map((d) => ({ id: d.id, ...d.data() }))), err);
  return {
    mode: "firebase",
    onAuth: (cb) => auth.onAuthStateChanged(a, cb),
    signIn: (e, p) => auth.signInWithEmailAndPassword(a, e, p),
    signInGoogle: async () => {
      const prov = new auth.GoogleAuthProvider();
      prov.setCustomParameters({ prompt: "select_account" });
      try { await auth.signInWithPopup(a, prov); }
      catch (e) {
        if (["auth/popup-blocked", "auth/operation-not-supported-in-this-environment", "auth/cancelled-popup-request"].includes(e.code)) return auth.signInWithRedirect(a, prov);
        throw e;
      }
    },
    redirectResult: () => auth.getRedirectResult(a),
    onItems: list("items"),
    onShop: list("shopping"),
    onDays: (cb, err) => fs.onSnapshot(fs.doc(db, "settings", "days"), (s) => cb((s.exists() && s.data().d) || {}), err),
    add: (it) => fs.addDoc(fs.collection(db, "items"), it),
    update: (id, patch) => fs.updateDoc(fs.doc(db, "items", id), patch),
    remove: (id) => fs.deleteDoc(fs.doc(db, "items", id)),
    shopAdd: (it) => fs.addDoc(fs.collection(db, "shopping"), it),
    shopUpdate: (id, patch) => fs.updateDoc(fs.doc(db, "shopping", id), patch),
    shopRemove: (id) => fs.deleteDoc(fs.doc(db, "shopping", id)),
    setDays: (d) => fs.setDoc(fs.doc(db, "settings", "days"), { d }),
  };
}

function localStore() {
  const K = "inventario-demo";
  const load = () => {
    let s = {};
    try { s = JSON.parse(localStorage.getItem(K)) || {}; } catch {}
    return { items: s.items || [], days: s.days || {}, shop: s.shop || [] };
  };
  const save = (s) => localStorage.setItem(K, JSON.stringify(s));
  const cbs = { items: new Set(), days: new Set(), shop: new Set() };
  const fire = () => { const s = load(); for (const k in cbs) cbs[k].forEach((f) => f(s[k])); };
  window.addEventListener("storage", fire);
  const sub = (k) => (cb) => { cbs[k].add(cb); cb(load()[k]); return () => cbs[k].delete(cb); };
  const mk = (k) => ({
    add: async (it) => { const s = load(); s[k].push({ id: "l" + Date.now() + Math.random().toString(36).slice(2, 6), ...it }); save(s); fire(); },
    update: async (id, patch) => { const s = load(); const i = s[k].find((x) => x.id === id); if (i) Object.assign(i, patch); save(s); fire(); },
    remove: async (id) => { const s = load(); s[k] = s[k].filter((x) => x.id !== id); save(s); fire(); },
  });
  const I = mk("items"), S = mk("shop");
  return {
    mode: "local",
    onAuth: (cb) => setTimeout(() => cb({ email: "prueba" }), 0),
    signIn: async () => {},
    signInGoogle: async () => {},
    redirectResult: async () => {},
    onItems: sub("items"),
    onShop: sub("shop"),
    onDays: sub("days"),
    add: I.add, update: I.update, remove: I.remove,
    shopAdd: S.add, shopUpdate: S.update, shopRemove: S.remove,
    setDays: async (d) => { const s = load(); s.days = d; save(s); fire(); },
  };
}

export async function createStore() {
  if (!firebaseConfig) return localStore();
  try { return await firebaseStore(firebaseConfig); }
  catch (e) { console.error(e); const s = localStore(); s.error = "No se pudo cargar Firebase (¿sin conexión?). Modo local."; return s; }
}
