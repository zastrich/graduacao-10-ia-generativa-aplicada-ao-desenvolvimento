const USER_UID_KEY = 'copiloto_user_uid';

export function getUserUid(): string {
  let uid = localStorage.getItem(USER_UID_KEY);
  if (!uid) {
    uid = `usr_${crypto.randomUUID()}`;
    localStorage.setItem(USER_UID_KEY, uid);
  }
  return uid;
}

export function setAdminToken(token: string): void {
  localStorage.setItem('admin_token', token);
}

export function getAdminToken(): string | null {
  return localStorage.getItem('admin_token');
}

export function removeAdminToken(): void {
  localStorage.removeItem('admin_token');
}
