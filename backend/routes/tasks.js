const express = require('express');
const { body, param, query, validationResult } = require('express-validator');
const db = require('../database');

const router = express.Router();

// ─── Helpers ────────────────────────────────────────────────────────────────

function handleValidation(req, res) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({ errors: errors.array() });
    return true; // signals caller to stop
  }
  return false;
}

function taskOrNotFound(res, id) {
  const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
  if (!task) {
    res.status(404).json({ error: { message: `Task with id ${id} not found.` } });
    return null;
  }
  return task;
}

// ─── Validation rules ────────────────────────────────────────────────────────

const taskBodyRules = [
  body('title')
    .if((value, { req }) => req.method === 'POST' || value !== undefined)
    .trim()
    .notEmpty()
    .withMessage('title is required and must not be empty')
    .isLength({ max: 255 })
    .withMessage('title must be at most 255 characters'),
  body('description').optional().isString().withMessage('description must be a string'),
  body('status')
    .optional()
    .isIn(['todo', 'in-progress', 'done'])
    .withMessage("status must be one of: todo, in-progress, done"),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high'])
    .withMessage("priority must be one of: low, medium, high"),
  body('due_date')
    .optional({ nullable: true })
    .custom((val) => {
      if (val === null || val === '') return true;
      if (!/^\d{4}-\d{2}-\d{2}$/.test(val)) {
        throw new Error('due_date must be in YYYY-MM-DD format');
      }
      return true;
    }),
];

const idParam = param('id').isInt({ gt: 0 }).withMessage('id must be a positive integer');

// ─── GET /stats  (MUST be before /:id) ───────────────────────────────────────

router.get('/stats', (req, res, next) => {
  try {
    const total      = db.prepare('SELECT COUNT(*) AS cnt FROM tasks').get().cnt;
    const todo       = db.prepare("SELECT COUNT(*) AS cnt FROM tasks WHERE status = 'todo'").get().cnt;
    const inProgress = db.prepare("SELECT COUNT(*) AS cnt FROM tasks WHERE status = 'in-progress'").get().cnt;
    const done       = db.prepare("SELECT COUNT(*) AS cnt FROM tasks WHERE status = 'done'").get().cnt;
    res.json({ total, todo, inProgress, done });
  } catch (err) {
    next(err);
  }
});

// ─── GET / ────────────────────────────────────────────────────────────────────

router.get(
  '/',
  [
    query('status').optional().isIn(['todo', 'in-progress', 'done']).withMessage("Invalid status filter"),
    query('priority').optional().isIn(['low', 'medium', 'high']).withMessage("Invalid priority filter"),
    query('search').optional().isString(),
  ],
  (req, res, next) => {
    if (handleValidation(req, res)) return;

    try {
      const { status, priority, search } = req.query;

      let sql = 'SELECT * FROM tasks WHERE 1=1';
      const params = [];

      if (status) {
        sql += ' AND status = ?';
        params.push(status);
      }
      if (priority) {
        sql += ' AND priority = ?';
        params.push(priority);
      }
      if (search) {
        sql += ' AND (title LIKE ? OR description LIKE ?)';
        params.push(`%${search}%`, `%${search}%`);
      }

      sql += ' ORDER BY created_at DESC';

      const tasks = db.prepare(sql).all(...params);
      res.json(tasks);
    } catch (err) {
      next(err);
    }
  }
);

// ─── GET /:id ─────────────────────────────────────────────────────────────────

router.get('/:id', [idParam], (req, res, next) => {
  if (handleValidation(req, res)) return;
  try {
    const task = taskOrNotFound(res, Number(req.params.id));
    if (!task) return;
    res.json(task);
  } catch (err) {
    next(err);
  }
});

// ─── POST / ───────────────────────────────────────────────────────────────────

router.post(
  '/',
  [
    body('title')
      .trim()
      .notEmpty()
      .withMessage('title is required and must not be empty')
      .isLength({ max: 255 })
      .withMessage('title must be at most 255 characters'),
    ...taskBodyRules.slice(1), // description, status, priority, due_date
  ],
  (req, res, next) => {
    if (handleValidation(req, res)) return;
    try {
      const { title, description = '', status = 'todo', priority = 'medium', due_date = null } = req.body;

      const result = db
        .prepare(
          `INSERT INTO tasks (title, description, status, priority, due_date)
           VALUES (@title, @description, @status, @priority, @due_date)`
        )
        .run({ title, description, status, priority, due_date });

      const created = db.prepare('SELECT * FROM tasks WHERE id = ?').get(result.lastInsertRowid);
      res.status(201).json(created);
    } catch (err) {
      next(err);
    }
  }
);

// ─── PUT /:id ─────────────────────────────────────────────────────────────────

router.put('/:id', [idParam, ...taskBodyRules], (req, res, next) => {
  if (handleValidation(req, res)) return;
  try {
    const id = Number(req.params.id);
    const existing = taskOrNotFound(res, id);
    if (!existing) return;

    const {
      title       = existing.title,
      description = existing.description,
      status      = existing.status,
      priority    = existing.priority,
      due_date    = existing.due_date,
    } = req.body;

    db.prepare(
      `UPDATE tasks
         SET title = @title,
             description = @description,
             status = @status,
             priority = @priority,
             due_date = @due_date,
             updated_at = datetime('now')
       WHERE id = @id`
    ).run({ title, description, status, priority, due_date, id });

    const updated = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    res.json(updated);
  } catch (err) {
    next(err);
  }
});

// ─── DELETE /:id ──────────────────────────────────────────────────────────────

router.delete('/:id', [idParam], (req, res, next) => {
  if (handleValidation(req, res)) return;
  try {
    const id = Number(req.params.id);
    const existing = taskOrNotFound(res, id);
    if (!existing) return;

    db.prepare('DELETE FROM tasks WHERE id = ?').run(id);
    res.json({ message: `Task ${id} deleted successfully.` });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
