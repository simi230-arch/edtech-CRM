const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// Pipeline stages in canonical sequence
const PIPELINE_STAGES = [
  'New Lead',
  'Contact Identified',
  'First Call Attempted',
  'Connected',
  'Interested',
  'Meeting Scheduled',
  'Demo Completed',
  'Proposal Sent',
  'Negotiation',
  'Won',
  'Lost',
  'Follow-up Later'
];

// Check duplicates by name, website, or phone
router.get('/check-duplicate', (req, res) => {
  try {
    const { name, website, phone, excludeId } = req.query;
    const userId = req.user.id;
    const duplicates = [];

    if (name && name.trim()) {
      const cleanName = name.trim().toLowerCase();
      const byName = db.query(
        `SELECT id, name, city, state, website, phone, status 
         FROM colleges 
         WHERE user_id = ? AND LOWER(name) = ? ${excludeId ? 'AND id != ?' : ''}`,
        excludeId ? [userId, cleanName, excludeId] : [userId, cleanName]
      );
      if (byName.length > 0) {
        duplicates.push({ field: 'name', matches: byName, message: `A college named "${byName[0].name}" already exists (${byName[0].city}, ${byName[0].state}).` });
      }
    }

    if (website && website.trim()) {
      let cleanWeb = website.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
      if (cleanWeb.length > 4) {
        const byWeb = db.query(
          `SELECT id, name, website, status 
           FROM colleges 
           WHERE user_id = ? AND LOWER(website) LIKE ? ${excludeId ? 'AND id != ?' : ''}`,
          excludeId ? [userId, `%${cleanWeb}%`, excludeId] : [userId, `%${cleanWeb}%`]
        );
        if (byWeb.length > 0) {
          duplicates.push({ field: 'website', matches: byWeb, message: `A college with website matching "${cleanWeb}" exists: "${byWeb[0].name}".` });
        }
      }
    }

    if (phone && phone.trim()) {
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      if (cleanPhone.length >= 8) {
        const byPhone = db.query(
          `SELECT id, name, phone, placement_contact_phone, status 
           FROM colleges 
           WHERE user_id = ? AND (phone LIKE ? OR placement_contact_phone LIKE ?) ${excludeId ? 'AND id != ?' : ''}`,
          excludeId ? [userId, `%${cleanPhone.slice(-8)}%`, `%${cleanPhone.slice(-8)}%`, excludeId] : [userId, `%${cleanPhone.slice(-8)}%`, `%${cleanPhone.slice(-8)}%`]
        );
        if (byPhone.length > 0) {
          duplicates.push({ field: 'phone', matches: byPhone, message: `A college with similar phone number exists: "${byPhone[0].name}".` });
        }
      }
    }

    res.json({ isDuplicate: duplicates.length > 0, duplicates });
  } catch (err) {
    console.error('Error checking duplicate:', err);
    res.status(500).json({ error: 'Failed to check duplicate.' });
  }
});

// List colleges with comprehensive search, filters, sorting, and pagination
router.get('/', (req, res) => {
  try {
    const userId = req.user.id;
    const {
      search,
      status,
      state,
      city,
      priority,
      lead_source,
      archived = '0',
      follow_up_filter, // 'today', 'overdue', 'upcoming'
      sort_by = 'last_activity',
      sort_dir = 'desc',
      page = 1,
      limit = 20
    } = req.query;

    let whereClause = 'WHERE c.user_id = ?';
    const params = [userId];

    if (archived === '1') {
      whereClause += ' AND c.is_archived = 1';
    } else {
      whereClause += ' AND c.is_archived = 0';
    }

    if (status && status !== 'All') {
      whereClause += ' AND c.status = ?';
      params.push(status);
    }

    if (state && state !== 'All') {
      whereClause += ' AND c.state = ?';
      params.push(state);
    }

    if (city && city !== 'All') {
      whereClause += ' AND c.city = ?';
      params.push(city);
    }

    if (priority && priority !== 'All') {
      whereClause += ' AND c.priority = ?';
      params.push(priority);
    }

    if (lead_source && lead_source !== 'All') {
      whereClause += ' AND c.lead_source = ?';
      params.push(lead_source);
    }

    if (search && search.trim()) {
      const searchTerm = `%${search.trim().toLowerCase()}%`;
      whereClause += ` AND (
        LOWER(c.name) LIKE ? OR 
        LOWER(c.city) LIKE ? OR 
        LOWER(c.state) LIKE ? OR 
        LOWER(c.placement_contact_name) LIKE ? OR 
        LOWER(c.placement_contact_email) LIKE ? OR 
        c.phone LIKE ? OR 
        c.placement_contact_phone LIKE ?
      )`;
      params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }

    const todayStr = new Date().toISOString().split('T')[0];
    if (follow_up_filter === 'today') {
      whereClause += ` AND DATE(c.next_follow_up_date) = DATE('${todayStr}')`;
    } else if (follow_up_filter === 'overdue') {
      whereClause += ` AND DATE(c.next_follow_up_date) < DATE('${todayStr}') AND c.status NOT IN ('Won', 'Lost')`;
    } else if (follow_up_filter === 'upcoming') {
      whereClause += ` AND DATE(c.next_follow_up_date) > DATE('${todayStr}')`;
    }

    // Determine sorting
    let orderClause = 'ORDER BY ';
    const dir = sort_dir.toLowerCase() === 'asc' ? 'ASC' : 'DESC';
    switch (sort_by) {
      case 'name':
        orderClause += `c.name ${dir}`;
        break;
      case 'next_follow_up':
        orderClause += `c.next_follow_up_date IS NULL, c.next_follow_up_date ${dir}`;
        break;
      case 'priority':
        orderClause += `CASE c.priority WHEN 'High' THEN 1 WHEN 'Medium' THEN 2 WHEN 'Low' THEN 3 ELSE 4 END ${dir}`;
        break;
      case 'created_at':
        orderClause += `c.created_at ${dir}`;
        break;
      case 'last_activity':
      default:
        orderClause += `COALESCE(c.last_activity_date, c.created_at) ${dir}`;
        break;
    }

    // Count total matching
    const countSql = `SELECT COUNT(*) AS total FROM colleges c ${whereClause}`;
    const totalRes = db.get(countSql, params);
    const total = totalRes ? totalRes.total : 0;

    // Fetch page items with joined startup name
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    const dataSql = `
      SELECT 
        c.*, 
        s.name AS startup_name,
        (SELECT COUNT(*) FROM call_activities a WHERE a.college_id = c.id) AS activity_count,
        (SELECT COUNT(*) FROM proposals p WHERE p.college_id = c.id) AS proposal_count,
        (SELECT COUNT(*) FROM follow_ups f WHERE f.college_id = c.id AND f.is_completed = 0) AS pending_followups
      FROM colleges c
      LEFT JOIN startups s ON c.startup_id = s.id
      ${whereClause}
      ${orderClause}
      LIMIT ${limitNum} OFFSET ${offset}
    `;

    const items = db.query(dataSql, params);

    res.json({
      items,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1
      }
    });
  } catch (err) {
    console.error('Error fetching colleges:', err);
    res.status(500).json({ error: 'Failed to fetch colleges.' });
  }
});

// Get unique filter choices (states, cities, sources, statuses)
router.get('/meta/filters', (req, res) => {
  try {
    const userId = req.user.id;
    const states = db.query('SELECT DISTINCT state FROM colleges WHERE user_id = ? AND state IS NOT NULL AND state != "" ORDER BY state', [userId]).map(r => r.state);
    const cities = db.query('SELECT DISTINCT city FROM colleges WHERE user_id = ? AND city IS NOT NULL AND city != "" ORDER BY city', [userId]).map(r => r.city);
    res.json({
      states,
      cities,
      stages: PIPELINE_STAGES,
      priorities: ['High', 'Medium', 'Low'],
      leadSources: ['Cold Call', 'Referral', 'LinkedIn', 'Email', 'Event', 'Other'],
      collegeTypes: ['Government', 'Private', 'Autonomous', 'Other']
    });
  } catch (err) {
    console.error('Error fetching filters:', err);
    res.status(500).json({ error: 'Failed to fetch filter options.' });
  }
});

// Get single college details
router.get('/:id', (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const college = db.get(
      `SELECT c.*, s.name AS startup_name, s.contact_name AS startup_contact
       FROM colleges c
       LEFT JOIN startups s ON c.startup_id = s.id
       WHERE c.id = ? AND c.user_id = ?`,
      [id, userId]
    );

    if (!college) {
      return res.status(404).json({ error: 'College lead not found.' });
    }

    // Fetch activities
    const activities = db.query(
      `SELECT * FROM call_activities WHERE college_id = ? ORDER BY date_time DESC, id DESC`,
      [id]
    );

    // Fetch stage history
    const stageHistory = db.query(
      `SELECT * FROM stage_history WHERE college_id = ? ORDER BY changed_at DESC, id DESC`,
      [id]
    );

    // Fetch follow ups
    const followUps = db.query(
      `SELECT * FROM follow_ups WHERE college_id = ? ORDER BY is_completed ASC, due_date ASC`,
      [id]
    );

    // Fetch proposals
    const proposals = db.query(
      `SELECT p.*, crs.name AS course_name, crs.category AS course_category
       FROM proposals p
       LEFT JOIN courses crs ON p.course_id = crs.id
       WHERE p.college_id = ? 
       ORDER BY p.created_at DESC`,
      [id]
    );

    res.json({
      college,
      activities,
      stageHistory,
      followUps,
      proposals
    });
  } catch (err) {
    console.error('Error fetching college detail:', err);
    res.status(500).json({ error: 'Failed to fetch college details.' });
  }
});

// Create college lead
router.post('/', (req, res) => {
  try {
    const userId = req.user.id;
    const {
      name,
      type = 'Private',
      state,
      city,
      address = '',
      website = '',
      official_email = '',
      phone = '',
      student_population = null,
      relevant_branches = '',
      target_years = '',
      placement_contact_name = '',
      placement_contact_designation = '',
      placement_contact_phone = '',
      placement_contact_email = '',
      lead_source = 'Cold Call',
      referred_by = '',
      startup_id = null,
      status = 'New Lead',
      priority = 'Medium',
      estimated_students = 0,
      notes = ''
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'College name is required.' });
    }
    if (!state || !state.trim()) {
      return res.status(400).json({ error: 'State is required.' });
    }
    if (!city || !city.trim()) {
      return res.status(400).json({ error: 'City is required.' });
    }

    const cleanStatus = PIPELINE_STAGES.includes(status) ? status : 'New Lead';
    const now = new Date().toISOString();

    const result = db.transaction(({ run }) => {
      const resCollege = run(
        `INSERT INTO colleges (
          user_id, name, type, state, city, address, website, official_email, phone,
          student_population, relevant_branches, target_years, placement_contact_name,
          placement_contact_designation, placement_contact_phone, placement_contact_email,
          lead_source, referred_by, startup_id, status, priority, estimated_students,
          notes, is_archived, last_activity_date, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
        [
          userId, name.trim(), type, state.trim(), city.trim(), address, website.trim(),
          official_email.trim(), phone.trim(), student_population ? parseInt(student_population, 10) : null,
          relevant_branches, target_years, placement_contact_name.trim(),
          placement_contact_designation.trim(), placement_contact_phone.trim(),
          placement_contact_email.trim(), lead_source, referred_by.trim(),
          startup_id ? parseInt(startup_id, 10) : null, cleanStatus, priority,
          estimated_students ? parseInt(estimated_students, 10) : 0, notes,
          now, now, now
        ]
      );

      const collegeId = resCollege.lastInsertRowid;

      // Add stage history entry
      run(
        `INSERT INTO stage_history (college_id, user_id, from_stage, to_stage, notes, changed_at)
         VALUES (?, ?, NULL, ?, ?, ?)`,
        [collegeId, userId, cleanStatus, 'Initial lead creation', now]
      );

      return collegeId;
    });

    const created = db.get('SELECT * FROM colleges WHERE id = ?', [result]);
    res.status(201).json({ message: 'College lead added successfully.', college: created });
  } catch (err) {
    console.error('Error creating college:', err);
    res.status(500).json({ error: 'Failed to create college lead.' });
  }
});

// Update college lead
router.put('/:id', (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const existing = db.get('SELECT * FROM colleges WHERE id = ? AND user_id = ?', [id, userId]);
    if (!existing) {
      return res.status(404).json({ error: 'College lead not found.' });
    }

    const {
      name,
      type,
      state,
      city,
      address,
      website,
      official_email,
      phone,
      student_population,
      relevant_branches,
      target_years,
      placement_contact_name,
      placement_contact_designation,
      placement_contact_phone,
      placement_contact_email,
      lead_source,
      referred_by,
      startup_id,
      status,
      priority,
      estimated_students,
      notes,
      lost_reason,
      won_agreement_date,
      won_pricing,
      won_student_count,
      next_follow_up_date
    } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'College name is required.' });
    }

    const newStatus = status && PIPELINE_STAGES.includes(status) ? status : existing.status;
    const now = new Date().toISOString();

    db.transaction(({ run }) => {
      run(
        `UPDATE colleges SET
          name = ?, type = ?, state = ?, city = ?, address = ?, website = ?,
          official_email = ?, phone = ?, student_population = ?, relevant_branches = ?,
          target_years = ?, placement_contact_name = ?, placement_contact_designation = ?,
          placement_contact_phone = ?, placement_contact_email = ?, lead_source = ?,
          referred_by = ?, startup_id = ?, status = ?, priority = ?, estimated_students = ?,
          notes = ?, lost_reason = ?, won_agreement_date = ?, won_pricing = ?,
          won_student_count = ?, next_follow_up_date = ?, updated_at = ?
         WHERE id = ? AND user_id = ?`,
        [
          name.trim(),
          type || existing.type,
          state ? state.trim() : existing.state,
          city ? city.trim() : existing.city,
          address !== undefined ? address : existing.address,
          website !== undefined ? website.trim() : existing.website,
          official_email !== undefined ? official_email.trim() : existing.official_email,
          phone !== undefined ? phone.trim() : existing.phone,
          student_population !== undefined ? (student_population ? parseInt(student_population, 10) : null) : existing.student_population,
          relevant_branches !== undefined ? relevant_branches : existing.relevant_branches,
          target_years !== undefined ? target_years : existing.target_years,
          placement_contact_name !== undefined ? placement_contact_name.trim() : existing.placement_contact_name,
          placement_contact_designation !== undefined ? placement_contact_designation.trim() : existing.placement_contact_designation,
          placement_contact_phone !== undefined ? placement_contact_phone.trim() : existing.placement_contact_phone,
          placement_contact_email !== undefined ? placement_contact_email.trim() : existing.placement_contact_email,
          lead_source || existing.lead_source,
          referred_by !== undefined ? referred_by.trim() : existing.referred_by,
          startup_id !== undefined ? (startup_id ? parseInt(startup_id, 10) : null) : existing.startup_id,
          newStatus,
          priority || existing.priority,
          estimated_students !== undefined ? parseInt(estimated_students, 10) : existing.estimated_students,
          notes !== undefined ? notes : existing.notes,
          newStatus === 'Lost' ? (lost_reason || existing.lost_reason) : null,
          newStatus === 'Won' ? (won_agreement_date || existing.won_agreement_date) : null,
          newStatus === 'Won' ? (won_pricing !== undefined ? parseFloat(won_pricing) : existing.won_pricing) : null,
          newStatus === 'Won' ? (won_student_count !== undefined ? parseInt(won_student_count, 10) : existing.won_student_count) : null,
          next_follow_up_date !== undefined ? next_follow_up_date : existing.next_follow_up_date,
          now,
          id,
          userId
        ]
      );

      // Record stage change if status changed
      if (newStatus !== existing.status) {
        run(
          `INSERT INTO stage_history (college_id, user_id, from_stage, to_stage, notes, changed_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [id, userId, existing.status, newStatus, `Stage updated to ${newStatus}`, now]
        );
      }
    });

    const updated = db.get('SELECT * FROM colleges WHERE id = ?', [id]);
    res.json({ message: 'College updated successfully.', college: updated });
  } catch (err) {
    console.error('Error updating college:', err);
    res.status(500).json({ error: 'Failed to update college lead.' });
  }
});

// Update lead stage specifically (e.g. from pipeline drag-and-drop or status picker)
router.patch('/:id/stage', (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { status, notes, lost_reason, won_agreement_date, won_pricing, won_student_count } = req.body;

    if (!status || !PIPELINE_STAGES.includes(status)) {
      return res.status(400).json({ error: 'Valid pipeline stage is required.' });
    }

    const college = db.get('SELECT * FROM colleges WHERE id = ? AND user_id = ?', [id, userId]);
    if (!college) {
      return res.status(404).json({ error: 'College lead not found.' });
    }

    const fromStage = college.status;
    const now = new Date().toISOString();

    db.transaction(({ run }) => {
      run(
        `UPDATE colleges SET
          status = ?,
          lost_reason = ?,
          won_agreement_date = ?,
          won_pricing = ?,
          won_student_count = ?,
          last_activity_date = ?,
          updated_at = ?
         WHERE id = ? AND user_id = ?`,
        [
          status,
          status === 'Lost' ? lost_reason : null,
          status === 'Won' ? won_agreement_date : null,
          status === 'Won' ? (won_pricing ? parseFloat(won_pricing) : 0) : null,
          status === 'Won' ? (won_student_count ? parseInt(won_student_count, 10) : 0) : null,
          now,
          now,
          id,
          userId
        ]
      );

      run(
        `INSERT INTO stage_history (college_id, user_id, from_stage, to_stage, notes, changed_at)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [id, userId, fromStage, status, notes || `Stage moved from ${fromStage} to ${status}`, now]
      );
    });

    const updated = db.get('SELECT * FROM colleges WHERE id = ?', [id]);
    res.json({ message: `Lead stage changed to ${status}`, college: updated });
  } catch (err) {
    console.error('Error updating stage:', err);
    res.status(500).json({ error: 'Failed to update stage.' });
  }
});

// Archive / Unarchive college lead
router.patch('/:id/archive', (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { is_archived } = req.body;

    const college = db.get('SELECT id, is_archived FROM colleges WHERE id = ? AND user_id = ?', [id, userId]);
    if (!college) {
      return res.status(404).json({ error: 'College lead not found.' });
    }

    const targetArchived = is_archived !== undefined ? (is_archived ? 1 : 0) : (college.is_archived ? 0 : 1);
    db.run('UPDATE colleges SET is_archived = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?', [targetArchived, id, userId]);

    res.json({ message: targetArchived ? 'College lead archived.' : 'College lead restored.', is_archived: targetArchived });
  } catch (err) {
    console.error('Error archiving college:', err);
    res.status(500).json({ error: 'Failed to archive college.' });
  }
});

// Delete college lead permanently
router.delete('/:id', (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const college = db.get('SELECT id, name FROM colleges WHERE id = ? AND user_id = ?', [id, userId]);
    if (!college) {
      return res.status(404).json({ error: 'College lead not found.' });
    }

    // Foreign keys with CASCADE will delete activities, follow-ups, proposals, and stage history
    db.run('DELETE FROM colleges WHERE id = ? AND user_id = ?', [id, userId]);

    res.json({ message: `College "${college.name}" permanently deleted.` });
  } catch (err) {
    console.error('Error deleting college:', err);
    res.status(500).json({ error: 'Failed to delete college.' });
  }
});

module.exports = router;
