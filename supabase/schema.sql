-- ════════════════════════════════════════════════════════════════════
-- ARQUITECTURA MULTI-TENANT & GOBERNANZA LUKEAPP
-- Esquema: platform (Plataforma Global) + levantamiento (PipEI Terreno)
-- ════════════════════════════════════════════════════════════════════

create schema if not exists platform;
create schema if not exists levantamiento;

set search_path = platform, levantamiento, public;

-- ════════════════════════════════════════════════════════════════════
-- 1. ESQUEMA platform (Gobernanza Multi-Empresa / Multi-Tenant)
-- ════════════════════════════════════════════════════════════════════

-- ── 1.1 platform.empresa ───────────────────────────────────────────
create table if not exists platform.empresa (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique not null,
  razon_social  text not null,
  rut           text unique,
  activa        boolean not null default true,
  creada_en     timestamptz not null default now()
);
comment on table platform.empresa is 'Catálogo maestro de empresas clientes (Tenants) en LukeAPP';
comment on column platform.empresa.slug is 'Identificador alfanumérico corto (ej: eimi, empresa-b)';
comment on column platform.empresa.razon_social is 'Nombre legal o razón social completa';

-- ── 1.2 platform.unidad_negocio ─────────────────────────────────────
create table if not exists platform.unidad_negocio (
  id            uuid primary key default gen_random_uuid(),
  empresa_id    uuid not null references platform.empresa(id) on delete cascade,
  codigo        text not null,
  nombre        text not null,
  unique (empresa_id, codigo)
);
comment on table platform.unidad_negocio is 'Divisiones o unidades de negocio operativas dentro de cada empresa';
comment on column platform.unidad_negocio.codigo is 'Código alfanumérico interno de la unidad (ej: 07, EMISA)';

-- ── 1.3 platform.proyecto ───────────────────────────────────────────
create table if not exists platform.proyecto (
  id                uuid primary key default gen_random_uuid(),
  empresa_id        uuid not null references platform.empresa(id) on delete cascade,
  unidad_id         uuid references platform.unidad_negocio(id),
  codigo            text not null,
  nombre            text not null,
  cliente_mandante  text,
  ubicacion         text,
  activo            boolean not null default true,
  creado_en         timestamptz not null default now(),
  unique (empresa_id, codigo)
);
comment on table platform.proyecto is 'Catálogo maestro de proyectos y obras por empresa cliente';
comment on column platform.proyecto.codigo is 'Código único de obra (ej: EIMI00413, MIPE00101)';
comment on column platform.proyecto.cliente_mandante is 'Cliente o mandante final (ej: CODELCO, CMPC PULP SpA)';

-- ════════════════════════════════════════════════════════════════════
-- 2. ESQUEMA levantamiento (Módulo PipEI Terreno)
-- ════════════════════════════════════════════════════════════════════

-- ── 2.1 levantamiento.sesion ───────────────────────────────────────
create table if not exists levantamiento.sesion (
  id             uuid primary key default gen_random_uuid(),
  empresa_id     uuid references platform.empresa(id),
  proyecto_id    uuid references platform.proyecto(id),
  proyecto       text not null,
  entrevistador  text,
  cargo          text,
  dispositivo    text,
  creada_en      timestamptz not null default now()
);
comment on table levantamiento.sesion is 'Sesiones de encuesta/entrevista realizadas en terreno por obra';

-- ── 2.2 levantamiento.respuesta ─────────────────────────────────────
create table if not exists levantamiento.respuesta (
  id              uuid primary key default gen_random_uuid(),
  sesion_id       uuid not null references levantamiento.sesion(id) on delete cascade,
  pregunta_id     text not null,
  departamento    text not null,
  grupo           text,
  pregunta        text not null,
  entrevistado    text,
  opcion          text,
  texto           text,
  actualizada_en  timestamptz not null default now(),
  unique (sesion_id, pregunta_id)
);
comment on table levantamiento.respuesta is 'Respuestas por alternativa o texto capturadas en obra';

create index if not exists ix_resp_preg on levantamiento.respuesta(pregunta_id);
create index if not exists ix_resp_dep  on levantamiento.respuesta(departamento);

-- ── 2.3 levantamiento.audio ────────────────────────────────────────
create table if not exists levantamiento.audio (
  id                    uuid primary key default gen_random_uuid(),
  sesion_id             uuid references levantamiento.sesion(id) on delete cascade,
  pregunta_id           text not null,
  clip_id               text not null unique,
  ruta                  text not null,
  duracion_seg          int,
  transcripcion         text,
  estado_transcripcion  text not null default 'pendiente'
                        check (estado_transcripcion in ('pendiente','procesando','lista','error','no_aplica')),
  creado_en             timestamptz not null default now()
);
comment on table levantamiento.audio is 'Clips de audio grabados en terreno y su estado de transcripción por IA';

create index if not exists ix_audio_estado on levantamiento.audio(estado_transcripcion)
  where estado_transcripcion = 'pendiente';

-- ════════════════════════════════════════════════════════════════════
-- 3. VISTAS INTELIGENTES & MAPA DEL MUNDO PARA AGENTES DE IA
-- ════════════════════════════════════════════════════════════════════

-- Vista viva "Mapa del Mundo": permite a Bots de IA descubrir la estructura en vivo
create or replace view platform.v_mapa_del_mundo as
select 
  t.table_schema          as esquema,
  t.table_name            as tabla,
  c.column_name           as columna,
  c.data_type             as tipo_dato,
  c.is_nullable           as permite_null,
  pgd.description         as significado_negocio
from information_schema.tables t
join information_schema.columns c 
  on t.table_schema = c.table_schema and t.table_name = c.table_name
left join pg_catalog.pg_statio_all_tables st 
  on st.schemaname = t.table_schema and st.relname = t.table_name
left join pg_catalog.pg_description pgd 
  on pgd.objoid = st.relid and pgd.objsubid = c.ordinal_position
where t.table_schema in ('platform', 'levantamiento', 'andina', 'equipos')
order by t.table_schema, t.table_name, c.ordinal_position;

-- Vistas analíticas de consolidación
create or replace view levantamiento.v_consolidado as
select
  r.pregunta_id,
  r.departamento,
  r.grupo,
  min(r.pregunta)                                       as pregunta,
  count(*)                                              as n_respuestas,
  count(distinct coalesce(r.opcion,''))
    filter (where r.opcion is not null)                 as n_opciones_distintas,
  bool_or(a.pregunta_id is not null)                    as tiene_audio,
  jsonb_agg(
    jsonb_build_object(
      'entrevistado', r.entrevistado,
      'entrevistador', s.entrevistador,
      'opcion',       r.opcion,
      'texto',        r.texto,
      'fecha',        r.actualizada_en
    ) order by r.actualizada_en
  )                                                     as respuestas
from levantamiento.respuesta r
join levantamiento.sesion s on s.id = r.sesion_id
left join lateral (
  select 1 as pregunta_id from levantamiento.audio a2
  where a2.pregunta_id = r.pregunta_id and a2.sesion_id = r.sesion_id limit 1
) a on true
group by r.pregunta_id, r.departamento, r.grupo;

create or replace view levantamiento.v_discrepancias as
select pregunta_id, departamento, pregunta, n_respuestas, n_opciones_distintas, respuestas
from levantamiento.v_consolidado
where n_opciones_distintas > 1
order by n_opciones_distintas desc, departamento;

create or replace view levantamiento.v_cobertura as
select departamento,
       count(distinct pregunta_id)                              as preguntas_respondidas,
       count(distinct sesion_id)                                as personas,
       max(actualizada_en)                                      as ultima_actividad
from levantamiento.respuesta
group by departamento
order by departamento;

create or replace view levantamiento.v_pendiente_transcribir as
select a.id, a.clip_id, a.ruta, a.pregunta_id, a.creado_en
from levantamiento.audio a
where a.estado_transcripcion = 'pendiente'
order by a.creado_en;

-- Vista pública simplificada de proyectos
drop view if exists public.proyecto cascade;
create or replace view public.proyecto as
select 
  p.id,
  p.codigo,
  p.nombre,
  p.cliente_mandante as cliente,
  p.ubicacion,
  u.codigo as unidad,
  e.slug as empresa_slug,
  p.activo
from platform.proyecto p
join platform.empresa e on e.id = p.empresa_id
left join platform.unidad_negocio u on u.id = p.unidad_id
where p.activo = true
order by p.codigo desc;


create or replace view public.v_mapa_del_mundo as
select * from platform.v_mapa_del_mundo;

-- ════════════════════════════════════════════════════════════════════
-- 4. POBLADO INICIAL MULTI-TENANT (EMPRESA EIMI / EMISA Y PROYECTOS)
-- ════════════════════════════════════════════════════════════════════

insert into platform.empresa (slug, razon_social, rut)
values ('eimi', 'Echeverría Izquierdo Montajes Industriales S.A.', '96.532.330-9')
on conflict (slug) do update set razon_social = excluded.razon_social, rut = excluded.rut;

insert into platform.unidad_negocio (empresa_id, codigo, nombre)
select id, 'EMISA', 'Montaje Electromecánico EIMI'
from platform.empresa where slug = 'eimi'
on conflict (empresa_id, codigo) do nothing;

-- Catálogo Maestro de Proyectos EIMI
with e as (select id from platform.empresa where slug = 'eimi' limit 1),
     u as (select id from platform.unidad_negocio where codigo = 'EMISA' limit 1)
insert into platform.proyecto (empresa_id, unidad_id, codigo, nombre, cliente_mandante, ubicacion)
values
  ((select id from e), (select id from u), 'EIMI00417', 'Contrato CC-006 Obras Civiles y Montaje Electromecánico PG210 Área Puerto', 'Collahuasi', 'Iquique'),
  ((select id from e), (select id from u), 'EIMI00416', 'EPV1 Servicio de Ingeniería Etapa FEED', null, null),
  ((select id from e), (select id from u), 'EIMI00415', 'PET0016-E Construcción y Montaje Condensadores Síncronos S/E Montemina', 'Montemina', 'Antofagasta'),
  ((select id from e), (select id from u), 'EIMI00414', 'Servicios de Obras Multidisciplinarias MGA Contrato 4600027683', 'CODELCO', 'Rancagua'),
  ((select id from e), (select id from u), 'EIMI00413', 'Ejecución Montaje Espesador de Cabeza PMFC-DAND', 'CODELCO', 'Andina / Los Andes'),
  ((select id from e), (select id from u), 'EIMI00412', 'Ejecución Montaje Electromecánico Proyecto Nuevas Prensas de Lodos Planta Santa Fe', 'CMPC PULP SpA', 'Nacimiento'),
  ((select id from e), (select id from u), 'EIMI00410', 'Apoyo EIMI Perú (Cerro Verde)', 'Sociedad Minera cerro verde', 'Arequipa'),
  ((select id from e), (select id from u), 'EIMI00409', 'Centro Operaciones Rancagua', null, 'Rancagua'),
  ((select id from e), (select id from u), 'EIMI00408', 'CC-030 Construcción y Montaje Área Seca Óxidos y Área Hidrometalurgia', null, 'Diego De Almagro'),
  ((select id from e), (select id from u), 'EIMI00407', 'Servicio de Constructibilidad del Proyecto Santo Domingo - Capstone Copper', 'Capstone Copper', null),
  ((select id from e), (select id from u), 'EIMI00406', 'Construcción Defensas Fluviales y Línea de Impulsión ACM Matadero', 'CODELCO', 'Rancagua'),
  ((select id from e), (select id from u), 'EIMI00405', 'Contrato Obras Uso de Recursos GPRO 2024', null, 'Rancagua'),
  ((select id from e), (select id from u), 'EIMI00404', 'Ejecución Obras Civiles Proyecto Nuevas Prensas de Lodos Planta Santa Fe', 'CMPC PULP SpA', 'Nacimiento'),
  ((select id from e), (select id from u), 'EIMI00403', 'Construcción OOCC y Montaje Electromecánico y Ampliación Botadero de Ripios Fase IX DRT', 'CODELCO', 'Calama'),
  ((select id from e), (select id from u), 'EIMI00402', 'Reemplazo y Cambio Tubos Caldera de Poder Línea 2 Planta Arauco', 'Planta Arauco', 'Arauco'),
  ((select id from e), (select id from u), 'EIMI00401', 'CC-031 Obras Misceláneos N2', null, 'Diego De Almagro'),
  ((select id from e), (select id from u), 'EIMI00400', 'Construcción y Montaje Electromecánico Paquete PG3A Proyecto Crecimiento Ujina', 'COMPAÑÍA MINERA DOÑA INÉS DE COLLAHUASI', 'Iquique'),
  ((select id from e), (select id from u), 'EIMI00398', 'Construcción y Montaje Etapa 1 Proyecto Prueba Piloto IP3 TCF Planta Valdivia', null, 'Valdivia'),
  ((select id from e), (select id from u), 'EIMI00397', 'Construcción y Montaje Condensadores Síncronos S/E Ana María', null, 'María Elena / Antofagasta'),
  ((select id from e), (select id from u), 'EIMI00396', 'C-744 Montaje Electromecánico - Proyecto de Reducción de Aguas CMPC Planta Pacífico', 'CMPC', 'Mininco / Collipulli'),
  ((select id from e), (select id from u), 'EIMI00395', 'Construcción y Montaje Civil Electromecánico Nuevo Concentrador 1D Planta Valdivia', null, 'Valdivia'),
  ((select id from e), (select id from u), 'EIMI00393', 'Obras de Mejoramiento Taller La Junta Contrato 4600027978', null, 'Rancagua'),
  ((select id from e), (select id from u), 'EIMI00389', 'K484 ENAP SWS and WSA Unit Aconcagua Refinery Chile I03 General Construction Works', 'TECNIMONT / ENAP', 'Concón'),
  ((select id from e), (select id from u), 'EIMI00388', 'Montaje Civil Electromecánico Proyecto Estanque de Contacto Planta Nueva Aldea', 'Arauco', 'Nueva Aldea'),
  ((select id from e), (select id from u), 'EIMI00387', 'EPC Muelle Centinela', null, 'Sierra Gorda / Centinela'),
  ((select id from e), (select id from u), 'EIMI00384', 'Electromecánico Proyecto Upgrade Evaporadores SF2 Planta San', 'CMPC', 'Nacimiento'),
  ((select id from e), (select id from u), 'EIMI00379', 'Servicios Multidisciplinarios', 'CODELCO', 'Rancagua'),
  ((select id from e), (select id from u), 'MIPE00103', 'Reubicación Sala Eléctrica Faja 10 Colección Polvos Cuajone', null, 'Cuajone'),
  ((select id from e), (select id from u), 'MIPE00102', 'Talleres de Mantenimiento Concentradora Cuajone', null, 'Cuajone'),
  ((select id from e), (select id from u), 'MIPE00101', 'Servicios Electromecánica Sistema de Manejo - Proyecto IPCC', 'Sociedad Minera cerro verde', 'Arequipa')
on conflict (empresa_id, codigo) do update set
  nombre = excluded.nombre,
  cliente_mandante = excluded.cliente_mandante,
  ubicacion = excluded.ubicacion,
  activo = true;

-- ════════════════════════════════════════════════════════════════════
-- 5. SEGURIDAD, POLÍTICAS RLS Y PERMISOS POSTGREST
-- ════════════════════════════════════════════════════════════════════

alter table platform.empresa        enable row level security;
alter table platform.unidad_negocio enable row level security;
alter table platform.proyecto       enable row level security;

alter table levantamiento.sesion    enable row level security;
alter table levantamiento.respuesta enable row level security;
alter table levantamiento.audio     enable row level security;

drop policy if exists p_platform_empresa on platform.empresa;
drop policy if exists p_platform_unidad  on platform.unidad_negocio;
drop policy if exists p_platform_proy    on platform.proyecto;
drop policy if exists p_lev_sesion       on levantamiento.sesion;
drop policy if exists p_lev_respuesta    on levantamiento.respuesta;
drop policy if exists p_lev_audio        on levantamiento.audio;

create policy p_platform_empresa on platform.empresa        for all using (true) with check (true);
create policy p_platform_unidad  on platform.unidad_negocio for all using (true) with check (true);
create policy p_platform_proy    on platform.proyecto       for all using (true) with check (true);
create policy p_lev_sesion       on levantamiento.sesion    for all using (true) with check (true);
create policy p_lev_respuesta    on levantamiento.respuesta for all using (true) with check (true);
create policy p_lev_audio        on levantamiento.audio     for all using (true) with check (true);

grant usage on schema platform, levantamiento, public to anon, authenticated;
grant all on all tables in schema platform, levantamiento to anon, authenticated;
grant select on platform.v_mapa_del_mundo, public.proyecto, public.v_mapa_del_mundo to anon, authenticated;
grant select on levantamiento.v_consolidado, levantamiento.v_discrepancias, levantamiento.v_cobertura, levantamiento.v_pendiente_transcribir to anon, authenticated;

-- Bucket de audio en storage
insert into storage.buckets (id, name, public)
values ('levantamiento-audio', 'levantamiento-audio', false)
on conflict (id) do nothing;
