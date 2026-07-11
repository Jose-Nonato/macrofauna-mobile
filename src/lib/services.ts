import { supabase } from "./supabase";

function generateSimpleUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function getSamples() {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) throw new Error("Usuário não autenticado");
  const { data, error } = await supabase
    .from("samples")
    .select("*")
    .eq("user_id", user.id)
    .order("id", { ascending: false });
  if (error) throw error;
  return data;
}

export async function getAllInsects() {
  const { data, error } = await supabase.from("insect").select("*");
  if (error) throw error;
  return data;
}

export async function getInsectsBySample(sampleId: any) {
  const { data, error } = await supabase
    .from("insect")
    .select("*")
    .eq("sample_id", sampleId);
  if (error) throw error;
  return data;
}

export async function createSample(sample: any) {
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) throw new Error("Usuário não autenticado");
  const { data, error } = await supabase
    .from("samples")
    .insert({ user_id: user.id, ...sample })
    .select()
    .single();
  if (error) {
    throw error;
  }
  return data;
}

export async function insertInsects(insects: any) {
  const { error } = await supabase.from("insect").insert(insects);
  if (error) {
    throw error;
  }
}

export async function insertPhotos(photos: any) {
  const { error } = await supabase.from("photos").insert(photos);
  if (error) throw error;
}

export async function updateSample(id: any, sample: any) {
    "🟢 [UPDATE SAMPLE] Atualizando amostra ID:",
    id,
    "com dados:",
    sample,
  );
  const { data: userData } = await supabase.auth.getUser();
  const user = userData.user;
  if (!user) throw new Error("Usuário não autenticado");
  const { data, error } = await supabase
    .from("samples")
    .update(sample)
    .eq("id", id)
    .select()
    .eq("user_id", user.id)
    .single();
  if (error) {
    throw error;
  }
  return data;
}

export async function deleteSample(sampleId: any) {
  const { error } = await supabase
    .from("samples")
    .update({ deleted: true })
    .eq("id", sampleId);
  if (error) throw error;
}

export async function uploadPhoto(
  fileUri: string,
  direction: string,
  sampleId: any,
) {
    "🟣 [UPLOAD PHOTO] Iniciando upload de foto. Direction:",
    direction,
    "URI:",
    fileUri,
  );
  const fileName = `${generateSimpleUUID()}.jpg`;
  const filePath = `${sampleId}/${direction}/${fileName}`;

  // Para React Native, convertemos o URI local para Blob para fazer upload correto
  try {
    const response = await fetch(fileUri);
    const fileBlob = await response.blob();

    const { error: uploadError } = await supabase.storage
      .from("macrofauna")
      .upload(filePath, fileBlob, {
        contentType: "image/jpeg",
      });
    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage.from("macrofauna").getPublicUrl(filePath);

    const { data: photo, error } = await supabase
      .from("photos")
      .insert({
        sample_id: sampleId,
        direction,
        photo: data.publicUrl,
      })
      .select()
      .single();
    if (error) {
        "🟣 [UPLOAD PHOTO] Erro ao inserir registro na tabela:",
        error,
      );
      throw error;
    }
    return photo;
  } catch (err) {
    throw err;
  }
}

export async function getPhotosBySample(sampleId: any) {
  const { data, error } = await supabase
    .from("photos")
    .select("*")
    .eq("sample_id", sampleId);
  if (error) throw error;
  return data;
}

export async function deletePhoto(photoId: any) {
  const { error } = await supabase.from("photos").delete().eq("id", photoId);
  if (error) throw error;
}
