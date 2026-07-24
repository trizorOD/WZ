let token = null;

function decodeRole(jwtToken) {
  const payload = jwtToken.split('.')[1];
  const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
  return json.role;
}

async function api(path, options = {}) {
  const res = await fetch(path, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed with status ${res.status}`);
  }
  return res.status === 204 ? null : res.json();
}

function showPanel() {
  document.getElementById('login-view').hidden = true;
  document.getElementById('panel-view').hidden = false;
  loadUsers();
  loadHistory();
}

function showLogin(message) {
  document.getElementById('panel-view').hidden = true;
  document.getElementById('login-view').hidden = false;
  document.getElementById('login-error').textContent = message || '';
}

document.getElementById('login-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('login-email').value;
  const password = document.getElementById('login-password').value;
  try {
    const data = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    const role = decodeRole(data.token);
    if (role !== 'admin') {
      showLogin('Access denied: this account is not an admin');
      return;
    }
    token = data.token;
    showPanel();
  } catch (err) {
    showLogin(err.message);
  }
});

document.querySelectorAll('.tab-button').forEach((button) => {
  button.addEventListener('click', () => {
    document.querySelectorAll('.tab-button').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach((p) => { p.hidden = true; });
    button.classList.add('active');
    document.getElementById(`tab-${button.dataset.tab}`).hidden = false;
  });
});

async function loadUsers() {
  const users = await api('/admin/users');
  const tbody = document.querySelector('#users-table tbody');
  tbody.innerHTML = '';
  for (const user of users) {
    const tr = document.createElement('tr');
    const toggleLabel = user.is_active ? 'Deactivate' : 'Reactivate';
    const toggleAction = user.is_active ? 'deactivate' : 'reactivate';

    tr.innerHTML = `
      <td>${user.email}</td>
      <td>${user.full_name}</td>
      <td>${user.role}</td>
      <td>${user.is_active ? 'yes' : 'no'}</td>
      <td>${new Date(user.created_at).toLocaleDateString()}</td>
      <td>
        <button data-action="${toggleAction}" data-id="${user.id}">${toggleLabel}</button>
        <button data-action="password" data-id="${user.id}">Change password</button>
      </td>
    `;
    tbody.appendChild(tr);
  }
}

document.querySelector('#users-table tbody').addEventListener('click', async (e) => {
  const button = e.target.closest('button[data-action]');
  if (!button) return;
  const { action, id } = button.dataset;

  try {
    if (action === 'deactivate') {
      await api(`/admin/users/${id}/deactivate`, { method: 'PATCH' });
    } else if (action === 'reactivate') {
      await api(`/admin/users/${id}/reactivate`, { method: 'PATCH' });
    } else if (action === 'password') {
      const newPassword = prompt('New password:');
      if (!newPassword) return;
      await api(`/admin/users/${id}/password`, {
        method: 'PATCH',
        body: JSON.stringify({ newPassword }),
      });
    }
    loadUsers();
  } catch (err) {
    alert(err.message);
  }
});

document.getElementById('add-user-form').addEventListener('submit', async (e) => {
  e.preventDefault();
  const email = document.getElementById('new-user-email').value;
  const password = document.getElementById('new-user-password').value;
  const fullName = document.getElementById('new-user-fullname').value;
  const role = document.getElementById('new-user-role').value;
  const errorEl = document.getElementById('add-user-error');

  try {
    await api('/admin/users', {
      method: 'POST',
      body: JSON.stringify({ email, password, fullName, role }),
    });
    errorEl.textContent = '';
    e.target.reset();
    loadUsers();
  } catch (err) {
    errorEl.textContent = err.message;
  }
});

async function loadHistory(params = {}) {
  const query = new URLSearchParams(params).toString();
  const documents = await api(`/wz-documents${query ? `?${query}` : ''}`);
  const tbody = document.querySelector('#history-table tbody');
  tbody.innerHTML = '';
  for (const doc of documents) {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${doc.number}</td>
      <td>${doc.client_name}</td>
      <td>${doc.dispatch_date}</td>
      <td><button data-pdf-id="${doc.id}">View PDF</button></td>
    `;
    tbody.appendChild(tr);
  }
}

document.getElementById('history-search-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const client = document.getElementById('history-client').value;
  const number = document.getElementById('history-number').value;
  loadHistory({ ...(client ? { client } : {}), ...(number ? { number } : {}) });
});

document.querySelector('#history-table tbody').addEventListener('click', async (e) => {
  const button = e.target.closest('button[data-pdf-id]');
  if (!button) return;
  const res = await fetch(`/wz-documents/${button.dataset.pdfId}/pdf`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    alert('Failed to load PDF');
    return;
  }
  const blob = await res.blob();
  window.open(URL.createObjectURL(blob), '_blank');
});
