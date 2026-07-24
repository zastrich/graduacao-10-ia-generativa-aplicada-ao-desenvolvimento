/**
 * URL Validator — protege contra SSRF (Server-Side Request Forgery).
 * Bloqueia URLs que apontam para endereços internos, metadata de cloud e loopback.
 */

// Faixas de IP privado/reservado que não devem ser acessíveis
const PRIVATE_IP_RANGES = [
  /^127\./,                          // loopback IPv4
  /^10\./,                           // RFC 1918
  /^172\.(1[6-9]|2\d|3[01])\./,     // RFC 1918
  /^192\.168\./,                     // RFC 1918
  /^169\.254\./,                     // link-local / AWS metadata
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./, // RFC 6598 (shared address space)
  /^0\./,                            // "this" network
  /^::1$/,                           // IPv6 loopback
  /^fc00:/,                          // IPv6 unique local
  /^fd[0-9a-f]{2}:/,                 // IPv6 unique local
  /^fe80:/,                          // IPv6 link-local
];

// Hostnames bloqueados explicitamente
const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  'metadata.google.internal',
  'instance-data',
  '169.254.169.254',                 // AWS/Azure/GCP instance metadata
  'fd00:ec2::254',                   // AWS IPv6 metadata
]);

export interface UrlValidationError {
  code: 'INVALID_URL' | 'INVALID_SCHEME' | 'BLOCKED_HOSTNAME' | 'PRIVATE_IP';
  message: string;
}

/**
 * Valida uma URL para uso em links de bases de conhecimento.
 * @returns null se válida, UrlValidationError se inválida
 */
export function validateUrl(rawUrl: string): UrlValidationError | null {
  let parsed: URL;

  try {
    parsed = new URL(rawUrl);
  } catch {
    return { code: 'INVALID_URL', message: 'URL inválida' };
  }

  // 1. Apenas HTTP e HTTPS são permitidos
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return {
      code: 'INVALID_SCHEME',
      message: 'Apenas URLs com protocolo http:// ou https:// são permitidas',
    };
  }

  const hostname = parsed.hostname.toLowerCase();

  // 2. Bloqueia hostnames conhecidos
  if (BLOCKED_HOSTNAMES.has(hostname)) {
    return {
      code: 'BLOCKED_HOSTNAME',
      message: 'URL aponta para um endereço interno não permitido',
    };
  }

  // 3. Bloqueia IPs privados diretamente na URL
  const isIpAddress = /^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) || hostname.includes(':');
  if (isIpAddress) {
    for (const range of PRIVATE_IP_RANGES) {
      if (range.test(hostname)) {
        return {
          code: 'PRIVATE_IP',
          message: 'URL aponta para um endereço IP privado ou reservado',
        };
      }
    }
  }

  return null;
}
