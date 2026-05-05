# ✈️ Smart Airport Management System

An AI-powered, full-stack airport operations platform that lets passengers report issues via a QR-code web portal and automatically routes them to the right staff using AI triage — all synchronized with **ServiceNow**.

---

## 🎯 What It Does

| Feature | Details |
|---|---|
| 📱 **Passenger Portal** | Scan a QR code → select problem type → submit issue → get incident number instantly |
| 🤖 **AI Triage (AeroBot)** | Groq LLM automatically categorizes every issue and assigns it to the right team |
| 📋 **Staff Mobile App** | Security, Electrician, Plumber, Help Staff — each see only their assigned tasks |
| 🔔 **Instant Notifications** | Passengers receive WhatsApp + email confirmation with the ServiceNow incident number |
| 🏢 **Manager Dashboard** | Real-time KPI overview — open/resolved/critical incidents, priority breakdown, resolution rate |
| 🔐 **Request Access Flow** | New staff select their role and receive login credentials via email or WhatsApp |

---

## 🏗️ Architecture

```
┌─────────────────────┐     QR Scan     ┌──────────────────────┐
│  Passenger Web App  │ ──────────────▶ │   Passenger Reports  │
│   (Vite + React)    │                 │   /report-issue      │
└─────────────────────┘                 └──────────┬───────────┘
                                                   │ POST
                                        ┌──────────▼───────────┐
                                        │   FastAPI Backend    │
                                        │   (Python + Groq)    │
                                        │                      │
                                        │  ┌─────────────────┐ │
                                        │  │  AI Triage LLM  │ │
                                        │  │  (Groq / Llama) │ │
                                        │  └────────┬────────┘ │
                                        └───────────┼──────────┘
                                                    │
                              ┌─────────────────────▼──────────────────────┐
                              │              ServiceNow Instance            │
                              │  Incident Table → assigned [Electrical/     │
                              │  Plumbing/Security/Facilities/IT/HR]        │
                              └─────────────────────────────────────────────┘
                                                    │
                              ┌─────────────────────▼──────────────────────┐
                              │           Staff Mobile App                  │
                              │        (React Native + Expo)               │
                              │  Security | Electrician | Plumber |         │
                              │  Help Staff | Facilities | Manager          │
                              └────────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
SmartAirportManagement/
├── backend/                    # FastAPI Python backend
│   ├── main.py                 # App entry point + CORS
│   ├── llm.py                  # AI triage (Groq LLM)
│   ├── servicenow.py           # ServiceNow REST API wrapper
│   ├── email_service.py        # Email notifications (SMTP)
│   ├── whatsapp.py             # WhatsApp notifications (WAHA)
│   ├── requirements.txt
│   ├── .env.example            # ← Copy to .env and fill in
│   └── routers/
│       ├── auth.py             # Login + Request Access
│       ├── incidents.py        # Incident CRUD + AI triage
│       ├── assets.py           # Asset management
│       ├── preventive.py       # Preventive maintenance
│       ├── technician.py       # Technician task queries
│       ├── ai.py               # Chatbot + KB endpoints
│       ├── notifications.py    # Notification triggers
│       └── qrcode_router.py    # QR generation
│
├── passenger-web/              # Vite + React passenger portal
│   └── src/
│       ├── pages/
│       │   ├── ReportIssue.tsx # Main report form with problem type picker
│       │   └── ChatBot.tsx     # AI chatbot for passengers
│       ├── api.ts              # Auto-detects backend hostname
│       └── index.css           # Dark glassmorphism design
│
└── mobile/                     # React Native (Expo) staff app
    └── src/
        ├── screens/
        │   ├── auth/LoginScreen.tsx          # Sign In + Request Access tabs
        │   ├── technician/MyTasksScreen.tsx  # Task queue for field staff
        │   ├── manager/DashboardScreen.tsx   # KPI dashboard
        │   └── admin/                        # Admin screens
        ├── services/api.ts     # Axios client (auto-detects device type)
        ├── navigation/         # Role-based routing
        ├── store/              # Redux auth state
        └── theme.ts            # Design system tokens
```

---

## 🚀 Quick Start

### Prerequisites

- **Python 3.11+**
- **Node.js 18+**
- **Expo CLI** (`npm install -g expo-cli`)
- A **ServiceNow developer instance** (free at [developer.servicenow.com](https://developer.servicenow.com))
- A **Groq API key** (free at [console.groq.com](https://console.groq.com))

---

### 1. Clone the Repo

```bash
git clone https://github.com/Mani292/SmartAirportManagement.git
cd SmartAirportManagement
```

---

### 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv
venv\Scripts\activate      # Windows
# source venv/bin/activate  # macOS/Linux

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env with your ServiceNow credentials, Groq API key, etc.

# Start the backend server
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

The API will be available at: `http://localhost:8000`  
Swagger docs: `http://localhost:8000/docs`

---

### 3. Passenger Web Portal

```bash
cd passenger-web
npm install
npm run dev
```

Open: `http://localhost:5173`

> **For QR Code**: Generate a QR pointing to `http://YOUR_IP:5173` so passengers can scan it with their phone.

---

### 4. Staff Mobile App

```bash
cd mobile
npm install
npx expo start
```

Then scan the QR code with **Expo Go** on your phone, or press `a` for Android emulator / `i` for iOS simulator.

> **Physical device setup**: Open `mobile/src/services/api.ts` and set your machine's local IP address in `getBaseUrl()`.

---

## 🔑 Default Login Credentials

> These are mock credentials for development. In production, use your actual ServiceNow user accounts.

| Role | Username | Password | Routes To |
|---|---|---|---|
| Admin | `admin` | `admin` | Admin Dashboard |
| Manager | `manager` | `manager` | KPI Dashboard |
| Security | `security` | `security` | Security task queue |
| Electrician | `electrician` | `electrician` | Electrical task queue |
| Plumber | `plumber` | `plumber` | Plumbing task queue |
| Help Staff | `helpstaff` | `helpstaff` | HR/Help task queue |
| Facilities | `tech` | `tech` | Facilities task queue |

---

## 🤖 AI Triage Teams

When a passenger submits an issue, the AI automatically assigns it to one of these teams:

| Team | Triggered By |
|---|---|
| **Electrical** | Lights out, power failure, flickering, outlets |
| **Plumbing** | Water leak, tap, toilet, drainage, flooding |
| **Security** | Suspicious person, lost item, altercation, threat |
| **Facilities** | General maintenance, broken furniture, HVAC |
| **IT** | WiFi, screens, kiosks, payment terminals |
| **HR** | Complaints, staff behavior, lost & found |

---

## 📧 Notifications

### Passenger Confirmation
After submitting an issue:
- ✉️ **Email**: Sent to passenger with incident number + AI estimated fix time
- 📱 **WhatsApp**: Sent via WAHA with the incident number + status

### Staff Credential Delivery (Request Access)
When a new staff member requests access via the mobile app:
- They select their role (e.g., Security)
- Enter their email or WhatsApp number
- Credentials are sent automatically

### WhatsApp Setup (Optional)
Run WAHA locally with Docker:
```bash
docker run -p 3000:3000 devlikeapro/waha
```
Then scan the QR code at `http://localhost:3000` to link your WhatsApp account.

---

## ⚙️ Environment Variables

Copy `backend/.env.example` to `backend/.env` and fill in:

```env
# ServiceNow
SERVICENOW_INSTANCE=https://your-instance.service-now.com
SERVICENOW_USERNAME=admin
SERVICENOW_PASSWORD=your_password

# AI
GROQ_API_KEY=gsk_...

# Email (Gmail App Password)
EMAIL_SENDER=you@gmail.com
EMAIL_PASSWORD=xxxx xxxx xxxx xxxx

# WhatsApp (WAHA)
WAHA_URL=http://localhost:3000
WAHA_API_KEY=your_key
```

---

## 🛠️ API Reference

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/login` | Authenticate staff member |
| POST | `/api/auth/request-access` | Request credentials by role |

### Incidents
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/incidents/` | List all incidents |
| POST | `/api/incidents/` | Create incident (runs AI triage) |
| GET | `/api/incidents/{sys_id}` | Get single incident |
| PATCH | `/api/incidents/{sys_id}` | Update incident state |
| GET | `/api/incidents/track/{number}` | Track by incident number |

### Technician
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/technician/tasks/{assigned_to}` | Get assigned tasks |
| GET | `/api/technician/stats/{assigned_to}` | Get personal stats |

Full interactive docs: `http://localhost:8000/docs`

---

## 🔒 Production Deployment

### Backend
- Deploy to **Railway**, **Render**, **Fly.io**, or any VPS
- Set all environment variables in the hosting platform
- Use `uvicorn main:app --host 0.0.0.0 --port 8000` (no `--reload`)

### Passenger Web
- Build: `npm run build` in `/passenger-web`
- Deploy to **Vercel**, **Netlify**, or **Cloudflare Pages**
- Update `API_BASE` in `api.ts` to your deployed backend URL

### Mobile App
- Build with EAS: `npx eas build --platform android`
- Update `getBaseUrl()` in `mobile/src/services/api.ts` to return your production URL
- Submit to **Google Play** / **Apple App Store**

---

## 🧪 Tech Stack

| Layer | Technology |
|---|---|
| **Backend API** | Python, FastAPI, Uvicorn |
| **AI Triage** | Groq (Llama 3), Groq SDK |
| **ITSM Platform** | ServiceNow REST API |
| **Mobile App** | React Native, Expo, TypeScript |
| **State Management** | Redux Toolkit |
| **Passenger Portal** | Vite, React, TypeScript |
| **Email** | SMTP (Gmail) |
| **WhatsApp** | WAHA (open-source API) |
| **Design** | Glassmorphism dark theme, Outfit + Inter fonts |

---

## 📸 Screenshots

| Passenger Portal | Staff Login | Task Dashboard |
|---|---|---|
| Type of Problem picker | Sign In + Request Access tabs | Team-filtered incident list |
| Real-time incident number | Role selection cards | Priority badges + status |

---

## 🤝 Contributing

1. Fork the repo
2. Create your feature branch: `git checkout -b feature/AmazingFeature`
3. Commit your changes: `git commit -m 'Add AmazingFeature'`
4. Push to the branch: `git push origin feature/AmazingFeature`
5. Open a Pull Request

---

## 📝 License

MIT License — see [LICENSE](LICENSE) for details.

---

<div align="center">
Built with ❤️ using FastAPI, Groq AI, ServiceNow & React Native
</div>
