export type UserNameFields = {
  name: string;
  lastName?: string | null;
};

/** 担当者表示用（苗字） */
export function formatUserSurname(user: UserNameFields): string {
  const last = user.lastName?.trim();
  if (last) return last;
  const parts = user.name.trim().split(/\s+/);
  return parts[0] ?? user.name;
}

export function formatUserFullName(lastName: string, firstName?: string | null): string {
  return [lastName.trim(), firstName?.trim()].filter(Boolean).join(" ");
}
