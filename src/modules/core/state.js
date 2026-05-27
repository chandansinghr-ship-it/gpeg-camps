// 📦 GPEG Camps - State Management & Persistence Module
import { 
  initialCamps, 
  initialLogs, 
  initialTasks, 
  initialChats, 
  initialTeamRoster, 
  initialWeeklyUtilization, 
  initialEffortLogs, 
  mosCamps, 
  mosTopics 
} from '../../data.js';

export let state = {
  camps: [],
  outbox: [],
  logs: [],
  tasks: [],
  chats: [],
  teamRoster: [],
  weeklyUtilization: [],
  effortLogs: [],
  activeRole: "Presenter",
  authenticatedAgencyCaseId: null,
  simulatedTime: "2026-05-18T14:34:38Z",
  selectedAnalyticsRegion: null,
  mosCamps: [],
  mosTopics: [],
  
  // UX Refactoring Extensions
  simulatorModeActive: true,
  activityLogPage: 1,
  actionCenterPage: 1,
  actionCenterSortField: 'priority',
  actionCenterSortAsc: true,
  actionCenterFilterRole: 'ALL',
  actionCenterFilterCategory: 'ALL',
  actionCenterSearchQuery: '',
  
  // GPP UIF & Material Design 3 Extensions
  appTheme: 'system',
  navRailCollapsed: false,

  // Phase 5 Matrix Portfolio Filters
  matrixFilters: {
    suite: 'ALL',
    goal: 'ALL',
    segment: 'ALL',
    level: 'ALL',
    holding: 'ALL',
    customization: 'ALL'
  },

  // Step 2.5: Daily Action Hub & Collaboration Workspace State
  dailyTasks: [],
  workspaceAssets: [],
  activeInvitations: [],
  dryRuns: [],

  // Chatbot & Buganizer Extensions
  chatBotMessages: [
    { sender: 'bot', text: 'Hi GPEG delivery team! I am your Google ChatOps @GPEG-Bot. Ask me about case status, active campaigns, or SLA warnings!' }
  ],
  buganizerTickets: []
};

// Bind to window immediately for global backward-compatibility with existing scripts
if (typeof window !== 'undefined') {
  window.state = state;
}

// Initialize state from localStorage or fallback to seed data
export function initState() {
  const savedCamps = localStorage.getItem('gpeg_camps');
  const savedOutbox = localStorage.getItem('gpeg_outbox');
  const savedLogs = localStorage.getItem('gpeg_logs');
  const savedTasks = localStorage.getItem('gpeg_tasks');
  const savedChats = localStorage.getItem('gpeg_chats');
  const savedRole = localStorage.getItem('gpeg_role');

  if (savedCamps) {
    state.camps = JSON.parse(savedCamps);
  } else {
    state.camps = [...initialCamps];
    saveState();
  }

  if (savedOutbox) {
    state.outbox = JSON.parse(savedOutbox);
  } else {
    state.outbox = [
      {
        id: "m1",
        timestamp: "2026-05-14T14:05:00Z",
        from: "gpeg-camps@google.com",
        to: "am.sarah@google.com",
        cc: "gpeg-camps-archive@google.com",
        bcc: "",
        subject: "ACTION REQUIRED: Pre-Camp Discovery Form for GroupM",
        body: "Hi Sarah,\n\nYour DV360 Camp nomination has been kicked off! Please share this secure link with the GroupM agency contacts so they can complete their Discovery Form:\n\nhttps://camps.google.com/portal/agency-discovery?caseId=1-4893000041135\n\nThis form must be submitted by 2026-05-22 to avoid applying the default deck protocol.\n\nBest,\nGPEG Camps Team"
      }
    ];
    saveState();
  }

  if (savedLogs) {
    state.logs = JSON.parse(savedLogs);
  } else {
    state.logs = [...initialLogs];
    saveState();
  }

  if (savedTasks) {
    state.tasks = JSON.parse(savedTasks);
  } else {
    state.tasks = [...initialTasks];
    saveState();
  }

  if (savedChats) {
    state.chats = JSON.parse(savedChats);
  } else {
    state.chats = [...initialChats];
    saveState();
  }

  if (savedRole) {
    state.activeRole = savedRole;
  } else {
    state.activeRole = "Presenter";
    saveState();
  }

  // Step 2.5: Daily Action Hub Seeds
  const savedDailyTasks = localStorage.getItem('gpeg_daily_tasks');
  if (savedDailyTasks) {
    state.dailyTasks = JSON.parse(savedDailyTasks);
  } else {
    state.dailyTasks = [
      { id: "t_d1", title: "Gmail: Sarah Jenkins has pending Discovery chase for GroupM (Case 1-4893000041135)", priority: "High", source: "Gmail Ingress", assignee: "Sarah Jenkins", completed: false, resources: [] },
      { id: "t_d2", title: "Chat: b/38291002: S2S API Custom Variables Mapping answer sync pending for PM", priority: "High", source: "Chatbot Escalation", assignee: "pm.lead", completed: false, resources: [] },
      { id: "t_d3", title: "System: MS Teams Recording URL missing for Publicis Case (4-9901000031200). Dispatch locked.", priority: "Medium", source: "System Policy", assignee: "Taylor Chen", completed: false, resources: [] }
    ];
    localStorage.setItem('gpeg_daily_tasks', JSON.stringify(state.dailyTasks));
  }

  const savedAssets = localStorage.getItem('gpeg_workspace_assets');
  if (savedAssets) {
    state.workspaceAssets = JSON.parse(savedAssets);
  } else {
    state.workspaceAssets = [];
    localStorage.setItem('gpeg_workspace_assets', JSON.stringify(state.workspaceAssets));
  }

  const savedInvites = localStorage.getItem('gpeg_active_invitations');
  if (savedInvites) {
    state.activeInvitations = JSON.parse(savedInvites);
  } else {
    state.activeInvitations = [];
    localStorage.setItem('gpeg_active_invitations', JSON.stringify(state.activeInvitations));
  }

  const savedDryRuns = localStorage.getItem('gpeg_dry_runs');
  if (savedDryRuns) {
    state.dryRuns = JSON.parse(savedDryRuns);
  } else {
    state.dryRuns = [];
    localStorage.setItem('gpeg_dry_runs', JSON.stringify(state.dryRuns));
  }

  const savedAuthCaseId = localStorage.getItem('gpeg_auth_case_id');
  if (savedAuthCaseId && savedAuthCaseId !== 'null' && savedAuthCaseId !== 'undefined') {
    state.authenticatedAgencyCaseId = savedAuthCaseId;
  } else {
    state.authenticatedAgencyCaseId = null;
  }

  const savedSimTime = localStorage.getItem('gpeg_sim_time');
  if (savedSimTime) {
    state.simulatedTime = savedSimTime;
  } else {
    state.simulatedTime = "2026-05-18T14:34:38Z";
  }

  // Restore or seed dynamic UI/UX Survey Feedback submissions
  const savedFeedbacks = localStorage.getItem('gpeg_survey_feedbacks');
  if (savedFeedbacks) {
    state.surveyFeedbacks = JSON.parse(savedFeedbacks);
  } else {
    state.surveyFeedbacks = [
      { id: 's1', rating: 5, navLayout: 'excellent', alarmFatigue: 'yes', comments: 'The vertical Left Navigation rail layout is perfect! collapsible states save so much space.', timestamp: '2026-05-19T04:00:00Z' }
    ];
    localStorage.setItem('gpeg_survey_feedbacks', JSON.stringify(state.surveyFeedbacks));
  }

  // Seeding or restoring Employee attendance roster
  const savedRoster = localStorage.getItem('gpeg_team_roster');
  if (savedRoster) {
    state.teamRoster = JSON.parse(savedRoster);
  } else {
    state.teamRoster = [...initialTeamRoster];
    localStorage.setItem('gpeg_team_roster', JSON.stringify(state.teamRoster));
  }

  // Seeding or restoring Weekly Utilization Hours logs
  const savedUtil = localStorage.getItem('gpeg_weekly_utilization');
  if (savedUtil) {
    state.weeklyUtilization = JSON.parse(savedUtil);
  } else {
    state.weeklyUtilization = [...initialWeeklyUtilization];
    localStorage.setItem('gpeg_weekly_utilization', JSON.stringify(state.weeklyUtilization));
  }

  // Seeding or restoring Granular Task Effort Logs
  const savedEffort = localStorage.getItem('gpeg_effort_logs');
  if (savedEffort) {
    state.effortLogs = JSON.parse(savedEffort);
  } else {
    state.effortLogs = [...initialEffortLogs];
    localStorage.setItem('gpeg_effort_logs', JSON.stringify(state.effortLogs));
  }

  // Seeding dynamic MoS consolidated catalogs E2E
  state.mosCamps = [...mosCamps];
  state.mosTopics = [...mosTopics];

  const savedTickets = localStorage.getItem('gpeg_buganizer_tickets');
  if (savedTickets) {
    state.buganizerTickets = JSON.parse(savedTickets);
  } else {
    state.buganizerTickets = [
      { id: '38291002', caseId: '4-9901000031200', title: 'S2S API Custom Variables Mapping', status: 'Open', component: 'gpeg-camps-cm360', desc: 'Live escalated: Can custom Floodlights be passed via S2S API without a web tag?', answer: '' }
    ];
    localStorage.setItem('gpeg_buganizer_tickets', JSON.stringify(state.buganizerTickets));
  }

  // Run Automated Data Retention Cron on startup
  if (typeof window !== 'undefined') {
    if (window.runRetentionCron) window.runRetentionCron();
    if (window.decoupleSpannerDdlToAdmin) window.decoupleSpannerDdlToAdmin();
    if (window.populateMatrixFiltersFromCatalog) window.populateMatrixFiltersFromCatalog();
    
    if (window.toggleSimulatorMode) {
      window.toggleSimulatorMode(state.simulatorModeActive);
    }
  }
}

export function saveState() {
  localStorage.setItem('gpeg_camps', JSON.stringify(state.camps));
  localStorage.setItem('gpeg_outbox', JSON.stringify(state.outbox));
  localStorage.setItem('gpeg_logs', JSON.stringify(state.logs));
  localStorage.setItem('gpeg_tasks', JSON.stringify(state.tasks));
  localStorage.setItem('gpeg_chats', JSON.stringify(state.chats));
  localStorage.setItem('gpeg_buganizer_tickets', JSON.stringify(state.buganizerTickets));
  localStorage.setItem('gpeg_team_roster', JSON.stringify(state.teamRoster));
  localStorage.setItem('gpeg_weekly_utilization', JSON.stringify(state.weeklyUtilization));
  localStorage.setItem('gpeg_effort_logs', JSON.stringify(state.effortLogs));
  localStorage.setItem('gpeg_role', state.activeRole);
  localStorage.setItem('gpeg_auth_case_id', state.authenticatedAgencyCaseId || "");
  localStorage.setItem('gpeg_sim_time', state.simulatedTime || "");

  // Push GPEG camps array to Python server database
  if (typeof window !== 'undefined' && !window.isTestRunnerEnv) {
    if (typeof window.pushStateToServer === 'function') {
      window.pushStateToServer();
    }
  }
}

// Export state hooks to window to ensure absolute backward compatibility
if (typeof window !== 'undefined') {
  window.initState = initState;
  window.saveState = saveState;
}
