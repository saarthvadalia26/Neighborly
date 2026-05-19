import { createClient } from "./browser";

export async function uploadPostImage(file: File): Promise<string> {
  const supabase = createClient();
  
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    throw new Error('File must be a JPG, PNG, or WEBP image.');
  }
  
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('Image must be under 5MB.');
  }

  const fileExt = file.name.split('.').pop() || 'jpg';
  const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
  
  const { error: uploadError } = await supabase.storage
    .from('post_images')
    .upload(fileName, file, { upsert: false });

  if (uploadError) {
    throw new Error(`Failed to upload image: ${uploadError.message}`);
  }

  const { data } = supabase.storage
    .from('post_images')
    .getPublicUrl(fileName);

  return data.publicUrl;
}
