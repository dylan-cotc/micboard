# Micboard

A church display application that shows next Sunday's vocalists and pastors synced from Planning Center. Features include photo management, microphone assignments, and real-time setlist display.

## Features

- **Public Display View**: Full-screen display with vertical columns showing people photos
- **Planning Center Integration**: Sync vocalists and pastors from Planning Center API
- **Photo Management**: Upload and manage photos for each person
- **Position Management**: Select which Planning Center positions to sync
- **Microphone Assignments**: Create and assign microphones to people
- **Setlist Display**: Show Planning Center plan setlist on the display
- **Admin Panel**: Secure admin interface with JWT authentication

## Tech Stack

### Frontend
- React with TypeScript
- Vite for fast development and building
- ESLint for code quality

### Backend
- Node.js with Express
- TypeScript
- PostgreSQL database
- JWT authentication
- Planning Center API integration
- Multer for file uploads
- bcrypt for password hashing

## Project Structure

```
micboard/
├── client/                  # React frontend
│   ├── src/
│   └── package.json
├── server/                  # Express backend
│   ├── src/
│   │   ├── index.ts        # Main server file
│   │   ├── db.ts           # Database connection
│   │   ├── middleware/     # Auth & upload middleware
│   │   ├── routes/         # API routes (auth, admin, display)
│   │   ├── services/       # Planning Center API service
│   │   ├── utils/          # JWT & password utilities
│   │   ├── migrations/     # Database schema & seeds
│   │   └── scripts/        # Migration & admin creation scripts
│   ├── .env.example
│   └── package.json
├── package.json            # Root package.json with scripts
└── README.md
```

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- PostgreSQL (v12 or higher)

## Getting Started

### 1. Install Dependencies

Install all dependencies for both client and server:

```bash
npm run install:all
```

Or install individually:

```bash
# Root dependencies
npm install

# Client dependencies
cd client && npm install

# Server dependencies
cd server && npm install
```

### 2. Set Up Database

1. Create a PostgreSQL database named `micboard`:

```bash
createdb micboard
```

2. Copy the example environment file in the server directory:

```bash
cd server
cp .env.example .env
```

3. Edit `server/.env` and configure all settings:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/micboard

# JWT Authentication (generate a secure random string)
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Planning Center API
# Get these from: https://api.planningcenteronline.com/oauth/applications
PLANNING_CENTER_APP_ID=your_planning_center_app_id
PLANNING_CENTER_SECRET=your_planning_center_secret

# File Upload
UPLOAD_DIR=uploads/photos
MAX_FILE_SIZE=5242880
```

4. Run database migrations:

```bash
npm run migrate
```

5. Create an admin user:

```bash
npm run create-admin
```

Follow the prompts to create your admin username and password.

### 3. Run the Application

Run both client and server concurrently:

```bash
npm run dev
```

Or run them separately:

```bash
# Run only the frontend (http://localhost:5173)
npm run dev:client

# Run only the backend (http://localhost:5000)
npm run dev:server
```

The frontend will be available at `http://localhost:5173` and the backend at `http://localhost:5000`.

## Available Scripts

### Root Level

- `npm run dev` - Run both client and server concurrently
- `npm run dev:client` - Run only the frontend
- `npm run dev:server` - Run only the backend
- `npm run build` - Build both client and server for production
- `npm run install:all` - Install dependencies for root, client, and server

### Client (Frontend)

```bash
cd client
npm run dev      # Start development server
npm run build    # Build for production
npm run preview  # Preview production build
npm run lint     # Run ESLint
```

### Server (Backend)

```bash
cd server
npm run dev          # Start development server with hot reload
npm run build        # Compile TypeScript to JavaScript
npm run start        # Run compiled production server
npm run migrate      # Run database migrations
npm run create-admin # Create admin user
```

## API Endpoints

### Public Endpoints
- `GET /api/health` - Health check
- `GET /api/display/data` - Get display data (people, setlist, church info)
- `POST /api/auth/login` - Admin login

### Admin Endpoints (Require Authentication)
All admin endpoints require `Authorization: Bearer <token>` header.

**Settings**
- `GET /api/admin/settings` - Get all settings
- `PUT /api/admin/settings` - Update settings

**Positions**
- `GET /api/admin/positions` - Get all positions
- `POST /api/admin/positions/sync` - Sync positions from Planning Center
- `PUT /api/admin/positions/:id` - Update position sync status

**People**
- `GET /api/admin/people` - Get all people
- `POST /api/admin/people/sync` - Sync people from Planning Center
- `POST /api/admin/people/:id/photo` - Upload photo for person
- `DELETE /api/admin/people/:id` - Delete person

**Microphones**
- `GET /api/admin/microphones` - Get all microphones
- `POST /api/admin/microphones` - Create microphone
- `PUT /api/admin/microphones/:id` - Update microphone
- `DELETE /api/admin/microphones/:id` - Delete microphone
- `POST /api/admin/microphones/:micId/assign/:personId` - Assign microphone
- `DELETE /api/admin/microphones/:micId/assign/:personId` - Unassign microphone

## Development

- Frontend runs on port 5173 (Vite default)
- Backend runs on port 5000 (configurable via .env)
- Hot reload is enabled for both client and server during development

## Production Build

Build both applications:

```bash
npm run build
```

This will:
1. Build the React frontend to `client/dist`
2. Compile the TypeScript backend to `server/dist`

## Usage Guide

### Initial Setup

1. **Configure Planning Center API**
   - Go to https://api.planningcenteronline.com/oauth/applications
   - Create a new application
   - Save your App ID and Secret
   - Add them to your `.env` file

2. **Access Admin Panel**
   - Navigate to `http://localhost:5173/admin`
   - Login with your admin credentials
   - Go to Settings and enter your Planning Center credentials

3. **Sync Positions**
   - In admin panel, go to Positions
   - Click "Sync from Planning Center"
   - Enable sync for positions you want to track (e.g., "Vocalist", "Pastor")

4. **Sync People**
   - Go to People section
   - Click "Sync from Planning Center"
   - This will import people from next Sunday's plan based on enabled positions
   - Upload photos for each person

5. **Create Microphones**
   - Go to Microphones section
   - Create microphones (e.g., "Mic 1", "Mic 2")
   - Assign microphones to people

6. **View Display**
   - Navigate to `http://localhost:5173/` for the public display
   - This shows the full-screen view with photos and setlist

### Planning Center Integration Notes

- People are only synced once (based on their Planning Center person ID)
- Only people from enabled positions will be synced
- Setlist is fetched in real-time from the next upcoming plan
- Photos must be uploaded manually after syncing people

## Next Steps

- Build the React frontend components
- Add routing for display and admin views
- Create UI for admin panel
- Add styling for full-screen display
- Implement photo display in vertical columns
- Add tests
- Set up CI/CD

## License

ISC
