const express = require('express');
const { pool } = require('../config/database');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Get all skills
router.get('/', async (req, res) => {
  try {
    const { search, category } = req.query;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    let query = 'SELECT * FROM skills WHERE 1=1';
    const queryParams = [];

    if (search) {
      query += ' AND name LIKE ?';
      queryParams.push(`%${search}%`);
    }

    if (category) {
      query += ' AND category = ?';
      queryParams.push(category);
    }

    query += ` ORDER BY name ASC LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;

    const [skills] = await pool.execute(query, queryParams);

    // Get total count
    let countQuery = 'SELECT COUNT(*) as total FROM skills WHERE 1=1';
    const countParams = [];

    if (search) {
      countQuery += ' AND (name LIKE ? OR description LIKE ?)';
      countParams.push(`%${search}%`, `%${search}%`);
    }

    if (category) {
      countQuery += ' AND category = ?';
      countParams.push(category);
    }

    const [countResult] = await pool.execute(countQuery, countParams);
    const total = countResult[0].total;

    res.json({
      skills,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get skills error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get skill categories
router.get('/categories', async (req, res) => {
  try {
    const [categories] = await pool.execute(
      'SELECT DISTINCT category FROM skills WHERE category IS NOT NULL ORDER BY category'
    );

    res.json({ categories: categories.map(c => c.category) });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get skill by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const [skills] = await pool.execute(
      'SELECT * FROM skills WHERE id = ?',
      [id]
    );

    if (skills.length === 0) {
      return res.status(404).json({ message: 'Skill not found' });
    }

    res.json({ skill: skills[0] });
  } catch (error) {
    console.error('Get skill error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new skill (admin only)
router.post('/', adminAuth, async (req, res) => {
  try {
    const { name, description, category } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Skill name is required' });
    }

    const [result] = await pool.execute(
      'INSERT INTO skills (name, description, category) VALUES (?, ?, ?)',
      [name, description, category]
    );

    const [newSkill] = await pool.execute(
      'SELECT * FROM skills WHERE id = ?',
      [result.insertId]
    );

    res.status(201).json({ skill: newSkill[0] });
  } catch (error) {
    console.error('Create skill error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update skill (admin only)
router.put('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category } = req.body;

    const [result] = await pool.execute(
      'UPDATE skills SET name = ?, description = ?, category = ? WHERE id = ?',
      [name, description, category, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Skill not found' });
    }

    const [updatedSkill] = await pool.execute(
      'SELECT * FROM skills WHERE id = ?',
      [id]
    );

    res.json({ skill: updatedSkill[0] });
  } catch (error) {
    console.error('Update skill error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete skill (admin only)
router.delete('/:id', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;

    const [result] = await pool.execute(
      'DELETE FROM skills WHERE id = ?',
      [id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Skill not found' });
    }

    res.json({ message: 'Skill deleted successfully' });
  } catch (error) {
    console.error('Delete skill error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get popular skills
router.get('/popular/list', async (req, res) => {
  try {
    const [skills] = await pool.execute(`
      SELECT s.id, s.name, s.description, s.category,
             COUNT(us.id) as offered_count,
             COUNT(ws.id) as wanted_count
      FROM skills s
      LEFT JOIN user_skills us ON s.id = us.skill_id
      LEFT JOIN wanted_skills ws ON s.id = ws.skill_id
      GROUP BY s.id
      ORDER BY (offered_count + wanted_count) DESC
      LIMIT 10
    `);

    res.json({ skills });
  } catch (error) {
    console.error('Get popular skills error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 