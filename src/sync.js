// Sync between devices through a secret GitHub Gist.
//
// Each device keeps its full copy in localStorage. Syncing compares the
// copy here and the copy in the gist against the version both last agreed
// on (`lastSynced`, an `updatedAt` stamp):
//   - only this device changed  -> upload
//   - only the gist changed     -> download
//   - both changed              -> conflict; you choose which copy to keep
//
// The GitHub REST API allows cross-origin requests from any origin, and a
// fine-grained personal access token needs only "Gists: read and write".
// https://docs.github.com/en/rest/gists/gists
// https://docs.github.com/en/rest/using-the-rest-api/using-cors-and-jsonp-to-make-cross-origin-requests

import { normalizeState } from './store.js';

export const SYNC_KEY = 'kitchen-planner/sync';
export const GIST_FILE = 'kitchen-planner.json';
export const GIST_DESCRIPTION = 'Kitchen Planner sync data';
const API = 'https://api.github.com';

export function loadSyncConfig(storage = globalThis.localStorage) {
  try {
    return { token: '', gistId: '', lastSynced: null, lastSyncAt: null, ...JSON.parse(storage?.getItem(SYNC_KEY) || '{}') };
  } catch {
    return { token: '', gistId: '', lastSynced: null, lastSyncAt: null };
  }
}

export function saveSyncConfig(config, storage = globalThis.localStorage) {
  storage.setItem(SYNC_KEY, JSON.stringify(config));
}

// What goes into the gist: everything except per-device bookkeeping.
export function syncPayload(state) {
  const { lastBackup, ...rest } = state;
  return JSON.stringify(rest);
}

async function github(fetchImpl, token, path, { method = 'GET', body } = {}) {
  const res = await fetchImpl(`${API}${path}`, {
    method,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': '2022-11-28',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401) throw new Error('GitHub rejected the token. Check it in Settings → Sync.');
  if (res.status === 403 || res.status === 404) throw new Error('The token cannot reach the sync gist. It needs "Gists: read and write" access.');
  if (!res.ok) throw new Error(`GitHub returned ${res.status}`);
  return res.json();
}

async function findGist(fetchImpl, token) {
  for (let page = 1; page <= 10; page++) {
    const gists = await github(fetchImpl, token, `/gists?per_page=100&page=${page}`);
    const match = gists.find((g) => g.files?.[GIST_FILE]);
    if (match) return match.id;
    if (gists.length < 100) return null;
  }
  return null;
}

async function readGist(fetchImpl, token, gistId) {
  const gist = await github(fetchImpl, token, `/gists/${gistId}`);
  const file = gist.files?.[GIST_FILE];
  if (!file) return null;
  let text = file.content;
  if (file.truncated) {
    const raw = await fetchImpl(file.raw_url);
    if (!raw.ok) throw new Error(`Could not download the sync file (${raw.status})`);
    text = await raw.text();
  }
  return normalizeState(JSON.parse(text));
}

function writeGist(fetchImpl, token, gistId, state) {
  return github(fetchImpl, token, `/gists/${gistId}`, { method: 'PATCH', body: { files: { [GIST_FILE]: { content: syncPayload(state) } } } });
}

function isEmpty(state) {
  return !state.updatedAt && state.inventory.length === 0 && state.history.length === 0;
}

// Returns { action, state, config, remote? }. On "conflict" nothing is
// written; call resolveConflict with the copy to keep.
export async function syncNow(state, config, fetchImpl = globalThis.fetch.bind(globalThis)) {
  if (!config.token) throw new Error('Add a GitHub token in Settings → Sync first.');
  const next = { ...config };
  const stamp = () => new Date().toISOString();

  if (!next.gistId) next.gistId = await findGist(fetchImpl, next.token);
  if (!next.gistId) {
    const created = await github(fetchImpl, next.token, '/gists', {
      method: 'POST',
      body: { description: GIST_DESCRIPTION, public: false, files: { [GIST_FILE]: { content: syncPayload(state) } } },
    });
    next.gistId = created.id;
    return { action: 'created', state, config: { ...next, lastSynced: state.updatedAt, lastSyncAt: stamp() } };
  }

  const remote = await readGist(fetchImpl, next.token, next.gistId);
  if (!remote) {
    await writeGist(fetchImpl, next.token, next.gistId, state);
    return { action: 'pushed', state, config: { ...next, lastSynced: state.updatedAt, lastSyncAt: stamp() } };
  }

  const localChanged = state.updatedAt !== next.lastSynced && !isEmpty(state);
  const remoteChanged = remote.updatedAt !== next.lastSynced;

  if (!localChanged && !remoteChanged) {
    return { action: 'unchanged', state, config: { ...next, lastSyncAt: stamp() } };
  }
  if (localChanged && !remoteChanged) {
    await writeGist(fetchImpl, next.token, next.gistId, state);
    return { action: 'pushed', state, config: { ...next, lastSynced: state.updatedAt, lastSyncAt: stamp() } };
  }
  if (!localChanged && remoteChanged) {
    const pulled = { ...remote, lastBackup: state.lastBackup };
    return { action: 'pulled', state: pulled, config: { ...next, lastSynced: remote.updatedAt, lastSyncAt: stamp() } };
  }
  if (state.updatedAt === remote.updatedAt) {
    return { action: 'unchanged', state, config: { ...next, lastSynced: state.updatedAt, lastSyncAt: stamp() } };
  }
  return { action: 'conflict', state, remote, config: next };
}

// keep = 'local' uploads this device's copy; keep = 'remote' takes the gist's.
export async function resolveConflict(keep, state, remote, config, fetchImpl = globalThis.fetch.bind(globalThis)) {
  const stamp = new Date().toISOString();
  if (keep === 'remote') {
    return { action: 'pulled', state: { ...remote, lastBackup: state.lastBackup }, config: { ...config, lastSynced: remote.updatedAt, lastSyncAt: stamp } };
  }
  await writeGist(fetchImpl, config.token, config.gistId, state);
  return { action: 'pushed', state, config: { ...config, lastSynced: state.updatedAt, lastSyncAt: stamp } };
}
