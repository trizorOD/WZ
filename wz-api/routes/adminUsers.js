// wz-api/routes/adminUsers.js
const express = require('express');
const bcrypt = require('bcryptjs');
const { requireAuth } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/requireAdmin');
const {
  listUsers,
  insertUser,
  setUserActive,
  updateUserPassword,
} = require('../repositories/users');

const router = express.Router();

router.get('/', requireAuth, requireAdmin, async (_req, res) => {
  try {
    const users = await listUsers();
    res.json(users);
  } catch (err) {
    console.error('Failed to list users:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/', requireAuth, requireAdmin, async (req, res) => {
  const { email, password, fullName, role } = req.body;
  if (!email || !password || !fullName) {
    return res.status(400).json({ error: 'email, password and fullName are required' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);
    let user;
    try {
      user = await insertUser({ email, passwordHash, fullName, role: role || 'user' });
    } catch (err) {
      if (err.code === '23505') {
        return res.status(409).json({ error: 'A user with this email already exists' });
      }
      throw err;
    }
    res.status(201).json(user);
  } catch (err) {
    console.error('Failed to create user:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id/deactivate', requireAuth, requireAdmin, async (req, res) => {
  try {
    const user = await setUserActive(req.params.id, false);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('Failed to deactivate user:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id/reactivate', requireAuth, requireAdmin, async (req, res) => {
  try {
    const user = await setUserActive(req.params.id, true);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error('Failed to reactivate user:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.patch('/:id/password', requireAuth, requireAdmin, async (req, res) => {
  const { newPassword } = req.body;
  if (!newPassword) {
    return res.status(400).json({ error: 'newPassword is required' });
  }

  try {
    const passwordHash = await bcrypt.hash(newPassword, 10);
    const user = await updateUserPassword(req.params.id, passwordHash);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ id: user.id });
  } catch (err) {
    console.error('Failed to update password:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
