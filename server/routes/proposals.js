const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

const PROPOSAL_STATUSES = ['Draft', 'Sent', 'Under Review', 'Revised', 'Accepted', 'Rejected'];

// List proposals with filtering
router.get('/', (req, res) => {
  try {
    const userId = req.user.id;
    const { status, college_id, course_id } = req.query;

    let sql = `
      SELECT 
        p.*,
        c.name AS college_name,
        c.city AS college_city,
        c.state AS college_state,
        c.status AS college_stage,
        crs.name AS course_name,
        crs.category AS course_category
      FROM proposals p
      JOIN colleges c ON p.college_id = c.id
      LEFT JOIN courses crs ON p.course_id = crs.id
      WHERE p.user_id = ?
    `;

    const params = [userId];

    if (status && status !== 'All') {
      sql += ' AND p.status = ?';
      params.push(status);
    }

    if (college_id) {
      sql += ' AND p.college_id = ?';
      params.push(college_id);
    }

    if (course_id) {
      sql += ' AND p.course_id = ?';
      params.push(course_id);
    }

    sql += ' ORDER BY p.created_at DESC';

    const items = db.query(sql, params);

    // Summary statistics
    const statsSql = `
      SELECT 
        COUNT(*) AS total_proposals,
        COALESCE(SUM(total_deal_value), 0) AS total_pipeline_value,
        COALESCE(SUM(CASE WHEN status = 'Accepted' THEN total_deal_value ELSE 0 END), 0) AS won_deal_value,
        COALESCE(SUM(CASE WHEN status = 'Sent' OR status = 'Under Review' THEN total_deal_value ELSE 0 END), 0) AS active_deal_value
      FROM proposals
      WHERE user_id = ?
    `;
    const summary = db.get(statsSql, [userId]);

    res.json({ items, summary, statuses: PROPOSAL_STATUSES });
  } catch (err) {
    console.error('Error fetching proposals:', err);
    res.status(500).json({ error: 'Failed to fetch proposals.' });
  }
});

// Create proposal
router.post('/', (req, res) => {
  try {
    const userId = req.user.id;
    const {
      college_id,
      course_id,
      title,
      status = 'Draft',
      date_sent,
      quoted_price,
      expected_students,
      total_deal_value,
      next_action = '',
      notes = ''
    } = req.body;

    if (!college_id) {
      return res.status(400).json({ error: 'College is required.' });
    }
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Proposal title is required.' });
    }

    const college = db.get('SELECT * FROM colleges WHERE id = ? AND user_id = ?', [college_id, userId]);
    if (!college) {
      return res.status(404).json({ error: 'College not found.' });
    }

    const qPrice = quoted_price ? parseFloat(quoted_price) : 0;
    const eStudents = expected_students ? parseInt(expected_students, 10) : 0;
    const dealValue = total_deal_value !== undefined ? parseFloat(total_deal_value) : (qPrice * eStudents);

    const proposalId = db.transaction(({ run }) => {
      const resProp = run(
        `INSERT INTO proposals (
          college_id, course_id, user_id, title, status, date_sent,
          quoted_price, expected_students, total_deal_value, next_action, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          college_id,
          course_id ? parseInt(course_id, 10) : null,
          userId,
          title.trim(),
          status,
          date_sent || (status === 'Sent' ? new Date().toISOString().split('T')[0] : null),
          qPrice,
          eStudents,
          dealValue,
          next_action.trim(),
          notes.trim()
        ]
      );

      // If proposal is sent and college stage is earlier than 'Proposal Sent', move it
      if (status === 'Sent' && ['New Lead', 'Contact Identified', 'First Call Attempted', 'Connected', 'Interested', 'Meeting Scheduled', 'Demo Completed'].includes(college.status)) {
        run(
          'UPDATE colleges SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
          ['Proposal Sent', college_id]
        );
        run(
          `INSERT INTO stage_history (college_id, user_id, from_stage, to_stage, notes, changed_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [college_id, userId, college.status, 'Proposal Sent', `Moved to Proposal Sent automatically after submitting proposal: "${title.trim()}"`, new Date().toISOString()]
        );
      }

      return resProp.lastInsertRowid;
    });

    const created = db.get('SELECT * FROM proposals WHERE id = ?', [proposalId]);
    res.status(201).json({ message: 'Proposal created successfully.', proposal: created });
  } catch (err) {
    console.error('Error creating proposal:', err);
    res.status(500).json({ error: 'Failed to create proposal.' });
  }
});

// Update proposal
router.put('/:id', (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const proposal = db.get('SELECT * FROM proposals WHERE id = ? AND user_id = ?', [id, userId]);
    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found.' });
    }

    const {
      course_id,
      title,
      status,
      date_sent,
      quoted_price,
      expected_students,
      total_deal_value,
      next_action,
      notes
    } = req.body;

    const qPrice = quoted_price !== undefined ? parseFloat(quoted_price) : proposal.quoted_price;
    const eStudents = expected_students !== undefined ? parseInt(expected_students, 10) : proposal.expected_students;
    const dealValue = total_deal_value !== undefined ? parseFloat(total_deal_value) : (qPrice * eStudents);

    db.run(
      `UPDATE proposals SET
        course_id = ?, title = ?, status = ?, date_sent = ?,
        quoted_price = ?, expected_students = ?, total_deal_value = ?,
        next_action = ?, notes = ?, updated_at = CURRENT_TIMESTAMP
       WHERE id = ? AND user_id = ?`,
      [
        course_id !== undefined ? (course_id ? parseInt(course_id, 10) : null) : proposal.course_id,
        title ? title.trim() : proposal.title,
        status || proposal.status,
        date_sent !== undefined ? date_sent : proposal.date_sent,
        qPrice,
        eStudents,
        dealValue,
        next_action !== undefined ? next_action.trim() : proposal.next_action,
        notes !== undefined ? notes.trim() : proposal.notes,
        id,
        userId
      ]
    );

    const updated = db.get('SELECT * FROM proposals WHERE id = ?', [id]);
    res.json({ message: 'Proposal updated successfully.', proposal: updated });
  } catch (err) {
    console.error('Error updating proposal:', err);
    res.status(500).json({ error: 'Failed to update proposal.' });
  }
});

// Delete proposal
router.delete('/:id', (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const proposal = db.get('SELECT id FROM proposals WHERE id = ? AND user_id = ?', [id, userId]);
    if (!proposal) {
      return res.status(404).json({ error: 'Proposal not found.' });
    }

    db.run('DELETE FROM proposals WHERE id = ? AND user_id = ?', [id, userId]);
    res.json({ message: 'Proposal deleted successfully.' });
  } catch (err) {
    console.error('Error deleting proposal:', err);
    res.status(500).json({ error: 'Failed to delete proposal.' });
  }
});

module.exports = router;
