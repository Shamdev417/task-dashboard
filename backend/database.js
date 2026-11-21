'use strict';

/**
 * Pure-JS JSON file database — drop-in replacement for better-sqlite3.
 * Implements: db.prepare(sql).get(...), .all(...), .run(params)
 *             db.exec(), db.pragma(), db.transaction()
 *
 * No native compilation needed — works on any Node version.
 */

const fs   = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'tasks.json');

// ─── Helpers ─────────────────────────────────────────────────────────────────

function now() {
  return new Date().toISOString().replace('T', ' ').substring(0, 19);
}

function loadStore() {
  if (fs.existsSync(DB_PATH)) {
    try { return JSON.parse(fs.readFileSync(DB_PATH, 'utf8')); } catch {}
  }
  return { tasks: [], nextId: 1 };
}

function saveStore(store) {
  fs.writeFileSync(DB_PATH, JSON.stringify(store, null, 2));
}

// ─── Statement ───────────────────────────────────────────────────────────────

class Statement {
  constructor(sql) {
    this.sql    = sql.trim();
    this._sqlUp = this.sql.toUpperCase();
  }

  /** Core executor — returns a typed result object */
  _exec(positional, named) {
    const store   = loadStore();
    const sqlUp   = this._sqlUp;
    const sqlLow  = this.sql.toLowerCase();

    // ── COUNT(*) ────────────────────────────────────────────────────────────
    if (sqlUp.includes('COUNT(*)')) {
      let tasks = store.tasks;
      const m = this.sql.match(/status\s*=\s*'([^']+)'/i);
      if (m) tasks = tasks.filter(t => t.status === m[1]);
      return { type: 'count', cnt: tasks.length };
    }

    // ── SELECT * WHERE id = ? ────────────────────────────────────────────────
    if (sqlUp.includes('SELECT *') && sqlUp.includes('WHERE ID = ?')) {
      const id   = positional[0];
      const task = store.tasks.find(t => t.id === Number(id)) || null;
      return { type: 'single', row: task };
    }

    // ── SELECT * WHERE 1=1 (filtered list) ───────────────────────────────────
    if (sqlUp.includes('SELECT *') && sqlUp.includes('WHERE 1=1')) {
      let tasks = [...store.tasks];
      let pi    = 0;

      if (sqlLow.includes('and status = ?'))   tasks = tasks.filter(t => t.status   === positional[pi++]);
      if (sqlLow.includes('and priority = ?')) tasks = tasks.filter(t => t.priority === positional[pi++]);
      if (sqlLow.includes('title like ?')) {
        const term = positional[pi++].replace(/%/g, '').toLowerCase();
        pi++; // skip duplicate description LIKE param
        tasks = tasks.filter(t =>
          t.title.toLowerCase().includes(term) ||
          t.description.toLowerCase().includes(term)
        );
      }

      tasks.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
      return { type: 'list', rows: tasks };
    }

    // ── INSERT ───────────────────────────────────────────────────────────────
    if (sqlUp.startsWith('INSERT')) {
      const p  = named;
      const id = store.nextId++;
      store.tasks.push({
        id,
        title:       p.title,
        description: p.description || '',
        status:      p.status      || 'todo',
        priority:    p.priority    || 'medium',
        due_date:    p.due_date    || null,
        created_at:  now(),
        updated_at:  now(),
      });
      saveStore(store);
      return { type: 'insert', lastInsertRowid: id };
    }

    // ── UPDATE ───────────────────────────────────────────────────────────────
    if (sqlUp.startsWith('UPDATE')) {
      const p   = named;
      const idx = store.tasks.findIndex(t => t.id === Number(p.id));
      if (idx !== -1) {
        store.tasks[idx] = {
          ...store.tasks[idx],
          title:       p.title,
          description: p.description,
          status:      p.status,
          priority:    p.priority,
          due_date:    p.due_date,
          updated_at:  now(),
        };
        saveStore(store);
      }
      return { type: 'update', changes: idx !== -1 ? 1 : 0 };
    }

    // ── DELETE ───────────────────────────────────────────────────────────────
    if (sqlUp.startsWith('DELETE')) {
      const id     = positional[0];
      const before = store.tasks.length;
      store.tasks  = store.tasks.filter(t => t.id !== Number(id));
      saveStore(store);
      return { type: 'delete', changes: before - store.tasks.length };
    }

    return { type: 'unknown' };
  }

  /** Returns a single row (or null / count-object). */
  get(...args) {
    let positional = [], named = {};
    if (args.length === 1 && args[0] !== null && typeof args[0] === 'object') {
      named = args[0];
    } else {
      positional = args;
    }
    const r = this._exec(positional, named);
    if (!r) return null;
    if (r.type === 'count')  return { cnt: r.cnt };
    if (r.type === 'single') return r.row;
    if (r.type === 'list')   return r.rows[0] || null;
    return null;
  }

  /** Returns all matching rows as an array. */
  all(...args) {
    const r = this._exec(args, {});
    if (!r) return [];
    if (r.type === 'list')   return r.rows;
    if (r.type === 'single') return r.row ? [r.row] : [];
    return [];
  }

  /** Executes a write statement. Returns { lastInsertRowid } or { changes }. */
  run(paramsOrValue) {
    let positional = [], named = {};
    if (paramsOrValue !== undefined && paramsOrValue !== null && typeof paramsOrValue === 'object') {
      named = paramsOrValue;
    } else if (paramsOrValue !== undefined) {
      positional = [paramsOrValue];
    }
    const r = this._exec(positional, named);
    if (!r) return { changes: 0 };
    if (r.type === 'insert') return { lastInsertRowid: r.lastInsertRowid };
    return { changes: r.changes || 0 };
  }
}

// ─── DB Object ───────────────────────────────────────────────────────────────

const db = {
  pragma:      ()   => {},                        // no-op
  exec:        ()   => {},                        // no-op
  prepare:     (sql) => new Statement(sql),
  transaction: (fn)  => (...args) => fn(...args), // synchronous wrapper
};

// ─── Seed ────────────────────────────────────────────────────────────────────

const store = loadStore();
if (store.tasks.length === 0) {
  const seeds = [
    { title: 'Set up project repository',  description: 'Initialize Git repo, add .gitignore and README.',      status: 'done',        priority: 'high',   due_date: '2026-11-01' },
    { title: 'Design database schema',     description: 'Define tables, relationships and indexes for the app.', status: 'done',        priority: 'high',   due_date: '2026-11-03' },
    { title: 'Build REST API',             description: 'Implement CRUD endpoints with Express and SQLite.',     status: 'in-progress', priority: 'high',   due_date: '2026-11-12' },
    { title: 'Develop frontend dashboard', description: 'Build React UI with task list, filters and stats.',     status: 'in-progress', priority: 'medium', due_date: '2026-11-15' },
    { title: 'Write end-to-end tests',     description: 'Cover main user flows with Playwright or Cypress.',     status: 'todo',        priority: 'low',    due_date: '2026-11-20' },
  ];
  for (const t of seeds) {
    store.tasks.push({ id: store.nextId++, ...t, created_at: now(), updated_at: now() });
  }
  saveStore(store);
  console.log('Database seeded with 5 sample tasks.');
}

module.exports = db;
