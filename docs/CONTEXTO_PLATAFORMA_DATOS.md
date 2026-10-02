# Contexto del proyecto: Plataforma de datos Kopar

> **Versión actual:** Beta 01 · 2026-09-30
> **Responsable técnico:** Fernando Sierra (Data Analytics, Kopar)
> **Uso de este archivo:** contexto base para el asistente de IA y para el seguimiento de versiones del proyecto.

---

## 1. Propósito

Diseñar y construir la plataforma de datos internos de Kopar para medir KPIs del negocio y de las personas, con foco inicial en ventas. La plataforma parte de la propuesta de arquitectura de David y evoluciona hacia una base común y reutilizable, con potencial de crecer hacia Applied Industrial Technologies y sus empresas hermanas.

## 2. Personas y roles

| Persona | Rol en el proyecto |
| --- | --- |
| Fernando Sierra | Responsable técnico de Data Analytics: arquitectura, integración, automatización, seguridad, observabilidad |
| David | Jefe del área; mercadólogo con experiencia previa en este tipo de plataforma; autor de la arquitectura original |
| Guillermo | Especialista en procesos de Kopar (más de 20 años en la empresa); creó una aplicación con IA para conversar con los datos |
| Raúl | Especialista en manejo de almacenes |

## 3. Situación actual

| Elemento | Situación |
| --- | --- |
| Odoo | ERP vigente desde mediados de 2024; en la nube; se evalúa migrar a on-premise |
| SAPI | ERP desarrollado en Kopar; activo para administradores de datos; fuente de historia y de material que sigue en almacén |
| Infraestructura | Kopar opera hoy en OCI (Oracle Cloud); la propuesta original está en AWS |
| Identidad y colaboración | Microsoft 365 (Teams, OneDrive, correo); Entra ID disponible |
| Políticas | Applied tiene políticas estrictas de seguridad y nube, aún por documentar |
| Visualización | Interfaces propias; Power BI fuera de alcance; Ignition Perspective descartado por costo de licencia |
| Equipo de TI | Pocas personas para la migración de Odoo y la integración con Applied |

## 4. Arquitectura

### 4.1 Base: propuesta de David (se conserva)

- **Entrega:** VS Code, Docker, GitHub, GitHub Actions, ECR, ECS on Fargate.
- **Aplicación:** Vue 3 + Nginx (frontend), Node.js + Express (API), PostgreSQL en Amazon RDS.
- **Seguridad:** VPC con subred privada, grupos de seguridad, Secrets Manager, certificados TLS, ALB con HTTPS, Entra ID.
- **Operación:** CloudWatch (registros y alertas), EventBridge (tareas programadas), Route 53, S3, SES.
- **Datos:** bloque ETL con cargas programadas de Odoo.

### 4.2 Adiciones de la Beta 01

| Adición | Qué aporta | Estado |
| --- | --- | --- |
| Capa de integración compartida (Extractors → Transform/Contextualize → Publish) | Cada fuente se integra una vez; todas las apps reutilizan el mismo dato | Propuesta |
| ApexCharts en el frontend | Tableros de KPIs interactivos en las apps propias | Propuesta |
| Acceso por rol en la API | Cada persona ve los KPIs que le corresponden | Propuesta |
| Terraform | Infraestructura como código; ambientes dev y prod reproducibles; aplica a AWS u OCI | En evaluación (prueba de concepto) |
| Desarrollo guiado por especificaciones + IA | Especificaciones en el repositorio guían el desarrollo con Claude Code | Propuesta |
| SAPI como fuente | Historia y material en almacén junto a Odoo | Propuesta |
| PostgreSQL por zonas | raw · curada · KPIs | Propuesta |
| Chat con los datos + LLM local (LM Studio / Ollama) | Evolución de la iniciativa de IA del equipo, sin depender de tokens en la nube | Futuro |
| Fuentes de empresas Applied | Integración multiempresa | Futuro |

### 4.3 Herramienta de integración (por decidir)

Opciones: Flow Software, dbt o desarrollo propio en Node.js/SQL. Flow aporta contextualización y definición centralizada de KPIs, aunque su fortaleza principal es el dato industrial de series de tiempo; aquí el dato es transaccional (ventas, pedidos, personas). Criterios: costo de licencia, ajuste al dato transaccional, curva de aprendizaje del equipo, reutilización hacia Applied.

## 5. Stack tecnológico

| Capa | Tecnologías |
| --- | --- |
| Frontend | Vue 3, Vite, TypeScript, Pinia, PrimeVue, ApexCharts, Axios, HTML5, CSS3, Nginx |
| Backend | Node.js, Express, TypeScript |
| Integración | Odoo, SAPI, SQL, Flow / dbt / desarrollo propio (por evaluar) |
| Datos e IA | PostgreSQL, LLM local (LM Studio / Ollama), ML (futuro) |
| Calidad de código | VS Code / VSCodium, ESLint, Prettier, EditorConfig, Claude Code, desarrollo guiado por especificaciones |
| CI/CD + IaC | Docker, GitHub Actions, Terraform |
| Identidad y SO | Entra ID (Microsoft 365), Ubuntu, Bash |

Tecnologías nuevas para Fernando, en aprendizaje: servicios de AWS, frontend Vue, Terraform.

## 6. Hoja de ruta

| Fase | Horizonte | Entregables |
| --- | --- | --- |
| Primer valor visible | 0–90 días | 5–10 KPIs de ventas definidos con procesos · primer tablero de ventas (Odoo) con ApexCharts · repositorio, Docker y CI/CD · prueba de concepto de Terraform · políticas de Applied y Entra ID mapeados |
| Base compartida | 3–6 meses | Capa de integración v1 (Odoo + SAPI) · PostgreSQL por zonas · ambientes dev y prod · acceso por rol a KPIs de personas · piloto de chat con datos con LLM local |
| Reutilización | 6–12 meses | Catálogo de KPIs · nuevas apps sobre la plataforma · primer modelo de ML (pronóstico de ventas) · exploración de datos de una empresa Applied |
| Plataforma Applied | 12–24 meses | Integración multiempresa · modelo de datos armonizado · IA sobre datos gobernados · ML en operación continua |

## 7. Preguntas abiertas (para la Beta 02)

| # | Tema | Pregunta | Respuesta |
| --- | --- | --- | --- |
| 1 | Primeros resultados | ¿Qué resultado es el más valioso para ver primero, y en qué plazo? | |
| 2 | KPIs de personas | ¿Qué prioridad tienen frente a los del negocio, y cómo se usarán? | |
| 3 | Alcance | ¿Primeras herramientas internas o plataforma común hacia Applied? | |
| 4 | Nube | ¿Cómo se relaciona AWS con la infraestructura actual en OCI? | |
| 5 | Políticas | ¿Con quién revisamos las políticas de seguridad y nube de Applied? | |
| 6 | Ambientes | ¿Cómo separamos desarrollo y producción? | |
| 7 | Fuentes | ¿Qué sabemos de las fuentes de datos de las empresas de Applied? | |
| 8 | Odoo | ¿Cómo influye la migración a on-premise en los tiempos? | |
| 9 | Integración | ¿Flow, dbt o desarrollo propio? | |

## 8. Convenciones del proyecto

### Redacción
- Comunicación No Violenta y perspectiva Gestalt: partir de lo que es, lenguaje de observación sin juicio, enfoque en necesidades y hechos observables, sin modo defensivo.
- Las propuestas a David se presentan como evolución de su diseño: se reconoce lo que aporta y se agrega encima.
- El conocimiento del equipo (procesos, almacenes, iniciativa de IA) se presenta como valor que suma.

### Versionado
- Formato: `Beta NN` hasta que exista una versión acordada; después `v1.0`, `v1.1`…
- Cada imagen lleva la marca de versión y fecha en la esquina superior derecha.
- Nombres de archivo con sufijo de versión: `*_beta01.png`, `*_beta02.png`.
- Registrar cada versión en la tabla de historial (sección 10).

### Diagramas
- Se generan con Python a partir de `diagramas/` (`common.py`, `arch.py`, `vision.py`).
- Dependencias: `pip install cairosvg` y la fuente Lato instalada en el sistema.
- Paleta: navy `#14213D`, naranja `#C2571A`, gris `#4A5568`, fondo `#F5F3EE`.
- Naranja con relleno = agregado en la iteración; naranja punteado = futuro o por evaluar.
- Diagrama de arquitectura en inglés (continuidad con el original); visión y hoja de ruta en español.
- Para una nueva versión: actualizar la marca `BETA NN · fecha` y el sufijo de los archivos de salida.

## 9. Estructura sugerida del repositorio

```
kopar-data-platform/
├── CONTEXTO_PLATAFORMA_DATOS.md   # este archivo
├── docs/
│   ├── specs/                     # especificaciones por app o componente
│   ├── decisiones/                # registros de decisiones de arquitectura (ADR)
│   └── reuniones/                 # acuerdos con David y el equipo
├── diagramas/                     # scripts y salidas por versión
├── infra/                         # Terraform (cuando se adopte)
├── apps/
│   ├── frontend/                  # Vue 3 + ApexCharts
│   └── api/                       # Node.js + Express
└── integracion/                   # extractores, transformaciones, publicación
```

## 10. Historial de versiones

| Versión | Fecha | Cambio |
| --- | --- | --- |
| Beta 01 | 2026-09-30 | Primera propuesta: arquitectura evolucionada, visión, hoja de ruta, correo a David |
