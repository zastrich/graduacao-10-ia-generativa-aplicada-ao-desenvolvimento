/**
 * Rate Limiter — proteção contra força bruta e abuso de endpoints.
 *
 * Implementação em memória com janela deslizante.
 * Em ambiente Lambda (stateless), funciona para warm instances.
 * Para proteção garantida em produção, considere usar uma tabela DynamoDB ou ElastiCache.
 */

interface RateLimitEntry {
  count: number;
  windowStart: number;
}

class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();

  /**
   * Verifica se a chave excedeu o limite na janela de tempo.
   * @param key      Identificador (IP, userUid, etc.)
   * @param limit    Número máximo de requisições permitidas
   * @param windowMs Tamanho da janela em milissegundos
   * @returns true se a requisição deve ser bloqueada (limite atingido)
   */
  isRateLimited(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry || now - entry.windowStart > windowMs) {
      // Nova janela
      this.store.set(key, { count: 1, windowStart: now });
      return false;
    }

    entry.count += 1;

    if (entry.count > limit) {
      return true;
    }

    return false;
  }

  /**
   * Retorna o tempo restante (em segundos) até o reset da janela para uma chave.
   */
  getRetryAfterSeconds(key: string, windowMs: number): number {
    const entry = this.store.get(key);
    if (!entry) return 0;
    const elapsed = Date.now() - entry.windowStart;
    return Math.ceil((windowMs - elapsed) / 1000);
  }

  /**
   * Remove entradas expiradas para evitar vazamento de memória.
   * Chamar periodicamente em ambientes de longa duração.
   */
  cleanup(windowMs: number): void {
    const now = Date.now();
    for (const [key, entry] of this.store.entries()) {
      if (now - entry.windowStart > windowMs) {
        this.store.delete(key);
      }
    }
  }
}

// Instâncias separadas por endpoint para limites independentes
export const authRateLimiter = new RateLimiter();
export const chatRateLimiter = new RateLimiter();

// Limites configurados por política de segurança
export const RATE_LIMITS = {
  auth: {
    maxAttempts: 10,
    windowMs: 15 * 60 * 1000, // 15 minutos
  },
  chat: {
    maxRequests: 30,
    windowMs: 60 * 60 * 1000, // 1 hora
  },
};

/**
 * Extrai o IP do cliente a partir dos headers do API Gateway.
 */
export function getClientIp(headers: Record<string, string | undefined>): string {
  return (
    headers['x-forwarded-for']?.split(',')[0].trim() ||
    headers['X-Forwarded-For']?.split(',')[0].trim() ||
    'unknown'
  );
}
