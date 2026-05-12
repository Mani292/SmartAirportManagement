# ✈️ Smart Airport Management System

An AI-powered, full-stack airport operations platform that lets passengers report issues via a QR-code web portal and automatically routes them to the right staff using AI triage — all synchronized with **ServiceNow**.

---

## 📄 Problem Statement

Modern airports face critical operational bottlenecks due to:
1.  **Inefficient Manual Triage**: High latency in dispatching technical teams to facility failures.
2.  **Inaccessible Legacy Systems**: Maintenance software is often desktop-bound, leaving field staff disconnected.
3.  **Communication Silos**: Passengers have no real-time way to report issues or track their resolution.
4.  **Reactive Maintenance**: Relying on failure reports rather than sensor-driven predictive insights.
5.  **Poor Accountability**: Lack of verifiable audit trails for critical safety and security incidents.

**Smart Airport Management** solves these by bridging passengers, IoT sensors, and field staff via an AI-orchestrated, mobile-first ecosystem.

---

## 🎯 Core Enterprise Features

| Feature | Details |
|---|---|
| 🤖 **AI-Powered Triage** | Groq LLM automatically categorizes, prioritizes, and assigns incidents with estimated resolution times. |
| 🛡️ **Enterprise Security** | JWT-based auth with bcrypt hashing, secure random credential dispatch, and centralized audit logging. |
| ⚡ **Async Performance** | Fully asynchronous backend architecture (`FastAPI` + `httpx`) for high-concurrency airport operations. |
| 📱 **Mobile-First Staff App** | Role-based dashboards for Security, Electrical, Plumbing, and Facilities teams. |
| 🔔 **Omni-Channel Alerts** | Passenger and staff notifications via WhatsApp (WAHA) and professional Email (SMTP). |
| 🏢 **Operational Metrics** | Management dashboard with real-time SLA tracking and airport health indicators. |
| 🔐 **Request Access Flow** | Seamless onboarding for new staff with secure, multi-channel credential delivery. |

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

# JWT Authentication
JWT_SECRET_KEY=dev_secret_key_change_in_production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7

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

### Metrics & Monitoring
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/v1/metrics/` | Operational KPIs & SLA Status |
| GET | `/health` | System health check |

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
| **Backend API** | Python, FastAPI, Uvicorn (Fully Asynchronous) |
| **Async Clients** | `httpx` (ServiceNow), `AsyncGroq` (AI) |
| **AI Triage** | Groq (Llama 3.1 8B), Groq SDK |
| **ITSM Platform** | ServiceNow REST API (v1 with Async Integration) |
| **Mobile App** | React Native, Expo, TypeScript |
| **State Management** | Redux Toolkit |
| **Passenger Portal** | Vite, React, TypeScript |
| **Monitoring** | Centralized Audit Logging, Operational Metrics API |
| **Design** | Glassmorphism, Outfit + Inter fonts |

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


---

<div align="center">
Built with ❤️ using FastAPI, Groq AI, ServiceNow & React Native
</div>
