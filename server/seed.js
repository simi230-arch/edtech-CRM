const bcrypt = require('bcryptjs');
const db = require('./db');

async function seed() {
  console.log('--- Initializing database schema ---');
  await db.initDB();

  // Check if users exist
  let user = db.get('SELECT * FROM users WHERE email = ?', ['founder@edtech-btech.com']);
  if (!user) {
    console.log('Creating initial founder/admin user...');
    const hash = await bcrypt.hash('Password123!', 10);
    const userRes = db.run(
      'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
      ['Priya Sharma', 'founder@edtech-btech.com', hash, 'admin']
    );
    user = db.get('SELECT * FROM users WHERE id = ?', [userRes.lastInsertRowid]);
    console.log(`User created: ${user.email} (ID: ${user.id})`);
  } else {
    console.log(`User already exists: ${user.email} (ID: ${user.id})`);
  }

  seedUserData(user.id);
  console.log('--- Seed completed successfully! ---');
}

function seedUserData(userId) {
  // 1. Seed Startup Network
  const startupCount = db.get('SELECT COUNT(*) as count FROM startups WHERE user_id = ?', [userId]).count;
  if (startupCount === 0) {
    console.log('Seeding Startup Connections...');
    const startups = [
      {
        name: 'TechSprout AI Labs',
        industry: 'Generative AI & LLMs',
        website: 'https://techsproutai.example.com',
        city: 'Bengaluru',
        contact_name: 'Anand Verma',
        contact_designation: 'Co-Founder & VP Engineering',
        email: 'anand.v@techsproutai.example.com',
        phone: '+91 98450 12345',
        relationship_strength: 'Strong',
        last_interaction_date: '2026-10-20',
        collaboration_types: JSON.stringify(['Guest Lectures', 'Industry Mentors', 'Projects', 'Hiring Partnerships', 'Referrals']),
        collaboration_status: 'Active Partner',
        follow_up_date: '2026-11-10',
        notes: 'Graduated from same IIT batch. Very keen on reviewing final-year capstone AI projects and hiring top 10% students.'
      },
      {
        name: 'CloudScale DevOps Solutions',
        industry: 'Cloud Infrastructure & SRE',
        website: 'https://cloudscale-infra.example.com',
        city: 'Pune',
        contact_name: 'Vikram Joshi',
        contact_designation: 'Chief Technology Officer',
        email: 'vikram.j@cloudscale-infra.example.com',
        phone: '+91 97631 88990',
        relationship_strength: 'Strong',
        last_interaction_date: '2026-10-15',
        collaboration_types: JSON.stringify(['Course Design', 'Industry Mentors', 'Referrals']),
        collaboration_status: 'Active Partner',
        follow_up_date: '2026-11-05',
        notes: 'Helped co-design our Cloud & Kubernetes syllabus. Introduced us to 2 college placement deans in Maharashtra.'
      },
      {
        name: 'SecurX Shield',
        industry: 'Cyber Security & DevSecOps',
        website: 'https://securxshield.example.com',
        city: 'Hyderabad',
        contact_name: 'Divya Reddy',
        contact_designation: 'Head of Threat Intelligence',
        email: 'divya@securxshield.example.com',
        phone: '+91 98765 43210',
        relationship_strength: 'Warm',
        last_interaction_date: '2026-10-18',
        collaboration_types: JSON.stringify(['Guest Lectures', 'Internships', 'Hiring Partnerships']),
        collaboration_status: 'Exploring',
        follow_up_date: '2026-11-15',
        notes: 'Agreed in principle to provide 5 summer internships if students pass our hands-on penetration testing benchmark.'
      },
      {
        name: 'FinFlow Technologies',
        industry: 'FinTech & High Frequency Trading',
        website: 'https://finflowtech.example.com',
        city: 'Gurugram',
        contact_name: 'Rohit Kulkarni',
        contact_designation: 'VP of Product',
        email: 'rohit@finflowtech.example.com',
        phone: '+91 98110 56789',
        relationship_strength: 'Warm',
        last_interaction_date: '2026-09-30',
        collaboration_types: JSON.stringify(['Industry Mentors', 'Projects']),
        collaboration_status: 'Exploring',
        follow_up_date: '2026-11-20',
        notes: 'Interested in mentoring students on high-throughput microservices using Spring Boot & Kafka.'
      }
    ];

    for (const s of startups) {
      db.run(
        `INSERT INTO startups (
          user_id, name, industry, website, city, contact_name, contact_designation,
          email, phone, relationship_strength, last_interaction_date, collaboration_types,
          collaboration_status, follow_up_date, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId, s.name, s.industry, s.website, s.city, s.contact_name, s.contact_designation,
          s.email, s.phone, s.relationship_strength, s.last_interaction_date, s.collaboration_types,
          s.collaboration_status, s.follow_up_date, s.notes
        ]
      );
    }
  }

  // 2. Seed Courses
  const courseCount = db.get('SELECT COUNT(*) as count FROM courses WHERE user_id = ?', [userId]).count;
  if (courseCount === 0) {
    console.log('Seeding Course Catalogue...');
    const courses = [
      {
        name: 'Full Stack MERN & Next.js Production Engineering',
        category: 'Full Stack Web Development',
        description: 'Industry-grade curriculum covering React 19, Next.js, Node.js microservices, TypeScript, PostgreSQL, and AWS deployment with real-world SaaS capstone projects.',
        duration: '60 Hours (8 Weeks)',
        delivery_format: 'Hybrid',
        syllabus_link: 'https://edtech.example.com/syllabus/mern-nextjs.pdf',
        certificate_details: 'Certificate of Industry Mastery in Advanced Web Engineering, signed by TechSprout AI Labs and our institute.',
        course_fee: 4500,
        fee_model: 'Per Student',
        min_batch_size: 60,
        placement_guidance: 'Resume ATS screening, 3 mock technical interviews by senior engineers, GitHub repo review, and priority referral to partner hiring startups.',
        approved_claims: '100% hands-on project portfolio; 4 real-world repo submissions; no unverified job placement guarantees.'
      },
      {
        name: 'Applied Generative AI & Machine Learning with Python',
        category: 'AI & Machine Learning',
        description: 'Covers modern AI application development: Python, PyTorch fundamentals, HuggingFace transformers, LangChain/LlamaIndex, Vector DBs (Pinecone/Chroma), and fine-tuning open-weights models.',
        duration: '80 Hours (10 Weeks)',
        delivery_format: 'Hybrid',
        syllabus_link: 'https://edtech.example.com/syllabus/applied-genai.pdf',
        certificate_details: 'Industry Certified AI Practitioner Certification with verifiable credential ID.',
        course_fee: 6500,
        fee_model: 'Per Student',
        min_batch_size: 45,
        placement_guidance: 'Hands-on AI portfolio development on GitHub, hackathon participation, and AI startup interview prep with system design.',
        approved_claims: 'Practical implementation of RAG pipelines and model deployment; no claims of replacing academic university curriculum.'
      },
      {
        name: 'Enterprise Cloud Infrastructure & DevOps Pipeline',
        category: 'Cloud & DevOps',
        description: 'Zero-to-production DevOps bootcamp: Linux fundamentals, Docker containerization, Kubernetes orchestration, CI/CD with GitHub Actions, Terraform Infrastructure-as-Code on AWS.',
        duration: '50 Hours (6 Weeks)',
        delivery_format: 'Online Live',
        syllabus_link: 'https://edtech.example.com/syllabus/cloud-devops.pdf',
        certificate_details: 'DevOps & Cloud Associate Certification accredited with CloudScale Solutions.',
        course_fee: 5000,
        fee_model: 'Per Student',
        min_batch_size: 50,
        placement_guidance: 'AWS free tier lab sandbox access, live debugging sessions, and SRE interview simulation.',
        approved_claims: 'Hands-on AWS practice with live cloud budget guardrails; verified industry mentor review.'
      },
      {
        name: 'Enterprise Java, Microservices & Spring Boot 3',
        category: 'Core CS & DSA',
        description: 'Comprehensive backend engineering for enterprise campus hiring: Java 21, Spring Boot, Spring Security, Kafka event streaming, Docker, and RESTful API architecture.',
        duration: '70 Hours (9 Weeks)',
        delivery_format: 'Hybrid',
        syllabus_link: 'https://edtech.example.com/syllabus/enterprise-java.pdf',
        certificate_details: 'Enterprise Java Engineer Certification issued with verifiable digital badge.',
        course_fee: 4000,
        fee_model: 'Per Student',
        min_batch_size: 70,
        placement_guidance: 'Coding test preparation for Tier-1 IT services and product companies (TCS Digital, Cognizant GenC Next, Accenture ASE, Wipro Turbo).',
        approved_claims: 'Standardized industry problem sets; mock campus tests matching top IT recruitment patterns.'
      }
    ];

    for (const c of courses) {
      db.run(
        `INSERT INTO courses (
          user_id, name, category, description, duration, delivery_format,
          syllabus_link, certificate_details, course_fee, fee_model,
          min_batch_size, placement_guidance, approved_claims, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
        [
          userId, c.name, c.category, c.description, c.duration, c.delivery_format,
          c.syllabus_link, c.certificate_details, c.course_fee, c.fee_model,
          c.min_batch_size, c.placement_guidance, c.approved_claims
        ]
      );
    }
  }

  // 3. Seed Colleges, Calls, Follow-ups, and Proposals
  const collegeCount = db.get('SELECT COUNT(*) as count FROM colleges WHERE user_id = ?', [userId]).count;
  if (collegeCount === 0) {
    console.log('Seeding Colleges, Calls, Tasks, and Proposals...');
    const startupsList = db.query('SELECT id, name FROM startups WHERE user_id = ?', [userId]);
    const coursesList = db.query('SELECT id, name, course_fee FROM courses WHERE user_id = ?', [userId]);

    const techSproutId = startupsList.find(s => s.name.includes('TechSprout'))?.id || null;
    const cloudScaleId = startupsList.find(s => s.name.includes('CloudScale'))?.id || null;

    const mernCourse = coursesList.find(c => c.name.includes('MERN')) || coursesList[0];
    const aiCourse = coursesList.find(c => c.name.includes('GenAI')) || coursesList[1];
    const devopsCourse = coursesList.find(c => c.name.includes('DevOps')) || coursesList[2];

    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split('T')[0];

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const in3Days = new Date(today);
    in3Days.setDate(in3Days.getDate() + 3);
    const in3DaysStr = in3Days.toISOString().split('T')[0];

    const overdueDay = new Date(today);
    overdueDay.setDate(overdueDay.getDate() - 2);
    const overdueDayStr = overdueDay.toISOString().split('T')[0];

    const sampleColleges = [
      {
        name: 'Dayananda Sagar College of Engineering (DSCE)',
        type: 'Autonomous',
        state: 'Karnataka',
        city: 'Bengaluru',
        address: 'Shavige Malleshwara Hills, Kumaraswamy Layout, Bengaluru, Karnataka 560078',
        website: 'https://www.dsce.edu.in',
        official_email: 'placement@dsce.edu.in',
        phone: '+91 80 4216 1700',
        student_population: 6200,
        relevant_branches: 'CSE, ISE, ECE, AI & ML, Data Science',
        target_years: '3rd, 4th',
        placement_contact_name: 'Dr. Ramesh N. Rao',
        placement_contact_designation: 'Head - Corporate Relations & TPO',
        placement_contact_phone: '+91 98450 78213',
        placement_contact_email: 'ramesh.rao@dsce.edu.in',
        lead_source: 'Referral',
        referred_by: 'Anand Verma (TechSprout AI)',
        startup_id: techSproutId,
        status: 'Won',
        priority: 'High',
        estimated_students: 180,
        notes: 'Very proactive TPO. Highly impressed with our MERN + AI module and TechSprout hiring alignment.',
        won_agreement_date: '2026-10-14',
        won_pricing: 4200,
        won_student_count: 180,
        next_follow_up_date: in3DaysStr + 'T11:00:00',
        activities: [
          {
            date_time: '2026-10-05T11:30:00',
            channel: 'Phone',
            contact_person: 'Dr. Ramesh N. Rao',
            call_outcome: 'Connected',
            notes: 'Introductory call via Anand Verma introduction. Discussed our 60-hour MERN curriculum for 3rd-year CS/IS students.',
            questions_asked: 'Can sessions be delivered on alternating Saturdays and weekday evening hybrid slots?',
            objections_raised: 'Concerned about lab availability during mid-semester internal assessments.',
            promised_documents: 'Customized timetable schedule and syllabus breakdown.',
            next_action: 'Send proposal and schedule curriculum demo.',
            next_follow_up_date: '2026-10-08T15:00:00'
          },
          {
            date_time: '2026-10-09T14:30:00',
            channel: 'Meeting',
            contact_person: 'Dr. Ramesh N. Rao & Department HoD',
            call_outcome: 'Meeting Scheduled',
            notes: 'In-person meeting at DSCE placement office. Demonstrated student LMS portal, live code reviews, and mock interview rubric.',
            questions_asked: 'How do you measure individual student coding progress?',
            objections_raised: 'Price per student exceeded their initial budget by 10%.',
            promised_documents: 'Revised proposal with volume discount for 180 students at Rs. 4,200 per student.',
            next_action: 'Send MoU draft for principal signature.',
            next_follow_up_date: '2026-10-12T11:00:00'
          },
          {
            date_time: '2026-10-14T10:00:00',
            channel: 'Meeting',
            contact_person: 'Dr. Ramesh N. Rao',
            call_outcome: 'Connected',
            notes: 'MoU signed for 180 students across 3 batches! First batch begins next month.',
            questions_asked: 'When can we finalize batch student lists?',
            objections_raised: 'None.',
            promised_documents: 'Student onboarding link and orientation webinar deck.',
            next_action: 'Deliver orientation webinar.',
            next_follow_up_date: in3DaysStr + 'T11:00:00'
          }
        ],
        tasks: [
          {
            title: 'Send Batch-1 LMS activation credentials and student roster link',
            priority: 'High',
            due_date: in3DaysStr + 'T11:00:00',
            is_completed: 0
          }
        ],
        proposals: [
          {
            title: 'Full Stack MERN Campus Cohort 2026 - 180 Students',
            course_id: mernCourse?.id,
            status: 'Accepted',
            date_sent: '2026-10-10',
            quoted_price: 4200,
            expected_students: 180,
            total_deal_value: 756000,
            next_action: 'Batch rollout completed'
          }
        ]
      },
      {
        name: 'Vellore Institute of Technology (VIT Pune)',
        type: 'Private',
        state: 'Maharashtra',
        city: 'Pune',
        address: '666, Upper Indiranagar, Bibwewadi, Pune, Maharashtra 411037',
        website: 'https://www.vit.edu',
        official_email: 'tpo@vit.edu',
        phone: '+91 20 2420 2180',
        student_population: 5800,
        relevant_branches: 'Computer Engineering, IT, AI & Data Science',
        target_years: '3rd year',
        placement_contact_name: 'Prof. Sandeep Shinde',
        placement_contact_designation: 'Dean Industry Relations & Placements',
        placement_contact_phone: '+91 94220 33411',
        placement_contact_email: 'sandeep.shinde@vit.edu',
        lead_source: 'Referral',
        referred_by: 'Vikram Joshi (CloudScale DevOps)',
        startup_id: cloudScaleId,
        status: 'Negotiation',
        priority: 'High',
        estimated_students: 120,
        notes: 'Evaluating our Cloud & DevOps curriculum. Vikram Joshi vouched for our practical syllabus.',
        next_follow_up_date: todayStr + 'T14:30:00',
        activities: [
          {
            date_time: '2026-10-18T16:00:00',
            channel: 'Phone',
            contact_person: 'Prof. Sandeep Shinde',
            call_outcome: 'Connected',
            notes: 'Spoke with Dean Shinde. They want to strengthen cloud infrastructure skills for upcoming campus drives.',
            questions_asked: 'Can we include AWS certification vouchers?',
            objections_raised: 'Need institutional approval from the academic board.',
            promised_documents: 'Detailed proposal with CloudScale industry certification details.',
            next_action: 'Submit official proposal document.',
            next_follow_up_date: '2026-10-22T10:00:00'
          },
          {
            date_time: '2026-10-24T15:00:00',
            channel: 'Meeting',
            contact_person: 'Prof. Sandeep Shinde & Committee',
            call_outcome: 'Meeting Scheduled',
            notes: 'Virtual presentation to the Department Curriculum Committee. Responded to queries regarding AWS lab credits.',
            questions_asked: 'Can you match Rs. 4,500 per student pricing for 120 students?',
            objections_raised: 'Requested reduction from Rs. 5,000 to Rs. 4,500.',
            promised_documents: 'Final commercial agreement at Rs. 4,500.',
            next_action: 'Final closing call on price and payment terms.',
            next_follow_up_date: todayStr + 'T14:30:00'
          }
        ],
        tasks: [
          {
            title: 'Commercial negotiation call with Dean Shinde on AWS lab voucher cost split',
            priority: 'High',
            due_date: todayStr + 'T14:30:00',
            is_completed: 0
          }
        ],
        proposals: [
          {
            title: 'Enterprise Cloud & DevOps Bootcamp - 120 Students',
            course_id: devopsCourse?.id,
            status: 'Under Review',
            date_sent: '2026-10-22',
            quoted_price: 4500,
            expected_students: 120,
            total_deal_value: 540000,
            next_action: 'Awaiting revised approval'
          }
        ]
      },
      {
        name: 'Chaitanya Bharathi Institute of Technology (CBIT)',
        type: 'Autonomous',
        state: 'Telangana',
        city: 'Hyderabad',
        address: 'Gandipet, Hyderabad, Telangana 500075',
        website: 'https://www.cbit.ac.in',
        official_email: 'placement_cbit@cbit.ac.in',
        phone: '+91 40 2419 3276',
        student_population: 5000,
        relevant_branches: 'CSE, CSE (AI&ML), IT, ECE',
        target_years: '2nd, 3rd year',
        placement_contact_name: 'Dr. K. Radhika',
        placement_contact_designation: 'Director Career Development Cell',
        placement_contact_phone: '+91 98499 11223',
        placement_contact_email: 'radhika.cdc@cbit.ac.in',
        lead_source: 'Cold Call',
        referred_by: '',
        startup_id: null,
        status: 'Proposal Sent',
        priority: 'High',
        estimated_students: 100,
        notes: 'Wants Applied GenAI curriculum for 3rd year students before summer internship season.',
        next_follow_up_date: tomorrowStr + 'T15:00:00',
        activities: [
          {
            date_time: '2026-10-12T10:00:00',
            channel: 'Phone',
            contact_person: 'Dr. K. Radhika',
            call_outcome: 'Connected',
            notes: 'Cold call to placement office. Dr. Radhika picked up and expressed strong interest in GenAI and LLM practical labs.',
            questions_asked: 'Are students required to bring their own GPU laptops?',
            objections_raised: 'College computer labs have standard i5 workstations without discrete Nvidia GPUs.',
            promised_documents: 'Explained cloud browser-based lab architecture; promised formal proposal.',
            next_action: 'Deliver proposal with cloud GPU infrastructure included in pricing.',
            next_follow_up_date: '2026-10-20T11:00:00'
          },
          {
            date_time: '2026-10-21T11:30:00',
            channel: 'Email',
            contact_person: 'Dr. K. Radhika',
            call_outcome: 'Connected',
            notes: 'Sent formal proposal for Applied GenAI & Machine Learning (100 students, Rs. 6,000/student).',
            questions_asked: 'When can we get a demo session for the CSE faculty?',
            objections_raised: 'None so far.',
            promised_documents: 'Faculty demo agenda.',
            next_action: 'Follow up on proposal review and confirm faculty demo date.',
            next_follow_up_date: tomorrowStr + 'T15:00:00'
          }
        ],
        tasks: [
          {
            title: 'Follow-up on GenAI proposal review with Dr. Radhika',
            priority: 'High',
            due_date: tomorrowStr + 'T15:00:00',
            is_completed: 0
          }
        ],
        proposals: [
          {
            title: 'Applied Generative AI Cohort - 100 BTech Students',
            course_id: aiCourse?.id,
            status: 'Sent',
            date_sent: '2026-10-21',
            quoted_price: 6000,
            expected_students: 100,
            total_deal_value: 600000,
            next_action: 'Faculty demo review'
          }
        ]
      },
      {
        name: 'PSG College of Technology',
        type: 'Autonomous',
        state: 'Tamil Nadu',
        city: 'Coimbatore',
        address: 'Post Box No. 1611, Peelamedu, Coimbatore, Tamil Nadu 641004',
        website: 'https://www.psgtech.edu',
        official_email: 'placement@psgtech.ac.in',
        phone: '+91 422 257 2177',
        student_population: 8500,
        relevant_branches: 'CSE, IT, Robotics & Automation',
        target_years: '2nd, 3rd year',
        placement_contact_name: 'Dr. S. Karthikeyan',
        placement_contact_designation: 'Dean Placement & Training',
        placement_contact_phone: '+91 94432 55678',
        placement_contact_email: 'karthikeyan.placement@psgtech.ac.in',
        lead_source: 'LinkedIn',
        referred_by: 'LinkedIn Outreach campaign',
        startup_id: null,
        status: 'Meeting Scheduled',
        priority: 'High',
        estimated_students: 150,
        notes: 'Prestige institution. Connected on LinkedIn after founder published article on IT placement shifts.',
        next_follow_up_date: todayStr + 'T16:00:00',
        activities: [
          {
            date_time: '2026-10-25T11:00:00',
            channel: 'Phone',
            contact_person: 'Dr. S. Karthikeyan',
            call_outcome: 'Meeting Scheduled',
            notes: 'Discussion with Dean Karthikeyan. Agreed to a 45-minute presentation on modernizing BTech lab curricula.',
            questions_asked: 'Can we pilot with 1 section of 60 students first before full rollout?',
            objections_raised: 'Standard PSG vetting takes 3-4 weeks.',
            promised_documents: 'Send slide deck and trainer profile bios.',
            next_action: 'Present curriculum to Dean and HoDs via Google Meet.',
            next_follow_up_date: todayStr + 'T16:00:00'
          }
        ],
        tasks: [
          {
            title: 'Conduct Virtual Curriculum Demo with PSG Placement Dean & HoDs',
            priority: 'High',
            due_date: todayStr + 'T16:00:00',
            is_completed: 0
          }
        ]
      },
      {
        name: 'Thapar Institute of Engineering & Technology (TIET)',
        type: 'Private',
        state: 'Punjab',
        city: 'Patiala',
        address: 'Bhadson Road, Patiala, Punjab 147004',
        website: 'https://www.thapar.edu',
        official_email: 'placements@thapar.edu',
        phone: '+91 175 239 3021',
        student_population: 7500,
        relevant_branches: 'Computer Engineering, Software Engineering',
        target_years: '3rd year',
        placement_contact_name: 'Dr. Harpreet Singh',
        placement_contact_designation: 'Head - Centre for Industrial Liaison & Placement',
        placement_contact_phone: '+91 98150 99887',
        placement_contact_email: 'harpreet.cilp@thapar.edu',
        lead_source: 'Cold Call',
        referred_by: '',
        startup_id: null,
        status: 'Interested',
        priority: 'Medium',
        estimated_students: 90,
        notes: 'Interested in Full Stack MERN and Enterprise Java microservices.',
        next_follow_up_date: in3DaysStr + 'T10:30:00',
        activities: [
          {
            date_time: '2026-10-22T14:00:00',
            channel: 'Phone',
            contact_person: 'Dr. Harpreet Singh',
            call_outcome: 'Interested',
            notes: 'Good initial discussion. They want to increase product-based company selections for 2027 batch.',
            questions_asked: 'What is the track record of past students cracking 12+ LPA offers?',
            objections_raised: 'Existing tie-up with legacy training vendor ends in December.',
            promised_documents: 'Case studies of students placed in product startups and detailed syllabus.',
            next_action: 'Send case studies and follow up next week.',
            next_follow_up_date: in3DaysStr + 'T10:30:00'
          }
        ],
        tasks: [
          {
            title: 'Send TIET Placement Office startup placement case studies',
            priority: 'Medium',
            due_date: in3DaysStr + 'T10:30:00',
            is_completed: 0
          }
        ]
      },
      {
        name: 'Galgotias College of Engineering & Technology (GCET)',
        type: 'Private',
        state: 'Uttar Pradesh',
        city: 'Greater Noida',
        address: '1, Knowledge Park II, Greater Noida, Uttar Pradesh 201306',
        website: 'https://galgotiacollege.edu.in',
        official_email: 'cpdd@galgotiacollege.edu.in',
        phone: '+91 120 451 3800',
        student_population: 4800,
        relevant_branches: 'CSE, IT, ECE',
        target_years: '2nd, 3rd year',
        placement_contact_name: 'Prof. Manish Gupta',
        placement_contact_designation: 'Director Corporate Relations',
        placement_contact_phone: '+91 98991 22334',
        placement_contact_email: 'manish.cpdd@galgotiacollege.edu.in',
        lead_source: 'Cold Call',
        referred_by: '',
        startup_id: null,
        status: 'First Call Attempted',
        priority: 'Medium',
        estimated_students: 80,
        notes: 'Called main desk, received direct extension of Director CPDD. Need to re-dial during morning hours.',
        next_follow_up_date: overdueDayStr + 'T11:00:00',
        activities: [
          {
            date_time: overdueDayStr + 'T11:00:00',
            channel: 'Phone',
            contact_person: 'Prof. Manish Gupta',
            call_outcome: 'Busy',
            notes: 'Line busy on direct mobile. Secretary mentioned he is in student grievance meeting.',
            questions_asked: '',
            objections_raised: '',
            promised_documents: '',
            next_action: 'Callback requested after 3 PM.',
            next_follow_up_date: overdueDayStr + 'T15:30:00'
          }
        ],
        tasks: [
          {
            title: 'Call Prof. Manish Gupta back regarding BTech 3rd year IT training options',
            priority: 'Medium',
            due_date: overdueDayStr + 'T15:30:00',
            is_completed: 0
          }
        ]
      },
      {
        name: 'JSS Academy of Technical Education (JSSATE)',
        type: 'Autonomous',
        state: 'Karnataka',
        city: 'Bengaluru',
        address: 'JSS Campus, Uttarahalli-Kengeri Main Road, Bengaluru, Karnataka 560060',
        website: 'https://jssateb.ac.in',
        official_email: 'tpo@jssateb.ac.in',
        phone: '+91 80 2861 2565',
        student_population: 3600,
        relevant_branches: 'CSE, ISE, ECE',
        target_years: '3rd year',
        placement_contact_name: 'Prof. B.V. Sreedhar',
        placement_contact_designation: 'Training & Placement Officer',
        placement_contact_phone: '+91 94801 66554',
        placement_contact_email: 'sreedhar.tpo@jssateb.ac.in',
        lead_source: 'Event',
        referred_by: 'Bengaluru EdTech Summit 2026',
        startup_id: null,
        status: 'Contact Identified',
        priority: 'Medium',
        estimated_students: 70,
        notes: 'Met at Bangalore EdTech Expo booth. Exchanged visiting cards.',
        next_follow_up_date: todayStr + 'T12:00:00',
        activities: [],
        tasks: [
          {
            title: 'First call to Prof. Sreedhar to introduce our hybrid IT training courses',
            priority: 'Medium',
            due_date: todayStr + 'T12:00:00',
            is_completed: 0
          }
        ]
      },
      {
        name: 'Government College of Technology (GCT Coimbatore)',
        type: 'Government',
        state: 'Tamil Nadu',
        city: 'Coimbatore',
        address: 'Thadagam Road, Coimbatore, Tamil Nadu 641013',
        website: 'https://gct.ac.in',
        official_email: 'placement@gct.ac.in',
        phone: '+91 422 243 2221',
        student_population: 3200,
        relevant_branches: 'CSE, IT, ECE, EEE',
        target_years: '3rd, 4th year',
        placement_contact_name: 'Dr. M. Shanmugam',
        placement_contact_designation: 'Professor & Placement Officer',
        placement_contact_phone: '+91 94421 88990',
        placement_contact_email: 'placement.officer@gct.ac.in',
        lead_source: 'Cold Call',
        referred_by: '',
        startup_id: null,
        status: 'Lost',
        priority: 'Low',
        estimated_students: 0,
        lost_reason: 'Government procurement tender rules require empanelled state training partner with 5-year audited balance sheet.',
        notes: 'Government college requires state government tender empanelment. Cannot do private direct billing this year.',
        activities: [
          {
            date_time: '2026-10-02T10:30:00',
            channel: 'Phone',
            contact_person: 'Dr. M. Shanmugam',
            call_outcome: 'Not Interested',
            notes: 'Explained state university procurement guidelines. They can only hire via Tamil Nadu Skill Development Corporation (TNSDC) portal.',
            questions_asked: 'Are you registered on TNSDC portal?',
            objections_raised: 'Direct procurement not permitted by state audit.',
            promised_documents: '',
            next_action: 'Close lead for current academic cycle.',
            next_follow_up_date: null
          }
        ],
        tasks: []
      },
      {
        name: 'Sardar Patel Institute of Technology (SPIT Mumbai)',
        type: 'Autonomous',
        state: 'Maharashtra',
        city: 'Mumbai',
        address: 'Munshi Nagar, Andheri West, Mumbai, Maharashtra 400058',
        website: 'https://www.spit.ac.in',
        official_email: 'tpo@spit.ac.in',
        phone: '+91 22 2670 7440',
        student_population: 2800,
        relevant_branches: 'Computer Engineering, IT, AI & Data Science',
        target_years: '2nd, 3rd year',
        placement_contact_name: 'Prof. Vinod Sikka',
        placement_contact_designation: 'Head T&P Cell',
        placement_contact_phone: '+91 98200 44332',
        placement_contact_email: 'vinod.sikka@spit.ac.in',
        lead_source: 'Cold Call',
        referred_by: '',
        startup_id: null,
        status: 'Follow-up Later',
        priority: 'Medium',
        estimated_students: 60,
        notes: 'Currently undergoing NAAC accreditation inspection. Asked to call back in December.',
        next_follow_up_date: '2026-12-01T10:00:00',
        activities: [
          {
            date_time: '2026-10-16T11:00:00',
            channel: 'Phone',
            contact_person: 'Prof. Vinod Sikka',
            call_outcome: 'Callback Requested',
            notes: 'Prof. Sikka is positive on the concept but campus is entirely occupied with NAAC committee visit until late November.',
            questions_asked: 'Can you share brochure via email?',
            objections_raised: 'No time for demos until December.',
            promised_documents: 'Brochure sent to official email.',
            next_action: 'Follow up in December after NAAC cycle completes.',
            next_follow_up_date: '2026-12-01T10:00:00'
          }
        ],
        tasks: [
          {
            title: 'Contact Prof. Vinod Sikka post-NAAC inspection for spring semester planning',
            priority: 'Medium',
            due_date: '2026-12-01T10:00:00',
            is_completed: 0
          }
        ]
      },
      {
        name: 'VNR Vignana Jyothi Institute of Engineering & Technology (VNR VJIET)',
        type: 'Autonomous',
        state: 'Telangana',
        city: 'Hyderabad',
        address: 'Vignana Jyothi Nagar, Pragathi Nagar, Nizampet, Hyderabad, Telangana 500090',
        website: 'https://www.vnrvjiet.ac.in',
        official_email: 'tpo@vnrvjiet.in',
        phone: '+91 40 2304 2758',
        student_population: 6000,
        relevant_branches: 'CSE, CSE (AI/ML), CSE (Data Science), IT',
        target_years: '3rd year',
        placement_contact_name: 'Dr. Ch. Suresh Kumar',
        placement_contact_designation: 'Dean Placements',
        placement_contact_phone: '+91 98480 99112',
        placement_contact_email: 'suresh.kumar@vnrvjiet.in',
        lead_source: 'LinkedIn',
        referred_by: 'LinkedIn InMail',
        startup_id: null,
        status: 'New Lead',
        priority: 'High',
        estimated_students: 110,
        notes: 'Top tier autonomous college in Hyderabad. Excellent placement record with Tier-1 product firms.',
        next_follow_up_date: tomorrowStr + 'T10:00:00',
        activities: [],
        tasks: [
          {
            title: 'Initiate contact with Dean Suresh Kumar regarding Cloud & GenAI electives',
            priority: 'High',
            due_date: tomorrowStr + 'T10:00:00',
            is_completed: 0
          }
        ]
      }
    ];

    for (const c of sampleColleges) {
      const now = new Date().toISOString();
      const colRes = db.run(
        `INSERT INTO colleges (
          user_id, name, type, state, city, address, website, official_email, phone,
          student_population, relevant_branches, target_years, placement_contact_name,
          placement_contact_designation, placement_contact_phone, placement_contact_email,
          lead_source, referred_by, startup_id, status, priority, estimated_students,
          notes, is_archived, lost_reason, won_agreement_date, won_pricing, won_student_count,
          next_follow_up_date, last_activity_date, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          userId, c.name, c.type, c.state, c.city, c.address, c.website, c.official_email, c.phone,
          c.student_population, c.relevant_branches, c.target_years, c.placement_contact_name,
          c.placement_contact_designation, c.placement_contact_phone, c.placement_contact_email,
          c.lead_source, c.referred_by, c.startup_id, c.status, c.priority, c.estimated_students,
          c.notes, c.lost_reason || null, c.won_agreement_date || null, c.won_pricing || null,
          c.won_student_count || null, c.next_follow_up_date,
          c.activities.length > 0 ? c.activities[c.activities.length - 1].date_time : now,
          now, now
        ]
      );

      const colId = colRes.lastInsertRowid;

      // Add stage history
      db.run(
        `INSERT INTO stage_history (college_id, user_id, from_stage, to_stage, notes, changed_at)
         VALUES (?, ?, NULL, ?, 'Initial lead entry', ?)`,
        [colId, userId, c.status, now]
      );

      // Add activities
      for (const a of c.activities) {
        db.run(
          `INSERT INTO call_activities (
            college_id, user_id, date_time, channel, contact_person, call_outcome,
            notes, questions_asked, objections_raised, promised_documents,
            next_action, next_follow_up_date
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            colId, userId, a.date_time, a.channel, a.contact_person, a.call_outcome,
            a.notes, a.questions_asked, a.objections_raised, a.promised_documents,
            a.next_action, a.next_follow_up_date
          ]
        );
      }

      // Add tasks
      for (const t of c.tasks) {
        db.run(
          `INSERT INTO follow_ups (
            college_id, user_id, contact_person, title, description,
            priority, due_date, is_completed
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            colId, userId, c.placement_contact_name, t.title,
            t.description || '', t.priority, t.due_date, t.is_completed
          ]
        );
      }

      // Add proposals
      if (c.proposals) {
        for (const p of c.proposals) {
          db.run(
            `INSERT INTO proposals (
              college_id, course_id, user_id, title, status, date_sent,
              quoted_price, expected_students, total_deal_value, next_action, notes
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              colId, p.course_id, userId, p.title, p.status, p.date_sent,
              p.quoted_price, p.expected_students, p.total_deal_value,
              p.next_action || '', p.notes || ''
            ]
          );
        }
      }
    }
  }

  db.saveDB();
}

seed.seed = seed;
seed.seedUserData = seedUserData;

if (require.main === module) {
  seed().then(() => {
    console.log('Database seeded.');
    process.exit(0);
  }).catch(err => {
    console.error('Seed error:', err);
    process.exit(1);
  });
}

module.exports = seed;
