# Plan de laboratorio local · Plataforma de datos Kopar

> **Objetivo:** practicar sin costo, en la laptop, la arquitectura de la plataforma de datos (Beta 01): microservicios en contenedores, integración de datos y Terraform.
> **Entorno:** Windows + WSL2 (Ubuntu) + Docker Desktop + VSCodium + Claude Code.
> **Proyecto:** `~/Codium/DAT_01` (DAT_01 · Data Analysis Test 01) (dentro del sistema de archivos de WSL).
> **Ritmo estimado:** 8 semanas, 4–6 horas por semana.
> **Contexto relacionado:** `CONTEXTO_PLATAFORMA_DATOS.md`.

## Principio clave

Terraform se practica con el **proveedor de Docker** (`kreuzwerker/docker`): mismo flujo (`init`, `plan`, `apply`, estado, módulos, variables), pero crea contenedores locales. Cuando exista la cuenta de AWS, se cambia el proveedor.

## Equivalencias con el diagrama

| Diagrama (AWS) | Laboratorio local |
| --- | --- |
| ECS on Fargate | Contenedores Docker |
| ECR | Imágenes locales / GitHub Container Registry |
| VPC privada | Red de Docker |
| ALB | Nginx como proxy inverso |
| RDS PostgreSQL | Contenedor PostgreSQL (raw / curated / kpi) |
| Odoo (solo lectura) | `odoo-mock` con usuario de solo lectura |
| Capa de integración | `etl-service` |
| EventBridge | `docker compose run` o contenedor con cron |
| Secrets Manager | `.env` + Docker secrets |
| CloudWatch | Healthchecks + logs JSON (opcional Grafana + Loki) |
| Terraform en AWS | Terraform con proveedor Docker |

## Fases

### Fase 0 · Preparar el entorno (1 sesión)
- [ ] 0.1 Verificar WSL2 y Ubuntu
- [ ] 0.2 Limitar recursos con `.wslconfig`
- [ ] 0.3 Integrar Docker Desktop con WSL
- [ ] 0.4 Herramientas base de Ubuntu
- [ ] 0.5 Git y llave SSH para GitHub
- [ ] 0.6 Node.js LTS con nvm
- [ ] 0.7 Terraform desde el repositorio de HashiCorp
- [ ] 0.8 VSCodium conectado a WSL + extensiones
- [ ] 0.9 Claude Code dentro de WSL
- [ ] 0.10 Crear la estructura del proyecto
- [ ] 0.11 Verificación final

### Fase 1 · Un servicio en contenedor (semana 1)
- [ ] Spec de `kpi-api`
- [ ] `services/kpi-api`: Node + Express + TypeScript con `/health` y `/kpis/ventas`
- [ ] Dockerfile multi-stage, imagen ligera, usuario sin privilegios
- [ ] `docker build` y `docker run`

### Fase 2 · Base de datos y datos ficticios (semana 2)
- [ ] PostgreSQL en Docker Compose con esquemas raw, curated y kpi
- [ ] Datos ficticios de 12 meses: vendedores, clientes, productos, pedidos
- [ ] `kpi-api` calcula ventas por vendedor por mes

### Fase 3 · Frontend y proxy (semana 3)
- [ ] `apps/frontend`: Vue 3 + Vite + TypeScript + Pinia + `vue3-apexcharts`
- [ ] Tablero que consume `/kpis/ventas`
- [ ] Nginx: `/` al frontend, `/api` a `kpi-api`

### Fase 4 · Microservicios e integración (semanas 4–5)
- [ ] `odoo-mock` con tablas tipo Odoo y usuario de solo lectura
- [ ] `etl-service`: extrae → transforma → publica (raw → curated → kpi)
- [ ] Ejecución programada del ETL
- [ ] Secretos con `.env` y Docker secrets
- [ ] Healthchecks y logs JSON (opcional Grafana + Loki)

### Fase 5 · Terraform con proveedor Docker (semanas 6–7)
- [ ] Recrear el stack de Compose en Terraform
- [ ] Ciclo completo: init → plan → apply → cambio → plan → destroy
- [ ] Entender `terraform.tfstate`
- [ ] Módulo reutilizable `servicio`
- [ ] Ambientes dev y prod con `dev.tfvars` y `prod.tfvars`

### Fase 6 · CI/CD con GitHub Actions (semana 8)
- [ ] Repositorio privado en GitHub
- [ ] Workflow: lint, pruebas, build de imágenes, `terraform fmt -check`, `terraform validate`
- [ ] Publicar imágenes en GitHub Container Registry

### Fase 7 · Puente hacia AWS (con la cuenta del plan gratuito)
- [ ] Recursos AWS en Terraform: VPC, subredes, ECR, ECS, RDS
- [ ] `terraform validate` sin conexión; `plan` requiere credenciales; solo `apply` crea recursos

## Transversal
- Cada fase empieza con una spec en `docs/specs/`; Claude Code implementa a partir de ella.
- Al cerrar cada fase: marcar casillas, registrar aprendizajes en la bitácora.

## Bitácora

| Fecha | Fase | Avance / aprendizaje |
| --- | --- | --- |
| 2026-10-01 | 0 | Inicio del plan |
