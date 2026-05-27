// 🚀 GPEG Camps Command Center - E2E Bootstrapper Entry Point

// 1. Import modern decoupled state module first (Binds window.state immediately)
import { state, initState } from './modules/core/state.js';

// 2. Import legacy core script (Loads legacy functions sharing window.state)
import '../app.js';

// 3. Import other modern decoupled modules
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
