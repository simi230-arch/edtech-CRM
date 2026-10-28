-- Sales CRM & Outreach Tracking Database Schema
-- Designed for EdTech IT Training Sales to BTech Colleges

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'admin',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS startups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  industry TEXT NOT NULL,
  website TEXT,
  city TEXT,
  contact_name TEXT NOT NULL,
  contact_designation TEXT,
  email TEXT,
  phone TEXT,
  relationship_strength TEXT NOT NULL DEFAULT 'Warm', -- 'Strong', 'Warm', 'Acquaintance'
  last_interaction_date TEXT,
  collaboration_types TEXT DEFAULT '[]', -- JSON array of strings
  collaboration_status TEXT NOT NULL DEFAULT 'Exploring', -- 'Exploring', 'Active Partner', 'On Hold', 'Inactive'
  follow_up_date TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  duration TEXT NOT NULL,
  delivery_format TEXT NOT NULL DEFAULT 'Hybrid', -- 'Online Live', 'Offline Bootcamp', 'Hybrid'
  syllabus_link TEXT,
  certificate_details TEXT NOT NULL,
  course_fee REAL NOT NULL,
  fee_model TEXT NOT NULL DEFAULT 'Per Student', -- 'Per Student', 'Per Batch', 'Institutional Fixed'
  min_batch_size INTEGER DEFAULT 30,
  placement_guidance TEXT,
  approved_claims TEXT,
  is_active INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS colleges (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'Private', -- 'Government', 'Private', 'Autonomous', 'Other'
  state TEXT NOT NULL,
  city TEXT NOT NULL,
  address TEXT,
  website TEXT,
  official_email TEXT,
  phone TEXT,
  student_population INTEGER,
  relevant_branches TEXT, -- e.g. 'CSE, IT, ECE, AI&DS'
  target_years TEXT, -- e.g. '2nd, 3rd, 4th'
  placement_contact_name TEXT,
  placement_contact_designation TEXT, -- 'Placement Head', 'TPO', 'HOD CSE', etc.
  placement_contact_phone TEXT,
  placement_contact_email TEXT,
  lead_source TEXT NOT NULL DEFAULT 'Cold Call', -- 'Cold Call', 'Referral', 'LinkedIn', 'Email', 'Event', 'Other'
  referred_by TEXT,
  startup_id INTEGER REFERENCES startups(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'New Lead',
  priority TEXT NOT NULL DEFAULT 'Medium', -- 'High', 'Medium', 'Low'
  estimated_students INTEGER DEFAULT 0,
  notes TEXT,
  is_archived INTEGER DEFAULT 0,
  lost_reason TEXT,
  won_agreement_date TEXT,
  won_pricing REAL,
  won_student_count INTEGER,
  next_follow_up_date TEXT,
  last_activity_date TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS call_activities (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  college_id INTEGER NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date_time TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'Phone', -- 'Phone', 'Email', 'WhatsApp', 'Meeting', 'Other'
  contact_person TEXT,
  call_outcome TEXT NOT NULL, -- 'No Answer', 'Busy', 'Connected', 'Interested', 'Not Interested', 'Callback Requested', 'Meeting Scheduled', 'Wrong Number'
  notes TEXT NOT NULL,
  questions_asked TEXT,
  objections_raised TEXT,
  promised_documents TEXT,
  next_action TEXT,
  next_follow_up_date TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS follow_ups (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  college_id INTEGER NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  activity_id INTEGER REFERENCES call_activities(id) ON DELETE SET NULL,
  contact_person TEXT,
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT DEFAULT 'Medium', -- 'High', 'Medium', 'Low'
  due_date TEXT NOT NULL,
  is_completed INTEGER DEFAULT 0,
  completed_at TEXT,
  rescheduled_from TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS stage_history (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  college_id INTEGER NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  from_stage TEXT,
  to_stage TEXT NOT NULL,
  notes TEXT,
  changed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS proposals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  college_id INTEGER NOT NULL REFERENCES colleges(id) ON DELETE CASCADE,
  course_id INTEGER REFERENCES courses(id) ON DELETE SET NULL,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'Draft', -- 'Draft', 'Sent', 'Under Review', 'Revised', 'Accepted', 'Rejected'
  date_sent TEXT,
  quoted_price REAL NOT NULL DEFAULT 0,
  expected_students INTEGER NOT NULL DEFAULT 0,
  total_deal_value REAL NOT NULL DEFAULT 0,
  next_action TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for lightning fast queries and lookups
CREATE INDEX IF NOT EXISTS idx_colleges_user ON colleges(user_id);
CREATE INDEX IF NOT EXISTS idx_colleges_status ON colleges(status);
CREATE INDEX IF NOT EXISTS idx_colleges_state_city ON colleges(state, city);
CREATE INDEX IF NOT EXISTS idx_colleges_priority ON colleges(priority);
CREATE INDEX IF NOT EXISTS idx_colleges_archived ON colleges(is_archived);
CREATE INDEX IF NOT EXISTS idx_activities_college ON call_activities(college_id);
CREATE INDEX IF NOT EXISTS idx_activities_user ON call_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_followups_user_due ON follow_ups(user_id, due_date, is_completed);
CREATE INDEX IF NOT EXISTS idx_stage_history_college ON stage_history(college_id);
CREATE INDEX IF NOT EXISTS idx_proposals_college ON proposals(college_id);
CREATE INDEX IF NOT EXISTS idx_proposals_user ON proposals(user_id);
CREATE INDEX IF NOT EXISTS idx_startups_user ON startups(user_id);
CREATE INDEX IF NOT EXISTS idx_courses_user ON courses(user_id);
