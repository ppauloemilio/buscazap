import {
  ADVERTISEMENT_IMAGE_LIMITS,
  isAllowedImageMimeType,
} from "@/config/advertisement-images";

const MAX_BYTES = ADVERTISEMENT_IMAGE_LIMITS.maxFileSizeBytes;
const MAX_MB = MAX_BYTES / (1024 * 1024);

export function formatMaxImageSizeLabel(): string {
  return `${MAX_MB} MB`;
}

/** Valida um arquivo de imagem no cliente (tipo + tamanho). */
export function validateImageFileClient(
  file: File,
  label = "Imagem"
): string | null {
  if (!file || file.size === 0) {
    return `${label} é obrigatória`;
  }

  if (!isAllowedImageMimeType(file.type)) {
    return `${label} deve ser JPG, PNG ou WebP (HEIC do iPhone não é aceito — converta ou tire em JPG)`;
  }

  if (file.size > MAX_BYTES) {
    return `${label} deve ter no máximo ${formatMaxImageSizeLabel()} (arquivo com ${(file.size / (1024 * 1024)).toFixed(1)} MB)`;
  }

  return null;
}

/** Valida uma lista de arquivos (galeria). */
export function validateImageFilesClient(
  files: readonly File[],
  label = "Foto"
): string | null {
  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    if (!file) continue;
    const error = validateImageFileClient(
      file,
      files.length > 1 ? `${label} ${index + 1}` : label
    );
    if (error) return error;
  }

  return null;
}

export function listFilesFromInput(
  input: HTMLInputElement | null
): File[] {
  if (!input?.files?.length) return [];
  return Array.from(input.files);
}
