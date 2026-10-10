import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api.js';

export default function Feedback() {
  const { id } = useParams();
  const nav = useNavigate();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [anon, setAnon] = useState(false);
  const [msg, setMsg] = useState('');

  async function submit(e) {
    e.preventDefault();
    if (!rating) return setMsg('Please choose a star rating');
    try {
      await api('/feedback', 'POST', { activity_id: Number(id), rating, comment, is_anonymous: anon });
      nav('/activities');
    } catch (err) { setMsg(err.message); }
  }

  return (
    <form className="card narrow" onSubmit={submit}>
      <h2>How was the activity?</h2>
      <div className="stars">
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className={n <= rating ? 'on' : ''} onClick={() => setRating(n)}>★</span>
        ))}
      </div>
      <textarea maxLength="500" placeholder="Comments (optional)" value={comment} onChange={(e) => setComment(e.target.value)} />
      <label className="check"><input type="checkbox" checked={anon} onChange={(e) => setAnon(e.target.checked)} /> Submit anonymously</label>
      {msg && <p className="err">{msg}</p>}
      <button>Submit feedback</button>
    </form>
  );
}
