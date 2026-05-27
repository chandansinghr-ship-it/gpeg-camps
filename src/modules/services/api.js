// 📡 GPEG Camps - API & Network Synchronization Services Module
import { state, saveState } from '../core/state.js';

export let currentSessionToken = localStorage.getItem('gpeg_session_token') || '';

export async function performBackendLogin(ldap, role) {
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

export async function pushStateToServer() {
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

export async function syncWithServer() {
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

    if (typeof window.renderDashboard === 'function') {
      window.renderDashboard();
    }
  } catch (err) {
    console.warn('Python backend server is offline. Running in offline-only mode.', err);
  }
}

export async function syncRosterWithAppSheet() {
  try {
    const response = await fetch('/api/appsheet/sync', {
      headers: { 'X-GPEG-Session': currentSessionToken }
    });
    if (response.ok) {
      const teamRoster = await response.json();
      state.teamRoster = teamRoster;
      localStorage.setItem('gpeg_team_roster', JSON.stringify(state.teamRoster));
      
      // Trigger immediate dashboard and utilization chart redraws E2E
      if (typeof window.renderRosterList === 'function') window.renderRosterList();
      if (typeof window.renderUtilizationCharts === 'function') window.renderUtilizationCharts();
    }
  } catch (err) {
    console.warn('AppSheet Ingress Gateway offline. Fallback mock roster active.', err);
  }
}

export function startPolling() {
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
            if (typeof window.showToast === 'function') {
              window.showToast('Cases Connect Webhook', `Inbound ticket for ${srvCamp.agency} (Case ${srvCamp.id}) ingested.`);
            }
          }
        });
        
        if (campsUpdated) {
          localStorage.setItem('gpeg_camps', JSON.stringify(state.camps));
          await pushStateToServer();
          if (typeof window.renderDashboard === 'function') {
            window.renderDashboard();
          }
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
          if (typeof window.renderMailDrafts === 'function') {
            window.renderMailDrafts();
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
          if (typeof window.renderBuganizerTracker === 'function') {
            window.renderBuganizerTracker();
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

export async function dispatchEmailToServer(mail) {
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
      if (typeof window.renderMailDrafts === 'function') {
        window.renderMailDrafts();
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
    if (typeof window.renderMailDrafts === 'function') {
      window.renderMailDrafts();
    }
  }
}

// Export API hooks to window to ensure absolute backward compatibility
if (typeof window !== 'undefined') {
  window.performBackendLogin = performBackendLogin;
  window.pushStateToServer = pushStateToServer;
  window.syncWithServer = syncWithServer;
  window.syncRosterWithAppSheet = syncRosterWithAppSheet;
  window.startPolling = startPolling;
  window.dispatchEmailToServer = dispatchEmailToServer;
}
