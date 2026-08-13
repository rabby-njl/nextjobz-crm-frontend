/* =====================================================================
 * mock-data.js
 *
 * WARNING: THIS FILE MUST NEVER CONTAIN REAL CLIENT DATA.
 * Every name, phone number, email and company below is FAKE seed data
 * for a public demo. Replace real records only through the live backend
 * in Phase 2, never in this file.
 * ===================================================================== */

(function () {
  function pad(n) {
    return String(n).padStart(3, '0');
  }

  function phone(n) {
    // always 11 digits starting 01
    return '0170000' + String(n).padStart(4, '0');
  }

  function daysAgo(n) {
    const d = new Date();
    d.setDate(d.getDate() - n);
    return Utils.toISO(d);
  }

  function daysFromNow(n) {
    const d = new Date();
    d.setDate(d.getDate() + n);
    return Utils.toISO(d);
  }

  function hoursAgo(n) {
    return new Date(Date.now() - n * 3600 * 1000).toISOString();
  }

  function monthAgo(n) {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() - n);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0');
  }

  const COMPANIES = [
    'Demo Textiles Ltd', 'Sample Pharma BD', 'Test Garments Group', 'Example Foods Ltd',
    'Placeholder Bank PLC', 'Dummy Agro Industries', 'Fake Fashion House', 'Mock Electronics Co',
    'Placeholder Packaging Ltd', 'Sample Ceramics BD', 'Test Footwear Ltd', 'Demo Plastics Group',
    'Example Cement Works', 'Dummy Steel Mills', 'Fake Agro Foods', 'Mock Knit Composite',
    'Placeholder Jute Mills', 'Sample Leather BD', 'Test Beverage Co', 'Demo Paper Mills',
    'Example Energy Ltd', 'Dummy Textile Mills', 'Fake Chemical Works', 'Mock Food Products',
    'Placeholder Spinning Mills'
  ];

  const INDUSTRIES = [
    'Textiles', 'Pharmaceuticals', 'Garments', 'Food & Beverage', 'Banking', 'Agro',
    'Fashion', 'Electronics', 'Packaging', 'Ceramics', 'Footwear', 'Plastics',
    'Cement', 'Steel', 'Agro', 'Garments', 'Jute', 'Leather', 'Beverage', 'Paper',
    'Energy', 'Textiles', 'Chemicals', 'Food & Beverage', 'Textiles'
  ];

  const ZONES = ['Dhaka North', 'Dhaka South', 'Chattogram', 'Gazipur', 'Narayanganj', 'Khulna', 'Rajshahi', 'Sylhet'];

  const SIZES = ['1-10', '11-50', '51-200', '201-500', '501-1000', '1000+'];

  const SALES_OFFICERS = ['Officer One', 'Officer Two', 'Officer Three', 'Officer Four'];
  const CRM_OFFICERS = ['Officer Five', 'Officer Six'];
  const RECRUITERS = ['Recruiter One', 'Recruiter Two'];
  const ALL_OFFICERS = SALES_OFFICERS.concat(CRM_OFFICERS).concat(RECRUITERS);

  const CONTACTS = [
    'Contact One', 'Contact Two', 'Contact Three', 'Contact Four', 'Contact Five',
    'Contact Six', 'Contact Seven', 'Contact Eight', 'Contact Nine', 'Contact Ten',
    'Contact Eleven', 'Contact Twelve'
  ];

  const DESIGNATIONS = [
    'HR Manager', 'Admin Officer', 'Managing Director', 'Procurement Head',
    'Marketing Manager', 'Accounts Officer', 'Operations Manager', 'CEO'
  ];

  const SERVICES = [
    'Job Post - Basic', 'Job Post - Premium', 'Job Post - Featured', 'CV Bank Access',
    'Employer Branding', 'LearningLab Training', 'Headhunting / RPO', 'Payroll Outsourcing',
    'Staffing Solution', 'Campus Hiring', 'Event & Activation'
  ];

  const SOURCES = [
    'Meta ads', 'Google ads', 'organic social', 'website form', 'Messenger', 'WhatsApp',
    'Hotline call', 'LinkedIn', 'referral', 'field visit', 'cold call', 'event',
    'existing data calling', 'scrapped job follow-up'
  ];

  const ROUTES = ['Sales', 'Headhunting & Staffing', 'Payroll', 'LearningLab', 'Events'];

  const LEAD_STATUSES = ['new', 'assigned', 'contacted', 'qualified', 'converted', 'lost'];
  const LOST_REASONS = ['price too high', 'no requirement now', 'chose competitor', 'no response', 'not our service'];

  const DEAL_STAGES = ['prospecting', 'demo', 'quotation', 'negotiation', 'won', 'lost'];

  const VISIT_TYPES = ['field visit', 'online meeting', 'phone call'];

  const ORDER_STATUSES = ['pending', 'confirmed', 'active', 'expired', 'cancelled'];

  const COLLECTION_STATUSES = ['due', 'partial', 'paid'];
  const COLLECTION_METHODS = ['bKash', 'Nagad', 'bank transfer', 'cheque', 'cash'];

  const QUERY_CHANNELS = ['Messenger', 'WhatsApp', 'Hotline', 'LinkedIn', 'Email', 'Platform'];
  const QUERY_TYPES = ['job seeker query', 'employer query', 'technical issue', 'event inquiry', 'CV support', 'training inquiry'];
  const QUERY_STATUSES = ['open', 'in progress', 'escalated', 'resolved'];

  const JS_TYPES = ['CV support', 'profile completion call', 'application help', 'interview prep'];
  const JS_OUTCOMES = ['profile completed', 'CV updated', 'no response', 'call back later'];

  const CAMPAIGN_CHANNELS = ['Meta Ads', 'Google Ads', 'Organic Social', 'SEO', 'Email'];

  const REQ_SERVICE_TYPES = ['Headhunting / RPO', 'Staffing Solution', 'Campus Hiring'];
  const REQ_STAGES = ['JD pending', 'JD ready', 'posted', 'screening', 'interviewing', 'shortlist sent', 'offer stage', 'placed', 'cancelled'];

  const PAYROLL_CYCLES = ['data pending', 'processing', 'ready for approval', 'disbursed'];

  const CAMPAIGN_STATUSES = ['running', 'paused', 'ended'];
  const VENDOR_SERVICE_TYPES = ['content', 'creative', 'SEO', 'media buying', 'other'];
  const VENDOR_STATUSES = ['received', 'verified', 'forwarded for approval', 'paid'];
  const VENDOR_NAMES = ['Demo Creative Studio', 'Sample Media House', 'Test SEO Agency', 'Placeholder Print Co', 'Mock Video House', 'Fake Content Lab'];
  const EVENT_TYPES = ['job fair', 'campus activation', 'corporate event', 'roadshow', 'training event'];
  const EVENT_STATUSES = ['new', 'proposal sent', 'confirmed', 'completed', 'cancelled'];
  const EVENT_SOURCES = ['CRM team', 'marketing', 'website', 'referral', 'cold call'];

  /* ---------------- Employers (25) ---------------- */
  const employers = [];
  for (let i = 0; i < 25; i++) {
    const status = i % 6 === 5 ? 'lost' : (i % 6 === 4 ? 'dormant' : 'active');
    employers.push({
      id: 'EMP-' + pad(i + 1),
      name: COMPANIES[i],
      industry: INDUSTRIES[i],
      size: SIZES[i % SIZES.length],
      address: 'Plot ' + (i + 1) + ', ' + ZONES[i % ZONES.length] + ' Industrial Area',
      zone: ZONES[i % ZONES.length],
      phone: phone(i + 1),
      email: 'contact' + (i + 1) + '@example.com',
      salesperson: SALES_OFFICERS[i % SALES_OFFICERS.length],
      status: status,
      servicesUsed: [SERVICES[i % SERVICES.length], SERVICES[(i + 3) % SERVICES.length]],
      lastContact: daysAgo((i * 3) % 20)
    });
  }

  /* ---------------- Leads (40) ---------------- */
  const leads = [];
  for (let i = 0; i < 40; i++) {
    // ~9 unrouted leads; a few of them older than 24h to trigger the dashboard warning.
    const unrouted = i % 6 === 0 || i === 33 || i === 37;
    const lost = i % 9 === 8;
    const status = lost ? 'lost' : LEAD_STATUSES[i % 5];
    const lastActivity = daysAgo((i * 2) % 12);
    const routedTo = unrouted ? null : ROUTES[i % ROUTES.length];
    const routedBy = unrouted ? null : CRM_OFFICERS[i % CRM_OFFICERS.length];
    const assignedTo = unrouted ? null : ALL_OFFICERS[i % ALL_OFFICERS.length];

    // Build a routing history + activity timeline for the detail view.
    const createdDate = daysAgo((i % 15) + 1);
    const createdDT = new Date();
    createdDT.setDate(createdDT.getDate() - ((i % 15) + 1));
    const history = [];
    history.push({ action: 'created', text: 'Lead created', by: CRM_OFFICERS[i % CRM_OFFICERS.length], at: createdDT.toISOString() });
    if (!unrouted) {
      history.push({ action: 'routed', text: 'Routed to ' + routedTo, by: routedBy, at: new Date(createdDT.getTime() + 3 * 3600 * 1000).toISOString() });
      history.push({ action: 'assigned', text: 'Assigned to ' + assignedTo, by: routedBy, at: new Date(createdDT.getTime() + 4 * 3600 * 1000).toISOString() });
      history.push({ action: 'accepted', text: 'Accepted by ' + assignedTo, by: assignedTo, at: new Date(createdDT.getTime() + 6 * 3600 * 1000).toISOString() });
    }
    if (lost) {
      history.push({ action: 'lost', text: 'Marked lost: ' + LOST_REASONS[i % LOST_REASONS.length], by: ALL_OFFICERS[i % ALL_OFFICERS.length], at: new Date(createdDT.getTime() + 20 * 3600 * 1000).toISOString() });
    } else if (status !== 'new') {
      history.push({ action: 'status', text: 'Status updated to ' + status, by: assignedTo || CRM_OFFICERS[i % CRM_OFFICERS.length], at: new Date(createdDT.getTime() + 10 * 3600 * 1000).toISOString() });
    }
    history.push({ action: 'note', text: 'Seed lead #' + (i + 1) + ' for demo.', by: CRM_OFFICERS[i % CRM_OFFICERS.length], at: new Date(createdDT.getTime() + 5 * 3600 * 1000).toISOString() });

    leads.push({
      id: 'LEAD-' + pad(i + 1),
      company: COMPANIES[i % COMPANIES.length],
      contactName: CONTACTS[i % CONTACTS.length],
      phone: phone(40 + i),
      email: 'lead' + (i + 1) + '@example.com',
      source: SOURCES[i % SOURCES.length],
      serviceInterest: SERVICES[i % SERVICES.length],
      routedTo: routedTo,
      assignedTo: assignedTo,
      status: status,
      note: 'Seed lead #' + (i + 1) + ' for demo.',
      createdAt: createdDate,
      routedAt: unrouted ? null : daysAgo((i % 12) + 1),
      routedBy: routedBy,
      acceptedBy: unrouted ? null : assignedTo,
      lastActivityAt: lastActivity,
      lostReason: lost ? LOST_REASONS[i % LOST_REASONS.length] : null,
      history: history
    });
  }

  /* ---------------- Deals (20) ---------------- */
  const deals = [];
  for (let i = 0; i < 20; i++) {
    const stage = DEAL_STAGES[i % DEAL_STAGES.length];
    deals.push({
      id: 'DEAL-' + pad(i + 1),
      employer: COMPANIES[i % COMPANIES.length],
      service: SERVICES[i % SERVICES.length],
      stage: stage,
      value: 50000 + ((i * 37000) % 900000),
      officer: SALES_OFFICERS[i % SALES_OFFICERS.length],
      expectedClose: daysFromNow((i * 5) % 45),
      lastActivity: daysAgo((i * 3) % 14)
    });
  }

  /* ---------------- Visits (30) ---------------- */
  const visits = [];
  for (let i = 0; i < 30; i++) {
    visits.push({
      id: 'VISIT-' + pad(i + 1),
      employer: COMPANIES[i % COMPANIES.length],
      date: daysAgo((i % 14)),
      type: VISIT_TYPES[i % VISIT_TYPES.length],
      officer: SALES_OFFICERS[i % SALES_OFFICERS.length],
      outcome: ['meeting held', 'demo given', 'follow-up planned', 'no show'][i % 4],
      nextStep: ['send proposal', 'call back', 'schedule demo', 'close deal'][i % 4]
    });
  }

  /* ---------------- Orders / Package Sales (15) ---------------- */
  const orders = [];
  for (let i = 0; i < 15; i++) {
    const start = daysAgo((i % 120));
    const end = daysFromNow(((i + 5) % 90));
    orders.push({
      id: 'ORD-' + pad(i + 1),
      employer: COMPANIES[i % COMPANIES.length],
      service: SERVICES[i % SERVICES.length],
      amount: 15000 + ((i * 19000) % 250000),
      status: ORDER_STATUSES[i % ORDER_STATUSES.length],
      startDate: start,
      endDate: end,
      officer: SALES_OFFICERS[i % SALES_OFFICERS.length]
    });
  }

  /* ---------------- Collections (20) ---------------- */
  const collections = [];
  for (let i = 0; i < 20; i++) {
    const status = COLLECTION_STATUSES[i % COLLECTION_STATUSES.length];
    const dueDate = daysAgo((i * 2) % 60);
    collections.push({
      id: 'INV-' + pad(i + 1),
      employer: COMPANIES[i % COMPANIES.length],
      amount: 10000 + ((i * 21000) % 300000),
      dueDate: dueDate,
      paidDate: status === 'paid' ? daysAgo((i % 30)) : (status === 'partial' ? daysAgo((i % 10)) : null),
      status: status,
      method: COLLECTION_METHODS[i % COLLECTION_METHODS.length]
    });
  }

  /* ---------------- Queries (25) ---------------- */
  const queries = [];
  for (let i = 0; i < 25; i++) {
    const qStatus = QUERY_STATUSES[i % QUERY_STATUSES.length];
    const responded = qStatus === 'resolved' || qStatus === 'in progress';
    queries.push({
      id: 'Q-' + pad(i + 1),
      channel: QUERY_CHANNELS[i % QUERY_CHANNELS.length],
      from: CONTACTS[i % CONTACTS.length],
      type: QUERY_TYPES[i % QUERY_TYPES.length],
      subject: 'Inquiry about ' + SERVICES[i % SERVICES.length],
      assignedTo: CRM_OFFICERS[i % CRM_OFFICERS.length],
      company: i % 3 === 0 ? COMPANIES[i % COMPANIES.length] : null,
      status: qStatus,
      responseHours: responded ? ((i % 10) + 1) : null,
      createdAt: hoursAgo((i * 3) % 40)
    });
  }

  /* ---------------- Campaigns (10) ---------------- */
  const campaigns = [];
  for (let i = 0; i < 10; i++) {
    const spend = 20000 + ((i * 15000) % 120000);
    const generated = 40 + ((i * 13) % 180);
    campaigns.push({
      id: 'CAMP-' + pad(i + 1),
      campaign: 'Campaign ' + String.fromCharCode(65 + i),
      channel: CAMPAIGN_CHANNELS[i % CAMPAIGN_CHANNELS.length],
      status: i % 4 === 3 ? 'paused' : 'running',
      spend: spend,
      leadsGenerated: generated,
      start: daysAgo((i % 60)),
      end: daysFromNow(30 - (i % 20))
    });
  }

  /* ---------------- Requirements (8) ---------------- */
  const requirements = [];
  for (let i = 0; i < 8; i++) {
    const applied = 5 + ((i * 7) % 40);
    const screened = Math.max(0, applied - (i % 8));
    const shortlisted = Math.max(0, Math.floor(screened * 0.6));
    const interviewed = Math.max(0, Math.floor(shortlisted * 0.6));
    const sentToClient = Math.max(0, Math.floor(interviewed * 0.5));
    const selected = Math.max(0, Math.floor(sentToClient * 0.6));
    const joined = Math.max(0, Math.floor(selected * 0.7));
    requirements.push({
      id: 'REQ-' + pad(i + 1),
      client: COMPANIES[(i + 5) % COMPANIES.length],
      position: ['Sales Executive', 'Accounts Officer', 'Production Supervisor', 'HR Officer', 'IT Support', 'Marketing Executive', 'Store Keeper', 'Delivery Rider'][i],
      serviceType: REQ_SERVICE_TYPES[i % REQ_SERVICE_TYPES.length],
      headcount: 1 + ((i * 3) % 12),
      recruiter: RECRUITERS[i % RECRUITERS.length],
      stage: REQ_STAGES[i % REQ_STAGES.length],
      dateOpened: daysAgo((i * 4) % 30),
      pipeline: {
        applied: applied,
        screened: screened,
        shortlisted: shortlisted,
        interviewed: interviewed,
        sentToClient: sentToClient,
        selected: selected,
        joined: joined
      }
    });
  }

  /* ---------------- Proposals (10) ---------------- */
  const PROPOSAL_STATUSES = ['draft', 'sent', 'under review', 'won', 'lost'];
  const proposals = [];
  for (let i = 0; i < 10; i++) {
    proposals.push({
      id: 'PROP-' + pad(i + 1),
      client: COMPANIES[(i + 3) % COMPANIES.length],
      service: ['Headhunting / RPO', 'Staffing Solution', 'Payroll Outsourcing', 'Campus Hiring'][i % 4],
      value: 100000 + ((i * 55000) % 900000),
      sentDate: daysAgo((i % 30)),
      status: PROPOSAL_STATUSES[i % PROPOSAL_STATUSES.length],
      owner: RECRUITERS[i % RECRUITERS.length]
    });
  }

  /* ---------------- Payroll clients (6) ---------------- */
  const payrollClients = [];
  for (let i = 0; i < 6; i++) {
    payrollClients.push({
      id: 'PAY-' + pad(i + 1),
      clientName: COMPANIES[(i + 2) % COMPANIES.length],
      contractStart: daysAgo((i * 30) % 300),
      headcount: 20 + ((i * 17) % 400),
      cycleStatus: PAYROLL_CYCLES[i % PAYROLL_CYCLES.length],
      monthlyFee: 30000 + ((i * 12000) % 90000),
      owner: 'Payroll One'
    });
  }

  /* ---------------- Contacts (33) ---------------- */
  const contacts = [];
  for (let i = 0; i < 25; i++) {
    contacts.push({
      id: 'CONT-' + pad(i + 1),
      company: COMPANIES[i],
      name: CONTACTS[i % CONTACTS.length],
      designation: DESIGNATIONS[i % DESIGNATIONS.length],
      phone: phone(200 + i),
      email: 'contact' + (i + 1) + '@example.com',
      isPrimary: true
    });
  }
  for (let i = 0; i < 8; i++) {
    contacts.push({
      id: 'CONT-' + pad(26 + i),
      company: COMPANIES[i % COMPANIES.length],
      name: CONTACTS[(i + 6) % CONTACTS.length],
      designation: DESIGNATIONS[(i + 2) % DESIGNATIONS.length],
      phone: phone(300 + i),
      email: 'contact' + (26 + i) + '@example.com',
      isPrimary: false
    });
  }

  /* ---------------- Daily reports (12) ---------------- */
  const dailyReports = [];
  for (let i = 0; i < 12; i++) {
    dailyReports.push({
      id: 'REPORT-' + pad(i + 1),
      officer: SALES_OFFICERS[i % SALES_OFFICERS.length],
      date: daysAgo(i + 1),
      note: 'Seed daily report #' + (i + 1),
      stats: {
        visits: i % 5,
        calls: i % 7,
        leads: i % 3,
        dealsMoved: i % 2,
        invoices: i % 2
      },
      submittedAt: new Date(Date.now() - (i + 1) * 86400000).toISOString()
    });
  }

  /* ---------------- Job seeker support (20) ---------------- */
  const jobseekerSupports = [];
  for (let i = 0; i < 20; i++) {
    jobseekerSupports.push({
      id: 'JS-' + pad(i + 1),
      name: CONTACTS[i % CONTACTS.length],
      phone: phone(400 + i),
      type: JS_TYPES[i % JS_TYPES.length],
      officer: CRM_OFFICERS[i % CRM_OFFICERS.length],
      date: daysAgo((i % 28)),
      outcome: JS_OUTCOMES[i % JS_OUTCOMES.length]
    });
  }

  /* ---------------- Vendors (12) ---------------- */
  const vendors = [];
  for (let i = 0; i < 12; i++) {
    vendors.push({
      id: 'VEND-' + pad(i + 1),
      vendor: VENDOR_NAMES[i % VENDOR_NAMES.length],
      serviceType: VENDOR_SERVICE_TYPES[i % VENDOR_SERVICE_TYPES.length],
      billMonth: monthAgo(i % 6),
      amount: 5000 + ((i * 12000) % 150000),
      status: VENDOR_STATUSES[i % VENDOR_STATUSES.length],
      verifiedBy: i % 3 === 0 ? 'Marketing One' : null
    });
  }

  /* ---------------- Event leads (10) ---------------- */
  const events = [];
  for (let i = 0; i < 10; i++) {
    events.push({
      id: 'EVENT-' + pad(i + 1),
      organisation: COMPANIES[(i + 7) % COMPANIES.length],
      eventType: EVENT_TYPES[i % EVENT_TYPES.length],
      proposedDate: daysFromNow((i * 6) % 60),
      value: 50000 + ((i * 45000) % 700000),
      status: EVENT_STATUSES[i % EVENT_STATUSES.length],
      owner: 'Events One',
      source: i % 3 === 2 ? 'marketing' : 'CRM team'
    });
  }

  /* ---------------- Monthly targets (8) ---------------- */
  const targets = [];
  for (let m = 0; m < 2; m++) {
    for (let o = 0; o < SALES_OFFICERS.length; o++) {
      targets.push({
        id: 'TGT-' + pad(m * SALES_OFFICERS.length + o + 1),
        officer: SALES_OFFICERS[o],
        month: monthAgo(m),
        targetSales: 200000 + ((o * 75000) % 400000),
        targetVisits: 20 + ((o * 7) % 20),
        targetNewEmployers: 5 + ((o * 3) % 10),
        targetLeads: 30 + ((o * 9) % 30)
      });
    }
  }

  window.MOCK_DATA = {
    employers: employers,
    leads: leads,
    deals: deals,
    visits: visits,
    orders: orders,
    collections: collections,
    queries: queries,
    campaigns: campaigns,
    requirements: requirements,
    payrollClients: payrollClients,
    contacts: contacts,
    dailyReports: dailyReports,
    jobseekerSupports: jobseekerSupports,
    proposals: proposals,
    vendors: vendors,
    events: events,
    targets: targets
  };

  // Shared dropdown values used by every page. Pages read from here, not hard-coded.
  window.APP_CONSTANTS = {
    sources: SOURCES,
    services: SERVICES,
    routes: ROUTES,
    leadStatuses: LEAD_STATUSES,
    lostReasons: LOST_REASONS,
    officers: ['Officer One', 'Officer Two', 'Officer Three', 'Officer Four', 'Officer Five', 'Officer Six', 'Recruiter One', 'Recruiter Two', 'Marketing One', 'Payroll One', 'Events One'],
    salesOfficers: SALES_OFFICERS,
    crmOfficers: CRM_OFFICERS,
    companies: COMPANIES,
    zones: ZONES,
    industries: INDUSTRIES,
    dealStages: DEAL_STAGES,
    visitTypes: VISIT_TYPES,
    orderStatuses: ORDER_STATUSES,
    collectionStatuses: COLLECTION_STATUSES,
    collectionMethods: COLLECTION_METHODS,
    queryChannels: QUERY_CHANNELS,
    queryTypes: QUERY_TYPES,
    queryStatuses: QUERY_STATUSES,
    jsTypes: JS_TYPES,
    jsOutcomes: JS_OUTCOMES,
    campaignChannels: CAMPAIGN_CHANNELS,
    reqServiceTypes: REQ_SERVICE_TYPES,
    reqStages: REQ_STAGES,
    payrollCycles: PAYROLL_CYCLES,
    proposalStatuses: PROPOSAL_STATUSES,
    recruiters: RECRUITERS,
    campaignStatuses: CAMPAIGN_STATUSES,
    vendorServiceTypes: VENDOR_SERVICE_TYPES,
    vendorStatuses: VENDOR_STATUSES,
    eventTypes: EVENT_TYPES,
    eventStatuses: EVENT_STATUSES,
    eventSources: EVENT_SOURCES
  };
})();
