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

alter table sesion    enable row level security;
alter table respuesta enable row level security;
alter table audio     enable row level security;

drop policy if exists p_sesion    on sesion;
drop policy if exists p_respuesta on respuesta;
drop policy if exists p_audio     on audio;

create policy p_sesion    on sesion    for all using (true) with check (true);
create policy p_respuesta on respuesta for all using (true) with check (true);
create policy p_audio     on audio     for all using (true) with check (true);

grant usage on schema levantamiento to anon, authenticated;
grant all on all tables in schema levantamiento to anon, authenticated;
grant select on v_consolidado, v_discrepancias, v_cobertura, v_pendiente_transcribir
  to anon, authenticated;

-- Bucket de audio (crear también desde el panel si se prefiere)
insert into storage.buckets (id, name, public)
values ('levantamiento-audio', 'levantamiento-audio', false)
on conflict (id) do nothing;
