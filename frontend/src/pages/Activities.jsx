import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, getUser, isStaff, fmt } from '../api.js';

const toSql = (v) => v.replace('T', ' ') + ':00'; // datetime-local -> MySQL DATETIME
const empty = { title: '', description: '', category: 'Health', venue: '', start_time: '', end_time: '' };
const CATEGORIES = ['Health', 'Education', 'Environment', 'Cleanliness', 'Awareness', 'Other'];

export default function Activities() {
  const user = getUser();
  const staff = isStaff(user);
  const [list, setList] = useState([]);
  const [form, setForm] = useState(empty);
  const [showForm, setShowForm] = useState(false);
  const [panel, setPanel] = useState(null); // { id, type, data }
  const [msg, setMsg] = useState({ text: '', ok: true });

  const load = () => api('/activities').then(setList).catch((e) => setMsg({ text: e.message, ok: false }));
  useEffect(() => { load(); }, []);
  const note = (text, ok = true) => setMsg({ text, ok });
  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  async function create(e) {
    e.preventDefault();
    try {
      await api('/activities', 'POST', { ...form, start_time: toSql(form.start_time), end_time: toSql(form.end_time) });
      setForm(empty); setShowForm(false); note('Activity created'); load();
    } catch (err) { note(err.message, false); }
  }

  async function remove(id) {
    if (!confirm('Delete this activity and its records?')) return;
    try { await api('/activities/' + id, 'DELETE'); load(); } catch (err) { note(err.message, false); }
  }

  async function open(id, type) {
    if (panel && panel.id === id && panel.type === type) return setPanel(null);
    try {
      let data;
      if (type === 'qr') data = await api(`/activities/${id}/qr`);
      if (type === 'who') {
        const [present, vols] = await Promise.all([api('/attendance/activity/' + id), api('/attendance/volunteers')]);
        data = { present, vols };
      }
      if (type === 'fb') data = await api('/feedback/activity/' + id);
      setPanel({ id, type, data });
    } catch (err) { note(err.message, false); }
  }

  async function markManual(activity_id, user_id) {
    try {
      await api('/attendance/manual', 'POST', { activity_id, user_id });
      note('Marked present'); load(); setPanel(null); open(activity_id, 'who');
    } catch (err) { note(err.message, false); }
  }

  const ended = (a) => new Date(a.end_time) < new Date();

  return (
    <>
      <div className="row">
        <h2>Activities</h2>
        {staff && <button onClick={() => setShowForm(!showForm)}>{showForm ? 'Close' : '+ New activity'}</button>}
      </div>
      {msg.text && <p className={msg.ok ? 'ok' : 'err'}>{msg.text}</p>}

      {showForm && (
        <form className="card" onSubmit={create}>
          <input placeholder="Title" value={form.title} onChange={set('title')} required />
          <textarea placeholder="Description" value={form.description} onChange={set('description')} />
          <select value={form.category} onChange={set('category')}>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</select>
          <input placeholder="Venue" value={form.venue} onChange={set('venue')} required />
          <label>Starts<input type="datetime-local" value={form.start_time} onChange={set('start_time')} required /></label>
          <label>Ends<input type="datetime-local" value={form.end_time} onChange={set('end_time')} required /></label>
          <button>Create</button>
        </form>
      )}

      {list.map((a) => (
        <div className="card" key={a.activity_id}>
          <div className="row">
            <h3>{a.title}</h3>
            <span className="tag">{a.category}</span>
          </div>
          <p className="muted">{fmt(a.start_time)} to {fmt(a.end_time)} | {a.venue}</p>
          {a.description && <p>{a.description}</p>}
          <p><b>{a.present}</b> present</p>

          {!staff && (
            <div className="row">
              {a.i_attended ? <span className="ok">You attended</span> : <span className="muted">Scan the QR at the venue to mark attendance</span>}
              {a.i_attended > 0 && ended(a) && !a.i_gave_feedback && <Link className="btn" to={'/feedback/' + a.activity_id}>Give feedback</Link>}
              {a.i_gave_feedback > 0 && <span className="ok">Feedback sent</span>}
            </div>
          )}

          {staff && (
            <div className="row wrapbtn">
              <button className="small" onClick={() => open(a.activity_id, 'qr')}>QR code</button>
              <button className="small" onClick={() => open(a.activity_id, 'who')}>Attendance</button>
              <button className="small" onClick={() => open(a.activity_id, 'fb')}>Feedback</button>
              <button className="small danger" onClick={() => remove(a.activity_id)}>Delete</button>
            </div>
          )}

          {panel && panel.id === a.activity_id && (
            <div className="panel">
              {panel.type === 'qr' && (<>
                <img src={panel.data.qr} alt="QR code" width="240" />
                <p className="muted">Participants scan this with their phone camera, then log in. Opens 30 min before start.</p>
              </>)}
              {panel.type === 'who' && (<>
                <b>Present ({panel.data.present.length})</b>
                <ul>{panel.data.present.map((p) => <li key={p.user_id}>{p.name} <small>({p.method}, {fmt(p.marked_at)})</small></li>)}</ul>
                <b>Mark manually</b>
                <ul>
                  {panel.data.vols.filter((v) => !panel.data.present.some((p) => p.user_id === v.user_id)).map((v) => (
                    <li key={v.user_id}>{v.name} <button className="small" onClick={() => markManual(a.activity_id, v.user_id)}>Mark present</button></li>
                  ))}
                </ul>
              </>)}
              {panel.type === 'fb' && (panel.data.length === 0 ? <p>No feedback yet.</p> : (
                <ul>{panel.data.map((f, i) => <li key={i}><b>{'★'.repeat(f.rating)}</b> {f.name}: {f.comment || <i>no comment</i>}</li>)}</ul>
              ))}
            </div>
          )}
        </div>
      ))}
      {list.length === 0 && <p className="muted">No activities yet.</p>}
    </>
  );
}
