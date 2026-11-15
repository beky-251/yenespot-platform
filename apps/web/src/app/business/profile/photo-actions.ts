"use server";

import { requireRole } from "@/lib/auth/dal";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const ALLOWED_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

async function hasValidImageSignature(file: File): Promise<boolean> {
  const bytes = new Uint8Array(await file.slice(0, 12).arrayBuffer());

  if (file.type === "image/jpeg") {
    return bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  }

  if (file.type === "image/png") {
    return (
      bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a
    );
  }

  if (file.type === "image/webp") {
    return (
      bytes.length >= 12 &&
      String.fromCharCode(...bytes.slice(0, 4)) === "RIFF" &&
      String.fromCharCode(...bytes.slice(8, 12)) === "WEBP"
    );
  }

  return false;
}

export async function uploadBusinessPhoto(formData: FormData) {
  try {
    const user = await requireRole(["business_owner"]);
    const supabase = await createClient();

    const businessId = formData.get("businessId");
    const file = formData.get("photo");
    const captionValue = formData.get("caption");
    const caption =
      typeof captionValue === "string" ? captionValue.trim() : "";

    if (caption.length > 300) {
      return {
        success: false,
        message: "Caption must be 300 characters or fewer.",
      };
    }

    if (typeof businessId !== "string" || !businessId) {
      return { success: false, message: "Invalid business." };
    }

    if (!(file instanceof File) || file.size === 0) {
      return { success: false, message: "Please select a photo." };
    }

    if (file.size > MAX_FILE_SIZE) {
      return { success: false, message: "Photo must be 5 MB or smaller." };
    }

    if (!Object.hasOwn(ALLOWED_TYPES, file.type)) {
      return {
        success: false,
        message: "Only JPEG, PNG and WebP images are allowed.",
      };
    }

    if (!(await hasValidImageSignature(file))) {
      return {
        success: false,
        message: "The selected file does not contain a valid JPEG, PNG or WebP image.",
      };
    }

    const { data: business, error: businessError } = await supabase
      .from("businesses")
      .select("id")
      .eq("id", businessId)
      .eq("owner_id", user.id)
      .maybeSingle();

    if (businessError || !business) {
      return { success: false, message: "Business not found or access denied." };
    }

    const { data: existingPhotos, error: photosError } = await supabase
      .from("business_photos")
      .select("id")
      .eq("business_id", business.id)
      .limit(1);

    if (photosError) {
      return { success: false, message: "Could not check existing photos." };
    }

    const extension = ALLOWED_TYPES[file.type as keyof typeof ALLOWED_TYPES];
    const storagePath = `${business.id}/${crypto.randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from("business-photos")
      .upload(storagePath, file, {
        contentType: file.type,
        upsert: false,
      });

    if (uploadError) {
      return { success: false, message: "Photo upload failed. Please try again." };
    }

    const { data: publicUrl } = supabase.storage
      .from("business-photos")
      .getPublicUrl(storagePath);

    const { error: insertError } = await supabase
      .from("business_photos")
      .insert({
        business_id: business.id,
        image_url: publicUrl.publicUrl,
        storage_path: storagePath,
        caption: caption || null,
        is_cover: existingPhotos.length === 0,
      });

    if (insertError) {
      await supabase.storage
        .from("business-photos")
        .remove([storagePath]);

      return { success: false, message: "Could not save photo information." };
    }

    revalidatePath("/business/profile");
    revalidatePath("/business/dashboard");

    return { success: true, message: "Photo uploaded successfully!" };
  } catch {
    return { success: false, message: "Something went wrong while uploading." };
  }
}

export async function deleteBusinessPhoto(
  businessId: string,
  photoId: string,
) {
  try {
    const user = await requireRole(["business_owner"]);
    const supabase = await createClient();

    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("id", businessId)
      .eq("owner_id", user.id)
      .maybeSingle();

    if (!business) {
      return { success: false, message: "Business not found or access denied." };
    }

    const { data: photo, error: photoError } = await supabase
      .from("business_photos")
      .select("id, storage_path")
      .eq("id", photoId)
      .eq("business_id", business.id)
      .maybeSingle();

    if (photoError || !photo) {
      return { success: false, message: "Photo not found." };
    }

    if (photo.storage_path) {
      const { error: storageError } = await supabase.storage
        .from("business-photos")
        .remove([photo.storage_path]);

      if (storageError) {
        return { success: false, message: "Could not delete the stored photo." };
      }
    }

    const { error: deleteError } = await supabase
      .from("business_photos")
      .delete()
      .eq("id", photo.id)
      .eq("business_id", business.id);

    if (deleteError) {
      return { success: false, message: "Could not delete photo information." };
    }

    revalidatePath("/business/profile");
    revalidatePath("/business/dashboard");

    return { success: true, message: "Photo deleted successfully!" };
  } catch {
    return { success: false, message: "Something went wrong while deleting." };
  }
}

export async function setBusinessCoverPhoto(
  businessId: string,
  photoId: string,
) {
  try {
    const user = await requireRole(["business_owner"]);
    const supabase = await createClient();

    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("id", businessId)
      .eq("owner_id", user.id)
      .maybeSingle();

    if (!business) {
      return { success: false, message: "Business not found or access denied." };
    }

    const { data: photo } = await supabase
      .from("business_photos")
      .select("id")
      .eq("id", photoId)
      .eq("business_id", businessId)
      .maybeSingle();

    if (!photo) {
      return { success: false, message: "Photo not found." };
    }

    const { error: resetError } = await supabase
      .from("business_photos")
      .update({ is_cover: false })
      .eq("business_id", businessId);

    if (resetError) {
      return { success: false, message: "Could not update the cover photo." };
    }

    const { error: updateError } = await supabase
      .from("business_photos")
      .update({ is_cover: true })
      .eq("id", photoId)
      .eq("business_id", businessId);

    if (updateError) {
      return { success: false, message: "Could not select the new cover photo." };
    }

    revalidatePath("/business/profile");
    revalidatePath("/business/dashboard");

    return { success: true, message: "Cover photo updated successfully!" };
  } catch {
    return { success: false, message: "Something went wrong." };
  }
}
export async function updateBusinessPhotoCaption(
  businessId: string,
  photoId: string,
  caption: string,
) {
  try {
    const user = await requireRole(["business_owner"]);
    const supabase = await createClient();

    if (typeof caption !== "string" || caption.length > 300) {
      return { success: false, message: "Caption must be 300 characters or fewer." };
    }

    const { data: business } = await supabase
      .from("businesses")
      .select("id")
      .eq("id", businessId)
      .eq("owner_id", user.id)
      .maybeSingle();

    if (!business) {
      return { success: false, message: "Business not found or access denied." };
    }

    const { data: photo } = await supabase
      .from("business_photos")
      .update({ caption: caption.trim() || null })
      .eq("id", photoId)
      .eq("business_id", businessId)
      .select("id")
      .maybeSingle();

    if (!photo) {
      return { success: false, message: "Photo not found or could not be updated." };
    }

    revalidatePath("/business/profile");

    return { success: true, message: "Photo caption updated successfully!" };
  } catch {
    return { success: false, message: "Something went wrong." };
  }
}