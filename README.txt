================================================================================
                                   TOWNIFY
            Smart Community & On-Demand Service Management Platform
================================================================================

1. PROJECT OVERVIEW
-------------------
Townify is a full-stack smart community and municipal management platform.
It connects housing society residents, local service workers (electricians,
plumbers, carpenters, painters, etc.), community vendors (restaurants, grocery),
and society administration into a unified, secure ecosystem.

The system streamlines service discovery, quotation-based task assignment,
real-time communication, complaint resolution, food ordering, and emergency
assistance (SOS alerts).


================================================================================
2. KEY ACTORS & ROLES
================================================================================

1. RESIDENT (User)
   - Browse and search verified local service providers.
   - Post service requests with location, media, and budget.
   - Receive quotations/bids from workers and accept preferred bids.
   - Live 1-on-1 chat with workers.
   - Rate and review workers upon service completion.
   - Browse society restaurants and view menus.
   - Submit community complaints with image attachments.
   - Trigger instant SOS emergency alerts to society administration.

2. SERVICE WORKER
   - Register with skills, experience, and CNIC/ID card verification documents.
   - Undergo administrative approval before accepting jobs.
   - Receive job leads matching their verified skills.
   - Submit formal quotations with estimated costs and timelines.
   - Track active tasks (Accepted -> In Progress -> Completed).
   - Toggle availability status (Available / Busy / Offline).

3. RESTAURANT / VENDOR
   - Showcase food items with descriptions, prices, spice levels, and images.
   - Manage menu categories (Appetizers, Mains, Desserts, Beverages, Specials).
   - Toggle item availability and vegetarian indicators.

4. SOCIETY ADMINISTRATOR
   - Verify worker registrations and review identity documents (CNIC).
   - Approve or reject worker onboarding.
   - Manage user accounts, role permissions, and access status.
   - Review, triage, and resolve resident complaints.
   - Monitor emergency SOS alerts with real-time location.
   - Access system-wide service request metrics and analytics.


================================================================================
3. TECHNOLOGY STACK
================================================================================

* Mobile Application (Frontend):
  - Framework: React Native with Expo (v57) & Expo Router
  - Language: TypeScript / React 19
  - State & Data: React Context API, TanStack React Query
  - Networking: Axios HTTP Client, Socket.io-client
  - UI & Components: Expo Vector Icons, React Native SVG, Reanimated, Blur
  - Maps & Location: Expo Location, React Native Maps

* Backend API & Server:
  - Runtime: Node.js (v18+)
  - Framework: Express.js (v4.21)
  - Real-Time Layer: Socket.io (WebSockets for chat & live events)
  - Security & Middleware: Helmet, CORS, Express-Rate-Limit, BCryptJS
  - File Handling: Multer, Cloudinary v2 SDK
  - Email Notifications: Nodemailer (SMTP OTP verification)

* Database & Storage:
  - Primary Database: MongoDB Atlas (Mongoose ODM v8.9)
  - Cloud Asset Storage: Cloudinary (Photos, CNIC cards, Avatars)


================================================================================
4. DATABASE MODELS & SCHEMA SUMMARY
================================================================================

The backend utilizes MongoDB collections managed via Mongoose schemas:

* User (`User.js`):
  - Authentication credentials, role (`user`, `worker`, `admin`).
  - Worker profile: skills, experience, rating, CNIC documents, approval status.
  - Profile image, phone, status, and verification flags.

* ServiceRequest (`ServiceRequest.js`):
  - Category, description, resident location, budget, preferred time.
  - Lifecycle state: `pending`, `quoted`, `accepted`, `in_progress`, `completed`, `cancelled`.
  - Assigned worker reference and completion timestamps.

* Quotation (`Quotation.js`):
  - Worker bid linking a service request to a specific worker.
  - Proposed cost, notes, estimated duration, and status (`pending`, `accepted`, `rejected`).

* Restaurant (`Restaurant.js`):
  - Restaurant metadata, rating, operating hours, delivery fee.
  - Embedded menu items: name, description, price, category, vegetarian tag, spice level.

* Complaint (`Complaint.js`):
  - Resident issues (maintenance, security, sanitation, noise).
  - Status tracking (`submitted`, `in_review`, `resolved`, `dismissed`).
  - Priority levels (`low`, `medium`, `high`, `urgent`), admin notes, resolution log.

* ChatRoom & Message (`ChatRoom.js`, `Message.js`):
  - 1-on-1 conversation channel between resident and worker.
  - Real-time messages with timestamps, read status, and sender identification.

* SOS (`SOS.js`):
  - Emergency panic alerts with exact GPS coordinates and caller information.
  - Admin acknowledgment and status logging.

* OTP (`OTP.js`):
  - One-time password generation, expiration TTL, and verification flags.

* Notification (`Notification.js`):
  - In-app notification feeds with deep links and read tracking.


================================================================================
5. REST API ROUTE DIRECTORY
================================================================================

Base URL: http://<server_host>:5000/api/v1

* Authentication:
  - POST /auth/register             - Register resident or worker
  - POST /auth/login                - Authenticate user & issue JWT tokens
  - POST /auth/refresh-token        - Refresh expired access token
  - POST /auth/forgot-password      - Send OTP for password recovery
  - POST /auth/verify-otp           - Validate 6-digit OTP code
  - POST /auth/reset-password       - Reset password with token

* User & Worker Management:
  - GET  /users/profile             - Fetch current user profile
  - PUT  /users/profile             - Update profile & avatar
  - GET  /users/workers             - Search and list available workers
  - GET  /users/workers/:id         - Fetch worker details and reviews

* Service Requests:
  - POST /service-requests          - Create a new service job
  - GET  /service-requests          - List user requests / worker job leads
  - GET  /service-requests/:id      - Get service request details
  - PUT  /service-requests/:id/status - Update job progression status

* Quotations:
  - POST /quotations                - Worker submits a quotation
  - GET  /quotations/request/:id    - Get all bids for a request
  - POST /quotations/:id/accept     - Resident accepts a quotation

* Restaurants:
  - GET  /restaurants               - List local food providers
  - GET  /restaurants/:id           - View restaurant details and menu items
  - POST /restaurants               - Add restaurant (Admin/Vendor)
  - POST /restaurants/:id/menu      - Add item to menu

* Complaints & Municipal:
  - POST /complaints                - Submit a complaint
  - GET  /complaints/my             - List resident's complaints
  - GET  /complaints/:id            - View complaint history and notes

* Emergency (SOS):
  - POST /sos                       - Trigger instant panic button alert
  - GET  /sos/active                - Get active SOS alerts (Admin)

* Administration (Admin-only):
  - GET  /admin/stats               - Dashboard statistics
  - GET  /admin/workers/pending     - List unapproved workers
  - PUT  /admin/workers/:id/approve - Approve or reject worker
  - GET  /admin/complaints          - All complaints oversight
  - PUT  /admin/complaints/:id      - Update complaint resolution state


================================================================================
6. REPOSITORY DIRECTORY LAYOUT
================================================================================

Townify/
|-- Backend/
|   |-- src/
|   |   |-- config/              (Database, Cloudinary, Environment)
|   |   |-- controllers/         (Business logic for all endpoints)
|   |   |-- middleware/          (JWT Auth, Role check, Multer, Error handler)
|   |   |-- models/              (Mongoose models: User, ServiceRequest, etc.)
|   |   |-- routes/              (Express router endpoints)
|   |   |-- sockets/             (Socket.io handlers for real-time events)
|   |   |-- utils/               (Async handler, OTP, Mailer, JWT helpers)
|   |   |-- app.js               (Express app setup, middleware, CORS)
|   |   `-- server.js            (Server startup & WebSocket initialization)
|   |-- .env.example             (Backend environment template)
|   `-- package.json
|
|-- Frontend/
|   |-- app/                     (Expo Router screen layouts & navigation)
|   |   |-- (tabs)/              (Bottom tabs: Home, Services, Chat, Profile)
|   |   |-- admin/               (Admin portal: Users, Workers, Complaints)
|   |   |-- worker/              (Worker profile and detail views)
|   |   `-- ...                  (Modals, Auth screens, Service request forms)
|   |-- api/                     (Axios API service methods and TypeScript types)
|   |-- components/              (Reusable UI widgets and layout containers)
|   |-- constants/               (Colors, typography, theme tokens)
|   |-- context/                 (AuthContext, DataContext, SocketContext)
|   |-- hooks/                   (Custom React hooks: useColors, useSocket)
|   |-- utils/                   (Storage, image upload, location helpers)
|   |-- .env.example             (Frontend environment template)
|   `-- package.json
|
|-- README.txt                   (This system documentation file)
|-- INSTALLATION_GUIDE.txt       (Step-by-step setup and deployment guide)
|-- README.md                    (Markdown formatted project overview)
`-- .gitignore                   (Protects secrets and dependencies)


================================================================================
7. LICENSE & CREDITS
================================================================================

Project: Townify Community & Service Platform
License: MIT
Repository: https://github.com/boooooooot53-blip/Townify
================================================================================
