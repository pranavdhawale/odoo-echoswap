const express = require('express');
const { pool } = require('../config/database');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Create a swap request
router.post('/', auth, async (req, res) => {
  try {
    const { provider_id, offered_skill_ids, requested_skill_ids, message } = req.body;

    if (!provider_id || !Array.isArray(offered_skill_ids) || !Array.isArray(requested_skill_ids) || offered_skill_ids.length === 0 || requested_skill_ids.length === 0) {
      return res.status(400).json({ message: 'Provider ID, offered_skill_ids, and requested_skill_ids are required and must be non-empty arrays' });
    }

    // Check if user is trying to swap with themselves
    if (provider_id == req.user.id) {
      return res.status(400).json({ message: 'Cannot create swap request with yourself' });
    }

    // Validate all skills
    for (const skillId of offered_skill_ids) {
      const [requesterSkills] = await pool.execute(
        'SELECT id FROM user_skills WHERE user_id = ? AND skill_id = ?',
        [req.user.id, skillId]
      );
      if (requesterSkills.length === 0) {
        return res.status(400).json({ message: `You do not offer the skill with ID ${skillId}` });
      }
    }
    for (const skillId of requested_skill_ids) {
      const [providerSkills] = await pool.execute(
        'SELECT id FROM user_skills WHERE user_id = ? AND skill_id = ?',
        [provider_id, skillId]
      );
      if (providerSkills.length === 0) {
        return res.status(400).json({ message: `Provider does not offer the requested skill with ID ${skillId}` });
      }
    }

    // Check for existing pending swap between these users (any overlap)
    // (Optional: you can make this stricter if needed)

    // Create the swap request
    const [result] = await pool.execute(
      'INSERT INTO swaps (requester_id, provider_id, message) VALUES (?, ?, ?)',
      [req.user.id, provider_id, message]
    );
    const swapId = result.insertId;

    // Insert offered skills
    for (const skillId of offered_skill_ids) {
      await pool.execute(
        'INSERT INTO swap_offered_skills (swap_id, skill_id) VALUES (?, ?)',
        [swapId, skillId]
      );
    }
    // Insert requested skills
    for (const skillId of requested_skill_ids) {
      await pool.execute(
        'INSERT INTO swap_requested_skills (swap_id, skill_id) VALUES (?, ?)',
        [swapId, skillId]
      );
    }

    res.status(201).json({ 
      message: 'Swap request created successfully',
      swap_id: swapId
    });
  } catch (error) {
    console.error('Create swap error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get user's swaps (as requester and provider)
router.get('/my-swaps', auth, async (req, res) => {
  try {
    const { status } = req.query;
    let statusFilter = '';
    const params = [req.user.id, req.user.id];

    if (status) {
      statusFilter = 'AND s.status = ?';
      params.push(status);
    }

    const [swaps] = await pool.execute(`
      SELECT s.*
      FROM swaps s
      WHERE (s.requester_id = ? OR s.provider_id = ?) ${statusFilter}
      ORDER BY s.created_at DESC
    `, params);

    // Attach skills arrays to each swap
    for (const swap of swaps) {
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

    res.json({ swaps });
  } catch (error) {
    console.error('Get swaps error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Accept a swap request
router.put('/:id/accept', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if swap exists and user is the provider
    const [swaps] = await pool.execute(
      'SELECT * FROM swaps WHERE id = ? AND provider_id = ? AND status = "pending"',
      [id, req.user.id]
    );

    if (swaps.length === 0) {
      return res.status(404).json({ message: 'Swap request not found or you are not authorized to accept it' });
    }

    // Update swap status
    await pool.execute(
      'UPDATE swaps SET status = "accepted" WHERE id = ?',
      [id]
    );

    res.json({ message: 'Swap request accepted successfully' });
  } catch (error) {
    console.error('Accept swap error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Reject a swap request
router.put('/:id/reject', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if swap exists and user is the provider
    const [swaps] = await pool.execute(
      'SELECT * FROM swaps WHERE id = ? AND provider_id = ? AND status = "pending"',
      [id, req.user.id]
    );

    if (swaps.length === 0) {
      return res.status(404).json({ message: 'Swap request not found or you are not authorized to reject it' });
    }

    // Update swap status
    await pool.execute(
      'UPDATE swaps SET status = "rejected" WHERE id = ?',
      [id]
    );

    res.json({ message: 'Swap request rejected successfully' });
  } catch (error) {
    console.error('Reject swap error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Cancel a swap request (requester only)
router.put('/:id/cancel', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if swap exists and user is the requester
    const [swaps] = await pool.execute(
      'SELECT * FROM swaps WHERE id = ? AND requester_id = ? AND status = "pending"',
      [id, req.user.id]
    );

    if (swaps.length === 0) {
      return res.status(404).json({ message: 'Swap request not found or you are not authorized to cancel it' });
    }

    // Update swap status
    await pool.execute(
      'UPDATE swaps SET status = "cancelled" WHERE id = ?',
      [id]
    );

    res.json({ message: 'Swap request cancelled successfully' });
  } catch (error) {
    console.error('Cancel swap error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Complete a swap
router.put('/:id/complete', auth, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if swap exists and user is involved
    const [swaps] = await pool.execute(
      'SELECT * FROM swaps WHERE id = ? AND (requester_id = ? OR provider_id = ?) AND status = "accepted"',
      [id, req.user.id, req.user.id]
    );

    if (swaps.length === 0) {
      return res.status(404).json({ message: 'Swap not found or not in accepted status' });
    }

    // Update swap status
    await pool.execute(
      'UPDATE swaps SET status = "completed" WHERE id = ?',
      [id]
    );

    res.json({ message: 'Swap completed successfully' });
  } catch (error) {
    console.error('Complete swap error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Rate a completed swap
router.post('/:id/rate', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, comment } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating must be between 1 and 5' });
    }

    // Check if swap exists and is completed
    const [swaps] = await pool.execute(
      'SELECT * FROM swaps WHERE id = ? AND status = "completed"',
      [id]
    );

    if (swaps.length === 0) {
      return res.status(404).json({ message: 'Completed swap not found' });
    }

    const swap = swaps[0];

    // Check if user is involved in the swap
    if (swap.requester_id !== req.user.id && swap.provider_id !== req.user.id) {
      return res.status(403).json({ message: 'You are not authorized to rate this swap' });
    }

    // Determine who is being rated
    const rated_id = swap.requester_id === req.user.id ? swap.provider_id : swap.requester_id;

    // Check if user has already rated this swap
    const [existingRatings] = await pool.execute(
      'SELECT id FROM ratings WHERE swap_id = ? AND rater_id = ?',
      [id, req.user.id]
    );

    if (existingRatings.length > 0) {
      return res.status(400).json({ message: 'You have already rated this swap' });
    }

    // Create rating
    await pool.execute(
      'INSERT INTO ratings (swap_id, rater_id, rated_id, rating, comment) VALUES (?, ?, ?, ?, ?)',
      [id, req.user.id, rated_id, rating, comment]
    );

    // Update user's average rating
    const [ratings] = await pool.execute(
      'SELECT AVG(rating) as avg_rating, COUNT(*) as total_ratings FROM ratings WHERE rated_id = ?',
      [rated_id]
    );

    await pool.execute(
      'UPDATE users SET rating = ?, total_ratings = ? WHERE id = ?',
      [ratings[0].avg_rating, ratings[0].total_ratings, rated_id]
    );

    res.json({ message: 'Rating submitted successfully' });
  } catch (error) {
    console.error('Rate swap error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get swap details
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const [swaps] = await pool.execute('SELECT * FROM swaps WHERE id = ?', [id]);
    if (swaps.length === 0) {
      return res.status(404).json({ message: 'Swap not found' });
    }
    const swap = swaps[0];
    // Attach skills arrays
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
    res.json({ swap });
  } catch (error) {
    console.error('Get swap error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router; 