-- ════════════════════════════════════════════════════════════════════
-- PipEI · Levantamiento en terreno
-- Esquema propio, aislado del resto de la base.
--   psql < schema.sql     o     supabase db push
-- ════════════════════════════════════════════════════════════════════

create schema if not exists levantamiento;
set search_path = levantamiento, public;

-- ── sesión: una por persona que levanta ────────────────────────────
create table if not exists sesion (
  id             uuid primary key default gen_random_uuid(),
  proyecto       text not null,
  entrevistador  text,
  cargo          text,
  dispositivo    text,
  creada_en      timestamptz not null default now()
);

-- ── respuesta: una por pregunta y sesión ───────────────────────────
create table if not exists respuesta (
  id              uuid primary key default gen_random_uuid(),
  sesion_id       uuid not null references sesion(id) on delete cascade,
  pregunta_id     text not null,          -- p.ej. ot.0.3
  departamento    text not null,
  grupo           text,
  pregunta        text not null,          -- se guarda el enunciado: el banco puede cambiar
  entrevistado    text,                   -- con quién se conversó
  opcion          text,                   -- respuesta de selección
  texto           text,                   -- respuesta abierta o transcripción
  actualizada_en  timestamptz not null default now(),
  unique (sesion_id, pregunta_id)
);
create index if not exists ix_resp_preg on respuesta(pregunta_id);
create index if not exists ix_resp_dep  on respuesta(departamento);

-- ── audio: se sube cuando hay señal, se transcribe después ──────────
create table if not exists audio (
  id                    uuid primary key default gen_random_uuid(),
  sesion_id             uuid references sesion(id) on delete cascade,
  pregunta_id           text not null,
  clip_id               text not null unique,
  ruta                  text not null,     -- objeto en storage
  duracion_seg          int,
  transcripcion         text,
  estado_transcripcion  text not null default 'pendiente'
                        check (estado_transcripcion in ('pendiente','procesando','lista','error','no_aplica')),
  creado_en             timestamptz not null default now()
);
create index if not exists ix_audio_estado on audio(estado_transcripcion)
  where estado_transcripcion = 'pendiente';

-- ════════════════════════════════════════════════════════════════════
-- CONSOLIDACIÓN
-- El dato no se entrega como volcado: se entrega comparado.
-- ════════════════════════════════════════════════════════════════════

-- Todas las respuestas a una misma pregunta, con sus autores.
create or replace view v_consolidado as
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
from respuesta r
join sesion s on s.id = r.sesion_id
left join lateral (
  select 1 as pregunta_id from audio a2
  where a2.pregunta_id = r.pregunta_id and a2.sesion_id = r.sesion_id limit 1
) a on true
group by r.pregunta_id, r.departamento, r.grupo;

-- Preguntas donde las respuestas de selección no coinciden.
-- Es la vista que importa: ahí es donde el sistema se va a romper.
create or replace view v_discrepancias as
select pregunta_id, departamento, pregunta, n_respuestas, n_opciones_distintas, respuestas
from v_consolidado
where n_opciones_distintas > 1
order by n_opciones_distintas desc, departamento;

-- Cobertura por departamento.
create or replace view v_cobertura as
select departamento,
       count(distinct pregunta_id)                              as preguntas_respondidas,
       count(distinct sesion_id)                                as personas,
       max(actualizada_en)                                      as ultima_actividad
from respuesta
group by departamento
order by departamento;

-- Audios sin transcribir, para que el proceso de IA los tome.
create or replace view v_pendiente_transcribir as
select a.id, a.clip_id, a.ruta, a.pregunta_id, a.creado_en
from audio a
where a.estado_transcripcion = 'pendiente'
order by a.creado_en;

-- ════════════════════════════════════════════════════════════════════
-- ACCESO
-- El levantamiento es interno y de corta duración: se abre con la clave
-- anónima. Si se expone fuera de la red corporativa, reemplazar por
-- políticas ligadas a auth.uid().
-- ════════════════════════════════════════════════════════════════════

-- ── proyecto: catálogo dinámico de proyectos de la unidad ──────────
create table if not exists proyecto (
  codigo        text primary key,
  nombre        text not null,
  cliente       text,
  ubicacion     text,
  unidad        text,
  activo        boolean not null default true,
  creado_en     timestamptz not null default now()
);

alter table sesion    enable row level security;
alter table respuesta enable row level security;
alter table audio     enable row level security;
alter table proyecto  enable row level security;

drop policy if exists p_sesion    on sesion;
drop policy if exists p_respuesta on respuesta;
drop policy if exists p_audio     on audio;
drop policy if exists p_proyecto  on proyecto;

create policy p_sesion    on sesion    for all using (true) with check (true);
create policy p_respuesta on respuesta for all using (true) with check (true);
create policy p_audio     on audio     for all using (true) with check (true);
create policy p_proyecto  on proyecto  for all using (true) with check (true);

grant usage on schema levantamiento to anon, authenticated;
grant all on all tables in schema levantamiento to anon, authenticated;
grant select on v_consolidado, v_discrepancias, v_cobertura, v_pendiente_transcribir
  to anon, authenticated;

-- Poblado inicial de catálogo de proyectos
insert into proyecto (codigo, nombre, cliente, ubicacion, unidad) values
  ('EIMI00417', 'Contrato CC-006 Obras Civiles y Montaje Electromecánico PG210 Área Puerto', 'Collahuasi', 'Iquique', 'EMISA'),
  ('EIMI00416', 'EPV1 Servicio de Ingeniería Etapa FEED', null, null, 'EMISA'),
  ('EIMI00415', 'PET0016-E Construcción y Montaje Condensadores Síncronos S/E Montemina', 'Montemina', 'Antofagasta', 'EMISA'),
  ('EIMI00414', 'Servicios de Obras Multidisciplinarias MGA Contrato 4600027683', 'CODELCO', 'Rancagua', 'EMISA'),
  ('EIMI00413', 'Ejecución Montaje Espesador de Cabeza PMFC-DAND', 'CODELCO', 'Andina / Los Andes', 'EMISA'),
  ('EIMI00412', 'Ejecución Montaje Electromecánico Proyecto Nuevas Prensas de Lodos Planta Santa Fe', 'CMPC PULP SpA', 'Nacimiento', 'EMISA'),
  ('EIMI00410', 'Apoyo EIMI Perú (Cerro Verde)', 'Sociedad Minera cerro verde', 'Arequipa', 'EMISA'),
  ('EIMI00409', 'Centro Operaciones Rancagua', null, 'Rancagua', 'EMISA'),
  ('EIMI00408', 'CC-030 Construcción y Montaje Área Seca Óxidos y Área Hidrometalurgia', null, 'Diego De Almagro', 'EMISA'),
  ('EIMI00407', 'Servicio de Constructibilidad del Proyecto Santo Domingo - Capstone Copper', 'Capstone Copper', null, 'EMISA'),
  ('EIMI00406', 'Construcción Defensas Fluviales y Línea de Impulsión ACM Matadero', 'CODELCO', 'Rancagua', 'EMISA'),
  ('EIMI00405', 'Contrato Obras Uso de Recursos GPRO 2024', null, 'Rancagua', 'EMISA'),
  ('EIMI00404', 'Ejecución Obras Civiles Proyecto Nuevas Prensas de Lodos Planta Santa Fe', 'CMPC PULP SpA', 'Nacimiento', 'EMISA'),
  ('EIMI00403', 'Construcción OOCC y Montaje Electromecánico y Ampliación Botadero de Ripios Fase IX DRT', 'CODELCO', 'Calama', 'EMISA'),
  ('EIMI00402', 'Reemplazo y Cambio Tubos Caldera de Poder Línea 2 Planta Arauco', 'Planta Arauco', 'Arauco', 'EMISA'),
  ('EIMI00401', 'CC-031 Obras Misceláneos N2', null, 'Diego De Almagro', 'EMISA'),
  ('EIMI00400', 'Construcción y Montaje Electromecánico Paquete PG3A Proyecto Crecimiento Ujina', 'COMPAÑÍA MINERA DOÑA INÉS DE COLLAHUASI', 'Iquique', 'EMISA'),
  ('EIMI00398', 'Construcción y Montaje Etapa 1 Proyecto Prueba Piloto IP3 TCF Planta Valdivia', null, 'Valdivia', 'EMISA'),
  ('EIMI00397', 'Construcción y Montaje Condensadores Síncronos S/E Ana María', null, 'María Elena / Antofagasta', 'EMISA'),
  ('EIMI00396', 'C-744 Montaje Electromecánico - Proyecto de Reducción de Aguas CMPC Planta Pacífico', 'CMPC', 'Mininco / Collipulli', 'EMISA'),
  ('EIMI00395', 'Construcción y Montaje Civil Electromecánico Nuevo Concentrador 1D Planta Valdivia', null, 'Valdivia', 'EMISA'),
  ('EIMI00393', 'Obras de Mejoramiento Taller La Junta Contrato 4600027978', null, 'Rancagua', 'EMISA'),
  ('EIMI00389', 'K484 ENAP SWS and WSA Unit Aconcagua Refinery Chile I03 General Construction Works', 'TECNIMONT / ENAP', 'Concón', 'EMISA'),
  ('EIMI00388', 'Montaje Civil Electromecánico Proyecto Estanque de Contacto Planta Nueva Aldea', 'Arauco', 'Nueva Aldea', 'EMISA'),
  ('EIMI00387', 'EPC Muelle Centinela', null, 'Sierra Gorda / Centinela', 'EMISA'),
  ('EIMI00384', 'Electromecánico Proyecto Upgrade Evaporadores SF2 Planta San', 'CMPC', 'Nacimiento', 'EMISA'),
  ('EIMI00379', 'Servicios Multidisciplinarios', 'CODELCO', 'Rancagua', 'EMISA'),
  ('MIPE00103', 'Reubicación Sala Eléctrica Faja 10 Colección Polvos Cuajone', null, 'Cuajone', 'EMISA'),
  ('MIPE00102', 'Talleres de Mantenimiento Concentradora Cuajone', null, 'Cuajone', 'EMISA'),
  ('MIPE00101', 'Servicios Electromecánica Sistema de Manejo - Proyecto IPCC', 'Sociedad Minera cerro verde', 'Arequipa', 'EMISA')
on conflict (codigo) do update set
  nombre = excluded.nombre,
  cliente = excluded.cliente,
  ubicacion = excluded.ubicacion,
  unidad = excluded.unidad,
  activo = true;

-- Bucket de audio (crear también desde el panel si se prefiere)
insert into storage.buckets (id, name, public)
values ('levantamiento-audio', 'levantamiento-audio', false)
on conflict (id) do nothing;

