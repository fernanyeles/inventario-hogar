# Inventario del hogar (PWA)

Congelador, nevera, despensa, cama y baño, y ropa. Botones −5 / −1 / +1 / +5, caducidad por categoría
(editable en Ajustes), avisos dentro de la app, copia de seguridad en JSON y CSV. Coste: cero.

Mientras no configures Firebase, la app funciona en **modo prueba** (datos solo en ese dispositivo).

## 1. Subir el código a GitHub (repositorio público)
1. En github.com → **New repository** → nombre `inventario-hogar` → **Public** → Create.
2. Sube todos los archivos de esta carpeta (botón **Add file → Upload files**).
3. **Settings → Pages → Build and deployment → Source: Deploy from a branch → Branch: `main` / `(root)` → Save.**
4. En un minuto la app estará en `https://fernanyeles.github.io/inventario-hogar/`.

## 2. Crear la base de datos en Firebase (plan gratuito Spark, sin tarjeta)
1. Entra en console.firebase.google.com → **Crear proyecto** (puedes desactivar Google Analytics).
2. **Compilación → Firestore Database → Crear base de datos** → modo producción → ubicación `eur3` o `europe-west`.
3. **Compilación → Authentication → Comenzar → Correo electrónico/contraseña → Habilitar.**
4. En la pestaña **Users**, **Añadir usuario**: uno para ti y otro para tu pareja (correo + contraseña).
5. **Authentication → Configuración → Dominios autorizados → Agregar dominio:** `fernanyeles.github.io`.
6. **Configuración del proyecto (rueda) → Tus apps → icono `</>` (Web)** → registra la app → copia el objeto `firebaseConfig`
   y pégalo en `firebase-config.js` (sustituyendo `null`). Súbelo a GitHub.
7. **Firestore → Reglas:** pega el contenido de `firestore.rules`, cambiando los dos correos por los vuestros → **Publicar**.
   Sin este paso, cualquiera podría leer los datos.

## 3. Instalar en el móvil (los dos)
- **iPhone:** abre la dirección en Safari → Compartir → **Añadir a pantalla de inicio**.
- **Android:** abre la dirección en Chrome → menú ⋮ → **Instalar aplicación**.
Entrad con vuestro correo y contraseña. Lo que apunte uno lo ve el otro al instante, y funciona sin conexión.

## Notas
- Las claves de `firebase-config.js` no son secretas; la seguridad la dan las reglas del paso 7.
- Si cambias archivos, sube la versión nueva y cambia `const V = "inv-v1"` en `sw.js` (por `inv-v2`, etc.) para que los móviles se actualicen.
- Si algún día Firebase cambiara sus condiciones, exporta el JSON desde Ajustes.
