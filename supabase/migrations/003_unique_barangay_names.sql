create unique index if not exists barangays_normalized_name_key
  on public.barangays (lower(btrim(name)));
