import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../api.js';

// Opened by scanning the activity QR code. Marks attendance for the logged-in user.
export default function Attend() {
  const { token } = useParams();
  const [state, setState] = useState({ status: 'loading', text: 'Marking your attendance...' });

  useEffect(() => {
    api('/attendance/qr', 'POST', { token })
      .then((d) => setState({ status: 'ok', text: d.message }))
      .catch((e) => setState({ status: 'err', text: e.message }));
  }, [token]);

  return (
    <div className="card narrow center">
      <h2>{state.status === 'ok' ? 'Done!' : state.status === 'err' ? 'Could not mark' : 'Please wait'}</h2>
      <p className={state.status === 'ok' ? 'ok' : state.status === 'err' ? 'err' : ''}>{state.text}</p>
      <Link className="btn" to="/activities">Go to activities</Link>
    </div>
  );
}
