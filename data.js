// Seed data representing our mock backend database for the E2E Camps portal
export const initialCamps = [
  {
    id: "2-9828000040100",
    agency: "Omnicom Group",
    holdingGroup: "OMG",
    suite: "Google Marketing Platform (GMP)",
    strategicGoal: "Obviating Troubleshooting",
    salesSegment: "LCS",
    curriculumLevel: "101",
    amEmail: "am.harenberg@google.com",
    product: "GMP Camp: CM360 Foundations",
    region: "EMEA",
    platform: "Meet",
    stage: "nomination",
    status: "Pending Kickoff",
    nominationDate: "2026-05-18",
    discoveryStatus: "Not Sent",
    discoveryData: null,
    deckType: "Standard Deck",
    scheduledTime: null,
    presenter: null,
    liveQuestions: [],
    followUpSent: false,
    slaBreached: false,
    slaDaysRemaining: null,
    bfmUplift: null,
    feedbackScore: null,
    recordingArchived: false
  },
  {
    id: "1-4893000041135",
    agency: "GroupM",
    holdingGroup: "WPP",
    suite: "Google Marketing Platform (GMP)",
    strategicGoal: "Product Activation",
    salesSegment: "LCS",
    curriculumLevel: "201",
    amEmail: "am.sarah@google.com",
    product: "GMP Camp: DV360 Campaign Setup & Opt",
    region: "APAC",
    platform: "Meet",
    stage: "pre-camp",
    status: "Awaiting Discovery",
    nominationDate: "2026-05-14",
    discoveryStatus: "Pending",
    discoveryData: null,
    deckType: "Standard Deck",
    scheduledTime: "2026-05-22T14:00:00Z",
    presenter: "Taylor Chen (Presenter)",
    liveQuestions: [],
    followUpSent: false,
    slaBreached: false,
    slaDaysRemaining: 3,
    bfmUplift: null,
    feedbackScore: null,
    recordingArchived: false
  },
  {
    id: "3-7721000010200",
    agency: "Dentsu Aegis",
    holdingGroup: "Dentsu",
    suite: "AI, Search & Commerce",
    strategicGoal: "Product Activation",
    salesSegment: "GCS",
    curriculumLevel: "201",
    amEmail: "am.elitsa@google.com",
    product: "KPI Camp: Search & PMax AI Bidding",
    region: "AMER",
    platform: "Teams", // Microsoft Teams camp!
    stage: "in-camp",
    status: "Live Session Active",
    nominationDate: "2026-05-12",
    discoveryStatus: "Submitted",
    discoveryData: {
      confidence: "Intermediate",
      challenges: "Attribution modeling and conversion linker setups.",
      topics: ["Attribution Models", "Conversion Linker", "GA4 integrations"]
    },
    deckType: "Customized Deck",
    scheduledTime: "2026-05-18T11:00:00Z",
    presenter: "Alex Rivera (Presenter)",
    liveQuestions: [
      { id: "q1", text: "Does GA4 automatically link conversion paths from CM360 without GTM?", answered: true, answer: "Yes, when linking CM360 directly to GA4 property in admin panel." }
    ],
    followUpSent: false,
    slaBreached: false,
    slaDaysRemaining: null,
    bfmUplift: null,
    feedbackScore: null,
    recordingArchived: false
  },
  {
    id: "4-9901000031200",
    agency: "Publicis Groupe",
    holdingGroup: "Publicis",
    suite: "Video & Social",
    strategicGoal: "Externalizing Solutions",
    salesSegment: "GCAS",
    curriculumLevel: "101",
    amEmail: "am.sarah@google.com",
    product: "Partnership Ads Training (MFG - WPP)",
    region: "EMEA",
    platform: "Meet",
    stage: "post-camp",
    status: "Resolving Queries & Follow-up",
    nominationDate: "2026-05-10",
    discoveryStatus: "Submitted",
    discoveryData: {
      confidence: "Advanced",
      challenges: "Dynamic creative setups and custom floodlight variables.",
      topics: ["Dynamic Creatives", "Custom Floodlights", "S2S API integrations"]
    },
    deckType: "Customized Deck",
    scheduledTime: "2026-05-17T10:00:00Z",
    presenter: "Alex Rivera (Presenter)",
    liveQuestions: [
      { id: "q2", text: "Can custom Floodlights be passed via S2S API without a web tag?", answered: false, answer: null }
    ],
    followUpSent: false,
    slaBreached: false,
    slaDaysRemaining: 1,
    bfmUplift: null,
    feedbackScore: null,
    recordingArchived: false
  },
  {
    id: "5-1102000088900",
    agency: "Interpublic Group (IPG)",
    holdingGroup: "IPG",
    suite: "AI, Search & Commerce",
    strategicGoal: "Externalizing Solutions",
    salesSegment: "LCS",
    curriculumLevel: "201",
    amEmail: "am.sarah@google.com",
    product: "Apps Partner Center (iOS & Measurement)",
    region: "AMER",
    platform: "Meet",
    stage: "closed",
    status: "Impact Logged",
    nominationDate: "2026-04-12",
    discoveryStatus: "Submitted",
    discoveryData: {
      confidence: "Beginner",
      challenges: "Understanding BFM benefits over standard setups.",
      topics: ["BFM basics", "Bidding optimization"]
    },
    deckType: "Customized Deck",
    scheduledTime: "2026-04-18T15:00:00Z",
    presenter: "Alex Rivera (Presenter)",
    liveQuestions: [],
    followUpSent: true,
    slaBreached: false,
    slaDaysRemaining: null,
    bfmUplift: 18.4,
    feedbackScore: 4.8,
    recordingArchived: true // Safely archived in Shared Drive!
  },
  {
    id: "6-2203000011200",
    agency: "Havas Media",
    holdingGroup: "Havas",
    suite: "Google Marketing Platform (GMP)",
    strategicGoal: "Obviating Troubleshooting",
    salesSegment: "GCS",
    curriculumLevel: "101",
    amEmail: "am.elitsa@google.com",
    product: "GMP Camp: SA360 Bidding & Value",
    region: "APAC",
    platform: "Meet",
    stage: "closed",
    status: "Impact Logged",
    nominationDate: "2026-01-15",
    discoveryStatus: "Submitted",
    discoveryData: {
      confidence: "Advanced",
      challenges: "Tagging hygiene setups.",
      topics: ["Hygiene"]
    },
    deckType: "Customized Deck",
    scheduledTime: "2026-01-20T10:00:00Z",
    presenter: "Alex Rivera (Presenter)",
    liveQuestions: [],
    followUpSent: true,
    slaBreached: false,
    slaDaysRemaining: null,
    bfmUplift: 12.5,
    feedbackScore: 4.5,
    recordingDeleted: false,
    recordingArchived: false // Expired and not archived -> auto-deleted by cron!
  }
];

export const initialLogs = [
  { timestamp: "2026-05-18T11:00:00Z", level: "INFO", message: "System initialized. Camps databases synchronized with Cases Connect." },
  { timestamp: "2026-05-18T11:05:00Z", level: "INFO", message: "Nomination ticket parsed for Omnicom Group - Case 2-9828." },
  { timestamp: "2026-05-18T11:15:00Z", level: "SUCCESS", message: "Pre-Camp Discovery Link sent to GroupM - AM Ashlee." }
];

export const initialTasks = [
  { id: "t1", title: "Assign Lead Presenter to Case 2-9828 (Omnicom)", assignee: "Presenter", done: false, dueDate: "2026-05-20" },
  { id: "t2", title: "Review GroupM Discovery Service menu selection", assignee: "Presenter", done: false, dueDate: "2026-05-21" },
  { id: "t3", title: "Answer S2S API escalated question for Case 4-9901 (Publicis)", assignee: "PM", done: false, dueDate: "2026-05-19" }
];

export const initialChats = [
  { timestamp: "2026-05-18T11:30:00Z", sender: "Presenter", text: "Just kicked off the pre-camp scheduler for GroupM. AM team, please push for discovery form submission!" },
  { timestamp: "2026-05-18T11:45:00Z", sender: "AM", text: "Copy that! Pushing GroupM practitioners to fill it by tomorrow." },
  { timestamp: "2026-05-18T12:00:00Z", sender: "PM", text: "Monitoring the CM360 escalated questions in the PM queue. Will log authoritative replies shortly." }
];

export const initialTemplates = {
  discovery: {
    subject: "ACTION REQUIRED: Pre-Camp Discovery Form for {{AGENCY}}",
    body: "Hi {{AM_NAME}},\n\nYour {{PRODUCT}} Camp has been kicked off by presenter {{PRESENTER}}!\n\nPlease share this secure link with your agency contacts at {{AGENCY}} so they can complete their Discovery Form:\n\nhttps://camps.google.com/portal/agency-discovery?caseId={{CASE_ID}}\n\nThis form must be submitted by {{SLA_DATE}} to avoid applying the default deck protocol.\n\nBest,\nGPEG Camps Team"
  },
  resolution: {
    subject: "RESOLVED Q&A: Case {{CASE_ID}} - {{AGENCY}}",
    body: "Hi {{AM_NAME}},\n\nOur Product Lead / PM has resolved the escalated technical question for {{AGENCY}}.\n\nQuestion: \"{{QUESTION}}\"\nAnswer: \"{{ANSWER}}\"\n\nThis has been automatically embedded into your follow-up draft. You can now send the final post-camp package!\n\nBest,\nGPEG Camps Team"
  },
  followup: {
    subject: "FOLLOW-UP PACKAGE: GPEG {{PRODUCT}} Camp - {{AGENCY}}",
    body: "Hi {{AM_NAME}},\n\nThank you for coordinating the GPEG {{PRODUCT}} Camp for {{AGENCY}}!\n\nAs promised, please find the follow-up resources package below:\n1. Training Presentation (Customized PDF)\n2. Workshop Session Recording (MP4)\n3. Agency feedback Survey Link: https://camps.google.com/portal/agency-discovery?caseId={{CASE_ID}}\n\n--- LIVE CAPTURED Q&A SESSION RESOLUTION ---\n{{QA_CONTENT}}\n\nBest,\nGPEG Camps Team"
  }
};

// --- 10-TAB CONSOLE DATABASES SEEDS ---
export const initialTeamRoster = [
  { id: "r1", name: "Taylor Chen", role: "Presenter", status: "Clocked In", location: "Remote 🏠", timestamp: "2026-05-19T08:30:00Z" },
  { id: "r2", name: "Alex Rivera", role: "Presenter", status: "Clocked In", location: "Office 🏢", timestamp: "2026-05-19T09:00:00Z" },
  { id: "r3", name: "Jordan Blake", role: "Presenter", status: "Yet to Login", location: "Remote 🏠", timestamp: "N/A" },
  { id: "r4", name: "Angela Chang", role: "SME Partner", status: "Clocked In", location: "Office 🏢", timestamp: "2026-05-19T08:15:00Z" },
  { id: "r5", name: "Sarah Jenkins", role: "Account AM", status: "Clocked Out", location: "Remote 🏠", timestamp: "2026-05-18T18:00:00Z" }
];

export const initialWeeklyUtilization = [
  { id: "u1", weekEnding: "2026-05-22", name: "Taylor Chen", expectedHrs: 40, loggedHrs: 36, status: "Optimal" },
  { id: "u2", weekEnding: "2026-05-22", name: "Alex Rivera", expectedHrs: 40, loggedHrs: 45, status: "Overutilized" },
  { id: "u3", weekEnding: "2026-05-22", name: "Jordan Blake", expectedHrs: 40, loggedHrs: 22, status: "Underutilized" },
  { id: "u4", weekEnding: "2026-05-15", name: "Taylor Chen", expectedHrs: 40, loggedHrs: 40, status: "Optimal" },
  { id: "u5", weekEnding: "2026-05-15", name: "Alex Rivera", expectedHrs: 40, loggedHrs: 38, status: "Optimal" }
];

export const initialEffortLogs = [
  { id: "e1", caseId: "1-4893000041135", agency: "GroupM", name: "Taylor Chen", taskType: "Pre-Camp", taskName: "Discovery Form Customization Review", hours: 4.5 },
  { id: "e2", caseId: "3-7721000010200", agency: "Dentsu Aegis", name: "Alex Rivera", taskType: "In-Camp", taskName: "Live Session Workshop Delivery", hours: 2.0 },
  { id: "e3", caseId: "4-9901000031200", agency: "Publicis Groupe", name: "Jordan Blake", taskType: "Post-Camp", taskName: "Q&A Technical Resolution & Packing", hours: 3.0 },
  { id: "e4", caseId: "2-9828000040100", agency: "Omnicom Group", name: "Taylor Chen", taskType: "Pre-Camp", taskName: "Presenter Scheduling Coordination", hours: 1.5 }
];

export const mosCamps = [
  { campId: "c_yt", strategicGoal: "Activate", category: "YouTube +", campName: "YouTube Brand Camp", launchStatus: "Available" },
  { campId: "c_dg", strategicGoal: "Activate", category: "YouTube +", campName: "Demand Gen Camp", launchStatus: "Available" },
  { campId: "c_pmax", strategicGoal: "Activate", category: "Search +", campName: "PMax & Brand Camp", launchStatus: "Available" },
  { campId: "c_gmp", strategicGoal: "Obviate", category: "Platform - GMP +", campName: "GMP Campaign Foundations", launchStatus: "Available" }
];

export const mosTopics = [
  { topicId: "t_yt_1", campId: "c_yt", topicCategory: "YouTube Brand", activationPath: "101", topicName: "101- Introduction to AI Powered Video - VRC & VVC Overview", durationMinutes: 60, targetBfm: "Brand AI-Powered Depth", baseDeckTitle: "gPEG ( Base Deck ) - YT Camp (Intro, VRC & VVC Overview)" },
  { topicId: "t_yt_2", campId: "c_yt", topicCategory: "YouTube Brand", activationPath: "201", topicName: "201- Deep Dive: Advanced Bidding & Creative Formats", durationMinutes: 90, targetBfm: "Brand AI-Powered Depth", baseDeckTitle: "gPEG ( Base Deck ) - YT Camp (Bidding & Advanced Formats)" },
  { topicId: "t_dg_1", campId: "c_dg", topicCategory: "Display & Video", activationPath: "101", topicName: "101- Introduction to Demand Gen Social & Bidding", durationMinutes: 60, targetBfm: "Demand Gen Social Growth", baseDeckTitle: "gPEG ( Base Deck ) - DemandGen Camp (Social & Bidding)" },
  { topicId: "t_pmax_1", campId: "c_pmax", topicCategory: "Search & Commerce", activationPath: "201", topicName: "201- Search & PMax Bidding Custom Allocations", durationMinutes: 90, targetBfm: "PMax AI Bidding Efficiency", baseDeckTitle: "gPEG ( Base Deck ) - PMax Camp (Bidding & Budget)" },
  { topicId: "t_gmp_1", campId: "c_gmp", topicCategory: "GMP Platforms", activationPath: "101", topicName: "101- GMP CM360 Foundations & S2S API variables", durationMinutes: 60, targetBfm: "GMP Campaign Obviation", baseDeckTitle: "gPEG ( Base Deck ) - CM360 Camp (Foundations & Ingress)" }
];
