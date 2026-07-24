const USER_UID_KEY = 'copiloto_user_uid';
const ADMIN_TOKEN_KEY = 'admin_token';

// ============================================================
// Usuário anônimo do chat — persiste em localStorage (não é sensível)
// ============================================================

export function getUserUid(): string {
  let uid = localStorage.getItem(USER_UID_KEY);
  if (!uid) {
    uid = `usr_${crypto.randomUUID()}`;
    localStorage.setItem(USER_UID_KEY, uid);
  }
  return uid;
}

// ============================================================
// Token JWT do admin — armazenado em sessionStorage
// Motivo: sessionStorage não persiste entre sessões do browser,
// reduzindo a janela de exposição em caso de XSS.
// ============================================================

export function setAdminToken(token: string): void {
  sessionStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function getAdminToken(): string | null {
  return sessionStorage.getItem(ADMIN_TOKEN_KEY);
}

export function removeAdminToken(): void {
  sessionStorage.removeItem(ADMIN_TOKEN_KEY);
}

/**
 * Verifica se o admin está autenticado com um token ainda válido.
 * Decodifica o payload JWT (sem verificar assinatura — apenas para checar exp no cliente).
 */
export function isAdminAuthenticated(): boolean {
  const token = getAdminToken();
  if (!token) return false;

  try {
    // JWT é base64url: header.payload.signature
    const payloadBase64 = token.split('.')[1];
    if (!payloadBase64) return false;

    // base64url → base64 padrão
    const base64 = payloadBase64.replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));

    if (!payload.exp) return true; // sem exp = considerado válido

    const nowSeconds = Math.floor(Date.now() / 1000);
    return payload.exp > nowSeconds;
  } catch {
    return false;
  }
}
