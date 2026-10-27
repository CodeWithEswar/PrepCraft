/** Supabase's generated Args omit SQL nullability. Preserve explicit NULL for required nullable parameters. */
export function sqlNullable<T>(value: T | null): T { return value as T }
