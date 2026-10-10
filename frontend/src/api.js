// Small fetch wrapper: adds the JWT, throws readable errors
export const getUser = () => JSON.parse(localStorage.getItem('user') || 'null');
export const saveSession = (token, user) => {
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
};
export const logout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); };

export async function api(path, method = 'GET', body) {
  const res = await fetch('/api' + path, {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + localStorage.getItem('token') },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (res.status === 401 && !path.startsWith('/auth')) { logout(); window.location.href = '/login'; }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || 'Something went wrong');
  return data;
}

export async function downloadCsv(activityId) {
  const res = await fetch(`/api/reports/export/${activityId}`, {
    headers: { Authorization: 'Bearer ' + localStorage.getItem('token') },
  });
  if (!res.ok) throw new Error('Could not download report');
  const url = URL.createObjectURL(await res.blob());
  const a = document.createElement('a');
  a.href = url; a.download = `activity-${activityId}-report.csv`; a.click();
  URL.revokeObjectURL(url);
}

export const isStaff = (u) => u && (u.role === 'admin' || u.role === 'coordinator');
export const fmt = (s) => (s ? new Date(s).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) : '');
