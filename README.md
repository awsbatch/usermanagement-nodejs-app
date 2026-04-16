# UserVault — User Management App

A full-featured user management system built on **Node.js 22** with optional MongoDB support.

---

## Features

- 🔐 **JWT Authentication** — secure login with cookie-based sessions
- 👥 **Full CRUD** — create, read, update, delete users
- 🛡️ **Role-Based Access** — admin, moderator, user roles
- 💾 **Dual Storage** — runs in-memory out of the box, plug in MongoDB anytime
- 🎨 **Beautiful UI** — dark editorial design with real-time search & filter
- 📊 **Dashboard** — stats overview with recent user activity

---

## Quick Start (In-Memory — no setup needed)

```bash
# Install dependencies
npm install

# Start the app
npm start
```

Open http://localhost:3000  
Login: `admin@example.com` / `admin123`

---

## With MongoDB

```bash
# Pass your MongoDB URI as an environment variable
MONGO_URI=mongodb://localhost:27017/usermgmt npm start

# Or with a remote URI
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/usermgmt npm start
```

The app automatically:
- Connects to MongoDB
- Seeds the admin user on first run
- Persists all data across restarts

---

## Environment Variables

| Variable      | Default                      | Description            |
|---------------|------------------------------|------------------------|
| `PORT`        | `3000`                       | Server port            |
| `MONGO_URI`   | _(not set)_                  | MongoDB connection URI  |
| `JWT_SECRET`  | `super-secret-jwt-key-...`   | JWT signing secret     |

---

## API Endpoints

### Auth
| Method | Path              | Description       |
|--------|-------------------|-------------------|
| POST   | `/api/auth/login` | Login             |
| POST   | `/api/auth/logout`| Logout            |
| GET    | `/api/auth/me`    | Current user info |

### Users (requires auth)
| Method | Path               | Role  | Description      |
|--------|--------------------|-------|------------------|
| GET    | `/api/users`       | Admin | List all users   |
| GET    | `/api/users/stats` | Admin | User statistics  |
| POST   | `/api/users`       | Admin | Create user      |
| GET    | `/api/users/:id`   | Self/Admin | Get user  |
| PUT    | `/api/users/:id`   | Self/Admin | Update user |
| DELETE | `/api/users/:id`   | Admin | Delete user      |

---

## Project Structure

```
usermgmt/
├── server.js           # Entry point
├── config/
│   └── index.js        # App config
├── models/
│   ├── dbAdapter.js    # DB abstraction layer
│   ├── memoryAdapter.js# In-memory implementation
│   ├── mongoAdapter.js # MongoDB implementation
│   ├── memoryStore.js  # In-memory data store
│   └── userModel.js    # Mongoose schema
├── routes/
│   ├── auth.js         # Auth routes
│   └── users.js        # User CRUD routes
├── middleware/
│   └── auth.js         # JWT middleware
└── public/
    ├── index.html      # SPA
    ├── css/style.css   # Dark UI styles
    └── js/app.js       # Frontend logic
```
