const express = require('express');
const { pool } = require('../config/database');
const { adminAuth } = require('../middleware/auth');

const router = express.Router();

// Get all users (admin only)
router.get('/users', adminAuth, async (req, res) => {
  try {
    const { search, status } = req.query;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = parseInt((page - 1) * limit, 10);

    let query = 'SELECT * FROM users WHERE 1=1';
    const queryParams = [];

    if (search) {
      query += ' AND (name LIKE ? OR email LIKE ? OR location LIKE ?)';
      queryParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status === 'banned') {
      query += ' AND is_banned = true';
    } else if (status === 'active') {
      query += ' AND is_banned = false';
    }

    query += ` ORDER BY created_at DESC LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;

    console.log('Admin users query params:', { limit, offset, queryParams });
    const [users] = await pool.execute(query, queryParams);

    // Attach skills_offered and skills_wanted for each user
    await Promise.all(users.map(async (user) => {
      const [skillsOffered] = await pool.execute(
        `SELECT s.id, s.name, s.description, us.experience_level, us.description as user_description
         FROM user_skills us
         JOIN skills s ON us.skill_id = s.id
         WHERE us.user_id = ?`,
        [user.id]
      );
      const [skillsWanted] = await pool.execute(
        `SELECT s.id, s.name, s.description, ws.priority, ws.description as user_description
         FROM wanted_skills ws
         JOIN skills s ON ws.skill_id = s.id
         WHERE ws.user_id = ?`,
        [user.id]
      );
      user.skills_offered = skillsOffered;
      user.skills_wanted = skillsWanted;
    }));

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM users WHERE 1=1';
    const countParams = [];

    if (search) {
      countQuery += ' AND (name LIKE ? OR email LIKE ? OR location LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    if (status === 'banned') {
      countQuery += ' AND is_banned = true';
    } else if (status === 'active') {
      countQuery += ' AND is_banned = false';
    }

    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Ban/Unban user
router.put('/users/:id/ban', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { is_banned } = req.body;

    const [result] = await pool.execute(
      'UPDATE users SET is_banned = ? WHERE id = ?',
      [is_banned, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ message: `User ${is_banned ? 'banned' : 'unbanned'} successfully` });
  } catch (error) {
    console.error('Ban user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all swaps (admin only)
router.get('/swaps', adminAuth, async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 20;
    const { status } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT s.*
      FROM swaps s
      WHERE 1=1
    `;
    const queryParams = [];

    if (status) {
      query += ' AND s.status = ?';
      queryParams.push(status);
    }

    query += ` ORDER BY s.created_at DESC LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;

    const [swaps] = await pool.execute(query, queryParams);

    // Helper to fetch user by ID
    async function getUserById(id) {
      const [users] = await pool.execute(
        'SELECT id, name, email, location, profile_photo, rating, total_ratings FROM users WHERE id = ?',
        [id]
      );
      return users[0] || null;
    }
    // Attach skills arrays to each swap
    for (const swap of swaps) {
      swap.requester = await getUserById(swap.requester_id);
      swap.provider = await getUserById(swap.provider_id);
      const [offered] = await pool.execute(
        'SELECT s.id, s.name, s.description FROM swap_offered_skills sos JOIN skills s ON sos.skill_id = s.id WHERE sos.swap_id = ?',
        [swap.id]
      );
      const [wanted] = await pool.execute(
        'SELECT s.id, s.name, s.description FROM swap_requested_skills srs JOIN skills s ON srs.skill_id = s.id WHERE srs.swap_id = ?',
        [swap.id]
      );
      swap.skills_offered = offered;
      swap.skills_wanted = wanted;
    }

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM swaps WHERE 1=1';
    const countParams = [];

    if (status) {
      countQuery += ' AND status = ?';
      countParams.push(status);
    }

    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      swaps,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get swaps error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add after the GET /swaps endpoint
router.delete('/swaps/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.execute('DELETE FROM swaps WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Swap not found' });
    }
    res.json({ message: 'Swap deleted successfully' });
  } catch (error) {
    console.error('Delete swap error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get platform statistics
router.get('/stats', adminAuth, async (req, res) => {
  try {
    // Total users
    const [userStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN is_banned = true THEN 1 END) as banned_users,
        COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as new_users_30d
      FROM users
    `);

    // Total swaps
    const [swapStats] = await pool.execute(`
      SELECT 
        COUNT(*) as total_swaps,
        COUNT(CASE WHEN status = 'pending' THEN 1 END) as pending_swaps,
        COUNT(CASE WHEN status = 'accepted' THEN 1 END) as accepted_swaps,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed_swaps,
        COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as new_swaps_30d
      FROM swaps
    `);

    // Popular skills
    const [popularSkills] = await pool.execute(`
      SELECT s.name, s.category,
             COUNT(us.id) as offered_count,
             COUNT(ws.id) as wanted_count
      FROM skills s
      LEFT JOIN user_skills us ON s.id = us.skill_id
      LEFT JOIN wanted_skills ws ON s.id = ws.skill_id
      GROUP BY s.id
      ORDER BY (offered_count + wanted_count) DESC
      LIMIT 10
    `);

    // Average rating
    const [ratingStats] = await pool.execute(`
      SELECT AVG(rating) as avg_rating, COUNT(*) as total_ratings
      FROM ratings
    `);

    res.json({
      users: userStats[0],
      swaps: swapStats[0],
      popular_skills: popularSkills,
      ratings: ratingStats[0]
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create admin message
router.post('/messages', adminAuth, async (req, res) => {
  try {
    const { title, message, type = 'info' } = req.body;

    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required' });
    }

    const [result] = await pool.execute(
      'INSERT INTO admin_messages (title, message, type) VALUES (?, ?, ?)',
      [title, message, type]
    );

    res.status(201).json({ 
      message: 'Admin message created successfully',
      message_id: result.insertId
    });
  } catch (error) {
    console.error('Create message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get admin messages
router.get('/messages', adminAuth, async (req, res) => {
  try {
    const [messages] = await pool.execute(
      'SELECT * FROM admin_messages ORDER BY created_at DESC'
    );

    res.json({ messages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update admin message
router.put('/messages/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, message, type, is_active } = req.body;

    const [result] = await pool.execute(
      'UPDATE admin_messages SET title = ?, message = ?, type = ?, is_active = ? WHERE id = ?',
      [title, message, type, is_active, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Message not found' });
    }

    res.json({ message: 'Message updated successfully' });
  } catch (error) {
    console.error('Update message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete admin message
router.delete('/messages/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.execute(
      'DELETE FROM admin_messages WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Message not found' });
    }

    res.json({ message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get active admin messages (public endpoint)
router.get('/messages/active', async (req, res) => {
  try {
    const [messages] = await pool.execute(
      'SELECT title, message, type, created_at FROM admin_messages WHERE is_active = true ORDER BY created_at DESC'
    );

    res.json({ messages });
  } catch (error) {
    console.error('Get active messages error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 