/** 比較用にメールアドレスを正規化 */
export function normalizeEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  const trimmed = email.trim().toLowerCase();
  return trimmed.length > 0 ? trimmed : null;
}

/** 比較用に電話番号を正規化（数字のみ、国内先頭0→81） */
export function normalizePhone(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, "");
  if (digits.length === 0) return null;

  if (digits.startsWith("81") && digits.length >= 11) {
    return digits;
  }
  if (digits.startsWith("0")) {
    return `81${digits.slice(1)}`;
  }
  return digits;
}

/** 比較用に氏名を正規化（空白除去・小文字） */
export function normalizeName(name: string | null | undefined): string | null {
  if (!name) return null;
  const collapsed = name.trim().replace(/\s+/g, "");
  return collapsed.length > 0 ? collapsed.toLowerCase() : null;
}

/** Candidate の姓名から比較用フルネームを生成 */
export function candidateFullName(lastName: string, firstName: string): string {
  return normalizeName(`${lastName}${firstName}`) ?? "";
}

export function nameAgeKey(name: string, age: number): string {
  return `${normalizeName(name) ?? ""}:${age}`;
}

/** tel: URI 用（+81 形式） */
export function formatPhoneForTelUri(phone: string): string {
  const normalized = normalizePhone(phone);
  if (!normalized) {
    return phone.replace(/\D/g, "");
  }
  if (normalized.startsWith("81")) {
    return `+${normalized}`;
  }
  return `+${normalized}`;
}
