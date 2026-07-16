import { useSyncExternalStore } from "react";
import { z } from "zod";

const KEY = "ct.user";

export type User = {
  email: string;
  name?: string;
  createdAt: string;
};

const isClient = typeof window !== "undefined";
const listeners = new Set<() => void>();

function read(): User | null {
  if (!isClient) return null;
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as User) : null;
  } catch {
    return null;
  }
}

function write(user: User | null) {
  if (!isClient) return;
  if (user) localStorage.setItem(KEY, JSON.stringify(user));
  else localStorage.removeItem(KEY);
  listeners.forEach((l) => l());
}

export const credentialsSchema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  password: z.string().min(6, "At least 6 characters").max(128),
});

export const signUpSchema = credentialsSchema.extend({
  name: z.string().trim().max(80).optional().or(z.literal("")),
});

export type Credentials = z.infer<typeof credentialsSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;

export const authStore = {
  getUser: read,
  subscribe(listener: () => void) {
    listeners.add(listener);
    return () => listeners.delete(listener);
  },
  get isAuthenticated(): boolean {
    return !!read();
  },
  signIn(input: Credentials): User {
    const parsed = credentialsSchema.parse(input);
    const user: User = { email: parsed.email, createdAt: new Date().toISOString() };
    write(user);
    return user;
  },
  signUp(input: SignUpInput): User {
    const parsed = signUpSchema.parse(input);
    const user: User = {
      email: parsed.email,
      name: parsed.name || undefined,
      createdAt: new Date().toISOString(),
    };
    write(user);
    return user;
  },
  signOut() {
    write(null);
  },
};

export function useAuth() {
  const user = useSyncExternalStore(
    authStore.subscribe,
    authStore.getUser,
    () => null,
  );
  return {
    user,
    signIn: authStore.signIn,
    signUp: authStore.signUp,
    signOut: authStore.signOut,
  };
}
