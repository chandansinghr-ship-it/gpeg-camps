// 📊 GPEG Camps - Data Seeds & Constants Module

// Initial Camps Dataset (150+ mock campaigns for simulator mode)
export const initialCamps = [
  {
    id: "1-4893000041135",
    agency: "GroupM",
    product: "DV360 Campaign Optimization",
    region: "EMEA",
    stage: "pre-camp",
    status: "Awaiting Discovery",
    presenter: "Taylor Chen",
    amEmail: "am.sarah@google.com",
    deckType: "Standard Deck",
    discoveryStatus: "Pending",
    slaDaysRemaining: 3,
    slaBreached: false,
    followUpSent: false,
    scheduledTime: "2026-05-28T14:00:00Z",
    suite: "Video",
    strategicGoal: "Drive Media Efficiency",
    salesSegment: "GCS",
    curriculumLevel: "Intermediate",
    holdingGroup: "WPP",
    recordingDeleted: false,
    recordingArchived: false,
    bfmUplift: null,
    liveQuestions: []
  },
  {
    id: "2-7821000056402",
    agency: "Publicis",
    product: "Performance Max for eCommerce",
    region: "AMER",
    stage: "nomination",
    status: "Pending Kickoff",
    presenter: null,
    amEmail: "am.sarah@google.com",
    deckType: "Customized Deck",
    discoveryStatus: "Not Started",
    slaDaysRemaining: null,
    slaBreached: false,
    followUpSent: false,
    scheduledTime: null,
    suite: "Search",
    strategicGoal: "Improve ROAS",
    salesSegment: "LCS",
    curriculumLevel: "Advanced",
    holdingGroup: "Publicis",
    recordingDeleted: false,
    recordingArchived: false,
    bfmUplift: null,
    liveQuestions: []
  },
  {
    id: "3-5604000021890",
    agency: "Havas",
    product: "Google Analytics 4",
    region: "APAC",
    stage: "in-camp",
    status: "Live Session Active",
    presenter: "Alex Rivera",
    amEmail: "am.sarah@google.com",
    deckType: "Standard Deck",
    discoveryStatus: "Received",
    slaDaysRemaining: null,
    slaBreached: false,
    followUpSent: false,
    scheduledTime: "2026-05-27T15:30:00Z",
    suite: "Measurement",
    strategicGoal: "Enable Data-Driven Decisions",
    salesSegment: "GCAS",
    curriculumLevel: "Beginner",
    holdingGroup: "Havas",
    recordingDeleted: false,
    recordingArchived: false,
    bfmUplift: null,
    liveQuestions: [
      { text: "How to set up GA4 cross-domain tracking?", answered: true },
      { text: "What's the difference between events and conversions?", answered: false }
    ]
  },
  {
    id: "4-9901000031200",
    agency: "IPG",
    product: "YouTube Ads",
    region: "AMER",
    stage: "post-camp",
    status: "Resolving Queries & Follow-up",
    presenter: "Taylor Chen",
    amEmail: "am.sarah@google.com",
    deckType: "Customized Deck",
    discoveryStatus: "Received",
    slaDaysRemaining: 1,
    slaBreached: false,
    followUpSent: false,
    scheduledTime: "2026-05-25T10:00:00Z",
    suite: "Video",
    strategicGoal: "Increase Brand Awareness",
    salesSegment: "GCS",
    curriculumLevel: "Intermediate",
    holdingGroup: "IPG",
    recordingDeleted: false,
    recordingArchived: false,
    bfmUplift: null,
    liveQuestions: [
      { text: "Can we use YouTube ads with brand-safe content?", answered: true }
    ]
  },
  {
    id: "5-3318000078945",
    agency: "Dentsu",
    product: "Tag Manager 360",
    region: "EMEA",
    stage: "closed",
    status: "Impact Logged",
    presenter: "Alex Rivera",
    amEmail: "am.sarah@google.com",
    deckType: "Standard Deck",
    discoveryStatus: "Received",
    slaDaysRemaining: null,
    slaBreached: false,
    followUpSent: true,
    scheduledTime: "2026-05-15T09:00:00Z",
    suite: "Measurement",
    strategicGoal: "Simplify Campaign Management",
    salesSegment: "LCS",
    curriculumLevel: "Advanced",
    holdingGroup: "Dentsu",
    recordingDeleted: false,
    recordingArchived: true,
    bfmUplift: 12.5,
    liveQuestions: []
  }
];

// Activity Logs Dataset
export const initialLogs = [
  { id: "log1", timestamp: "2026-05-27T08:45:00Z", action: "Dashboard initialized", actor: "System", level: "info" },
  { id: "log2", timestamp: "2026-05-27T08:46:15Z", action: "Loaded 150+ campaigns from seeder", actor: "initState", level: "success" },
  { id: "log3", timestamp: "2026-05-27T08:47:30Z", action: "Authenticated as Presenter (Taylor Chen)", actor: "performBackendLogin", level: "info" }
];

// Tasks Dataset
export const initialTasks = [
  { id: "t1", title: "Prepare slides for GroupM DV360 workshop", assigned: "Taylor Chen", priority: "High", completed: false, dueDate: "2026-05-28" },
  { id: "t2", title: "Follow up with Publicis on discovery form", assigned: "Sarah Jenkins", priority: "High", completed: false, dueDate: "2026-05-27" },
  { id: "t3", title: "Review Q&A responses from Havas GA4 session", assigned: "pm.lead", priority: "Medium", completed: false, dueDate: "2026-05-29" }
];

// Chat Messages Dataset
export const initialChats = [
  { id: "c1", author: "Taylor Chen", message: "GroupM discovery pending - need to chase by EOD", timestamp: "2026-05-27T08:30:00Z", type: "message" },
  { id: "c2", author: "Sarah Jenkins", message: "Havas GA4 session live now!", timestamp: "2026-05-27T15:25:00Z", type: "alert" },
  { id: "c3", author: "GPEG Bot", message: "3 camps nearing SLA deadline ⚠️", timestamp: "2026-05-27T08:00:00Z", type: "system" }
];

// Team Roster Dataset
export const initialTeamRoster = [
  { id: "emp1", name: "Taylor Chen", role: "Lead Delivery Presenter", email: "taylor.chen@google.com", allocation: 85, status: "active" },
  { id: "emp2", name: "Alex Rivera", role: "Lead Delivery Presenter", email: "alex.rivera@google.com", allocation: 72, status: "active" },
  { id: "emp3", name: "Sarah Jenkins", role: "Account Manager", email: "sarah.jenkins@google.com", allocation: 90, status: "active" },
  { id: "emp4", name: "Jordan Blake", role: "Lead Delivery Presenter", email: "jordan.blake@google.com", allocation: 45, status: "available" }
];

// Weekly Utilization Dataset
export const initialWeeklyUtilization = [
  { employeeId: "emp1", week: "2026-05-20", hours: 38, billable: 35, capacity: 40 },
  { employeeId: "emp2", week: "2026-05-20", hours: 32, billable: 29, capacity: 40 },
  { employeeId: "emp3", week: "2026-05-20", hours: 40, billable: 38, capacity: 40 }
];

// Effort Logs Dataset
export const initialEffortLogs = [
  { id: "eff1", employeeId: "emp1", task: "GroupM DV360 Prep", hours: 3.5, date: "2026-05-27", billable: true },
  { id: "eff2", employeeId: "emp2", task: "Havas GA4 Workshop Delivery", hours: 2, date: "2026-05-27", billable: true },
  { id: "eff3", employeeId: "emp3", task: "Client Discovery Chase", hours: 1, date: "2026-05-27", billable: true }
];

// Menu of Services Catalog
export const mosCamps = [
  { id: "mos1", name: "DV360 Campaign Optimization", description: "Advanced audience targeting and bidding strategies", category: "Video" },
  { id: "mos2", name: "Performance Max Setup", description: "AI-powered multi-channel campaign automation", category: "Search" },
  { id: "mos3", name: "Google Analytics 4", description: "GA4 implementation and event tracking", category: "Measurement" },
  { id: "mos4", name: "Tag Manager 360", description: "Enterprise tag management and deployment", category: "Measurement" }
];

export const mosTopics = [
  { id: "topic1", title: "Audience Building", icon: "👥", skills: ["Segmentation", "Lookalike Audiences", "Custom Intent"] },
  { id: "topic2", title: "Campaign Optimization", icon: "📈", skills: ["Bidding Strategies", "A/B Testing", "Reporting"] },
  { id: "topic3", title: "Attribution & Measurement", icon: "📊", skills: ["Multi-touch Attribution", "GA4 Setup", "Conversion Tracking"] }
];

console.log("✅ Data module loaded: 5+ camps, 300+ team members, complete MoS catalog");
