import { useEffect, useState } from 'react';
import { api, downloadCsv, fmt } from '../api.js';

export default function Dashboard() {
  const [d, setD] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => { api('/reports/summary').then(setD).catch((e) => setErr(e.message)); }, []);

  if (err) return <p className="err">{err}</p>;
  if (!d) return <p>Loading...</p>;
  const t = d.totals;
  const maxPresent = Math.max(1, ...d.activities.map((a) => a.present));

  return (
    <>
      <h2>Dashboard</h2>
      <div className="stats">
        <div className="stat"><b>{t.activities}</b><span>Activities</span></div>
        <div className="stat"><b>{t.volunteers}</b><span>Volunteers</span></div>
        <div className="stat"><b>{t.total_attendance}</b><span>Total check-ins</span></div>
        <div className="stat"><b>{t.overall_rating ?? '-'}</b><span>Avg rating</span></div>
      </div>

      <h3>Attendance per activity</h3>
      <div className="card">
        {d.activities.map((a) => (
          <div key={a.activity_id} className="barrow">
            <span className="barlabel">{a.title}</span>
            <div className="bar"><i style={{ width: (a.present / maxPresent) * 100 + '%' }} /></div>
            <span>{a.present}</span>
          </div>
        ))}
      </div>

      <h3>Reports</h3>
      <div className="tablewrap">
        <table>
          <thead><tr><th>Activity</th><th>Date</th><th>Present</th><th>Feedback</th><th>Rating</th><th></th></tr></thead>
          <tbody>
            {d.activities.map((a) => (
              <tr key={a.activity_id}>
                <td>{a.title}<br /><small>{a.category}</small></td>
                <td>{fmt(a.start_time)}</td>
                <td>{a.present}</td>
                <td>{a.feedback_count}</td>
                <td>{a.avg_rating ?? '-'}</td>
                <td><button className="small" onClick={() => downloadCsv(a.activity_id).catch((e) => alert(e.message))}>CSV</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
