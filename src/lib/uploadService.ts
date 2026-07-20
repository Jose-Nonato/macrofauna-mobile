import { supabase } from "./supabase";
import * as FileSystem from "expo-file-system/legacy";

function generateSimpleUUID() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export async function uploadPhotoToStorage(
  fileUri: string,
  direction: string,
  sampleId: string
) {
  console.log(
    "📤 [UPLOAD] Iniciando upload. Direction:",
    direction,
    "Sample:",
    sampleId
  );

  try {
    // 1. Validar URI
    if (!fileUri) {
      throw new Error("URI do arquivo não fornecida");
    }

    // 2. Ler arquivo como base64 usando expo-file-system
    const base64Data = await FileSystem.readAsStringAsync(fileUri, {
      encoding: FileSystem.EncodingType.Base64,
    });
    console.log(
      "📤 [UPLOAD] Arquivo lido com sucesso. Tamanho (base64):",
      base64Data.length
    );

    // 3. Converter base64 para Uint8Array
    const binaryString = atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // 4. Gerar nome único e caminho
    const fileName = `${generateSimpleUUID()}.jpg`;
    const filePath = `${sampleId}/${direction}/${fileName}`;

    // 5. Fazer upload para Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("macrofauna")
      .upload(filePath, bytes, {
        contentType: "image/jpg",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Erro ao fazer upload: ${uploadError.message}`);
    }


    // 6. Obter URL pública
    const { data: publicUrlData } = supabase.storage
      .from("macrofauna")
      .getPublicUrl(filePath);

    const publicUrl = publicUrlData.publicUrl;

    // 7. Inserir registro na tabela photos
    const { data: photoRecord, error: insertError } = await supabase
      .from("photos")
      .insert({
        sample_id: sampleId,
        direction: direction,
        photo: publicUrl,
      })
      .select()
      .single();

    if (insertError) {
      throw new Error(`Erro ao registrar foto: ${insertError.message}`);
    }

    return photoRecord;
  } catch (error: any) {
    throw error;
  }
}

export async function uploadMultiplePhotos(
  photos: { uri: string; direction: string }[],
  sampleId: string
) {
  console.log(
    "📤 [UPLOAD MULTIPLE] Iniciando upload de",
    photos.length,
    "fotos"
  );

  const results = [];
  const errors = [];

  for (const photo of photos) {
    try {
      const result = await uploadPhotoToStorage(
        photo.uri,
        photo.direction,
        sampleId
      );
      results.push(result);
    } catch (error: any) {
      console.error(
        `❌ [UPLOAD MULTIPLE] Erro ao fazer upload da foto (${photo.direction}):`,
        error.message
      );
      errors.push({
        direction: photo.direction,
        error: error.message,
      });
    }
  }


  return { results, errors };
}
