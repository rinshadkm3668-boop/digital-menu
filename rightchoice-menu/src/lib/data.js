import { supabase, BUCKET } from './supabase';
import { optimizeImage } from './image';

// ---------- Public reads ----------
export async function fetchMenu() {
  const [cats, prods, settings] = await Promise.all([
    supabase.from('categories').select('*').order('sort_order').order('name'),
    supabase.from('products').select('*').order('sort_order').order('name'),
    supabase.from('settings').select('*').eq('id', 1).maybeSingle(),
  ]);
  const err = cats.error || prods.error || settings.error;
  if (err) throw err;
  return { categories: cats.data, products: prods.data, settings: settings.data };
}

// ---------- Owner writes (blocked by RLS for anyone else) ----------
export async function fetchAllAdmin() {
  // Owner sees hidden products too (RLS "owner all products").
  return fetchMenu();
}

export async function uploadImage(file) {
  const { blob, ext, contentType } = await optimizeImage(file);
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, {
    contentType,
    cacheControl: '31536000',
    upsert: false,
  });
  if (error) throw error;
  return path;
}

export async function deleteImage(path) {
  if (!path) return;
  await supabase.storage.from(BUCKET).remove([path]);
}

export async function saveProduct(values, oldImagePath) {
  const row = {
    name: values.name.trim(),
    description: (values.description || '').trim(),
    price: Number(values.price),
    category_id: values.category_id || null,
    diet: values.diet,
    status: values.status,
    image_path: values.image_path ?? null,
    is_demo: false,
  };
  if (!row.name) throw new Error('Name is required.');
  if (!Number.isFinite(row.price) || row.price < 0) throw new Error('Enter a valid price.');

  let res;
  if (values.id) {
    res = await supabase.from('products').update(row).eq('id', values.id).select().single();
  } else {
    res = await supabase.from('products').insert(row).select().single();
  }
  if (res.error) throw res.error;
  // Remove the previous photo only after the row has saved successfully.
  if (oldImagePath && oldImagePath !== row.image_path) await deleteImage(oldImagePath);
  return res.data;
}

export async function quickUpdateProduct(id, patch) {
  const { error } = await supabase.from('products').update(patch).eq('id', id);
  if (error) throw error;
}

export async function removeProduct(product) {
  const { error } = await supabase.from('products').delete().eq('id', product.id);
  if (error) throw error;
  await deleteImage(product.image_path);
}

export async function saveCategory(cat) {
  const name = cat.name.trim();
  if (!name) throw new Error('Category name is required.');
  if (cat.id) {
    const { error } = await supabase.from('categories').update({ name, sort_order: cat.sort_order }).eq('id', cat.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from('categories').insert({ name, sort_order: cat.sort_order ?? 0 });
    if (error) throw error;
  }
}

export async function removeCategory(id) {
  const { error } = await supabase.from('categories').delete().eq('id', id);
  if (error) throw error;
}

export async function saveSettings(values) {
  const { error } = await supabase
    .from('settings')
    .update({
      business_name: values.business_name,
      tagline: values.tagline,
      phone: values.phone,
      address: values.address,
      cover_image_path: values.cover_image_path ?? null,
    })
    .eq('id', 1);
  if (error) throw error;
}
