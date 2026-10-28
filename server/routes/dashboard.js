const express = require('express');
const db = require('../db');
const { authenticate } = require('../middleware/auth');

const router = express.Router();
router.use(authenticate);

router.get('/metrics', (req, res) => {
  try {
    const userId = req.user.id;
    const todayStr = new Date().toISOString().split('T')[0];

    // 1. Summary Cards calculated directly from database records
    const totalColleges = db.get('SELECT COUNT(*) AS count FROM colleges WHERE user_id = ? AND is_archived = 0', [userId]).count;
    const newLeads = db.get("SELECT COUNT(*) AS count FROM colleges WHERE user_id = ? AND status = 'New Lead' AND is_archived = 0", [userId]).count;
    const callsMade = db.get('SELECT COUNT(*) AS count FROM call_activities WHERE user_id = ?', [userId]).count;
    const connectedCalls = db.get("SELECT COUNT(*) AS count FROM call_activities WHERE user_id = ? AND call_outcome IN ('Connected', 'Interested', 'Meeting Scheduled', 'Callback Requested')", [userId]).count;
    const meetingsScheduled = db.get("SELECT COUNT(*) AS count FROM colleges WHERE user_id = ? AND status = 'Meeting Scheduled' AND is_archived = 0", [userId]).count;
    const proposalsSent = db.get("SELECT COUNT(*) AS count FROM proposals WHERE user_id = ? AND status IN ('Sent', 'Under Review', 'Revised', 'Accepted')", [userId]).count;
    const interestedColleges = db.get("SELECT COUNT(*) AS count FROM colleges WHERE user_id = ? AND status = 'Interested' AND is_archived = 0", [userId]).count;
    const convertedCustomers = db.get("SELECT COUNT(*) AS count FROM colleges WHERE user_id = ? AND status = 'Won' AND is_archived = 0", [userId]).count;

    const followUpsDueToday = db.get(
      `SELECT COUNT(*) AS count 
       FROM follow_ups 
       WHERE user_id = ? AND is_completed = 0 AND DATE(due_date) = DATE(?)`,
      [userId, todayStr]
    ).count;

    const overdueFollowUps = db.get(
      `SELECT COUNT(*) AS count 
       FROM follow_ups 
       WHERE user_id = ? AND is_completed = 0 AND DATE(due_date) < DATE(?)`,
      [userId, todayStr]
    ).count;

    // Revenue metrics
    const totalWonRevenue = db.get(
      `SELECT COALESCE(SUM(won_pricing * won_student_count), 0) AS revenue 
       FROM colleges 
       WHERE user_id = ? AND status = 'Won' AND is_archived = 0`,
      [userId]
    ).revenue;

    // 2. Chart: Leads by status
    const statusCountsRaw = db.query(
      `SELECT status, COUNT(*) AS count 
       FROM colleges 
       WHERE user_id = ? AND is_archived = 0 
       GROUP BY status`,
      [userId]
    );
    const leadsByStatus = statusCountsRaw;

    // 3. Chart: Calls & outreach activity over time (Last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    const activityOverTime = db.query(
      `SELECT DATE(date_time) AS date, COUNT(*) AS total_calls,
              SUM(CASE WHEN call_outcome IN ('Connected', 'Interested', 'Meeting Scheduled') THEN 1 ELSE 0 END) AS connected_calls
       FROM call_activities
       WHERE user_id = ? AND DATE(date_time) >= DATE(?)
       GROUP BY DATE(date_time)
       ORDER BY DATE(date_time) ASC`,
      [userId, thirtyDaysAgoStr]
    );

    // 4. Chart: Lead conversion rate calculation
    const conversionRate = totalColleges > 0 
      ? Number(((convertedCustomers / totalColleges) * 100).toFixed(1)) 
      : 0;

    const funnelStages = [
      { stage: 'Total Leads', count: totalColleges },
      { stage: 'Connected / Engaged', count: db.get("SELECT COUNT(*) AS c FROM colleges WHERE user_id = ? AND status NOT IN ('New Lead', 'Contact Identified', 'First Call Attempted')", [userId]).c },
      { stage: 'Meeting / Demo', count: db.get("SELECT COUNT(*) AS c FROM colleges WHERE user_id = ? AND status IN ('Meeting Scheduled', 'Demo Completed', 'Proposal Sent', 'Negotiation', 'Won')", [userId]).c },
      { stage: 'Proposal / Negotiation', count: db.get("SELECT COUNT(*) AS c FROM colleges WHERE user_id = ? AND status IN ('Proposal Sent', 'Negotiation', 'Won')", [userId]).c },
      { stage: 'Won / Customer', count: convertedCustomers }
    ];

    // 5. Chart: Leads by State and City (Top 8 states, Top 8 cities)
    const leadsByState = db.query(
      `SELECT state, COUNT(*) AS count 
       FROM colleges 
       WHERE user_id = ? AND is_archived = 0 AND state IS NOT NULL AND state != ''
       GROUP BY state 
       ORDER BY count DESC 
       LIMIT 8`,
      [userId]
    );

    const leadsByCity = db.query(
      `SELECT city, state, COUNT(*) AS count 
       FROM colleges 
       WHERE user_id = ? AND is_archived = 0 AND city IS NOT NULL AND city != ''
       GROUP BY city, state 
       ORDER BY count DESC 
       LIMIT 8`,
      [userId]
    );

    // 6. Chart: Lead sources & referral performance
    const leadsBySource = db.query(
      `SELECT lead_source, COUNT(*) AS count,
              SUM(CASE WHEN status = 'Won' THEN 1 ELSE 0 END) AS won_count
       FROM colleges 
       WHERE user_id = ? AND is_archived = 0 
       GROUP BY lead_source 
       ORDER BY count DESC`,
      [userId]
    );

    const startupReferralPerformance = db.query(
      `SELECT s.name AS startup_name, COUNT(c.id) AS leads_referred,
              SUM(CASE WHEN c.status = 'Won' THEN 1 ELSE 0 END) AS deals_won,
              COALESCE(SUM(c.won_pricing * c.won_student_count), 0) AS revenue_won
       FROM startups s
       JOIN colleges c ON c.startup_id = s.id
       WHERE s.user_id = ?
       GROUP BY s.id
       ORDER BY deals_won DESC, leads_referred DESC
       LIMIT 5`,
      [userId]
    );

    // Recent critical alerts: Today's follow-ups + Overdue follow-ups
    const urgentFollowUps = db.query(
      `SELECT f.*, c.name AS college_name, c.city AS college_city, c.placement_contact_phone
       FROM follow_ups f
       JOIN colleges c ON f.college_id = c.id
       WHERE f.user_id = ? AND f.is_completed = 0 AND DATE(f.due_date) <= DATE(?)
       ORDER BY f.due_date ASC
       LIMIT 5`,
      [userId, todayStr]
    );

    res.json({
      cards: {
        totalColleges,
        newLeads,
        callsMade,
        connectedCalls,
        meetingsScheduled,
        proposalsSent,
        interestedColleges,
        convertedCustomers,
        followUpsDueToday,
        overdueFollowUps,
        totalWonRevenue,
        conversionRate
      },
      charts: {
        leadsByStatus,
        activityOverTime,
        funnelStages,
        leadsByState,
        leadsByCity,
        leadsBySource,
        startupReferralPerformance
      },
      urgentFollowUps
    });
  } catch (err) {
    console.error('Error computing dashboard metrics:', err);
    res.status(500).json({ error: 'Failed to compute dashboard metrics.' });
  }
});

module.exports = router;
