alter table public.events
add column if not exists display_until timestamptz;

comment on column public.events.display_until is
'UTC timestamp when an event should stop showing on the homepage; set from America/Los_Angeles admin input.';
