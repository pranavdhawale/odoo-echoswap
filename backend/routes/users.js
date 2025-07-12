const express = require('express');
const { pool } = require('../config/database');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Get all public users
router.get('/', async (req, res) => {
  try {
    const { search, skill } = req.query;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const offset = (page - 1) * limit;

    let query = `
      SELECT DISTINCT u.id, u.name, u.location, u.profile_photo, u.availability, 
             u.rating, u.total_ratings, u.created_at
      FROM users u
      WHERE u.is_public = true AND u.is_banned = false
    `;
    const queryParams = [];

    // Add skill filter
    if (skill) {
      query += `
        AND (u.id IN (
          SELECT us.user_id FROM user_skills us 
          JOIN skills s ON us.skill_id = s.id 
          WHERE s.name LIKE ?
        ))
      `;
      queryParams.push(`%${skill}%`);
    }

    // Add search filter
    if (search) {
      query += ` AND (u.name LIKE ? OR u.location LIKE ?)`;
      queryParams.push(`%${search}%`, `%${search}%`);
    }

    query += ` ORDER BY u.created_at DESC LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;

    const [users] = await pool.execute(query, queryParams);

    // Get skills for each user
    for (let user of users) {
      if (user.availability) {
        user.availability = JSON.parse(user.availability);
      }

      const [skills] = await pool.execute(`
        SELECT s.id, s.name, s.description, us.experience_level, us.description as user_description
        FROM user_skills us
        JOIN skills s ON us.skill_id = s.id
        WHERE us.user_id = ?
      `, [user.id]);

      const [wantedSkills] = await pool.execute(`
        SELECT s.id, s.name, s.description, ws.priority, ws.description as user_description
        FROM wanted_skills ws
        JOIN skills s ON ws.skill_id = s.id
        WHERE ws.user_id = ?
      `, [user.id]);

      user.skills_offered = skills;
      user.skills_wanted = wantedSkills;
    }

    // Get total count
    let countQuery = `
      SELECT COUNT(DISTINCT u.id) as total
      FROM users u
      WHERE u.is_public = true AND u.is_banned = false
    `;
    const countParams = [];

    if (skill) {
      countQuery += `
        AND (u.id IN (
          SELECT us.user_id FROM user_skills us 
          JOIN skills s ON us.skill_id = s.id 
          WHERE s.name LIKE ?
        ))
      `;
      countParams.push(`%${skill}%`);
    }

    if (search) {
      countQuery += ` AND (u.name LIKE ? OR u.location LIKE ?)`;
      countParams.push(`%${search}%`, `%${search}%`);
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

// Get current user's skills
router.get('/me/skills', auth, async (req, res) => {
  try {
    const [offeredSkills] = await pool.execute(`
      SELECT s.id, s.name, s.description, us.experience_level, us.description as user_description
      FROM user_skills us
      JOIN skills s ON us.skill_id = s.id
      WHERE us.user_id = ?
    `, [req.user.id]);

    const [wantedSkills] = await pool.execute(`
      SELECT s.id, s.name, s.description, ws.priority, ws.description as user_description
      FROM wanted_skills ws
      JOIN skills s ON ws.skill_id = s.id
      WHERE ws.user_id = ?
    `, [req.user.id]);

    res.json({
      skills_offered: offeredSkills,
      skills_wanted: wantedSkills
    });
  } catch (error) {
    console.error('Get skills error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add skill to user's offered skills
router.post('/me/skills/offered', auth, async (req, res) => {
  try {
    const { skill_id, description, experience_level = 'intermediate' } = req.body;

    console.log('Adding skill to user:', {
      user_id: req.user.id,
      skill_id,
      description,
      experience_level
    });

    if (!skill_id) {
      return res.status(400).json({ message: 'Skill ID is required' });
    }

    await pool.execute(`
      INSERT INTO user_skills (user_id, skill_id, description, experience_level)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
      description = VALUES(description),
      experience_level = VALUES(experience_level)
    `, [req.user.id, skill_id, description, experience_level]);

    console.log('Skill added successfully');
    res.json({ message: 'Skill added successfully' });
  } catch (error) {
    console.error('Add skill error:', error);
    res.status(500).json({ message: error.message || 'Server error', code: error.code, sqlMessage: error.sqlMessage });
  }
});

// Add skill to user's wanted skills
router.post('/me/skills/wanted', auth, async (req, res) => {
  try {
    const { skill_id, description, priority = 'medium' } = req.body;

    if (!skill_id) {
      return res.status(400).json({ message: 'Skill ID is required' });
    }

    await pool.execute(`
      INSERT INTO wanted_skills (user_id, skill_id, description, priority)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE 
      description = VALUES(description),
      priority = VALUES(priority)
    `, [req.user.id, skill_id, description, priority]);

    res.json({ message: 'Wanted skill added successfully' });
  } catch (error) {
    console.error('Add wanted skill error:', error);
    res.status(500).json({ message: error.message || 'Server error', code: error.code, sqlMessage: error.sqlMessage });
  }
});

// Remove skill from user's offered skills
router.delete('/me/skills/offered/:skillId', auth, async (req, res) => {
  try {
    const { skillId } = req.params;

    await pool.execute(
      'DELETE FROM user_skills WHERE user_id = ? AND skill_id = ?',
      [req.user.id, skillId]
    );

    res.json({ message: 'Skill removed successfully' });
  } catch (error) {
    console.error('Remove skill error:', error);
    res.status(500).json({ message: error.message || 'Server error', code: error.code, sqlMessage: error.sqlMessage });
  }
});

// Remove skill from user's wanted skills
router.delete('/me/skills/wanted/:skillId', auth, async (req, res) => {
  try {
    const { skillId } = req.params;

    await pool.execute(
      'DELETE FROM wanted_skills WHERE user_id = ? AND skill_id = ?',
      [req.user.id, skillId]
    );

    res.json({ message: 'Wanted skill removed successfully' });
  } catch (error) {
    console.error('Remove wanted skill error:', error);
    res.status(500).json({ message: error.message || 'Server error', code: error.code, sqlMessage: error.sqlMessage });
  }
});

// Get user by ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    console.log('Fetching user with ID:', id);

    const [users] = await pool.execute(`
      SELECT id, name, location, profile_photo, availability, 
             rating, total_ratings, created_at, is_public, is_banned
      FROM users 
      WHERE id = ?
    `, [id]);

    console.log('Found users:', users.length);
    if (users.length > 0) {
      console.log('User data:', {
        id: users[0].id,
        name: users[0].name,
        is_public: users[0].is_public,
        is_banned: users[0].is_banned
      });
    }

    if (users.length === 0) {
      console.log('No user found with ID:', id);
      return res.status(404).json({ message: 'User not found' });
    }

    if (!users[0].is_public || users[0].is_banned) {
      console.log('User not accessible - is_public:', users[0].is_public, 'is_banned:', users[0].is_banned);
      return res.status(404).json({ message: 'User not found' });
    }

    const user = users[0];
    if (user.availability) {
      user.availability = JSON.parse(user.availability);
    }

    // Get skills offered
    const [skills] = await pool.execute(`
      SELECT s.id, s.name, s.description, us.experience_level, us.description as user_description
      FROM user_skills us
      JOIN skills s ON us.skill_id = s.id
      WHERE us.user_id = ?
    `, [id]);

    // Get skills wanted
    const [wantedSkills] = await pool.execute(`
      SELECT s.id, s.name, s.description, ws.priority, ws.description as user_description
      FROM wanted_skills ws
      JOIN skills s ON ws.skill_id = s.id
      WHERE ws.user_id = ?
    `, [id]);

    // Get recent ratings
    const [ratings] = await pool.execute(`
      SELECT r.rating, r.comment, r.created_at, u.name as rater_name
      FROM ratings r
      JOIN users u ON r.rater_id = u.id
      WHERE r.rated_id = ?
      ORDER BY r.created_at DESC
      LIMIT 5
    `, [id]);

    user.skills_offered = skills;
    user.skills_wanted = wantedSkills;
    user.recent_ratings = ratings;

    res.json({ user });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 