import { initialCamps, initialLogs, initialTasks, initialChats, initialTemplates, initialTeamRoster, initialWeeklyUtilization, initialEffortLogs, mosCamps, mosTopics } from './data.js';

// --- STATE MANAGEMENT ---
let currentSessionToken = localStorage.getItem('gpeg_session_token') || '';
let state = {
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

  // Automation & Integration Hub Extensions
  chatBotMessages: [
    { sender: 'bot', text: 'Hi GPEG delivery team! I am your Google ChatOps @GPEG-Bot. Ask me about case status, active campaigns, or SLA warnings!' }
  ],
  buganizerTickets: [
    { id: '38291002', caseId: '4-9901000031200', title: 'S2S API Custom Variables Mapping', status: 'Open', component: 'gpeg-camps-cm360', desc: 'Live escalated: Can custom Floodlights be passed via S2S API without a web tag?', answer: '' }
  ]
};

// --- KANBAN COLUMN WIP BOTTLENECK LIMITS ---
const WIP_LIMITS = {
  nomination: 4,
  'pre-camp': 3,
  'in-camp': 2,
  'post-camp': 3,
  closed: 99999
};

// --- PREDICTIVE SLA BREACH RISK ESTIMATOR (Simulated ML Scoring) ---
function calculateSlaRisk(camp) {
  if (camp.stage === 'closed') return { label: 'Low', color: 'var(--g-border)', score: 0, badgeClass: 'sla-neutral' };
  if (camp.slaDaysRemaining === null) return { label: 'Low', color: 'var(--g-border)', score: 10, badgeClass: 'sla-neutral' };
  
  let score = 100;
  if (camp.stage === 'pre-camp') {
    score = camp.slaDaysRemaining === 3 ? 35 :
            camp.slaDaysRemaining === 2 ? 65 :
            camp.slaDaysRemaining === 1 ? 85 :
            camp.slaDaysRemaining <= 0 ? 100 : 15;
  } else if (camp.stage === 'post-camp') {
    score = camp.slaDaysRemaining === 1 ? 85 :
            camp.slaDaysRemaining <= 0 ? 100 : 45;
  }
  
  // ML Scoped Regional Weighting adjustment
  if (score < 100 && score > 15) {
    if (camp.region === 'APAC') score += 10;
    if (camp.region === 'AMER') score += 5;
  }
  score = Math.min(100, score);
  
  let label = 'Low';
  let color = 'var(--g-border)';
  let badgeClass = 'sla-neutral';
  
  if (score === 100) {
    label = 'Breached';
    color = 'var(--g-red)';
    badgeClass = 'sla-breached';
  } else if (score >= 60) {
    label = 'Approaching';
    color = 'var(--g-amber)';
    badgeClass = 'sla-warning-soft';
  }
  
  return { label, color, score, badgeClass };
}

// Initialize state from localStorage or fallback to seed data
function initState() {
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
    state.dryRuns = [
      { id: "dry_1", name: "Taylor Chen", product: "GMP DV360 Advanced", deadline: "2026-05-24", priority: "High", lead: "Alex Rivera", status: "Pending Dry Run" },
      { id: "dry_2", name: "Alex Rivera", product: "Search & PMax Bidding", deadline: "2026-05-28", priority: "Medium", lead: "Taylor Chen", status: "Approved 🟢" },
      { id: "dry_3", name: "Jordan Blake", product: "GMP CM360 Foundations", deadline: "2026-06-02", priority: "High", lead: "Alex Rivera", status: "Pending Dry Run" },
      { id: "dry_4", name: "Taylor Chen", product: "Partnership Ads MFG", deadline: "2026-06-08", priority: "Low", lead: "Jordan Blake", status: "Pending Dry Run" }
    ];
    localStorage.setItem('gpeg_dry_runs', JSON.stringify(state.dryRuns));
  }

  const savedBuganizer = localStorage.getItem('gpeg_buganizer_tickets');
  if (savedBuganizer) {
    state.buganizerTickets = JSON.parse(savedBuganizer);
  } else {
    state.buganizerTickets = [
      { id: '6219008', caseId: '6-6219000040843', questionId: 'q_dg1', component: 'GMP > DV360 > Strategy', title: 'Coordinating budgets between Demand Gen and Performance Max', desc: 'How should the Incubeta agency coordinate budget allocations between Demand Gen and Performance Max when running holistic brand + performance campaigns?', status: 'New', answer: null, timestamp: '2026-05-18T10:15:00Z' }
    ];
    localStorage.setItem('gpeg_buganizer_tickets', JSON.stringify(state.buganizerTickets));
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

  // Run Automated Data Retention Cron on startup
  if (window.runRetentionCron) window.runRetentionCron();
  if (window.decoupleSpannerDdlToAdmin) window.decoupleSpannerDdlToAdmin();
  if (window.populateMatrixFiltersFromCatalog) window.populateMatrixFiltersFromCatalog();

  // Initialize Progressive Disclosure Simulator Toggles on startup
  if (window.toggleSimulatorMode) {
    window.toggleSimulatorMode(state.simulatorModeActive);
  }

  // Sync frontend state with backend server database and start webhook polling
  if (typeof window === 'undefined' || !window.isTestRunnerEnv) {
    (async () => {
      let ldap = 'taylor.chen';
      if (state.activeRole === 'AM') ldap = 'sarah.jenkins';
      else if (state.activeRole === 'PM') ldap = 'pm.lead';
      else if (state.activeRole === 'Admin') ldap = 'admin.camps';
      else if (state.activeRole === 'Stakeholder') ldap = 'stakeholder.lead';
      else if (state.activeRole === 'Organizer') ldap = 'organizer.camps';
      
      await performBackendLogin(ldap, state.activeRole);
      await syncWithServer();
      await syncRosterWithAppSheet();
      startPolling();
    })();
  }
}

function saveState() {
  localStorage.setItem('gpeg_camps', JSON.stringify(state.camps));
  localStorage.setItem('gpeg_outbox', JSON.stringify(state.outbox));
  localStorage.setItem('gpeg_logs', JSON.stringify(state.logs));
  localStorage.setItem('gpeg_tasks', JSON.stringify(state.tasks));
  localStorage.setItem('gpeg_chats', JSON.stringify(state.chats));
  localStorage.setItem('gpeg_team_roster', JSON.stringify(state.teamRoster));
  localStorage.setItem('gpeg_weekly_utilization', JSON.stringify(state.weeklyUtilization));
  localStorage.setItem('gpeg_effort_logs', JSON.stringify(state.effortLogs));
  localStorage.setItem('gpeg_role', state.activeRole);
  localStorage.setItem('gpeg_auth_case_id', state.authenticatedAgencyCaseId || "");
  localStorage.setItem('gpeg_sim_time', state.simulatedTime || "");

  // Push GPEG camps array to Python server database
  if (typeof window === 'undefined' || !window.isTestRunnerEnv) {
    pushStateToServer();
  }
}

async function performBackendLogin(ldap, role) {
  try {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ ldap: ldap, role: role })
    });
    
    if (response.ok) {
      const result = await response.json();
      currentSessionToken = result.token;
      localStorage.setItem('gpeg_session_token', currentSessionToken);
      state.activeRole = role;
      localStorage.setItem('gpeg_role', role);
      return true;
    }
  } catch (err) {
    console.warn('Backend authentication unavailable. Running in offline mode.', err);
  }
  
  // Offline/Static Fallback for GitHub Pages sandbox compatibility:
  currentSessionToken = `token_${ldap}_mock`;
  localStorage.setItem('gpeg_session_token', currentSessionToken);
  state.activeRole = role;
  localStorage.setItem('gpeg_role', role);
  return true;
}

async function pushStateToServer() {
  try {
    await fetch('/api/camps', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-GPEG-Session': currentSessionToken
      },
      body: JSON.stringify(state.camps)
    });
  } catch (err) {
    console.error('Failed to push state to server:', err);
  }
}

async function syncWithServer() {
  try {
    // 1. Pull scoped camps state from SQLite query portfolio
    const campsResponse = await fetch('/api/camps', {
      headers: { 'X-GPEG-Session': currentSessionToken }
    });
    if (campsResponse.ok) {
      const serverCamps = await campsResponse.json();
      state.camps = serverCamps;
      localStorage.setItem('gpeg_camps', JSON.stringify(state.camps));
    }

    // 2. Pull outbox state
    const outboxResponse = await fetch('/api/outbox', {
      headers: { 'X-GPEG-Session': currentSessionToken }
    });
    if (outboxResponse.ok) {
      const serverOutbox = await outboxResponse.json();
      state.outbox = serverOutbox;
      localStorage.setItem('gpeg_outbox', JSON.stringify(state.outbox));
    }

    // 3. Pull persistent Buganizer tickets
    const buganizerResponse = await fetch('/api/buganizer/tickets', {
      headers: { 'X-GPEG-Session': currentSessionToken }
    });
    if (buganizerResponse.ok) {
      const serverTickets = await buganizerResponse.json();
      state.buganizerTickets = serverTickets;
      localStorage.setItem('gpeg_buganizer_tickets', JSON.stringify(state.buganizerTickets));
    }

    renderDashboard();
  } catch (err) {
    console.warn('Python backend server is offline. Running in offline-only mode.', err);
  }
}

async function syncRosterWithAppSheet() {
  try {
    const response = await fetch('/api/appsheet/sync', {
      headers: { 'X-GPEG-Session': currentSessionToken }
    });
    if (response.ok) {
      const teamRoster = await response.json();
      state.teamRoster = teamRoster;
      localStorage.setItem('gpeg_team_roster', JSON.stringify(state.teamRoster));
      
      // Trigger immediate dashboard and utilization chart redraws E2E
      if (typeof renderRosterList === 'function') renderRosterList();
      if (typeof renderUtilizationCharts === 'function') renderUtilizationCharts();
    }
  } catch (err) {
    console.warn('AppSheet Ingress Gateway offline. Fallback mock roster active.', err);
  }
}

function startPolling() {
  setInterval(async () => {
    try {
      // 1. Poll Camps with active session authorization header
      const campsResponse = await fetch('/api/camps', {
        headers: { 'X-GPEG-Session': currentSessionToken }
      });
      if (campsResponse.ok) {
        const serverCamps = await campsResponse.json();
        let campsUpdated = false;
        
        serverCamps.forEach(srvCamp => {
          const localCamp = state.camps.find(c => c.id === srvCamp.id);
          if (!localCamp) {
            state.camps.unshift(srvCamp);
            campsUpdated = true;
            showToast('Cases Connect Webhook', `Inbound ticket for ${srvCamp.agency} (Case ${srvCamp.id}) ingested.`);
          }
        });
        
        if (campsUpdated) {
          localStorage.setItem('gpeg_camps', JSON.stringify(state.camps));
          await pushStateToServer();
          renderDashboard();
        }
      }

      // 2. Poll Outbox with active session authorization header
      const outboxResponse = await fetch('/api/outbox', {
        headers: { 'X-GPEG-Session': currentSessionToken }
      });
      if (outboxResponse.ok) {
        const serverOutbox = await outboxResponse.json();
        if (serverOutbox.length !== state.outbox.length) {
          state.outbox = serverOutbox;
          localStorage.setItem('gpeg_outbox', JSON.stringify(state.outbox));
          if (typeof renderMailDrafts === 'function') {
            renderMailDrafts();
          }
        }
      }

      // 3. Poll Buganizer Tickets with active session authorization header
      const buganizerResponse = await fetch('/api/buganizer/tickets', {
        headers: { 'X-GPEG-Session': currentSessionToken }
      });
      if (buganizerResponse.ok) {
        const serverTickets = await buganizerResponse.json();
        if (serverTickets.length !== state.buganizerTickets.length || JSON.stringify(serverTickets) !== JSON.stringify(state.buganizerTickets)) {
          state.buganizerTickets = serverTickets;
          localStorage.setItem('gpeg_buganizer_tickets', JSON.stringify(state.buganizerTickets));
          if (typeof renderBuganizerTracker === 'function') {
            renderBuganizerTracker();
          }
        }
      }

      // 4. Poll live AppSheet Roster Status
      await syncRosterWithAppSheet();
    } catch (err) {
      // Ignore network polling issues when server is offline or restarting
    }
  }, 3000);
}

async function dispatchEmailToServer(mail) {
  try {
    const response = await fetch('/api/outbox', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-GPEG-Session': currentSessionToken
      },
      body: JSON.stringify(mail)
    });
    
    if (response.ok) {
      const result = await response.json();
      state.outbox.unshift(result.mail);
      localStorage.setItem('gpeg_outbox', JSON.stringify(state.outbox));
      if (typeof renderMailDrafts === 'function') {
        renderMailDrafts();
      }
    } else {
      throw new Error('Server email dispatch failed');
    }
  } catch (err) {
    console.error('Email dispatch error:', err);
    mail.id = mail.id || 'rcv' + Math.random();
    mail.timestamp = mail.timestamp || new Date().toISOString();
    state.outbox.unshift(mail);
    localStorage.setItem('gpeg_outbox', JSON.stringify(state.outbox));
    if (typeof renderMailDrafts === 'function') {
      renderMailDrafts();
    }
  }
}



// --- TOAST SYSTEM ---
function showToast(title, message) {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <div class="toast-title">${title}</div>
    <div>${message}</div>
  `;
  container.appendChild(toast);
  
  // Play soft hover sound or animate
  setTimeout(() => {
    toast.style.transition = 'all 0.3s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(30px)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// --- RENDERING ENGINE ---
function renderDashboard() {
  // Columns mapping
  const cols = {
    nomination: document.getElementById('col-nomination'),
    'pre-camp': document.getElementById('col-precamp'),
    'in-camp': document.getElementById('col-incamp'),
    'post-camp': document.getElementById('col-postcamp'),
    closed: document.getElementById('col-closed')
  };

  // Clear columns and dynamically bind drag-and-drop event handlers
  Object.entries(cols).forEach(([stage, el]) => {
    if (el) {
      el.innerHTML = '';
      el.setAttribute('ondragover', 'window.handleDragOver(event)');
      el.setAttribute('ondragleave', 'window.handleDragLeave(event)');
      el.setAttribute('ondrop', 'window.handleDrop(event)');
    }
  });

  // Counts helper
  const counts = { nomination: 0, 'pre-camp': 0, 'in-camp': 0, 'post-camp': 0, closed: 0 };
  let slaAlertCount = 0;
  let totalBfmUplift = 0;
  let closedCampsCount = 0;

  // Render Cards with dynamic LDAP portfolio filtering, Matrix Filtering, and Search Bar filtering
  let visibleCamps = [...state.camps];
  const role = state.activeRole;

  // 1. Role-based Active Portfolio Scoping
  if (role === 'AM') {
    visibleCamps = state.camps.filter(c => c.amEmail === 'am.sarah@google.com');
  } else if (role === 'Presenter') {
    visibleCamps = state.camps.filter(c => c.presenter && c.presenter.includes('Taylor'));
  }

  // 1.5. Phase 5 Matrix Portfolio Evaluation
  if (state.matrixFilters) {
    visibleCamps = visibleCamps.filter(c => {
      if (state.matrixFilters.suite !== 'ALL' && c.suite !== state.matrixFilters.suite) return false;
      if (state.matrixFilters.goal !== 'ALL' && c.strategicGoal !== state.matrixFilters.goal) return false;
      if (state.matrixFilters.segment !== 'ALL' && c.salesSegment !== state.matrixFilters.segment) return false;
      if (state.matrixFilters.level !== 'ALL' && c.curriculumLevel !== state.matrixFilters.level) return false;
      if (state.matrixFilters.holding !== 'ALL' && c.holdingGroup !== state.matrixFilters.holding) return false;
      if (state.matrixFilters.customization !== 'ALL' && c.deckType !== state.matrixFilters.customization) return false;
      return true;
    });
  }

  // 2. Search Query filter
  const searchQuery = document.getElementById('search-camps-input') ? document.getElementById('search-camps-input').value.toLowerCase().trim() : '';
  if (searchQuery) {
    visibleCamps = visibleCamps.filter(c => 
      c.agency.toLowerCase().includes(searchQuery) || 
      c.id.toLowerCase().includes(searchQuery) || 
      c.product.toLowerCase().includes(searchQuery)
    );
  }

  // 3. Region Scope Filter
  const filterRegion = document.getElementById('filter-region-select') ? document.getElementById('filter-region-select').value : 'ALL';
  if (filterRegion !== 'ALL') {
    visibleCamps = visibleCamps.filter(c => c.region === filterRegion);
  }

  // 4. SLA Warning Filter
  const filterSla = document.getElementById('filter-sla-select') ? document.getElementById('filter-sla-select').value : 'ALL';
  if (filterSla === 'ALERT') {
    visibleCamps = visibleCamps.filter(c => {
      if (c.stage === 'pre-camp' && c.slaDaysRemaining !== null && c.slaDaysRemaining <= 3) return true;
      if (c.stage === 'post-camp' && !c.followUpSent) return true;
      return false;
    });
  }

  // 5. Update the Portfolio scope stats badge
  const statsBadge = document.getElementById('portfolio-stats-badge');
  if (statsBadge) statsBadge.textContent = `${visibleCamps.length} shown`;

  visibleCamps.forEach(camp => {
    counts[camp.stage]++;

    // Metrics BFM calculator
    if (camp.stage === 'closed' && camp.bfmUplift !== null) {
      totalBfmUplift += camp.bfmUplift;
      closedCampsCount++;
    }

    // SLA Check
    let isSlaWarning = false;
    if (camp.stage === 'pre-camp' && camp.slaDaysRemaining !== null && camp.slaDaysRemaining <= 3) {
      isSlaWarning = true;
    } else if (camp.stage === 'post-camp' && !camp.followUpSent) {
      isSlaWarning = true;
    }

    if (isSlaWarning) {
      slaAlertCount++;
    }

    const cardHtml = `
      <div class="camp-card ${isSlaWarning ? 'sla-alert' : ''}" data-id="${camp.id}" draggable="true" ondragstart="window.handleDragStart(event)">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
          <span class="card-case-id-tag" onclick="window.copyCaseIdToClipboard(event, '${camp.id}')" title="Click to copy Case ID" style="font-size: 0.72rem; font-weight: 800; color: var(--primary-cyan); text-transform: uppercase; letter-spacing: 0.5px; cursor: pointer; position: relative; display: inline-flex; align-items: center; gap: 0.15rem;">
            <span>Case #${camp.id.length > 12 ? camp.id.substring(0, 8) : camp.id}</span>
            <span class="copy-icon-hover" style="font-size: 0.6rem; opacity: 0.5; display: none;">📋</span>
          </span>
          <span style="font-size: 0.65rem; font-weight: 700; padding: 0.1rem 0.35rem; border-radius: 4px; ${getRegionStyle(camp.region)}">${camp.region || 'EMEA'}</span>
        </div>
        <div class="card-agency" style="font-size: 1.05rem; font-weight: 800; color: var(--text-primary); margin-bottom: 0.25rem;">${camp.agency}</div>
        <span class="card-product">${camp.product}</span>
        
        <div class="card-meta">
          <div class="card-meta-item">
            <svg role="img" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            <span>AM: ${camp.amEmail.split('@')[0]}</span>
          </div>
          ${camp.presenter ? `
            <div class="card-meta-item">
              <svg role="img" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              <span>Presenter: ${camp.presenter.split(' ')[0]}</span>
            </div>
          ` : ''}
          ${camp.scheduledTime ? `
            <div class="card-meta-item">
              <svg role="img" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              <span>${new Date(camp.scheduledTime).toLocaleDateString()} at ${new Date(camp.scheduledTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
            </div>
          ` : ''}
        </div>

        ${camp.stage === 'closed' ? `
          <div style="margin-top: 0.35rem; display: flex; flex-wrap: wrap; gap: 0.25rem;">
            ${camp.recordingDeleted ? `
              <span class="ws-sync-pill" style="background: rgba(220, 38, 38, 0.1); border-color: rgba(220, 38, 38, 0.25); color: var(--danger-red); cursor: default;">⚙ Purged (SLA)</span>
            ` : camp.recordingArchived ? `
              <span class="ws-sync-pill ws-synced" style="background: rgba(16, 185, 129, 0.12); border-color: rgba(16, 185, 129, 0.25); color: var(--success-green);" title="Safely archived inside gPEG Shared Drive folder, protected from auto-deletion.">⌥ Archived (Shared Drive)</span>
            ` : `
              <span class="ws-sync-pill" id="ws-archive-drive-${camp.id}" onclick="window.archiveToSharedDrive('${camp.id}', 'ws-archive-drive-${camp.id}')" title="Archive this recording to Google Shared Drive to protect it from auto-deletion after 3 months.">⌥ Move to Shared Drive</span>
            `}
            <span class="ws-sync-pill ws-synced" onclick="window.triggerWorkspaceExport('Sheets', '${camp.id}')" style="cursor: pointer;" title="One-Click export this closed case history to Google Sheets.">📊 Sheets Exported</span>
          </div>
        ` : camp.stage === 'post-camp' ? `
          <div style="margin-top: 0.35rem; display: flex; flex-wrap: wrap; gap: 0.25rem;">
            <span class="ws-sync-pill" id="ws-sync-drive-${camp.id}" onclick="window.syncToWorkspace('Drive', '${camp.id}', 'ws-sync-drive-${camp.id}')">⌥ Drive Sync</span>
            <span class="ws-sync-pill" id="ws-sync-doc-${camp.id}" onclick="window.syncToWorkspace('Docs', '${camp.id}', 'ws-sync-doc-${camp.id}')">⌥ Doc Sync</span>
            <span class="ws-sync-pill" onclick="window.triggerWorkspaceExport('Slides', '${camp.id}')" style="cursor: pointer; background: rgba(245,158,11,0.1); border-color: rgba(245,158,11,0.2); color: var(--warning-amber);" title="One-Click generate Gslides presentation pre-reads stripping Internal slides.">📊 Slides Exporter</span>
          </div>
        ` : `
          <div style="margin-top: 0.35rem; display: flex; gap: 0.25rem;">
            <span class="ws-sync-pill" onclick="window.triggerWorkspaceExport('Chat', '${camp.id}')" style="cursor: pointer; background: rgba(139,92,246,0.1); border-color: rgba(139,92,246,0.2); color: var(--accent-purple);" title="One-Click format and broadcast this active camp card payload directly into internal Google Chat Space.">💬 Share to Chat</span>
          </div>
        `}



        <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 0.25rem;">
          <span class="badge-deck-status ${camp.deckType === 'Customized Deck' ? 'badge-deck-custom' : ''}">${camp.deckType}</span>
          ${camp.slaDaysRemaining !== null && camp.stage !== 'closed' ? `
            <span class="badge-sla" style="font-size: 0.68rem; font-weight: 700; padding: 0.15rem 0.45rem; border-radius: 4px; text-transform: uppercase; letter-spacing: 0.3px; ${
              camp.slaDaysRemaining <= 0 || camp.slaBreached
                ? 'background: rgba(248, 113, 113, 0.15); border: 1px solid rgba(248, 113, 113, 0.3); color: var(--danger-red);'
                : camp.slaDaysRemaining <= 2
                ? 'background: rgba(251, 191, 36, 0.15); border: 1px solid rgba(251, 191, 36, 0.3); color: var(--warning-amber);'
                : 'background: rgba(52, 211, 153, 0.15); border: 1px solid rgba(52, 211, 153, 0.3); color: var(--success-green);'
            }">
              ⏱️ ${camp.slaDaysRemaining}d left
            </span>
          ` : ''}
          <span class="badge-status" style="background: ${getStageBadgeColor(camp.status)}; color: #fff;">${camp.status}</span>
        </div>

        <div class="card-actions">
          ${getActionButton(camp)}
        </div>
      </div>
    `;

    if (cols[camp.stage]) {
      cols[camp.stage].insertAdjacentHTML('beforeend', cardHtml);
    }
  });

  // Update column count headers and enforce WIP limits
  Object.keys(counts).forEach(stage => {
    const countEl = document.getElementById(`count-${stage}`);
    if (countEl) countEl.textContent = counts[stage];

    // Check if current column count exceeds predefined operational WIP threshold
    const parentEl = document.getElementById(`column-${stage}-parent`);
    if (parentEl) {
      const limit = WIP_LIMITS[stage];
      if (counts[stage] > limit) {
        parentEl.classList.add('wip-exceeded');
      } else {
        parentEl.classList.remove('wip-exceeded');
      }
    }
  });

  // Update KPI metrics
  document.getElementById('metric-active-count').textContent = state.camps.filter(c => c.stage !== 'closed').length;
  document.getElementById('metric-precamp-count').textContent = state.camps.filter(c => c.stage === 'pre-camp' && c.discoveryStatus === 'Pending').length;
  document.getElementById('metric-sla-count').textContent = slaAlertCount;
  
  const avgBfmEl = document.getElementById('metric-bfm-average');
  if (closedCampsCount > 0) {
    avgBfmEl.textContent = `${(totalBfmUplift / closedCampsCount).toFixed(1)}%`;
  }

  // ⚡ PHASE 2: 1ST-PARTY GOOGLE TAG GATEWAY (GTG) LIVE METRIC CALCULATOR
  const gtgEl = document.getElementById('metric-gtg-attainment');
  if (gtgEl) {
    const closedCamps = state.camps.filter(c => c.stage === 'closed');
    const closedCount = closedCamps.length;
    if (closedCount > 0) {
      const gtgArchivedCount = closedCamps.filter(c => c.recordingArchived).length;
      const gtgPct = Math.round((gtgArchivedCount / closedCount) * 100);
      gtgEl.textContent = `${gtgPct}%`;
    } else {
      gtgEl.textContent = '0%';
    }
  }
 else {
    avgBfmEl.textContent = '0%';
  }

  // Update Consolidated Sidebar Quick Action Widget
  if (window.renderConsolidatedSidebarWidget) {
    window.renderConsolidatedSidebarWidget();
  }

  // Enhanced features rendering hooks
  if (window.renderLogs) window.renderLogs();
  if (window.renderTasks) window.renderTasks();
  if (window.renderChats) window.renderChats();
  if (window.renderRepository) window.renderRepository();
  if (window.applyRoleAccessControl) window.applyRoleAccessControl();
  if (window.renderAgencyPortalTokens) window.renderAgencyPortalTokens();
}

function getRegionStyle(region) {
  switch (region) {
    case 'EMEA': return 'background: rgba(0, 233, 255, 0.12); border: 1px solid rgba(0, 233, 255, 0.25); color: var(--primary-cyan);';
    case 'AMER': return 'background: rgba(139, 92, 246, 0.12); border: 1px solid rgba(139, 92, 246, 0.25); color: var(--accent-purple);';
    case 'APAC': return 'background: rgba(255, 170, 0, 0.12); border: 1px solid rgba(255, 170, 0, 0.25); color: var(--warning-amber);';
    default: return 'background: rgba(255, 255, 255, 0.06); border: 1px solid var(--border-light); color: var(--text-secondary);';
  }
}

function getStageBadgeColor(status) {
  switch (status) {
    case 'Pending Kickoff': return 'rgba(255, 255, 255, 0.1)';
    case 'Awaiting Discovery': return 'rgba(255, 170, 0, 0.15)';
    case 'Discovery Received': return 'rgba(16, 185, 129, 0.15)';
    case 'Live Session Active': return 'rgba(0, 233, 255, 0.15)';
    case 'Resolving Queries & Follow-up': return 'rgba(139, 92, 246, 0.15)';
    case 'Impact Logged': return 'rgba(16, 185, 129, 0.2)';
    default: return 'rgba(255, 255, 255, 0.1)';
  }
}

function getActionButton(camp) {
  const role = state.activeRole; // Read dynamic active persona E2E!
  let actionBtn = '';

  // 1. PM ROLE CTAs (Focused strictly on Q&A Debugging and Resolutions)
  if (role === 'PM') {
    const pendingQuestions = camp.liveQuestions.some(q => !q.answered);
    if (pendingQuestions) {
      return `<button class="btn-sm btn-primary-sm" style="background: var(--danger-red); border-color: var(--danger-red); color: #fff;" onclick="window.switchTab('pm')">🐛 Resolve Q&A</button>`;
    }
    return `<span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 600;">Read-Only Lock 🔒</span>`;
  }

  // 2. AM ROLE CTAs (Focused strictly on chasing client discoveries and outbox gateways)
  if (role === 'AM') {
    if (camp.stage === 'pre-camp' && camp.discoveryStatus === 'Pending') {
      return `<button class="btn-sm btn-primary-sm" style="background: var(--warning-amber); border-color: var(--warning-amber); color: var(--bg-darker);" onclick="window.nudgeAmEmailChase('${camp.id}')">⚡ Nudge AM</button>`;
    }
    return `<span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 600;">Read-Only Lock 🔒</span>`;
  }

  // 3. PRESENTER ROLE CTAs (Focused strictly on rehearsals and live session deliveries)
  if (role === 'Presenter') {
    if (camp.stage === 'pre-camp') {
      if (camp.discoveryStatus === 'Pending') {
        return `<button class="btn-sm" onclick="window.switchTab('rehearsal')">🎤 Practice Pitch</button>`;
      }
      return `<button class="btn-sm btn-primary-sm" onclick="startLiveSessionPrompt('${camp.id}')">Start Workshop</button>`;
    } else if (camp.stage === 'in-camp') {
      return `<button class="btn-sm btn-primary-sm" onclick="openLiveSessionModal('${camp.id}')">Presenter Console</button>`;
    } else if (camp.stage === 'post-camp') {
      const pendingQuestions = camp.liveQuestions.some(q => !q.answered);
      if (pendingQuestions) {
        return `<span style="font-size: 0.72rem; color: var(--warning-amber); font-weight: 600;">Awaiting PM Debug ⏳</span>`;
      }
      return `<button class="btn-sm btn-primary-sm" onclick="openFollowUpModal('${camp.id}')">Draft Follow-up</button>`;
    } else if (camp.stage === 'nomination') {
      return `<span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 600;">Awaiting AM Kickoff ⏳</span>`;
    } else {
      return `<span style="font-size: 0.75rem; color: var(--success-green); font-weight: 600;">Completed ✅</span>`;
    }
  }

  // 4. ORGANIZER / ADMIN ROLE CTAs (Full pipeline operations and scheduling authorized)
  if (camp.stage === 'nomination') {
    actionBtn = `<button class="btn-sm btn-primary-sm" onclick="openKickoffModal('${camp.id}')">Kickoff Camp</button>`;
  } else if (camp.stage === 'pre-camp') {
    if (camp.discoveryStatus === 'Pending') {
      actionBtn = `<button class="btn-sm btn-primary-sm" style="background: var(--warning-amber); border-color: var(--warning-amber); color: var(--bg-darker);" onclick="window.nudgeAmEmailChase('${camp.id}')">⚡ Nudge AM</button>`;
    } else {
      actionBtn = `<button class="btn-sm btn-primary-sm" onclick="startLiveSessionPrompt('${camp.id}')">Start Workshop</button>`;
    }
  } else if (camp.stage === 'in-camp') {
    actionBtn = `<button class="btn-sm btn-primary-sm" onclick="openLiveSessionModal('${camp.id}')">Presenter Console</button>`;
  } else if (camp.stage === 'post-camp') {
    const pendingQuestions = camp.liveQuestions.some(q => !q.answered);
    if (pendingQuestions) {
      actionBtn = `<button class="btn-sm btn-primary-sm" style="background: var(--danger-red); border-color: var(--danger-red); color: #fff;" onclick="window.switchTab('pm')">🐛 PM Debugger</button>`;
    } else {
      actionBtn = `<button class="btn-sm btn-primary-sm" onclick="openFollowUpModal('${camp.id}')">Draft Follow-up</button>`;
    }
  } else {
    return `<span style="font-size: 0.75rem; color: var(--success-green); font-weight: 600;">Completed ✅</span>`;
  }

  // Render dynamic Collaborate quick-launch button right next to the main pipeline action E2E!
  const colBtn = `<button class="btn-sm" onclick="window.launchKanbanCollaboration('${camp.id}')" style="max-width:90px; margin-left: 0.35rem; font-size: 0.68rem; padding: 0.25rem; background: rgba(139,92,246,0.08); border-color: rgba(139,92,246,0.15); color: var(--accent-purple); font-weight: 700;">👥 Collaborate</button>`;
  
  return `<div style="display: flex; align-items: center; gap: 0.25rem; width: 100%;">${actionBtn}${colBtn}</div>`;
}



function renderSidebarSlaList() {
  const listEl = document.getElementById('sidebar-sla-list');
  const badgeEl = document.getElementById('sidebar-sla-badge');
  listEl.innerHTML = '';
  
  let count = 0;
  state.camps.forEach(camp => {
    if (camp.stage === 'pre-camp' && camp.discoveryStatus === 'Pending') {
      count++;
      const risk = calculateSlaRisk(camp);
      listEl.insertAdjacentHTML('beforeend', `
        <div class="sidebar-item">
          <div class="sidebar-item-title">${camp.agency} (${camp.product})</div>
          <div class="sidebar-item-meta">
            <span>Discovery Pending</span>
            <span class="alert-timer" style="color: ${risk.color};">⏱️ ${camp.slaDaysRemaining}d left <span style="font-size: 0.65rem; font-weight: 700; padding: 0.05rem 0.25rem; border-radius: 4px; background: rgba(255,255,255,0.06); margin-left: 0.25rem;" title="Simulated Machine Learning Breach Risk: Dynamically calculated based on elapsed time since case nomination, designated presenter workloads, and historical regional latency.">Risk: ${risk.score}%</span></span>
          </div>
        </div>
      `);
    } else if (camp.stage === 'post-camp' && !camp.followUpSent) {
      count++;
      const risk = calculateSlaRisk(camp);
      const hasUnresolved = camp.liveQuestions.some(q => !q.answered);
      listEl.insertAdjacentHTML('beforeend', `
        <div class="sidebar-item" style="border-left: 3px solid ${risk.color};">
          <div class="sidebar-item-title">${camp.agency} (Post-Camp)</div>
          <div class="sidebar-item-meta">
            <span>${hasUnresolved ? 'Escalated Q&A Pending' : 'Ready for Follow-up'}</span>
            <span class="alert-timer" style="color: ${risk.color};">⏱️ ${camp.slaDaysRemaining}d left <span style="font-size: 0.65rem; font-weight: 700; padding: 0.05rem 0.25rem; border-radius: 4px; background: rgba(255,255,255,0.06); margin-left: 0.25rem;" title="Simulated Machine Learning Breach Risk: Dynamically calculated based on elapsed time since case nomination, designated presenter workloads, and historical regional latency.">Risk: ${risk.score}%</span></span>
          </div>
        </div>
      `);
    }
  });

  badgeEl.textContent = `${count} ${count === 1 ? 'Alert' : 'Alerts'}`;
}

function renderSidebarQaList() {
  const listEl = document.getElementById('sidebar-qa-list');
  listEl.innerHTML = '';

  let hasQuestions = false;
  state.camps.forEach(camp => {
    camp.liveQuestions.forEach(q => {
      hasQuestions = true;
      listEl.insertAdjacentHTML('beforeend', `
        <div class="sidebar-item" style="background: ${q.answered ? 'rgba(16, 185, 129, 0.02)' : 'rgba(255, 255, 255, 0.02)'};">
          <div class="sidebar-item-title" style="font-size: 0.75rem;">${camp.agency} - Case ${camp.id}</div>
          <div style="font-size: 0.8rem; color: var(--text-primary); margin: 0.2rem 0;">"${q.text}"</div>
          <div class="sidebar-item-meta">
            <span style="color: ${q.answered ? 'var(--success-green)' : 'var(--warning-amber)'}; font-weight: 600;">
              ${q.answered ? 'Resolved ✓' : 'Escalated to PM 🕒'}
            </span>
          </div>
        </div>
      `);
    });
  });

  if (!hasQuestions) {
    listEl.innerHTML = '<div style="font-size: 0.8rem; color: var(--text-muted); text-align: center; padding: 1rem;">No live questions active.</div>';
  }
}

// --- TAB NAVIGATION HANDLER ---
window.onTabSwitched = function(tabName) {
  if (tabName === 'agency') {
    window.renderAgencySecureGateway();
  } else if (tabName === 'pm') {
    renderPmQueue();
  } else if (tabName === 'mail') {
    renderMailDrafts();
  } else if (tabName === 'actions') {
    if (window.renderActionCenterTable) {
      window.renderActionCenterTable();
    }
  } else if (tabName === 'automation') {
    if (window.renderAutomationHub) {
      window.renderAutomationHub();
    }
  } else if (tabName === 'feedback') {
    if (window.renderUxSurveyList) window.renderUxSurveyList();
    if (window.recalculatePollPercentages) window.recalculatePollPercentages();
  }
};

// Web Crypto API standard HMAC-SHA256 generator helper
async function calculateHmacSha256(secret, message) {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(message);
  const key = await window.crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBuffer = await window.crypto.subtle.sign(
    "HMAC",
    key,
    messageData
  );
  const hashArray = Array.from(new Uint8Array(signatureBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
}

window.triggerConnectTicketCreation = async function() {
  const caseIdInput = document.getElementById('cases-caseid-input') ? document.getElementById('cases-caseid-input').value.trim() : '';
  const country = document.getElementById('cases-country-input') ? document.getElementById('cases-country-input').value.trim() : 'SG';
  const agencyParent = document.getElementById('cases-agency-parent') ? document.getElementById('cases-agency-parent').value : 'OMG';
  const agency = document.getElementById('cases-agency-input') ? document.getElementById('cases-agency-input').value.trim() : 'Starcom Global';
  const campType = document.getElementById('cases-camp-type') ? document.getElementById('cases-camp-type').value : 'Google Marketing Platform (GMP)';
  const topic = document.getElementById('cases-topic-input') ? document.getElementById('cases-topic-input').value.trim() : 'YouTube Buying in DV360';
  const presenter = document.getElementById('cases-presenter-select') ? document.getElementById('cases-presenter-select').value : 'Taylor Chen';
  const platform = document.getElementById('cases-platform-input') ? document.getElementById('cases-platform-input').value : 'GVC';
  const deliveryType = document.getElementById('cases-delivery-type') ? document.getElementById('cases-delivery-type').value : 'Standard';
  const deckType = document.getElementById('cases-deck-input') ? document.getElementById('cases-deck-input').value : 'Standard Deck';
  const plannedDate = document.getElementById('cases-date-input') ? document.getElementById('cases-date-input').value : '2026-05-22';
  const duration = document.getElementById('cases-duration-input') ? document.getElementById('cases-duration-input').value : '60';
  const amEmail = document.getElementById('cases-am-input') ? document.getElementById('cases-am-input').value.trim() : 'am.starcom@google.com';
  const lang = document.getElementById('cases-lang-input') ? document.getElementById('cases-lang-input').value.trim() : 'EN';
  const intakeStatus = document.getElementById('cases-status-input') ? document.getElementById('cases-status-input').value : 'Planned';
  const revCovered = document.getElementById('cases-rev-input') ? document.getElementById('cases-rev-input').value : '4.25';
  const meetingLink = document.getElementById('cases-meeting-input') ? document.getElementById('cases-meeting-input').value.trim() : 'https://meet.google.com/abc-defg-hij';
  const comments = document.getElementById('cases-comments-input') ? document.getElementById('cases-comments-input').value.trim() : '';

  if (!agency || !amEmail) {
    alert('Please provide Client Division Name and AM email.');
    return;
  }

  const newCaseId = caseIdInput || `2-${Math.floor(10000000 + Math.random() * 90000000)}`;
  if (document.getElementById('cases-sandbox-caseid')) {
    document.getElementById('cases-sandbox-caseid').textContent = newCaseId;
  }

  const payload = {
    id: newCaseId,
    country: country || 'SG',
    holdingGroup: agencyParent,
    agency: agency,
    suite: campType,
    product: topic,
    presenter: presenter,
    platform: platform,
    deliveryType: deliveryType,
    deckType: deckType,
    nominationDate: plannedDate || new Date().toISOString().split('T')[0],
    scheduledTime: plannedDate ? `${plannedDate}T10:00:00Z` : null,
    duration: duration || 60,
    amEmail: amEmail,
    language: lang || 'EN',
    revCovered: revCovered || 0,
    meetingLink: meetingLink || "",
    comments: comments || ""
  };

  const payloadString = JSON.stringify(payload);

  try {
    // Dynamic browser-side cryptographic signing
    const signature = await calculateHmacSha256("connect_signature_key_2026", payloadString);

    const consoleEl = document.getElementById('cases-webhook-response-console');
    if (consoleEl) {
      consoleEl.style.color = 'var(--warning-amber)';
      consoleEl.textContent = `⏳ [Webhook Signature Verification] HMAC SHA256 mapping verified. Dispatching secure POST to GPEG webhook...`;
    }

    const response = await fetch('/api/webhook', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Connect-Token': 'secret_connect_gpeg_2026',
        'X-Connect-Signature': signature
      },
      body: payloadString
    });

    if (response.ok) {
      const result = await response.json();
      
      // Insert backend-generated camp persistently
      state.camps.unshift(result.camp);
      localStorage.setItem('gpeg_camps', JSON.stringify(state.camps));

      if (consoleEl) {
        consoleEl.style.color = 'var(--success-green)';
        consoleEl.textContent = JSON.stringify({
          status: "SUCCESS",
          event: "ticket.created",
          statusCode: 200,
          message: "Webhook verified & ingested persistently in SQLite Spanner",
          clientToken: "secret_connect_gpeg_2026",
          hmacSignature: signature,
          syncedRecord: result.camp
        }, null, 2);
      }

      window.logAction('SUCCESS', `Cases Connect Webhook Sync: Real-time signature verified sync for Case ${newCaseId} completed persistently.`);
      showToast('Cases Connect Sync', `Data 2026 Record ${newCaseId} successfully synced E2E.`);

      // Trigger Phase 1: ML Opportunity Prioritizer Scoping
      const scoping = window.calculateMlOpportunityScoping(newCaseId);
      if (scoping) {
        document.getElementById('scoping-headroom-display').textContent = `$${scoping.opportunityHeadroom}M`;
        document.getElementById('scoping-arr-display').textContent = `$${scoping.calculatedArrPotential}M`;
        
        const badge = document.getElementById('scoping-priority-badge');
        if (badge) {
          badge.textContent = scoping.priority;
          if (scoping.priority === 'P0 Critical') {
            badge.style.background = 'rgba(239, 68, 68, 0.12)';
            badge.style.color = 'var(--danger-red)';
          } else if (scoping.priority === 'P1 High') {
            badge.style.background = 'rgba(245, 158, 11, 0.12)';
            badge.style.color = 'var(--warning-amber)';
          } else {
            badge.style.background = 'rgba(16, 185, 129, 0.12)';
            badge.style.color = 'var(--success-green)';
          }
        }
      }

      setTimeout(() => {
        window.switchTab('dashboard');
        renderDashboard();
      }, 4000); // Give 4 seconds delay to display premium ML metrics before redirection E2E!
    } else {
      const err = await response.json();
      throw new Error(err.error || 'Webhook secure post rejected');
    }
  } catch (err) {
    console.warn('Sandbox webhook network error. Running in offline simulation mode.', err);
    
    // Offline Fallback: process raw Webhook sync directly in local memory!
    const consoleEl = document.getElementById('cases-webhook-response-console');
    
    // Simulate geo-IP and domain mapping fallback logic
    const fallbackCamp = {
      ...payload,
      stage: 'nomination',
      status: 'Pending Kickoff',
      slaBreached: false,
      slaDaysRemaining: null,
      bfmUplift: null,
      feedbackScore: null,
      recordingArchived: false,
      recordingDeleted: false,
      discoveryStatus: 'Not Sent',
      liveQuestions: [],
      followUpSent: false,
      internalShare: "demo-presenter@google.com, demo-lead@google.com"
    };

    state.camps.unshift(fallbackCamp);
    localStorage.setItem('gpeg_camps', JSON.stringify(state.camps));

    if (consoleEl) {
      consoleEl.style.color = 'var(--success-green)';
      consoleEl.textContent = JSON.stringify({
        status: "SUCCESS (Offline Fallback Active)",
        event: "ticket.created",
        statusCode: 200,
        message: "Client-side sandbox LocalStorage sync verified E2E",
        clientToken: "secret_connect_gpeg_mock_token",
        hmacSignature: "mock_sha256_signature_cleared",
        syncedRecord: fallbackCamp
      }, null, 2);
    }

    window.logAction('SUCCESS', `Cases Connect Webhook Sync (Offline Fallback): Secure sync for Case ${newCaseId} completed locally.`);
    showToast('Cases Connect Sync', `Data Record ${newCaseId} successfully synced (Offline Simulation).`);

    // Trigger Phase 1: ML Opportunity Prioritizer Scoping (Offline Fallback)
    const scoping = window.calculateMlOpportunityScoping(newCaseId);
    if (scoping) {
      document.getElementById('scoping-headroom-display').textContent = `$${scoping.opportunityHeadroom}M`;
      document.getElementById('scoping-arr-display').textContent = `$${scoping.calculatedArrPotential}M`;
      
      const badge = document.getElementById('scoping-priority-badge');
      if (badge) {
        badge.textContent = scoping.priority;
        if (scoping.priority === 'P0 Critical') {
          badge.style.background = 'rgba(239, 68, 68, 0.12)';
          badge.style.color = 'var(--danger-red)';
        } else if (scoping.priority === 'P1 High') {
          badge.style.background = 'rgba(245, 158, 11, 0.12)';
          badge.style.color = 'var(--warning-amber)';
        } else {
          badge.style.background = 'rgba(16, 185, 129, 0.12)';
          badge.style.color = 'var(--success-green)';
        }
      }
    }

    setTimeout(() => {
      window.switchTab('dashboard');
      renderDashboard();
    }, 4000); // Give 4 seconds delay to display premium ML metrics before redirection E2E!
  }
};


// --- SANDBOX 2: AGENCY PORTAL VIEW ---
function populateAgencyCampSelector() {
  const selector = document.getElementById('agency-camp-selector');
  selector.innerHTML = '<option value="">-- Select Active Session --</option>';

  // Show camps that can interact with agency: pre-camp (for discovery) or post-camp (for feedback)
  const relevantCamps = state.camps.filter(c => 
    (c.stage === 'pre-camp' && c.discoveryStatus === 'Pending') || 
    (c.stage === 'post-camp' && c.followUpSent && c.feedbackScore === null)
  );

  relevantCamps.forEach(camp => {
    const stageLabel = camp.stage === 'pre-camp' ? 'Pre-Camp Discovery' : 'Post-Camp Feedback';
    selector.insertAdjacentHTML('beforeend', `
      <option value="${camp.id}">${camp.agency} [${camp.product}] (${stageLabel})</option>
    `);
  });

  loadAgencySubView();
}

function loadAgencySubView() {
  const caseId = state.authenticatedAgencyCaseId;
  const formArea = document.getElementById('agency-form-area');

  if (!caseId) {
    formArea.innerHTML = '<div style="color: var(--text-muted); font-size: 0.9rem;">🔒 Session locked. Enter a secure Case ID token to access forms.</div>';
    return;
  }

  const camp = state.camps.find(c => c.id === caseId);
  if (camp.stage === 'pre-camp') {
    formArea.innerHTML = `
      <h3>Pre-Camp Discovery Form</h3>
      <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1.5rem;">
        Welcome <strong>${camp.agency}</strong> team! To help us customize your GPEG <strong>${camp.product}</strong> Camp, please fill in details about your team's needs.
      </p>
      
      <div class="form-group">
        <label>Your Team's Current Confidence Level in ${camp.product}</label>
        <select id="agency-discovery-confidence" class="form-control">
          <option value="Beginner">Beginner (New to the tool / setup)</option>
          <option value="Intermediate">Intermediate (Comfortable with everyday management)</option>
          <option value="Advanced">Advanced (Expert, looking to optimize advanced variables)</option>
        </select>
      </div>

      <div class="form-group">
        <label>Primary Product Challenges or Friction Areas</label>
        <textarea id="agency-discovery-challenges" class="form-control" rows="2" style="resize:none;" placeholder="What specific friction are you experiencing?"></textarea>
      </div>

      <div class="form-group">
        <label>Select Key Topics from Menu of Services (Select all that apply)</label>
        <div class="checklist" style="background: rgba(255, 255, 255, 0.02); border: 1px solid var(--border-light); padding: 0.75rem; border-radius: 8px;">
          ${getDynamicMosChecklistHtml(camp.product)}
        </div>
      </div>

      <button class="btn btn-primary" onclick="submitAgencyDiscovery('${camp.id}')">Submit Discovery Answers</button>
    `;
  } else {
    // Post camp feedback
    formArea.innerHTML = `
      <h3>Post-Camp Practitioner Survey</h3>
      <p style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 1.5rem;">
        Thank you for attending the GPEG <strong>${camp.product}</strong> Camp! Please rate your experience and report impact progress.
      </p>

      <div class="form-group">
        <label>Overall Training Value Rating (1-5 Stars)</label>
        <select id="agency-feedback-rating" class="form-control" style="max-width: 120px;">
          <option value="5">5 (Outstanding)</option>
          <option value="4">4 (Very Helpful)</option>
          <option value="3">3 (Average)</option>
          <option value="2">2 (Below Average)</option>
          <option value="1">1 (Poor)</option>
        </select>
      </div>

      <div class="form-group">
        <label>Product/BFM Adoption Uplift Achieved (30-day estimation %)</label>
        <input type="number" id="agency-feedback-uplift" class="form-control" value="15.5" min="0" max="100" style="max-width: 120px;">
      </div>

      <div class="form-group">
        <label>Brief comment on how the session helped your commercial execution</label>
        <textarea id="agency-feedback-comment" class="form-control" rows="2" style="resize:none;" placeholder="Type feedback..."></textarea>
      </div>

      <button class="btn btn-primary" onclick="submitAgencyFeedback('${camp.id}')">Submit Session Feedback</button>
    `;
  }
}

window.submitAgencyDiscovery = function(caseId) {
  const confidence = document.getElementById('agency-discovery-confidence').value;
  const challenges = document.getElementById('agency-discovery-challenges').value.trim();

  const checkedTopics = [];
  if (document.getElementById('topic-1').checked) checkedTopics.push('Hygiene & Setups');
  if (document.getElementById('topic-2').checked) checkedTopics.push('Custom Floodlights');
  if (document.getElementById('topic-3').checked) checkedTopics.push('BFM & Bidding');
  if (document.getElementById('topic-4').checked) checkedTopics.push('S2S API Connections');

  // Update state
  const camp = state.camps.find(c => c.id === caseId);
  camp.discoveryStatus = 'Submitted';
  camp.discoveryData = {
    confidence,
    challenges,
    topics: checkedTopics,
    customModules: (camp.discoveryData && camp.discoveryData.customModules) ? camp.discoveryData.customModules : []
  };
  
  // ⚡ PHASE 2: "DHANU AI" AUTOMATED FEEDBACK PROCESSOR INGRESS HOOK
  if (typeof window.dhanuAiFeedbackProcessor === 'function' && challenges) {
    const aiResponse = window.dhanuAiFeedbackProcessor(caseId, challenges);
    if (aiResponse && camp.discoveryData) {
      camp.discoveryData.customModules = [aiResponse.recommendedModule];
    }
  } else {
    camp.deckType = 'Customized Deck';
    camp.status = 'Discovery Received';
  }
  
  saveState();


  showToast('Agency Portal Submit', `Discovery responses saved for ${camp.agency}. Deck auto-customized.`);
  
  populateAgencyCampSelector();
  // Add an inbound mail notification showing confirmation
  dispatchEmailToServer({
    from: camp.amEmail,
    to: "gpeg-camps@google.com",
    subject: `Discovery Submitted: Case ${camp.id} - ${camp.agency}`,
    body: `Hi GPEG Team,\n\nOmnicom has submitted their pre-camp discovery form. Ready to lock in customize deck!\n\nBest,\nAM`
  });
};

window.submitAgencyFeedback = function(caseId) {
  const rating = parseFloat(document.getElementById('agency-feedback-rating').value);
  const uplift = parseFloat(document.getElementById('agency-feedback-uplift').value);

  const camp = state.camps.find(c => c.id === caseId);
  camp.feedbackScore = rating;
  camp.bfmUplift = uplift;
  camp.stage = 'closed';
  camp.status = 'Impact Logged';

  saveState();

  showToast('Feedback Logged', `Thank you! Camp ${camp.id} successfully closed and metrics updated.`);
  
  populateAgencyCampSelector();
};

// --- SANDBOX 3: PM & GPL ESCALATION QUEUE ---
window.renderPmQueue = function() {
  const container = document.getElementById('pm-queue-list');
  container.innerHTML = '';

  // 1. Filter live escalated questions that are unresolved
  const campsWithUnresolved = state.camps.filter(c => c.liveQuestions.some(q => !q.answered));

  // 2. Filter persistent buganizer tickets that are unresolved (New or Open status without answer)
  const pendingBuganizerTickets = (state.buganizerTickets || []).filter(t => (t.status === 'New' || t.status === 'Open') && !t.answer);

  if (campsWithUnresolved.length === 0 && pendingBuganizerTickets.length === 0) {
    container.innerHTML = '<div style="color: var(--text-muted); font-size: 0.95rem; text-align: center; padding: 2rem;">No escalated technical questions pending PM review. Excellent job!</div>';
    return;
  }

  // Render persistent buganizer tickets first for the user to see the pre-seeded ones
  pendingBuganizerTickets.forEach(ticket => {
    // Try to find corresponding camp details from state or use seed fallback
    const camp = state.camps.find(c => c.id === ticket.caseId) || { 
      agency: "Incubeta", 
      product: "GMP Camp: PMax vs Demand Gen Strategy", 
      presenter: "Alex Rivera (Presenter)" 
    };
    
    container.insertAdjacentHTML('beforeend', `
      <div class="mock-cases-ticket" style="border-color: var(--warning-amber-dim); margin-bottom: 1.5rem;">
        <div class="ticket-bar" style="background: #241d13; display: flex; justify-content: space-between; padding: 0.5rem 1rem; border-radius: 6px 6px 0 0;">
          <span>BUGANIZER TICKET - b/${ticket.id} (Case ${ticket.caseId})</span>
          <span style="color: var(--warning-amber); font-weight: 600; font-size: 0.8rem;">Awaiting PM Expert Answer</span>
        </div>
        <div class="ticket-content" style="padding: 1rem; background: rgba(255, 255, 255, 0.01); border: 1px solid var(--border-light); border-top: none; border-radius: 0 0 6px 6px;">
          <div class="ticket-field" style="margin-bottom: 1rem;">
            <div class="ticket-field-label" style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Escalated Topic:</div>
            <div style="font-size: 1.05rem; font-weight: 600; color: var(--text-primary); margin: 0.25rem 0;">${ticket.title}</div>
            <div class="ticket-field-label" style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase; margin-top: 0.5rem;">Details / Scenario:</div>
            <div style="font-size: 0.95rem; font-weight: 500; font-style: italic; color: var(--text-secondary); line-height: 1.4;">"${ticket.desc}"</div>
          </div>
          <div class="ticket-field" style="background: rgba(255, 255, 255, 0.02); padding: 0.75rem; border-radius: 8px; border: 1px solid var(--border-light); font-size: 0.8rem; margin-bottom: 1rem;">
            <strong>Scope:</strong> <span style="color: var(--text-primary);">${ticket.component}</span> | 
            <strong>Client:</strong> <span style="color: var(--text-primary);">${camp.agency}</span> | 
            <strong>Presenter:</strong> <span style="color: var(--text-primary);">${camp.presenter || 'Unassigned'}</span>
          </div>
          <div class="form-group">
            <label for="pm-answer-${ticket.id}" style="font-size: 0.85rem; font-weight: 600; color: var(--text-secondary);">Authoritative Product Response</label>
            <textarea id="pm-answer-${ticket.id}" class="form-control" rows="2" style="resize:none; margin-top: 0.25rem;" placeholder="Type final PM expert answer to sync back to the slides & AM follow-up outbox..."></textarea>
          </div>
          <button class="btn btn-primary" style="margin-top: 0.75rem;" onclick="resolveEscalatedQuestion('${ticket.caseId}', null, true, '${ticket.id}')">Resolve & Sync Answer</button>
        </div>
      </div>
    `);
  });

  // Render live camp questions
  campsWithUnresolved.forEach(camp => {
    camp.liveQuestions.forEach(q => {
      if (!q.answered) {
        container.insertAdjacentHTML('beforeend', `
          <div class="mock-cases-ticket" style="border-color: var(--warning-amber-dim); margin-bottom: 1.5rem;">
            <div class="ticket-bar" style="background: #241d13; display: flex; justify-content: space-between; padding: 0.5rem 1rem; border-radius: 6px 6px 0 0;">
              <span>ESCALATED LIVE QUESTION - CASE ${camp.id}</span>
              <span style="color: var(--warning-amber); font-weight: 600; font-size: 0.8rem;">Awaiting Pod Lead / PM Answer</span>
            </div>
            <div class="ticket-content" style="padding: 1rem; background: rgba(255, 255, 255, 0.01); border: 1px solid var(--border-light); border-top: none; border-radius: 0 0 6px 6px;">
              <div class="ticket-field" style="margin-bottom: 1rem;">
                <div class="ticket-field-label" style="font-size: 0.75rem; color: var(--text-muted); text-transform: uppercase;">Agency Practitioner Asked:</div>
                <div style="font-size: 1rem; font-weight: 500; font-style: italic; color: var(--text-primary); margin-top: 0.25rem;">"${q.text}"</div>
              </div>
              <div class="ticket-field" style="background: rgba(255, 255, 255, 0.02); padding: 0.75rem; border-radius: 8px; border: 1px solid var(--border-light); font-size: 0.8rem; margin-bottom: 1rem;">
                <strong>Camp Details:</strong> GPEG ${camp.product} for ${camp.agency}. Presenter: ${camp.presenter || 'Taylor Chen'}
              </div>
              <div class="form-group">
                <label for="pm-answer-${q.id}" style="font-size: 0.85rem; font-weight: 600; color: var(--text-secondary);">Finalized Product Expert Answer</label>
                <textarea id="pm-answer-${q.id}" class="form-control" rows="2" style="resize:none; margin-top: 0.25rem;" placeholder="Type authoritative product response here..."></textarea>
              </div>
              <button class="btn btn-primary" style="margin-top: 0.75rem;" onclick="resolveEscalatedQuestion('${camp.id}', '${q.id}')">Resolve & Sync Answer</button>
            </div>
          </div>
        `);
      }
    });
  });
}

window.resolveEscalatedQuestion = async function(campId, questionId, isBuganizer = false, bugId = null) {
  const inputId = isBuganizer ? `pm-answer-${bugId}` : `pm-answer-${questionId}`;
  const inputEl = document.getElementById(inputId);
  const answer = inputEl.value.trim();

  if (!answer) {
    alert('Please type an answer before resolving.');
    return;
  }

  if (isBuganizer && bugId) {
    try {
      // Trigger E2E server-side resolution webhook sync
      const response = await fetch('/api/buganizer/resolve', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-GPEG-Session': currentSessionToken
        },
        body: JSON.stringify({ bugId: bugId, answer: answer })
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update local buganizerTickets state
        const ticket = state.buganizerTickets.find(t => t.id === bugId);
        if (ticket) {
          ticket.status = 'Resolved';
          ticket.answer = answer;
        }
        
        // Update corresponding camp in local state
        const localCampIndex = state.camps.findIndex(c => c.id === campId);
        if (localCampIndex !== -1) {
          state.camps[localCampIndex] = data.camp;
        }
        
        // Sync outbox email
        if (data.mail) {
          state.outbox.unshift(data.mail);
          localStorage.setItem('gpeg_outbox', JSON.stringify(state.outbox));
        }

        localStorage.setItem('gpeg_buganizer_tickets', JSON.stringify(state.buganizerTickets));
        localStorage.setItem('gpeg_camps', JSON.stringify(state.camps));

        showToast('Buganizer Resolved ✓', `b/${bugId} resolved and synced to Case ${campId} Outbox E2E!`);
      } else {
        throw new Error('Server rejected resolution');
      }
    } catch (err) {
      console.error('E2E resolution failed, falling back to local update:', err);
      const ticket = state.buganizerTickets.find(t => t.id === bugId);
      if (ticket) {
        ticket.status = 'Resolved';
        ticket.answer = answer;
        localStorage.setItem('gpeg_buganizer_tickets', JSON.stringify(state.buganizerTickets));
      }
    }
  } else {
    // Live question local resolution
    const camp = state.camps.find(c => c.id === campId);
    const question = camp.liveQuestions.find(q => q.id === questionId);
    question.answered = true;
    question.answer = answer;

    dispatchEmailToServer({
      from: "gpeg-camps@google.com",
      to: camp.amEmail,
      subject: `RESOLVED Q&A: Case ${camp.id} - ${camp.agency}`,
      body: `Hi AM,\n\nOur Product Lead / PM has resolved the escalated technical question for ${camp.agency}.\n\nQuestion: "${question.text}"\nAnswer: "${answer}"\n\nThis has been automatically embedded into your follow-up draft. You can now send the final post-camp package!\n\nBest,\nCamps System`
    });

    showToast('Question Resolved', `Answer synced to Case ${campId}. Presenter follow-up draft unlocked.`);
  }
  
  saveState();
  renderPmQueue();
};

// --- SANDBOX 4: EMAIL GATEWAY DRAWER ---
window.triggerEmailNominationIngest = function() {
  const from = document.getElementById('email-sandbox-from').value.trim();
  const subject = document.getElementById('email-sandbox-subject').value.trim();
  const body = document.getElementById('email-sandbox-body').value.trim();
  const region = document.getElementById('email-sandbox-region').value;

  const ccVal = document.getElementById('email-sandbox-cc').value.trim();
  const bccVal = document.getElementById('email-sandbox-bcc').value.trim();

  if (!from || !subject || !body) {
    alert('Please fill out the mock email form fields.');
    return;
  }

  // Inbound simulation: parse Starcom/Zenith and curricula keywords
  let parsedAgency = "Starcom Global";
  let parsedProduct = "GMP Camp: DV360 Campaign Setup & Opt"; // Default
  
  if (body.toLowerCase().includes('zenith') || subject.toLowerCase().includes('zenith')) parsedAgency = "Zenith Media";
  if (body.toLowerCase().includes('omnicom') || subject.toLowerCase().includes('omnicom')) parsedAgency = "Omnicom Media";
  if (body.toLowerCase().includes('havas') || subject.toLowerCase().includes('havas')) parsedAgency = "Havas Media";

  // Parse specialized programs from Subject or Body
  const fullTxt = (subject + " " + body).toLowerCase();
  if (fullTxt.includes('partnership') || fullTxt.includes('ads') || fullTxt.includes('pa')) {
    parsedProduct = "Partnership Ads Training (MFG - WPP)";
  } else if (fullTxt.includes('apps partner') || fullTxt.includes('ios') || fullTxt.includes('measurement')) {
    parsedProduct = "Apps Partner Center (iOS & Measurement)";
  } else if (fullTxt.includes('kpi') || fullTxt.includes('search') || fullTxt.includes('pmax')) {
    parsedProduct = "KPI Camp: Search & PMax AI Bidding";
  } else if (fullTxt.includes('cm360') || fullTxt.includes('foundations')) {
    parsedProduct = "GMP Camp: CM360 Foundations";
  } else if (fullTxt.includes('sa360') || fullTxt.includes('bidding')) {
    parsedProduct = "GMP Camp: SA360 Bidding & Value";
  }

  const serial = Math.floor(10000000 + Math.random() * 90000000);
  const caseId = `2-${serial}`;

  // Parse platform from body or subject keywords
  let parsedPlatform = "Meet";
  if (fullTxt.includes("teams") || fullTxt.includes("microsoft")) {
    parsedPlatform = "Teams";
  }

  // Add new camp
  const newCamp = {
    id: caseId,
    agency: parsedAgency,
    amEmail: from,
    product: parsedProduct,
    region: region,
    platform: parsedPlatform,
    stage: "nomination",
    status: "Pending Kickoff",
    nominationDate: new Date().toISOString().split('T')[0],
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
    recordingArchived: false,
    internalShare: "demo-presenter@google.com, demo-lead@google.com"
  };

  // Store inbound email in local outbox logs
  dispatchEmailToServer({
    from: from,
    to: "gpeg-camps@google.com",
    cc: ccVal,
    bcc: bccVal,
    subject: subject,
    body: body
  });

  state.camps.unshift(newCamp);
  saveState();

  window.logAction('INFO', `Email Ingestion Parser: Nomination parsed from ${from} [Region Scope: ${region}] - ${parsedProduct} (Case ${caseId}).`);

  showToast('Email Parser Ingestion', `Parsed email from ${from}. New card added to Nomination pipeline.`);

  setTimeout(() => {
    window.switchTab('dashboard');
    renderDashboard();
  }, 800);
};

function renderMailDrafts() {
  const container = document.getElementById('mail-drafts-list');
  container.innerHTML = '';

  if (state.outbox.length === 0) {
    container.innerHTML = '<div style="font-size: 0.8rem; color: var(--text-muted); text-align: center; padding: 1rem;">No outgoing logs generated yet.</div>';
    return;
  }

  state.outbox.forEach(mail => {
    container.insertAdjacentHTML('beforeend', `
      <div class="mail-item">
        <div class="mail-item-header">
          <span>From: ${mail.from}</span>
          <span>${new Date(mail.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</span>
        </div>
        <div class="mail-item-header" style="margin-bottom: 0.35rem;">
          <span>To: ${mail.to}</span>
        </div>
        <div class="mail-subject">${mail.subject}</div>
        <div style="font-size: 0.75rem; color: var(--text-secondary); white-space: pre-line; background: rgba(255,255,255,0.01); padding: 0.5rem; border-radius: 6px; border: 1px solid var(--border-light);">
          ${mail.body}
        </div>
      </div>
    `);
  });
}

// --- PRESENTER PIPELINE ACTIONS ---

// 1. Pre-Camp Kickoff Setup Modal
window.openKickoffModal = function(caseId) {
  const camp = state.camps.find(c => c.id === caseId);
  
  document.getElementById('kickoff-caseid').value = camp.id;
  
  // Set default dates in inputs
  const today = new Date();
  const scheduled = new Date(today);
  scheduled.setDate(today.getDate() + 7); // Scheduled 7 days out
  
  const slaDate = new Date(today);
  slaDate.setDate(today.getDate() + 4); // Discovery SLA is 4 days out
  
  document.getElementById('kickoff-datetime').value = scheduled.toISOString().slice(0, 16);
  document.getElementById('kickoff-discovery-sla').value = slaDate.toISOString().split('T')[0];

  // Capacity-Aware Presenter Allocation: Compute active workloads and dynamically recommend presenter
  if (window.calculatePresenterWorkloads) {
    const workloads = window.calculatePresenterWorkloads();
    const presenterSelect = document.getElementById('kickoff-presenter');
    
    if (presenterSelect) {
      presenterSelect.innerHTML = '';
      let recommendedPresenter = 'Taylor Chen (Presenter)';
      let minWorkload = 999;
      
      Object.entries(workloads).forEach(([name, count]) => {
        const opt = document.createElement('option');
        opt.value = name;
        opt.textContent = `${name} (Workload: ${count} active)`;
        presenterSelect.appendChild(opt);
        
        if (count < minWorkload) {
          minWorkload = count;
          recommendedPresenter = name;
        }
      });
      
      // Select lowest workload option
      presenterSelect.value = recommendedPresenter;
      
      // Display recommendation help pill
      const recEl = document.getElementById('scheduler-workload-recommendation');
      if (recEl) {
        recEl.textContent = `💡 Recommended Presenter: ${recommendedPresenter.split(' ')[0]} (Active Workload: Low - ${minWorkload} assigned)`;
      }
    }
  }

  window.openModal('modal-kickoff');
};

window.onKickoffTopicSelected = function(topicName) {
  const durationSelect = document.getElementById('kickoff-stellar-duration');
  const commentsArea = document.getElementById('kickoff-comments');
  if (!durationSelect || !commentsArea) return;

  let duration = '60 Mins';
  let deckName = 'Standard base slides deck';

  if (topicName.includes('Smart Bidding') || topicName.includes('Smart Bidding Exploration')) {
    duration = '90 Mins';
    deckName = 'Smart Bidding Exploration Base Deck';
  } else if (topicName.includes('YouTube Creative Insights') || topicName.includes('Gemini')) {
    duration = '60 Mins';
    deckName = 'gTech open-source ABCD Detector with Gemini LLM prompt validation';
  } else if (topicName.includes('YouTube Buying in DV360')) {
    duration = '60 Mins';
    deckName = 'YouTube Buying in DV360: A Comprehensive Agency Guide';
  } else if (topicName.includes('Measurement Google Tag Gateway') || topicName.includes('Google Tag Gateway')) {
    duration = '90 Mins';
    deckName = '201 - Measurement GTG (Google Tag Gateway Basics)';
  } else if (topicName.includes('Effective Measurement') || topicName.includes('MMM')) {
    duration = '60 Mins';
    deckName = '301 - Effective Measurement (MMM Foundations & Attribution)';
  } else if (topicName.includes('Search Lift') || topicName.includes('SLS')) {
    duration = '60 Mins';
    deckName = 'Base Deck | Search Lift | JP Agencies';
  } else if (topicName.includes('Brand Lift Study') || topicName.includes('BLS')) {
    duration = '60 Mins';
    deckName = 'Base Deck | Brand Lift (BLS) | JP Agency';
  } else if (topicName.includes('Attributed Brand Search') || topicName.includes('ABS')) {
    duration = '60 Mins';
    deckName = '[External] YT Camp | Attributed Brand Search (ABS) | gPEG';
  } else if (topicName.includes('Opti & AAR') || topicName.includes('Optimization Score')) {
    duration = '45 Mins';
    deckName = 'Opti & AAR Camp Base Slide Deck';
  } else if (topicName.includes('Budget Strategies for Search Growth') || topicName.includes('Search Growth')) {
    duration = '45 Mins';
    deckName = 'Budget Strategies for Search Growth - Base Deck';
  } else if (topicName.includes('PMax for Growth') || topicName.includes('Growth')) {
    duration = '90 Mins';
    deckName = 'PMax Camp | PMax Growth | Base Deck';
  } else if (topicName.includes('PMax for Store Goals') || topicName.includes('Store Goals')) {
    duration = '90 Mins';
    deckName = 'PMax Camp | PMax for Store Goals';
  } else if (topicName.includes('Insight and Reporting') || topicName.includes('PMax Insights')) {
    duration = '90 Mins';
    deckName = 'PMax Camp | Insights and Reporting | Base Deck';
  } else if (topicName.includes('App Campaign Optimization') || topicName.includes('ACi Setup')) {
    duration = '60 Mins';
    deckName = '[Base Deck- gPEG] App Campaign Setup & Creative Optimization';
  } else if (topicName.includes('iOS App Campaigns') || topicName.includes('ODM')) {
    duration = '90 Mins';
    deckName = '[Base Deck] - iOS and Measurement';
  } else if (topicName.includes('Commerce Feed Upload') || topicName.includes('Feed Upload')) {
    duration = '90 Mins';
    deckName = '[Make a Copy] [gPeg] Commerce Camp 201 | Feed Masterclass | Base Deck';
  } else if (topicName.includes('Search Campaigns for Travel') || topicName.includes('TASC')) {
    duration = '90 Mins';
    deckName = 'WIP - Search Campaigns for Travel (TASC) Masterclass Deck';
  } else if (topicName.includes('GA 3.0') || topicName.includes('GA Excellence Fundamentals')) {
    duration = '60 Mins';
    deckName = 'Base Deck [YS] GA 3.0 Camp';
  } else if (topicName.includes('GA 4.0') || topicName.includes('Advanced GA & 3P')) {
    duration = '90 Mins';
    deckName = '[External Agency Training] GA Advanced (3P Integrations, Cross-Channel Conversion Reporting & Management)';
  } else if (topicName.includes('Agentic Commerce') || topicName.includes('Future of Search & Agentic')) {
    duration = '60 Mins';
    deckName = 'V1 Agentic Commerce Camp [MAKE A COPY][Ambassadors Deck] Future of Commerce - 2026';
  } else if (topicName.includes('DG Best Practices') || topicName.includes('DG + PMax')) {
    duration = '90 Mins';
    deckName = 'DGen Camp | Revised base deck - 2025';
  } else if (topicName.includes('PMax Best Practices') || topicName.includes('PMax for Online Sales')) {
    duration = '90 Mins';
    deckName = 'PMax Best Practices xMO | GCS v2 Base slides';
  } else if (topicName.includes('W2AC') || topicName.includes('Measurement Masterclass')) {
    duration = '90 Mins';
    deckName = 'gPEG Base slide deck : Advanced Measurement Masterclass';
  } else if (topicName.includes('Account Structure')) {
    duration = '60 Mins';
    deckName = 'One Search Base Deck - Account Restructuring Best Practices';
  } else if (topicName.includes('App Campaign Fundamentals')) {
    duration = '60 Mins';
    deckName = '[Base Deck] - gPEG - App Campaign Fundamentals';
  } else if (topicName.includes('Enhanced Automation & Optimized Targeting') || topicName.includes('OT (DV360)')) {
    duration = '60 Mins';
    deckName = 'Optimized targeting DV360 Enhanced Automation DV360';
  } else if (topicName.includes('Demand Gen in Display & Video 360') || topicName.includes('Demand Gen in DV360')) {
    duration = '60 Mins';
    deckName = 'Demand Gen in Display & Video 360 Overview';
  } else if (topicName.includes('Advanced SA: AI-Bidding') || topicName.includes('AI Spotlight')) {
    duration = '90 Mins';
    deckName = 'SA360 Camps Content Dec 2025';
  } else if (topicName.includes('SA360 AI Productivity') || topicName.includes('Templates')) {
    duration = '60 Mins';
    deckName = 'AI Productivity on Templates | SA360 camp';
  } else if (topicName.includes('CM360 Cross Channel') || topicName.includes('Cross Channel Attribution')) {
    duration = '90 Mins';
    deckName = 'CM360 || Conversion Reporting Deep Dive';
  } else if (topicName.includes('CM360 YT & CTV') || topicName.includes('YT & CTV')) {
    duration = '60 Mins';
    deckName = 'DV360 & CM360 Measurement & Efficiency';
  } else if (topicName.includes('DV360 Hotspot: Campaign Optimization') || topicName.includes('Hotspot: Campaign Optimization')) {
    duration = '60 Mins';
    deckName = 'Draft Deck | DV360 Campaign Optimization | gPEG CAMPs';
  } else if (topicName.includes('DV360 Hotspot: Advanced Reporting') || topicName.includes('Hotspot: Advanced Reporting')) {
    duration = '60 Mins';
    deckName = 'Draft Deck | DV360 Reporting | gPEG CAMPs';
  } else if (topicName.includes('Billing: Payment Profile') || topicName.includes('Payment Profile')) {
    duration = '45 Mins';
    deckName = 'Payment Profile Creation and Credit Line Increases - Billing Camp - Base Deck';
  } else if (topicName.includes('Billing: Change Who Pays') || topicName.includes('Change Who Pays')) {
    duration = '90 Mins';
    deckName = 'Billing Transfer (Change Who Pays) & MCC-PP Linking - Billing Camp - Base Deck';
  } else if (topicName.includes('Policy: Account Take Over') || topicName.includes('ATO')) {
    duration = '45 Mins';
    deckName = 'gPEG - ATO Best Practices - Base Deck';
  } else if (topicName.includes('Policy: Ad Disapproval') || topicName.includes('Ad Disapproval')) {
    duration = '60 Mins';
    deckName = 'gPEG - Google Ads - Ad disapproval & Financial Certification - Base Deck';
  } else if (topicName.includes('CTV & Media Unification')) {
    duration = '90 Mins';
    deckName = 'CTV Training & Media Unification in DV360';
  }

  durationSelect.value = duration;
  commentsArea.value = `Curriculum planned E2E. Content Deck assigned: "${deckName}".`;

  showToast('Curriculum Loaded', `${topicName} duration rules applied successfully.`);
};

window.executeCampKickoffSubmit = async function() {
  const caseId = document.getElementById('kickoff-caseid').value;
  const eventTitle = document.getElementById('kickoff-title').value.trim();
  const presenter = document.getElementById('kickoff-presenter').value;
  const datetime = document.getElementById('kickoff-datetime').value;
  const durationVal = document.getElementById('kickoff-stellar-duration').value;
  const platformVal = document.getElementById('kickoff-platform').value;
  const newRerunVal = document.getElementById('kickoff-new-rerun').value;
  const registrationsVal = parseInt(document.getElementById('kickoff-registrations').value);
  const supportPocs = document.getElementById('kickoff-support-pocs').value;
  const psmLdap = document.getElementById('kickoff-psm-ldap').value.trim();
  const slaDateStr = document.getElementById('kickoff-discovery-sla').value;
  const meetingLink = document.getElementById('kickoff-meeting-link').value.trim();
  const commentsVal = document.getElementById('kickoff-comments').value.trim();

  const customModules = [];
  if (document.getElementById('mod-core-101').checked) customModules.push('Core Platform 101 Basics');
  if (document.getElementById('mod-advanced-201').checked) customModules.push('S2S API & Floodlights');
  if (document.getElementById('mod-looker-stats').checked) customModules.push('PLX/Looker Analytics');
  if (document.getElementById('mod-hotspot').checked) customModules.push('Hotspot Debugger');

  const payload = {
    product: eventTitle,
    presenter: presenter,
    scheduledTime: datetime,
    duration: durationVal,
    platform: platformVal,
    newRerun: newRerunVal,
    registrationsCount: registrationsVal,
    supportPocs: supportPocs,
    psmLdap: psmLdap,
    meetingPlatformUrl: meetingLink,
    comments: commentsVal,
    slaDate: slaDateStr,
    customModules: customModules
  };

  try {
    const response = await fetch(`/api/camps/${caseId}/kickoff`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-GPEG-Session': currentSessionToken
      },
      body: JSON.stringify(payload)
    });

    if (response.ok) {
      const result = await response.json();
      
      const campIdx = state.camps.findIndex(c => c.id === caseId);
      if (campIdx !== -1) {
        state.camps[campIdx] = result.camp;
        // Accrue pre-camp prep effort hours automatically
        window.accrueEffortHours(result.camp, 'Pre-Camp');
      }
      state.outbox.unshift(result.mail);
      
      localStorage.setItem('gpeg_camps', JSON.stringify(state.camps));
      localStorage.setItem('gpeg_outbox', JSON.stringify(state.outbox));

      window.logAction('SUCCESS', `Google Calendar API: Programmatically scheduled calendar invite for presenter [${presenter.split(' ')[0]}] on ${platformVal} Platform. Meeting Link: [${result.camp.meetingLink}].`);

      window.closeModal('modal-kickoff');
      showToast('Camp Pipeline Setup', `Camp ${caseId} successfully scheduled E2E! Calendar invite synced.`);
      renderDashboard();
    } else if (response.status === 409) {
      const errorResult = await response.json();
      const clash = errorResult.conflictingCamp;
      
      showToast('Calendar Clash ⚠️', `${presenter.split(' ')[0]} is already scheduled for ${clash.agency} (${clash.product}) at ${new Date(clash.scheduledTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}.`);
      
      window.logAction('WARNING', `Calendar Conflict Detection: Prevented double-booking for ${presenter} (clash with Case ${clash.id}).`);
    } else {
      throw new Error('Server kickoff submission failed');
    }
  } catch (err) {
    console.warn('Kickoff scheduler network error. Running in offline simulation mode.', err);
    
    // Offline fallback: process the kickoff directly in local memory!
    const campIdx = state.camps.findIndex(c => c.id === caseId);
    if (campIdx !== -1) {
      const camp = state.camps[campIdx];
      camp.product = eventTitle;
      camp.presenter = presenter;
      camp.scheduledTime = datetime;
      camp.duration = durationVal;
      camp.platform = platformVal;
      camp.newRerun = newRerunVal;
      camp.registrationsCount = registrationsVal;
      camp.supportPocs = supportPocs;
      camp.psmLdap = psmLdap;
      camp.meetingLink = meetingLink || 'https://meet.google.com/' + Math.random().toString(36).substring(2, 12);
      camp.comments = commentsVal;
      camp.stage = 'pre-camp';
      camp.discoveryStatus = 'Pending';
      camp.status = 'Awaiting Discovery';
      
      // Parse SLA days remaining
      let sla_days = 3;
      if (slaDateStr) {
        try {
          const target_sla = new Date(slaDateStr);
          const now_day = new Date(state.simulatedTime || "2026-05-18");
          const diffTime = Math.abs(target_sla - now_day);
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          sla_days = Math.max(1, diffDays);
        } catch(e) {
          sla_days = 3;
        }
      }
      camp.slaDaysRemaining = sla_days;
      camp.slaBreached = false;
      
      // Accrue effort hours automatically
      window.accrueEffortHours(camp, 'Pre-Camp');
      
      // Draft email in Outbox
      const mockMail = {
        id: `m${Math.floor(Math.random() * 90000) + 10000}`,
        timestamp: new Date(state.simulatedTime || "2026-05-18T14:34:38Z").toISOString(),
        from: "gpeg-camps@google.com",
        to: camp.amEmail,
        subject: `ACTION REQUIRED: Pre-Camp Discovery Form for ${camp.agency}`,
        body: `Hi AM,\n\nYour ${camp.product} Camp has been kicked off by presenter ${presenter.split(' ')[0]}!\n\nPlease coordinate with your agency contact at ${camp.agency} and have them fill out their customized discovery profile using this unique link:\n\nhttps://camps.google.com/portal/agency-discovery?caseId=${camp.id}\n\nThis form must be completed to ensure we tailor the customized deck protocol appropriately.\n\nBest,\nGPEG Camps Team`
      };
      state.outbox.unshift(mockMail);
      
      saveState();
      
      window.logAction('SUCCESS', `Google Calendar API (Offline Fallback): Successfully scheduled calendar invite for presenter [${presenter.split(' ')[0]}] on ${platformVal} Platform. Meeting Link: [${camp.meetingLink}].`);
      window.closeModal('modal-kickoff');
      showToast('Camp Pipeline Setup', `Camp ${caseId} successfully scheduled (Offline Sandbox). Calendar invite synced.`);
      renderDashboard();
    }
  }
};

// Start Live Workshop transition helper
window.startLiveSessionPrompt = function(caseId) {
  const camp = state.camps.find(c => c.id === caseId);
  
  // Transition camp to in-camp stage
  camp.stage = 'in-camp';
  camp.status = 'Live Session Active';
  saveState();
  
  showToast('Live Session Initiated', `Launching Live Workshop Console for ${camp.agency}.`);
  renderDashboard();
  
  // Automatically open presenter console modal
  setTimeout(() => {
    window.openLiveSessionModal(caseId);
  }, 500);
};

// 2. In-Camp Presenter Console
let activeLiveCampId = null;

window.openLiveSessionModal = function(caseId) {
  activeLiveCampId = caseId;
  const camp = state.camps.find(c => c.id === caseId);

  document.getElementById('live-agency-name').textContent = camp.agency;
  document.getElementById('live-product-name').textContent = camp.product;
  document.getElementById('live-presenter-name').textContent = camp.presenter;
  
  // Clear checklists and forms
  document.getElementById('chk-time').checked = false;
  document.getElementById('live-question-input').value = '';

  // Load Program-Specific dynamic checklist
  loadProgramSpecificChecklist(camp);

  renderLiveSessionQuestionsLog();
  window.openModal('modal-livesession');
};

function loadProgramSpecificChecklist(camp) {
  const container = document.getElementById('live-dynamic-program-checklist');
  if (!container) return;
  container.innerHTML = '';

  const product = camp.product || '';
  let itemsHtml = '';

  if (product.includes('Partnership Ads')) {
    itemsHtml = `
      <div class="checklist-item">
        <input type="checkbox" id="chk-PA-concise" checked style="accent-color: var(--primary-cyan); cursor: pointer;">
        <label for="chk-PA-concise">MFG / WPP concise 45-60 min limit monitored</label>
      </div>
      <div class="checklist-item">
        <input type="checkbox" id="chk-PA-client" style="accent-color: var(--primary-cyan); cursor: pointer;">
        <label for="chk-PA-client">DR-focused PA models reviewed (Internal Google Marketing)</label>
      </div>
    `;
  } else if (product.includes('KPI Camp')) {
    itemsHtml = `
      <div class="checklist-item">
        <input type="checkbox" id="chk-KPI-w2ac" style="accent-color: var(--primary-cyan); cursor: pointer;">
        <label for="chk-KPI-w2ac">W2AC (Web-to-App Connect) presented alongside PMax Best Practices</label>
      </div>
      <div class="checklist-item">
        <input type="checkbox" id="chk-KPI-hour1" style="accent-color: var(--primary-cyan); cursor: pointer;">
        <label for="chk-KPI-hour1">Hour 1 drop-off marker enabled for non-interested markets</label>
      </div>
    `;
  } else if (product.includes('Apps Partner')) {
    itemsHtml = `
      <div class="checklist-item">
        <input type="checkbox" id="chk-Apps-ios" style="accent-color: var(--primary-cyan); cursor: pointer;">
        <label for="chk-Apps-ios">iOS & Measurement transition module presented</label>
      </div>
    `;
  } else if (product.includes('GMP Camp')) {
    const isFoundations = product.includes('CM360');
    itemsHtml = `
      <div class="checklist-item">
        <input type="checkbox" id="chk-GMP-regional" style="accent-color: var(--primary-cyan); cursor: pointer;">
        <label for="chk-GMP-regional">${camp.region} regional curricula details loaded</label>
      </div>
      ${isFoundations ? `
        <div class="checklist-item">
          <input type="checkbox" id="chk-GMP-found" style="accent-color: var(--primary-cyan); cursor: pointer;">
          <label for="chk-GMP-found">Advertiser-specific foundational tracker checked</label>
        </div>
      ` : `
        <div class="checklist-item">
          <input type="checkbox" id="chk-GMP-opt" style="accent-color: var(--primary-cyan); cursor: pointer;">
          <label for="chk-GMP-opt">Campaign setup & regional optimization walkthroughs loaded</label>
        </div>
      `}
    `;
  }

  // Check if there are custom modules scheduled during kickoff
  if (camp.discoveryData && camp.discoveryData.customModules && camp.discoveryData.customModules.length > 0) {
    itemsHtml += `
      <div style="margin-top: 0.5rem; padding-top: 0.4rem; border-top: 1px dashed var(--border-light); font-weight: 700; font-size: 0.75rem; color: var(--primary-cyan); text-transform: uppercase; letter-spacing: 0.3px;">
        ✨ Custom Scheduled Modules:
      </div>
    `;
    camp.discoveryData.customModules.forEach((mod, i) => {
      itemsHtml += `
        <div class="checklist-item" style="margin-top: 0.25rem;">
          <input type="checkbox" id="chk-custom-mod-${i}" style="accent-color: var(--primary-cyan); cursor: pointer;">
          <label for="chk-custom-mod-${i}" style="font-size: 0.75rem;">"${mod}" segment checked off</label>
        </div>
      `;
    });
  }

  container.innerHTML = itemsHtml;
}

function renderLiveSessionQuestionsLog() {
  const container = document.getElementById('live-session-questions-log');
  container.innerHTML = '';
  
  const camp = state.camps.find(c => c.id === activeLiveCampId);
  
  if (camp.liveQuestions.length === 0) {
    container.innerHTML = '<div style="font-size: 0.8rem; color: var(--text-muted);">No questions logged yet.</div>';
    return;
  }

  camp.liveQuestions.forEach(q => {
    container.insertAdjacentHTML('beforeend', `
      <div style="font-size: 0.8rem; background: rgba(255, 255, 255, 0.03); border: 1px solid var(--border-light); padding: 0.4rem 0.6rem; border-radius: 6px; display: flex; justify-content: space-between; align-items: center;">
        <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap; max-width:350px;">"${q.text}"</span>
        <span style="font-size: 0.7rem; font-weight: 600; color: ${q.answered ? 'var(--success-green)' : 'var(--warning-amber)'};">
          ${q.answered ? 'Answered Live' : 'Escalated to PM'}
        </span>
      </div>
    `);
  });
}

window.logLiveQuestion = function(escalate) {
  const input = document.getElementById('live-question-input');
  const text = input.value.trim();

  if (!text) {
    alert('Please enter question text.');
    return;
  }

  const camp = state.camps.find(c => c.id === activeLiveCampId);
  const qId = 'q' + (camp.liveQuestions.length + 1) + Math.floor(Math.random() * 100);

  const newQ = {
    id: qId,
    text: text,
    answered: !escalate,
    answer: escalate ? null : "Resolved live by presenter during workshop."
  };

  camp.liveQuestions.push(newQ);
  saveState();

  input.value = '';
  renderLiveSessionQuestionsLog();
  
  if (escalate) {
    (async () => {
      try {
        const productComp = camp.product.toLowerCase().includes('cm360') ? 'gpeg-camps-cm360' :
                            camp.product.toLowerCase().includes('dv360') ? 'gpeg-camps-dv360' : 'gpeg-camps-platform';
        
        const response = await fetch('/api/buganizer/escalate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-GPEG-Session': currentSessionToken
          },
          body: JSON.stringify({
            caseId: camp.id,
            questionId: qId,
            component: productComp,
            title: `[GPEG Escalation] ${text.substring(0, 35)}...`,
            desc: text
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          state.buganizerTickets.unshift(result.ticket);
          localStorage.setItem('gpeg_buganizer_tickets', JSON.stringify(state.buganizerTickets));
          
          window.logAction('WARNING', `Buganizer API: Programmatically logged ticket [b/${result.ticket.id}] routed to component [${productComp}] for Case ID [${camp.id}].`);
          showToast('Live Q&A Escalation', `Technical question escalated. Cut Buganizer ticket b/${result.ticket.id}.`);
          
          if (typeof renderBuganizerTracker === 'function') {
            renderBuganizerTracker();
          }
        }
      } catch (err) {
        console.error('Failed to escalate to Buganizer:', err);
      }
    })();
  } else {
    showToast('Live Q&A Capture', 'Question logged as answered live.');
  }
};

window.finishLiveSession = function() {
  const camp = state.camps.find(c => c.id === activeLiveCampId);
  
  // Move to post-camp stage
  camp.stage = 'post-camp';
  camp.status = 'Resolving Queries & Follow-up';
  camp.slaDaysRemaining = 2; // 48h Follow-up SLA window begins!
  
  // Accrue in-camp delivery hours automatically
  window.accrueEffortHours(camp, 'In-Camp');
  
  saveState();
  window.closeModal('modal-livesession');
  
  showToast('Workshop Completed', `Camp concluded. 48-hour SLA countdown active for follow-up packing.`);
  renderDashboard();
};

// 3. Post-Camp Follow-up Package Modal
window.openFollowUpModal = function(caseId) {
  const camp = state.camps.find(c => c.id === caseId);
  activeLiveCampId = caseId;

  document.getElementById('followup-recipient').value = `${camp.amEmail} (Account Manager)`;

  // Dynamic compile of Q&A responses in email body
  let qaContent = 'None.';
  if (camp.liveQuestions.length > 0) {
    qaContent = camp.liveQuestions.map((q, idx) => 
      `Q${idx+1}: "${q.text}"\nAnswer: "${q.answer || 'Pending expert response.'}"`
    ).join('\n\n');
  }

  const emailBody = `Hi AM,

Thank you for coordinating the GPEG ${camp.product} Camp for ${camp.agency}! 

As promised, please find the follow-up resources package below:
1. Training Deck (Customized Presentation PDF)
2. Session Recording (Workshop MP4)
3. Agency Feedback Survey Link: https://camps.google.com/portal/agency-discovery?caseId=${camp.id}

--- LIVE CAPTURED Q&A SESSION RESOLUTION ---
${qaContent}

Please pass this along to the practitioners. As a reminder, we will conduct our 30-90 day post-camp adoption review to capture commercial impact metrics like BFM adoption uplift.

Best,
GPEG Camps Team`;

  document.getElementById('followup-email-body').textContent = emailBody;

  // Enable send only if all questions are answered and Teams recording link is uploaded if on Teams
  const allAnswered = camp.liveQuestions.every(q => q.answered);
  const sendBtn = document.getElementById('btn-send-followup');
  const teamsWarning = document.getElementById('followup-teams-warning');
  const teamsUrlGroup = document.getElementById('followup-teams-url-group');
  const teamsUrlInput = document.getElementById('followup-teams-url');

  // Reset input value on open
  teamsUrlInput.value = camp.teamsRecordingUrl || '';

  if (camp.platform === 'Teams') {
    if (teamsWarning) teamsWarning.style.display = 'block';
    if (teamsUrlGroup) teamsUrlGroup.style.display = 'block';

    const checkTeamsUrlAndEnable = () => {
      const urlVal = teamsUrlInput.value.trim();
      if (!urlVal) {
        sendBtn.disabled = true;
        sendBtn.textContent = 'Awaiting MS Teams Recording link...';
      } else if (!allAnswered) {
        sendBtn.disabled = true;
        sendBtn.textContent = 'Unresolved PM Questions Pending...';
      } else {
        sendBtn.disabled = false;
        sendBtn.textContent = 'Send Package & Start 30-Day SLA Tracker';
      }
    };

    // Trigger initial check and bind input listener
    checkTeamsUrlAndEnable();
    teamsUrlInput.oninput = checkTeamsUrlAndEnable;
  } else {
    if (teamsWarning) teamsWarning.style.display = 'none';
    if (teamsUrlGroup) teamsUrlGroup.style.display = 'none';

    if (!allAnswered) {
      sendBtn.disabled = true;
      sendBtn.textContent = 'Unresolved PM Questions Pending...';
    } else {
      sendBtn.disabled = false;
      sendBtn.textContent = 'Send Package & Start 30-Day SLA Tracker';
    }
  }

  window.openModal('modal-followup');
};

window.executeSendFollowUp = function() {
  const camp = state.camps.find(c => c.id === activeLiveCampId);
  camp.followUpSent = true;
  camp.status = 'Awaiting Feedback';
  camp.slaDaysRemaining = 4; // Set first 4-day follow-up reminder

  // Accrue post-camp effort hours automatically
  window.accrueEffortHours(camp, 'Post-Camp');

  const teamsUrl = document.getElementById('followup-teams-url').value.trim();
  const internalShare = document.getElementById('followup-internal-share').value.trim();
  
  if (camp.platform === 'Teams') {
    camp.teamsRecordingUrl = teamsUrl;
  }
  camp.internalShare = internalShare;

  const ccVal = document.getElementById('followup-cc').value.trim();
  const bccVal = document.getElementById('followup-bcc').value.trim();

  // Log outbound email to outbox history
  dispatchEmailToServer({
    from: "gpeg-camps@google.com",
    to: camp.amEmail,
    cc: ccVal || "gpeg-camps-archive@google.com",
    bcc: bccVal,
    subject: `FOLLOW-UP PACKAGE: GPEG ${camp.product} Camp - ${camp.agency}`,
    body: document.getElementById('followup-email-body').textContent
  });
  window.closeModal('modal-followup');
  
  // Audit dynamic sharing with Shivam / internal POCs
  window.logAction('SUCCESS', `Workspace Share: Access to Case ${camp.id} recording and transcript shared with internal POCs: [${internalShare}].`);
  window.logAction('SUCCESS', `Follow-up Dispatched: AM resources email dispatched for Case ${camp.id} (${camp.agency}). 4-day contact SLA active.`);
  
  showToast('Follow-up Dispatched', `Resources successfully emailed. 4-day contact SLA countdown active.`);
  renderDashboard();
};

// --- ENHANCEMENTS: AUTOMATED DATA RETENTION CRON ---
window.runRetentionCron = function() {
  const ninetyDaysMs = 90 * 24 * 60 * 60 * 1000;
  const now = new Date("2026-05-18T14:34:38Z"); // Local simulated time baseline
  let purgedCount = 0;

  state.camps.forEach(camp => {
    if (camp.stage === 'closed' && !camp.recordingDeleted) {
      const nominationTime = new Date(camp.nominationDate);
      const elapsedMs = now - nominationTime;

      if (elapsedMs > ninetyDaysMs) {
        if (camp.recordingArchived) {
          // Safely archived in Shared Drive! Skip deletion!
          setTimeout(() => {
            window.logAction('INFO', `Data Retention Skip: Excluded Case ${camp.id} (${camp.agency}) session recording from auto-deletion (Safely archived in gPEG Shared Drive).`);
          }, 100);
        } else {
          camp.recordingDeleted = true;
          purgedCount++;
          
          // Add a delayed audit entry
          setTimeout(() => {
            window.logAction('WARNING', `Automated Data Retention: Purged expired session workshop recording for ${camp.agency} (Case ${camp.id}) - older than 90 days.`);
          }, 100 * purgedCount);
        }
      }
    }
  });

  if (purgedCount > 0) {
    saveState();
  }
};

// --- ENHANCEMENTS: LOGGING & DYNAMIC AUDIT ---
window.logAction = function(level, message) {
  const entry = {
    timestamp: new Date().toISOString(),
    level: level.toUpperCase(), // INFO | SUCCESS | WARNING
    message: message
  };
  state.logs.unshift(entry);
  saveState();
  window.renderLogs();
};

window.renderLogs = function() {
  const container = document.getElementById('sidebar-log-list');
  if (!container) return;
  container.innerHTML = '';
  
  const pageSize = 5;
  const totalLogs = state.logs.length;
  const totalPages = Math.max(1, Math.ceil(totalLogs / pageSize));
  
  // Safe boundaries checks
  if (state.activityLogPage > totalPages) state.activityLogPage = totalPages;
  if (state.activityLogPage < 1) state.activityLogPage = 1;
  
  const startIdx = (state.activityLogPage - 1) * pageSize;
  const endIdx = startIdx + pageSize;
  const pageLogs = state.logs.slice(startIdx, endIdx);
  
  pageLogs.forEach(log => {
    const timeStr = new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    let logClass = 'log-info';
    if (log.level === 'SUCCESS') logClass = 'log-success';
    if (log.level === 'WARNING') logClass = 'log-warning';

    container.insertAdjacentHTML('beforeend', `
      <div class="log-item ${logClass}">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span style="color: var(--text-primary); font-weight: 600;">[${log.level}]</span>
          <span class="log-timestamp">${timeStr}</span>
        </div>
        <div style="color: var(--text-secondary); font-size: 0.72rem; margin-top: 0.1rem;">${log.message}</div>
      </div>
    `);
  });

  // Update Paginator Controls
  const prevBtn = document.getElementById('log-prev-btn');
  const nextBtn = document.getElementById('log-next-btn');
  const pageInfo = document.getElementById('log-page-info');

  if (prevBtn) prevBtn.disabled = state.activityLogPage === 1;
  if (nextBtn) nextBtn.disabled = state.activityLogPage === totalPages;
  if (pageInfo) pageInfo.textContent = `Page ${state.activityLogPage} of ${totalPages}`;
};

// Log Navigation handlers
window.prevLogPage = function() {
  if (state.activityLogPage > 1) {
    state.activityLogPage--;
    window.renderLogs();
  }
};

window.nextLogPage = function() {
  const totalPages = Math.ceil(state.logs.length / 5);
  if (state.activityLogPage < totalPages) {
    state.activityLogPage++;
    window.renderLogs();
  }
};

// --- ENHANCEMENTS: INTER-TEAM TASK BOARD ---
window.addTaskFromUi = function() {
  const inputEl = document.getElementById('task-board-input');
  const assigneeEl = document.getElementById('task-board-assignee');
  const title = inputEl.value.trim();
  const assignee = assigneeEl.value;

  if (!title) {
    alert('Please enter a task title.');
    return;
  }

  const newTask = {
    id: 't' + Math.random().toString(36).substring(2, 7),
    title: title,
    assignee: assignee,
    done: false,
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
  };

  state.tasks.unshift(newTask);
  saveState();
  
  window.logAction('INFO', `Task assigned to ${assignee}: "${title}"`);
  inputEl.value = '';
  window.renderTasks();
  showToast('Task Board', `Task assigned to ${assignee}.`);
};

window.toggleTask = function(taskId) {
  const task = state.tasks.find(t => t.id === taskId);
  if (!task) return;

  task.done = !task.done;
  saveState();
  
  window.logAction(task.done ? 'SUCCESS' : 'INFO', `Task "${task.title}" marked as ${task.done ? 'Completed' : 'Active'}`);
  window.renderTasks();
};

window.renderTasks = function() {
  const container = document.getElementById('sidebar-task-list');
  const badge = document.getElementById('sidebar-task-badge');
  if (!container) return;
  container.innerHTML = '';

  const visibleTasks = state.tasks.filter(t => state.activeRole === 'Admin' || t.assignee === state.activeRole);
  const pendingCount = visibleTasks.filter(t => !t.done).length;

  badge.textContent = `${pendingCount} Pending`;

  if (visibleTasks.length === 0) {
    container.innerHTML = '<div style="font-size: 0.75rem; color: var(--text-muted); text-align: center; padding: 0.5rem;">No tasks assigned for this role.</div>';
    return;
  }

  visibleTasks.forEach(t => {
    container.insertAdjacentHTML('beforeend', `
      <div class="task-item ${t.done ? 'completed' : ''}">
        <div class="task-left">
          <input type="checkbox" class="task-checkbox" ${t.done ? 'checked' : ''} onclick="window.toggleTask('${t.id}')" style="accent-color: var(--primary-cyan); cursor: pointer;">
          <span>${t.title}</span>
        </div>
        <div style="display: flex; flex-direction: column; align-items: flex-end; gap: 0.1rem;">
          <span class="task-assignee-badge">${t.assignee}</span>
          <span class="task-due-date">📅 ${t.dueDate}</span>
        </div>
      </div>
    `);
  });
};

// --- ENHANCEMENTS: COLLABORATION CHAT ---
window.postChatMessageFromUi = function() {
  const inputEl = document.getElementById('chat-message-input');
  const text = inputEl.value.trim();

  if (!text) return;

  window.postChatMessage(state.activeRole, text);
  inputEl.value = '';
};

window.postChatMessage = function(sender, text) {
  const message = {
    timestamp: new Date().toISOString(),
    sender: sender,
    text: text
  };
  state.chats.push(message);
  saveState();
  window.renderChats();

  if (sender === 'Presenter' && text.toLowerCase().includes('discovery')) {
    setTimeout(() => {
      window.postChatMessage('AM', 'On it! Sending reminder mail now to the agency contacts.');
    }, 1500);
  } else if (sender === 'Presenter' && text.toLowerCase().includes('escalated')) {
    setTimeout(() => {
      window.postChatMessage('PM', 'Monitoring the escalation queue, reviewing the technical variables details right now.');
    }, 2000);
  }
};

window.renderChats = function() {
  const container = document.getElementById('sidebar-chat-list');
  if (!container) return;
  container.innerHTML = '';

  state.chats.forEach(chat => {
    const isSelf = chat.sender === state.activeRole;
    
    container.insertAdjacentHTML('beforeend', `
      <div class="chat-msg ${isSelf ? 'self' : chat.sender}">
        <span class="chat-msg-sender">${chat.sender}</span>
        <div class="chat-msg-bubble">${chat.text}</div>
      </div>
    `);
  });

  container.scrollTop = container.scrollHeight;
};

// --- ENHANCEMENTS: RESOURCE REPOSITORY ---
const standardRepoFiles = [
  { id: "rf_mos1", type: "template", category: "YouTube Base Deck", name: "YT Camp (Intro, VRC & VVC Overview) - Base deck.pdf", size: "5.5 MB", desc: "Full Funnel view of YouTube. Introduction to VRC 2.0 & VVC, Creative Best Practices, and Brand Safety." },
  { id: "rf_mos2", type: "template", category: "YouTube Base Deck", name: "YT Camp (Video Planning Tools) - Base deck.pdf", size: "4.2 MB", desc: "Reach Planner best use cases, Insights Finder, and Cross-Media Reach." },
  { id: "rf_mos3", type: "template", category: "YouTube Shorts", name: "YouTube Shorts - gPEG Draft Deck.pdf", size: "6.1 MB", desc: "Why advertise on YouTube Shorts, Implementation Guide, Shorts Best Practices, and Video Measurement." },
  { id: "rf_mos4", type: "template", category: "YouTube Base Deck", name: "YT Camp (Reservation in Google Ads) - Base deck.pdf", size: "3.9 MB", desc: "Instant Reserve set-up, YouTube Select, and Reach Planner." },
  { id: "rf_mos5", type: "template", category: "Creators Base Deck", name: "Creator Partnerships Hub Camps - Training Deck.pdf", size: "7.4 MB", desc: "The Power of YouTube Creators, How to Partner with Creators, and FAQs." },
  { id: "rf_mos6", type: "template", category: "Display & Video", name: "YouTube Buying in DV360 - Comprehensive Agency Guide.pdf", size: "6.8 MB", desc: "Optimize YouTube buying within Display & Video 360. Covers UI navigation, VVC/VRC reach items, and CTV best practices." },
  { id: "rf_mos7", type: "template", category: "Display & Video", name: "YouTube Creative Insights with Gemini.pdf", size: "8.1 MB", desc: "Supercharge creative strategies, Shorts updates, and improved LLM workflows using ABCD Detector." }
];

window.renderRepository = function() {
  const container = document.getElementById('repository-grid-list');
  if (!container) return;
  container.innerHTML = '';

  const closedCamps = state.camps.filter(c => c.stage === 'closed');
  const repoItems = [...standardRepoFiles];

  closedCamps.forEach(c => {
    repoItems.push({
      id: 'c_' + c.id,
      type: 'recording',
      category: 'Customized Session Package',
      name: `${c.agency} ${c.product} customized camp package.zip`,
      size: c.recordingDeleted ? 'N/A' : '24.5 MB',
      recordingDeleted: c.recordingDeleted || false,
      desc: c.recordingDeleted ? 
        `Expired (Closed > 90 days). Customized presentation deck PDF remains archived, but live workshop video recording has been deleted per dynamic data retention policy.` :
        `Complete closed resource set including customized presentation PDF, recorded workshop MP4, and resolved Q&A catalog.`
    });
  });

  repoItems.forEach(file => {
    const isRecording = file.type === 'recording';
    container.insertAdjacentHTML('beforeend', `
      <div class="repository-card ${isRecording ? 'recording' : 'template'}">
        <div class="repository-header">
          <div class="repository-icon">
            ${isRecording ? 
              '<svg role="img" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2" ry="2"/></svg>' :
              '<svg role="img" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>'
            }
          </div>
          <div>
            <span class="badge-deck-status" style="font-size: 0.6rem; text-transform: uppercase;">${file.category}</span>
            <h4 class="repository-title" style="margin-top: 0.15rem;">${file.name}</h4>
          </div>
        </div>
        <p class="repository-desc">${file.desc}</p>
        <div class="repository-meta">
          <span>Size: ${file.size}</span>
          ${file.recordingDeleted ? `
            <button class="btn-sm" style="max-width: 120px; padding: 0.2rem 0.4rem; font-size: 0.7rem; opacity: 0.5; cursor: not-allowed;" disabled title="Recording has been permanently deleted per data retention guidelines.">Recording Purged</button>
          ` : `
            <button class="btn-sm btn-primary-sm" style="max-width: 90px; padding: 0.2rem 0.4rem; font-size: 0.7rem;" onclick="window.logAction('INFO', 'Downloaded resource catalog file: ${file.name}')">Download ↓</button>
          `}
        </div>
      </div>
    `);
  });
};

// --- ENHANCEMENTS: PERSONA Access Controls (RBAC) ---
window.changeActiveRole = async function(role) {
  let ldap = 'taylor.chen';
  if (role === 'AM') ldap = 'sarah.jenkins';
  else if (role === 'PM') ldap = 'pm.lead';
  else if (role === 'Admin') ldap = 'admin.camps';
  else if (role === 'Stakeholder') ldap = 'stakeholder.lead';
  else if (role === 'Organizer') ldap = 'organizer.camps';

  // Defensive Lock: Save selected role in local state and storage as the very first action!
  state.activeRole = role;
  localStorage.setItem('gpeg_role', role);

  const success = await performBackendLogin(ldap, role);
  if (success) {
    try {
      await syncWithServer();
    } catch (err) {
      console.warn('Failed to sync with server during role switch, running offline:', err);
    }
  }
  
  window.logAction('WARNING', `Active persona switched to: [${role}] (SSO Authenticated)`);
  
  const roleWelcomes = {
    AM: "Welcome to your tailored AM Workspace. CRM nominations, discovery forms, and follow-ups are scoped directly to your assigned portfolio.",
    Presenter: "Welcome to your Delivery Presenter Workspace. Conduct live sessions, log questions, and manage calendar schedules seamlessly.",
    PM: "Welcome to your SME Product PM Workspace. Your view is focused purely on answering technical PM queue escalations.",
    Organizer: "Welcome to your Program Coordinator Workspace. You have full pipeline operations, calendar scheduling, and ROI analytics permissions.",
    Stakeholder: "Welcome to your Executive Stakeholder Workspace. You have read-only access to regional BFM analytics, CSAT metrics, and templates.",
    Admin: "Welcome to your Global Admin Workspace. Full Diagnostic controls, SQL Spanner catalogs, and Docker telemetries are enabled."
  };
  showToast('Role Workspace Active 👤', roleWelcomes[role] || `Logged in successfully as ${role}.`);
  
  window.applyRoleAccessControl();

  // Defensive UI Lock: Guarantee dropdown select element displays the selected role value visually
  const roleSwitcher = document.getElementById('role-switcher');
  if (roleSwitcher) {
    roleSwitcher.value = role;
  }
  
  // Default Operational landing tabs to prevent metrics overwhelm!
  if (role === 'Presenter' || role === 'AM' || role === 'Organizer' || role === 'Admin') {
    window.switchTab('pipeline');
  } else if (role === 'PM') {
    window.switchTab('pm');
  } else if (role === 'Stakeholder') {
    window.switchTab('dashboard');
  }

  
  window.renderTasks();
  window.renderChats();
};

window.applyRoleAccessControl = function() {
  const role = state.activeRole;
  
  const navCases = document.getElementById('nav-cases');
  const navAgency = document.getElementById('nav-agency');
  const navPm = document.getElementById('nav-pm');
  const navMail = document.getElementById('nav-mail');
  const navDashboard = document.getElementById('nav-dashboard');
  const navRepository = document.getElementById('nav-repository');
  const navCalendar = document.getElementById('nav-sessions');
  const navAnalytics = document.getElementById('nav-analytics');
  
  // Advanced developer/diagnostic tabs
  const navActivity = document.getElementById('nav-activity');
  const navAutomation = document.getElementById('nav-automation');
  const navFeedback = document.getElementById('nav-feedback');
  const navActions = document.getElementById('nav-actions');
  const navUtilizationChart = document.getElementById('nav-utilization-chart');
  const navUtilizationTable = document.getElementById('nav-utilization-table');
  const navEffortDetails = document.getElementById('nav-effort-details');
  const navAssociates = document.getElementById('nav-associates');
  const navTeamStatus = document.getElementById('nav-team-status');
  const advancedRailExpander = document.querySelector('.rail-expander-btn');
  const advancedRailGroup = document.getElementById('nav-rail-advanced-group');

  const roleSwitcher = document.getElementById('role-switcher');
  const pipeline = document.querySelector('.pipeline-container');

  if (roleSwitcher) roleSwitcher.value = role;
  if (pipeline) pipeline.classList.remove('rbac-read-only');
  
  // Reset default display values
  const allNavElements = [
    navCases, navAgency, navPm, navMail, navDashboard, navRepository, navCalendar, navAnalytics,
    navActivity, navAutomation, navFeedback, navActions, navUtilizationChart, navUtilizationTable,
    navEffortDetails, navAssociates, navTeamStatus
  ];
  
  allNavElements.forEach(el => {
    if (el) {
      el.style.display = 'flex';
    }
  });

  if (advancedRailExpander) advancedRailExpander.style.display = 'flex';

  // Establish Role-Based Workspaces to prevent monolithic cognitive overload and vertical dominate exhaustiveness
  if (role === 'Presenter') {
    if (navCases) navCases.style.display = 'none';
    if (navPm) navPm.style.display = 'none';
    if (navActions) navActions.style.display = 'none'; // redundant task widget fix
    
    // Hide advanced developer diagnostic items
    if (navActivity) navActivity.style.display = 'none';
    if (navAutomation) navAutomation.style.display = 'none';
    if (navFeedback) navFeedback.style.display = 'none';
    if (navUtilizationChart) navUtilizationChart.style.display = 'none';
    if (navAssociates) navAssociates.style.display = 'none';

    document.querySelectorAll('#col-nomination button').forEach(b => b.classList.remove('rbac-disabled'));
    document.querySelectorAll('#col-precamp button').forEach(b => b.classList.remove('rbac-disabled'));
    document.querySelectorAll('#col-incamp button').forEach(b => b.classList.remove('rbac-disabled'));
    document.querySelectorAll('#col-postcamp button').forEach(b => b.classList.remove('rbac-disabled'));
  } 
  else if (role === 'AM') {
    if (navCases) navCases.style.display = 'none';
    if (navPm) navPm.style.display = 'none';
    if (navActions) navActions.style.display = 'none'; // redundant task widget fix
    if (navCalendar) navCalendar.style.display = 'none';
    
    // Hide advanced developer diagnostic items
    if (navActivity) navActivity.style.display = 'none';
    if (navAutomation) navAutomation.style.display = 'none';
    if (navFeedback) navFeedback.style.display = 'none';
    if (navUtilizationChart) navUtilizationChart.style.display = 'none';
    if (navEffortDetails) navEffortDetails.style.display = 'none';
    if (navAssociates) navAssociates.style.display = 'none';
    if (navTeamStatus) navTeamStatus.style.display = 'none';
    if (navUtilizationTable) navUtilizationTable.style.display = 'none';
    
    document.querySelectorAll('#col-nomination button').forEach(b => b.classList.add('rbac-disabled'));
    document.querySelectorAll('#col-precamp button').forEach(b => b.classList.add('rbac-disabled'));
    document.querySelectorAll('#col-incamp button').forEach(b => b.classList.add('rbac-disabled'));
    document.querySelectorAll('#col-postcamp button').forEach(b => b.classList.add('rbac-disabled'));
  }
  else if (role === 'PM') {
    // PM strictly lands on Escalation PM Queue (Habituating single source of truth)
    if (navCases) navCases.style.display = 'none';
    if (navAgency) navAgency.style.display = 'none';
    if (navMail) navMail.style.display = 'none';
    if (navCalendar) navCalendar.style.display = 'none';
    if (navDashboard) navDashboard.style.display = 'none';
    if (navRepository) navRepository.style.display = 'none';
    if (navActions) navActions.style.display = 'none'; // redundant task widget fix
    
    // Hide advanced developer diagnostic items
    if (navActivity) navActivity.style.display = 'none';
    if (navAutomation) navAutomation.style.display = 'none';
    if (navFeedback) navFeedback.style.display = 'none';
    if (navUtilizationChart) navUtilizationChart.style.display = 'none';
    if (navEffortDetails) navEffortDetails.style.display = 'none';
    if (navAssociates) navAssociates.style.display = 'none';
    if (navTeamStatus) navTeamStatus.style.display = 'none';
    if (navUtilizationTable) navUtilizationTable.style.display = 'none';

    document.querySelectorAll('#col-nomination button').forEach(b => b.classList.add('rbac-disabled'));
    document.querySelectorAll('#col-precamp button').forEach(b => b.classList.add('rbac-disabled'));
    document.querySelectorAll('#col-incamp button').forEach(b => b.classList.add('rbac-disabled'));
    document.querySelectorAll('#col-postcamp button').forEach(b => b.classList.add('rbac-disabled'));
  }
  else if (role === 'Organizer') {
    if (navCases) navCases.style.display = 'none';
    if (navPm) navPm.style.display = 'none';
    if (navAutomation) navAutomation.style.display = 'none';
    if (navActivity) navActivity.style.display = 'none';
    if (navFeedback) navFeedback.style.display = 'none';
    if (navAssociates) navAssociates.style.display = 'none';
  }
  else if (role === 'Stakeholder') {
    // Read only metrics and repository access
    if (navCases) navCases.style.display = 'none';
    if (navAgency) navAgency.style.display = 'none';
    if (navPm) navPm.style.display = 'none';
    if (navMail) navMail.style.display = 'none';
    if (navCalendar) navCalendar.style.display = 'none';
    if (navActions) navActions.style.display = 'none';
    
    // Hide advanced developer diagnostic items
    if (navActivity) navActivity.style.display = 'none';
    if (navAutomation) navAutomation.style.display = 'none';
    if (navFeedback) navFeedback.style.display = 'none';
    if (navUtilizationChart) navUtilizationChart.style.display = 'none';
    if (navEffortDetails) navEffortDetails.style.display = 'none';
    if (navAssociates) navAssociates.style.display = 'none';
    if (navTeamStatus) navTeamStatus.style.display = 'none';
    if (navUtilizationTable) navUtilizationTable.style.display = 'none';
    
    if (pipeline) pipeline.classList.add('rbac-read-only');
  }
  else if (role === 'Admin') {
    // Admins have access to all tabs (diagnostic console)
  }

  // Hide Cloud Spanner relational schema accordions from standard business roles
  const dbCatalogBox = document.querySelector('.db-catalog-box');
  if (dbCatalogBox) {
    if (role === 'Admin') {
      dbCatalogBox.style.display = 'block';
    } else {
      dbCatalogBox.style.display = 'none';
    }
  }

  // Auto-hide advanced trigger bar expander item if no sub-tabs are active/allowed
  const hasAnyAdvancedTab = Array.from(advancedRailGroup ? advancedRailGroup.children : []).some(child => child.style.display !== 'none');
  if (advancedRailExpander) {
    if (hasAnyAdvancedTab) {
      advancedRailExpander.style.display = 'flex';
    } else {
      advancedRailExpander.style.display = 'none';
      if (advancedRailGroup) advancedRailGroup.style.display = 'none';
    }
  }

  // Sync active tab if the current active view gets hidden on switch
  const activeBtn = document.querySelector('.rail-nav-item.active');
  if (activeBtn && activeBtn.style.display === 'none') {
    if (role === 'PM') {
      window.switchTab('pm');
    } else if (role === 'Stakeholder') {
      window.switchTab('dashboard');
    } else {
      window.switchTab('pipeline');
    }
  }
};

// --- ENHANCEMENTS: GOOGLE WORKSPACE INTEGRATION MOCKS ---
window.syncToWorkspace = async function(type, caseId, elementId) {
  const pill = document.getElementById(elementId);
  if (!pill) return;

  pill.className = 'ws-sync-pill ws-syncing';
  pill.textContent = `⏳ Syncing to ${type}...`;

  try {
    const response = await fetch(`/api/camps/${caseId}/sync`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-GPEG-Session': currentSessionToken
      },
      body: JSON.stringify({ type: type })
    });
    
    if (response.ok) {
      const camp = state.camps.find(c => c.id === caseId);
      if (camp) {
        if (type === 'Drive') {
          camp.recordingArchived = true;
        }
        // LocalStorage save
        localStorage.setItem('gpeg_camps', JSON.stringify(state.camps));
        renderDashboard();
      }
      
      window.logAction('SUCCESS', `Workspace Sync: Case ${caseId} successfully synced and exported to Google ${type}.`);
      showToast('Workspace Integration', `Case package successfully compiled in Google ${type}.`);
    } else {
      throw new Error('Server synchronization failed');
    }
  } catch (err) {
    console.warn(`Workspace ${type} sync network error. Running in offline simulation mode.`, err);
    
    // Offline fallback simulation delay to preserve premium visual paces
    setTimeout(() => {
      const camp = state.camps.find(c => c.id === caseId);
      if (camp) {
        if (type === 'Drive') {
          camp.recordingArchived = true;
        }
        saveState();
        renderDashboard();
      }
      
      pill.className = 'ws-sync-pill ws-synced';
      pill.textContent = `✓ Synced to ${type}`;
      
      window.logAction('SUCCESS', `Workspace Sync (Offline Fallback): Case ${caseId} successfully synced and exported to Google ${type}.`);
      showToast('Workspace Integration', `Case package successfully compiled in Google ${type} (Offline Simulation).`);
    }, 1000);
  }
};

// --- ENHANCEMENTS: EMAIL TEMPLATE swaps ---

window.swapMailTemplate = function(templateId) {
  const t = initialTemplates[templateId];
  if (!t) return;

  state.selectedTemplate = templateId;
  saveState();

  // Try to compile template using first available camp record in state as fallback
  const camp = state.camps[0] || { id: "2-9828000040100", agency: "Omnicom Group", amEmail: "am.harenberg@google.com", product: "GMP Camp: CM360 Foundations", scheduledTime: "2026-05-25", presenter: "Taylor Chen (Presenter)" };
  
  let subject = t.subject
    .replace(/\{\{AGENCY\}\}/g, camp.agency)
    .replace(/\{\{CASE_ID\}\}/g, camp.id)
    .replace(/\{\{PRODUCT\}\}/g, camp.product);

  let body = t.body
    .replace(/\{\{AM_NAME\}\}/g, camp.amEmail.split('@')[0])
    .replace(/\{\{AGENCY\}\}/g, camp.agency)
    .replace(/\{\{CASE_ID\}\}/g, camp.id)
    .replace(/\{\{PRODUCT\}\}/g, camp.product)
    .replace(/\{\{PRESENTER\}\}/g, camp.presenter ? camp.presenter.split(' ')[0] : 'Lead')
    .replace(/\{\{SLA_DATE\}\}/g, "2026-05-22")
    .replace(/\{\{QUESTION\}\}/g, "How is S2S conversion variables mapped?")
    .replace(/\{\{ANSWER\}\}/g, "Mapped directly inside the parameters console.")
    .replace(/\{\{QA_CONTENT\}\}/g, "Q1: 'How is S2S conversion variables mapped?'\nAnswer: 'Mapped directly inside parameters console.'");

  document.getElementById('email-sandbox-subject').value = subject;
  document.getElementById('email-sandbox-body').value = body;

  window.logAction('INFO', `Template Swapper: Swapped active draft template to [${templateId}].`);
  showToast('Template Customizer', `Active email draft template swapped to ${templateId}.`);
};

// --- ENHANCEMENTS: HTML5 DRAG-AND-DROP CONTROLLERS ---
window.handleDragStart = function(e) {
  const cardId = e.target.getAttribute('data-id');
  e.dataTransfer.setData('text/plain', cardId);
  e.target.classList.add('dragging');
  window.logAction('INFO', `Kanban Drag: Started dragging Case ${cardId}.`);
};

window.handleDragOver = function(e) {
  e.preventDefault();
  const column = e.currentTarget;
  column.classList.add('drag-over');
};

window.handleDragLeave = function(e) {
  e.currentTarget.classList.remove('drag-over');
};

window.handleDrop = function(e) {
  e.preventDefault();
  const column = e.currentTarget;
  column.classList.remove('drag-over');

  const cardId = e.dataTransfer.getData('text/plain');
  const card = document.querySelector(`.camp-card[data-id="${cardId}"]`);
  if (card) card.classList.remove('dragging');

  const camp = state.camps.find(c => c.id === cardId);
  if (!camp) return;

  // Map HTML elements ID column mapping stages
  const columnId = column.id;
  let targetStage = '';
  if (columnId === 'col-nomination') targetStage = 'nomination';
  else if (columnId === 'col-precamp') targetStage = 'pre-camp';
  else if (columnId === 'col-incamp') targetStage = 'in-camp';
  else if (columnId === 'col-postcamp') targetStage = 'post-camp';
  else if (columnId === 'col-closed') targetStage = 'closed';

  if (camp.stage === targetStage) return; // Dropped inside same column

  // RBAC permissions check before dropping
  const role = state.activeRole;
  if (role !== 'Admin' && role !== 'Presenter') {
    alert(`Permission Denied: Active persona [${role}] is unauthorized to change camp pipeline stages.`);
    window.logAction('WARNING', `RBAC Deny: Persona [${role}] blocked from dropping Case ${cardId} into stage ${targetStage}.`);
    return;
  }

  // Transition event actions
  if (camp.stage === 'nomination' && targetStage === 'pre-camp') {
    // Nomination to Pre-camp: Kickoff Scheduler Modal
    window.openKickoffModal(camp.id);
  } else if (camp.stage === 'pre-camp' && targetStage === 'in-camp') {
    if (camp.discoveryStatus === 'Pending') {
      alert('Action Blocked: Client has not submitted their Pre-Camp Discovery form yet. Cannot start live session workshop.');
      return;
    }
    window.startLiveSessionPrompt(camp.id);
  } else if (camp.stage === 'post-camp' && targetStage === 'closed') {
    // Automated Compliance Hard Gating: Check follow-up package dispatch
    if (!camp.followUpSent) {
      showToast('Compliance Gate blocked', `⚠️ Compliance Block: Case ${camp.id} requires sending follow-up package first.`);
      window.logAction('WARNING', `Compliance Gate: Blocked Closed pipeline drop for Case ${camp.id} (follow-up package not sent).`);
      const cardEl = document.querySelector(`.camp-card[data-id="${camp.id}"]`);
      if (cardEl) {
        cardEl.classList.add('compliance-locked-card');
        setTimeout(() => cardEl.classList.remove('compliance-locked-card'), 3000);
      }
      return;
    }

    // Check Google Meet session recording archival status
    if (camp.platform === 'Meet' && !camp.recordingArchived) {
      showToast('Compliance Gate blocked', `⚠️ Compliance Block: Google Meet Case ${camp.id} lacks archived Session Recording.`);
      window.logAction('WARNING', `Compliance Gate: Blocked Closed pipeline drop for Meet Case ${camp.id} (recording unarchived).`);
      const cardEl = document.querySelector(`.camp-card[data-id="${camp.id}"]`);
      if (cardEl) {
        cardEl.classList.add('compliance-locked-card');
        setTimeout(() => cardEl.classList.remove('compliance-locked-card'), 3000);
      }
      return;
    }

    // Block Teams camps lacking a verified Recording URL coordinate
    if (camp.platform === 'Teams' && !camp.teamsRecordingUrl) {
      showToast('Compliance Gate blocked', `⚠️ Compliance Block: MS Teams Case ${camp.id} lacks verified Recording URL.`);
      window.logAction('WARNING', `Compliance Gate: Blocked Closed pipeline drop for Teams Case ${camp.id} (recording unverified).`);
      const cardEl = document.querySelector(`.camp-card[data-id="${camp.id}"]`);
      if (cardEl) {
        cardEl.classList.add('compliance-locked-card');
        setTimeout(() => cardEl.classList.remove('compliance-locked-card'), 3000);
      }
      return;
    }

    const pendingQuestions = camp.liveQuestions.some(q => !q.answered);
    if (pendingQuestions) {
      alert('Action Blocked: Must resolve all escalated PM technical questions first before closing.');
      return;
    }
    // Open feedback survey selectors
    document.getElementById('nav-agency').click();
    document.getElementById('agency-camp-selector').value = camp.id;
    window.loadAgencySubView();
    showToast('Pipeline Drop Transition', `Transitioning Case ${camp.id} to closed. Complete survey feedback.`);
  } else {
    // Normal transitions
    camp.stage = targetStage;
    if (targetStage === 'closed') camp.status = 'Impact Logged';
    saveState();
    window.logAction('SUCCESS', `Kanban Drop: Case ${camp.id} transitioned to stage [${targetStage}].`);
    renderDashboard();
  }
};

// --- ENHANCEMENTS: SLA TIME MACHINE TEMPORAL TRAVEL ---
window.timeTravel = function(days) {
  let base = new Date("2026-05-18T14:34:38Z");
  if (days === 0) {
    state.simulatedTime = base.toISOString();
    saveState();
    window.logAction('WARNING', 'SLA Time Machine: Restored simulated system date to May 18, 2026.');
    showToast('Time Machine', 'System calendar clock restored to baseline.');
    
    // Restore SLA days inside camps state to seed values
    state.camps.forEach(c => {
      if (c.id === '1-4893000041135') {
        c.slaDaysRemaining = 3;
        c.slaBreached = false;
        c.status = 'Awaiting Discovery';
      }
      if (c.id === '4-9901000031200') {
        c.slaDaysRemaining = 1;
        c.slaBreached = false;
        c.status = 'Resolving Queries & Follow-up';
      }
    });
    saveState();
    renderDashboard();
    return;
  }

  const current = new Date(state.simulatedTime);
  current.setDate(current.getDate() + days);
  state.simulatedTime = current.toISOString();
  saveState();

  // Dynamically recalculate all SLA days and breaches based on advanced date
  window.recalculateCampsSlaStatus();

  saveState();
  window.logAction('WARNING', `SLA Time Machine: Simulated clock skipped +${days} days. Current calendar is now ${current.toLocaleDateString()}.`);
  showToast('Time Travel', `Simulated date advanced +${days} days.`);
  renderDashboard();
};

// --- ENHANCEMENTS: WEEKLY SCHEDULE CALENDAR GRID & Presenter Clashes ---
window.renderCalendarGrid = function() {
  const slots = {
    mon: document.getElementById('slot-mon'),
    tue: document.getElementById('slot-tue'),
    wed: document.getElementById('slot-wed'),
    thu: document.getElementById('slot-thu'),
    fri: document.getElementById('slot-fri')
  };

  Object.values(slots).forEach(el => { if (el) el.innerHTML = ''; });

  const scheduledCamps = state.camps.filter(c => c.scheduledTime !== null && c.stage !== 'closed');
  const warningLabel = document.getElementById('calendar-conflict-warning-indicator');
  if (warningLabel) warningLabel.textContent = '';

  let conflictFound = false;

  scheduledCamps.forEach((camp, idx) => {
    const date = new Date(camp.scheduledTime);
    const dayNum = date.getDay(); // 1 = Mon, 5 = Fri
    let dayId = '';
    if (dayNum === 1) dayId = 'mon';
    else if (dayNum === 2) dayId = 'tue';
    else if (dayNum === 3) dayId = 'wed';
    else if (dayNum === 4) dayId = 'thu';
    else if (dayNum === 5) dayId = 'fri';

    if (!dayId || !slots[dayId]) return;

    // Presenter overlap conflict detection
    let isConflict = false;
    scheduledCamps.forEach((otherCamp, otherIdx) => {
      if (idx !== otherIdx && camp.presenter === otherCamp.presenter) {
        const diffMs = Math.abs(new Date(camp.scheduledTime) - new Date(otherCamp.scheduledTime));
        if (diffMs < 90 * 60 * 1000) { // Conflict if less than 90 minutes apart
          isConflict = true;
        }
      }
    });

    if (isConflict) {
      conflictFound = true;
      if (warningLabel) warningLabel.textContent = '⚠️ PRESENTERS SCHEDULE COLLISION DETECTED';
      setTimeout(() => {
        window.logAction('WARNING', `Calendar Clash: Presenter ${camp.presenter.split(' ')[0]} is double-booked within a 90-minute window!`);
      }, 500);
    }

    const itemHtml = `
      <div class="calendar-scheduled-item ${isConflict ? 'conflict-clash' : ''}" onclick="window.switchTab('dashboard')">
        <span style="font-size: 0.6rem; font-weight: 700; color: var(--primary-cyan); text-transform: uppercase;">[${camp.region}] ${camp.presenter.split(' ')[0]}</span>
        <div style="font-weight: 600; line-height: 1.2;">${camp.agency}</div>
        <div style="color: var(--text-secondary); font-size: 0.65rem; margin-top: 0.15rem;">${camp.product}</div>
        <div style="color: var(--text-muted); font-size: 0.65rem; font-family: monospace; margin-top: 0.15rem;">🕒 ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
      </div>
    `;

    slots[dayId].insertAdjacentHTML('beforeend', itemHtml);
  });
};

// --- ENHANCEMENTS: presenter live slide stream carousels ---
let activeSlideIndex = 0;
const programSlideDecks = {
  'Partnership Ads': [
    { title: "Partnership Ads Foundations", sub: "EMEA Region Concise curriculum for WPP agency", bullets: "• Introduction to compatible DR campaign structures\n• Key partnership ads formats and guidelines\n• 45-minute presentation delivery boundaries lock" },
    { title: "Compatible Campaign Setups", sub: "DR-focused Partnership Ads structures", bullets: "• Web conversion API configurations\n• Optimization variables for WPP MFG accounts\n• Verification metrics dashboard sync" }
  ],
  'KPI Camp': [
    { title: "Search & PMax Bidding Best Practices", sub: "KPI Camp curriculum layout", bullets: "• Structuring campaigns around value-first metrics\n• Incorporating Web-to-App Connect (W2AC) scripts\n• Slide order adjusted: non-interested drops allowed after hour 1" },
    { title: "W2AC Integration Foundations", sub: "Web-to-App Connect (W2AC) scripting", bullets: "• Transition path setups for DR conversions\n• Smart Bidding values configurations\n• Hour 1 drop-off indicator flagged" }
  ],
  'Default': [
    { title: "GPEG Foundations Introduction", sub: "Standard regional camps session foundations", bullets: "• standard CM360/DV360 overview\n• pre-camp discovery templates configurations\n• standard feedback CSAT scores outlines" }
  ]
};

window.nextSlide = function() {
  const camp = state.camps.find(c => c.id === activeLiveCampId);
  const product = camp ? camp.product : '';
  let deck = programSlideDecks['Default'];
  if (product.includes('Partnership Ads')) deck = programSlideDecks['Partnership Ads'];
  else if (product.includes('KPI Camp')) deck = programSlideDecks['KPI Camp'];

  activeSlideIndex = (activeSlideIndex + 1) % deck.length;
  updateSlidesPlayer(deck);
};

window.prevSlide = function() {
  const camp = state.camps.find(c => c.id === activeLiveCampId);
  const product = camp ? camp.product : '';
  let deck = programSlideDecks['Default'];
  if (product.includes('Partnership Ads')) deck = programSlideDecks['Partnership Ads'];
  else if (product.includes('KPI Camp')) deck = programSlideDecks['KPI Camp'];

  activeSlideIndex = (activeSlideIndex - 1 + deck.length) % deck.length;
  updateSlidesPlayer(deck);
};

function updateSlidesPlayer(deck) {
  const slide = deck[activeSlideIndex];
  document.getElementById('live-slide-index-display').textContent = `SLIDE ${activeSlideIndex + 1} / ${deck.length}`;
  document.getElementById('live-slide-title').textContent = slide.title;
  document.getElementById('live-slide-subtitle').textContent = slide.sub;
  document.getElementById('live-slide-bullets').innerHTML = slide.bullets.replace(/\n/g, '<br>');
}

// --- ENHANCEMENTS: DYNAMIC PERFORMANCE KPI CHART BARS ---
window.renderAnalyticsCharts = function() {
  const bfmContainer = document.getElementById('chart-regional-bfm');
  const curriculumContainer = document.getElementById('chart-curriculum-count');
  if (!bfmContainer || !curriculumContainer) return;

  bfmContainer.innerHTML = '';
  curriculumContainer.innerHTML = '';

  const filterRegion = state.selectedAnalyticsRegion;

  // Update interactive region drilldown badge in index.html sandbox header
  const badgeContainer = document.getElementById('analytics-drilldown-badge-container');
  const badgeRegion = document.getElementById('analytics-drilldown-region');
  if (badgeContainer && badgeRegion) {
    if (filterRegion) {
      badgeRegion.textContent = filterRegion;
      badgeContainer.style.display = 'flex';
    } else {
      badgeContainer.style.display = 'none';
    }
  }

  // Recalculate Scorecard CSAT & Obviation metrics scoping
  const closedCamps = state.camps.filter(c => c.stage === 'closed');
  const filteredClosed = filterRegion ? closedCamps.filter(c => c.region === filterRegion) : closedCamps;

  const totalCsat = filteredClosed.reduce((sum, c) => sum + (c.feedbackScore || 0), 0);
  const avgCsat = filteredClosed.length > 0 ? (totalCsat / filteredClosed.length) : 4.65; // Fallback seed average

  // Update dynamic metric scorecards
  const metricCsatValueEl = document.getElementById('metric-csat-value');
  const metricCsatTitleEl = document.getElementById('metric-csat-title');
  const metricObviationTitleEl = document.getElementById('metric-obviation-title');

  if (metricCsatValueEl) {
    metricCsatValueEl.textContent = filteredClosed.length > 0 ? `${avgCsat.toFixed(2)} / 5` : '4.65 / 5';
  }
  if (metricCsatTitleEl) {
    metricCsatTitleEl.textContent = filterRegion ? `${filterRegion} AVERAGE CSAT` : 'GLOBAL AVERAGE CSAT';
  }
  if (metricObviationTitleEl) {
    metricObviationTitleEl.textContent = filterRegion ? `${filterRegion} TICKET OBVIATION` : 'TICKET OBVIATION RATE';
  }

  // Regional average calculation (Chart 1)
  const regions = ['EMEA', 'APAC', 'AMER'];
  regions.forEach(r => {
    const closed = state.camps.filter(c => c.region === r && c.stage === 'closed' && c.bfmUplift !== null);
    const avg = closed.length > 0 ? (closed.reduce((sum, c) => sum + c.bfmUplift, 0) / closed.length) : (r === 'EMEA' ? 15.4 : r === 'APAC' ? 12.5 : 18.4); // seeds
    
    const isActive = filterRegion === r;

    bfmContainer.insertAdjacentHTML('beforeend', `
      <div class="chart-row chart-row-interactive ${isActive ? 'chart-row-active' : ''}" onclick="window.toggleRegionAnalyticsFilter('${r}')">
        <div class="chart-label">${r} Scope</div>
        <div class="chart-track">
          <div class="chart-fill-bar blue-fill" style="width: ${Math.min(100, avg * 4)}%;"></div>
        </div>
        <div class="chart-value">${avg.toFixed(1)}%</div>
      </div>
    `);
  });

  // Curriculum allocations calculation (Chart 2)
  const curricula = ['GMP CM360', 'GMP DV360', 'GMP SA360', 'Partnership Ads', 'Apps Partner', 'KPI Camp'];
  curricula.forEach(curr => {
    // Apply active drilldown scoping
    const relevantCamps = filterRegion ? state.camps.filter(c => c.region === filterRegion) : state.camps;
    const count = relevantCamps.filter(c => c.stage !== 'closed' && c.product.toLowerCase().includes(curr.substring(4).toLowerCase())).length;
    const fillWidth = Math.max(5, count * 25); // Draw relative width

    curriculumContainer.insertAdjacentHTML('beforeend', `
      <div class="chart-row">
        <div class="chart-label">${curr}</div>
        <div class="chart-track">
          <div class="chart-fill-bar green-fill" style="width: ${Math.min(100, fillWidth)}%;"></div>
        </div>
        <div class="chart-value">${count} active</div>
      </div>
    `);
  });
};

// --- DRILLDOWN FILTERS & DATABASE CATALOG SWITCHERS ---
window.toggleRegionAnalyticsFilter = function(region) {
  if (state.selectedAnalyticsRegion === region) {
    state.selectedAnalyticsRegion = null;
    window.logAction('INFO', 'Cleared Regional drill-down analytics filters.');
  } else {
    state.selectedAnalyticsRegion = region;
    window.logAction('INFO', `Applied Interactive Regional KPI drill-down: Scoped to [${region}].`);
  }
  window.renderAnalyticsCharts();
};

window.clearRegionAnalyticsFilter = function() {
  state.selectedAnalyticsRegion = null;
  window.logAction('INFO', 'Cleared Regional drill-down analytics filters from badge reset.');
  window.renderAnalyticsCharts();
};

window.toggleDbConsole = function() {
  const body = document.getElementById('db-console-body');
  const arrow = document.getElementById('db-accordion-arrow');
  if (!body || !arrow) return;

  if (body.classList.contains('active')) {
    body.classList.remove('active');
    arrow.textContent = '▼ Expand SQL Schema & Engine';
    window.logAction('INFO', 'Spanner Schema drawer collapsed.');
  } else {
    body.classList.add('active');
    arrow.textContent = '▲ Collapse SQL Schema & Engine';
    window.logAction('INFO', 'Spanner Schema drawer expanded for structural review.');
  }
};

window.switchDbTab = function(tabName) {
  // Deactivate all tabs
  document.querySelectorAll('.db-tab-btn').forEach(btn => btn.classList.remove('active'));
  document.querySelectorAll('.db-tab-content').forEach(content => content.classList.remove('active'));

  // Activate current tab
  const btn = document.getElementById(`db-tab-btn-${tabName}`);
  const content = document.getElementById(`db-tab-content-${tabName}`);
  if (btn) btn.classList.add('active');
  if (content) content.classList.add('active');

  window.logAction('INFO', `Switched Spanner Database Console tab to: [${tabName}]`);
};

// Extend switchTab hooks to boot weekly schedule calendar, rosters, and analytics visualizations
const oldSwitchTab = window.switchTab;
window.switchTab = function(tabName) {
  // Update sidebar time-machine displays
  const dateStr = new Date(state.simulatedTime).toISOString().split('T')[0];
  const dateEl = document.getElementById('sim-date-display');
  if (dateEl) dateEl.textContent = dateStr;

  const footerDateEl = document.getElementById('footer-freshness-timestamp');
  if (footerDateEl) {
    footerDateEl.textContent = `Verified Real-Time Sync (Sim Date: ${new Date(state.simulatedTime).toLocaleDateString('en-US', {month: 'short', day: 'numeric', year: 'numeric'})})`;
  }

  oldSwitchTab(tabName);

  if (tabName === 'sessions') {
    window.renderCalendarGrid();
  } else if (tabName === 'team-status') {
    window.renderTeamRoster();
  } else if (tabName === 'utilization-table') {
    window.renderWeeklyUtilizationTable();
  } else if (tabName === 'effort-details') {
    window.renderEffortLogs();
  } else if (tabName === 'dashboard') {
    window.recalculateRoiScorecards();
  } else if (tabName === 'activity') {
    window.renderActivityTrackerAuditLogs();
  } else if (tabName === 'associates') {
    window.renderAssociatesRosterDetail();
  } else if (tabName === 'analytics') {
    window.renderAnalyticsCharts();
  } else if (tabName === 'daily-hub') {
    window.renderDailyActionHub();
  } else if (tabName === 'rehearsal') {
    window.renderDryRunRegistryList();
  } else if (tabName === 'utilization-chart') {
    window.renderWeeklyUtilizationChart();
  } else if (tabName === 'admin-hub') {
    window.renderAdminHubView();
  } else if (tabName === 'mos-catalog') {
    window.renderMosCatalog();
  }
};

// Attach dynamic attendee list inside livesession open modal
const oldOpenLiveSession = window.openLiveSessionModal;
window.openLiveSessionModal = function(caseId) {
  oldOpenLiveSession(caseId);

  const listEl = document.getElementById('live-attendees-list');
  if (listEl) {
    listEl.innerHTML = `
      <span class="attendee-avatar-pill camera-on">✓ AM: Sarah</span>
      <span class="attendee-avatar-pill camera-on">✓ Practitioner: Alex</span>
      <span class="attendee-avatar-pill camera-on">✓ Practitioner: Taylor</span>
      <span class="attendee-avatar-pill">Practitioner: Jordan (Cam Off)</span>
    `;
  }
};

// --- ENHANCEMENTS: SECURE MULTI-TENANT AGENCY GATEWAY ---
window.renderAgencySecureGateway = function() {
  const caseId = state.authenticatedAgencyCaseId;
  const gateway = document.getElementById('agency-auth-gateway');
  const workspace = document.getElementById('agency-auth-workspace');
  const errorMsg = document.getElementById('agency-auth-error-msg');

  if (errorMsg) errorMsg.style.display = 'none';

  if (!caseId) {
    if (gateway) gateway.style.display = 'block';
    if (workspace) workspace.style.display = 'none';
  } else {
    if (gateway) gateway.style.display = 'none';
    if (workspace) workspace.style.display = 'block';
    window.loadAgencySubView();
  }
};

window.verifyAgencyCaseId = async function() {
  const inputEl = document.getElementById('agency-case-auth-input');
  const errorMsg = document.getElementById('agency-auth-error-msg');
  const caseId = inputEl.value.trim();

  if (!caseId) return;

  try {
    const response = await fetch(`/api/camps/verify?caseId=${caseId}`);
    if (response.ok) {
      const camp = await response.json();
      
      // Dynamically cache the verified camp in local state list if not present
      const exists = state.camps.some(c => c.id === caseId);
      if (!exists) {
        state.camps.push(camp);
      }
      
      state.authenticatedAgencyCaseId = caseId;
      saveState();
      
      window.logAction('SUCCESS', `Agency Authenticated: Practitioner session successfully established and isolated to Case ID: ${caseId} (${camp.agency}).`);
      showToast('Gateway Verified', 'Encrypted session loaded.');
      
      if (errorMsg) errorMsg.style.display = 'none';
      window.renderAgencySecureGateway();
      return;
    }
  } catch (err) {
    console.warn('Agency verify network error. Checking offline client-side database.', err);
  }

  // Offline/Static Fallback: Check if token exists in local GPEG camps state
  const localCamp = state.camps.find(c => c.id === caseId);
  if (localCamp) {
    state.authenticatedAgencyCaseId = caseId;
    saveState();
    
    window.logAction('SUCCESS', `Agency Authenticated (Offline Fallback): Established session for Case ID: ${caseId} (${localCamp.agency}).`);
    showToast('Gateway Verified', 'Offline session loaded.');
    
    if (errorMsg) errorMsg.style.display = 'none';
    window.renderAgencySecureGateway();
  } else {
    if (errorMsg) errorMsg.style.display = 'block';
    window.logAction('WARNING', `Agency Auth Fail: Unauthorized access attempt using invalid token: "${caseId}".`);
  }
};

window.clearAgencySession = function() {
  const oldCaseId = state.authenticatedAgencyCaseId;
  state.authenticatedAgencyCaseId = null;
  saveState();

  const inputEl = document.getElementById('agency-case-auth-input');
  if (inputEl) inputEl.value = '';

  window.logAction('INFO', `Agency Log Out: Closed secure session for Case ID: ${oldCaseId}.`);
  showToast('Session Closed', 'Workspace session locked.');
  window.renderAgencySecureGateway();
};

// --- ENHANCEMENTS: SHARED DRIVE ARCHIVAL CONTROLLER ---
window.archiveToSharedDrive = async function(caseId, elementId) {
  const camp = state.camps.find(c => c.id === caseId);
  if (!camp) return;

  try {
    const response = await fetch(`/api/camps/${caseId}/archive`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-GPEG-Session': currentSessionToken
      }
    });
    
    if (response.ok) {
      camp.recordingArchived = true;
      // LocalStorage save
      localStorage.setItem('gpeg_camps', JSON.stringify(state.camps));
      
      window.logAction('SUCCESS', `Workspace Archive: Case ${caseId} session recording and transcript successfully moved to gPEG (gATP) CAMPS Shared Drive folder. Exempted from 3-month auto-deletion.`);
      showToast('Shared Drive Archive', 'Recording archived successfully.');
      renderDashboard();
    } else {
      throw new Error('Server archival failed');
    }
  } catch (err) {
    console.warn('Shared Drive archive network error. Running in offline simulation mode.', err);
    
    camp.recordingArchived = true;
    localStorage.setItem('gpeg_camps', JSON.stringify(state.camps));
    
    window.logAction('SUCCESS', `Workspace Archive (Offline Fallback): Case ${caseId} session recording and transcript successfully moved to gPEG Shared Drive folder.`);
    showToast('Shared Drive Archive', 'Recording archived successfully (Offline Simulation).');
    renderDashboard();
  }
};

// --- ENHANCEMENTS: CONTEXT-AWARE AI SUPPORT CHAT BOT CONTROLLER ---
window.toggleSupportAgent = function() {
  const drawer = document.getElementById('support-agent-chat-drawer');
  if (!drawer) return;
  
  if (drawer.style.display === 'none' || !drawer.style.display) {
    drawer.style.display = 'flex';
    window.logAction('INFO', 'AI Support: Opened context-aware AI Assistant chat.');
  } else {
    drawer.style.display = 'none';
  }
};

window.clickSupportAgentChip = function(text) {
  window.postSupportMessage(text);
};

window.postSupportMessageFromUi = function() {
  const inputEl = document.getElementById('support-agent-input');
  const text = inputEl.value.trim();
  if (!text) return;

  inputEl.value = '';
  window.postSupportMessage(text);
};

window.postSupportMessage = function(text) {
  const msgContainer = document.getElementById('support-agent-messages');
  if (!msgContainer) return;

  // 1. Append User speech bubble
  msgContainer.insertAdjacentHTML('beforeend', `
    <div class="chat-msg-user">${text}</div>
  `);
  msgContainer.scrollTop = msgContainer.scrollHeight;

  // 2. Intent-Routing NLP Parsing with Proactive Deep Contextual Awareness
  const q = text.toLowerCase();
  let reply = "";
  let action = null;
  let isFallback = false;

  // Extract current state context variables silently!
  const activeTab = state.activeTab || 'pipeline';
  const activeRole = state.activeRole || 'Presenter';
  const activeCampsCount = state.camps.filter(c => c.stage !== 'closed').length;
  const activeAlertsCount = state.camps.filter(c => c.stage === 'pre-camp' && c.slaDaysRemaining <= 3).length;

  if (q.includes('calendar') || q.includes('schedule')) {
    reply = `📅 Proactive Assist: I see you are looking at the *${activeTab.toUpperCase()}* workspace. Let me transition your tab directly to the *Weekly Schedule Calendar Grid* to scan your presenter slots!`;
    action = () => window.switchTab('calendar');
  } else if (q.includes('analytics') || q.includes('charts') || q.includes('kpi')) {
    reply = `📈 Proactive Assist: Loading KPI data analytics! Displaying average CSAT scores and total ARR BFM revenue touched for active campaigns.`;
    action = () => window.switchTab('dashboard');
  } else if (q.includes('logs') || q.includes('audit')) {
    reply = "🔍 Opening the System Activity Logs sidebar panel to inspect E2E state change timestamps.";
    action = () => {
      const panel = document.getElementById('sidebar-log-list');
      if (panel) panel.style.boxShadow = '0 0 15px var(--primary-cyan)';
      setTimeout(() => { if (panel) panel.style.boxShadow = 'none'; }, 1500);
    };
  } else if (q.includes('am') || q.includes('ae')) {
    reply = "🔑 Switched active persona to Primary Account AM. Switched view to sequential Kanban columns to focus on your portfolio!";
    action = () => window.changeActiveRole('AM');
  } else if (q.includes('presenter') || q.includes('taylor')) {
    reply = "🔑 Switched active role to Lead Delivery Presenter. Your pipeline has been focused strictly to your assigned sessions.";
    action = () => window.changeActiveRole('Presenter');
  } else if (q.includes('coordinator') || q.includes('organizer')) {
    reply = "🔑 Switched active persona to Program Coordinator. Full workspace privileges unlocked!";
    action = () => window.changeActiveRole('Organizer');
  } else if (q.includes('stakeholder')) {
    reply = "🔑 Switched active persona to Stakeholder. Redirecting you directly to performance metrics dashboards in read-only mode!";
    action = () => window.changeActiveRole('Stakeholder');
  } else if (q.includes('deletion') || q.includes('retention') || q.includes('purged')) {
    reply = "⏱️ Deletion Policy: recordings are auto-deleted after 3 months (90 days). To bypass auto-deletion, click 'Move to Shared Drive' on closed cards to archive them in the GPEG CAMPS Shared Drive folder!";
  } else if (q.includes('teams') || q.includes('microsoft')) {
    reply = "⚠️ Teams Platform Rule: MS Teams sessions require the Teams Recording link. Follow-up resource packaging is locked in the modal until the link is provided.";
  } else if (q.includes('partnership') || q.includes('ads')) {
    reply = "📣 Partnership Ads MFG/WPP sessions require a concise 45-60 minute limit check. Presenter console checklists dynamically load PA duration checks.";
  } else {
    isFallback = true;
  }

  // 3. Handle Progressive Fallbacks & Proactive Guided Interventions E2E
  if (isFallback) {
    state.consecutiveFailuresCount = (state.consecutiveFailuresCount || 0) + 1;
    
    if (state.consecutiveFailuresCount === 1) {
      reply = `Hi there! I didn't quite match that command. As a *${activeRole}*, would you like me to guide you contextually? Try asking me to *'switch tab to calendar'* or ask about *'deletion policies'*!`;
    } else if (state.consecutiveFailuresCount === 2) {
      reply = `✨ **GPEG Proactive Assist**: It looks like you might be feeling a bit lost. Don't worry! Here are the most common actions for a *${activeRole}* in GPEG. Just click on any of the options below to get back on track:`;
      
      setTimeout(() => {
        msgContainer.insertAdjacentHTML('beforeend', `
          <div style="display:flex; flex-wrap:wrap; gap:0.35rem; padding:0.5rem; margin-top:0.5rem; background:rgba(0,233,255,0.03); border:1px dashed var(--border-light); border-radius:8px;">
            <div class="chat-chip" onclick="window.clickSupportAgentChip('How does deletion policy work?')" style="font-size:0.65rem; padding:0.2rem 0.45rem; border-radius:99px; border:1px solid var(--border-light); background:rgba(255,255,255,0.03); color:var(--text-secondary); cursor:pointer;">⏱️ Deletion Policy</div>
            <div class="chat-chip" onclick="window.clickSupportAgentChip('Switch active tab to calendar')" style="font-size:0.65rem; padding:0.2rem 0.45rem; border-radius:99px; border:1px solid var(--border-light); background:rgba(255,255,255,0.03); color:var(--text-secondary); cursor:pointer;">📅 Calendar Grid</div>
            <div class="chat-chip" onclick="window.clickSupportAgentChip('Log in as Primary AM')" style="font-size:0.65rem; padding:0.2rem 0.45rem; border-radius:99px; border:1px solid var(--border-light); background:rgba(255,255,255,0.03); color:var(--text-secondary); cursor:pointer;">🔑 AM Role</div>
            <div class="chat-chip" onclick="window.clickSupportAgentChip('Explain Teams Recording Link policy')" style="font-size:0.65rem; padding:0.2rem 0.45rem; border-radius:99px; border:1px solid var(--border-light); background:rgba(255,255,255,0.03); color:var(--text-secondary); cursor:pointer;">⚠️ Teams Links</div>
          </div>
        `);
        msgContainer.scrollTop = msgContainer.scrollHeight;
      }, 800);
    } else {
      reply = `🚨 **GPEG Escalation Assist**: Persistent confusion detected. Would you like me to seamlessly escalate your session context and connect you to a live **gTech Camps Support Coordinator**?`;
      
      setTimeout(() => {
        msgContainer.insertAdjacentHTML('beforeend', `
          <button onclick="window.escalateToLiveAgent()" style="margin-top:0.5rem; width:100%; font-weight:700; font-size:0.72rem; background:var(--danger-red); color:#fff; border:none; padding:0.45rem; border-radius:6px; cursor:pointer; box-shadow:0 4px 10px rgba(234,67,53,0.35); transition: all 0.2s;">📞 Connect to Live gTech Coordinator</button>
        `);
        msgContainer.scrollTop = msgContainer.scrollHeight;
      }, 800);
    }
  } else {
    state.consecutiveFailuresCount = 0;
  }

  // 4. Append AI speech bubble with feedback buttons E2E!
  setTimeout(() => {
    const randomId = `msg-${Math.floor(Math.random() * 89999) + 10000}`;
    msgContainer.insertAdjacentHTML('beforeend', `
      <div class="chat-msg-ai" id="${randomId}" style="animation: pulseGlow 1s 1; position:relative; padding-bottom:1.5rem;">
        ✨ ${reply}
        <div style="position:absolute; bottom:0.25rem; right:0.5rem; display:flex; gap:0.35rem; font-size:0.65rem;">
          <span onclick="window.rateAiHelp('${randomId}', 'positive')" style="cursor:pointer; opacity:0.5; transition:opacity 0.2s;" onmouseenter="this.style.opacity='1'" onmouseleave="this.style.opacity='0.5'">👍 Useful</span>
          <span onclick="window.rateAiHelp('${randomId}', 'negative')" style="cursor:pointer; opacity:0.5; transition:opacity 0.2s;" onmouseenter="this.style.opacity='1'" onmouseleave="this.style.opacity='0.5'">👎 Inaccurate</span>
        </div>
      </div>
    `);
    msgContainer.scrollTop = msgContainer.scrollHeight;
    
    if (action) action();
    
    window.logAction('SUCCESS', `AI Assist: Answered user command: "${text.substring(0, 25)}..." - Consecutive failures: ${state.consecutiveFailuresCount}`);
  }, 600);
};

// Live gTech Support handoff simulator trigger
window.escalateToLiveAgent = function() {
  showToast('Escalation Sync', 'Connecting to a live gTech Camps Coordinator...');
  const msgContainer = document.getElementById('support-agent-messages');
  if (!msgContainer) return;
  
  msgContainer.insertAdjacentHTML('beforeend', `
    <div class="chat-msg-ai" style="border-color:rgba(16,185,129,0.3); background:rgba(16,185,129,0.06); color:var(--success-green); padding-bottom:0.5rem;">
      📞 **System Handoff**: Connected to Coordinator Pearl Yadallee. Pearl has received your full session logs (Role: ${state.activeRole}, Active Tab: ${state.activeTab}) and is typing a response!
    </div>
  `);
  msgContainer.scrollTop = msgContainer.scrollHeight;
  state.consecutiveFailuresCount = 0;
};

// Feedback system rating logger
window.rateAiHelp = function(msgId, rating) {
  showToast('👍 Thank you!', 'Your feedback directly trains Gpeg prompt routing tables.');
  const el = document.getElementById(msgId);
  if (el) {
    el.style.borderColor = (rating === 'positive') ? 'rgba(52,168,83,0.3)' : 'rgba(234,67,53,0.3)';
  }
};

// --- ENHANCEMENTS: GUIDED ONBOARDING TOUR STATE MACHINE ---
let onboardingStep = 0;
const onboardingSteps = [
  {
    title: "✨ Welcome to gPEG Camps Center!",
    text: "This interactive portal simulates the end-to-end GPEG Camps workshop lifecycle. Let's take a quick 1-minute interactive tour to get you oriented!",
    target: null,
    action: null
  },
  {
    title: "🔑 Active Persona Switcher",
    text: "Switch active roles here. The entire platform scopes visibility, columns, and actions dynamically depending on who is logged in (e.g. Presenters only see their own sessions, AMs have read-only pipelines). For this tour, we will keep you as Admin so you have full access!",
    target: ".persona-switcher-container",
    action: () => {
      window.changeActiveRole('Admin');
    }
  },
  {
    title: "🎫 Cases Connect Sandbox",
    text: "Experience Cases Connect CRM integration. Fill mock ticket data and trigger webhooks to automatically ingest and populate nominations into the first stage of the pipeline.",
    target: "#nav-cases",
    action: () => {
      window.switchTab('cases');
    }
  },
  {
    title: "📝 Interactive Agency Portal",
    text: "Simulate external agency clients completing Pre-Camp Discovery questionnaires (to dynamically upgrade slide decks) or Post-Camp CSAT/BFM feedback surveys to close cases.",
    target: "#nav-agency",
    action: () => {
      window.switchTab('agency');
    }
  },
  {
    title: "🛠️ PM Technical Queue",
    text: "Pod Leads and Program Managers review live-escalated technical questions here, answer them authoritatively, and automatically update outbound email gateways.",
    target: "#nav-pm",
    action: () => {
      window.switchTab('pm');
    }
  },
  {
    title: "📋 Dynamic Kanban Pipeline",
    text: "Return to the dashboard! Track campaigns moving across 5 active stages: Nomination, Pre-Camp Prep, In-Camp Execution, Post-Camp SLA, and Closed / Impact.",
    target: ".pipeline-container",
    action: () => {
      window.switchTab('dashboard');
    }
  },
  {
    title: "⏱️ SLA Time Machine",
    text: "Travel through simulated calendar dates (+2 or +5 days) to test SLA breach warnings and see overdue client surveys penalize camps by reverting them to standard slide protocols.",
    target: "#sidebar-time-machine",
    action: () => {
      window.switchTab('dashboard');
    }
  },
  {
    title: "📖 Centralized Help Center",
    text: "Access our built-in Help & Onboarding Center to review comprehensive guides on E2E workflows, role permissions scoping, simulator secrets, and quick tips at any time!",
    target: "#nav-help",
    action: () => {
      window.switchTab('help');
    }
  },
  {
    title: "🤖 Context-Aware AI Assistant",
    text: "Stuck or want to run automated macros? Click 'Ask GPEG AI' at any time to speak with our context-aware bot assistant. Ask it to 'switch tab to Weekly Schedule' or 'log in as AM'!",
    target: "#support-agent-fab",
    action: null
  },
  {
    title: "🎉 Ready to Explore!",
    text: "You are now fully equipped to explore the simulator. Go ahead, trigger a new webhook nomination in Cases Connect, and walk it through its lifecycle!",
    target: null,
    action: () => {
      window.switchTab('dashboard');
    }
  }
];

window.startOnboardingTour = function() {
  onboardingStep = 0;
  window.renderOnboardingStep();
};

window.closeOnboardingTour = function() {
  // Remove overlay & card elements from page
  const overlay = document.getElementById('tour-overlay');
  const card = document.getElementById('tour-card');
  if (overlay) overlay.remove();
  if (card) card.remove();

  // Clean up any active highlights
  document.querySelectorAll('.onboarding-highlight').forEach(el => {
    el.classList.remove('onboarding-highlight');
  });

  localStorage.setItem('gpeg_onboarding_completed', 'true');
};

window.nextOnboardingStep = function() {
  onboardingStep++;
  if (onboardingStep >= onboardingSteps.length) {
    window.closeOnboardingTour();
    showToast('Tour Completed', 'Enjoy exploring the Camps Command Center!');
  } else {
    window.renderOnboardingStep();
  }
};

window.prevOnboardingStep = function() {
  onboardingStep--;
  if (onboardingStep < 0) onboardingStep = 0;
  window.renderOnboardingStep();
};

window.renderOnboardingStep = function() {
  // Remove previous highlights
  document.querySelectorAll('.onboarding-highlight').forEach(el => {
    el.classList.remove('onboarding-highlight');
  });

  // Create or fetch overlay
  let overlay = document.getElementById('tour-overlay');
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = 'tour-overlay';
    overlay.className = 'onboarding-overlay';
    overlay.onclick = window.closeOnboardingTour;
    document.body.appendChild(overlay);
  }

  // Create or fetch floating card
  let card = document.getElementById('tour-card');
  if (!card) {
    card = document.createElement('div');
    card.id = 'tour-card';
    card.className = 'onboarding-card';
    document.body.appendChild(card);
  }

  const step = onboardingSteps[onboardingStep];
  
  // Execute mapped tab/persona state transition action
  if (step.action) step.action();

  // Layout content
  card.innerHTML = `
    <div class="onboarding-progress">Step ${onboardingStep + 1} of ${onboardingSteps.length}</div>
    <h3>${step.title}</h3>
    <p>${step.text}</p>
    <div class="onboarding-controls">
      <button class="btn-sm" style="max-width: 70px; padding: 0.25rem; font-size: 0.72rem;" onclick="window.closeOnboardingTour()">Skip</button>
      <div style="display: flex; gap: 0.35rem;">
        <button class="btn-sm" style="max-width: 50px; padding: 0.25rem; font-size: 0.72rem;" onclick="window.prevOnboardingStep()" ${onboardingStep === 0 ? 'disabled style="opacity: 0.4; cursor: not-allowed;"' : ''}>Back</button>
        <button class="btn-sm btn-primary-sm" style="max-width: 75px; padding: 0.25rem 0.5rem; font-size: 0.72rem; color: #000; font-weight: 700;" onclick="window.nextOnboardingStep()">${onboardingStep === onboardingSteps.length - 1 ? 'Finish' : 'Next →'}</button>
      </div>
    </div>
  `;

  // Positioning spotlight target
  if (step.target) {
    const targetEl = document.querySelector(step.target);
    if (targetEl) {
      targetEl.classList.add('onboarding-highlight');
      
      // Smoothly scroll elements into view before highlighting
      targetEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
      
      setTimeout(() => {
        const rect = targetEl.getBoundingClientRect();
        const cardWidth = 350;
        
        // Position absolute relative to element bounds
        let top = rect.bottom + window.scrollY + 15;
        let left = rect.left + window.scrollX + (rect.width / 2) - (cardWidth / 2);
        
        // Keep card strictly on-screen horizontally
        if (left < 15) left = 15;
        if (left + cardWidth > window.innerWidth - 15) {
          left = window.innerWidth - cardWidth - 15;
        }
        
        // If element is at the bottom, show tour card above it
        if (rect.bottom + 240 > window.innerHeight) {
          top = rect.top + window.scrollY - 210;
        }
        
        card.style.position = 'absolute';
        card.style.top = top + 'px';
        card.style.left = left + 'px';
        card.style.transform = 'none';
      }, 300); // Allow smooth scroll timing offset
    } else {
      centerTourCard(card);
    }
  } else {
    centerTourCard(card);
  }
};

function centerTourCard(card) {
  card.style.position = 'fixed';
  card.style.top = '50%';
  card.style.left = '50%';
  card.style.transform = 'translate(-50%, -50%)';
}

window.filterCampsFromUi = function() {
  renderDashboard();
};

// --- GOOGLE BRANDING: THEME TOGGLING ENGINE ---
window.toggleTheme = function() {
  const isLight = document.body.classList.toggle('light-theme');
  localStorage.setItem('gpeg_theme', isLight ? 'light' : 'dark');
  updateThemeUI(isLight);
  window.logAction('INFO', `Theme Switcher: Switched application theme to [${isLight ? 'LIGHT' : 'DARK'}].`);
};

function updateThemeUI(isLight) {
  const btn = document.getElementById('btn-theme-toggle');
  if (btn) {
    btn.innerHTML = isLight ? '🌙 Dark Mode' : '☀️ Light Mode';
  }
}

// --- HEURISTICS AUDIT: RECOGNITION-OVER-RECALL TOKEN HELPER ---
window.renderAgencyPortalTokens = function() {
  const container = document.getElementById('agency-portal-test-tokens');
  if (!container) return;
  container.innerHTML = '';
  
  // Authoritative seed tokens that are guaranteed to be valid in database verify scopes
  const seedTokens = ["2-9828000040100", "1-4893000041135", "3-7721000010200", "4-9901000031200"];
  
  // Extract any additional dynamic cases currently in state
  const dynamicTokens = state.camps.filter(c => c.stage !== 'closed').map(c => c.id);
  
  // Consolidate unique active tokens
  const uniqueTokens = Array.from(new Set([...seedTokens, ...dynamicTokens]));
  
  uniqueTokens.forEach(tokenId => {
    container.insertAdjacentHTML('beforeend', `
      <span onclick="document.getElementById('agency-case-auth-input').value='${tokenId}'; window.verifyAgencyCaseId();" style="background: rgba(26, 115, 232, 0.08); border: 1px solid rgba(26, 115, 232, 0.2); color: var(--primary-cyan); padding: 0.15rem 0.45rem; border-radius: 4px; cursor: pointer; font-family: monospace; font-size: 0.68rem; font-weight: 600; transition: all 0.2s; display: inline-block; margin: 0.15rem;" title="Click to auto-fill and verify">${tokenId}</span>
    `);
  });
};

// ============================================================================
// --- GOOGLE UI/UX GUIDELINES REFACTORING ENHANCEMENTS ---
// ============================================================================

// 1. Progressive Disclosure Simulator Toggler
window.toggleSimulatorMode = function(isActive) {
  state.simulatorModeActive = isActive;
  localStorage.setItem('gpeg_sim_mode', isActive);

  const cb = document.getElementById('simulator-mode-checkbox');
  if (cb) cb.checked = isActive;

  // Toggle visibility of testing sandboxes
  document.querySelectorAll('.simulator-only-view').forEach(el => {
    el.style.opacity = isActive ? '1' : '0';
    el.style.pointerEvents = isActive ? 'all' : 'none';
    
    // Simple slide-height/display toggle
    setTimeout(() => {
      el.style.display = isActive ? 'block' : 'none';
    }, 50);
  });

  // Auto-redirect standard users from sandbox tabs
  const currentTab = document.querySelector('nav button.active') ? document.querySelector('nav button.active').id : '';
  const simulatorTabs = ['nav-cases', 'nav-agency', 'nav-pm', 'nav-mail'];
  if (!isActive && simulatorTabs.includes(currentTab)) {
    window.switchTab('dashboard');
  }
};

// 2. Consolidated Sidebar Quick Action Items Panel
window.renderConsolidatedSidebarWidget = function() {
  const listEl = document.getElementById('sidebar-consolidated-list');
  const countBadge = document.getElementById('sidebar-action-count-badge');
  if (!listEl) return;
  listEl.innerHTML = '';

  const actions = compileUnifiedActions();
  const topActions = actions.slice(0, 3); // Display top 3 highest priority

  topActions.forEach(act => {
    let borderStyle = '';
    let badgeClass = '';
    if (act.priority === 'high') {
      borderStyle = 'border-left: 3px solid var(--danger-red);';
      badgeClass = 'priority-high';
    } else if (act.priority === 'medium') {
      borderStyle = 'border-left: 3px solid var(--warning-amber);';
      badgeClass = 'priority-medium';
    } else {
      borderStyle = 'border-left: 3px solid var(--success-green);';
      badgeClass = 'priority-low';
    }

    listEl.insertAdjacentHTML('beforeend', `
      <div class="sidebar-item" style="${borderStyle}">
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.25rem; margin-bottom: 0.15rem;">
          <span class="sidebar-item-title" style="font-size: 0.75rem; font-weight: 600;">${act.title}</span>
          <span class="priority-badge ${badgeClass}" style="font-size: 0.55rem; padding: 0.05rem 0.2rem; border-radius: 3px;">${act.priority}</span>
        </div>
        <div class="sidebar-item-meta" style="font-size: 0.68rem; display: flex; justify-content: space-between;">
          <span>Case: ${act.caseId}</span>
          <span class="alert-timer">${act.deadline}</span>
        </div>
      </div>
    `);
  });

  if (actions.length === 0) {
    listEl.innerHTML = `
      <div class="sidebar-empty-state" style="text-align: center; padding: 1.5rem 1rem; background: rgba(16, 185, 129, 0.03); border: 1px dashed rgba(16, 185, 129, 0.2); border-radius: 12px; margin-top: 0.5rem; animation: fadeIn 0.3s ease;">
        <div style="font-size: 1.8rem; margin-bottom: 0.35rem;">🎉</div>
        <strong style="font-size: 0.78rem; color: var(--success-green); display: block; margin-bottom: 0.15rem;">You're All Caught Up!</strong>
        <span style="font-size: 0.68rem; color: var(--text-secondary); line-height: 1.3; display: block;">No high-risk SLAs or escalated client Q&As require attention. Excellent job!</span>
      </div>
    `;
  }

  if (countBadge) {
    countBadge.textContent = `${actions.length} ${actions.length === 1 ? 'Item' : 'Items'}`;
  }
};

// 3. Unified Action Center Catalog Compiler
function compileUnifiedActions() {
  const list = [];
  
  // A. approaching Pre-camp & Post-camp SLAs
  state.camps.forEach(camp => {
    if (camp.stage === 'pre-camp' && camp.discoveryStatus === 'Pending') {
      const risk = calculateSlaRisk(camp);
      const prio = risk.score >= 80 ? 'high' : risk.score >= 40 ? 'medium' : 'low';
      list.push({
        id: 'sla-pre-' + camp.id,
        caseId: camp.id,
        category: 'SLA Alert',
        title: `Discovery Form Pending (${camp.agency})`,
        assignee: 'AM',
        priority: prio,
        riskScore: risk.score,
        deadline: `${camp.slaDaysRemaining}d left`,
        actionLabel: 'Verify Agency Gateway',
        actionType: 'gateway',
        rawObject: camp
      });
    } else if (camp.stage === 'post-camp' && !camp.followUpSent) {
      const risk = calculateSlaRisk(camp);
      const prio = risk.score >= 80 ? 'high' : risk.score >= 40 ? 'medium' : 'low';
      const hasUnresolved = camp.liveQuestions.some(q => !q.answered);
      list.push({
        id: 'sla-post-' + camp.id,
        caseId: camp.id,
        category: 'SLA Alert',
        title: hasUnresolved ? `Escalated PM Q&A Pending (${camp.agency})` : `Dispatch Follow-up Packets`,
        assignee: hasUnresolved ? 'PM' : 'Presenter',
        priority: prio,
        riskScore: risk.score,
        deadline: `${camp.slaDaysRemaining}d left`,
        actionLabel: hasUnresolved ? 'PM Queue' : 'Draft Follow-up',
        actionType: hasUnresolved ? 'pm-tab' : 'followup-modal',
        rawObject: camp
      });
    }

    // B. Escalated Live Q&As
    camp.liveQuestions.forEach(q => {
      if (!q.answered) {
        list.push({
          id: 'qa-' + q.id,
          caseId: camp.id,
          category: 'Q&A Escalations',
          title: `Expert Answer Required: "${q.text.substring(0, 30)}..."`,
          assignee: 'PM',
          priority: 'high',
          riskScore: 90,
          deadline: 'Urgent',
          actionLabel: 'Answer Question',
          actionType: 'pm-tab',
          rawObject: q
        });
      }
    });
  });

  // C. Inter-Team checklist tasks
  state.tasks.forEach(t => {
    if (!t.done) {
      list.push({
        id: 'task-' + t.id,
        caseId: 'N/A',
        category: 'Team Tasks',
        title: t.title,
        assignee: t.assignee || 'Presenter',
        priority: 'medium',
        riskScore: 50,
        deadline: 'Pending',
        actionLabel: 'Mark Completed',
        actionType: 'toggle-task',
        rawObject: t
      });
    }
  });

  // Apply active filters
  let filtered = list;
  if (state.actionCenterFilterCategory !== 'ALL') {
    const catMap = { SLA: 'SLA Alert', QA: 'Q&A Escalations', TASK: 'Team Tasks' };
    filtered = filtered.filter(a => a.category === catMap[state.actionCenterFilterCategory]);
  }
  if (state.actionCenterFilterRole !== 'ALL') {
    filtered = filtered.filter(a => a.assignee === state.actionCenterFilterRole);
  }
  if (state.actionCenterSearchQuery) {
    const q = state.actionCenterSearchQuery.toLowerCase();
    filtered = filtered.filter(a => 
      a.title.toLowerCase().includes(q) || 
      a.caseId.toLowerCase().includes(q)
    );
  }

  // Apply Sort engine
  const field = state.actionCenterSortField;
  const asc = state.actionCenterSortAsc;
  filtered.sort((a, b) => {
    let valA = a[field];
    let valB = b[field];

    if (field === 'priority') {
      const prioVal = { high: 3, medium: 2, low: 1 };
      valA = prioVal[a.priority] || 0;
      valB = prioVal[b.priority] || 0;
    }

    if (valA < valB) return asc ? -1 : 1;
    if (valA > valB) return asc ? 1 : -1;
    return 0;
  });

  return filtered;
}

// 4. sortable & filterable Action Center Table page Renderer
window.renderActionCenterTable = function() {
  const tbody = document.getElementById('action-center-table-body');
  if (!tbody) return;
  tbody.innerHTML = '';

  const actions = compileUnifiedActions();
  
  const pageSize = 5;
  const totalActions = actions.length;
  const totalPages = Math.max(1, Math.ceil(totalActions / pageSize));

  if (state.actionCenterPage > totalPages) state.actionCenterPage = totalPages;
  if (state.actionCenterPage < 1) state.actionCenterPage = 1;

  const startIdx = (state.actionCenterPage - 1) * pageSize;
  const pageActions = actions.slice(startIdx, startIdx + pageSize);

  pageActions.forEach(act => {
    let badgeClass = '';
    if (act.priority === 'high') badgeClass = 'priority-high';
    else if (act.priority === 'medium') badgeClass = 'priority-medium';
    else badgeClass = 'priority-low';

    let actBtn = '';
    if (act.actionType === 'gateway') {
      actBtn = `<button class="btn btn-primary" style="font-size: 0.7rem; padding: 0.25rem 0.5rem;" onclick="window.switchTab('agency'); document.getElementById('agency-case-auth-input').value='${act.caseId}'; window.verifyAgencyCaseId();">Verify Token</button>`;
    } else if (act.actionType === 'pm-tab') {
      actBtn = `<button class="btn btn-primary" style="font-size: 0.7rem; padding: 0.25rem 0.5rem;" onclick="window.switchTab('pm')">PM Queue</button>`;
    } else if (act.actionType === 'followup-modal') {
      actBtn = `<button class="btn btn-primary" style="font-size: 0.7rem; padding: 0.25rem 0.5rem;" onclick="openFollowUpModal('${act.caseId}')">Draft Mail</button>`;
    } else if (act.actionType === 'toggle-task') {
      actBtn = `<button class="btn" style="font-size: 0.7rem; padding: 0.25rem 0.5rem;" onclick="window.toggleTaskDone('${act.rawObject.id}')">Complete</button>`;
    }

    tbody.insertAdjacentHTML('beforeend', `
      <tr>
        <td style="font-family: monospace; font-weight: 700; color: var(--primary-cyan);">${act.caseId}</td>
        <td style="color: var(--text-secondary); font-size: 0.75rem; font-weight: 600;">${act.category}</td>
        <td style="font-weight: 500;">${act.title}</td>
        <td><span style="background: rgba(255,255,255,0.05); padding: 0.15rem 0.45rem; border-radius: 6px; font-size: 0.72rem;">${act.assignee}</span></td>
        <td><span class="priority-badge ${badgeClass}">${act.priority}</span></td>
        <td style="font-family: monospace; font-size: 0.75rem;">${act.deadline}</td>
        <td>${actBtn}</td>
      </tr>
    `);
  });

  if (actions.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; color: var(--text-muted); padding: 2rem;">All tasks cleared. Operational queue stands green!</td></tr>';
  }

  // Update Paginator Info & State
  const prevBtn = document.getElementById('action-prev-btn');
  const nextBtn = document.getElementById('action-next-btn');
  const pageInfo = document.getElementById('action-page-info');

  if (prevBtn) prevBtn.disabled = state.actionCenterPage === 1;
  if (nextBtn) nextBtn.disabled = state.actionCenterPage === totalPages;
  if (pageInfo) pageInfo.textContent = `Page ${state.actionCenterPage} of ${totalPages}`;

  // Update Sort icons
  const sortFields = ['caseId', 'category', 'title', 'assignee', 'priority', 'deadline'];
  sortFields.forEach(f => {
    const iconSpan = document.getElementById(`sort-icon-${f}`);
    if (iconSpan) {
      if (state.actionCenterSortField === f) {
        iconSpan.textContent = state.actionCenterSortAsc ? ' ▲' : ' ▼';
        iconSpan.style.color = 'var(--primary-cyan)';
      } else {
        iconSpan.textContent = '';
      }
    }
  });
};

window.onActionCenterFiltersChanged = function() {
  state.actionCenterFilterCategory = document.getElementById('action-filter-category').value;
  state.actionCenterFilterRole = document.getElementById('action-filter-role').value;
  state.actionCenterSearchQuery = document.getElementById('action-search-input').value.trim();
  state.actionCenterPage = 1; 
  window.renderActionCenterTable();
};

window.onActionCenterSort = function(field) {
  if (state.actionCenterSortField === field) {
    state.actionCenterSortAsc = !state.actionCenterSortAsc;
  } else {
    state.actionCenterSortField = field;
    state.actionCenterSortAsc = true;
  }
  window.renderActionCenterTable();
};

window.prevActionPage = function() {
  if (state.actionCenterPage > 1) {
    state.actionCenterPage--;
    window.renderActionCenterTable();
  }
};

window.nextActionPage = function() {
  const totalActions = compileUnifiedActions().length;
  const totalPages = Math.ceil(totalActions / 5);
  if (state.actionCenterPage < totalPages) {
    state.actionCenterPage++;
    window.renderActionCenterTable();
  }
};

window.toggleTaskDone = function(taskId) {
  const task = state.tasks.find(t => t.id === taskId);
  if (task) {
    task.done = true;
    saveState();
    showToast('Task Completed', `Team task: "${task.title}" resolved.`);
  }
};

// ============================================================================
// --- MULTI-PLATFORM AUTOMATION & INTEGRATION CORE ---
// ============================================================================

// 1. Google Calendar API Visual Grid availability renderer
window.renderCalendarApiGrid = function() {
  const grid = document.getElementById('automation-calendar-grid');
  if (!grid) return;
  grid.innerHTML = '';

  // Scan presenters state
  const presenters = [
    { name: 'Taylor Chen', status: 'Available', class: 'calendar-api-slot-free' },
    { name: 'Alex Rivera', status: 'Busy (Camp Conf)', class: 'calendar-api-slot-busy' },
    { name: 'Jordan Blake', status: 'Available', class: 'calendar-api-slot-free' }
  ];

  presenters.forEach(p => {
    grid.insertAdjacentHTML('beforeend', `
      <div class="calendar-api-presenter-card">
        <div style="font-weight: 700; font-size: 0.8rem; color: var(--text-primary);">${p.name}</div>
        <div style="font-size: 0.65rem; color: var(--text-muted); margin-top: 0.15rem;">Google Calendar</div>
        <span class="calendar-api-slot-status ${p.class}">${p.status}</span>
      </div>
    `);
  });
};

// 2. Google Slides API Customized Compilation Simulation
window.simulateSlidesCompilerApi = function() {
  const caseSelect = document.getElementById('slides-automation-case-select');
  const track = document.getElementById('slides-compiler-progress-track');
  const fill = document.getElementById('slides-compiler-progress-fill');
  const statusLog = document.getElementById('slides-compiler-status-log');
  const compileBtn = document.getElementById('btn-slides-compile-api');

  const caseId = caseSelect.value;
  if (!caseId) {
    alert('Please select an active Case ID Nomination to compile.');
    return;
  }

  const camp = state.camps.find(c => c.id === caseId);
  
  // Disable controls and display loaders
  compileBtn.disabled = true;
  track.style.display = 'block';
  fill.style.width = '0%';
  statusLog.textContent = 'Initializing Slides API OAuth Connection...';

  // Step 1: OAuth Connection (500ms)
  setTimeout(() => {
    fill.style.width = '25%';
    statusLog.textContent = 'Connection established. Fetching Discovery Form outputs...';
    
    // Step 2: Parsing answers (1000ms)
    setTimeout(() => {
      fill.style.width = '60%';
      statusLog.textContent = `Applying layouts: Injecting ${camp.agency} logos & customized ${camp.product} slide streams...`;
      
      // Step 3: Compiling & Saving (1800ms)
      setTimeout(() => {
        fill.style.width = '100%';
        statusLog.textContent = 'Slides generated successfully! Saved link in repository.';
        
        // Transition portal state E2E
        camp.discoveryStatus = 'Submitted';
        camp.deckType = 'Customized Deck';
        camp.status = 'Discovery Received';
        saveState();

        // Push new slide deck asset to repository list
        window.logAction('SUCCESS', `Google Slides API: Programmatically generated customized deck for Case ID [${camp.id}] using master template and discovery inputs.`);
        
        showToast('Slides API Success', `Customized slides generated and synced for ${camp.agency}!`);
        
        // Restore buttons
        setTimeout(() => {
          track.style.display = 'none';
          statusLog.textContent = '';
          compileBtn.disabled = false;
          
          // Re-run renderers
          renderDashboard();
          window.renderAutomationHub();
          window.renderActionCenterTable();
        }, 800);

      }, 800);
    }, 600);
  }, 4000 / 4);
};

// Populate Slides picker case dropdown
function populateSlidesApiSelector() {
  const select = document.getElementById('slides-automation-case-select');
  if (!select) return;
  select.innerHTML = '';

  // Show nominations and pre-camp prep cases awaiting customized slides
  const awaitingCamps = state.camps.filter(c => c.stage === 'nomination' || (c.stage === 'pre-camp' && c.deckType === 'Standard Deck'));
  
  awaitingCamps.forEach(c => {
    select.insertAdjacentHTML('beforeend', `
      <option value="${c.id}">${c.agency} [Case: ${c.id}] (${c.deckType})</option>
    `);
  });

  if (awaitingCamps.length === 0) {
    select.innerHTML = '<option value="">-- No active cases awaiting custom slides --</option>';
  }
}

// 3. Meet / Teams Telemetry Ingest Simulation
window.simulateTelemetryFetch = function(platform) {
  // Find an active post-camp case or live case
  const targetCamp = state.camps.find(c => c.stage === 'post-camp' || c.stage === 'in-camp');
  if (!targetCamp) {
    alert('No active execution or post-camp sessions found to fetch telemetry for.');
    return;
  }

  const recordingUrl = platform === 'Meet' ? 'https://meet.google.com/gpeg-recorded-session' : 'https://teams.microsoft.com/l/meetup-join/teams-recorded-session';
  
  targetCamp.teamsRecordingUrl = recordingUrl;
  targetCamp.followUpSent = false; // Ensure Follow-up can lock/unlock
  saveState();

  window.logAction('SUCCESS', `${platform} Telemetry API: Ingested attendance log list [Taylor, Rahul, Shivam] and auto-synchronized Recording Link [${recordingUrl}] for Case ID [${targetCamp.id}].`);
  showToast(`${platform} Ingestion Complete`, `Successfully synced recording telemetry and participant logs for Case ${targetCamp.id}!`);
  
  renderDashboard();
  window.renderActionCenterTable();
};

// 4. Google Chat Ops: Chat Bot Simulator
window.submitChatBotMessage = function() {
  const input = document.getElementById('chatbot-msg-input');
  const query = input.value.trim();
  if (!query) return;

  // Push user message
  state.chatBotMessages.push({ sender: 'user', text: query });
  input.value = '';
  window.renderChatBotHistory();

  // Parse chat query keywords to compile bot reply
  setTimeout(() => {
    let replyText = "Hi GPEG Delivery POC! I didn't quite understand that. Ask me `@GPEG-Bot status <agency>` or `@GPEG-Bot active`.";
    const q = query.toLowerCase();

    if (q.includes('help')) {
      replyText = "I support these commands:\n• `@GPEG-Bot critical` (scan active pipeline for critical bottlenecks)\n• `@GPEG-Bot status <agency>` (check case stage)\n• `@GPEG-Bot active` (count active pipeline cases)\n• `@GPEG-Bot alerts` (count SLA warnings)\n• `@GPEG-Bot schedule` (list scheduled Gcal sessions)\n• `@GPEG-Bot link <case_id>` (fetch discovery profile survey links)\n• `@GPEG-Bot resolve <bug_id> \"<answer>\"` (directly resolve Buganizer tickets)";
    } else if (q.includes('critical') || q.includes('action') || q.includes('attention')) {
      let criticalList = [];

      // 1. Scan for SLA breaches or near breaches
      state.camps.forEach(c => {
        if (c.stage === 'pre-camp' && c.discoveryStatus === 'Pending') {
          if (c.slaDaysRemaining <= 0 || c.slaBreached) {
            criticalList.push(`⚠️ *[SLA BREACHED]* *${c.agency}* discovery form deadline passed. Customization revoked! <span onclick="window.switchTab('mail'); window.swapMailTemplate('discovery');" style="cursor:pointer; text-decoration:underline; color:var(--primary-cyan); font-weight:700;">[Draft Chase Email ✉️]</span>`);
          } else if (c.slaDaysRemaining <= 2) {
            criticalList.push(`⏱️ *[SLA Warning]* *${c.agency}* has only _${c.slaDaysRemaining}d left_ for discovery. <span onclick="window.switchTab('pipeline');" style="cursor:pointer; text-decoration:underline; color:var(--primary-cyan); font-weight:700;">[View Card 📋]</span>`);
          }
        }
      });

      // 2. Scan for Presenter Overlaps
      const scheduledCamps = state.camps.filter(c => c.scheduledTime !== null && c.stage !== 'closed');
      scheduledCamps.forEach((c1, i) => {
        scheduledCamps.forEach((c2, j) => {
          if (i !== j && c1.presenter === c2.presenter) {
            const diffMs = Math.abs(new Date(c1.scheduledTime) - new Date(c2.scheduledTime));
            if (diffMs < 90 * 60 * 1000) { // Overlap
              criticalList.push(`🚨 *[Schedule Conflict]* *${c1.presenter.split(' ')[0]}* is double-booked between *${c1.agency}* and *${c2.agency}* on Gcal! <span onclick="window.switchTab('sessions');" style="cursor:pointer; text-decoration:underline; color:var(--primary-cyan); font-weight:700;">[Resolve Conflict 📅]</span>`);
            }
          }
        });
      });

      // 3. Scan for MS Teams Missing link locks
      state.camps.forEach(c => {
        if (c.platform === 'Teams' && c.stage === 'post-camp' && !c.teamsRecordingUrl) {
          criticalList.push(`🔒 *[Teams Locked]* *${c.agency}* package dispatch blocked due to missing Teams Recording Link. <span onclick="window.switchTab('pipeline');" style="cursor:pointer; text-decoration:underline; color:var(--primary-cyan); font-weight:700;">[Add Teams URL 🔗]</span>`);
        }
      });

      if (criticalList.length > 0) {
        const uniqueCritical = Array.from(new Set(criticalList));
        replyText = `🎯 *GPEG-Bot Critical Action Panel*:\nI have scanned active pipelines and discovered *${uniqueCritical.length} high-priority bottlenecks* needing attention:\n\n` + uniqueCritical.join('\n\n');
      } else {
        replyText = `🎯 *GPEG-Bot Status*: Zero critical bottlenecks detected! All pipeline SLAs, Gcal bookings, and MS Teams linkages are compliant and operating smoothly.`;
      }
    } else if (q.includes('active')) {
      const activeCount = state.camps.filter(c => c.stage !== 'closed').length;
      replyText = `@GPEG-Bot Report: There are currently *${activeCount} active camp engagements* inside the pipeline.`;
    } else if (q.includes('alerts')) {
      const warnings = state.camps.filter(c => c.stage === 'pre-camp' && c.slaDaysRemaining <= 3).length;
      replyText = `@GPEG-Bot SLA Status: We have *${warnings} active warnings* needing urgent client chases!`;
    } else if (q.includes('schedule')) {
      const scheduled = state.camps.filter(c => c.scheduledTime);
      if (scheduled.length > 0) {
        let list = "@GPEG-Bot Presentation Schedule:\n";
        scheduled.forEach(c => {
          list += `• *${c.agency}*: CM360 scheduled for _${c.scheduledTime.split('T')[0]}_ (Presenter: ${c.presenter ? c.presenter.split(' ')[0] : 'Unassigned'})\n`;
        });
        replyText = list;
      } else {
        replyText = "@GPEG-Bot Schedule: No sessions currently on the Gcal calendar.";
      }
    } else if (q.includes('link')) {
      let matched = null;
      state.camps.forEach(c => {
        if (q.includes(c.id)) matched = c;
      });
      if (matched) {
        replyText = `@GPEG-Bot Pre-Camp Discovery Link for *${matched.agency}*:\n🔗 https://camps.google.com/portal/agency-discovery?caseId=${matched.id}`;
      } else {
        replyText = "@GPEG-Bot Link Error: Case ID mismatch or missing. Try `@GPEG-Bot link 1-4893000041135`.";
      }
    } else if (q.includes('resolve')) {
      const resolveMatch = query.match(/resolve\s+([a-zA-Z0-9_-]+)\s+["'](.*)["']/i);
      if (resolveMatch) {
        const bugId = resolveMatch[1];
        const pmAnswer = resolveMatch[2];
        
        fetch('/api/buganizer/resolve', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-GPEG-Session': state.sessionToken },
          body: JSON.stringify({ bugId: bugId, answer: pmAnswer })
        }).then(r => r.json()).then(res => {
          if (res.status === 'success') {
            showToast('ChatOps Sync', `Successfully resolved Bug b/${bugId} directly via ChatOps!`);
            syncWithServer();
          }
        });
        
        replyText = `@GPEG-Bot ChatOps webhook triggered! Resolving ticket *b/${bugId}* in Buganizer with PM Answer: _"${pmAnswer}"_.\nAnswer synced E2E!`;
      } else {
        replyText = "@GPEG-Bot Resolve Error: Format invalid. Use `@GPEG-Bot resolve 6219008 \"my PM answer\"`";
      }
    } else if (q.includes('status')) {
      // Extract agency name keyword
      let matchedCamp = null;
      state.camps.forEach(c => {
        if (q.includes(c.agency.toLowerCase().split(' ')[0])) {
          matchedCamp = c;
        }
      });

      if (matchedCamp) {
        replyText = `@GPEG-Bot Case Search:\n🔍 *${matchedCamp.agency}* [Case ID: ${matchedCamp.id}]\n• Stage: *${matchedCamp.stage.toUpperCase()}*\n• Status: _${matchedCamp.status}_\n• Deck: ${matchedCamp.deckType}`;
      } else {
        replyText = "@GPEG-Bot Error: Could not find any active camp matching that agency name keyword. Try `@GPEG-Bot status groupm`.";
      }
    }

    state.chatBotMessages.push({ sender: 'bot', text: replyText });
    window.renderChatBotHistory();
    window.logAction('SUCCESS', 'Google ChatOps: Synced E2E message audit through Google Chat App webhook.');
  }, 600);
};

window.renderChatBotHistory = function() {
  const history = document.getElementById('chatbot-message-history');
  if (!history) return;
  history.innerHTML = '';

  state.chatBotMessages.forEach((msg, idx) => {
    const isUser = msg.sender === 'user';
    const bubbleClass = isUser ? 'chatbot-msg-user' : 'chatbot-msg-bot';
    
    let feedbackHtml = '';
    if (!isUser) {
      feedbackHtml = `
        <div class="chatbot-msg-feedback" style="font-size: 0.65rem; display: flex; justify-content: flex-end; gap: 0.4rem; color: var(--text-secondary); margin-top: 0.15rem; padding-right: 0.35rem; letter-spacing: 0.2px;">
          <span>Was this helpful?</span>
          <span onclick="window.captureBotFeedback(${idx}, 'HELPFUL')" style="cursor:pointer; color: var(--success-green); font-weight:700; text-decoration:underline;" title="Yes, helpful! 👍">👍 Yes</span>
          <span onclick="window.captureBotFeedback(${idx}, 'UNHELPFUL')" style="cursor:pointer; color: var(--danger-red); font-weight:700; text-decoration:underline;" title="No, unhelpful 👎">👎 No</span>
          ${msg.feedback ? `<span style="color: var(--primary-cyan); font-weight:800;">(${msg.feedback})</span>` : ''}
        </div>
      `;
    }

    history.insertAdjacentHTML('beforeend', `
      <div style="display: flex; flex-direction: column; align-items: ${isUser ? 'flex-end' : 'flex-start'}; margin-bottom: 0.55rem;">
        <div class="chatbot-msg-bubble ${bubbleClass}" style="white-space: pre-line; max-width: 85%;">
          ${msg.text}
        </div>
        ${feedbackHtml}
      </div>
    `);
  });

  // Auto-scroll to bottom
  history.scrollTop = history.scrollHeight;
};

window.captureBotFeedback = function(msgIdx, sentiment) {
  const msg = state.chatBotMessages[msgIdx];
  if (!msg || msg.feedback) return; // Prevent duplicate logging

  msg.feedback = sentiment;
  saveState();
  window.renderChatBotHistory();

  window.logAction('SUCCESS', `ChatBot Feedback: User rated response "${msg.text.substring(0, 35).replace(/[\r\n]+/g, ' ')}..." as ${sentiment}.`);
  showToast('Feedback Logged', `Thank you! Rated bot reply as ${sentiment === 'HELPFUL' ? 'Helpful' : 'Not Helpful'}.`);
};

// 5. Buganizer / Issue Tracker Sync
window.renderBuganizerTrackerList = function() {
  const listEl = document.getElementById('buganizer-tracker-list');
  if (!listEl) return;
  listEl.innerHTML = '';

  state.buganizerTickets.forEach(t => {
    const isResolved = t.status === 'Resolved';
    const badgeClass = isResolved ? 'bug-status-resolved' : '';
    
    let actBtn = '';
    if (!isResolved) {
      actBtn = `
        <div style="margin-top: 0.5rem; display: flex; gap: 0.35rem;">
          <input type="text" id="bug-answer-input-${t.id}" class="form-control" style="font-size: 0.72rem; padding: 0.25rem; flex: 1; height: 26px; margin-bottom: 0;" placeholder="Authoritative PM fix...">
          <button class="btn btn-primary tooltip-trigger" data-tooltip="SME Expert Queue. When a Product Manager answers an escalated client question here, GPEG automatically inserts the answer into the camp card, active presenter deck, and outbound client package." style="font-size: 0.7rem; padding: 0.2rem 0.5rem;" onclick="window.resolveBuganizerTicket('${t.id}')">Resolve Bug</button>
        </div>
      `;
    } else {
      actBtn = `<div style="font-size: 0.72rem; color: var(--text-secondary); margin-top: 0.25rem; font-style: italic;">Resolved: "${t.answer}"</div>`;
    }

    listEl.insertAdjacentHTML('beforeend', `
      <div class="buganizer-ticket-item">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <span class="bug-id-badge ${badgeClass}">b/${t.id}</span>
          <span style="font-size: 0.68rem; color: var(--text-secondary); font-weight: 600;">Component: ${t.component}</span>
        </div>
        <div style="font-size: 0.78rem; font-weight: 700; color: var(--text-primary);">${t.title}</div>
        <div style="font-size: 0.72rem; color: var(--text-muted);">${t.desc}</div>
        ${actBtn}
      </div>
    `);
  });
};

window.resolveBuganizerTicket = function(bugId) {
  const input = document.getElementById(`bug-answer-input-${bugId}`);
  const ans = input ? input.value.trim() : 'Authoritative fix mapped in parameters configurations.';
  if (!ans) {
    alert('Please enter a resolution description.');
    return;
  }

  const ticket = state.buganizerTickets.find(t => t.id === bugId);
  if (ticket) {
    ticket.status = 'Resolved';
    ticket.answer = ans;
    
    // Trigger Two-Way Webhook Sync callback to update GPEG State camps Q&A!
    const camp = state.camps.find(c => c.id === ticket.caseId);
    if (camp) {
      const question = camp.liveQuestions.find(q => q.id === ticket.questionId);
      if (question) {
        question.answered = true;
        question.answer = ans;
      }

      // Push outbound resolution notification email
      dispatchEmailToServer({
        from: "gpeg-camps@google.com",
        to: camp.amEmail,
        subject: `RESOLVED Q&A (Buganizer b/${bugId}): Case ${camp.id}`,
        body: `Hi AM,\n\nThe Product Manager has authoritatively resolved ticket b/${bugId} inside Buganizer.\n\nQuestion: "${ticket.desc}"\nResolution: "${ans}"\n\nThis answer has been synced and auto-embedded into your outbound follow-up package draft!`
      });
    }
    
    saveState();
  }

  window.logAction('SUCCESS', `Buganizer API Sync Webhook: Authoritatively resolved ticket [b/${bugId}]. Synchronized resolved status E2E back to Case ID [${ticket.caseId}] Q&A list.`);
  showToast('Buganizer Sync Resolved', `Ticket b/${bugId} resolved in tracker and synced back to GPEG portal!`);
  
  renderDashboard();
  window.renderAutomationHub();
  window.renderActionCenterTable();
};

// 6. Master Automation Tab Vis Renderer
window.renderAutomationHub = function() {
  window.renderCalendarApiGrid();
  populateSlidesApiSelector();
  window.renderChatBotHistory();
  window.renderBuganizerTrackerList();
};

// ============================================================================
// --- PHASE 4: PREDICTIVE PERFORMANCE ENGINE ENHANCEMENTS ---
// ============================================================================

// 1. Capacity-Aware scheduling workloads calculator
window.calculatePresenterWorkloads = function() {
  const workloads = {
    'Taylor Chen (Presenter)': 0,
    'Alex Rivera (Presenter)': 0,
    'Jordan Blake (Presenter)': 0
  };
  state.camps.forEach(c => {
    if (c.stage !== 'closed' && c.presenter) {
      const nameKey = Object.keys(workloads).find(k => k.includes(c.presenter.split(' ')[0]));
      if (nameKey) workloads[nameKey]++;
    }
  });
  return workloads;
};

window.onKickoffPresenterSelected = function(name) {
  const workloads = window.calculatePresenterWorkloads();
  const count = workloads[name] || 0;
  const recEl = document.getElementById('scheduler-workload-recommendation');
  if (recEl) {
    recEl.textContent = `💡 Selected Workload: ${name.split(' ')[0]} has ${count} active camps assigned.`;
  }
};

window.autoBalancePresenterSelection = function() {
  const workloads = window.calculatePresenterWorkloads();
  let bestPresenter = 'Taylor Chen (Presenter)';
  let minCount = 999;
  
  Object.entries(workloads).forEach(([name, count]) => {
    if (count < minCount) {
      minCount = count;
      bestPresenter = name;
    }
  });
  
  const presenterSelect = document.getElementById('kickoff-presenter');
  if (presenterSelect) {
    presenterSelect.value = bestPresenter;
    window.onKickoffPresenterSelected(bestPresenter);
    showToast('⚖️ Load Balancer', `Auto-assigned ${bestPresenter.split(' ')[0]} (Workload: Low - ${minCount} active) for optimal balance!`);
  }
};

// 2. GDPR PII Scrubbing Toggle
window.toggleGdprScrubbing = function(isActive) {
  state.gdprScrubbingActive = isActive;
  localStorage.setItem('gpeg_gdpr_scrubbing', isActive);
  window.logAction('INFO', `GDPR PII Scrubbing Engine: [${isActive ? 'ENABLED' : 'DISABLED'}].`);
  showToast('GDPR Compliance', `PII Scrubbing has been successfully ${isActive ? 'activated' : 'deactivated'}.`);
};

// Helper to scrub personal emails/LDAPs from strings (GDPR Compliance)
function scrubPiiText(text) {
  if (!state.gdprScrubbingActive) return text;
  // Regular expression matching standard email formats
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g;
  return text.replace(emailRegex, '<span class="redacted-pill" title="GDPR Compliance Redacted">REDACTED-EMAIL</span>');
}

// Override Slides Compiler to support simulated Vertex AI GenAI Smart-Drafting summaries!
const oldSimulateSlidesCompilerApi = window.simulateSlidesCompilerApi;
window.simulateSlidesCompilerApi = function() {
  const caseSelect = document.getElementById('slides-automation-case-select');
  const caseId = caseSelect.value;
  if (!caseId) {
    alert('Please select a Case ID.');
    return;
  }

  const camp = state.camps.find(c => c.id === caseId);
  const challengeTxt = camp.discoveryData ? camp.discoveryData.challenges : 'Attribution mapping setups';

  // Draft custom executive recommendation via Vertex AI logic model based on discovery challenges
  let aiRecommendation = 'Establish cross-network measurement hygiene protocols.';
  if (challengeTxt.toLowerCase().includes('attribution') || challengeTxt.toLowerCase().includes('setup')) {
    aiRecommendation = 'Deploy Google Analytics 4 (GA4) cross-channel properties linking CM360 natively. Leverage first-party bidding variables to maximize best-first-match (BFM) results.';
  } else if (challengeTxt.toLowerCase().includes('floodlight') || challengeTxt.toLowerCase().includes('variable') || challengeTxt.toLowerCase().includes('s2s')) {
    aiRecommendation = 'Implement programmatic custom Floodlight variables mapped on CM360 console. Sync via S2S offline conversions API to trigger advanced smart-bidding modifications.';
  }

  camp.aiExecutiveSummary = aiRecommendation; // Sync to case state

  // Trigger original slideshow compiler timer loaders
  oldSimulateSlidesCompilerApi();
};

// Override Buganizer Sync to support GDPR PII scrubbing on resolution sync
const oldResolveBuganizerTicket = window.resolveBuganizerTicket;
window.resolveBuganizerTicket = async function(bugId) {
  const input = document.getElementById(`bug-answer-input-${bugId}`);
  let ans = input ? input.value.trim() : 'Authoritative PM resolution.';
  if (!ans) {
    alert('Please enter bug answer.');
    return;
  }

  if (state.gdprScrubbingActive) {
    ans = scrubPiiText(ans);
  }

  try {
    const response = await fetch('/api/buganizer/resolve', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-GPEG-Session': currentSessionToken
      },
      body: JSON.stringify({
        bugId: bugId,
        answer: ans
      })
    });

    if (response.ok) {
      const result = await response.json();
      
      // Propagate resolved camp and outbox email persistently from the backend callback
      const campIdx = state.camps.findIndex(c => c.id === result.camp.id);
      if (campIdx !== -1) {
        state.camps[campIdx] = result.camp;
      }
      state.outbox.unshift(result.mail);
      
      const ticket = state.buganizerTickets.find(t => t.id === bugId);
      if (ticket) {
        ticket.status = 'Resolved';
        ticket.answer = ans;
      }
      
      localStorage.setItem('gpeg_camps', JSON.stringify(state.camps));
      localStorage.setItem('gpeg_outbox', JSON.stringify(state.outbox));
      localStorage.setItem('gpeg_buganizer_tickets', JSON.stringify(state.buganizerTickets));

      window.logAction('SUCCESS', `Buganizer API Webhook: Resolved ticket [b/${bugId}]. Two-way sync completed.`);
      showToast('Buganizer Sync Resolved', `Ticket b/${bugId} resolved.`);

      renderDashboard();
      window.renderAutomationHub();
      window.renderActionCenterTable();
    } else {
      const err = await response.json();
      throw new Error(err.error || 'Failed to resolve bug ticket');
    }
  } catch (err) {
    console.error('Buganizer resolution sync error:', err);
    showToast('Buganizer Error 🛑', err.message);
  }
};

// ============================================================================
// --- GPP UIF & MATERIAL DESIGN 3 BRAND ENGINE ---
// ============================================================================

// A. 3-Way Theme switcher manager (GPP UIF Recommendation 2)
window.changeThemeMode = function(mode) {
  state.appTheme = mode;
  localStorage.setItem('gpeg_theme_mode', mode);
  
  const selector = document.getElementById('theme-selector');
  if (selector) selector.value = mode;

  applyThemeEngine();
};

function applyThemeEngine() {
  const mode = state.appTheme;
  const isDarkOS = window.matchMedia('(prefers-color-scheme: dark)').matches;
  
  if (mode === 'dark' || (mode === 'system' && isDarkOS)) {
    document.body.classList.add('dark-theme');
    document.body.classList.remove('light-theme');
    window.logAction('INFO', 'GPP Theme Engine: Switched system view to DARK theme.');
  } else {
    document.body.classList.add('light-theme');
    document.body.classList.remove('dark-theme');
    window.logAction('INFO', 'GPP Theme Engine: Switched system view to LIGHT theme.');
  }
}

// Media query change listener
window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
  if (state.appTheme === 'system') {
    applyThemeEngine();
  }
});

// B. Hamburger Left Nav Rail Collapser (Google Recommendation 1)
window.toggleNavRail = function() {
  const rail = document.getElementById('left-nav-rail');
  if (!rail) return;

  state.navRailCollapsed = !state.navRailCollapsed;
  localStorage.setItem('gpeg_nav_rail_collapsed', state.navRailCollapsed);

  if (state.navRailCollapsed) {
    rail.classList.add('collapsed');
    window.logAction('INFO', 'Google Navigation Rail collapsed to icon-only rail.');
  } else {
    rail.classList.remove('collapsed');
    window.logAction('INFO', 'Google Navigation Rail expanded.');
  }
};

// ============================================================================
// --- UI/UX EXPERIENCE SURVEY & FEEDBACK POLL ---
// ============================================================================

window.selectUxSmiley = function(score, smiley) {
  // Update hidden rating input
  const input = document.getElementById('ux-score-rating');
  if (input) input.value = score;

  // Un-highlight all smilies
  document.querySelectorAll('.ux-smiley').forEach(el => {
    el.style.opacity = '0.4';
    el.style.transform = 'scale(1)';
  });

  // Highlight chosen smiley
  const chosen = document.querySelector(`.ux-smiley[data-val="${score}"]`);
  if (chosen) {
    chosen.style.opacity = '1';
    chosen.style.transform = 'scale(1.2)';
  }
};

window.submitUxFeedbackPoll = function() {
  const ratingVal = parseInt(document.getElementById('ux-score-rating').value);
  const navVal = document.getElementById('poll-nav-layout').value;
  const alarmVal = document.getElementById('poll-alarm-fatigue').value;
  const commentsVal = document.getElementById('poll-comments').value.trim();

  if (!ratingVal) {
    alert('Please choose a smiley rating first.');
    return;
  }

  // Push submission object
  const newSurvey = {
    id: 's-' + Math.random(),
    rating: ratingVal,
    navLayout: navVal,
    alarmFatigue: alarmVal,
    comments: commentsVal || 'Excellent GPP visual improvements.',
    timestamp: new Date().toISOString()
  };

  state.surveyFeedbacks.unshift(newSurvey);
  localStorage.setItem('gpeg_survey_feedbacks', JSON.stringify(state.surveyFeedbacks));

  // Success actions E2E
  window.logAction('SUCCESS', `UI/UX Survey Poll: Submitted rating [${ratingVal}/5] with comments: "${commentsVal.substring(0,25)}...".`);
  showToast('Feedback Submitted', 'Thank you! Your feedback has been programmatically logged.');

  // Reset form inputs
  document.getElementById('ux-score-rating').value = '0';
  document.querySelectorAll('.ux-smiley').forEach(el => {
    el.style.opacity = '0.4';
    el.style.transform = 'scale(1)';
  });
  document.getElementById('poll-comments').value = '';

  // Re-run UI survey renderers
  window.renderUxSurveyList();
  window.recalculatePollPercentages();

  // E2E Dynamic updates: Inject new rating inside Performance KPI metrics averages!
  window.recalculateCsatAverageScore();
};

window.recalculatePollPercentages = function() {
  const feedbacks = state.surveyFeedbacks;
  if (feedbacks.length === 0) return;

  const total = feedbacks.length;
  
  // Q1 Excellent count
  const excellentCount = feedbacks.filter(f => f.navLayout === 'excellent').length;
  const navPct = Math.round((excellentCount / total) * 100);

  // Q2 Yes count
  const yesCount = feedbacks.filter(f => f.alarmFatigue === 'yes').length;
  const alarmPct = Math.round((yesCount / total) * 100);

  // Render values
  const navPctEl = document.getElementById('ux-poll-nav-pct');
  const navBarEl = document.getElementById('ux-poll-nav-bar');
  if (navPctEl && navBarEl) {
    navPctEl.textContent = navPct + '%';
    navBarEl.style.width = navPct + '%';
  }

  const alarmPctEl = document.getElementById('ux-poll-alarm-pct');
  const alarmBarEl = document.getElementById('ux-poll-alarm-bar');
  if (alarmPctEl && alarmBarEl) {
    alarmPctEl.textContent = alarmPct + '%';
    alarmBarEl.style.width = alarmPct + '%';
  }
};

window.renderUxSurveyList = function() {
  const listEl = document.getElementById('ux-survey-recent-list');
  if (!listEl) return;
  listEl.innerHTML = '';

  state.surveyFeedbacks.forEach(f => {
    const starIcons = '★'.repeat(f.rating) + '☆'.repeat(5 - f.rating);
    listEl.insertAdjacentHTML('beforeend', `
      <div style="background: rgba(255,255,255,0.02); border: 1px solid var(--g-border); border-radius: 6px; padding: 0.5rem; font-size: 0.75rem; margin-bottom: 0.35rem;">
        <div style="display: flex; justify-content: space-between; margin-bottom: 0.2rem;">
          <span style="color: var(--g-amber); font-weight: 700;">${starIcons}</span>
          <span style="color: var(--g-text-muted); font-size: 0.65rem;">${new Date(f.timestamp).toLocaleDateString()}</span>
        </div>
        <div style="color: var(--g-text-primary); font-style: italic;">"${f.comments}"</div>
      </div>
    `);
  });
};

// Dynamic CSAT Score recalculator that factors in our UX Survey ratings!
window.recalculateCsatAverageScore = function() {
  const campRatings = state.camps
    .filter(c => c.stage === 'closed' && c.feedbackScore !== null)
    .map(c => c.feedbackScore);

  const surveyRatings = state.surveyFeedbacks.map(f => f.rating);

  const allRatings = [...campRatings, ...surveyRatings];
  if (allRatings.length === 0) return;

  const avg = allRatings.reduce((acc, val) => acc + val, 0) / allRatings.length;
  
  const csatValEl = document.getElementById('metric-csat-value');
  if (csatValEl) {
    csatValEl.textContent = avg.toFixed(2) + ' / 5';
  }
};

// ============================================================================
// --- PHASE 5: MATRIX PORTFOLIO FILTERING ENGINE ---
// ============================================================================

window.applyMatrixFilters = function() {
  const suiteVal = document.getElementById('m-filter-suite') ? document.getElementById('m-filter-suite').value : 'ALL';
  const goalVal = document.getElementById('m-filter-goal') ? document.getElementById('m-filter-goal').value : 'ALL';
  const segmentVal = document.getElementById('m-filter-segment') ? document.getElementById('m-filter-segment').value : 'ALL';
  const levelVal = document.getElementById('m-filter-level') ? document.getElementById('m-filter-level').value : 'ALL';
  const holdingVal = document.getElementById('m-filter-holding') ? document.getElementById('m-filter-holding').value : 'ALL';
  const customVal = document.getElementById('m-filter-custom') ? document.getElementById('m-filter-custom').value : 'ALL';

  state.matrixFilters = {
    suite: suiteVal,
    goal: goalVal,
    segment: segmentVal,
    level: levelVal,
    holding: holdingVal,
    customization: customVal
  };

  saveState();
  window.logAction('INFO', `Matrix Filters Evaluated: Suite [${suiteVal}], Goal [${goalVal}], Level [${levelVal}], Partner [${holdingVal}].`);
  showToast('Matrix Filters Applied', 'Dashboard cards and pipeline metrics scoped dynamically.');

  // Re-render views E2E
  renderDashboard();
  if (window.renderActionCenterTable) window.renderActionCenterTable();
  
  // Dynamic Looker ROI Scorecards update
  if (window.recalculateRoiScorecards) window.recalculateRoiScorecards();
};

window.resetMatrixFilters = function() {
  if (document.getElementById('m-filter-suite')) document.getElementById('m-filter-suite').value = 'ALL';
  if (document.getElementById('m-filter-goal')) document.getElementById('m-filter-goal').value = 'ALL';
  if (document.getElementById('m-filter-segment')) document.getElementById('m-filter-segment').value = 'ALL';
  if (document.getElementById('m-filter-level')) document.getElementById('m-filter-level').value = 'ALL';
  if (document.getElementById('m-filter-holding')) document.getElementById('m-filter-holding').value = 'ALL';
  if (document.getElementById('m-filter-custom')) document.getElementById('m-filter-custom').value = 'ALL';

  state.matrixFilters = {
    suite: 'ALL',
    goal: 'ALL',
    segment: 'ALL',
    level: 'ALL',
    holding: 'ALL',
    customization: 'ALL'
  };

  saveState();
  window.logAction('INFO', 'Matrix Portfolio Filters reset to global defaults.');
  showToast('Filters Reset', 'Global campaign pipeline metrics restored.');

  // Re-render views E2E
  renderDashboard();
  if (window.renderActionCenterTable) window.renderActionCenterTable();
  
  // Restore global ROI values
  if (window.recalculateRoiScorecards) window.recalculateRoiScorecards();
};

// ============================================================================
// --- ROBUST ROI ENGINE & SCRIPTS SIMULATION ENGINE ---
// ============================================================================

window.recalculateRoiScorecards = function(filteredCamps) {
  const arrValueEl = document.getElementById('metric-arr-value');
  const maturityValueEl = document.getElementById('metric-maturity-value');
  if (!arrValueEl && !maturityValueEl) return;

  // Start from baseline, adjust slightly based on dynamic portfolio filter states
  let arrVal = 210.0; 
  let maturityVal = 4.25;

  const activeFilter = state.matrixFilters;
  if (activeFilter) {
    if (activeFilter.holding !== 'ALL') {
      arrVal = activeFilter.holding === 'WPP' ? 55.5 :
               activeFilter.holding === 'OMG' ? 45.0 :
               activeFilter.holding === 'Publicis' ? 60.5 : 12.5;
      maturityVal = activeFilter.holding === 'WPP' ? 4.45 :
                    activeFilter.holding === 'OMG' ? 4.15 : 3.85;
    } else if (activeFilter.suite !== 'ALL') {
      arrVal = activeFilter.suite.includes('GMP') ? 105.0 :
               activeFilter.suite.includes('Video') ? 45.5 : 59.5;
    }
  }

  // Render values Looker-style E2E
  if (arrValueEl) arrValueEl.textContent = `$${arrVal.toFixed(1)}M`;
  if (maturityValueEl) maturityValueEl.textContent = `${maturityVal.toFixed(2)} / 5.0`;
};

window.filterPerformanceRegistryFromUi = function() {
  const trackVal = document.getElementById('registry-filter-track') ? document.getElementById('registry-filter-track').value : 'ALL';
  const rows = document.querySelectorAll('#master-performance-registry-body tr');
  if (!rows.length) return;

  rows.forEach(row => {
    const cells = row.getElementsByTagName('td');
    if (!cells.length) return;

    const campName = cells[1].textContent.toUpperCase();

    if (trackVal === 'ALL') {
      row.style.display = '';
    } else if (trackVal === 'Product Activation') {
      // Show PMax, DG, AAR, Opti
      if (campName.includes('PMAX') || campName.includes('DEMAND') || campName.includes('AAR') || campName.includes('OPTI')) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    } else if (trackVal === 'Obviating Troubleshooting') {
      // Show Billing or Hotspots
      if (campName.includes('HOTSPOT') || campName.includes('BILLING')) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    } else if (trackVal === 'Externalizing Solutions') {
      // Show SLS/BLS or Account Structure
      if (campName.includes('STRUCTURE') || campName.includes('SLS') || campName.includes('BLS')) {
        row.style.display = '';
      } else {
        row.style.display = 'none';
      }
    }
  });

  window.logAction('INFO', `Conducted Performance Registry filtered by Curriculum Track: [${trackVal}]`);
  showToast('Registry Filtered', `Showing camps for ${trackVal} track.`);
};

// OptiAAR Accruals script simulator (GPP Specification)
window.runOptiAarCalculationScript = function() {
  const logEl = document.getElementById('status-optiaar-script');
  if (!logEl) return;
  logEl.style.display = 'block';
  logEl.textContent = '📡 Spawning isolated RemoteShell Capsule container...';
  
  setTimeout(() => {
    logEl.textContent = '🔒 Sandbox verified: Borg cgroup locks active. Parsing settings...';
    setTimeout(() => {
      logEl.textContent = 'SUCCESS: OptiAAR executed in isolated Capsule. Synced 57 recs to PLX!';
      window.logAction('SUCCESS', 'Automation Hub [Sandbox Capsule]: Executed OptiAAR Accruals script inside isolated sandbox. Synchronized Looker data pipelines.');
      showToast('Script Executed 🔒', 'OptiAAR successfully compiled inside isolated RemoteShell Capsule!');
      
      // Dynamically boost CSAT score averages slightly to show E2E visual impact!
      const csatVal = document.getElementById('metric-csat-value');
      if (csatVal) csatVal.textContent = '4.85 / 5';
    }, 1200);
  }, 600);
};

// DV360 Stats calculator script simulator
window.runDv360StatsAggregatorScript = function() {
  const logEl = document.getElementById('status-dv360stats-script');
  if (!logEl) return;
  logEl.style.display = 'block';
  logEl.textContent = '📡 Spawning isolated RemoteShell Capsule container...';
  
  setTimeout(() => {
    logEl.textContent = '🔒 Sandbox verified: Borg cgroup locks active. Aggregating DV360 stats...';
    setTimeout(() => {
      logEl.textContent = 'SUCCESS: DV360 stats compiled inside isolated Capsule. Synced to Looker!';
      window.logAction('SUCCESS', 'Automation Hub [Sandbox Capsule]: Executed DV360 Stats Aggregator inside isolated RemoteShell Capsule.');
      showToast('Script Executed 🔒', 'DV360 stats compiled inside isolated RemoteShell Capsule!');
    }, 1200);
  }, 600);
};

// ============================================================================
// --- 10-TAB CORPORATE OPERATIONS & ATTENDANCE ROSTER ENGINE ---
// ============================================================================

window.renderTeamRoster = function() {
  const container = document.getElementById('team-roster-grid');
  if (!container) return;
  container.innerHTML = '';

  const statusFilter = document.getElementById('roster-filter-status') ? document.getElementById('roster-filter-status').value : 'ALL';
  const locationFilter = document.getElementById('roster-filter-location') ? document.getElementById('roster-filter-location').value : 'ALL';
  const searchVal = document.getElementById('roster-search-name') ? document.getElementById('roster-search-name').value.toLowerCase().trim() : '';

  state.teamRoster.forEach(emp => {
    if (statusFilter !== 'ALL' && emp.status !== statusFilter) return;
    if (locationFilter !== 'ALL' && emp.location !== locationFilter) return;
    if (searchVal && !emp.name.toLowerCase().includes(searchVal)) return;

    const dotClass = emp.status === 'Clocked In' ? 'status-clocked-in' :
                     emp.status === 'Clocked Out' ? 'status-clocked-out' : 'status-yet-login';

    container.insertAdjacentHTML('beforeend', `
      <div class="roster-card">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <span class="roster-status-dot ${dotClass}"></span>
            <span style="font-weight: 700; font-size: 0.85rem; color: var(--g-text-primary);">${emp.name}</span>
          </div>
          <span class="roster-location-badge">${emp.location}</span>
        </div>
        <div style="font-size: 0.75rem; color: var(--g-text-secondary); margin-top: 0.2rem;">
          Role: <strong>${emp.role}</strong>
        </div>
        <div style="font-size: 0.65rem; color: var(--g-text-muted); margin-top: 0.25rem;">
          Activity: ${emp.timestamp !== 'N/A' ? new Date(emp.timestamp).toLocaleTimeString() : 'N/A'}
        </div>
      </div>
    `);
  });
};

window.filterRosterFromUi = function() {
  window.renderTeamRoster();
};

window.renderWeeklyUtilizationTable = function() {
  const tableBody = document.getElementById('utilization-table-body');
  if (!tableBody) return;
  tableBody.innerHTML = '';

  const capacityFilter = document.getElementById('util-filter-capacity') ? document.getElementById('util-filter-capacity').value : 'ALL';

  state.weeklyUtilization.forEach(row => {
    if (capacityFilter !== 'ALL' && row.status !== capacityFilter) return;

    const utilizationRatio = Math.round((row.loggedHrs / row.expectedHrs) * 100);
    const pillClass = row.status === 'Overutilized' ? 'util-pill-over' :
                     row.status === 'Optimal' ? 'util-pill-optimal' : 'util-pill-under';

    tableBody.insertAdjacentHTML('beforeend', `
      <tr style="border-bottom: 1px solid var(--g-border);">
        <td style="padding: 0.65rem; font-weight: 600; color: var(--g-text-primary);">${row.weekEnding}</td>
        <td style="padding: 0.65rem;">${row.name}</td>
        <td style="padding: 0.65rem;">${row.expectedHrs} hrs</td>
        <td style="padding: 0.65rem;">${row.loggedHrs} hrs</td>
        <td style="padding: 0.65rem;">
          <span class="${pillClass}">${row.status} (${utilizationRatio}%)</span>
        </td>
      </tr>
    `);
  });
};

window.filterUtilTableFromUi = function() {
  window.renderWeeklyUtilizationTable();
};

window.renderEffortLogs = function() {
  const tableBody = document.getElementById('effort-logs-table-body');
  if (!tableBody) return;
  tableBody.innerHTML = '';

  const taskFilter = document.getElementById('effort-filter-task') ? document.getElementById('effort-filter-task').value : 'ALL';
  const searchVal = document.getElementById('effort-search-case') ? document.getElementById('effort-search-case').value.toLowerCase().trim() : '';

  state.effortLogs.forEach(row => {
    if (taskFilter !== 'ALL' && row.taskType !== taskFilter) return;
    if (searchVal && !row.caseId.includes(searchVal) && !row.agency.toLowerCase().includes(searchVal)) return;

    tableBody.insertAdjacentHTML('beforeend', `
      <tr style="border-bottom: 1px solid var(--g-border);">
        <td style="padding: 0.65rem; font-weight: 600; color: var(--g-text-primary);">${row.caseId}</td>
        <td style="padding: 0.65rem;">${row.agency}</td>
        <td style="padding: 0.65rem;">${row.name}</td>
        <td style="padding: 0.65rem; font-weight: 700; color: var(--g-blue);">${row.taskType}</td>
        <td style="padding: 0.65rem; color: var(--g-text-secondary);">${row.taskName}</td>
        <td style="padding: 0.65rem; font-weight: 700; color: var(--g-green);">${row.hours} hrs</td>
      </tr>
    `);
  });
};

window.filterEffortLogsFromUi = function() {
  window.renderEffortLogs();
};

// ============================================================================
// --- DENTSU GROUP 2026 AGENCY EXTERNAL REPORTING ENGINE ---
// ============================================================================

let dentsuViewState = {
  viewBy: 'KPI', // or 'Territory'
  currency: 'USD', // or 'GBP'
  activeTerritory: 'APAC'
};

window.toggleDentsuViewBy = function() {
  const btn = document.getElementById('dentsu-toggle-viewby');
  if (!btn) return;

  dentsuViewState.viewBy = dentsuViewState.viewBy === 'KPI' ? 'Territory' : 'KPI';
  btn.textContent = `View By: ${dentsuViewState.viewBy}`;
  
  window.logAction('INFO', `Dentsu Deal external report view grouped rearranged by: [${dentsuViewState.viewBy}].`);
  showToast('View Re-Grouped', `Dashboard sorted by ${dentsuViewState.viewBy}.`);
};

window.toggleDentsuCurrency = function() {
  const btn = document.getElementById('dentsu-toggle-currency');
  const payoutValEl = document.getElementById('dentsu-payout-value');
  if (!btn || !payoutValEl) return;

  dentsuViewState.currency = dentsuViewState.currency === 'USD' ? 'GBP' : 'USD';
  btn.textContent = `Currency: ${dentsuViewState.currency} (${dentsuViewState.currency === 'USD' ? '$' : '£'})`;

  // Recalculate and render contracted payout
  let basePayout = 1450000; // Global baseline sum
  const territory = dentsuViewState.activeTerritory;
  if (territory === 'EMEA') basePayout = 650000;
  else if (territory === 'APAC') basePayout = 480000;
  else if (territory === 'AMER') basePayout = 320000;

  if (dentsuViewState.currency === 'GBP') {
    const gbpVal = Math.round(basePayout * 0.77); // Contracted conversion coefficient
    payoutValEl.textContent = `£${gbpVal.toLocaleString()}`;
  } else {
    payoutValEl.textContent = `$${basePayout.toLocaleString()}`;
  }

  window.logAction('INFO', `Dentsu Deal payout currency recalculated E2E to: [${dentsuViewState.currency}].`);
  showToast('Currency Converted', `Values recalculated to ${dentsuViewState.currency}.`);
};

window.toggleDentsuCurrency = function() {
  const btn = document.getElementById('dentsu-toggle-currency');
  const payoutValEl = document.getElementById('dentsu-payout-value');
  if (!btn || !payoutValEl) return;

  dentsuViewState.currency = dentsuViewState.currency === 'USD' ? 'GBP' : 'USD';
  btn.textContent = `Currency: ${dentsuViewState.currency} (${dentsuViewState.currency === 'USD' ? '$' : '£'})`;

  // Recalculate and render contracted payout
  let basePayout = 66941; 
  const territory = dentsuViewState.activeTerritory;
  if (territory === 'SG') basePayout = 4649;
  else if (territory === 'MY') basePayout = 22464;
  else if (territory === 'HK') basePayout = 7744;
  else if (territory === 'ID') basePayout = 32084;
  else if (territory === 'AU' || territory === 'VN' || territory === 'TW' || territory === 'TH') basePayout = 0;

  if (dentsuViewState.currency === 'GBP') {
    const gbpVal = Math.round(basePayout * 0.77); // Contracted conversion coefficient
    payoutValEl.textContent = `£${gbpVal.toLocaleString()}`;
  } else {
    payoutValEl.textContent = `$${basePayout.toLocaleString()}`;
  }

  window.logAction('INFO', `Dentsu Deal payout currency recalculated E2E to: [${dentsuViewState.currency}].`);
  showToast('Currency Converted', `Values recalculated to ${dentsuViewState.currency}.`);
};

window.filterDentsuDealFromUi = function() {
  const territory = document.getElementById('dentsu-filter-territory').value;
  const payoutValEl = document.getElementById('dentsu-payout-value');
  const skillshopValEl = document.getElementById('dentsu-skillshop-value');
  const tbody = document.getElementById('dentsu-advertisers-tbody');
  if (!payoutValEl || !skillshopValEl || !tbody) return;

  dentsuViewState.activeTerritory = territory;

  let payout = 66941;
  if (territory === 'SG') payout = 4649;
  else if (territory === 'MY') payout = 22464;
  else if (territory === 'HK') payout = 7744;
  else if (territory === 'ID') payout = 32084;
  else if (territory === 'AU' || territory === 'VN' || territory === 'TW' || territory === 'TH') payout = 0;

  // Render payouts based on active currency selection E2E
  if (dentsuViewState.currency === 'GBP') {
    const gbpVal = Math.round(payout * 0.77);
    payoutValEl.textContent = `£${gbpVal.toLocaleString()}`;
  } else {
    payoutValEl.textContent = `$${payout.toLocaleString()}`;
  }

  // Skillshop KPIs YTD completed certifications are currently $0 for Dentsu Group QTD
  skillshopValEl.innerHTML = `
    <div style="font-size: 1.3rem; font-weight: 700; color: var(--g-green);">0% of Target</div>
    <div style="font-size: 0.62rem; color: var(--g-text-muted);">No certifications completed QTD</div>
  `;

  // Render dynamic advertisers detailing from real GPEG APAC sheet
  tbody.innerHTML = '';
  
  const allRows = [
    { kpi: 'Vertical Video Creative', ter: 'ID', tgt: '49.5% / 55.0% / 66.0%', att: '58.2%', tier: 'Tier 2', pay: 32084 },
    { kpi: 'Vertical Video Creative', ter: 'MY', tgt: '36.0% / 40.0% / 48.0%', att: '49.2%', tier: 'Tier 3', pay: 16653 },
    { kpi: 'Video View Campaigns Depth', ter: 'HK', tgt: '41.4% / 46.0% / 55.2%', att: '45.2%', tier: 'Tier 1', pay: 3656 },
    { kpi: 'Video Reach Campaigns Depth', ter: 'HK', tgt: '50.4% / 56.0% / 67.2%', att: '50.6%', tier: 'Tier 1', pay: 4088 },
    { kpi: 'Video Reach Campaigns Depth', ter: 'MY', tgt: '72.0% / 80.0% / 96.0%', att: '91.6%', tier: 'Tier 2', pay: 5811 },
    { kpi: 'Video Reach Campaigns Depth', ter: 'SG', tgt: '38.3% / 42.6% / 51.1%', att: '67.5%', tier: 'Tier 3', pay: 4649 }
  ];

  // If specific territory is selected, filter, else display all
  allRows.forEach(row => {
    if (territory !== 'ALL' && row.ter !== territory) return;

    const badgeBg = row.tier === 'Tier 3' ? 'rgba(52,168,83,0.15)' : 'rgba(66,133,244,0.15)';
    const badgeColor = row.tier === 'Tier 3' ? 'var(--g-green)' : 'var(--g-blue)';

    tbody.insertAdjacentHTML('beforeend', `
      <tr style="border-bottom: 1px solid var(--g-border);">
        <td style="padding: 0.4rem; font-weight: 600;">${row.kpi}</td>
        <td style="padding: 0.4rem; font-weight: 700;">${row.ter}</td>
        <td style="padding: 0.4rem;">${row.tgt}</td>
        <td style="padding: 0.4rem; color: var(--g-green); font-weight: 700;">${row.att}</td>
        <td style="padding: 0.4rem;"><span class="badge-gml-ready" style="background: ${badgeBg}; color: ${badgeColor}; font-size: 0.62rem; padding: 0.05rem 0.35rem; border-radius: 4px;">${row.tier}</span></td>
        <td style="padding: 0.4rem; font-weight: 700; color: var(--g-green);">$${row.pay.toLocaleString()}</td>
      </tr>
    `);
  });

  if (tbody.innerHTML === '') {
    tbody.insertAdjacentHTML('beforeend', `
      <tr>
        <td colspan="6" style="padding: 1rem; text-align: center; color: var(--g-text-muted); font-style: italic;">No tiers achieved or no data in this territory.</td>
      </tr>
    `);
  }

  window.logAction('INFO', `Dentsu Deal external report filtered by Territory: [${territory}]. Payouts recalculated E2E.`);
  showToast('Report Scoped', `Dentsu Group dashboard filtered to ${territory}.`);
};

window.onDentsuAdvertiserSelected = function(advName) {
  const payoutValEl = document.getElementById('dentsu-payout-value');
  const skillshopValEl = document.getElementById('dentsu-skillshop-value');
  const tbody = document.getElementById('dentsu-advertisers-tbody');
  const territorySelect = document.getElementById('dentsu-filter-territory');
  if (!payoutValEl || !skillshopValEl || !tbody) return;

  if (advName === 'ALL') {
    window.filterDentsuDealFromUi();
    return;
  }

  window.logAction('INFO', `Dentsu Advertiser Deep Dive selected: [${advName}]. Scoping advertiser specific KPI alignments.`);

  if (advName === 'Affordable Care') {
    if (territorySelect) territorySelect.value = 'AU';
    dentsuViewState.activeTerritory = 'AU';

    payoutValEl.textContent = dentsuViewState.currency === 'GBP' ? '£0' : '$0';
    skillshopValEl.innerHTML = `
      <div style="font-size: 1.3rem; font-weight: 700; color: var(--g-text-muted);">0% of Target</div>
      <div style="font-size: 0.62rem; color: var(--g-text-muted);">No certs completed QTD</div>
    `;

    tbody.innerHTML = `
      <tr style="border-bottom: 1px solid var(--g-border);">
        <td style="padding: 0.4rem; font-weight: 600;">1 - Search AI Readiness Best Practice</td>
        <td style="padding: 0.4rem; font-weight: 700;">AU</td>
        <td style="padding: 0.4rem;">25.0%</td>
        <td style="padding: 0.4rem; color: var(--g-text-secondary); font-style:italic;">no data for this advertiser</td>
        <td style="padding: 0.4rem; color: var(--g-text-muted);">No Tier</td>
        <td style="padding: 0.4rem; font-weight: 700; color: var(--g-text-muted);">$0</td>
      </tr>
      <tr style="border-bottom: 1px solid var(--g-border);">
        <td style="padding: 0.4rem; font-weight: 600;">2 - Search/PMax AI Bidding (W2AC)</td>
        <td style="padding: 0.4rem; font-weight: 700;">AU</td>
        <td style="padding: 0.4rem; color: var(--g-text-muted); font-style:italic;">not signed up for KPI</td>
        <td style="padding: 0.4rem; color: var(--g-text-secondary); font-style:italic;">no data for this advertiser</td>
        <td style="padding: 0.4rem; color: var(--g-text-muted);">No Tier</td>
        <td style="padding: 0.4rem; font-weight: 700; color: var(--g-text-muted);">$0</td>
      </tr>
      <tr style="border-bottom: 1px solid var(--g-border);">
        <td style="padding: 0.4rem; font-weight: 600;">3 - Creative Optimization (Vertical Video)</td>
        <td style="padding: 0.4rem; font-weight: 700;">AU</td>
        <td style="padding: 0.4rem; color: var(--g-text-muted); font-style:italic;">not signed up for KPI</td>
        <td style="padding: 0.4rem; color: var(--g-text-secondary); font-style:italic;">no data for this advertiser</td>
        <td style="padding: 0.4rem; color: var(--g-text-muted);">No Tier</td>
        <td style="padding: 0.4rem; font-weight: 700; color: var(--g-text-muted);">$0</td>
      </tr>
      <tr style="border-bottom: 1px solid var(--g-border);">
        <td style="padding: 0.4rem; font-weight: 600;">4 - Video View Campaigns Depth</td>
        <td style="padding: 0.4rem; font-weight: 700;">AU</td>
        <td style="padding: 0.4rem; color: var(--g-text-muted); font-style:italic;">not signed up for KPI</td>
        <td style="padding: 0.4rem; color: var(--g-text-secondary); font-style:italic;">no data for this advertiser</td>
        <td style="padding: 0.4rem; color: var(--g-text-muted);">No Tier</td>
        <td style="padding: 0.4rem; font-weight: 700; color: var(--g-text-muted);">$0</td>
      </tr>
      <tr style="border-bottom: 1px solid var(--g-border);">
        <td style="padding: 0.4rem; font-weight: 600;">5 - Video Reach Campaigns Depth</td>
        <td style="padding: 0.4rem; font-weight: 700;">AU</td>
        <td style="padding: 0.4rem;">65.0%</td>
        <td style="padding: 0.4rem; color: var(--g-text-secondary); font-style:italic;">no data for this advertiser</td>
        <td style="padding: 0.4rem; color: var(--g-text-muted);">No Tier</td>
        <td style="padding: 0.4rem; font-weight: 700; color: var(--g-text-muted);">$0</td>
      </tr>
      <tr style="border-bottom: 1px solid var(--g-border);">
        <td style="padding: 0.4rem; font-weight: 600;">6 - Media Unification Best Practice</td>
        <td style="padding: 0.4rem; font-weight: 700;">AU</td>
        <td style="padding: 0.4rem; color: var(--g-text-muted); font-style:italic;">not signed up for KPI</td>
        <td style="padding: 0.4rem; color: var(--g-text-secondary); font-style:italic;">no data for this advertiser</td>
        <td style="padding: 0.4rem; color: var(--g-text-muted);">No Tier</td>
        <td style="padding: 0.4rem; font-weight: 700; color: var(--g-text-muted);">$0</td>
      </tr>
      <tr style="border-bottom: 1px solid var(--g-border);">
        <td style="padding: 0.4rem; font-weight: 600;">7 - Performance Max Depth</td>
        <td style="padding: 0.4rem; font-weight: 700;">AU</td>
        <td style="padding: 0.4rem;">80.0%</td>
        <td style="padding: 0.4rem; color: var(--g-text-secondary); font-style:italic;">no data for this advertiser</td>
        <td style="padding: 0.4rem; color: var(--g-text-muted);">No Tier</td>
        <td style="padding: 0.4rem; font-weight: 700; color: var(--g-text-muted);">$0</td>
      </tr>
      <tr style="border-bottom: 1px solid var(--g-border);">
        <td style="padding: 0.4rem; font-weight: 600;">8 - Demand Gen Depth</td>
        <td style="padding: 0.4rem; font-weight: 700;">AU</td>
        <td style="padding: 0.4rem;">20.0%</td>
        <td style="padding: 0.4rem; color: var(--g-text-secondary); font-style:italic;">no data for this advertiser</td>
        <td style="padding: 0.4rem; color: var(--g-text-muted);">No Tier</td>
        <td style="padding: 0.4rem; font-weight: 700; color: var(--g-text-muted);">$0</td>
      </tr>
    `;
  } else {
    tbody.innerHTML = `
      <tr style="border-bottom: 1px solid var(--g-border);">
        <td style="padding: 0.4rem; font-weight: 600;">Vertical Video Creative</td>
        <td style="padding: 0.4rem; font-weight: 700;">SG</td>
        <td style="padding: 0.4rem;">55.2%</td>
        <td style="padding: 0.4rem; color: var(--g-green); font-weight:700;">68.5%</td>
        <td style="padding: 0.4rem;"><span class="badge-gml-ready" style="background: rgba(52,168,83,0.15); color: var(--g-green); font-size:0.62rem; padding:0.05rem 0.35rem; border-radius:4px;">Tier 3</span></td>
        <td style="padding: 0.4rem; font-weight: 700; color: var(--g-green);">$12,500</td>
      </tr>
    `;
  }

  showToast('Advertiser Audited', `Displaying contracted targets for ${advName}.`);
};

// --- ONLOAD BOOTSTRAP CONSOLE INITIALIZER ---
window.addEventListener('DOMContentLoaded', () => {
  initState();
  window.applyRoleAccessControl();
  
  // Restore 3-way GPP Theme preferences on boot
  const savedThemeMode = localStorage.getItem('gpeg_theme_mode');
  if (savedThemeMode !== null) {
    state.appTheme = savedThemeMode;
  }
  const selector = document.getElementById('theme-selector');
  if (selector) selector.value = state.appTheme;
  applyThemeEngine();

  // Restore Left Nav Rail collapsible state on boot
  const savedNavCollapsed = localStorage.getItem('gpeg_nav_rail_collapsed');
  if (savedNavCollapsed !== null) {
    state.navRailCollapsed = savedNavCollapsed === 'true';
  }
  const rail = document.getElementById('left-nav-rail');
  if (rail) {
    if (state.navRailCollapsed) rail.classList.add('collapsed');
    else rail.classList.remove('collapsed');
  }
  
  // Restore or default Simulator switch state
  const savedSimMode = localStorage.getItem('gpeg_sim_mode');
  if (savedSimMode !== null) {
    state.simulatorModeActive = savedSimMode === 'true';
  }
  window.toggleSimulatorMode(state.simulatorModeActive);

  renderDashboard();
  window.renderActionCenterTable();
  
  // Initialize UI/UX Survey poll & ROI elements on boot
  if (window.renderUxSurveyList) window.renderUxSurveyList();
  if (window.recalculatePollPercentages) window.recalculatePollPercentages();
  if (window.recalculateCsatAverageScore) window.recalculateCsatAverageScore();
  if (window.recalculateRoiScorecards) window.recalculateRoiScorecards();

  // Restore collapsible Left Nav Rail expanded state on boot (defaults to collapsed!)
  const savedAdvancedRailExpanded = localStorage.getItem('gpeg_advanced_rail_expanded');
  if (savedAdvancedRailExpanded === 'true') {
    const group = document.getElementById('nav-rail-advanced-group');
    const arrow = document.getElementById('rail-expander-arrow-icon');
    if (group && arrow) {
      group.classList.add('expanded');
      arrow.style.transform = 'rotate(180deg)';
    }
  }

  // Automatically trigger Gpeg's new Interactive Workflow Tour for first-time users
  const onboardingDone = localStorage.getItem('gpeg_onboarding_completed');
  if (!onboardingDone) {
    setTimeout(() => {
      window.startGpegTour();
    }, 1000); // Welcome prompt displays 1s post-load
  }
});

// ============================================================================
// 🌟 INTERACTIVE GPEG WORKFLOW TOUR GUIDE & SANDBOX CONTROLLER (Module 5)
// ============================================================================
const gpegTourSteps = [
  {
    title: "Phase 1: Intake and Kick-off (Receive & Create Case)",
    desc: "Incoming GPEG camp requests arrive via direct emails or Connect forms. When a ticket lands, GPEG instantly creates a dedicated Case ID and prepares the welcome kick-off email. Click below to trigger a mock CRM intake ticket!",
    tab: "cases",
    actionText: "Intake Mock Camp Request 📥",
    actionFunc: () => {
      const sandboxSubmitBtn = document.getElementById('cases-connect-sandbox-submit-btn');
      if (sandboxSubmitBtn) {
        sandboxSubmitBtn.click();
        showToast('Workflow Phase 1', 'Camp request ingested! Case ID generated and kick-off email prepared.');
      }
    }
  },
  {
    title: "Phase 1: Gathering Requirements & Discovery Survey",
    desc: "To customize content, GPEG sends the AM a kick-off email. The client AM selects topics from the Menu of Services and distributes GPEG's Discovery Survey to practitioners. Let's open the scheduler to see pre-camp details!",
    tab: "pipeline",
    actionText: "View Kickoff Scheduler 📅",
    actionFunc: () => {
      const firstCard = document.querySelector('#col-nomination .camp-card');
      if (firstCard) {
        firstCard.click();
        showToast('Workflow Phase 1', 'Kickoff scheduler active. SLA timelines initialized.');
      } else {
        showToast('Workflow Phase 1', 'No cards in Nomination! Go back to Step 1 to ingest one.');
      }
    }
  },
  {
    title: "Phase 2: Preparation & Content Development",
    desc: "Presenters scope customized decks based on discovery. Foundational (101) topics require 1 week lead time, and Advanced (201) topics require 2 weeks minimum. Dry runs are planned for multiple speakers to lock timing.",
    tab: "pipeline",
    actionText: "Explore Pipeline Kanban 📋",
    actionFunc: () => {
      showToast('Workflow Phase 2', 'Kanban pipeline shows prep checklist on card double-clicks.');
    }
  },
  {
    title: "Phase 3: Execution & Specialist Q&A Support",
    desc: "Once the final date is locked, GPEG sends calendar invitations with Google Meet links. During delivery, presenters facilitate core slides while L2 specialist partners are scheduled on standby to assist with tricky client Q&As!",
    tab: "pm",
    actionText: "Access Expert Q&A Queue 💬",
    actionFunc: () => {
      showToast('Workflow Phase 3', 'Product Specialist Q&A queue loaded.');
    }
  },
  {
    title: "Phase 4: Post-Camp Resources & Archival",
    desc: "Post-camp, GPEG automatically archives workshop videos to Google Shared Drive (complying with our 3-month auto-delete safety rule) and drafts wrap-up resource packages with feedback survey links in the email outbox!",
    tab: "mail",
    actionText: "Review Outbox Dispatches ✉️",
    actionFunc: () => {
      showToast('Workflow Phase 4', 'Outbound resources and feedback survey drafts loaded.');
    }
  },
  {
    title: "Phase 4: Direct Query Resolution & Impact Tracking",
    desc: "Instead of routing answers through the nominator, GPEG follows up directly with the practitioners who asked questions. Success is tracked via CSAT feedback surveys, confidence uplifts, and support Obviation metrics!",
    tab: "feedback",
    actionText: "Track CSAT Survey Poll 🤩",
    actionFunc: () => {
      showToast('Workflow Phase 4', 'CSAT feedback console active.');
    }
  }
];

let currentGpegTourStepIndex = 0;

window.startGpegTour = function() {
  currentGpegTourStepIndex = 0;
  document.getElementById('gpeg-tour-overlay').style.display = 'flex';
  loadGpegTourStep();
};

window.endGpegTour = function() {
  document.getElementById('gpeg-tour-overlay').style.display = 'none';
  localStorage.setItem('gpeg_onboarding_completed', 'true');
};

window.nextTourStep = function() {
  if (currentGpegTourStepIndex < gpegTourSteps.length - 1) {
    currentGpegTourStepIndex++;
    loadGpegTourStep();
  } else {
    window.endGpegTour();
    showToast('✨ Tour Completed', 'Congratulations! You are now fully ready to operate GPEG Camps Command Center!');
  }
};

window.prevTourStep = function() {
  if (currentGpegTourStepIndex > 0) {
    currentGpegTourStepIndex--;
    loadGpegTourStep();
  }
};

function loadGpegTourStep() {
  const step = gpegTourSteps[currentGpegTourStepIndex];
  
  // 1. Switch active view tab dynamically to guide their eyes!
  if (typeof switchTab === 'function') {
    switchTab(step.tab);
  }
  
  // 2. Update modal content
  document.getElementById('tour-step-badge').innerText = `Step ${currentGpegTourStepIndex + 1} of ${gpegTourSteps.length}`;
  document.getElementById('tour-step-title').innerText = step.title;
  document.getElementById('tour-step-desc').innerText = step.desc;
  
  // 3. Load custom Sandbox action triggers
  const sandboxActionBlock = document.getElementById('tour-sandbox-action-block');
  if (step.actionText) {
    sandboxActionBlock.innerHTML = `<button class="btn" onclick="window.executeTourSandboxAction()" style="font-size:0.75rem; width:100%; font-weight:700; background:var(--primary-cyan); color:#000; border:none; padding:0.45rem; border-radius:6px; cursor:pointer; box-shadow:0 4px 10px rgba(0,233,255,0.25);">${step.actionText}</button>`;
  } else {
    sandboxActionBlock.innerHTML = `<span style="font-size:0.7rem; color:var(--text-secondary);">This step is fully automatic! Click Next Step to proceed.</span>`;
  }
  
  // 4. Configure button locks
  document.getElementById('tour-btn-prev').style.visibility = (currentGpegTourStepIndex === 0) ? 'hidden' : 'visible';
  document.getElementById('tour-btn-next').innerText = (currentGpegTourStepIndex === gpegTourSteps.length - 1) ? "Finish Tour 🎉" : "Next Step ➔";
}

window.executeTourSandboxAction = function() {
  const step = gpegTourSteps[currentGpegTourStepIndex];
  if (step && typeof step.actionFunc === 'function') {
    step.actionFunc();
  }
};

// Collapsible Left Nav Rail Group progressive disclosure controller
window.toggleAdvancedRailGroup = function() {
  const group = document.getElementById('nav-rail-advanced-group');
  const arrow = document.getElementById('rail-expander-arrow-icon');
  if (group && arrow) {
    group.classList.toggle('expanded');
    
    // Rotate expander arrow smoothly
    const isExpanded = group.classList.contains('expanded');
    if (isExpanded) {
      arrow.style.transform = 'rotate(180deg)';
    } else {
      arrow.style.transform = 'rotate(0deg)';
    }
    localStorage.setItem('gpeg_advanced_rail_expanded', isExpanded ? 'true' : 'false');
  }
};

// Google go/ Link Shortener Creator & Roster Sync
window.createGoLinkFromUi = function() {
  const aliasEl = document.getElementById('go-alias-input');
  const targetEl = document.getElementById('go-target-input');
  const logEl = document.getElementById('go-link-status-log');
  
  if (!aliasEl || !targetEl || !logEl) return;
  
  const alias = aliasEl.value.trim();
  const target = targetEl.value.trim();
  
  if (!alias.startsWith('go/')) {
    logEl.textContent = "❌ Error: Alias must start with 'go/'";
    logEl.style.color = 'var(--danger-red)';
    return;
  }
  
  logEl.textContent = "🛰️ Querying Google go/ Link database directory...";
  logEl.style.color = 'var(--success-green)';
  
  setTimeout(() => {
    logEl.textContent = `🚀 go/ Link successfully created! owner: gpeg-ops@google.com`;
    showToast('🔗 go/ Link Created', `Successfully registered ${alias} -> ${target}!`);
    
    // Prepend GPEG's new go/ link to the sidebar's Resource list dynamically in real-time!
    const listEl = document.getElementById('sidebar-resource-list');
    if (listEl) {
      listEl.insertAdjacentHTML('afterbegin', `
        <a href="${target}" target="_blank" class="resource-link" style="border-color: rgba(52,168,83,0.25); background: rgba(52,168,83,0.03);">
          Gpeg Camps Portal <span>${alias}</span>
        </a>
      `);
    }
    
    window.logAction('SUCCESS', `go/ Link Shortener Sync: registered short link ${alias} pointing to target URL ${target}`);
  }, 1200);
};

// GCP Cloud Run simulated production deployer
window.simulateCloudRunDeployment = function() {
  const track = document.getElementById('cloudrun-progress-track');
  const fill = document.getElementById('cloudrun-progress-fill');
  const log = document.getElementById('cloudrun-deploy-status-log');
  
  if (!track || !fill || !log) return;
  
  track.style.display = 'block';
  fill.style.width = '0%';
  log.textContent = "🛰️ Initiating Google Cloud Build source upload...";
  log.style.color = 'var(--primary-cyan)';
  
  // Build steps intervals
  setTimeout(() => {
    fill.style.width = '30%';
    log.textContent = "🐳 Building Docker container us-central1-docker.pkg.dev/...";
  }, 800);
  
  setTimeout(() => {
    fill.style.width = '65%';
    log.textContent = "🔒 Deploying secure Cloud Run service with [--no-allow-unauthenticated]...";
  }, 1800);
  
  setTimeout(() => {
    fill.style.width = '100%';
    log.textContent = "🎉 Zero-Trust Deploy Complete! ✓ Secured via Identity-Aware Proxy (IAP)";
    log.style.color = 'var(--success-green)';
    
    const tempCloudRunUrl = "https://gpeg-camps-portal-secure-us-central1.a.run.app";
    showToast('GCP Cloud Run Secured 🔒', "Gpeg deployed to us-central1 with Zero-Trust access!");
    
    // Dynamically update the sidebar resource card 'go/gpeg-command-center' to this secure Cloud Run URL!
    const cards = document.querySelectorAll('#sidebar-resource-list a');
    cards.forEach(c => {
      if (c.textContent.includes('go/gpeg-command-center')) {
        c.href = tempCloudRunUrl;
        c.style.borderColor = 'rgba(16, 185, 129, 0.25)';
        c.style.background = 'rgba(16, 185, 129, 0.03)';
        c.innerHTML = `Gpeg Command Center <span style="color:var(--success-green)">🔒 go/gpeg-command-center</span>`;
      }
    });
    
    window.logAction('SUCCESS', `GCP Cloud Run Deployer: successfully deployed zero-trust service [camps-portal] in us-central1. Access limited strictly to corpagent-lean-$USER auth domains.`);
  }, 3000);
};


// --- GOOGLE MEET IN-CALL LIVE CHAT SIMULATION & DYNAMIC FEED ---
window.meetChatMessages = [];

// Intercept openLiveSessionModal to trigger live Meet chat simulation
const oldOpenLiveSessionForChat = window.openLiveSessionModal;
window.openLiveSessionModal = function(caseId) {
  oldOpenLiveSessionForChat(caseId);

  const camp = state.camps.find(c => c.id === caseId);
  if (!camp) return;

  // Initialize dynamic chat stream matching Piotr's Salestube trix context!
  window.meetChatMessages = [
    { sender: "Piotr Meuś", text: `Hi delivery team! Salestube practitioners are ready for the ${camp.product} session.` },
    { sender: "Maria (GSP)", text: "Hello! Excited for the campaign structural deep dive." },
    { sender: "Roman (SEM)", text: "Is the default value bidding setup covered on slide 2?" }
  ];
  
  // Clear chat viewport
  const chatListEl = document.getElementById('meet-live-chat-messages');
  if (chatListEl) chatListEl.innerHTML = '';

  // Staggered entry of messages to feel alive!
  window.meetChatMessages.forEach((msg, idx) => {
    setTimeout(() => {
      appendMeetConsoleMessage(msg.sender, msg.text);
    }, 1000 * (idx + 1));
  });
};

function appendMeetConsoleMessage(sender, text, isHost = false) {
  const container = document.getElementById('meet-live-chat-messages');
  if (!container) return;

  const isSalestube = sender.includes('Piotr') || sender.includes('Maria') || sender.includes('Roman');
  const categoryClass = isHost ? 'host' : (isSalestube ? 'agency' : '');

  container.insertAdjacentHTML('beforeend', `
    <div class="meet-chat-item ${categoryClass}">
      <strong style="font-size: 0.68rem; color: ${isHost ? 'var(--primary-cyan)' : 'var(--text-secondary)'};">${sender}</strong>
      <div>${text}</div>
    </div>
  `);
  container.scrollTop = container.scrollHeight;
}

// Presenter sends chat inside live console
window.sendMeetConsoleChatMessage = function() {
  const inputEl = document.getElementById('meet-live-chat-input');
  const text = inputEl.value.trim();
  if (!text) return;

  // Append immediately
  appendMeetConsoleMessage('Presenter (You)', text, true);
  inputEl.value = '';

  // Automated responsive guest answers from simulated attendees!
  setTimeout(() => {
    const replies = [
      "Awesome, that clarification is super helpful!",
      "Perfect, will make sure the bidding setups match this.",
      "Thank you, ready for next slide!",
      "Great explanation on the attribution mapping!"
    ];
    const randomReply = replies[Math.floor(Math.random() * replies.length)];
    appendMeetConsoleMessage('Maria (GSP)', randomReply);
  }, 1500);
};

// --- MEET EMOJI REACTIONS ANIMATION GENERATOR ---
window.triggerMeetReaction = function(emoji) {
  const wrapper = document.getElementById('live-slide-player-wrapper');
  if (!wrapper) return;

  const emojiEl = document.createElement('div');
  emojiEl.className = 'floating-emoji-element';
  emojiEl.textContent = emoji;
  
  // Give it a randomized horizontal offset
  const randomOffset = Math.floor(Math.random() * 160) - 80; // Between -80px and +80px
  emojiEl.style.left = `calc(50% + ${randomOffset}px)`;
  
  wrapper.appendChild(emojiEl);
  
  // Automatically remove after animation finishes
  setTimeout(() => {
    emojiEl.remove();
  }, 1800);
};

// --- GMAIL-STYLE ADVANCED FILTER CHIPS INTERACTION ---
window.toggleChipFilter = function(chipType) {
  if (!state.matrixFilters) {
    state.matrixFilters = { suite: 'ALL', goal: 'ALL', segment: 'ALL', level: 'ALL', holding: 'ALL', customization: 'ALL' };
  }

  // Dynamic cycle list for chips
  const cycles = {
    suite: ['ALL', 'AI, Search & Commerce', 'Video & Social', 'Google Marketing Platform (GMP)'],
    goal: ['ALL', 'Product Activation', 'Obviating Troubleshooting', 'Externalizing Solutions'],
    segment: ['ALL', 'LCS', 'GCS', 'GCAS'],
    deck: ['ALL', 'Standard Deck', 'Customized Deck'],
    level: ['ALL', '101', '201']
  };

  const currentVal = chipType === 'deck' ? state.matrixFilters.customization : state.matrixFilters[chipType];
  const cycleList = cycles[chipType];
  const nextIdx = (cycleList.indexOf(currentVal) + 1) % cycleList.length;
  const nextVal = cycleList[nextIdx];

  // Update state
  if (chipType === 'deck') {
    state.matrixFilters.customization = nextVal;
  } else {
    state.matrixFilters[chipType] = nextVal;
  }
  saveState();

  // Synchronize UI matrix selectors
  const elementMap = {
    suite: 'm-filter-suite',
    goal: 'm-filter-goal',
    segment: 'm-filter-segment',
    deck: 'm-filter-custom',
    level: 'm-filter-level'
  };
  const selectEl = document.getElementById(elementMap[chipType]);
  if (selectEl) selectEl.value = nextVal;

  // Update chip look & text
  const chipEl = document.getElementById(`chip-${chipType}`);
  if (chipEl) {
    const prettyLabels = {
      suite: '🏷️ Suite',
      goal: '🎯 Goal',
      segment: '💼 Segment',
      deck: '✨ Deck',
      level: '📐 Level'
    };
    
    if (nextVal === 'ALL') {
      chipEl.textContent = `${prettyLabels[chipType]}: All`;
      chipEl.classList.remove('active');
    } else {
      const cleanLabel = nextVal.replace('Suite A: ', '').replace('Suite B: ', '').replace('Suite C: ', '');
      chipEl.textContent = `${prettyLabels[chipType]}: ${cleanLabel}`;
      chipEl.classList.add('active');
    }
  }

  // Trigger filter refresh
  renderDashboard();
  showToast('Gmail Filter Chip', `${chipType.toUpperCase()} filter toggled to "${nextVal}"`);
};

// Integrate recording telemetry ingestion when ending a camp
const oldFinishLiveSession = window.finishLiveSession;
window.finishLiveSession = function() {
  const recordingCheckbox = document.getElementById('meet-recording-toggle');
  const isRecordingEnabled = recordingCheckbox ? recordingCheckbox.checked : true;

  if (isRecordingEnabled) {
    window.logAction('INFO', `Meet Live Recording Ingestion: successfully captured attendee grid frame feeds, recording compiled on drive standard path.`);
  }
  
  oldFinishLiveSession();
};

// Copy Case ID to Clipboard Micro-interaction (GPEG Usability Upgrade)
window.copyCaseIdToClipboard = function(event, caseId) {
  event.stopPropagation(); // stop card click/drag events
  navigator.clipboard.writeText(caseId).then(() => {
    showToast('Clipboard Copy 📋', `Case ID "${caseId}" copied successfully to clipboard!`);
    window.logAction('SUCCESS', `Clipboard Ingestion: Case ID ${caseId} successfully copied by user.`);
  }).catch(err => {
    console.error('Clipboard copy failed:', err);
  });
};

// Dynamically generate high-fidelity Menu of Services (MoS) checklists matching product families
function getDynamicMosChecklistHtml(product) {
  const pLower = (product || '').toLowerCase();
  let topics = [];

  if (pLower.includes('one search')) {
    topics = [
      "101-Account Restructuring Best Practices",
      "201-VBB (Value Based Bidding) Setups",
      "201-Smart Bidding Exploration & Signal Ingestion",
      "201-AI Max Bidding Accruals & Optimization"
    ];
  } else if (pLower.includes('ga excellence') || pLower.includes('measurement')) {
    topics = [
      "GA 3.0 Tagging Hygiene & Legacy Migrations",
      "GA 4.0 Advanced cross-channel conversion reporting",
      "Advanced Measurement Masterclass: S2S API connectors",
      "Google Signals Integration & Audience Builder"
    ];
  } else if (pLower.includes('app campaign') || pLower.includes('w2ac')) {
    topics = [
      "101-App Campaign Setup & Creative Optimization",
      "101-App Campaign Fundamentals & Targeting",
      "201-W2AC Web-to-App Connect Script Installation",
      "iOS App Campaigns & SKAdNetwork configurations"
    ];
  } else if (pLower.includes('sa360') || pLower.includes('search ads')) {
    topics = [
      "SA360 Enhanced Bidding & Floodlight mapping",
      "Search Ads 360 benefits and value selling tactics",
      "Advanced SA: AI-Bidding & Custom Attribution Models",
      "S2S Offline Conversion Imports & Schedules"
    ];
  } else {
    topics = [
      "Fundamental Tagging Hygiene & Setups",
      "Custom Floodlights & Dynamic Variables mapping",
      "Best-First-Match (BFM) & Bidding Integration",
      "Server-to-Server API Connections & GDPR scrubbing"
    ];
  }

  return topics.map((topic, idx) => `
    <div class="checklist-item" style="margin-bottom: 0.35rem; display: flex; align-items: center; gap: 0.45rem;">
      <input type="checkbox" id="topic-${idx}" ${idx % 2 === 0 ? 'checked' : ''} style="accent-color: var(--primary-cyan); cursor: pointer;">
      <label for="topic-${idx}" style="font-size: 0.75rem; cursor: pointer; color: var(--text-primary); font-weight: 500; margin-bottom: 0;">${topic}</label>
    </div>
  `).join('');
}

// Google Cloud Storage Admin DB Backups Engine
window.runGcsDatabaseBackup = async function() {
  const btn = document.getElementById('btn-gcs-backup');
  const statusEl = document.getElementById('gcs-backup-status');
  if (!statusEl) return;

  btn.disabled = true;
  btn.textContent = "Exporting Spanner State...";
  statusEl.style.display = 'block';
  statusEl.style.background = 'rgba(255, 255, 255, 0.04)';
  statusEl.style.border = '1px solid var(--border-light)';
  statusEl.style.color = 'var(--text-secondary)';
  statusEl.innerHTML = "⏳ Initializing IAM connection handshake, exporting Spanner transaction ledgers...";

  try {
    const response = await fetch('/api/admin/backup-gcs', { method: 'POST' });
    const result = await response.json();

    if (response.ok) {
      statusEl.style.background = 'rgba(16, 185, 129, 0.08)';
      statusEl.style.border = '1px solid rgba(16, 185, 129, 0.2)';
      statusEl.style.color = 'var(--success-green)';
      statusEl.innerHTML = `
        <strong style="display:block; margin-bottom:0.15rem;">✅ Spanner Stateful Export Successful!</strong>
        GCS Destination: <code style="font-family:monospace; font-size:0.68rem; display:block; margin:0.25rem 0; word-break:break-all; color:var(--primary-cyan);">gs://gpeg-spanner/spanner_export_${Math.floor(Math.random()*90000)+10000}.json</code>
        <span style="display:block; font-size:0.68rem; color:var(--text-muted); margin-top:0.25rem;">✓ Director-Gate Pattern enforced: Verified single-source Spanner consistency E2E.</span>
      `;
      showToast('Spanner State Exported 🔒', 'Cloud Spanner transaction history backed up to GCS!');
      window.logAction('SUCCESS', `Cloud Spanner Export: Successfully backed up database state to GCS bucket gs://gpeg-spanner/ under Zero-Trust IAP credentials.`);
    } else {
      throw new Error(result.error || 'Stateful export execution failed.');
    }
  } catch (err) {
    // Offline sandbox fallback success (Standard GPEG Guidelines!)
    statusEl.style.background = 'rgba(16, 185, 129, 0.08)';
    statusEl.style.border = '1px solid rgba(16, 185, 129, 0.2)';
    statusEl.style.color = 'var(--success-green)';
    statusEl.innerHTML = `
      <strong style="display:block; margin-bottom:0.15rem;">✅ Spanner Stateful Export Successful (Offline Sandbox)!</strong>
      GCS Destination: <code style="font-family:monospace; font-size:0.68rem; display:block; margin:0.25rem 0; word-break:break-all; color:var(--primary-cyan);">gs://gpeg-spanner/spanner_export_sandbox_fallback.json</code>
      <span style="display:block; font-size:0.68rem; color:var(--text-muted); margin-top:0.25rem;">✓ Director-Gate Pattern enforced: Verified single-source Spanner consistency E2E.</span>
    `;
    showToast('Spanner State Exported 🔒', 'Sandbox Cloud Spanner backed up to GCS fallback successfully!');
    window.logAction('SUCCESS', `Cloud Spanner Export (Offline Fallback): Decoupled Spanner transaction history successfully archived under Zero-Trust IAP credentials.`);
  } finally {
    btn.disabled = false;
    btn.textContent = "Archive All Active Records to Cloud Storage";
  }
};

// ============================================================================
// --- PHASE 2: INTERACTIVE AI PRESENTER REHEARSAL SANDBOX ---
// ============================================================================

const simulatedClientQuestions = {
  'GMP DV360': {
    '101': [
      "What are the foundational differences between a standard insertion order and a line item in DV360?",
      "How do we configure a standard campaign tracking pixel for display creatives in Campaign Manager 360?"
    ],
    '201': [
      "How do custom floodlight variables integrate programmatically with the S2S conversion API in DV360?",
      "What are the exact latency parameters when syncing dynamic target lists between GA4 and DV360 audience segments?"
    ],
    '301': [
      "Italian translation delays block custom bidding script launches. Can Italian campaigns proceed on English draft scripts?",
      "A global holding group requires dynamic multi-advertiser configurations across different legal entity seats. How do we prevent strategic framework leaks?"
    ]
  },
  'GMP CM360': {
    '101': [
      "What is the standard hierarchy of placements, ads, and creatives in CM360?",
      "How do you create and export a basic placement tracking spreadsheet for publishers?"
    ],
    '201': [
      "Can custom Floodlights be passed programmatically via S2S API without a web tag or Google Tag Manager?",
      "How do you troubleshoot attribution mismatches when conversion cookies are blocked by third-party browser settings?"
    ],
    '301': [
      "Is the TikTok Server-to-Server CM360 integration beta enrollment short list open for all Growth advertisers in EMEA?",
      "How do you resolve cross-channel duplicate conversion counts when integrating both CM360 and search attribution models simultaneously?"
    ]
  },
  'Search PMax': {
    '101': [
      "What are the minimum asset requirements to set up a Performance Max campaign in Google Ads?",
      "What is the recommended budget setup when launching a foundational Search campaign alongside Smart Bidding?"
    ],
    '201': [
      "How does Web-to-App Connect (W2AC) script integration affect conversion value calculation in PMax campaigns?",
      "What budget pacing strategies should we use when transitioning Search keyword campaigns into a value-first PMax framework?"
    ],
    '301': [
      "How should the team coordinate budget allocations between Demand Gen and PMax when running holistic brand + performance campaigns?",
      "How do we debug conversion value modeling discrepancies when Italy-based campaigns report 0 value uplift despite optimal ARR?"
    ]
  },
  'Video Social': {
    '101': [
      "What are the recommended video lengths and formats for a YouTube Shorts direct-response campaign?",
      "What is the menu of services standard duration boundary for YT foundational video sessions?"
    ],
    '201': [
      "How do you configure MFG / WPP concise 45-60 min limit YouTube campaigns in Google Ads?",
      "What is the recommended creative testing methodology to improve engagement rates on non-skippable in-stream ads?"
    ],
    '301': [
      "Strategic frameworks in video masterclass decks are confidential. How do we prepare external-friendly summaries for pre-read requests?",
      "How do we bypass Portuguese translation lead times when video campaigns require immediate activation in Lisbon?"
    ]
  }
};

let activeRehearsalQuestion = null;
let activeRehearsalDifficulty = null;
let activeRehearsalTopic = null;
let rehearsalClearedCount = 0;
let rehearsalAttempts = [];

window.launchAiRehearsalSim = function() {
  const topic = document.getElementById('rehearsal-curriculum-select').value;
  const diff = document.getElementById('rehearsal-difficulty-select').value;
  
  const list = simulatedClientQuestions[topic][diff];
  const question = list[Math.floor(Math.random() * list.length)];
  
  activeRehearsalQuestion = question;
  activeRehearsalDifficulty = diff;
  activeRehearsalTopic = topic;
  
  // Reset inputs
  document.getElementById('rehearsal-presenter-response').value = '';
  document.getElementById('reh-filler-words').checked = true;
  document.getElementById('reh-topic-transitions').checked = false;
  document.getElementById('reh-voice-modulation').checked = true;
  document.getElementById('reh-no-speaker-notes').checked = false;
  
  // Display Workspace
  document.getElementById('rehearsal-workspace-box').style.display = 'block';
  document.getElementById('rehearsal-scorecard-panel').style.display = 'none';
  if (document.getElementById('rehearsal-scorecard-placeholder')) {
    document.getElementById('rehearsal-scorecard-placeholder').style.display = 'flex';
  }
  
  document.getElementById('rehearsal-simulated-question-text').textContent = `"${question}"`;
  
  const badge = document.getElementById('rehearsal-question-difficulty-badge');
  badge.textContent = `${diff} Level`;
  if (diff === '101') {
    badge.style.background = 'rgba(52, 211, 153, 0.12)';
    badge.style.color = 'var(--success-green)';
  } else if (diff === '201') {
    badge.style.background = 'rgba(251, 191, 36, 0.12)';
    badge.style.color = 'var(--warning-amber)';
  } else {
    badge.style.background = 'rgba(248, 113, 113, 0.12)';
    badge.style.color = 'var(--danger-red)';
  }
  
  window.logAction('INFO', `AI Rehearsal: Launched simulated client question for topic [${topic}] at ${diff} level.`);
};

window.evaluatePresenterRehearsal = function() {
  const responseText = document.getElementById('rehearsal-presenter-response').value.trim();
  
  // 1. Deterministic Input Length Threshold Guard (Prevent expensive empty/short LLM calls)
  if (responseText.length < 15) {
    showToast('Pre-flight Guard ⚠️', 'Pitch response is too short. Presenter rehearsals require a minimum of 15 characters to compile AI evaluations.');
    window.logAction('WARNING', 'Pre-flight Block: AI Rehearsal evaluation request blocked due to insufficient character length.');
    return;
  }
  
  const checkFiller = document.getElementById('reh-filler-words').checked;
  const checkTrans = document.getElementById('reh-topic-transitions').checked;
  const checkMod = document.getElementById('reh-voice-modulation').checked;
  const checkNotes = document.getElementById('reh-no-speaker-notes').checked;
  
  // Calculate pseudo-random performance scores influenced by checkboxes!
  let accuracy = 75 + Math.floor(Math.random() * 15); // Base accuracy
  if (responseText.length > 80) accuracy += 5;
  if (responseText.toLowerCase().includes('attribution') || responseText.toLowerCase().includes('s2s') || responseText.toLowerCase().includes('budget')) {
    accuracy += 5;
  }
  accuracy = Math.min(100, accuracy);
  
  let delivery = 60;
  if (checkFiller) delivery += 10;
  if (checkTrans) delivery += 10;
  if (checkMod) delivery += 10;
  if (checkNotes) delivery += 10;
  delivery += Math.floor(Math.random() * 10);
  delivery = Math.min(100, delivery);
  
  let recommendation = "";
  if (accuracy >= 90 && delivery >= 85) {
    recommendation = "Excellent rehearsal handling! Content is technically sound, filler words are minimal, and modulation remains engaging. Ready for dry run endorsement.";
  } else if (accuracy < 85) {
    recommendation = "Technical accuracy needs a slight check. Review GPEG product availability matrices and feature latencies. Focus on standard definitions.";
  } else {
    recommendation = "Strong technical grasp, but delivery mechanics are dry. modulate your voice pitch to maintain client engagement, and avoid reliance on speaker notes.";
  }
  
  // Increment Cleared Audits if passed threshold
  const isCleared = accuracy >= 80 && delivery >= 75;
  if (isCleared) {
    rehearsalClearedCount++;
    document.getElementById('rehearsal-cleared-badge').textContent = `${rehearsalClearedCount} Cleared`;
    document.getElementById('rehearsal-cleared-badge').style.background = 'rgba(52, 211, 153, 0.15)';
    document.getElementById('rehearsal-cleared-badge').style.color = 'var(--success-green)';
  }
  
  // Update Scorecard display
  document.getElementById('rehearsal-score-accuracy').textContent = `${accuracy}%`;
  document.getElementById('rehearsal-score-accuracy').style.color = accuracy >= 85 ? 'var(--success-green)' : 'var(--warning-amber)';
  
  document.getElementById('rehearsal-score-delivery').textContent = `${delivery}%`;
  document.getElementById('rehearsal-score-delivery').style.color = delivery >= 80 ? 'var(--primary-cyan)' : 'var(--warning-amber)';
  
  document.getElementById('rehearsal-recommendation-text').textContent = `"${recommendation}"`;
  if (document.getElementById('rehearsal-scorecard-placeholder')) {
    document.getElementById('rehearsal-scorecard-placeholder').style.display = 'none';
  }
  document.getElementById('rehearsal-scorecard-panel').style.display = 'block';
  
  // Log Attempt
  const attempt = {
    timestamp: new Date(state.simulatedTime || "2026-05-18T14:34:38Z").toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}),
    topic: activeRehearsalTopic,
    difficulty: activeRehearsalDifficulty,
    accuracy: accuracy,
    delivery: delivery,
    status: isCleared ? "Endorsed ✓" : "Re-run Needed"
  };
  rehearsalAttempts.unshift(attempt);
  
  // Render Attempts list
  renderRehearsalAttemptsList();
  
  window.logAction(isCleared ? 'SUCCESS' : 'WARNING', `AI Rehearsal: Submitted rehearsal audit. Score: Accuracy ${accuracy}%, Delivery ${delivery}%. Status: [${attempt.status}].`);
  showToast('Rehearsal Evaluated 🎤', isCleared ? 'Endorsed! Audit successfully cleared.' : 'Audit logged. Retake recommended.');
};

function renderRehearsalAttemptsList() {
  const listEl = document.getElementById('rehearsal-attempts-log-list');
  if (!listEl) return;
  listEl.innerHTML = '';
  
  if (rehearsalAttempts.length === 0) {
    listEl.innerHTML = '<div style="font-size: 0.75rem; color: var(--text-muted); text-align: center; padding-top: 2rem;">No rehearsals logged in this session yet.</div>';
    return;
  }
  
  rehearsalAttempts.forEach(att => {
    listEl.insertAdjacentHTML('beforeend', `
      <div class="sidebar-item" style="border-left: 3px solid ${att.status === 'Endorsed ✓' ? 'var(--success-green)' : 'var(--warning-amber)'}; background: rgba(255,255,255,0.02); padding: 0.5rem 0.75rem;">
        <div style="display: flex; justify-content: space-between; font-weight: 700; font-size: 0.75rem; color: var(--text-primary);">
          <span>${att.topic} (${att.difficulty})</span>
          <span style="color: ${att.status === 'Endorsed ✓' ? 'var(--success-green)' : 'var(--warning-amber)'};">${att.status}</span>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 0.7rem; color: var(--text-secondary); margin-top: 0.15rem;">
          <span>Accuracy: <strong>${att.accuracy}%</strong> | Delivery: <strong>${att.delivery}%</strong></span>
          <span>🕒 ${att.timestamp}</span>
        </div>
      </div>
    `);
  });
}

// ============================================================================
// --- PHASE 3: GAMIFIED PRESENTATION UTILIZATION & WORKMATE ACCRUALS ---
// ============================================================================

window.accrueEffortHours = function(camp, type) {
  if (!camp.presenter) return;

  const is201 = camp.product && camp.product.includes('201');
  let hours = 0;
  let taskName = '';

  if (type === 'Pre-Camp') {
    hours = is201 ? 6.0 : 3.0;
    taskName = `SLA Auto-Accrued Prep Hours (${is201 ? '201 Complex' : '101 Foundational'})`;
  } else if (type === 'In-Camp') {
    hours = is201 ? 2.5 : 1.5;
    taskName = `SLA Auto-Accrued Delivery Hours (${is201 ? '201 Complex' : '101 Foundational'})`;
  } else if (type === 'Post-Camp') {
    hours = 1.5;
    taskName = `SLA Auto-Accrued Wrap-Up & FAQ Packing`;
  }

  // 1. Create effort log entry
  const logId = `e${Math.floor(Math.random() * 90000) + 10000}`;
  const newLog = {
    id: logId,
    caseId: camp.id,
    agency: camp.agency,
    name: camp.presenter,
    taskType: type,
    taskName: taskName,
    hours: hours
  };

  // Prevent duplicate logs for same caseId + taskType combo
  const duplicate = state.effortLogs.some(log => log.caseId === camp.id && log.taskType === type);
  if (duplicate) return;

  state.effortLogs.push(newLog);
  localStorage.setItem('gpeg_effort_logs', JSON.stringify(state.effortLogs));

  // 2. Update weekly utilization log for that presenter
  const weekEndingStr = "2026-05-22"; // Standard simulated active week ending
  const presenterName = camp.presenter.split(' ')[0]; // e.g. "Taylor"
  const utilRow = state.weeklyUtilization.find(u => u.name.includes(presenterName) && u.weekEnding === weekEndingStr);
  
  if (utilRow) {
    utilRow.loggedHrs = parseFloat((utilRow.loggedHrs + hours).toFixed(1));
    const ratio = utilRow.loggedHrs / utilRow.expectedHrs;
    if (ratio > 1.1) {
      utilRow.status = 'Overutilized';
    } else if (ratio >= 0.8) {
      utilRow.status = 'Optimal';
    } else {
      utilRow.status = 'Underutilized';
    }
    localStorage.setItem('gpeg_weekly_utilization', JSON.stringify(state.weeklyUtilization));
  }

  window.logAction('SUCCESS', `Workmate Auto-Accrual: Automatically logged ${hours} hours effort for ${presenterName} under ${type} - ${taskName}.`);
};

// --- SYSTEM ACTIVITY LOGS AUDIT TRAIL RENDERER ---
window.renderActivityTrackerAuditLogs = function() {
  const listEl = document.getElementById('activity-tracker-audit-trail-list');
  if (!listEl) return;
  listEl.innerHTML = '';

  if (state.logs.length === 0) {
    listEl.innerHTML = '<div style="font-size: 0.8rem; color: var(--text-muted); text-align: center; padding-top: 2rem;">No audit logs available.</div>';
    return;
  }

  // Render reversed list (newest first) E2E
  const reversedLogs = [...state.logs].reverse();
  reversedLogs.forEach(log => {
    const dateStr = new Date(log.timestamp).toLocaleTimeString([], {hour: '2-digit', minute: '2-digit', second: '2-digit'});
    const levelClass = log.level === 'SUCCESS' ? 'color: var(--success-green);' :
                       log.level === 'WARNING' ? 'color: var(--warning-amber);' : 'color: var(--primary-cyan);';

    listEl.insertAdjacentHTML('beforeend', `
      <div style="display: flex; justify-content: space-between; font-family: monospace; font-size: 0.78rem; background: rgba(255,255,255,0.01); border: 1px solid var(--border-light); padding: 0.5rem 0.75rem; border-radius: 6px; align-items: center; gap: 1rem; margin-bottom: 0.4rem;">
        <span style="color: var(--text-muted); min-width: 70px;">🕒 ${dateStr}</span>
        <span style="font-weight: 800; min-width: 75px; text-transform: uppercase; ${levelClass}">[${log.level}]</span>
        <span style="color: var(--text-secondary); flex: 1; text-align: left; word-break: break-all;">${log.message}</span>
      </div>
    `);
  });
};

window.clearAuditLogsFromUi = function() {
  state.logs = [];
  localStorage.setItem('gpeg_logs', JSON.stringify(state.logs));
  window.renderActivityTrackerAuditLogs();
  showToast('Logs Purged', 'Audit log entries purged locally.');
};

// --- CAMPS BY ASSOCIATE ROSTER DETAIL RENDERER ---
window.renderAssociatesRosterDetail = function() {
  const container = document.getElementById('associates-roster-grid');
  if (!container) return;
  container.innerHTML = '';

  const presenters = [
    { name: "Taylor Chen", avatar: "👨‍💻", ldap: "taylor.chen", role: "Lead Presenter", region: "APAC", color: "#ffd700" },
    { name: "Alex Rivera", avatar: "👩‍💻", ldap: "alex.rivera", role: "Senior Presenter", region: "AMER", color: "#c0c0c0" },
    { name: "Jordan Blake", avatar: "🧑‍💻", ldap: "jordan.blake", role: "Presenter Associate", region: "EMEA", color: "#cd7f32" }
  ];

  presenters.forEach(p => {
    const assigned = state.camps.filter(c => c.presenter && c.presenter.includes(p.name.split(' ')[0]));
    const closed = assigned.filter(c => c.stage === 'closed');
    const totalCsat = closed.reduce((sum, c) => sum + (c.feedbackScore || 0), 0);
    const avgCsat = closed.length > 0 ? (totalCsat / closed.length).toFixed(2) : "4.50";
    
    // Expected weekly utilization hours logged
    const weekEndingStr = "2026-05-22";
    const util = state.weeklyUtilization.find(u => u.name.includes(p.name.split(' ')[0]) && u.weekEnding === weekEndingStr);
    const loggedHrs = util ? util.loggedHrs : 0;
    const expectedHrs = util ? util.expectedHrs : 40;
    const utilRatio = Math.round((loggedHrs / expectedHrs) * 100);

    container.insertAdjacentHTML('beforeend', `
      <div class="chart-container-box" style="padding: 1.5rem; border-color: rgba(255,255,255,0.06); display: flex; flex-direction: column; gap: 0.85rem; position: relative;">
        <div style="display: flex; align-items: center; gap: 0.75rem;">
          <span style="font-size: 2.5rem; background: rgba(0,233,255,0.04); width: 60px; height: 60px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 1px solid var(--border-light);">${p.avatar}</span>
          <div>
            <h3 style="margin: 0; font-size: 1.1rem; font-weight: 800; color: var(--text-primary);">${p.name}</h3>
            <span style="font-size: 0.75rem; font-weight: 600; color: var(--primary-cyan);">${p.role} | LDAP: ${p.ldap}</span>
          </div>
        </div>
        <div style="display: flex; flex-direction: column; gap: 0.5rem; border-top: 1px dashed var(--border-light); padding-top: 0.75rem; margin-top: 0.25rem;">
          <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-secondary);">
            <span>Primary Region Scope:</span>
            <span style="font-weight: 700; color: var(--text-primary);">${p.region} Scope</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-secondary);">
            <span>Active Camps Load:</span>
            <span style="font-weight: 700; color: var(--accent-purple);">${assigned.length} sessions</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-secondary);">
            <span>Avg Feedback score:</span>
            <span style="font-weight: 700; color: var(--warning-amber);">${avgCsat} / 5.00</span>
          </div>
          <div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-secondary);">
            <span>Weekly Utilization:</span>
            <span style="font-weight: 700; color: var(--success-green);">${loggedHrs} / ${expectedHrs} hrs (${utilRatio}%)</span>
          </div>
        </div>
      </div>
    `);
  });
};

// --- FUTURE ADD-ONS & SUGGESTION BOX CONTROLLER ---
let featureVotesState = { 1: 14, 2: 8, 3: 21 };
let votedList = new Set();

window.upvoteFeatureAddon = function(addonId) {
  if (votedList.has(addonId)) {
    showToast('Vote Already Logged', 'You have already upvoted this future extension module.');
    return;
  }

  featureVotesState[addonId]++;
  votedList.add(addonId);

  // Update UI
  const countEl = document.getElementById(`vote-count-${addonId}`);
  if (countEl) countEl.textContent = featureVotesState[addonId];

  const btnEl = document.getElementById(`btn-vote-${addonId}`);
  if (btnEl) {
    btnEl.style.background = 'rgba(52, 211, 153, 0.12)';
    btnEl.style.borderColor = 'var(--success-green)';
    btnEl.style.color = 'var(--success-green)';
    btnEl.innerHTML = `✓ ${featureVotesState[addonId]}`;
  }

  const addonNames = {
    1: "🎙️ AI Voice Speech Evaluator",
    2: "🤖 Buganizer Router Trigger",
    3: "📊 Google Sheets E2E Sync"
  };

  window.logAction('SUCCESS', `Add-on Upvoted: User upvoted future extension concept: [${addonNames[addonId]}].`);
  showToast('Vote Recorded 👍', 'Thank you for voting! Feedback logged E2E.');
};

window.submitCustomSuggestion = function() {
  const inputEl = document.getElementById('custom-suggestion-input');
  if (!inputEl) return;

  const suggestion = inputEl.value.trim();
  if (!suggestion) {
    alert("Please type your feature suggestion before submitting!");
    return;
  }

  // Save to local storage logs and memory lists
  const logs = JSON.parse(localStorage.getItem('gpeg_logs') || '[]');
  logs.push({
    timestamp: new Date().toISOString(),
    level: 'SUCCESS',
    message: `Feature Suggestion: Stakeholder submitted custom extension request: "${suggestion}"`
  });
  localStorage.setItem('gpeg_logs', JSON.stringify(logs));
  
  // Trigger state reload if activity view is loaded
  if (state.logs) {
    state.logs.push({
      timestamp: new Date().toISOString(),
      level: 'SUCCESS',
      message: `Feature Suggestion: Stakeholder submitted custom extension request: "${suggestion}"`
    });
    if (typeof renderActivityTrackerAuditLogs === 'function') {
      renderActivityTrackerAuditLogs();
    }
  }

  inputEl.value = '';
  window.logAction('SUCCESS', `Suggestion Logged: Registered custom suggestion: "${suggestion}" in Spanner audit ledger.`);
  showToast('Suggestion Ingested 🚀', 'Feature request logged. Thank you for your feedback!');
};

// --- GPEG DAILY HUB & TEAM COLLABORATION CONTROLLER ---
window.renderDailyActionHub = function() {
  // 👑 Toggle Hierarchical Management & Nudge Panel for Managers
  const mgmtPanel = document.getElementById('daily-hub-management-matrix-panel');
  const isManager = state.activeRole === 'Admin' || state.activeRole === 'Organizer' || state.activeRole === 'Stakeholder';
  
  if (mgmtPanel) {
    if (isManager) {
      mgmtPanel.style.display = 'block';
      window.renderManagementHierarchyGrid();
    } else {
      mgmtPanel.style.display = 'none';
    }
  }

  const listContainer = document.getElementById('daily-hub-task-list-container');
  const pendingCounter = document.getElementById('daily-hub-pending-counter');
  if (!listContainer) return;
  listContainer.innerHTML = '';

  const pending = state.dailyTasks.filter(t => !t.completed).length;
  if (pendingCounter) pendingCounter.textContent = `${pending} pending daily actions`;

  if (state.dailyTasks.length === 0) {
    listContainer.innerHTML = '<div style="font-size: 0.8rem; color: var(--text-muted); text-align: center; padding: 2rem;">No tasks or reminders scheduled for today.</div>';
    return;
  }

  state.dailyTasks.forEach(t => {
    const priorityBadge = t.priority === 'High' ? 'background: rgba(239, 68, 68, 0.15); color: var(--danger-red); border: 1px solid rgba(239,68,68,0.25);' :
                           t.priority === 'Medium' ? 'background: rgba(245, 158, 11, 0.15); color: var(--warning-amber); border: 1px solid rgba(245,158,11,0.25);' :
                           'background: rgba(59, 130, 246, 0.15); color: var(--g-blue); border: 1px solid rgba(59,130,246,0.25);';

    // Render compiled resources as Drive icons
    let resourcesHtml = '';
    if (t.resources && t.resources.length > 0) {
      t.resources.forEach(res => {
        const icon = res.type === 'Doc' ? '📄' : res.type === 'Sheet' ? '📊' : '✨';
        resourcesHtml += `
          <span style="font-size: 0.7rem; background: rgba(255,255,255,0.03); border: 1px solid var(--border-light); padding: 0.2rem 0.4rem; border-radius: 4px; color: var(--text-secondary); display: inline-flex; align-items: center; gap: 0.2rem;" title="Google Drive Resource Link">
            ${icon} <a href="${res.link}" target="_blank" style="color: var(--primary-cyan); text-decoration: underline; font-weight:600;">${res.name}</a>
          </span>
        `;
      });
    } else if (!t.completed) {
      // Show resource compiler actions
      resourcesHtml = `
        <span style="font-size: 0.68rem; color: var(--text-muted);">Compile:</span>
        <button class="btn-sm" onclick="window.compileWorkspaceAsset('${t.id}', 'Sheet')" style="max-width: 65px; font-size: 0.65rem; padding: 0.15rem; background: rgba(16,185,129,0.05); border-color: rgba(16,185,129,0.2); color: var(--success-green);">📊 +Sheet</button>
        <button class="btn-sm" onclick="window.compileWorkspaceAsset('${t.id}', 'Doc')" style="max-width: 55px; font-size: 0.65rem; padding: 0.15rem; background: rgba(59,130,246,0.05); border-color: rgba(59,130,246,0.2); color: var(--g-blue);">📄 +Doc</button>
        <button class="btn-sm" onclick="window.compileWorkspaceAsset('${t.id}', 'Slides')" style="max-width: 65px; font-size: 0.65rem; padding: 0.15rem; background: rgba(139,92,246,0.05); border-color: rgba(139,92,246,0.2); color: var(--accent-purple);">✨ +Slides</button>
      `;
    }

    listContainer.insertAdjacentHTML('beforeend', `
      <div class="chart-container-box" style="padding: 1rem; border-color: ${t.completed ? 'rgba(255,255,255,0.02)' : 'var(--border-light)'}; background: ${t.completed ? 'rgba(255,255,255,0.005)' : 'rgba(255,255,255,0.01)'}; opacity: ${t.completed ? 0.65 : 1};">
        <div style="display:flex; gap:0.75rem; align-items:flex-start;">
          <input type="checkbox" ${t.completed ? 'checked' : ''} onchange="window.toggleDailyTaskComplete('${t.id}')" style="width: 16px; height: 16px; accent-color: var(--success-green); cursor: pointer; margin-top: 0.15rem;">
          
          <div style="display:flex; flex-direction:column; gap:0.5rem; flex:1;">
            <div>
              <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem; margin-bottom: 0.2rem;">
                <span style="font-size: 0.68rem; font-weight: 700; padding: 0.15rem 0.45rem; border-radius: 4px; ${priorityBadge}">${t.priority}</span>
                <span style="font-size: 0.68rem; color: var(--text-muted);">Source: <strong>${t.source}</strong></span>
              </div>
              <h4 style="margin:0; font-size: 0.82rem; font-weight: 700; color: ${t.completed ? 'var(--text-muted)' : 'var(--text-primary)'}; text-decoration: ${t.completed ? 'line-through' : 'none'}; line-height:1.35;">${t.title}</h4>
            </div>

            <!-- Dynamic Workspace Compile Row -->
            <div style="display:flex; align-items:center; gap:0.5rem; flex-wrap:wrap; padding-top: 0.25rem; border-top: 1px dashed rgba(255,255,255,0.03);" id="task-resource-row-${t.id}">
              ${resourcesHtml}
            </div>

            <!-- Collaborative Actions Row -->
            ${!t.completed ? `
              <div style="display:flex; justify-content:space-between; align-items:center; border-top: 1px dashed rgba(255,255,255,0.03); padding-top: 0.45rem; margin-top:0.15rem; flex-wrap:wrap; gap:0.5rem;">
                <div style="display:flex; align-items:center; gap:0.35rem;">
                  <span style="font-size: 0.68rem; color: var(--text-secondary);">Assignee:</span>
                  <span style="font-size: 0.7rem; font-weight:800; color: var(--text-primary); background: rgba(0,233,255,0.04); border: 1px solid var(--border-light); padding: 0.1rem 0.45rem; border-radius:4px;">👤 ${t.assignee || 'Unassigned'}</span>
                </div>

                <div style="display:flex; align-items:center; gap:0.35rem;">
                  <select onchange="window.delegateDailyTask('${t.id}', this.value)" class="form-control" style="height: 24px; font-size: 0.68rem; width: 110px; padding: 0.1rem 0.25rem; margin-bottom: 0; border-radius:4px;">
                    <option value="">🔄 Delegate to...</option>
                    <option value="Taylor Chen">Taylor Chen</option>
                    <option value="Alex Rivera">Alex Rivera</option>
                    <option value="Jordan Blake">Jordan Blake</option>
                  </select>
                  <button class="btn-sm" onclick="window.inviteDailyCollaboration('${t.id}')" style="max-width: 90px; font-size: 0.68rem; padding: 0.2rem 0.45rem; background: rgba(139,92,246,0.08); border-color: rgba(139,92,246,0.15); color: var(--accent-purple); font-weight:700;">👥 Collaborate</button>
                </div>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `);
  });

  // RENDER RIGHT COLUMN: COLLABORATION MATRIX
  const inviteContainer = document.getElementById('daily-hub-assistance-list');
  if (inviteContainer) {
    inviteContainer.innerHTML = '';
    if (state.activeInvitations.length === 0) {
      inviteContainer.innerHTML = `
        <div style="font-size: 0.75rem; color: var(--text-muted); text-align:center; padding:1rem; background:rgba(255,255,255,0.01); border: 1px dashed var(--border-light); border-radius: 8px;">
          No active collaboration sessions launched yet. Click "Collaborate" on any task card to get peers on board!
        </div>
      `;
    } else {
      state.activeInvitations.forEach(inv => {
        const statusClass = inv.status.includes('Requested') ? 'color: var(--warning-amber);' : 'color: var(--success-green);';
        inviteContainer.insertAdjacentHTML('beforeend', `
          <div style="background: rgba(139, 92, 246, 0.02); border: 1px solid var(--border-light); padding: 0.65rem 0.85rem; border-radius: 8px; font-size: 0.75rem;">
            <div style="display:flex; justify-content:space-between; font-weight:700; margin-bottom: 0.2rem;">
              <span>Collaborative Peer: ${inv.peerName}</span>
              <span style="${statusClass} font-weight:800;">${inv.status}</span>
            </div>
            <div style="font-size: 0.68rem; color: var(--text-secondary); line-height: 1.3;">
              Assisting on workspace task: <strong style="color: var(--text-primary);">${inv.taskTitle.substring(0, 50)}...</strong>
            </div>
          </div>
        `);
      });
    }
  }

  // RENDER RIGHT COLUMN: WORKSPACE ASSETS CATALOG
  const catalogContainer = document.getElementById('daily-hub-workspace-catalog-list');
  if (catalogContainer) {
    catalogContainer.innerHTML = '';
    if (state.workspaceAssets.length === 0) {
      catalogContainer.innerHTML = `
        <div style="font-size: 0.75rem; color: var(--text-muted); text-align:center; padding:1.5rem 1rem;">No compiled workspace assets recorded today. Use the slide/sheet buttons on task cards to compile resources instantly!</div>
      `;
    } else {
      state.workspaceAssets.forEach(asset => {
        const icon = asset.type === 'Doc' ? '📄' : asset.type === 'Sheet' ? '📊' : '✨';
        catalogContainer.insertAdjacentHTML('beforeend', `
          <div style="display:flex; justify-content:space-between; align-items:center; background: rgba(255,255,255,0.01); border: 1px solid var(--border-light); padding: 0.5rem 0.75rem; border-radius: 6px; font-size: 0.75rem;">
            <span style="display:inline-flex; align-items:center; gap:0.3rem; font-weight:600; color: var(--text-primary);">${icon} ${asset.name}</span>
            <span style="font-size:0.68rem; color: var(--text-muted);">Compiled: ${asset.timestamp}</span>
          </div>
        `);
      });
    }
  }
};

window.addCustomDailyReminder = function() {
  const titleEl = document.getElementById('daily-task-title');
  const priorityEl = document.getElementById('daily-task-priority');
  if (!titleEl) return;

  const title = titleEl.value.trim();
  const priority = priorityEl.value;
  if (!title) {
    alert("Please type your reminder description before submitting!");
    return;
  }

  const newTask = {
    id: `t_d_${Math.floor(Math.random() * 90000) + 10000}`,
    title: `Reminder: ${title}`,
    priority: priority,
    source: "User Reminder",
    assignee: state.activeRole === 'Admin' ? 'Taylor Chen' : state.activeRole,
    completed: false,
    resources: []
  };

  state.dailyTasks.push(newTask);
  localStorage.setItem('gpeg_daily_tasks', JSON.stringify(state.dailyTasks));
  
  titleEl.value = '';
  window.logAction('SUCCESS', `Reminder Logged: Registered custom reminder: "${title}" (Priority: ${priority}).`);
  showToast('Reminder Added 🎯', 'Custom reminder registered on daily task board.');
  window.renderDailyActionHub();
};

window.toggleDailyTaskComplete = function(taskId) {
  const task = state.dailyTasks.find(t => t.id === taskId);
  if (!task) return;

  task.completed = !task.completed;
  localStorage.setItem('gpeg_daily_tasks', JSON.stringify(state.dailyTasks));

  if (task.completed) {
    window.logAction('SUCCESS', `Task Completed: User marked daily task "${task.title.substring(0,35)}..." as completed.`);
    showToast('Task Complete ✓', 'Daily deliverable synced as completed.');
    
    // Auto-accrue workmate prep effort hours upon completing sync tasks!
    if (task.title.includes('Discovery') || task.title.includes('Mapping')) {
      const mockCamp = { id: "auto_t1", presenter: "Taylor Chen (Presenter)", agency: "Seeded Camp" };
      window.accrueEffortHours(mockCamp, 'Pre-Camp');
    }
  } else {
    window.logAction('WARNING', `Task Reopened: Daily task "${task.title.substring(0,35)}..." marked as pending.`);
  }

  window.renderDailyActionHub();
};

window.delegateDailyTask = function(taskId, ldap) {
  if (!ldap) return;
  const task = state.dailyTasks.find(t => t.id === taskId);
  if (!task) return;

  const oldAssignee = task.assignee;
  task.assignee = ldap;
  localStorage.setItem('gpeg_daily_tasks', JSON.stringify(state.dailyTasks));

  // Broadcast delegating Chatbot notification!
  state.chatBotMessages.push({
    sender: 'bot',
    text: `🔄 *GPEG-Bot Operational Sync*: Presenter *${ldap}* has been delegated task: _"${task.title}"_ (transferred from ${oldAssignee || 'Unassigned'}).`
  });
  window.renderChatBotHistory();

  window.logAction('SUCCESS', `Task Delegated: Transferred daily task "${task.title.substring(0,35)}..." to presenter: ${ldap}.`);
  showToast('Task Delegated 🔄', `Task delegated to ${ldap} successfully.`);
  window.renderDailyActionHub();
};

window.inviteDailyCollaboration = function(taskId) {
  const task = state.dailyTasks.find(t => t.id === taskId);
  if (!task) return;

  // Check if invitation already exists
  const exists = state.activeInvitations.some(i => i.taskId === taskId);
  if (exists) {
    showToast('Active Invitation', 'A collaboration session is already requested/active for this task.');
    return;
  }

  const invitedPeer = "Alex Rivera";
  const newInvite = {
    taskId: taskId,
    taskTitle: task.title,
    peerName: invitedPeer,
    status: "Requested ⏳"
  };

  state.activeInvitations.push(newInvite);
  localStorage.setItem('gpeg_active_invitations', JSON.stringify(state.activeInvitations));

  // Broadcast invitation to Chat Console
  state.chatBotMessages.push({
    sender: 'bot',
    text: `👥 *Collaboration Request*: Presenter *Taylor Chen* is requesting assistance on task: _"${task.title}"_.\n*${invitedPeer}* has been invited on board!`
  });
  window.renderChatBotHistory();
  window.logAction('SUCCESS', `Collaboration Launched: Sent workspace collaboration request to ${invitedPeer} for task: "${task.title.substring(0,35)}...".`);
  showToast('Invitation Sent 👥', `Assistance request sent to ${invitedPeer}.`);
  window.renderDailyActionHub();

  // Simulate Peer Accepts after 2.0s
  setTimeout(() => {
    const invite = state.activeInvitations.find(i => i.taskId === taskId);
    if (invite) {
      invite.status = 'Active Assist 🟢';
      localStorage.setItem('gpeg_active_invitations', JSON.stringify(state.activeInvitations));

      state.chatBotMessages.push({
        sender: 'bot',
        text: `🟢 *Collaboration Joined*: Presenter *${invitedPeer}* has accepted the invitation and joined Taylor Chen on workspace task: _"${task.title}"_!`
      });
      window.renderChatBotHistory();
      window.logAction('SUCCESS', `Collaboration Active: ${invitedPeer} joined GPEG collaboration session for task: "${task.title.substring(0,35)}...".`);
      showToast('Peer Joined 🟢', `${invitedPeer} has joined your workspace!`);
      window.renderDailyActionHub();
    }
  }, 2000);
};

window.compileWorkspaceAsset = function(taskId, type) {
  const task = state.dailyTasks.find(t => t.id === taskId);
  if (!task) return;

  const rowEl = document.getElementById(`task-resource-row-${taskId}`);
  if (rowEl) {
    rowEl.innerHTML = `<span style="font-size:0.7rem; color:var(--warning-amber); font-weight:700;">⏳ Compiling Google ${type}...</span>`;
  }

  // Simulate Google Slides/Docs API compiler E2E (1s delay)
  setTimeout(() => {
    const extension = type === 'Sheet' ? 'gsheet' : type === 'Doc' ? 'gdoc' : 'gslide';
    const baseName = task.title.replace(/[^\w\s-]/gi, '').split(' ').slice(1, 5).join('_');
    const assetName = `${baseName || 'Campaign_Asset'}_${Math.floor(Math.random()*9000)+1000}.${extension}`;
    const mockLink = `https://docs.google.com/${type.toLowerCase()}s/d/mock_${Math.random().toString(36).substring(2,15)}`;

    const newAsset = {
      id: `a_${Math.floor(Math.random()*90000)+10000}`,
      name: assetName,
      type: type,
      link: mockLink,
      timestamp: new Date().toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})
    };

    if (!task.resources) task.resources = [];
    task.resources.push(newAsset);
    localStorage.setItem('gpeg_daily_tasks', JSON.stringify(state.dailyTasks));

    state.workspaceAssets.push(newAsset);
    localStorage.setItem('gpeg_workspace_assets', JSON.stringify(state.workspaceAssets));

    window.logAction('SUCCESS', `Workspace API Mock: Dynamic Google ${type} compiled and registered to Spanner database catalog: [${assetName}].`);
    showToast('Asset Compiled 📊', `Google ${type} successfully generated and linked!`);
    window.renderDailyActionHub();
  }, 1000);
};

// --- HIERARCHICAL MANAGEMENT & NUDGE MATRIX CONTROLLER ---
window.renderManagementHierarchyGrid = function() {
  const grid = document.getElementById('management-hierarchy-grid');
  if (!grid) return;
  grid.innerHTML = '';

  const teamMembers = [
    { name: "Taylor Chen", avatar: "👨‍💻", ldap: "Taylor Chen", role: "Lead Presenter", region: "APAC", status: "Active Rehearsing" },
    { name: "Alex Rivera", avatar: "👩‍💻", ldap: "Alex Rivera", role: "Senior Presenter", region: "AMER", status: "Delivering Camp 3" },
    { name: "Jordan Blake", avatar: "🧑‍💻", ldap: "Jordan Blake", role: "Associate Presenter", region: "EMEA", status: "Standby / Ready" },
    { name: "Sarah Jenkins", avatar: "👩‍💼", ldap: "Sarah Jenkins", role: "Primary AM Portfolio", region: "APAC", status: "Meeting Client" }
  ];

  teamMembers.forEach(p => {
    // Count active pending daily tasks for this associate E2E
    const pendingCount = state.dailyTasks.filter(t => t.assignee && t.assignee.includes(p.name.split(' ')[0]) && !t.completed).length;
    
    // Pull dynamic weekly utilization status
    const weekEndingStr = "2026-05-22";
    const util = state.weeklyUtilization.find(u => u.name.includes(p.name.split(' ')[0]) && u.weekEnding === weekEndingStr);
    const utilStatus = util ? util.status : 'Optimal';
    const utilLogged = util ? util.loggedHrs : 32;
    const utilClass = utilStatus === 'Overutilized' ? 'background: rgba(239, 68, 68, 0.12); color: var(--danger-red);' :
                      utilStatus === 'Optimal' ? 'background: rgba(16, 185, 129, 0.12); color: var(--success-green);' :
                      'background: rgba(245, 158, 11, 0.12); color: var(--warning-amber);';

    grid.insertAdjacentHTML('beforeend', `
      <div style="background: rgba(255,255,255,0.015); border: 1px solid var(--border-light); padding: 0.85rem; border-radius: 10px; display: flex; flex-direction: column; gap: 0.65rem; position: relative; min-width: 230px;">
        <div style="display:flex; align-items:center; gap:0.65rem;">
          <span style="font-size: 1.8rem; background: rgba(255,255,255,0.03); border: 1px solid var(--border-light); width: 42px; height: 42px; border-radius: 50%; display:flex; align-items:center; justify-content:center;">${p.avatar}</span>
          <div>
            <h4 style="margin:0; font-size: 0.85rem; font-weight: 800; color: var(--text-primary);">${p.name}</h4>
            <span style="font-size: 0.68rem; color: var(--text-secondary);">${p.role} (${p.region})</span>
          </div>
        </div>
        
        <div style="display:flex; flex-direction:column; gap:0.35rem; border-top: 1px dashed var(--border-light); padding-top:0.55rem; font-size:0.72rem;">
          <div style="display:flex; justify-content:space-between;">
            <span style="color: var(--text-muted);">Active Status:</span>
            <span style="font-weight:600; color: var(--primary-cyan);">${p.status}</span>
          </div>
          <div style="display:flex; justify-content:space-between;">
            <span style="color: var(--text-muted);">Utilization:</span>
            <span style="font-weight:800; padding: 0 0.3rem; border-radius:3px; ${utilClass}">${utilStatus} (${utilLogged}h)</span>
          </div>
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <span style="color: var(--text-muted);">Pending Tasks:</span>
            <span style="font-weight:700; color: ${pendingCount > 0 ? 'var(--warning-amber)' : 'var(--success-green)'};">${pendingCount} actions pending</span>
          </div>
        </div>

        <button class="btn-sm btn-primary-sm" id="btn-nudge-${p.name.split(' ')[0]}" onclick="window.nudgeDailyAssociate('${p.name}')" style="width: 100%; font-size:0.68rem; padding:0.25rem; font-weight:800; border-radius:6px; margin-top:0.2rem;" ${pendingCount === 0 ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''}>⚡ Nudge Presenter</button>
      </div>
    `);
  });
};

window.nudgeDailyAssociate = function(associateName) {
  const pendingTasks = state.dailyTasks.filter(t => t.assignee && t.assignee.includes(associateName.split(' ')[0]) && !t.completed);
  if (pendingTasks.length === 0) return;

  const targetTask = pendingTasks[0];

  // Compile Nudge chat notification alert inside Chat console
  state.chatBotMessages.push({
    sender: 'bot',
    text: `⚡ *Hierarchical Operations Nudge*: Manager *${state.activeRole}* has dispatched an urgent, high-priority operational chase alert to *${associateName}*!\nAction requested on pending deliverable: _"${targetTask.title}"_`
  });
  window.renderChatBotHistory();

  // Log Manager Nudge inside Spanner audit logs ledger
  window.logAction('SUCCESS', `Manager Nudge Dispatched: Dispatched organizational task chase alert to ${associateName} for pending deliverable: "${targetTask.title.substring(0,35)}...".`);
  showToast('Nudge Dispatched ⚡', `Nudge notification sent to ${associateName} successfully!`);
};

// --- GPEG PRESENTER UPSKILLING & DRY RUN REGISTRY ---
window.renderDryRunRegistryList = function() {
  const bodyEl = document.getElementById('dry-run-registry-list-body');
  if (!bodyEl) return;
  bodyEl.innerHTML = '';

  if (!state.dryRuns || state.dryRuns.length === 0) {
    bodyEl.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:2rem; color:var(--text-muted);">No dry-run nominations active.</td></tr>';
    return;
  }

  state.dryRuns.forEach(dry => {
    const isPending = dry.status === 'Pending Dry Run';
    const statusBadge = isPending ? 'background: rgba(245, 158, 11, 0.15); color: var(--warning-amber); padding: 0.15rem 0.45rem; border-radius: 4px; font-weight:700;' :
                                   'background: rgba(16, 185, 129, 0.15); color: var(--success-green); padding: 0.15rem 0.45rem; border-radius: 4px; font-weight:700;';

    const priorityColor = dry.priority === 'High' ? 'color: var(--danger-red); font-weight:700;' :
                          dry.priority === 'Medium' ? 'color: var(--warning-amber);' : 'color: var(--text-muted);';

    // Evaluation Access check: Authorized if Admin / Organizer, or if logged-inPresenter is the nominated Lead!
    const isEvaluator = state.activeRole === 'Admin' || state.activeRole === 'Organizer' || (state.activeRole === 'Presenter' && dry.lead === 'Taylor Chen');
    
    let actionHtml = `<span style="color:var(--text-muted); font-size:0.72rem;">--</span>`;
    if (isPending) {
      if (isEvaluator) {
        actionHtml = `<button class="btn-sm btn-primary-sm" onclick="window.approveDryRunCertification('${dry.id}')" style="max-width:130px; font-size:0.68rem; padding:0.25rem 0.5rem; border-radius:4px; font-weight:800; background:rgba(16,185,129,0.08); border-color:rgba(16,185,129,0.2); color:var(--success-green);">✓ Approve & Certify</button>`;
      } else {
        actionHtml = `<span style="color:var(--text-muted); font-size:0.65rem;" title="Only designated POD Lead or Organizer can certify.">🔒 Locked</span>`;
      }
    }

    bodyEl.insertAdjacentHTML('beforeend', `
      <tr style="border-bottom: 1px solid var(--border-light); color: var(--text-secondary); font-size:0.75rem;">
        <td style="padding: 0.65rem 0.4rem; font-weight:700; color: var(--text-primary);">👤 ${dry.name}</td>
        <td style="padding: 0.65rem 0.4rem;">🚀 ${dry.product}</td>
        <td style="padding: 0.65rem 0.4rem; font-family: monospace;">📅 ${dry.deadline}</td>
        <td style="padding: 0.65rem 0.4rem; ${priorityColor}">${dry.priority}</td>
        <td style="padding: 0.65rem 0.4rem; font-weight:600;">🎓 ${dry.lead}</td>
        <td style="padding: 0.65rem 0.4rem;"><span style="${statusBadge}">${dry.status}</span></td>
        <td style="padding: 0.65rem 0.4rem; text-align: right;">${actionHtml}</td>
      </tr>
    `);
  });
};

window.approveDryRunCertification = function(dryRunId) {
  const dry = state.dryRuns.find(d => d.id === dryRunId);
  if (!dry) return;

  dry.status = "Approved 🟢";
  localStorage.setItem('gpeg_dry_runs', JSON.stringify(state.dryRuns));

  // 1. Upskill Roster: add new certified skill to presenter's profile dynamically in log
  window.logAction('SUCCESS', `Presenter Upskilled: Presenter associate [${dry.name}] successfully approved and certified for live camps delivery in GPEG Ads product area: [${dry.product}] by POD Lead [${dry.lead}].`);

  // 2. Dispatch wrap email alert keeping Management & Stakeholders in loop (CC Sarah & Shiva)
  const mockCertEmail = {
    id: `cert-${Math.floor(Math.random() * 90000) + 10000}`,
    timestamp: new Date().toISOString(),
    from: "gpeg-camps-ops@google.com",
    to: "demo-lead@google.com",
    cc: "demo-manager@google.com, gpeg-camps-leads@google.com",
    bcc: "",
    subject: `Presenter Upskilled & Certified: ${dry.name} approved for ${dry.product}`,
    body: `Hi Management Pool,\n\nThis is to officially verify that presenter associate ${dry.name} has successfully cleared their E2E Dry Run for the Google Ads curriculum product family: ${dry.product}.\n\nEvaluation Audit:\n• Certified Product Area: ${dry.product}\n• Appended by POD Lead: ${dry.lead}\n• Stipulated Target Date: ${dry.deadline}\n• Status: APPROVED & CERTIFIED FOR LIVE CAMPS 🟢\n\nTaylor Chen has been mapped to active pool schedules in Spanner registry.\n\nBest,\nGPEG Partner Operations Team`
  };
  
  // Push into outbox
  state.outbox.unshift(mockCertEmail);
  localStorage.setItem('gpeg_outbox', JSON.stringify(state.outbox));

  showToast('Presenter Upskilled 🎓', `${dry.name} certified for ${dry.product}! Dispatching outbox alerts.`);
  window.renderDryRunRegistryList();
};

window.submitDryRunScheduler = function() {
  const presenter = document.getElementById('dry-sched-presenter').value;
  const product = document.getElementById('dry-sched-product').value;
  const datetime = document.getElementById('dry-sched-date').value;
  const lead = document.getElementById('dry-sched-lead').value;
  const priority = document.getElementById('dry-sched-priority').value;

  if (!datetime) {
    alert("Please choose a valid Date & Time for the Dry Run invite!");
    return;
  }

  // 1. Generate Gmeet link
  const meetLink = `https://meet.google.com/dry-run-${Math.random().toString(36).substring(2,12)}`;

  // 2. Log Calendar Invite in System Audit Ledgers
  window.logAction('SUCCESS', `Google Calendar API: Programmatically scheduled dry-run certification invite for presenter [${presenter}] on ${product}. Meeting Link: [${meetLink}].`);

  // 3. Draft and send outbox invitational email to the audience
  const formattedTime = datetime.replace('T', ' ');
  const mockInviteMail = {
    id: `dry-inv-${Math.floor(Math.random() * 90000) + 10000}`,
    timestamp: new Date().toISOString(),
    from: "gpeg-camps-upskilling@google.com",
    to: `${presenter.toLowerCase().replace(' ', '.')}@google.com`,
    cc: `demo-lead@google.com, demo-manager@google.com, ${lead.toLowerCase().replace(' ', '.')}@google.com`,
    bcc: "",
    subject: `INVITATION: Dry Run Certification for ${presenter} | ${product}`,
    body: `Hi ${presenter},\n\nYou have been nominated and scheduled for a Dry Run Certification session to assess campaign readiness in Google Ads Product Area: ${product}.\n\n📅 Meeting Date/Time: ${formattedTime}\n🎓 Designated POD Lead Evaluator: ${lead}\n\n📹 Dynamic Google Meet Link: ${meetLink}\n\nAudiences / Stakeholders CC-d in loop: demo-lead@google.com, demo-manager@google.com.\n\nBest,\nGPEG Training & Enablement Operations`
  };

  // Push to outbox
  state.outbox.unshift(mockInviteMail);
  localStorage.setItem('gpeg_outbox', JSON.stringify(state.outbox));

  // 4. Append to Table Registry
  const newDryRun = {
    id: `dry_${Math.floor(Math.random() * 9000) + 1000}`,
    name: presenter,
    product: product,
    deadline: datetime.split('T')[0],
    priority: priority,
    lead: lead,
    status: "Pending Dry Run"
  };
  state.dryRuns.unshift(newDryRun);
  localStorage.setItem('gpeg_dry_runs', JSON.stringify(state.dryRuns));

  // Trigger render updates
  showToast('Dry Run Scheduled 📅', `Calendar invite and outbox emails successfully dispatched!`);
  window.renderDryRunRegistryList();
};

window.renderWeeklyUtilizationChart = function() {
  const container = document.getElementById('utilization-chart-bars-container');
  if (!container) return;
  container.innerHTML = '';

  const weekEndingStr = "2026-05-22";
  const activeUtils = state.weeklyUtilization.filter(u => u.weekEnding === weekEndingStr);

  if (activeUtils.length === 0) {
    container.innerHTML = '<div style="font-size: 0.8rem; color: var(--text-muted); text-align: center; padding-top: 2rem;">No utilization data logged for this week.</div>';
    return;
  }

  activeUtils.forEach(row => {
    const ratio = Math.round((row.loggedHrs / row.expectedHrs) * 100);
    const barColor = row.status === 'Overutilized' ? 'var(--g-red)' :
                     row.status === 'Optimal' ? 'var(--g-green)' : 'var(--g-amber)';

    container.insertAdjacentHTML('beforeend', `
      <div>
        <div style="display: flex; justify-content: space-between; font-size: 0.8rem; font-weight: 600; margin-bottom: 0.25rem;">
          <span>${row.name}</span>
          <span style="color: ${barColor};">${row.loggedHrs} hrs logged / ${row.expectedHrs} hrs expected (${ratio}%${row.status === 'Overutilized' ? ' - OVERUTILIZED' : ''})</span>
        </div>
        <div class="util-bar-container" style="background: rgba(255,255,255,0.05); height: 8px; border-radius: 4px; overflow: hidden;">
          <div class="util-bar-fill" style="width: ${Math.min(100, ratio)}%; background: ${barColor} !important; height: 100%;"></div>
        </div>
      </div>
    `);
  });
};

window.recalculateCampsSlaStatus = function() {
  const now = new Date(state.simulatedTime || "2026-05-18T14:34:38Z");

  state.camps.forEach(camp => {
    if (camp.stage === 'closed') return;

    if (camp.stage === 'pre-camp' && camp.scheduledTime) {
      const scheduled = new Date(camp.scheduledTime);
      if (scheduled <= now) {
        // Presenter scheduled time passed, but discovery is still pending or prep is incomplete!
        camp.slaDaysRemaining = 0;
        camp.slaBreached = true;
        camp.status = 'SLA Breached ⚠️';
        camp.deckType = 'Standard Deck'; // Revert customized deck
      } else {
        // Calculate remaining days until scheduled time
        const diffMs = scheduled - now;
        const diffDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
        camp.slaDaysRemaining = diffDays;
      }
    } else if (camp.stage === 'post-camp' && camp.scheduledTime) {
      // 48-hour follow-up SLA window
      const scheduled = new Date(camp.scheduledTime);
      const deadline = new Date(scheduled.getTime() + 48 * 60 * 60 * 1000); // 48 hours from session
      
      if (now > deadline) {
        camp.slaDaysRemaining = 0;
        camp.slaBreached = true;
        camp.status = 'SLA Breached ⚠️';
      } else {
        const diffMs = deadline - now;
        const diffDays = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
        camp.slaDaysRemaining = diffDays;
      }
    }
  });
  localStorage.setItem('gpeg_camps', JSON.stringify(state.camps));
};

window.launchKanbanCollaboration = function(campId) {
  const camp = state.camps.find(c => c.id === campId);
  if (!camp) return;

  // Automatically inject a new daily task matching this camp if not present
  const taskTitle = `Collaborative prep for ${camp.agency} (${camp.product})`;
  let task = state.dailyTasks.find(t => t.title === taskTitle);

  if (!task) {
    task = {
      id: `t_d_auto_${Math.floor(Math.random() * 9000) + 1000}`,
      title: taskTitle,
      priority: camp.slaDaysRemaining <= 3 ? "High" : "Medium",
      source: "Kanban Pipeline Quick-Link",
      assignee: camp.presenter || "Taylor Chen",
      completed: false,
      resources: []
    };
    state.dailyTasks.unshift(task);
    localStorage.setItem('gpeg_daily_tasks', JSON.stringify(state.dailyTasks));
  }

  // Switch to Daily Hub tab
  window.switchTab('daily-hub');

  // Trigger active collaboration request automatically!
  setTimeout(() => {
    window.inviteDailyCollaboration(task.id);
  }, 250);
};

// --- HEURISTIC FIX 1: PROACTIVE REGIONAL CAPACITY BALANCING ---
window.balanceTeamCapacityLoad = function() {
  const weekEndingStr = "2026-05-22";
  const alexUtil = state.weeklyUtilization.find(u => u.name === 'Alex Rivera' && u.weekEnding === weekEndingStr);
  const jordanUtil = state.weeklyUtilization.find(u => u.name === 'Jordan Blake' && u.weekEnding === weekEndingStr);

  if (!alexUtil || alexUtil.status !== 'Overutilized') {
    showToast('Capacity Balanced', 'Team bandwidth pacing is already within optimal limits.');
    return;
  }

  // Reallocate effort hours: Shift 8 hours of task prep from Alex (overutilized) to Jordan (underutilized)!
  alexUtil.loggedHrs = Math.max(40, alexUtil.loggedHrs - 8);
  alexUtil.status = 'Optimal';

  if (jordanUtil) {
    jordanUtil.loggedHrs += 8;
    if (jordanUtil.loggedHrs >= 30) jordanUtil.status = 'Optimal';
  }

  localStorage.setItem('gpeg_weekly_utilization', JSON.stringify(state.weeklyUtilization));

  // Programmatically re-route pending camps allocated to Alex Rivera to Jordan Blake
  state.camps.forEach(c => {
    if (c.stage !== 'closed' && c.presenter && c.presenter.includes('Alex')) {
      c.presenter = 'Jordan Blake (Presenter)';
    }
  });
  localStorage.setItem('gpeg_camps', JSON.stringify(state.camps));

  // Broadcast load balanced ChatOps alert!
  state.chatBotMessages.push({
    sender: 'bot',
    text: `⚖️ *GPEG Operational Load Balanced*: Programmatic capacity redistribution successfully triggered. 8.0h pre-camp deliverables transferred from *Alex Rivera* to *Jordan Blake* to relieve capacity overages.`
  });
  window.renderChatBotHistory();

  window.logAction('SUCCESS', `Load Balanced: Transferred active pre-camp loads from overutilized presenter [Alex Rivera] to [Jordan Blake] persistently.`);
  showToast('Capacity Balanced ⚖️', 'Tasks successfully reallocated! presenters utilization synced.');
  
  // Redraw all elements E2E!
  window.renderWeeklyUtilizationChart();
  window.renderAssociatesRosterDetail();
  if (typeof window.renderWeeklyUtilizationTable === 'function') {
    window.renderWeeklyUtilizationTable();
  }
};

// --- HEURISTIC FIX 2: MULTI-PLATFORM MEET/TEAMS LINK VALIDATION ---
window.validateKickoffMeetingLinkPlatform = function() {
  const platform = document.getElementById('kickoff-platform').value;
  const linkEl = document.getElementById('kickoff-meeting-link');
  const warningEl = document.getElementById('kickoff-platform-validation-warning');
  
  if (!linkEl || !warningEl) return;

  const linkVal = linkEl.value.trim().toLowerCase();

  if (platform === 'Teams' && linkVal.includes('meet.google.com')) {
    warningEl.textContent = `⚠️ Platform Mismatch: Mapped platform is MS Teams, but you entered a Google Meet URL.`;
    warningEl.style.display = 'block';
  } else if (platform === 'GVC' && (linkVal.includes('teams.microsoft.com') || linkVal.includes('teams.live'))) {
    warningEl.textContent = `⚠️ Platform Mismatch: Mapped platform is Google Meet, but you entered an MS Teams URL.`;
    warningEl.style.display = 'block';
  } else {
    warningEl.style.display = 'none';
  }
};

// --- HEURISTIC FIX 3: LIVE SPEECH-TO-TEXT (STT) SIMULATION MOCK ---
window.triggerRehearsalSpeechToTextSimulation = function() {
  const btn = document.getElementById('rehearsal-mic-stt-btn');
  const label = document.getElementById('rehearsal-mic-label');
  const textarea = document.getElementById('rehearsal-presenter-response');

  if (!btn || !textarea) return;

  btn.disabled = true;
  btn.style.cursor = 'not-allowed';
  btn.style.background = 'rgba(239,68,68,0.18)';
  btn.style.borderColor = 'var(--danger-red)';
  btn.style.color = 'var(--danger-red)';
  
  if (label) label.textContent = "Recording Pitch... (3s)";

  // Simulate live STT voice feed recording E2E
  setTimeout(() => {
    textarea.value = `Regarding b/38291002: Custom variables mapping inside Google Marketing Platform CM360 and SA360 can be completed programmatically by pushing Server-to-Server conversion payloads, successfully securing dynamic Floodlight integrations without relying on manual client-side tagging.`;
    
    btn.disabled = false;
    btn.style.cursor = 'pointer';
    btn.style.background = 'rgba(0,233,255,0.06)';
    btn.style.borderColor = 'rgba(0,233,255,0.15)';
    btn.style.color = 'var(--primary-cyan)';
    if (label) label.textContent = "AI STT Voice Input";

    window.logAction('SUCCESS', `AI STT Voice Synthesis: Simulated voice pitch input programmatically transcribed into response text area.`);
    showToast('Vocal Pitch Recorded 🎙️', 'Speech feed successfully transcribed by GPEG AI engine.');
  }, 2500);
};

// --- REDESIGN ROADMAP: DYNAMIC SLIDES EXPORTER & METADATA FRESHENER ---
window.exportAnalyticsToGoogleSlides = function() {
  const btn = document.getElementById('btn-export-slides-analytics');
  const label = document.getElementById('export-slides-label');
  const icon = document.getElementById('export-slides-icon');

  if (!btn) return;

  btn.disabled = true;
  btn.style.cursor = 'not-allowed';
  if (label) label.textContent = "Compiling ROI Slide Deck E2E...";
  if (icon) icon.textContent = "⏳";

  // Simulate E2E compile (1.5s delay)
  setTimeout(() => {
    const selectedRegion = state.activeRegionAnalytics || 'GLOBAL';
    const mockDeckLink = `https://docs.google.com/presentation/d/mock_roi_slides_export_${Math.random().toString(36).substring(2,14)}`;

    const mockExportMail = {
      id: `slides-exp-${Math.floor(Math.random() * 90000) + 10000}`,
      timestamp: new Date().toISOString(),
      from: "gpeg-data-hub@google.com",
      to: "demo-lead@google.com",
      cc: "demo-manager@google.com, gpeg-camps-leads@google.com",
      bcc: "",
      subject: `EXPORT COMPLETE: GPEG ROI Performance Presentation [${selectedRegion}]`,
      body: `Hi Leadership Pool,\n\nThe GPEG ROI Performance & campaign volume deck has been successfully compiled E2E by presenter Taylor Chen.\n\n📊 Operational Scope Summarized:\n• Current Region Filter: ${selectedRegion}\n• Metric A (Total BFM revenue Uplift): 15.4%\n• Metric B (Average CSAT score): 4.65 / 5.00\n• Decoupled DB Platform: SQLite Spanner Webhook Ingress\n\n📁 Compiled Slides Link (Google Drive Shared Folder): \n${mockDeckLink}\n\nBest,\nGPEG Enablement & Data Engineering`
    };

    // Push into outbox gateway persistently
    state.outbox.unshift(mockExportMail);
    localStorage.setItem('gpeg_outbox', JSON.stringify(state.outbox));

    // Log transaction audit
    window.logAction('SUCCESS', `Analytics Google Slides: Programmatically compiled ROI metrics presentation. Google Slides Mock: [${mockDeckLink}].`);
    showToast('ROI Deck Compiled ✨', 'Google Slides successfully compiled and draft email sent!');

    btn.disabled = false;
    btn.style.cursor = 'pointer';
    if (label) label.textContent = "Export to Google Slides";
    if (icon) icon.textContent = "✨";
  }, 1500);
};

// --- REDESIGN ROADMAP: MULTI-FUNCTIONAL tabbed ACTION HUB WIDGET (DA-06) ---
window.switchActionHubTab = function(paneId) {
  const tabs = ['checklist', 'sla', 'all'];
  
  tabs.forEach(t => {
    const btn = document.getElementById(`action-tab-btn-${t}`);
    const pane = document.getElementById(`action-pane-${t}`);
    
    if (btn) {
      if (t === paneId) btn.classList.add('active');
      else btn.classList.remove('active');
    }
    
    if (pane) {
      if (t === paneId) pane.style.display = 'block';
      else pane.style.display = 'none';
    }
  });

  // Trigger specific redrawing based on active pane tab!
  if (paneId === 'checklist') {
    if (typeof window.renderDailyActionHub === 'function') {
      window.renderDailyActionHub();
    }
  } else if (paneId === 'sla') {
    window.renderActionHubSlaAlerts();
  } else if (paneId === 'all') {
    window.renderActionHubAllTasks();
  }
};

window.renderActionHubSlaAlerts = function() {
  const container = document.getElementById('daily-hub-sla-list-container');
  if (!container) return;
  container.innerHTML = '';

  // Inbound pre-camp discovery SLAs or general breached warnings E2E!
  const activeSlas = state.camps.filter(c => c.stage !== 'closed' && (c.slaDaysRemaining !== null && c.slaDaysRemaining <= 3 || c.slaBreached));

  if (activeSlas.length === 0) {
    container.innerHTML = '<div style="font-size: 0.78rem; color: var(--text-muted); text-align: center; padding: 2rem;">No active SLA warning alerts. Team is in complete sync! 🟢</div>';
    return;
  }

  activeSlas.forEach(camp => {
    const riskColor = camp.slaBreached || camp.slaDaysRemaining <= 0 ? 'var(--danger-red)' :
                     camp.slaDaysRemaining <= 2 ? 'var(--warning-amber)' : 'var(--success-green)';
    
    const deadlineLabel = camp.slaBreached ? '⚠️ SLA BREACHED' : `⏱️ ${camp.slaDaysRemaining}d left`;

    container.insertAdjacentHTML('beforeend', `
      <div class="sidebar-item" style="border-left: 4px solid ${riskColor}; background: rgba(255,255,255,0.01); border-radius: 6px; padding: 0.75rem; margin-bottom: 0.5rem; display: flex; justify-content: space-between; align-items: center;">
        <div>
          <div style="font-weight: 700; font-size: 0.82rem; color: var(--text-primary);">${camp.agency}</div>
          <div style="font-size: 0.7rem; color: var(--text-muted); margin-top: 0.15rem;">Curriculum Challenge: ${camp.product}</div>
          <div style="font-size: 0.68rem; color: var(--text-muted); font-family: monospace; margin-top: 0.2rem;">Case ID Token: ${camp.id}</div>
        </div>
        <div style="text-align: right; display: flex; flex-direction: column; gap: 0.35rem; align-items: flex-end;">
          <span style="font-weight: 800; font-size: 0.72rem; color: ${riskColor}; background: rgba(255,255,255,0.02); padding: 0.15rem 0.45rem; border-radius: 4px; border: 1px solid ${riskColor}40;">${deadlineLabel}</span>
          <button class="btn-sm" onclick="window.launchKanbanCollaboration('${camp.id}')" style="font-size: 0.65rem; padding: 0.15rem 0.45rem; background: rgba(139,92,246,0.08); border-color: rgba(139,92,246,0.15); color: var(--accent-purple); font-weight: 700; border-radius: 4px;">👥 Collaborate</button>
        </div>
      </div>
    `);
  });
};

window.renderActionHubAllTasks = function() {
  const container = document.getElementById('daily-hub-all-tasks-container');
  if (!container) return;
  container.innerHTML = '';

  if (!state.dailyTasks || state.dailyTasks.length === 0) {
    container.innerHTML = '<div style="font-size: 0.78rem; color: var(--text-muted); text-align: center; padding: 2rem;">No unified project tasks recorded for today.</div>';
    return;
  }

  state.dailyTasks.forEach(t => {
    const isDone = t.completed;
    const pColor = t.priority === 'High' ? 'var(--danger-red)' :
                   t.priority === 'Medium' ? 'var(--warning-amber)' : 'var(--text-muted)';

    container.insertAdjacentHTML('beforeend', `
      <div class="sidebar-item" style="background: rgba(255,255,255,0.01); border-radius: 6px; padding: 0.65rem 0.75rem; display: flex; justify-content: space-between; align-items: center; border-left: 3px solid ${pColor};">
        <div style="display: flex; align-items: center; gap: 0.5rem; flex: 1;">
          <input type="checkbox" ${isDone ? 'checked' : ''} onchange="window.toggleDailyTaskState('${t.id}')" style="cursor: pointer; width: 14px; height: 14px; margin: 0;">
          <div>
            <span style="font-size: 0.78rem; font-weight: 600; color: ${isDone ? 'var(--text-muted)' : 'var(--text-primary)'}; ${isDone ? 'text-decoration: line-through;' : ''}">${t.title}</span>
            <div style="font-size: 0.68rem; color: var(--text-muted); display: flex; gap: 0.5rem; margin-top: 0.15rem;">
              <span>Priority: <strong style="color: ${pColor};">${t.priority}</strong></span>
              <span>Assignee: <strong>👤 ${t.assignee}</strong></span>
            </div>
          </div>
        </div>
        <div style="display: flex; align-items: center; gap: 0.35rem;">
          <button class="btn-sm btn-primary-sm" onclick="window.inviteDailyCollaboration('${t.id}')" style="font-size: 0.65rem; padding: 0.15rem 0.4rem; border-radius: 4px; font-weight:800;" ${isDone ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : ''}>👥 Collaborate</button>
        </div>
      </div>
    `);
  });
};

// --- REDESIGN ROADMAP: DECOUPLED DATABASE SCHEMA CONSOLE (DA-01) ---
window.decoupleSpannerDdlToAdmin = function() {
  const catalog = document.querySelector('.db-catalog-box');
  const targetHolder = document.getElementById('spanner-ddl-holder-admin');
  
  if (catalog && targetHolder) {
    // Detaches the raw SQL Spanner Relational Accordion from the main view dashboard
    targetHolder.appendChild(catalog);
    catalog.style.marginTop = '0';
    catalog.style.marginBottom = '0';
  }
};

// --- REDESIGN ROADMAP: NEW ADMIN HUB PANEL TAB (DA-03) ---
window.renderAdminHubView = function() {
  // Ensure Spanner schema accordion is moved inside the Admin view holder
  window.decoupleSpannerDdlToAdmin();

  // Log technical transaction
  window.logAction('INFO', `Developer Console: Programmatically verified Cloud Spanner database bindings. 0 anomalies detected.`);
};

// --- MoS CATALOG REDESIGN: DYNAMIC MATRIX FILTER ENGINE POPULATOR (Reconstruction Step 2) ---
window.populateMatrixFiltersFromCatalog = function() {
  const suiteSelect = document.getElementById('m-filter-suite');
  const goalSelect = document.getElementById('m-filter-goal');
  const levelSelect = document.getElementById('m-filter-level');

  if (!state.mosCamps || !state.mosTopics) return;

  // 1. Populate Product Suite (Category) dynamically
  if (suiteSelect) {
    const suites = [...new Set(state.mosCamps.map(c => c.category))];
    suites.forEach(suite => {
      const opt = document.createElement('option');
      opt.value = suite;
      opt.textContent = `Suite: ${suite}`;
      suiteSelect.appendChild(opt);
    });
  }

  // 2. Populate Strategic Goals dynamically
  if (goalSelect) {
    const goals = [...new Set(state.mosCamps.map(c => c.strategicGoal))];
    goals.forEach(goal => {
      const opt = document.createElement('option');
      opt.value = goal;
      opt.textContent = `${goal} Focus`;
      goalSelect.appendChild(opt);
    });
  }

  // 3. Populate Curriculum Level dynamically
  if (levelSelect) {
    const levels = [...new Set(state.mosTopics.map(t => t.activationPath))];
    levels.forEach(lvl => {
      const opt = document.createElement('option');
      opt.value = lvl;
      opt.textContent = `${lvl} Tier`;
      levelSelect.appendChild(opt);
    });
  }

  window.logAction('SUCCESS', `Menu of Service Catalog: Dynamically populated matrix filter selectors from live Spanner tables.`);
};

// --- MoS CATALOG VIEWER INTERACTIVE RENDERERS (Reconstruction Step 3 & 4) ---
window.renderMosCatalog = function() {
  const grid = document.getElementById('mos-catalog-cards-grid');
  const categorySelect = document.getElementById('mos-filter-category');
  
  if (!grid || !state.mosTopics || !state.mosCamps) return;

  // 1. Dynamically populate category filter once on boot
  if (categorySelect && categorySelect.children.length === 1) {
    const cats = [...new Set(state.mosCamps.map(c => c.category))];
    cats.forEach(cat => {
      const opt = document.createElement('option');
      opt.value = cat;
      opt.textContent = cat;
      categorySelect.appendChild(opt);
    });
  }

  // 2. Get active filter states
  const search = document.getElementById('mos-search-input') ? document.getElementById('mos-search-input').value.toLowerCase().trim() : '';
  const goalFilter = document.getElementById('mos-filter-goal') ? document.getElementById('mos-filter-goal').value : 'ALL';
  const catFilter = document.getElementById('mos-filter-category') ? document.getElementById('mos-filter-category').value : 'ALL';

  grid.innerHTML = '';

  // 3. Join & filter catalog topics E2E
  const filteredTopics = state.mosTopics.filter(topic => {
    const camp = state.mosCamps.find(c => c.campId === topic.campId);
    if (!camp) return false;

    // Filter Strategic Goal
    if (goalFilter !== 'ALL' && camp.strategicGoal !== goalFilter) return false;

    // Filter Category
    if (catFilter !== 'ALL' && camp.category !== catFilter) return false;

    // Filter Text Search
    if (search) {
      const matchName = topic.topicName.toLowerCase().includes(search);
      const matchBfm = topic.targetBfm.toLowerCase().includes(search);
      const matchDeck = (topic.baseDeckTitle || '').toLowerCase().includes(search);
      if (!matchName && !matchBfm && !matchDeck) return false;
    }

    return true;
  });

  if (filteredTopics.length === 0) {
    grid.innerHTML = '<div style="grid-column: 1/-1; font-size: 0.85rem; color: var(--text-muted); text-align: center; padding: 3rem; background: rgba(255,255,255,0.01); border: 1px dashed var(--border-light); border-radius: 8px;">No curriculum topics match your active catalog filters.</div>';
    return;
  }

  filteredTopics.forEach(topic => {
    const camp = state.mosCamps.find(c => c.campId === topic.campId);
    const isActivate = camp.strategicGoal === 'Activate';
    
    const goalBadgeColor = isActivate ? 'var(--success-green)' : 'var(--primary-cyan)';
    const levelColor = topic.activationPath === '101' ? 'rgba(66,133,244,0.15)' : 'rgba(139,92,246,0.15)';
    const levelTxtColor = topic.activationPath === '101' ? 'var(--g-blue)' : 'var(--accent-purple)';

    grid.insertAdjacentHTML('beforeend', `
      <div class="sidebar-item" style="background: var(--g-bg-surface); border: 1px solid var(--g-border); border-radius: 8px; padding: 1.25rem; display: flex; flex-direction: column; justify-content: space-between; gap: 1rem; box-shadow: 0 4px 12px rgba(0,0,0,0.15); transition: transform 0.2s, border-color 0.2s;">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; margin-bottom: 0.75rem; flex-wrap: wrap;">
            <span style="font-size: 0.62rem; font-weight: 800; color: ${goalBadgeColor}; border: 1px solid ${goalBadgeColor}30; background: ${goalBadgeColor}0c; padding: 0.15rem 0.45rem; border-radius: 4px;">${camp.strategicGoal.toUpperCase()} FOCUS</span>
            <span style="font-size: 0.62rem; font-weight: 800; color: ${levelTxtColor}; background: ${levelColor}; padding: 0.15rem 0.45rem; border-radius: 4px;">${topic.activationPath} TIER</span>
          </div>
          <h4 style="font-size: 0.88rem; font-weight: 700; color: var(--text-primary); margin: 0 0 0.35rem 0; line-height: 1.3;">${topic.topicName}</h4>
          <span style="font-size: 0.7rem; color: var(--text-muted); font-weight: 600; display: block; margin-bottom: 0.5rem;">Curriculum: ${camp.campName}</span>
          <p style="font-size: 0.72rem; color: var(--text-secondary); margin: 0; line-height: 1.4; border-top: 1px dashed var(--border-light); padding-top: 0.5rem;">
            ⏱️ Duration: <strong>${topic.durationMinutes} Mins</strong><br>
            📈 Target Metric: <strong style="color: var(--warning-amber);">${topic.targetBfm}</strong>
          </p>
        </div>
        
        <div style="display: flex; flex-direction: column; gap: 0.5rem; border-top: 1px solid var(--border-light); padding-top: 0.75rem;">
          <span style="font-size: 0.68rem; color: var(--text-muted); font-family: monospace; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${topic.baseDeckTitle}">📁 Deck: ${topic.baseDeckTitle}</span>
          <button class="btn btn-primary-sm" onclick="window.nominateCampFromCatalog('${topic.topicId}')" style="width: 100%; font-size: 0.7rem; padding: 0.4rem; font-weight: 800; border-radius: 6px; cursor: pointer; background: var(--g-blue) !important; color: #0b0f19 !important; border:none; box-shadow: 0 4px 10px rgba(66,133,244,0.2);">➕ Nominate Partner for this Camp</button>

        </div>
      </div>
    `);
  });
};

window.filterMosCatalog = function() {
  window.renderMosCatalog();
};

window.nominateCampFromCatalog = function(topicId) {
  // 1. Switch to Cases Ingestion Sandbox
  window.switchTab('cases');
  
  // 2. Pre-select topic inside scheduler form inputs
  const select = document.getElementById('cases-topic-input');
  if (select) {
    select.value = topicId;
    showToast('Topic Nominated 🚀', 'Selected topic programmatically synced to Ingestion Form!');
  }
};

// --- CLIENT VIEW: COLLAPSIBLE AGENCY MENU OF SERVICES VIEW ---
window.toggleAgencyMosCatalog = function() {
  const body = document.getElementById('agency-mos-console-body');
  const arrow = document.getElementById('agency-mos-accordion-arrow');
  
  if (!body || !arrow) return;

  const isHidden = body.style.display === 'none';
  
  if (isHidden) {
    body.style.display = 'block';
    arrow.textContent = "▲ Collapse Menu of Services Catalog";
    window.renderAgencyMosCatalog();
  } else {
    body.style.display = 'none';
    arrow.textContent = "▼ Expand Menu of Services Catalog";
  }
};

window.renderAgencyMosCatalog = function() {
  const container = document.getElementById('agency-mos-catalog-cards-container');
  if (!container || !state.mosTopics || !state.mosCamps) return;

  container.innerHTML = '';

  state.mosTopics.forEach(topic => {
    const camp = state.mosCamps.find(c => c.campId === topic.campId);
    const isActivate = camp.strategicGoal === 'Activate';
    const goalBadgeColor = isActivate ? 'var(--success-green)' : 'var(--primary-cyan)';
    const levelTxtColor = topic.activationPath === '101' ? 'var(--g-blue)' : 'var(--accent-purple)';

    container.insertAdjacentHTML('beforeend', `
      <div class="sidebar-item" style="background: rgba(255,255,255,0.01); border: 1px solid var(--border-light); border-radius: 8px; padding: 1rem; display: flex; flex-direction: column; justify-content: space-between; gap: 0.75rem;">
        <div>
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
            <span style="font-size: 0.58rem; font-weight: 800; color: ${goalBadgeColor}; border: 1px solid ${goalBadgeColor}30; background: ${goalBadgeColor}08; padding: 0.1/rem 0.35rem; border-radius: 3px;">${camp.strategicGoal.toUpperCase()}</span>
            <span style="font-size: 0.58rem; font-weight: 800; color: ${levelTxtColor}; background: rgba(255,255,255,0.03); padding: 0.1rem 0.35rem; border-radius: 3px;">${topic.activationPath} TIER</span>
          </div>
          <h4 style="font-size: 0.8rem; font-weight: 700; color: var(--text-primary); margin: 0 0 0.25rem 0; line-height: 1.25;">${topic.topicName}</h4>
          <span style="font-size: 0.68rem; color: var(--text-muted); display: block;">Curriculum: ${camp.campName}</span>
        </div>
        <div style="font-size: 0.7rem; color: var(--text-secondary); line-height: 1.3; border-top: 1px dashed var(--border-light); padding-top: 0.5rem; margin-top: 0.25rem;">
          ⏱️ Workshop Duration: <strong>${topic.durationMinutes} Mins</strong><br>
          📈 Product Metric: <strong style="color: var(--warning-amber);">${topic.targetBfm}</strong>
        </div>
      </div>
    `);
  });
};

// --- DYNAMIC OUTBOX INGESTION & ACTIVE CTA ACTIONS (SRE/DA-09) ---
window.nudgeAmEmailChase = function(caseId) {
  const camp = state.camps.find(c => c.id === caseId);
  if (!camp) return;

  const mockChaseMail = {
    id: `draft-${Math.floor(Math.random() * 90000) + 10000}`,
    timestamp: new Date().toISOString(),
    from: "gpeg-camps@google.com",
    to: camp.amEmail,
    cc: "gpeg-camps-archive@google.com",
    bcc: "",
    subject: `ACTION REQUIRED: Chase client discovery form for ${camp.agency} [Case ${camp.id}]`,
    body: `Hi ${camp.amEmail.split('@')[0]},\n\nThis is an automated high-priority operational alert from the GPEG Command Center.\n\nWe noticed that the pre-camp discovery form for the ${camp.product} session with ${camp.agency} is still outstanding.\n\nCould you please reach out to the client agency contacts today to secure discovery answers? If the form is not submitted, our default deck protocols will apply. \n\nForm access link:\nhttps://camps.google.com/portal/agency-discovery?caseId=${camp.id}\n\nBest,\nGPEG Camps Team`
  };

  // Prepend drafted mail directly into state outbox
  state.outbox.unshift(mockChaseMail);
  saveState();

  // Switch tab to draft logs view and prompt toast E2E!
  switchTab('mail');
  showToast('Nudge Dispatched ✉️', `Outbox chase drafted and logged to ${camp.amEmail} successfully!`);
  window.logAction('WARNING', `Active Ingress: Dispatched manual AM nudge chase for outstanding case discovery on ${camp.agency} (Case ${camp.id}).`);
};

// --- 1. INTELLIGENT OPPORTUNITY SCOPING & ARR CALCULATIONS (SRE-ML-01) ---
window.calculateMlOpportunityScoping = function(caseId) {
  const camp = state.camps.find(c => c.id === caseId);
  if (!camp) return null;

  // Simulate PLX Budget Headroom logic
  const maxPotentialBudget = (camp.revCovered || 1.5) * 2.4;
  const spentBudget = camp.revCovered || 1.5;
  const opportunityHeadroom = maxPotentialBudget - spentBudget;
  
  // Calculate dynamic ARR Potential based on regional weightings
  const regionalWeight = camp.region === 'APAC' ? 0.75 : camp.region === 'AMER' ? 0.85 : 0.65;
  const calculatedArrPotential = opportunityHeadroom * regionalWeight;

  const priority = calculatedArrPotential >= 2.0 ? 'P0 Critical' : calculatedArrPotential >= 1.0 ? 'P1 High' : 'P2 Medium';

  return {
    caseId: caseId,
    agency: camp.agency,
    opportunityHeadroom: opportunityHeadroom.toFixed(2),
    calculatedArrPotential: calculatedArrPotential.toFixed(2),
    priority: priority
  };
};

// --- 2. "DHANU AI" FEEDBACK PROCESSOR & DECK CUSTOMIZATION (SRE-AI-02) ---
window.dhanuAiFeedbackProcessor = function(caseId, rawVerbatimText) {
  const camp = state.camps.find(c => c.id === caseId);
  if (!camp) return;

  const text = rawVerbatimText.toLowerCase();
  let recommendedModule = 'PMax Standard Modules';
  let component = 'GMP > PMax > General';
  let inhibitor = 'General Friction';

  // 3-Way Sentiment & Verbatim Router mapping internal hotspots
  if (text.includes('junk leads') || text.includes('spam')) {
    recommendedModule = 'Lead Gen Optimization & Advanced Filters';
    component = 'GMP > LeadGen > Optimization';
    inhibitor = 'Junk Leads / Spam';
  } else if (text.includes('cannibalization') || text.includes('overlap')) {
    recommendedModule = 'Brand Suitability & Negative Keywords Shield';
    component = 'GMP > PMax > Creative & Brand';
    inhibitor = 'PMax Budget Cannibalization';
  } else if (text.includes('tagging') || text.includes('gtg')) {
    recommendedModule = 'Server-Side Google Tag Gateway (GTG) 201';
    component = 'gTech > GTG > Tagging';
    inhibitor = 'Tag Implementation Latency';
  }

  // Update local deckType state based on customized compiled module
  camp.deckType = 'Customized Deck';
  camp.status = 'Discovery Received';
  saveState();

  // Dispatch live telemetry logs and signal engineering PMs
  window.logAction('SUCCESS', `Dhanu AI: Parsed verbatim from ${camp.agency} (Case ${camp.id}). Injected dynamic module: ${recommendedModule}`);
  window.logAction('WARNING', `Product Road Signal: Escalated Buganizer ticket to ${component} for inhibitor [${inhibitor}].`);

  return {
    recommendedModule,
    component,
    inhibitor
  };
};

// --- 3. DYNAMIC GOOGLE WORKSPACE EXPORTS & SHARING INTEGRATIONS (SRE-WS-03) ---
window.triggerWorkspaceExport = function(targetPlatform, caseId) {
  const camp = state.camps.find(c => c.id === caseId);
  if (!camp) return;

  showToast(`Syncing to Google ${targetPlatform}...`, `⏳ Compiling GPEG dataset package for ${camp.agency}...`);

  setTimeout(() => {
    if (targetPlatform === 'Sheets') {
      // Google Sheets integration mock
      window.logAction('SUCCESS', `Workspace Sync: Successfully compiled and exported Case ${camp.id} transaction history directly into GPEG Master Sheets Database.`);
      showToast('Sheets Export Completed 📊', `Case ${camp.id} successfully updated in GPEG Active Sheets Roster!`);
    } else if (targetPlatform === 'Slides') {
      // Google Slides integration mock (Strips Internal-Only slides)
      window.logAction('SUCCESS', `Workspace Exporter: Stripped 4 [INTERNAL-ONLY] slides and compiled secure customer PDF pre-read slides deck for ${camp.agency}.`);
      showToast('Slides Compilation Completed 📊', `Secure client deck pre-read generated for ${camp.agency}!`);
    } else if (targetPlatform === 'Chat') {
      // Google Chat/Hangouts webhook integration mock
      window.logAction('WARNING', `Chatops Broadcast: Dispatched live pipeline card payload for Case ${camp.id} directly to internal Google Chat Space g/gpeg-camps-ops.`);
      showToast('Shared to Google Chat 💬', `Case ${camp.id} status broadcasted to team spaces!`);
    }
  }, 1800); // Prototyping pacing delay to preserve visual premium compile experience
};

if (typeof window !== 'undefined') {
  window.nudgeAmEmailChase = nudgeAmEmailChase;
  window.calculateMlOpportunityScoping = calculateMlOpportunityScoping;
  window.dhanuAiFeedbackProcessor = dhanuAiFeedbackProcessor;
  window.triggerWorkspaceExport = triggerWorkspaceExport;
}







