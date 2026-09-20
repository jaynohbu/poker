const g = globalThis as { global?: unknown; process?: { env: Record<string, string> } };

if (typeof g.global === 'undefined') {
  g.global = g;
}

if (typeof g.process === 'undefined') {
  g.process = { env: {} };
}
