import {
  ADVERTISEMENT_IMAGE_LIMITS,
  isAllowedImageExtension,
  isAllowedImageMimeType,
} from "@/config/advertisement-images";

const MAX_BYTES = ADVERTISEMENT_IMAGE_LIMITS.maxFileSizeBytes;
const MAX_REQUEST_BYTES = ADVERTISEMENT_IMAGE_LIMITS.maxRequestBytes;
const MAX_MB = MAX_BYTES / (1024 * 1024);
const MAX_REQUEST_MB = MAX_REQUEST_BYTES / (1024 * 1024);

export function formatMaxImageSizeLabel(): string {
  return `${MAX_MB} MB`;
}

export function formatMaxImageRequestSizeLabel(): string {
  return `${MAX_REQUEST_MB} MB`;
}

function formatFileSizeMb(bytes: number): string {
  return (bytes / (1024 * 1024)).toFixed(1);
}

/** Valida um arquivo de imagem no cliente (tipo + tamanho). */
export function validateImageFileClient(
  file: File,
  label = "Imagem"
): string | null {
  if (!file || file.size === 0) {
    return `${label} é obrigatória. Selecione um arquivo JPG, PNG ou WebP.`;
  }

  const mimeOk = Boolean(file.type) && isAllowedImageMimeType(file.type);
  const extensionOk = isAllowedImageExtension(file.name);

  if (!mimeOk && !extensionOk) {
    return `${label} deve ser JPG, PNG ou WebP. Formatos como HEIC do iPhone não são aceitos — converta ou tire a foto em JPG.`;
  }

  if (!mimeOk && extensionOk && file.type && !isAllowedImageMimeType(file.type)) {
    return `${label} está em um formato não aceito (${file.type || "desconhecido"}). Use JPG, PNG ou WebP.`;
  }

  if (file.size > MAX_BYTES) {
    return `${label} está muito grande (${formatFileSizeMb(file.size)} MB). Reduza para no máximo ${formatMaxImageSizeLabel()} e tente novamente.`;
  }

  return null;
}

/** Valida uma lista de arquivos (galeria). */
export function validateImageFilesClient(
  files: readonly File[],
  label = "Foto"
): string | null {
  if (files.length > ADVERTISEMENT_IMAGE_LIMITS.maxGalleryImages) {
    return `Envie no máximo ${ADVERTISEMENT_IMAGE_LIMITS.maxGalleryImages} fotos por vez.`;
  }

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

/** Valida o tamanho total do envio (capa + galeria) para evitar erro de rede/plataforma. */
export function validateImageRequestSizeClient(
  files: readonly File[]
): string | null {
  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);

  if (totalBytes > MAX_REQUEST_BYTES) {
    return (
      `O conjunto de fotos selecionadas soma ${formatFileSizeMb(totalBytes)} MB ` +
      `(limite de ${formatMaxImageRequestSizeLabel()} por envio). ` +
      `Envie menos fotos de cada vez ou reduza o tamanho das imagens.`
    );
  }

  return null;
}

export function listFilesFromInput(
  input: HTMLInputElement | null
): File[] {
  if (!input?.files?.length) return [];
  return Array.from(input.files);
}

export function getFriendlyImageUploadError(error: unknown): string {
  const message =
    error instanceof Error ? error.message.toLowerCase() : String(error ?? "");

  if (
    message.includes("body") ||
    message.includes("413") ||
    message.includes("too large") ||
    message.includes("payload") ||
    message.includes("fetch failed") ||
    message.includes("network")
  ) {
    return (
      `Não foi possível enviar as fotos (arquivo muito grande ou falha na conexão). ` +
      `Use JPG/PNG/WebP de até ${formatMaxImageSizeLabel()} e envie menos fotos por vez.`
    );
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return (
    `Não foi possível enviar as fotos. Verifique se o formato é JPG, PNG ou WebP ` +
    `e se cada arquivo tem no máximo ${formatMaxImageSizeLabel()}.`
  );
}
