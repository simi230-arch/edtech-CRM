const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// Channels & Call outcomes
const CHANNELS = ['Phone', 'Email', 'WhatsApp', 'Meeting', 'Other'];
const OUTCOMES = [
  'No Answer',
  'Busy',
  'Connected',
  'Interested',
  'Not Interested',
  'Callback Requested',
  'Meeting Scheduled',
  'Wrong Number'
];

// Get activities for a specific college
router.get('/college/:collegeId', (req, res) => {
  try {
    const userId = req.user.id;
    const { collegeId } = req.params;

    // Verify ownership
    const college = db.get('SELECT id FROM colleges WHERE id = ? AND user_id = ?', [collegeId, userId]);
    if (!college) {
      return res.status(404).json({ error: 'College not found.' });
    }

    const activities = db.query(
      `SELECT a.*, u.name as logged_by_name 
       FROM call_activities a
       LEFT JOIN users u ON a.user_id = u.id
       WHERE a.college_id = ? 
       ORDER BY a.date_time DESC, a.id DESC`,
      [collegeId]
    );

    res.json({ activities });
  } catch (err) {
    console.error('Error fetching activities:', err);
    res.status(500).json({ error: 'Failed to fetch communication history.' });
  }
});

// Log a new interaction
router.post('/', (req, res) => {
  try {
    const userId = req.user.id;
    const {
      college_id,
      date_time,
      channel = 'Phone',
      contact_person,
      call_outcome,
      notes,
      questions_asked,
      objections_raised,
      promised_documents,
      next_action,
      next_follow_up_date,
      create_task = true
    } = req.body;

    if (!college_id) {
      return res.status(400).json({ error: 'College ID is required.' });
    }
    if (!notes || !notes.trim()) {
      return res.status(400).json({ error: 'Conversation notes are required.' });
    }
    if (!call_outcome || !OUTCOMES.includes(call_outcome)) {
      return res.status(400).json({ error: `Valid call outcome is required (${OUTCOMES.join(', ')}).` });
    }

    // Verify college ownership
    const college = db.get('SELECT * FROM colleges WHERE id = ? AND user_id = ?', [college_id, userId]);
    if (!college) {
      return res.status(404).json({ error: 'College not found.' });
    }

    const activityDateTime = date_time || new Date().toISOString();

    const activityId = db.transaction(({ run }) => {
      // 1. Insert activity log
      const insertRes = run(
        `INSERT INTO call_activities (
          college_id, user_id, date_time, channel, contact_person, call_outcome,
          notes, questions_asked, objections_raised, promised_documents,
          next_action, next_follow_up_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          college_id,
          userId,
          activityDateTime,
          CHANNELS.includes(channel) ? channel : 'Phone',
          contact_person ? contact_person.trim() : (college.placement_contact_name || ''),
          call_outcome,
          notes.trim(),
          questions_asked ? questions_asked.trim() : null,
          objections_raised ? objections_raised.trim() : null,
          promised_documents ? promised_documents.trim() : null,
          next_action ? next_action.trim() : null,
          next_follow_up_date || null
        ]
      );

      const actId = insertRes.lastInsertRowid;

      // 2. Update college last_activity_date and next_follow_up_date
      let updateSql = 'UPDATE colleges SET last_activity_date = ?';
      const updateParams = [activityDateTime];

      if (next_follow_up_date) {
        updateSql += ', next_follow_up_date = ?';
        updateParams.push(next_follow_up_date);
      }

      // If call outcome was "Meeting Scheduled" and college is in early stage, consider bumping stage or keeping consistent
      if (call_outcome === 'Meeting Scheduled' && ['New Lead', 'Contact Identified', 'First Call Attempted', 'Connected'].includes(college.status)) {
        updateSql += ', status = ?';
        updateParams.push('Meeting Scheduled');
        
        run(
          `INSERT INTO stage_history (college_id, user_id, from_stage, to_stage, notes, changed_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [college_id, userId, college.status, 'Meeting Scheduled', 'Stage updated from Call Tracker: Meeting Scheduled', activityDateTime]
        );
      } else if (call_outcome === 'Connected' && ['New Lead', 'Contact Identified', 'First Call Attempted'].includes(college.status)) {
        updateSql += ', status = ?';
        updateParams.push('Connected');

        run(
          `INSERT INTO stage_history (college_id, user_id, from_stage, to_stage, notes, changed_at)
           VALUES (?, ?, ?, ?, ?, ?)`,
          [college_id, userId, college.status, 'Connected', 'Stage updated from Call Tracker: Connected', activityDateTime]
        );
      }

      updateSql += ' WHERE id = ? AND user_id = ?';
      updateParams.push(college_id, userId);
      run(updateSql, updateParams);

      // 3. Create follow-up task if next_follow_up_date is provided and create_task is true
      if (next_follow_up_date && create_task) {
        run(
          `INSERT INTO follow_ups (
            college_id, user_id, activity_id, contact_person, title,
            description, priority, due_date, is_completed
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)`,
          [
            college_id,
            userId,
            actId,
            contact_person ? contact_person.trim() : (college.placement_contact_name || ''),
            next_action ? next_action.trim() : `Follow-up after ${channel} call (${call_outcome})`,
            promised_documents ? `Promised: ${promised_documents}` : notes.trim(),
            college.priority || 'Medium',
            next_follow_up_date
          ]
        );
      }

      return actId;
    });

    const createdActivity = db.get('SELECT * FROM call_activities WHERE id = ?', [activityId]);
    const updatedCollege = db.get('SELECT * FROM colleges WHERE id = ?', [college_id]);

    res.status(201).json({
      message: 'Call activity logged successfully.',
      activity: createdActivity,
      college: updatedCollege
    });
  } catch (err) {
    console.error('Error logging activity:', err);
    res.status(500).json({ error: 'Failed to log call activity.' });
  }
});

// Delete an activity log
router.delete('/:id', (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const activity = db.get('SELECT * FROM call_activities WHERE id = ? AND user_id = ?', [id, userId]);
    if (!activity) {
      return res.status(404).json({ error: 'Activity record not found.' });
    }

    db.run('DELETE FROM call_activities WHERE id = ? AND user_id = ?', [id, userId]);
    res.json({ message: 'Activity record deleted successfully.' });
  } catch (err) {
    console.error('Error deleting activity:', err);
    res.status(500).json({ error: 'Failed to delete activity record.' });
  }
});

module.exports = router;
