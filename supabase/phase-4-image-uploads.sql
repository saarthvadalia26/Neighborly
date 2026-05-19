-- Phase 4: Image Uploads

-- 1. Create a new public storage bucket named post_images
insert into storage.buckets (id, name, public) 
values ('post_images', 'post_images', true);

-- 2. Add image_url column to posts table
alter table public.posts add column image_url text;

-- 3. Row Level Security for post_images bucket
-- Note: the 'storage.objects' table uses 'bucket_id' and 'owner' columns.

-- Anyone can view post images
create policy "Anyone can view post images"
on storage.objects for select
to public
using ( bucket_id = 'post_images' );

-- Authenticated users can upload images
create policy "Authenticated users can upload images"
on storage.objects for insert
to authenticated
with check ( bucket_id = 'post_images' );

-- Users can update their own images
create policy "Users can update their own images"
on storage.objects for update
to authenticated
using ( bucket_id = 'post_images' and owner = auth.uid() );

-- Users can delete their own images
create policy "Users can delete their own images"
on storage.objects for delete
to authenticated
using ( bucket_id = 'post_images' and owner = auth.uid() );
