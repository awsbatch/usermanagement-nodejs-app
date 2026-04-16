// routes/auth.js
import { Router } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { getDb } from '../models/dbAdapter.js';

const router = Router();

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    const db = getDb();
    const user = await db.findByEmail(email);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const valid = await db.verifyPassword(user, password);
    if (!valid) return res.status(401).json({ error: 'Invalid credentials' });

    if (user.status === 'inactive') return res.status(403).json({ error: 'Account is inactive' });

    await db.updateLastLogin(user._id.toString());

    const token = jwt.sign(
      { id: user._id.toString(), email: user.email, role: user.role, name: user.name },
      config.jwtSecret,
      { expiresIn: '24h' }
    );

    res.cookie('token', token, { httpOnly: true, maxAge: 86400000 });
    res.json({ success: true, token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true });
});

// GET /api/auth/me
router.get('/me', async (req, res) => {
  const token = req.cookies?.token || req.headers?.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Not authenticated' });
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    res.json({ user: decoded });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

export default router;
