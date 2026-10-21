# Scholarship Finder

Role-based scholarship app: **React (Vite)** + **Node/Express** + **MongoDB (Mongoose)**.

- **Admin**: adds, edits and deletes scholarships (each has a maximum family income).
- **Student**: registers with their family income and sees only open scholarships whose
  maximum family income is **at or above** theirs (`maxFamilyIncome >= familyIncome`, deadline not passed).

## Run it

Requires Node 18+ and a running MongoDB (local or Atlas).

```bash
# 1. API
cd server
npm install
cp .env.example .env        # set MONGO_URI and a strong JWT_SECRET
npm run seed                # creates the admin + 3 sample scholarships
npm run dev                 # http://localhost:5000

# 2. Web app (new terminal)
cd client
npm install
npm run dev                 # http://localhost:5173
```

Default admin (from `.env`): `admin@example.com` / `Admin@12345`. Change it before deploying.
Students sign up from the **Create an account** page.

## API

| Method | Path | Access | Purpose |
|---|---|---|---|
| POST | /api/auth/register | public | Create a student account |
| POST | /api/auth/login | public | Log in, returns JWT |
| GET | /api/auth/me | any user | Current user |
| PATCH | /api/auth/me | student | Update family income |
| GET | /api/scholarships/recommended | student | Matches for the student's income |
| GET | /api/scholarships | admin | List all scholarships |
| POST | /api/scholarships | admin | Add scholarship |
| PUT | /api/scholarships/:id | admin | Edit scholarship |
| DELETE | /api/scholarships/:id | admin | Delete scholarship |

## Notes

- Role is enforced on the server (JWT + `requireRole`); public sign-up can only create students.
- Currency display defaults to INR; change `CURRENCY` / `LOCALE` in `client/src/api.js`.
- For production, set `VITE_API_URL` for the client and `CLIENT_URL` for the API's CORS origin.
