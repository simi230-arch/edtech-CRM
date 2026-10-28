const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

const COLLABORATION_TYPES = [
  'Guest Lectures',
  'Industry Mentors',
  'Course Design',
  'Projects',
  'Internships',
  'Hiring Partnerships',
  'Referrals'
];

// List startups with search, filters, and referral metrics
router.get('/', (req, res) => {
  try {
    const userId = req.user.id;
    const { search, strength, status, collaboration_type } = req.query;

    let sql = `
      SELECT 
        s.*,
        (SELECT COUNT(*) FROM colleges c WHERE c.startup_id = s.id) AS referred_colleges_count,
        (SELECT COUNT(*) FROM colleges c WHERE c.startup_id = s.id AND c.status = 'Won') AS won_colleges_count,
        (SELECT COALESCE(SUM(c.won_pricing * c.won_student_count), 0) FROM colleges c WHERE c.startup_id = s.id AND c.status = 'Won') AS total_won_revenue
      FROM startups s
      WHERE s.user_id = ?
    `;

    const params = [userId];

    if (strength && strength !== 'All') {
      sql += ' AND s.relationship_strength = ?';
      params.push(strength);
    }

    if (status && status !== 'All') {
      sql += ' AND s.collaboration_status = ?';
      params.push(status);
    }

    if (search && search.trim()) {
      const term = `%${search.trim().toLowerCase()}%`;
      sql += ' AND (LOWER(s.name) LIKE ? OR LOWER(s.contact_name) LIKE ? OR LOWER(s.industry) LIKE ? OR LOWER(s.city) LIKE ?)';
      params.push(term, term, term, term);
    }

    sql += ' ORDER BY s.relationship_strength ASC, s.name ASC';

    let items = db.query(sql, params);

    // Parse JSON collaboration_types
    items = items.map(item => {
      let types = [];
      try {
        types = JSON.parse(item.collaboration_types || '[]');
      } catch (e) {
        types = item.collaboration_types ? item.collaboration_types.split(',').map(s => s.trim()) : [];
      }
      return { ...item, collaboration_types: types };
    });

    if (collaboration_type && collaboration_type !== 'All') {
      items = items.filter(item => item.collaboration_types.includes(collaboration_type));
    }

    res.json({ items, availableTypes: COLLABORATION_TYPES });
  } catch (err) {
    console.error('Error fetching startups:', err);
    res.status(500).json({ error: 'Failed to fetch startup network.' });
  }
});

// Get startup details + list of linked college leads
router.get('/:id', (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const startup = db.get('SELECT * FROM startups WHERE id = ? AND user_id = ?', [id, userId]);
    if (!startup) {
      return res.status(404).json({ error: 'Startup not found.' });
    }

    try {
      startup.collaboration_types = JSON.parse(startup.collaboration_types || '[]');
    } catch (e) {
      startup.collaboration_types = [];
    }

    const linkedColleges = db.query(
      `SELECT id, name, city, state, status, priority, won_pricing, won_student_count, created_at 
       FROM colleges 
       WHERE startup_id = ? AND user_id = ?
       ORDER BY created_at DESC`,
      [id, userId]
    );

    res.json({ startup, linkedColleges });
  } catch (err) {
    console.error('Error fetching startup details:', err);
    res.status(500).json({ error: 'Failed to fetch startup details.' });
  }
});

// Create new startup connection
router.post('/', (req, res) => {
  try {
    const userId = req.user.id;
    const {
      name,
      industry,
      website = '',
      city = '',
      contact_name,
      contact_designation = '',
      email = '',
      phone = '',
      relationship_strength = 'Warm',
      last_interaction_date = '',
      collaboration_types = [],
      collaboration_status = 'Exploring',
      follow_up_date = '',
      notes = ''
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Startup name is required.' });
    }
    if (!industry || !industry.trim()) {
      return res.status(400).json({ error: 'Industry is required.' });
    }
    if (!contact_name || !contact_name.trim()) {
      return res.status(400).json({ error: 'Contact person name is required.' });
    }

    const jsonTypes = JSON.stringify(Array.isArray(collaboration_types) ? collaboration_types : []);

    const result = db.run(
      `INSERT INTO startups (
        user_id, name, industry, website, city, contact_name, contact_designation,
        email, phone, relationship_strength, last_interaction_date, collaboration_types,
        collaboration_status, follow_up_date, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        name.trim(),
        industry.trim(),
        website.trim(),
        city.trim(),
        contact_name.trim(),
        contact_designation.trim(),
        email.trim(),
        phone.trim(),
        relationship_strength,
        last_interaction_date || null,
        jsonTypes,
        collaboration_status,
        follow_up_date || null,
        notes.trim()
      ]
    );

    const created = db.get('SELECT * FROM startups WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json({ message: 'Startup connection saved.', startup: created });
  } catch (err) {
    console.error('Error creating startup:', err);
    res.status(500).json({ error: 'Failed to create startup connection.' });
  }
});

// Update startup
router.put('/:id', (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const startup = db.get('SELECT id FROM startups WHERE id = ? AND user_id = ?', [id, userId]);
    if (!startup) {
      return res.status(404).json({ error: 'Startup not found.' });
    }

    const {
      name,
      industry,
      website,
      city,
      contact_name,
      contact_designation,
      email,
      phone,
      relationship_strength,
      last_interaction_date,
      collaboration_types,
      collaboration_status,
      follow_up_date,
      notes
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Startup name is required.' });
    }

    const jsonTypes = JSON.stringify(Array.isArray(collaboration_types) ? collaboration_types : []);

    db.run(
      `UPDATE startups SET
        name = ?, industry = ?, website = ?, city = ?, contact_name = ?,
        contact_designation = ?, email = ?, phone = ?, relationship_strength = ?,
        last_interaction_date = ?, collaboration_types = ?, collaboration_status = ?,
        follow_up_date = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
      [
        name.trim(),
        industry ? industry.trim() : '',
        website ? website.trim() : '',
        city ? city.trim() : '',
        contact_name ? contact_name.trim() : '',
        contact_designation ? contact_designation.trim() : '',
        email ? email.trim() : '',
        phone ? phone.trim() : '',
        relationship_strength || 'Warm',
        last_interaction_date || null,
        jsonTypes,
        collaboration_status || 'Exploring',
        follow_up_date || null,
        notes !== undefined ? notes : '',
        id,
        userId
      ]
    );

    const updated = db.get('SELECT * FROM startups WHERE id = ?', [id]);
    res.json({ message: 'Startup connection updated.', startup: updated });
  } catch (err) {
    console.error('Error updating startup:', err);
    res.status(500).json({ error: 'Failed to update startup connection.' });
  }
});

// Delete startup
router.delete('/:id', (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const startup = db.get('SELECT id, name FROM startups WHERE id = ? AND user_id = ?', [id, userId]);
    if (!startup) {
      return res.status(404).json({ error: 'Startup not found.' });
    }

    // Set startup_id = NULL on linked colleges then delete startup
    db.transaction(({ run }) => {
      run('UPDATE colleges SET startup_id = NULL WHERE startup_id = ?', [id]);
      run('DELETE FROM startups WHERE id = ? AND user_id = ?', [id, userId]);
    });

    res.json({ message: `Startup "${startup.name}" deleted successfully.` });
  } catch (err) {
    console.error('Error deleting startup:', err);
    res.status(500).json({ error: 'Failed to delete startup connection.' });
  }
});

module.exports = router;
