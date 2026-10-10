# NGO Attendance & Feedback System (CEP Topic 15)

Stack: Node.js + Express, React (Vite), MySQL.

## 1. Database
```
mysql -u root -p < database/schema.sql
```

## 2. Backend
```
cd backend
npm install
cp .env.example .env      # then edit DB_PASSWORD and JWT_SECRET
npm run seed              # demo users + 2 activities (once)
npm run dev               # http://localhost:5000
```

## 3. Frontend
```
cd frontend
npm install
npm run dev               # http://localhost:5173
```

## Demo logins (password: password123)
| Role | Email |
|------|-------|
| Admin | admin@ngo.org |
| Coordinator | coord@ngo.org |
| Volunteer | rahul@ngo.org, sneha@ngo.org |

## Try this in your demo
1. Login as coordinator, open Activities, tap **QR code** on "Tree Plantation Drive".
2. Scan the QR with a phone on the same Wi-Fi. In `backend/.env` set `FRONTEND_URL` to your PC's IP, for example `http://192.168.1.5:5173`, and restart the backend. Login as a volunteer and attendance is marked.
3. Scanning twice shows "already marked" (UNIQUE key on the attendance table).
4. As a volunteer, feedback opens only after the activity ends. Use "Health Checkup Camp" (already ended).
5. Coordinator Dashboard shows totals, attendance bars and CSV export.

## API summary
| Method | Route | Who |
|--------|-------|-----|
| POST | /api/auth/register, /login | public |
| GET | /api/activities | any user |
| POST/PUT/DELETE | /api/activities | coordinator, admin |
| GET | /api/activities/:id/qr | staff |
| POST | /api/attendance/qr | logged-in user |
| POST | /api/attendance/manual | staff |
| POST | /api/feedback | attendee, after activity ends |
| GET | /api/reports/summary, /export/:id | staff |

## Security points for viva
bcrypt password hashing, JWT login, role middleware, parameterised SQL (prevents SQL injection), UNIQUE keys against duplicates, time-window check on QR attendance.
