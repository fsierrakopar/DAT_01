# Spec 001 — kpi-api (Fase 1 de DAT_01)

| Campo | Valor |
|---|---|
| Proyecto | DAT_01 — Data Analysis Test 01 |
| Fase | 1 — Contenedor de kpi-api |
| Ubicación en el repo | `docs/specs/001-kpi-api.md` |
| Código del servicio | `services/kpi-api/` |
| Estado | Borrador para revisión |

## 1. Contexto

DAT_01 es un laboratorio local que replica, a escala, la arquitectura de la plataforma de datos de Kopar. La Fase 0 dejó listo el entorno: WSL2 con Ubuntu 24.04, Docker, Node 24 LTS, Git y Claude Code.

La Fase 1 construye el primer servicio: **kpi-api**, una API que entrega indicadores (KPIs) de ventas. En esta fase los datos vienen de un archivo de ejemplo dentro del código. En la Fase 2 esa fuente se reemplaza por PostgreSQL, y en la Fase 3 el frontend en Vue consume estos mismos endpoints.

## 2. Objetivo

Al terminar esta fase existe una API que:

1. Responde KPIs de ventas calculados a partir de datos de ejemplo fijos.
2. Corre dentro de un contenedor Docker construido con un Dockerfile multi-stage.
3. Cuenta con pruebas automáticas que verifican sus cálculos y sus respuestas HTTP.
4. Tiene la fuente de datos aislada detrás de una interfaz, lista para cambiarse a PostgreSQL en la Fase 2.

## 3. Stack técnico

| Pieza | Elección | Para qué sirve |
|---|---|---|
| Runtime | Node.js 24 LTS | Ejecuta JavaScript en el servidor |
| Lenguaje | TypeScript (modo `strict`) | JavaScript con tipos; detecta errores antes de ejecutar |
| Framework HTTP | Express 5 | Recibe peticiones y las dirige al código correcto |
| Ejecución en desarrollo | `tsx` (modo watch) | Corre TypeScript directo y reinicia al guardar |
| Compilación | `tsc` | Convierte TypeScript a JavaScript para producción |
| Pruebas | Vitest + Supertest | Vitest ejecuta pruebas; Supertest simula peticiones HTTP |
| Contenedor | Docker, imagen base `node:24-alpine` | Empaqueta la API con todo lo que necesita |

## 4. Estructura de carpetas

```
services/kpi-api/
├── src/
│   ├── app.ts                   # Crea y configura la app Express (exportada para pruebas)
│   ├── server.ts                # Arranca el servidor en el puerto configurado
│   ├── config.ts                # Lee variables de entorno con valores por defecto
│   ├── types.ts                 # Tipos compartidos (SaleRecord, respuestas)
│   ├── routes/
│   │   ├── health.routes.ts     # /health y /version
│   │   └── kpi.routes.ts        # /api/v1/kpis/...
│   ├── services/
│   │   └── kpi.service.ts       # Cálculos de KPIs (funciones puras)
│   ├── repositories/
│   │   ├── sales.repository.ts  # Interfaz SalesRepository
│   │   └── fixture.sales.repository.ts  # Implementación con datos de ejemplo
│   ├── data/
│   │   └── sales.fixture.ts     # Datos de ejemplo fijos
│   └── middleware/
│       ├── request-logger.ts    # Una línea de log por petición
│       └── error-handler.ts     # Respuestas de error con formato común
├── tests/
│   ├── kpi.service.test.ts      # Pruebas unitarias
│   └── api.test.ts              # Pruebas de integración HTTP
├── Dockerfile
├── .dockerignore
├── package.json
├── tsconfig.json
└── vitest.config.ts
```

La separación en capas sigue este flujo: **route → service → repository → data**. Cada capa conoce solo a la siguiente. Gracias a esto, la Fase 2 agrega `postgres.sales.repository.ts` y cambia una línea de configuración, mientras rutas, cálculos y pruebas permanecen iguales.

## 5. Modelo de datos

```ts
export interface SaleRecord {
  id: string;            // ej. "S-2025-0001"
  date: string;          // formato ISO "YYYY-MM-DD"
  region: Region;        // "Centro" | "Norte" | "Bajio"
  productLine: ProductLine; // "Automatizacion" | "Refacciones" | "Servicios"
  customer: string;      // nombre ficticio de cliente
  amountMxn: number;     // monto en pesos, con 2 decimales
}
```

### Datos de ejemplo (`sales.fixture.ts`)

- Cubren los 12 meses de 2025.
- Cada mes contiene al menos un registro por región.
- Total aproximado: entre 60 y 120 registros.
- Los valores están escritos de forma fija en el archivo (sin generación aleatoria), para que las pruebas siempre obtengan los mismos resultados.
- Los clientes son nombres ficticios.

### Interfaz del repositorio

```ts
export interface SalesRepository {
  findByDateRange(from: string, to: string): Promise<SaleRecord[]>;
}
```

El método es asíncrono (`Promise`) desde ahora porque PostgreSQL lo será en la Fase 2; así el resto del código ya está preparado.

## 6. Endpoints

Todas las respuestas son JSON. Los montos se redondean a 2 decimales y los porcentajes a 1 decimal.

### 6.1 `GET /health`

Indica que el servicio está activo. Lo usa el `HEALTHCHECK` de Docker.

```json
{ "status": "ok", "uptimeSeconds": 42 }
```

### 6.2 `GET /version`

```json
{ "name": "kpi-api", "version": "0.1.0", "commit": "dev" }
```

`version` proviene de `package.json`; `commit` de la variable `GIT_SHA` (valor por defecto `"dev"`).

### 6.3 `GET /api/v1/kpis/sales/summary?from=YYYY-MM-DD&to=YYYY-MM-DD`

Resumen de ventas en un periodo (ambas fechas incluidas).

```json
{
  "period": { "from": "2025-01-01", "to": "2025-03-31" },
  "totalMxn": 1250000.00,
  "orderCount": 24,
  "averageTicketMxn": 52083.33
}
```

`averageTicketMxn` = `totalMxn / orderCount`; cuando `orderCount` es 0, vale 0.

### 6.4 `GET /api/v1/kpis/sales/monthly?year=YYYY`

Ventas por mes. Siempre devuelve los 12 meses, con 0 en los meses sin registros.

```json
{
  "year": 2025,
  "months": [
    { "month": "2025-01", "totalMxn": 410000.00, "orderCount": 8 }
  ]
}
```

### 6.5 `GET /api/v1/kpis/sales/by-region?from=YYYY-MM-DD&to=YYYY-MM-DD`

Ventas por región, ordenadas de mayor a menor `totalMxn`. La suma de `sharePct` es 100 (con tolerancia de ±0.1 por redondeo).

```json
{
  "period": { "from": "2025-01-01", "to": "2025-12-31" },
  "regions": [
    { "region": "Centro", "totalMxn": 2100000.00, "sharePct": 42.0 }
  ]
}
```

### 6.6 Validación y errores

| Situación | Código | `error.code` |
|---|---|---|
| Fecha con formato distinto a `YYYY-MM-DD` | 400 | `INVALID_DATE` |
| `from` posterior a `to` | 400 | `INVALID_RANGE` |
| Falta un parámetro requerido | 400 | `MISSING_PARAM` |
| `year` fuera de 2000–2100 o no numérico | 400 | `INVALID_YEAR` |
| Ruta inexistente | 404 | `NOT_FOUND` |
| Error interno | 500 | `INTERNAL_ERROR` |

Formato común de error:

```json
{ "error": { "code": "INVALID_RANGE", "message": "from (2025-05-01) es posterior a to (2025-01-01)" } }
```

Los errores 500 registran el detalle en el log y entregan al cliente un mensaje general.

## 7. Configuración

| Variable | Valor por defecto | Uso |
|---|---|---|
| `PORT` | `3000` | Puerto donde escucha la API |
| `GIT_SHA` | `dev` | Identificador del commit, mostrado en `/version` |
| `NODE_ENV` | `development` | Ambiente de ejecución |

## 8. Logging

Una línea JSON por petición, escrita en la salida estándar (stdout), donde Docker la recoge:

```json
{"ts":"2026-10-05T16:00:00.000Z","method":"GET","path":"/health","status":200,"durationMs":3}
```

La observabilidad completa (métricas, trazas) corresponde a la Fase 4.

## 9. Pruebas

### 9.1 Unitarias (`kpi.service.test.ts`)

Verifican las funciones de cálculo con datos pequeños definidos dentro de la propia prueba:

1. `summary` suma correctamente montos y cuenta pedidos.
2. `summary` con lista vacía devuelve total 0, conteo 0 y ticket promedio 0.
3. `monthly` devuelve exactamente 12 meses, con 0 en los meses sin datos.
4. `byRegion` ordena de mayor a menor y los porcentajes suman 100 (±0.1).
5. Los montos resultantes tienen como máximo 2 decimales.

### 9.2 Integración HTTP (`api.test.ts`)

Usan Supertest sobre la app exportada en `app.ts` (sin abrir un puerto real):

1. `GET /health` → 200 y `status: "ok"`.
2. `GET /version` → 200 con `name`, `version` y `commit`.
3. `GET /api/v1/kpis/sales/summary` con rango válido → 200 y la forma de respuesta de la sección 6.3.
4. `GET /api/v1/kpis/sales/monthly?year=2025` → 200 y 12 elementos en `months`.
5. `GET /api/v1/kpis/sales/by-region` con rango válido → 200 y regiones ordenadas.
6. Fecha mal formada → 400 con `INVALID_DATE`.
7. `from` posterior a `to` → 400 con `INVALID_RANGE`.
8. Ruta inexistente → 404 con `NOT_FOUND`.

### 9.3 Scripts de `package.json`

| Script | Acción |
|---|---|
| `npm run dev` | Arranca con `tsx` en modo watch |
| `npm run build` | Compila con `tsc` a `dist/` |
| `npm start` | Ejecuta `node dist/server.js` |
| `npm test` | Ejecuta todas las pruebas con Vitest |
| `npm run typecheck` | Revisa tipos con `tsc --noEmit` |

## 10. Contenedor

### 10.1 Dockerfile multi-stage

Un Dockerfile multi-stage construye la imagen en dos etapas: la primera compila, la segunda conserva solo lo necesario para ejecutar. El resultado es una imagen más ligera y con menos superficie de ataque.

- **Etapa `build`** (`node:24-alpine`): instala todas las dependencias con `npm ci`, compila con `npm run build`.
- **Etapa `runtime`** (`node:24-alpine`): instala solo dependencias de producción (`npm ci --omit=dev`), copia `dist/` desde la etapa `build`, ejecuta con el usuario `node` (sin privilegios de root), expone el puerto 3000.
- `HEALTHCHECK` que consulta `/health` cada 30 s, usando `wget` (incluido en Alpine).
- `ARG GIT_SHA` que se pasa como variable de entorno a la imagen.

### 10.2 `.dockerignore`

Incluye al menos: `node_modules`, `dist`, `tests`, `.git`, `*.md`, `.env*`.

### 10.3 Comandos de referencia

```bash
cd services/kpi-api
docker build -t kpi-api:0.1.0 --build-arg GIT_SHA=$(git rev-parse --short HEAD) .
docker run --rm -p 3000:3000 --name kpi-api kpi-api:0.1.0
curl http://localhost:3000/health
docker ps   # la columna STATUS muestra (healthy) tras ~30 s
```

## 11. Criterios de aceptación

La Fase 1 está completa cuando:

- [ ] `npm run typecheck` termina sin errores.
- [ ] `npm test` pasa las 13 pruebas descritas en la sección 9.
- [ ] `npm run dev` responde en `http://localhost:3000` los 5 endpoints.
- [ ] `docker build` genera la imagen y `docker images` reporta un tamaño menor a 250 MB.
- [ ] El contenedor corre como usuario `node` (`docker exec kpi-api whoami` devuelve `node`).
- [ ] `docker ps` muestra el contenedor en estado `healthy`.
- [ ] Cada petición produce una línea de log JSON visible con `docker logs kpi-api`.
- [ ] El README de `services/kpi-api/` explica cómo correr, probar y construir el servicio.
- [ ] Los cambios están en commits con mensajes descriptivos y subidos a GitHub.

## 12. Continuidad hacia fases siguientes

| Tema | Fase |
|---|---|
| PostgreSQL con esquemas `raw`, `curated`, `kpi` y `PostgresSalesRepository` | 2 |
| Frontend Vue 3 + ApexCharts que consume estos endpoints, detrás de Nginx | 3 |
| Contrato OpenAPI, autenticación, métricas y trazas | 4 |
| Orquestación del contenedor con Terraform (provider Docker) | 5 |
| CI en GitHub Actions y publicación de la imagen en GHCR | 6 |

## 13. Secuencia sugerida de trabajo con Claude Code

Cada paso termina con un commit, lo que permite revisar y aprender de cada avance por separado.

1. Inicializar `services/kpi-api/` con `package.json`, `tsconfig.json` y Express; `/health` funcionando con `npm run dev`.
2. Agregar Vitest + Supertest y la primera prueba de `/health`.
3. Definir tipos, `sales.fixture.ts` y la interfaz `SalesRepository` con su implementación de fixture.
4. Implementar `kpi.service.ts` junto con sus pruebas unitarias.
5. Implementar las rutas de KPIs, validación y manejo de errores, junto con sus pruebas de integración.
6. Agregar logging por petición y `/version`.
7. Escribir Dockerfile y `.dockerignore`; construir, correr y verificar `healthy`.
8. Escribir el README y recorrer la lista de criterios de aceptación.

## 14. Glosario

| Término | Significado |
|---|---|
| Endpoint | Dirección de la API que responde a un tipo de pregunta (análogo a un tag) |
| Fixture | Conjunto fijo de datos de ejemplo usado para desarrollar y probar |
| Repository | Capa que sabe de dónde vienen los datos; el resto del código solo le pide lo que necesita |
| Función pura | Función que, con la misma entrada, siempre da la misma salida, sin efectos externos |
| Multi-stage | Dockerfile con varias etapas; la imagen final conserva solo la última |
| Healthcheck | Consulta periódica que Docker hace al contenedor para saber si está sano |
| Prueba unitaria | Verifica una pieza aislada (análogo a un bench test) |
| Prueba de integración | Verifica el sistema respondiendo una petición real (análogo a un loop check en SAT) |
