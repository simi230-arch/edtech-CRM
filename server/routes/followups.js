const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// List follow-ups categorized (Today, Overdue, Upcoming, Completed) or filtered
router.get('/', (req, res) => {
  try {
    const userId = req.user.id;
    const { category, priority, college_id } = req.query;
    const todayStr = new Date().toISOString().split('T')[0];

    let baseSql = `
      SELECT 
        f.*,
        c.name AS college_name,
        c.city AS college_city,
        c.state AS college_state,
        c.status AS college_status,
        c.placement_contact_phone,
        c.placement_contact_email
      FROM follow_ups f
      JOIN colleges c ON f.college_id = c.id
      WHERE f.user_id = ?
    `;

    const params = [userId];

    if (college_id) {
      baseSql += ' AND f.college_id = ?';
      params.push(college_id);
    }

    if (priority && priority !== 'All') {
      baseSql += ' AND f.priority = ?';
      params.push(priority);
    }

    if (category === 'today') {
      baseSql += ` AND f.is_completed = 0 AND DATE(f.due_date) = DATE('${todayStr}') ORDER BY f.due_date ASC`;
    } else if (category === 'overdue') {
      baseSql += ` AND f.is_completed = 0 AND DATE(f.due_date) < DATE('${todayStr}') ORDER BY f.due_date ASC`;
    } else if (category === 'upcoming') {
      baseSql += ` AND f.is_completed = 0 AND DATE(f.due_date) > DATE('${todayStr}') ORDER BY f.due_date ASC`;
    } else if (category === 'completed') {
      baseSql += ` AND f.is_completed = 1 ORDER BY f.completed_at DESC LIMIT 50`;
    } else {
      // Default: fetch active split into today, overdue, upcoming, plus recent completed
      const allActive = db.query(
        baseSql + ` AND f.is_completed = 0 ORDER BY f.due_date ASC`,
        params
      );

      const overdue = [];
      const today = [];
      const upcoming = [];

      for (const item of allActive) {
        const itemDate = item.due_date.split('T')[0];
        if (itemDate < todayStr) {
          overdue.push(item);
        } else if (itemDate === todayStr) {
          today.push(item);
        } else {
          upcoming.push(item);
        }
      }

      const completed = db.query(
        baseSql + ` AND f.is_completed = 1 ORDER BY f.completed_at DESC LIMIT 30`,
        params
      );

      return res.json({
        overdue,
        today,
        upcoming,
        completed,
        counts: {
          overdue: overdue.length,
          today: today.length,
          upcoming: upcoming.length,
          completed: completed.length
        }
      });
    }

    const items = db.query(baseSql, params);
    res.json({ items });
  } catch (err) {
    console.error('Error fetching followups:', err);
    res.status(500).json({ error: 'Failed to fetch follow-up tasks.' });
  }
});

// Create manual follow-up task
router.post('/', (req, res) => {
  try {
    const userId = req.user.id;
    const { college_id, title, description, priority = 'Medium', due_date, contact_person } = req.body;

    if (!college_id) {
      return res.status(400).json({ error: 'College ID is required.' });
    }
    if (!title || !title.trim()) {
      return res.status(400).json({ error: 'Task title is required.' });
    }
    if (!due_date) {
      return res.status(400).json({ error: 'Due date is required.' });
    }

    const college = db.get('SELECT * FROM colleges WHERE id = ? AND user_id = ?', [college_id, userId]);
    if (!college) {
      return res.status(404).json({ error: 'College not found.' });
    }

    const taskId = db.transaction(({ run }) => {
      const resTask = run(
        `INSERT INTO follow_ups (
          college_id, user_id, contact_person, title, description, priority, due_date, is_completed
        ) VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
        [
          college_id,
          userId,
          contact_person || college.placement_contact_name || '',
          title.trim(),
          description ? description.trim() : '',
          priority,
          due_date
        ]
      );

      // Update college's next follow up date if this one is sooner or none set
      if (!college.next_follow_up_date || due_date < college.next_follow_up_date) {
        run('UPDATE colleges SET next_follow_up_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [due_date, college_id]);
      }

      return resTask.lastInsertRowid;
    });

    const created = db.get('SELECT * FROM follow_ups WHERE id = ?', [taskId]);
    res.status(201).json({ message: 'Task created successfully.', task: created });
  } catch (err) {
    console.error('Error creating follow up:', err);
    res.status(500).json({ error: 'Failed to create follow up task.' });
  }
});

// Toggle complete task
router.patch('/:id/complete', (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { is_completed } = req.body;

    const task = db.get('SELECT * FROM follow_ups WHERE id = ? AND user_id = ?', [id, userId]);
    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    const markComplete = is_completed !== undefined ? (is_completed ? 1 : 0) : (task.is_completed ? 0 : 1);
    const completedAt = markComplete ? new Date().toISOString() : null;

    db.transaction(({ run }) => {
      run(
        'UPDATE follow_ups SET is_completed = ?, completed_at = ? WHERE id = ? AND user_id = ?',
        [markComplete, completedAt, id, userId]
      );

      // Update next_follow_up_date on college: find the next earliest incomplete task
      const nextTask = db.get(
        'SELECT due_date FROM follow_ups WHERE college_id = ? AND is_completed = 0 ORDER BY due_date ASC LIMIT 1',
        [task.college_id]
      );

      run(
        'UPDATE colleges SET next_follow_up_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [nextTask ? nextTask.due_date : null, task.college_id]
      );
    });

    res.json({ message: markComplete ? 'Follow-up marked complete.' : 'Follow-up re-opened.', is_completed: markComplete });
  } catch (err) {
    console.error('Error toggling task completion:', err);
    res.status(500).json({ error: 'Failed to update task status.' });
  }
});

// Reschedule task
router.patch('/:id/reschedule', (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { due_date, reason } = req.body;

    if (!due_date) {
      return res.status(400).json({ error: 'New due date is required.' });
    }

    const task = db.get('SELECT * FROM follow_ups WHERE id = ? AND user_id = ?', [id, userId]);
    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    db.transaction(({ run }) => {
      const updatedDescription = reason 
        ? `${task.description ? task.description + '\n' : ''}[Rescheduled from ${task.due_date}: ${reason}]`
        : task.description;

      run(
        `UPDATE follow_ups SET 
          due_date = ?, 
          rescheduled_from = ?, 
          description = ?, 
          is_completed = 0 
         WHERE id = ? AND user_id = ?`,
        [due_date, task.due_date, updatedDescription, id, userId]
      );

      // Refresh college's next_follow_up_date
      const nextTask = db.get(
        'SELECT due_date FROM follow_ups WHERE college_id = ? AND is_completed = 0 ORDER BY due_date ASC LIMIT 1',
        [task.college_id]
      );

      run(
        'UPDATE colleges SET next_follow_up_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [nextTask ? nextTask.due_date : due_date, task.college_id]
      );
    });

    const updated = db.get('SELECT * FROM follow_ups WHERE id = ?', [id]);
    res.json({ message: 'Follow-up rescheduled successfully.', task: updated });
  } catch (err) {
    console.error('Error rescheduling task:', err);
    res.status(500).json({ error: 'Failed to reschedule task.' });
  }
});

// Delete task
router.delete('/:id', (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const task = db.get('SELECT * FROM follow_ups WHERE id = ? AND user_id = ?', [id, userId]);
    if (!task) {
      return res.status(404).json({ error: 'Task not found.' });
    }

    db.transaction(({ run }) => {
      run('DELETE FROM follow_ups WHERE id = ? AND user_id = ?', [id, userId]);

      // Update college's next_follow_up_date
      const nextTask = db.get(
        'SELECT due_date FROM follow_ups WHERE college_id = ? AND is_completed = 0 ORDER BY due_date ASC LIMIT 1',
        [task.college_id]
      );

      run(
        'UPDATE colleges SET next_follow_up_date = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [nextTask ? nextTask.due_date : null, task.college_id]
      );
    });

    res.json({ message: 'Task deleted successfully.' });
  } catch (err) {
    console.error('Error deleting task:', err);
    res.status(500).json({ error: 'Failed to delete task.' });
  }
});

module.exports = router;
