/**
 * File Validator — valida uploads antes de armazenar no S3.
 * Verifica extensão, content-type e magic bytes para impedir uploads maliciosos.
 */

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024; // 20 MB

// Allow-list de extensões permitidas para bases de conhecimento
const ALLOWED_EXTENSIONS = new Set(['pdf', 'txt', 'md', 'csv', 'xlsx', 'xls', 'json']);

// Allow-list de content-types aceitos
const ALLOWED_CONTENT_TYPES = new Set([
  'application/pdf',
  'text/plain',
  'text/markdown',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  'application/vnd.ms-excel',
  'application/json',
  'application/octet-stream', // genérico — validado pelos magic bytes
]);

/**
 * Magic bytes por tipo de arquivo.
 * Cada entrada é: [offset, bytes esperados em hex]
 */
const MAGIC_BYTES: Array<{ ext: string; offset: number; magic: number[] }> = [
  { ext: 'pdf', offset: 0, magic: [0x25, 0x50, 0x44, 0x46] },       // %PDF
  { ext: 'xlsx', offset: 0, magic: [0x50, 0x4B, 0x03, 0x04] },       // PK (ZIP — usado por xlsx/docx)
  { ext: 'xls', offset: 0, magic: [0xD0, 0xCF, 0x11, 0xE0] },        // Compound Document
];

export interface FileValidationError {
  code: 'FILE_TOO_LARGE' | 'INVALID_EXTENSION' | 'INVALID_CONTENT_TYPE' | 'MAGIC_BYTES_MISMATCH';
  message: string;
}

/**
 * Valida um arquivo antes do upload.
 * @returns null se válido, FileValidationError se inválido
 */
export function validateFile(
  fileName: string,
  contentType: string,
  fileBuffer: Buffer
): FileValidationError | null {
  // 1. Valida tamanho
  if (fileBuffer.length > MAX_FILE_SIZE_BYTES) {
    return {
      code: 'FILE_TOO_LARGE',
      message: `O arquivo excede o tamanho máximo permitido de ${MAX_FILE_SIZE_BYTES / 1024 / 1024}MB`,
    };
  }

  // 2. Valida extensão
  const ext = fileName.toLowerCase().split('.').pop() || '';
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    return {
      code: 'INVALID_EXTENSION',
      message: `Tipo de arquivo não permitido. Extensões aceitas: ${Array.from(ALLOWED_EXTENSIONS).join(', ')}`,
    };
  }

  // 3. Valida content-type
  const normalizedContentType = contentType.split(';')[0].trim().toLowerCase();
  if (!ALLOWED_CONTENT_TYPES.has(normalizedContentType)) {
    return {
      code: 'INVALID_CONTENT_TYPE',
      message: `Content-type não permitido: ${contentType}`,
    };
  }

  // 4. Valida magic bytes para tipos com assinatura conhecida
  const magicEntry = MAGIC_BYTES.find((m) => m.ext === ext);
  if (magicEntry && fileBuffer.length >= magicEntry.offset + magicEntry.magic.length) {
    const actualBytes = Array.from(
      fileBuffer.slice(magicEntry.offset, magicEntry.offset + magicEntry.magic.length)
    );
    const matches = magicEntry.magic.every((byte, i) => actualBytes[i] === byte);
    if (!matches) {
      return {
        code: 'MAGIC_BYTES_MISMATCH',
        message: `O conteúdo do arquivo não corresponde à extensão declarada (${ext})`,
      };
    }
  }

  return null;
}
