const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

const CATEGORIES = [
  'Full Stack Web Development',
  'AI & Machine Learning',
  'Data Science & Analytics',
  'Cloud & DevOps',
  'Cyber Security',
  'Mobile App Development',
  'Core CS & DSA',
  'Other'
];

const DELIVERY_FORMATS = ['Online Live', 'Offline Bootcamp', 'Hybrid'];

// List courses
router.get('/', (req, res) => {
  try {
    const userId = req.user.id;
    const { category, delivery_format, active_only } = req.query;

    let sql = `
      SELECT 
        crs.*,
        (SELECT COUNT(*) FROM proposals p WHERE p.course_id = crs.id) AS proposals_count,
        (SELECT COUNT(*) FROM proposals p WHERE p.course_id = crs.id AND p.status = 'Accepted') AS accepted_proposals_count
      FROM courses crs
      WHERE crs.user_id = ?
    `;

    const params = [userId];

    if (active_only === '1') {
      sql += ' AND crs.is_active = 1';
    }

    if (category && category !== 'All') {
      sql += ' AND crs.category = ?';
      params.push(category);
    }

    if (delivery_format && delivery_format !== 'All') {
      sql += ' AND crs.delivery_format = ?';
      params.push(delivery_format);
    }

    sql += ' ORDER BY crs.name ASC';

    const items = db.query(sql, params);
    res.json({ items, categories: CATEGORIES, deliveryFormats: DELIVERY_FORMATS });
  } catch (err) {
    console.error('Error fetching courses:', err);
    res.status(500).json({ error: 'Failed to fetch courses.' });
  }
});

// Get single course
router.get('/:id', (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const course = db.get('SELECT * FROM courses WHERE id = ? AND user_id = ?', [id, userId]);
    if (!course) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    const proposals = db.query(
      `SELECT p.*, c.name AS college_name, c.city AS college_city, c.state AS college_state 
       FROM proposals p 
       JOIN colleges c ON p.college_id = c.id
       WHERE p.course_id = ? 
       ORDER BY p.created_at DESC`,
      [id]
    );

    res.json({ course, proposals });
  } catch (err) {
    console.error('Error fetching course:', err);
    res.status(500).json({ error: 'Failed to fetch course details.' });
  }
});

// Create course
router.post('/', (req, res) => {
  try {
    const userId = req.user.id;
    const {
      name,
      category,
      description,
      duration,
      delivery_format = 'Hybrid',
      syllabus_link = '',
      certificate_details,
      course_fee,
      fee_model = 'Per Student',
      min_batch_size = 30,
      placement_guidance = '',
      approved_claims = '',
      is_active = 1
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Course name is required.' });
    }
    if (!category || !category.trim()) {
      return res.status(400).json({ error: 'Course category is required.' });
    }
    if (!description || !description.trim()) {
      return res.status(400).json({ error: 'Course description is required.' });
    }
    if (!duration || !duration.trim()) {
      return res.status(400).json({ error: 'Duration is required.' });
    }
    if (!certificate_details || !certificate_details.trim()) {
      return res.status(400).json({ error: 'Certificate details are required.' });
    }
    if (course_fee === undefined || course_fee === null || isNaN(course_fee)) {
      return res.status(400).json({ error: 'Valid course fee is required.' });
    }

    const result = db.run(
      `INSERT INTO courses (
        user_id, name, category, description, duration, delivery_format,
        syllabus_link, certificate_details, course_fee, fee_model,
        min_batch_size, placement_guidance, approved_claims, is_active
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        userId,
        name.trim(),
        category.trim(),
        description.trim(),
        duration.trim(),
        delivery_format,
        syllabus_link ? syllabus_link.trim() : '',
        certificate_details.trim(),
        parseFloat(course_fee),
        fee_model,
        parseInt(min_batch_size, 10) || 30,
        placement_guidance.trim(),
        approved_claims.trim(),
        is_active ? 1 : 0
      ]
    );

    const created = db.get('SELECT * FROM courses WHERE id = ?', [result.lastInsertRowid]);
    res.status(201).json({ message: 'Course created successfully.', course: created });
  } catch (err) {
    console.error('Error creating course:', err);
    res.status(500).json({ error: 'Failed to create course.' });
  }
});

// Update course
router.put('/:id', (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const course = db.get('SELECT id FROM courses WHERE id = ? AND user_id = ?', [id, userId]);
    if (!course) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    const {
      name,
      category,
      description,
      duration,
      delivery_format,
      syllabus_link,
      certificate_details,
      course_fee,
      fee_model,
      min_batch_size,
      placement_guidance,
      approved_claims,
      is_active
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'Course name is required.' });
    }

    db.run(
      `UPDATE courses SET
        name = ?, category = ?, description = ?, duration = ?, delivery_format = ?,
        syllabus_link = ?, certificate_details = ?, course_fee = ?, fee_model = ?,
        min_batch_size = ?, placement_guidance = ?, approved_claims = ?, is_active = ?,
        updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
      [
        name.trim(),
        category ? category.trim() : '',
        description ? description.trim() : '',
        duration ? duration.trim() : '',
        delivery_format || 'Hybrid',
        syllabus_link !== undefined ? syllabus_link.trim() : '',
        certificate_details ? certificate_details.trim() : '',
        course_fee !== undefined ? parseFloat(course_fee) : 0,
        fee_model || 'Per Student',
        min_batch_size !== undefined ? parseInt(min_batch_size, 10) : 30,
        placement_guidance !== undefined ? placement_guidance.trim() : '',
        approved_claims !== undefined ? approved_claims.trim() : '',
        is_active !== undefined ? (is_active ? 1 : 0) : 1,
        id,
        userId
      ]
    );

    const updated = db.get('SELECT * FROM courses WHERE id = ?', [id]);
    res.json({ message: 'Course updated successfully.', course: updated });
  } catch (err) {
    console.error('Error updating course:', err);
    res.status(500).json({ error: 'Failed to update course.' });
  }
});

// Delete course
router.delete('/:id', (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const course = db.get('SELECT id, name FROM courses WHERE id = ? AND user_id = ?', [id, userId]);
    if (!course) {
      return res.status(404).json({ error: 'Course not found.' });
    }

    db.run('DELETE FROM courses WHERE id = ? AND user_id = ?', [id, userId]);
    res.json({ message: `Course "${course.name}" deleted successfully.` });
  } catch (err) {
    console.error('Error deleting course:', err);
    res.status(500).json({ error: 'Failed to delete course.' });
  }
});

module.exports = router;
