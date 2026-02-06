// Theme toggle
const toggleBtn = document.querySelector('.theme-toggle');
const root = document.documentElement;

function setTheme(theme) {
  localStorage.setItem('theme', theme);
  root.setAttribute('data-theme', theme);
  toggleBtn.textContent = theme === 'light' ? '🌙 Dark' : '☀️ Light';
}

const savedTheme = localStorage.getItem('theme') || 'dark';
setTheme(savedTheme);

toggleBtn.addEventListener('click', () => {
  const current = root.getAttribute('data-theme');
  setTheme(current === 'light' ? 'dark' : 'light');
});

// AJAX form submission
const form = document.querySelector('form[action="/insert"]');
if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = form.querySelector('input[name="msg"]');
    const msg = input.value.trim();
    if (!msg) return;

    try {
      const btn = form.querySelector('button');
      btn.disabled = true;

      const res = await fetch('/api/insert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ msg })
      });

      if (!res.ok) throw new Error('Insert failed');
      const data = await res.json();

      // Add new row to table with animation
      const tbody = document.querySelector('.table tbody');
      if (tbody && data.row) {
        const tr = document.createElement('tr');
        tr.className = 'msg-item';
        tr.innerHTML = `
          <td>${data.row.id}</td>
          <td>${escapeHtml(data.row.message)}</td>
          <td>${new Date(data.row.created_at).toLocaleString()}</td>
        `;
        tbody.insertBefore(tr, tbody.firstChild);
      }

      input.value = '';
      btn.disabled = false;
    } catch (err) {
      console.error('Insert error:', err);
      alert('Failed to insert message');
    }
  });
}

function escapeHtml(s) {
  const div = document.createElement('div');
  div.textContent = s;
  return div.innerHTML;
}
