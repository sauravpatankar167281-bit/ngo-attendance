import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, saveSession } from '../api.js';

export default function Login() {
  const [mode, setMode] = useState('login');
  const [f, setF] = useState({ name: '', phone: '', email: '', password: '' });
  const [msg, setMsg] = useState({ text: '', ok: false });
  const nav = useNavigate();
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function submit(e) {
    e.preventDefault();
    setMsg({ text: '', ok: false });
    try {
      if (mode === 'login') {
        const d = await api('/auth/login', 'POST', { email: f.email, password: f.password });
        saveSession(d.token, d.user);
        // go back to the page the user wanted (for example a scanned QR link)
        const back = sessionStorage.getItem('after_login');
        sessionStorage.removeItem('after_login');
        window.location.href = back || '/';
      } else {
        const d = await api('/auth/register', 'POST', f);
        setMsg({ text: d.message, ok: true });
        setMode('login');
      }
    } catch (err) {
      setMsg({ text: err.message, ok: false });
    }
  }

  return (
    <form className="card narrow" onSubmit={submit}>
      <h2>{mode === 'login' ? 'Login' : 'Create volunteer account'}</h2>
      {mode === 'register' && (<>
        <input placeholder="Full name" value={f.name} onChange={set('name')} required />
        <input placeholder="Phone" value={f.phone} onChange={set('phone')} required />
      </>)}
      <input type="email" placeholder="Email" value={f.email} onChange={set('email')} required />
      <input type="password" placeholder="Password (min 6)" value={f.password} onChange={set('password')} required />
      {msg.text && <p className={msg.ok ? 'ok' : 'err'}>{msg.text}</p>}
      <button>{mode === 'login' ? 'Login' : 'Register'}</button>
      <p className="link" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
        {mode === 'login' ? 'New volunteer? Register' : 'Have an account? Login'}
      </p>
    </form>
  );
}
