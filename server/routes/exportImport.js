const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

// Helper to escape CSV field
function escapeCsv(val) {
  if (val === null || val === undefined) return '""';
  let str = String(val).replace(/"/g, '""');
  if (str.search(/("|,|\n|\r)/g) >= 0) {
    str = `"${str}"`;
  } else {
    str = `"${str}"`;
  }
  return str;
}

// Convert rows to CSV
function toCsv(headers, rows) {
  const headerLine = headers.map(h => `"${h.label}"`).join(',');
  const dataLines = rows.map(row => {
    return headers.map(h => escapeCsv(row[h.key])).join(',');
  });
  return [headerLine, ...dataLines].join('\r\n');
}

// Export colleges CSV
router.get('/colleges', (req, res) => {
  try {
    const userId = req.user.id;
    const rows = db.query(
      `SELECT c.*, s.name as startup_name 
       FROM colleges c 
       LEFT JOIN startups s ON c.startup_id = s.id 
       WHERE c.user_id = ? 
       ORDER BY c.created_at DESC`,
      [userId]
    );

    const headers = [
      { key: 'name', label: 'College Name' },
      { key: 'type', label: 'College Type' },
      { key: 'state', label: 'State' },
      { key: 'city', label: 'City' },
      { key: 'address', label: 'Full Address' },
      { key: 'website', label: 'Website' },
      { key: 'official_email', label: 'Official Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'student_population', label: 'Approx Student Population' },
      { key: 'relevant_branches', label: 'Relevant BTech Branches' },
      { key: 'target_years', label: 'Target Student Years' },
      { key: 'placement_contact_name', label: 'Placement Contact Name' },
      { key: 'placement_contact_designation', label: 'Designation' },
      { key: 'placement_contact_phone', label: 'Contact Phone' },
      { key: 'placement_contact_email', label: 'Contact Email' },
      { key: 'lead_source', label: 'Lead Source' },
      { key: 'referred_by', label: 'Referred By' },
      { key: 'startup_name', label: 'Linked Startup Partner' },
      { key: 'status', label: 'Lead Stage' },
      { key: 'priority', label: 'Priority' },
      { key: 'estimated_students', label: 'Estimated Students' },
      { key: 'won_agreement_date', label: 'Won Agreement Date' },
      { key: 'won_pricing', label: 'Won Pricing' },
      { key: 'won_student_count', label: 'Won Student Count' },
      { key: 'lost_reason', label: 'Lost Reason' },
      { key: 'notes', label: 'Notes' },
      { key: 'next_follow_up_date', label: 'Next Follow-up Date' },
      { key: 'created_at', label: 'Date Added' }
    ];

    const csvContent = toCsv(headers, rows);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="college_leads_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvContent);
  } catch (err) {
    console.error('Error exporting colleges:', err);
    res.status(500).json({ error: 'Failed to export colleges.' });
  }
});

// Export call activities CSV
router.get('/activities', (req, res) => {
  try {
    const userId = req.user.id;
    const rows = db.query(
      `SELECT a.*, c.name AS college_name, c.city AS college_city, c.state AS college_state
       FROM call_activities a
       JOIN colleges c ON a.college_id = c.id
       WHERE a.user_id = ?
       ORDER BY a.date_time DESC`,
      [userId]
    );

    const headers = [
      { key: 'college_name', label: 'College Name' },
      { key: 'college_city', label: 'City' },
      { key: 'college_state', label: 'State' },
      { key: 'date_time', label: 'Date & Time' },
      { key: 'channel', label: 'Channel' },
      { key: 'contact_person', label: 'Contact Person' },
      { key: 'call_outcome', label: 'Call Outcome' },
      { key: 'notes', label: 'Conversation Notes' },
      { key: 'questions_asked', label: 'Questions Asked' },
      { key: 'objections_raised', label: 'Objections Raised' },
      { key: 'promised_documents', label: 'Promised Documents' },
      { key: 'next_action', label: 'Next Action' },
      { key: 'next_follow_up_date', label: 'Follow-up Date' }
    ];

    const csvContent = toCsv(headers, rows);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="call_activity_logs_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvContent);
  } catch (err) {
    console.error('Error exporting activities:', err);
    res.status(500).json({ error: 'Failed to export call activities.' });
  }
});

// Export follow-ups CSV
router.get('/followups', (req, res) => {
  try {
    const userId = req.user.id;
    const rows = db.query(
      `SELECT f.*, c.name AS college_name, c.placement_contact_phone, c.placement_contact_email
       FROM follow_ups f
       JOIN colleges c ON f.college_id = c.id
       WHERE f.user_id = ?
       ORDER BY f.due_date ASC`,
      [userId]
    );

    const headers = [
      { key: 'college_name', label: 'College' },
      { key: 'title', label: 'Task Title' },
      { key: 'contact_person', label: 'Contact Person' },
      { key: 'placement_contact_phone', label: 'Contact Phone' },
      { key: 'due_date', label: 'Due Date' },
      { key: 'priority', label: 'Priority' },
      { key: 'is_completed', label: 'Completed (1=Yes, 0=No)' },
      { key: 'completed_at', label: 'Completed At' },
      { key: 'rescheduled_from', label: 'Rescheduled From' },
      { key: 'description', label: 'Description / Notes' }
    ];

    const csvContent = toCsv(headers, rows);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="follow_ups_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvContent);
  } catch (err) {
    console.error('Error exporting followups:', err);
    res.status(500).json({ error: 'Failed to export follow-ups.' });
  }
});

// Export startups CSV
router.get('/startups', (req, res) => {
  try {
    const userId = req.user.id;
    const rows = db.query(
      `SELECT * FROM startups WHERE user_id = ? ORDER BY name ASC`,
      [userId]
    );

    const headers = [
      { key: 'name', label: 'Startup Name' },
      { key: 'industry', label: 'Industry' },
      { key: 'website', label: 'Website' },
      { key: 'city', label: 'City' },
      { key: 'contact_name', label: 'Contact Person' },
      { key: 'contact_designation', label: 'Designation' },
      { key: 'email', label: 'Email' },
      { key: 'phone', label: 'Phone' },
      { key: 'relationship_strength', label: 'Relationship Strength' },
      { key: 'collaboration_status', label: 'Collaboration Status' },
      { key: 'collaboration_types', label: 'Collaboration Types' },
      { key: 'last_interaction_date', label: 'Last Interaction Date' },
      { key: 'follow_up_date', label: 'Follow-up Date' },
      { key: 'notes', label: 'Notes' }
    ];

    const csvContent = toCsv(headers, rows);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="startup_partners_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvContent);
  } catch (err) {
    console.error('Error exporting startups:', err);
    res.status(500).json({ error: 'Failed to export startups.' });
  }
});

// Export proposals CSV
router.get('/proposals', (req, res) => {
  try {
    const userId = req.user.id;
    const rows = db.query(
      `SELECT p.*, c.name AS college_name, crs.name AS course_name 
       FROM proposals p
       JOIN colleges c ON p.college_id = c.id
       LEFT JOIN courses crs ON p.course_id = crs.id
       WHERE p.user_id = ?
       ORDER BY p.created_at DESC`,
      [userId]
    );

    const headers = [
      { key: 'title', label: 'Proposal Title' },
      { key: 'college_name', label: 'College' },
      { key: 'course_name', label: 'Course' },
      { key: 'status', label: 'Status' },
      { key: 'date_sent', label: 'Date Sent' },
      { key: 'quoted_price', label: 'Quoted Price' },
      { key: 'expected_students', label: 'Expected Students' },
      { key: 'total_deal_value', label: 'Total Deal Value' },
      { key: 'next_action', label: 'Next Action' },
      { key: 'notes', label: 'Notes' }
    ];

    const csvContent = toCsv(headers, rows);
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="proposals_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csvContent);
  } catch (err) {
    console.error('Error exporting proposals:', err);
    res.status(500).json({ error: 'Failed to export proposals.' });
  }
});

// Parse simple CSV line handling quoted values
function parseCsvLine(text) {
  const result = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        cur += '"';
        i++; // skip escaped quote
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      result.push(cur.trim());
      cur = '';
    } else {
      cur += char;
    }
  }
  result.push(cur.trim());
  return result;
}

// CSV import for college leads with duplicate detection
router.post('/import-colleges', express.json({ limit: '10mb' }), (req, res) => {
  try {
    const userId = req.user.id;
    const { csvData, skipDuplicates = true } = req.body;

    if (!csvData || !csvData.trim()) {
      return res.status(400).json({ error: 'CSV data is required.' });
    }

    const lines = csvData.trim().split(/\r\n|\n|\r/).filter(l => l.trim().length > 0);
    if (lines.length < 2) {
      return res.status(400).json({ error: 'CSV file must have a header row and at least one data row.' });
    }

    const rawHeaders = parseCsvLine(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ''));

    // Map common column name aliases
    const colIndex = {
      name: rawHeaders.findIndex(h => h.includes('collegename') || h === 'name' || h.includes('college') || h.includes('institution')),
      type: rawHeaders.findIndex(h => h.includes('collegetype') || h === 'type'),
      state: rawHeaders.findIndex(h => h.includes('state')),
      city: rawHeaders.findIndex(h => h.includes('city') || h.includes('district')),
      address: rawHeaders.findIndex(h => h.includes('address') || h.includes('location')),
      website: rawHeaders.findIndex(h => h.includes('website') || h.includes('url')),
      official_email: rawHeaders.findIndex(h => h.includes('officialemail') || (h.includes('email') && !h.includes('contact'))),
      phone: rawHeaders.findIndex(h => h.includes('officialphone') || (h.includes('phone') && !h.includes('contact'))),
      placement_contact_name: rawHeaders.findIndex(h => h.includes('contactname') || h.includes('placementcontact') || h.includes('tpo') || h.includes('head')),
      placement_contact_designation: rawHeaders.findIndex(h => h.includes('designation') || h.includes('role')),
      placement_contact_phone: rawHeaders.findIndex(h => h.includes('contactphone') || h.includes('tpophone') || h.includes('mobile')),
      placement_contact_email: rawHeaders.findIndex(h => h.includes('contactemail') || h.includes('tpoemail')),
      lead_source: rawHeaders.findIndex(h => h.includes('source') || h.includes('leadsource')),
      priority: rawHeaders.findIndex(h => h.includes('priority')),
      status: rawHeaders.findIndex(h => h.includes('status') || h.includes('stage')),
      notes: rawHeaders.findIndex(h => h.includes('note') || h.includes('remark'))
    };

    if (colIndex.name === -1) {
      return res.status(400).json({ error: 'Could not detect "College Name" column in CSV header.' });
    }

    let importedCount = 0;
    let duplicateCount = 0;
    let errorCount = 0;
    const errors = [];
    const now = new Date().toISOString();

    db.transaction(({ run, query }) => {
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        const cells = parseCsvLine(line);
        const name = colIndex.name !== -1 && cells[colIndex.name] ? cells[colIndex.name].trim() : '';

        if (!name) {
          errorCount++;
          errors.push(`Row ${i + 1}: Missing college name.`);
          continue;
        }

        const state = (colIndex.state !== -1 && cells[colIndex.state]) ? cells[colIndex.state].trim() : 'India';
        const city = (colIndex.city !== -1 && cells[colIndex.city]) ? cells[colIndex.city].trim() : 'Unknown';
        const type = (colIndex.type !== -1 && cells[colIndex.type]) ? cells[colIndex.type].trim() : 'Private';
        const website = (colIndex.website !== -1 && cells[colIndex.website]) ? cells[colIndex.website].trim() : '';
        const phone = (colIndex.phone !== -1 && cells[colIndex.phone]) ? cells[colIndex.phone].trim() : '';
        const email = (colIndex.official_email !== -1 && cells[colIndex.official_email]) ? cells[colIndex.official_email].trim() : '';
        const contactName = (colIndex.placement_contact_name !== -1 && cells[colIndex.placement_contact_name]) ? cells[colIndex.placement_contact_name].trim() : '';
        const contactDesignation = (colIndex.placement_contact_designation !== -1 && cells[colIndex.placement_contact_designation]) ? cells[colIndex.placement_contact_designation].trim() : '';
        const contactPhone = (colIndex.placement_contact_phone !== -1 && cells[colIndex.placement_contact_phone]) ? cells[colIndex.placement_contact_phone].trim() : '';
        const contactEmail = (colIndex.placement_contact_email !== -1 && cells[colIndex.placement_contact_email]) ? cells[colIndex.placement_contact_email].trim() : '';
        const leadSource = (colIndex.lead_source !== -1 && cells[colIndex.lead_source]) ? cells[colIndex.lead_source].trim() : 'Cold Call';
        const priority = (colIndex.priority !== -1 && cells[colIndex.priority]) ? cells[colIndex.priority].trim() : 'Medium';
        const status = (colIndex.status !== -1 && cells[colIndex.status]) ? cells[colIndex.status].trim() : 'New Lead';
        const notes = (colIndex.notes !== -1 && cells[colIndex.notes]) ? cells[colIndex.notes].trim() : '';

        // Duplicate check
        const existing = query(
          'SELECT id, name FROM colleges WHERE user_id = ? AND LOWER(name) = ?',
          [userId, name.toLowerCase()]
        );

        if (existing.length > 0) {
          duplicateCount++;
          if (skipDuplicates) {
            continue;
          }
        }

        const insertRes = run(
          `INSERT INTO colleges (
            user_id, name, type, state, city, website, official_email, phone,
            placement_contact_name, placement_contact_designation, placement_contact_phone,
            placement_contact_email, lead_source, status, priority, notes,
            is_archived, last_activity_date, created_at, updated_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
          [
            userId, name, type, state, city, website, email, phone,
            contactName, contactDesignation, contactPhone, contactEmail,
            leadSource, status, priority, notes, now, now, now
          ]
        );

        run(
          `INSERT INTO stage_history (college_id, user_id, from_stage, to_stage, notes, changed_at)
           VALUES (?, ?, NULL, ?, 'Imported via CSV file', ?)`,
          [insertRes.lastInsertRowid, userId, status, now]
        );

        importedCount++;
      }
    });

    res.json({
      message: `Import completed: ${importedCount} leads added, ${duplicateCount} duplicates skipped, ${errorCount} errors.`,
      importedCount,
      duplicateCount,
      errorCount,
      errors: errors.slice(0, 5)
    });
  } catch (err) {
    console.error('Error importing CSV:', err);
    res.status(500).json({ error: 'Failed to import CSV data.' });
  }
});

module.exports = router;
