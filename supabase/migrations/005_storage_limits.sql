-- Phase 5: PDF bucket par server-side hadd (browser ki jaanch bypass hone par bhi rokti hai)
update storage.buckets
set file_size_limit = 52428800,                 -- 50 MB
    allowed_mime_types = array['application/pdf']
where id = 'books';
