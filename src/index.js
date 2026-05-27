// 🚀 GPEG Camps Command Center - E2E Bootstrapper Entry Point
import '../style.css';

// 1. Import legacy core script first (Loads all legacy functions into window/scope)
import '../app.js';

// 2. Import modern decoupled modules to overlay and overwrite legacy methods
import { state, initState } from './modules/core/state.js';
import { performBackendLogin, syncWithServer, syncRosterWithAppSheet, startPolling } from './modules/services/api.js';
import { renderDashboard, showToast } from './modules/ui/renderer.js';

console.log('⚙️ Modular overlay active. Restoring state...');

// 3. Initialize State from localStorage/seeder
initState();

// 4. Kickoff backend sync and polling in non-test environments
if (typeof window !== 'undefined') {
  // Bind toast system to window again for safety
  window.showToast = showToast;

  if (!window.isTestRunnerEnv) {
    (async () => {
      let ldap = 'taylor.chen';
      if (state.activeRole === 'AM') ldap = 'sarah.jenkins';
      else if (state.activeRole === 'PM') ldap = 'pm.lead';
      else if (state.activeRole === 'Admin') ldap = 'admin.camps';
      else if (state.activeRole === 'Stakeholder') ldap = 'stakeholder.lead';
      else if (state.activeRole === 'Organizer') ldap = 'organizer.camps';
      
      console.log(`📡 Authenticating active persona [${state.activeRole}] as ${ldap}...`);
      await performBackendLogin(ldap, state.activeRole);
      await syncWithServer();
      await syncRosterWithAppSheet();
      startPolling();
      
      console.log('🎉 GPEG Camps E2E Sync & Polling loops initialized successfully!');
    })();
  }
}
