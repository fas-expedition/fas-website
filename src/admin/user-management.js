(function () {
  const ADMIN_ROLE = 'admin';
  const DEFAULT_ROLE = 'cms-editor';
  const FUNCTION_URL = '/.netlify/functions/admin-create-cms-user';

  function getCurrentUserRoles(user) {
    const roles = user?.app_metadata?.roles;
    return Array.isArray(roles) ? roles : [];
  }

  function isAdmin(user) {
    return getCurrentUserRoles(user).includes(ADMIN_ROLE);
  }

  function createManagementUi() {
    const container = document.createElement('section');
    container.id = 'fas-admin-user-management';
    container.style.cssText = [
      'position: fixed',
      'right: 24px',
      'bottom: 24px',
      'z-index: 9999',
      'width: min(360px, calc(100vw - 32px))',
      'background: #111',
      'border: 1px solid #3f3f46',
      'border-radius: 12px',
      'padding: 16px',
      'box-shadow: 0 12px 30px rgba(0,0,0,.45)',
      'font-family: system-ui, sans-serif',
      'color: #fff',
    ].join(';');

    container.innerHTML = `
      <h2 style="margin:0 0 10px;font-size:14px;letter-spacing:.06em;text-transform:uppercase;">Admin · Nutzer anlegen</h2>
      <p style="margin:0 0 14px;color:#a1a1aa;font-size:12px;line-height:1.4;">
        Neuer CMS Nutzer mit Rolle erstellen (z. B. für Bild-Beschreibungstexte).
      </p>
      <form id="fas-admin-user-form" style="display:grid;gap:10px;">
        <label style="display:grid;gap:6px;font-size:12px;">
          <span style="color:#d4d4d8;">E-Mail</span>
          <input name="email" type="email" required placeholder="nutzer@beispiel.de"
                 style="padding:10px 12px;border-radius:8px;border:1px solid #52525b;background:#18181b;color:#fff;" />
        </label>
        <label style="display:grid;gap:6px;font-size:12px;">
          <span style="color:#d4d4d8;">Rolle</span>
          <select name="role" style="padding:10px 12px;border-radius:8px;border:1px solid #52525b;background:#18181b;color:#fff;">
            <option value="cms-editor">cms-editor</option>
            <option value="admin">admin</option>
          </select>
        </label>
        <button type="submit"
                style="margin-top:2px;padding:11px 12px;border-radius:8px;border:1px solid #fff;background:#fff;color:#000;font-weight:700;cursor:pointer;">
          Nutzer erstellen
        </button>
        <p id="fas-admin-user-status" style="margin:0;min-height:18px;font-size:12px;color:#a1a1aa;"></p>
      </form>
    `;

    document.body.appendChild(container);
    attachSubmitHandler(container);
  }

  function setStatus(message, kind) {
    const statusEl = document.getElementById('fas-admin-user-status');
    if (!statusEl) return;

    statusEl.textContent = message;
    if (kind === 'error') {
      statusEl.style.color = '#f87171';
      return;
    }
    if (kind === 'success') {
      statusEl.style.color = '#4ade80';
      return;
    }
    statusEl.style.color = '#a1a1aa';
  }

  async function createUser(event) {
    event.preventDefault();

    const form = event.currentTarget;
    const email = String(form.email.value || '').trim();
    const role = String(form.role.value || DEFAULT_ROLE).trim();

    if (!email) {
      setStatus('Bitte E-Mail eingeben.', 'error');
      return;
    }

    const identityUser = window.netlifyIdentity?.currentUser();
    if (!identityUser) {
      setStatus('Du bist nicht eingeloggt.', 'error');
      return;
    }

    setStatus('Nutzer wird angelegt ...', 'info');

    const token = await identityUser.jwt();
    const apiResponse = await fetch(FUNCTION_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token,
      },
      body: JSON.stringify({ email, role }),
    });

    const responseBody = await apiResponse.json();
    if (!apiResponse.ok) {
      const detail = responseBody?.detail ? ` (${responseBody.detail})` : '';
      setStatus(`${responseBody?.error || 'Nutzer konnte nicht erstellt werden'}${detail}`, 'error');
      return;
    }

    setStatus(`Nutzer ${email} mit Rolle ${role} erstellt.`, 'success');
    form.reset();
    form.role.value = DEFAULT_ROLE;
  }

  function attachSubmitHandler(container) {
    const form = container.querySelector('#fas-admin-user-form');
    form.addEventListener('submit', (event) => {
      createUser(event).catch((error) => {
        setStatus(`Fehler: ${error.message}`, 'error');
      });
    });
  }

  function init() {
    if (!window.netlifyIdentity || document.getElementById('fas-admin-user-management')) {
      return;
    }

    window.netlifyIdentity.on('init', (user) => {
      if (user && isAdmin(user)) {
        createManagementUi();
      }
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
    return;
  }

  init();
})();
