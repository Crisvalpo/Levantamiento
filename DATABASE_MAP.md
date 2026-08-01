# 🗺️ Mapa del Mundo de Datos — Plataforma LukeAPP (Multi-Tenant)

Este documento es el **diccionario de datos vivo** y mapa arquitectónico de la plataforma `LukeAPP`. Está diseñado para que agencias de IA, bots conversacionales (Jaime, Andi, WhatsApp) y desarrolladores puedan navegar, consultar y entender la estructura de la base de datos de manera precisa.

> **Última actualización**: 2026-08-01  
> **Servidor**: Oracle Cloud Infrastructure ARM64 (`oracle-ssh`)  
> **Motor de Base de Datos**: PostgreSQL 15.8 (Supabase Self-Hosted)

---

## 🏢 1. Esquema `platform` (Gobernanza Multi-Empresa / Multi-Tenant)

El esquema `platform` gestiona los inquilinos corporativos (Tenants), unidades de negocio y el catálogo maestro de proyectos.

```
platform.empresa (Empresa Tenant)
       │
       ├──► platform.unidad_negocio (División / Unidad)
       │
       └──► platform.proyecto (Catálogo de Proyectos / Obras)
```

### 1.1 `platform.empresa`
Catálogo maestro de empresas clientes que utilizan la plataforma.

| Columna | Tipo | Nullable | Descripción de Negocio |
|---|---|---|---|
| `id` | `uuid` | NO (PK) | Identificador único global de la empresa. |
| `slug` | `text` | NO (UNIQUE) | Identificador corto alfanumérico (ej: `eimi`, `empresa-b`). |
| `razon_social` | `text` | NO | Nombre legal de la empresa (ej: `Echeverría Izquierdo Montajes Industriales S.A.`). |
| `rut` | `text` | SI (UNIQUE) | RUT o número de identificación tributaria (ej: `96.532.330-9`). |
| `activa` | `boolean` | NO | Estado de la empresa (`true` por defecto). |
| `creada_en` | `timestamptz` | NO | Fecha y hora de creación del registro. |

### 1.2 `platform.unidad_negocio`
Divisiones internas o unidades operativas pertenecientes a una empresa.

| Columna | Tipo | Nullable | Descripción de Negocio |
|---|---|---|---|
| `id` | `uuid` | NO (PK) | Identificador único de la unidad de negocio. |
| `empresa_id` | `uuid` | NO (FK) | Referencia a `platform.empresa(id)`. |
| `codigo` | `text` | NO | Código de la unidad (ej: `07`, `EMISA`). |
| `nombre` | `text` | NO | Nombre de la unidad (ej: `Montaje Electromecánico`). |

### 1.3 `platform.proyecto`
Catálogo maestro de proyectos u obras por empresa.

| Columna | Tipo | Nullable | Descripción de Negocio |
|---|---|---|---|
| `id` | `uuid` | NO (PK) | Identificador único del proyecto. |
| `empresa_id` | `uuid` | NO (FK) | Empresa propietaria del proyecto (`platform.empresa(id)`). |
| `unidad_id` | `uuid` | SI (FK) | Unidad de negocio (`platform.unidad_negocio(id)`). |
| `codigo` | `text` | NO | Código único de obra (ej: `EIMI00413`, `MIPE00101`). |
| `nombre` | `text` | NO | Descripción o nombre de la obra (ej: `Ejecución Montaje Espesador PMFC-DAND`). |
| `cliente_mandante` | `text` | SI | Cliente o mandante final del proyecto (ej: `CODELCO`, `CMPC PULP SpA`). |
| `ubicacion` | `text` | SI | Ubicación geográfica o planta (ej: `Andina / Los Andes`, `Nacimiento`). |
| `activo` | `boolean` | NO | `true` si el proyecto está vigente. |
| `creado_en` | `timestamptz` | NO | Fecha de creación del registro. |

---

## 📋 2. Esquema `levantamiento` (Módulo PipEI Terreno)

Almacena los levantamientos, encuestas y respuestas capturadas en obra.

```
platform.proyecto
       │
       └──► levantamiento.sesion (Entrevista / Levantador)
                 │
                 ├──► levantamiento.respuesta (Respuestas por pregunta)
                 │
                 └──► levantamiento.audio (Clips de voz grabados)
```

### 2.1 `levantamiento.sesion`
Sesiones de levantamiento iniciadas por entrevistadores en obra.

| Columna | Tipo | Nullable | Descripción de Negocio |
|---|---|---|---|
| `id` | `uuid` | NO (PK) | Identificador único de la sesión. |
| `empresa_id` | `uuid` | SI (FK) | Empresa a la que corresponde la sesión (`platform.empresa(id)`). |
| `proyecto_id` | `uuid` | SI (FK) | Proyecto evaluado (`platform.proyecto(id)`). |
| `proyecto` | `text` | NO | Código / Nombre del proyecto (respaldo en texto). |
| `entrevistador` | `text` | SI | Nombre de la persona que realiza el levantamiento. |
| `cargo` | `text` | SI | Cargo del entrevistador. |
| `dispositivo` | `text` | SI | User-Agent o dispositivo utilizado. |
| `creada_en` | `timestamptz` | NO | Fecha y hora de realización. |

### 2.2 `levantamiento.respuesta`
Respuestas individuales capturadas en cada pregunta del banco.

| Columna | Tipo | Nullable | Descripción de Negocio |
|---|---|---|---|
| `id` | `uuid` | NO (PK) | Identificador único de la respuesta. |
| `sesion_id` | `uuid` | NO (FK) | Sesión a la que pertenece (`levantamiento.sesion(id)`). |
| `pregunta_id` | `uuid/text` | NO | Código de la pregunta en el banco (ej: `ot.0.3`). |
| `departamento` | `text` | NO | Área o departamento evaluado (ej: `ot`, `calidad`). |
| `grupo` | `text` | SI | Título del grupo de preguntas (ej: `Re-spooleo`). |
| `pregunta` | `text` | NO | Enunciado completo de la pregunta. |
| `entrevistado` | `text` | SI | Persona que respondió en terreno. |
| `opcion` | `text` | SI | Opción elegida en alternativas. |
| `texto` | `text` | SI | Respuesta abierta o transcripción de voz. |
| `actualizada_en` | `timestamptz` | NO | Fecha de última actualización. |

---

## 🔍 3. Vistas Inteligentes para Agentes de IA

### 3.1 `platform.v_mapa_del_mundo`
Vista autogenerada que expone la estructura en vivo de todas las tablas, columnas, tipos de datos y significados de negocio para los Bots de IA.

```sql
SELECT * FROM platform.v_mapa_del_mundo;
```

### 3.2 `public.proyecto`
Vista pública que expone el catálogo dinámico de proyectos ordenados y formateados para consumo fácil de las aplicaciones cliente.

---

## 🔐 4. Matriz de Permisos & RLS

- Roles de PostgreSQL: `anon`, `authenticated`, `authenticator`.
- Jerarquía de Búsqueda (`search_path`): `platform`, `levantamiento`, `public`.
- RLS Habilitado: Todas las tablas tienen Row Level Security activado para garantizar aislamiento multi-tenant.
