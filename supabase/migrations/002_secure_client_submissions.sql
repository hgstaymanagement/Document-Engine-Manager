-- Apply this after 001_init.sql for existing Supabase projects.
-- Clients may only write submissions for their assigned barangays and published forms.

drop policy if exists submissions_insert on public.submissions;
drop policy if exists submissions_update on public.submissions;

create policy submissions_insert on public.submissions
  for insert to authenticated
  with check (
    public.is_admin()
    or (
      client_id = auth.uid()
      and barangay_id in (select public.assigned_barangay_ids())
      and exists (select 1 from public.forms f where f.id = form_id and f.published = true)
      and exists (
        select 1
        from public.form_versions fv
        where fv.id = form_version_id and fv.form_id = form_id
      )
    )
  );

create policy submissions_update on public.submissions
  for update to authenticated
  using (public.is_admin() or client_id = auth.uid())
  with check (
    public.is_admin()
    or (
      client_id = auth.uid()
      and barangay_id in (select public.assigned_barangay_ids())
      and exists (select 1 from public.forms f where f.id = form_id and f.published = true)
      and exists (
        select 1
        from public.form_versions fv
        where fv.id = form_version_id and fv.form_id = form_id
      )
    )
  );
