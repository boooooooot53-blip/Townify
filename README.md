# Townify 🏙️

Townify is a community service and management platform designed to connect residents with local workers, food providers, and municipal services.

---

## 📁 Project Structure

```text
Townify/
├── Backend/          # Node.js, Express, MongoDB Atlas, Socket.io API
│   ├── src/
│   │   ├── config/      # Database & Cloudinary configurations
│   │   ├── controllers/ # Request handlers
│   │   ├── middleware/  # Auth & validation middleware
│   │   ├── models/      # Mongoose schemas (User, ServiceRequest, Restaurant, etc.)
│   │   ├── routes/      # REST API route handlers
│   │   ├── sockets/     # Real-time WebSocket handlers
│   │   └── utils/       # Utility helpers
│   └── package.json
│
├── Frontend/         # React Native (Expo) Mobile & Web Application
│   ├── app/             # Expo Router screens (Tabs, Worker, Admin, Complaint, etc.)
│   ├── api/             # API clients & service request calls
│   ├── components/      # Reusable UI components
│   ├── context/         # React Context (Auth, Data, Socket)
│   ├── hooks/           # Custom hooks
│   └── package.json
└── README.md
```

---

## 🚀 Getting Started

### 1. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd Backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create your `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```
4. Start the server:
   ```bash
   npm start
   ```

### 2. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd Frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create your `.env` file from `.env.example`:
   ```bash
   cp .env.example .env
   ```
4. Start the Expo app:
   ```bash
   npm start
   ```
