import { _supabase } from './supabase.js';

export async function uploadImage(bucket, file, path) {
    const { data, error } = await _supabase.storage
        .from(bucket)
        .upload(path, file, {
            cacheControl: '3600',
            upsert: true
        });

    if (error) throw error;

    const { data: { publicUrl } } = _supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

    return publicUrl;
}

export function setupImagePreview(inputId, previewId) {
    document.getElementById(inputId).onchange = evt => {
        const [file] = evt.target.files;
        if (file) document.getElementById(previewId).src = URL.createObjectURL(file);
    }
}