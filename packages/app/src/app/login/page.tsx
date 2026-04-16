"use client";

import { useActionState } from "react";

import { login } from "./actions";

export default function LoginPage() {
  const [error, formAction, isPending] = useActionState(login, null);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="w-full max-w-sm space-y-6 rounded-2xl border border-border bg-card p-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Menza</h1>
          <p className="text-sm text-muted-foreground">Sign in to continue</p>
        </div>
        <form action={formAction} className="space-y-4">
          {error && (
            <p className="rounded-lg bg-destructive-muted px-3 py-2 text-sm text-destructive-foreground">
              {error}
            </p>
          )}
          <div className="space-y-2">
            <label htmlFor="email" className="text-sm font-medium">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              defaultValue="demo@menza.ai"
              required
              className="flex h-9 w-full rounded-lg border border-border bg-input px-3 py-1 text-sm outline-none focus-visible:border-accent-ring focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              defaultValue="password123"
              required
              className="flex h-9 w-full rounded-lg border border-border bg-input px-3 py-1 text-sm outline-none focus-visible:border-accent-ring focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-lg bg-accent px-4 py-2 text-sm font-medium text-accent-foreground hover:bg-accent/90 disabled:opacity-50"
          >
            {isPending ? "Signing in..." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
}
