// 🎨 GPEG Camps - UI Rendering Component Framework Module
import { state } from '../core/state.js';

// Setup legacy global variable bindings to prevent reference errors E2E
if (typeof window !== 'undefined') {
  window.activeLiveCampId = window.activeLiveCampId || null;
  window.rehearsalAttempts = window.rehearsalAttempts || [];
}

// --- TOAST SYSTEM ---
export function showToast(title, message) {
  const container = document.getElementById('toast-container');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.innerHTML = `
    <div class="toast-title">${title}</div>
    <div>${message}</div>
  `;
  container.appendChild(toast);
  
  setTimeout(() => {
    toast.style.transition = 'all 0.3s ease';
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(30px)';
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// --- STYLING HELPERS ---
export function getRegionStyle(region) {
  switch (region) {
    case 'EMEA': return 'background: rgba(0, 233, 255, 0.12); border: 1px solid rgba(0, 233, 255, 0.25); color: var(--primary-cyan);';
    case 'AMER': return 'background: rgba(139, 92, 246, 0.12); border: 1px solid rgba(139, 92, 246, 0.25); color: var(--accent-purple);';
    case 'APAC': return 'background: rgba(255, 170, 0, 0.12); border: 1px solid rgba(255, 170, 0, 0.25); color: var(--warning-amber);';
    default: return 'background: rgba(255, 255, 255, 0.06); border: 1px solid var(--border-light); color: var(--text-secondary);';
  }
}

export function getStageBadgeColor(status) {
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

export function getActionButton(camp) {
  const role = state.activeRole;
  let actionBtn = '';

  if (role === 'PM') {
    const pendingQuestions = camp.liveQuestions.some(q => !q.answered);
    if (pendingQuestions) {
      return `<button class="btn-sm btn-primary-sm" style="background: var(--danger-red); border-color: var(--danger-red); color: #fff;" onclick="window.switchTab('pm')">🐛 Resolve Q&A</button>`;
    }
    return `<span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 600;">Read-Only Lock 🔒</span>`;
  }

  if (role === 'AM') {
    if (camp.stage === 'pre-camp' && camp.discoveryStatus === 'Pending') {
      return `<button class="btn-sm btn-primary-sm" style="background: var(--warning-amber); border-color: var(--warning-amber); color: var(--bg-darker);" onclick="window.nudgeAmEmailChase('${camp.id}')">⚡ Nudge AM</button>`;
    }
    return `<span style="font-size: 0.72rem; color: var(--text-muted); font-weight: 600;">Read-Only Lock 🔒</span>`;
  }

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

  const colBtn = `<button class="btn-sm" onclick="window.launchKanbanCollaboration('${camp.id}')" style="max-width:90px; margin-left: 0.35rem; font-size: 0.68rem; padding: 0.25rem; background: rgba(139,92,246,0.08); border-color: rgba(139,92,246,0.15); color: var(--accent-purple); font-weight: 700;">👥 Collaborate</button>`;
  return `<div style="display: flex; align-items: center; gap: 0.25rem; width: 100%;">${actionBtn}${colBtn}</div>`;
}

// --- CORE RENDERING ENGINES ---
const WIP_LIMITS = { nomination: 4, 'pre-camp': 3, 'in-camp': 2, 'post-camp': 3, closed: 99999 };
let columnPages = { nomination: 1, 'pre-camp': 1, 'in-camp': 1, 'post-camp': 1, closed: 1 };
const PAGE_SIZE = 10;

function isCampToday(camp) {
  if (!camp.scheduledTime) return false;
  const campDate = new Date(camp.scheduledTime).toDateString();
  const simDate = new Date(state.simulatedTime).toDateString();
  return campDate === simDate;
}

export function renderDashboard() {
  const cols = {
    nomination: document.getElementById('col-nomination'),
    'pre-camp': document.getElementById('col-precamp'),
    'in-camp': document.getElementById('col-incamp'),
    'post-camp': document.getElementById('col-postcamp'),
    closed: document.getElementById('col-closed')
  };

  Object.entries(cols).forEach(([stage, el]) => {
    if (el) {
      el.innerHTML = '';
      el.setAttribute('ondragover', 'window.handleDragOver(event)');
      el.setAttribute('ondragleave', 'window.handleDragLeave(event)');
      el.setAttribute('ondrop', 'window.handleDrop(event)');
    }
  });

  const counts = { nomination: 0, 'pre-camp': 0, 'in-camp': 0, 'post-camp': 0, closed: 0 };
  let slaAlertCount = 0;
  let totalBfmUplift = 0;
  let closedCampsCount = 0;

  let visibleCamps = [...state.camps];
  const role = state.activeRole;

  if (role === 'AM') {
    visibleCamps = state.camps.filter(c => c.amEmail === 'am.sarah@google.com');
  } else if (role === 'Presenter') {
    visibleCamps = state.camps.filter(c => c.presenter && c.presenter.includes('Taylor'));
  }

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

  const searchQuery = document.getElementById('search-camps-input') ? document.getElementById('search-camps-input').value.toLowerCase().trim() : '';
  if (searchQuery) {
    visibleCamps = visibleCamps.filter(c => 
      c.agency.toLowerCase().includes(searchQuery) || 
      c.id.toLowerCase().includes(searchQuery) || 
      c.product.toLowerCase().includes(searchQuery)
    );
  }

  const filterRegion = document.getElementById('filter-region-select') ? document.getElementById('filter-region-select').value : 'ALL';
  if (filterRegion !== 'ALL') {
    visibleCamps = visibleCamps.filter(c => c.region === filterRegion);
  }

  const filterPod = document.getElementById('filter-pod-select') ? document.getElementById('filter-pod-select').value : 'ALL';
  if (filterPod !== 'ALL') {
    visibleCamps = visibleCamps.filter(c => {
      if (filterPod === 'Search' && (c.product.includes('Search') || c.product.includes('Bidding') || c.product.includes('Performance Max') || c.product.includes('PMax'))) return true;
      if (filterPod === 'Video' && (c.product.includes('Video') || c.product.includes('YouTube') || c.product.includes('DV360'))) return true;
      if (filterPod === 'Measurement' && (c.product.includes('Measurement') || c.product.includes('Analytics') || c.product.includes('Tag Gateway') || c.product.includes('GTG') || c.product.includes('CM360'))) return true;
      return false;
    });
  }

  const filterSla = document.getElementById('filter-sla-select') ? document.getElementById('filter-sla-select').value : 'ALL';
  if (filterSla === 'ALERT') {
    visibleCamps = visibleCamps.filter(c => {
      if (c.stage === 'pre-camp' && c.slaDaysRemaining !== null && c.slaDaysRemaining <= 3) return true;
      if (c.stage === 'post-camp' && !c.followUpSent) return true;
      return false;
    });
  }

  const filterTime = document.getElementById('filter-time-select') ? document.getElementById('filter-time-select').value : 'ALL';
  if (filterTime === 'TODAY') {
    visibleCamps = visibleCamps.filter(c => isCampToday(c));
  }

  const statsBadge = document.getElementById('portfolio-stats-badge');
  if (statsBadge) statsBadge.textContent = `${visibleCamps.length} shown`;

  visibleCamps.forEach(camp => {
    if (camp.status === "Pending Kickoff" || camp.status === "Nominated" || camp.status === "Proposed") {
      camp.stage = "nomination";
    } else if (camp.status === "Awaiting Discovery" || camp.status === "Discovery Received" || camp.status === "Discovery Submitted" || camp.status === "Awaiting Discovery Form" || camp.status === "Discovery Received") {
      camp.stage = "pre-camp";
    } else if (camp.status === "Live Session Active" || camp.status === "Live Session Scheduled") {
      camp.stage = "in-camp";
    } else if (camp.status === "Resolving Queries" || camp.status === "Resolving Queries & Follow-up" || camp.status === "Resolving Q&A") {
      camp.stage = "post-camp";
    } else if (camp.status === "Impact Logged" || camp.status.includes("Closed") || camp.status.includes("Cancelled") || camp.status.includes("Postponed")) {
      camp.stage = "closed";
    }
  });

  Object.entries(cols).forEach(([stage, el]) => {
    if (!el) return;
    
    const stageCamps = visibleCamps.filter(c => c.stage === stage);
    counts[stage] = stageCamps.length;

    const limit = columnPages[stage] * PAGE_SIZE;
    const campsToRender = stageCamps.slice(0, limit);

    campsToRender.forEach(camp => {
      if (camp.stage === 'closed' && camp.bfmUplift !== null) {
        totalBfmUplift += camp.bfmUplift;
        closedCampsCount++;
      }

      let isSlaWarning = false;
      if (camp.stage === 'pre-camp' && camp.slaDaysRemaining !== null && camp.slaDaysRemaining <= 3) {
        isSlaWarning = true;
      } else if (camp.stage === 'post-camp' && !camp.followUpSent) {
        isSlaWarning = true;
      }

      if (isSlaWarning) {
        slaAlertCount++;
      }

      const isToday = isCampToday(camp);

      const cardHtml = `
        <div class="camp-card ${isSlaWarning ? 'sla-alert' : ''} ${isToday ? 'happening-today' : ''}" data-id="${camp.id}" draggable="true" ondragstart="window.handleDragStart(event)">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.35rem;">
            <span class="card-case-id-tag" onclick="window.copyCaseIdToClipboard(event, '${camp.id}')" title="Click to copy Case ID" style="font-size: 0.72rem; font-weight: 800; color: var(--primary-cyan); text-transform: uppercase; letter-spacing: 0.5px; cursor: pointer; position: relative; display: inline-flex; align-items: center; gap: 0.15rem;">
              <span>Case #${camp.id.length > 12 ? camp.id.substring(0, 8) : camp.id}</span>
            </span>
            <div style="display: flex; gap: 0.25rem; align-items: center;">
              ${isToday ? `<span style="font-size: 0.6rem; font-weight: 800; padding: 0.1rem 0.35rem; border-radius: 4px; background: rgba(0, 233, 255, 0.15); color: var(--primary-cyan); border: 1px solid rgba(0, 233, 255, 0.3); text-transform: uppercase; letter-spacing: 0.5px;">Today</span>` : ''}
              <span style="font-size: 0.65rem; font-weight: 700; padding: 0.1rem 0.35rem; border-radius: 4px; ${getRegionStyle(camp.region)}">${camp.region || 'EMEA'}</span>
            </div>
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
                <span class="ws-sync-pill ws-synced" style="background: rgba(16, 185, 129, 0.12); border-color: rgba(16, 185, 129, 0.25); color: var(--success-green); display: inline-flex; align-items: center; gap: 0.25rem;" title="Safely archived inside gPEG Shared Drive folder, protected from auto-deletion.">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle;"><path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM19 18H6c-2.21 0-4-1.79-4-4 0-2.05 1.53-3.76 3.56-3.97l1.07-.11.5-.95A5.497 5.497 0 0 1 12 6c2.62 0 4.88 1.86 5.39 4.43l.3 1.5 1.53.11A2.98 2.98 0 0 1 22 15c0 1.66-1.34 3-3 3z" fill="#10b981"/></svg>
                  <span>Archived Drive</span>
                </span>
              ` : `
                <span class="ws-sync-pill" id="ws-archive-drive-${camp.id}" onclick="window.archiveToSharedDrive('${camp.id}', 'ws-archive-drive-${camp.id}')" style="display: inline-flex; align-items: center; gap: 0.25rem;" title="Archive this recording to Google Shared Drive to protect it from auto-deletion after 3 months.">
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle;"><path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" fill="#64748b"/></svg>
                  <span>Move to Shared Drive</span>
                </span>
              `}
              <span class="ws-sync-pill ws-synced" onclick="window.triggerWorkspaceExport('Sheets', '${camp.id}')" style="cursor: pointer; display: inline-flex; align-items: center; gap: 0.25rem;" title="One-Click export this closed case history to Google Sheets.">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle;"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11h-4v4h-2v-4H7v-2h3v-4h2v4h4v2z" fill="#10b981"/></svg>
                <span>Sheets Synced</span>
              </span>
            </div>
          ` : camp.stage === 'post-camp' ? `
            <div style="margin-top: 0.35rem; display: flex; flex-wrap: wrap; gap: 0.25rem;">
              <span class="ws-sync-pill" id="ws-sync-drive-${camp.id}" onclick="window.syncToWorkspace('Drive', '${camp.id}', 'ws-sync-drive-${camp.id}')" style="display: inline-flex; align-items: center; gap: 0.25rem;">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle;"><path d="M19.35 10.04A7.49 7.49 0 0 0 12 4C9.11 4 6.6 5.64 5.35 8.04A5.994 5.994 0 0 0 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96z" fill="#64748b"/></svg>
                <span>Drive Sync</span>
              </span>
              <span class="ws-sync-pill" id="ws-sync-doc-${camp.id}" onclick="window.syncToWorkspace('Docs', '${camp.id}', 'ws-sync-doc-${camp.id}')" style="display: inline-flex; align-items: center; gap: 0.25rem;">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle;"><path d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6zm2 16H8v-2h8v2zm0-4H8v-2h8v2zm-3-5V3.5L18.5 9H13z" fill="#2b6cb0"/></svg>
                <span>Doc Sync</span>
              </span>
              <span class="ws-sync-pill" onclick="window.triggerWorkspaceExport('Slides', '${camp.id}')" style="cursor: pointer; background: rgba(245,158,11,0.1); border-color: rgba(245,158,11,0.2); color: var(--warning-amber); display: inline-flex; align-items: center; gap: 0.25rem;" title="One-Click generate Gslides presentation pre-reads stripping Internal slides.">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle;"><path d="M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-1 11H6v-2h12v2zm0-4H6V8h12v2z" fill="#d69e2e"/></svg>
                <span>Slides Exporter</span>
              </span>
            </div>
          ` : `
            <div style="margin-top: 0.35rem; display: flex; gap: 0.25rem;">
              <span class="ws-sync-pill" onclick="window.triggerWorkspaceExport('Chat', '${camp.id}')" style="cursor: pointer; background: rgba(139,92,246,0.1); border-color: rgba(139,92,246,0.2); color: var(--accent-purple); display: inline-flex; align-items: center; gap: 0.25rem;" title="One-Click format and broadcast this active camp card payload directly into internal Google Chat Space.">
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style="vertical-align: middle;"><path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z" fill="#8b5cf6"/></svg>
                <span>Share to Chat</span>
              </span>
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

      el.insertAdjacentHTML('beforeend', cardHtml);
    });

    if (stageCamps.length > campsToRender.length) {
      const loadTriggerHtml = `
        <div class="infinite-scroll-trigger" style="text-align: center; padding: 0.6rem; color: var(--primary-cyan); font-size: 0.68rem; font-weight: 700; letter-spacing: 0.5px; text-transform: uppercase; border: 1px dashed var(--primary-cyan-dim); border-radius: 8px; margin-top: 0.55rem; background: rgba(0, 233, 255, 0.02); cursor: pointer; display: flex; align-items: center; justify-content: center; gap: 0.3rem; transition: all 0.2s;" onclick="window.loadNextColumnPage('${stage}')">
          <span>🔄 Click to Load More (${stageCamps.length - campsToRender.length} remaining)</span>
        </div>
      `;
      el.insertAdjacentHTML('beforeend', loadTriggerHtml);
    }

    el.onscroll = function() {
      if (el.scrollHeight - el.scrollTop <= el.clientHeight + 40) {
        const currentTotal = visibleCamps.filter(c => c.stage === stage).length;
        const currentLoaded = columnPages[stage] * PAGE_SIZE;
        if (currentTotal > currentLoaded) {
          columnPages[stage]++;
          renderDashboard();
          showToast('Infinite Scroll', `Loaded next page of campaigns in column [${stage}]`);
        }
      }
    };
  });

  window.loadNextColumnPage = function(stage) {
    columnPages[stage]++;
    renderDashboard();
    showToast('Page Ingested', `Loaded more campaigns in column [${stage}]`);
  };

  Object.keys(counts).forEach(stage => {
    const countEl = document.getElementById(`count-${stage}`);
    if (countEl) countEl.textContent = counts[stage];

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

  document.getElementById('metric-active-count').textContent = state.camps.filter(c => c.stage !== 'closed').length;
  document.getElementById('metric-precamp-count').textContent = state.camps.filter(c => c.stage === 'pre-camp' && c.discoveryStatus === 'Pending').length;
  document.getElementById('metric-sla-count').textContent = slaAlertCount;
  
  const avgBfmEl = document.getElementById('metric-bfm-average');
  if (closedCampsCount > 0) {
    if (avgBfmEl) avgBfmEl.textContent = `${(totalBfmUplift / closedCampsCount).toFixed(1)}%`;
  } else if (avgBfmEl) {
    avgBfmEl.textContent = '0%';
  }

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

  if (window.renderConsolidatedSidebarWidget) {
    window.renderConsolidatedSidebarWidget();
  }

  if (window.renderLogs) window.renderLogs();
  if (window.renderTasks) window.renderTasks();
  if (window.renderChats) window.renderChats();
  if (window.renderRepository) window.renderRepository();
  if (window.applyRoleAccessControl) window.applyRoleAccessControl();
  if (window.renderAgencyPortalTokens) window.renderAgencyPortalTokens();
  
  if (typeof renderSidebarTodaysSessions === 'function') {
    renderSidebarTodaysSessions();
  }
}

export function renderSidebarSlaList() {
  const listEl = document.getElementById('sidebar-sla-list');
  const badgeEl = document.getElementById('sidebar-sla-badge');
  if (!listEl) return;
  listEl.innerHTML = '';
  
  let count = 0;
  state.camps.forEach(camp => {
    if (camp.stage === 'pre-camp' && camp.discoveryStatus === 'Pending') {
      count++;
      listEl.insertAdjacentHTML('beforeend', `
        <div class="sidebar-item">
          <div class="sidebar-item-title">${camp.agency} (${camp.product})</div>
          <div class="sidebar-item-meta">
            <span>Discovery Pending</span>
            <span class="alert-timer">⏱️ ${camp.slaDaysRemaining}d left</span>
          </div>
        </div>
      `);
    }
  });

  if (badgeEl) badgeEl.textContent = `${count} Alerts`;
}

export function renderSidebarQaList() {
  const listEl = document.getElementById('sidebar-qa-list');
  if (!listEl) return;
  listEl.innerHTML = '';

  state.camps.forEach(camp => {
    camp.liveQuestions.forEach(q => {
      listEl.insertAdjacentHTML('beforeend', `
        <div class="sidebar-item">
          <div class="sidebar-item-title">${camp.agency} - Case ${camp.id}</div>
          <div style="font-size: 0.8rem; color: var(--text-primary); margin: 0.2rem 0;">"${q.text}"</div>
        </div>
      `);
    });
  });
}

export function renderMailDrafts() {
  const container = document.getElementById('mail-drafts-list');
  if (!container) return;
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

export function renderLiveSessionQuestionsLog() {
  const container = document.getElementById('live-session-questions-log');
  if (!container) return;
  container.innerHTML = '';
  
  const camp = state.camps.find(c => c.id === window.activeLiveCampId);
  if (!camp) return;
  
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

export function renderRehearsalAttemptsList() {
  const listEl = document.getElementById('rehearsal-attempts-log-list');
  if (!listEl) return;
  listEl.innerHTML = '';
  
  if (window.rehearsalAttempts.length === 0) {
    listEl.innerHTML = '<div style="font-size: 0.75rem; color: var(--text-muted); text-align: center; padding-top: 2rem;">No rehearsals logged in this session yet.</div>';
    return;
  }
  
  window.rehearsalAttempts.forEach(att => {
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

export function renderSidebarTodaysSessions() {
  const listEl = document.getElementById('sidebar-today-list');
  const badgeEl = document.getElementById('sidebar-today-count-badge');
  if (!listEl) return;
  listEl.innerHTML = '';

  const todaysCamps = state.camps.filter(c => isCampToday(c));
  
  todaysCamps.forEach(camp => {
    listEl.insertAdjacentHTML('beforeend', `
      <div class="sidebar-item" style="border-left: 3px solid var(--primary-cyan);">
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 0.25rem; margin-bottom: 0.15rem;">
          <span class="sidebar-item-title" style="font-size: 0.75rem; font-weight: 600; cursor: pointer; color: var(--primary-cyan);" onclick="window.focusOnCampCard('${camp.id}')">${camp.agency}</span>
          <span class="badge-status" style="font-size: 0.55rem; padding: 0.05rem 0.2rem; border-radius: 3px; background: ${getStageBadgeColor(camp.status)}; color: #fff;">${camp.status}</span>
        </div>
        <div class="sidebar-item-meta" style="font-size: 0.68rem; display: flex; justify-content: space-between;">
          <span>${camp.product}</span>
          <span class="alert-timer" style="color: var(--primary-cyan);">⏱️ ${new Date(camp.scheduledTime).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
        </div>
      </div>
    `);
  });

  if (todaysCamps.length === 0) {
    listEl.innerHTML = `
      <div style="font-size: 0.75rem; color: var(--text-muted); text-align: center; padding: 1rem; background: rgba(255,255,255,0.01); border: 1px dashed var(--border-light); border-radius: 8px;">
        No sessions scheduled for today.
      </div>
    `;
  }

  if (badgeEl) {
    badgeEl.textContent = `${todaysCamps.length} ${todaysCamps.length === 1 ? 'Session' : 'Sessions'}`;
  }
}

// Export and bind to window for absolute compatibility
if (typeof window !== 'undefined') {
  window.showToast = showToast;
  window.renderDashboard = renderDashboard;
  window.renderSidebarSlaList = renderSidebarSlaList;
  window.renderSidebarQaList = renderSidebarQaList;
  window.renderMailDrafts = renderMailDrafts;
  window.renderLiveSessionQuestionsLog = renderLiveSessionQuestionsLog;
  window.renderRehearsalAttemptsList = renderRehearsalAttemptsList;
  window.renderSidebarTodaysSessions = renderSidebarTodaysSessions;
}
