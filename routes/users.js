// routes/users.js
import { Router } from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { getDb } from '../models/dbAdapter.js';

const router = Router();

// GET /api/users - list all (admin only)
router.get('/', requireAdmin, async (req, res) => {
  try {
    const db = getDb();
    const users = await db.getAllUsers();
    res.json({ users });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/stats
router.get('/stats', requireAdmin, async (req, res) => {
  try {
    const db = getDb();
    const stats = await db.getUserStats();
    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users - create user (admin only)
router.post('/', requireAdmin, async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    if (!name || !email || !password) return res.status(400).json({ error: 'Name, email and password required' });

    const db = getDb();
    const user = await db.createUser({ name, email, password, role });
    res.status(201).json({ user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/users/:id
router.get('/:id', requireAuth, async (req, res) => {
  try {
    // Users can only see themselves unless admin
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const db = getDb();
    const user = await db.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    const { password, ...safe } = user;
    res.json({ user: safe });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/users/:id - update user
router.put('/:id', requireAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.id !== req.params.id) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    const { name, email, password, role, status } = req.body;
    const updates = {};
    if (name) updates.name = name;
    if (email) updates.email = email;
    if (password) updates.password = password;
    // Only admins can change role/status
    if (req.user.role === 'admin') {
      if (role) updates.role = role;
      if (status) updates.status = status;
    }

    const db = getDb();
    const user = await db.updateUser(req.params.id, updates);
    res.json({ user });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/users/:id - admin only
router.delete('/:id', requireAdmin, async (req, res) => {
  try {
    if (req.user.id === req.params.id) return res.status(400).json({ error: 'Cannot delete yourself' });
    const db = getDb();
    await db.deleteUser(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
