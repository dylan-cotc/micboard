# Micboard - Church Display Management System

![Docker](https://img.shields.io/badge/docker-%230db7ed.svg?style=for-the-badge&logo=docker&logoColor=white)
![Node.js](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/typescript-%23007ACC.svg?style=for-the-badge&logo=typescript&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/postgresql-%23316192.svg?style=for-the-badge&logo=postgresql&logoColor=white)

A comprehensive church display management system built with modern web technologies. Manage people, positions, microphones, and display configurations for church services with an intuitive web interface.

## ✨ Features

### 👥 **People Management**
- Centralized person database across multiple locations
- Photo upload with cropping and positioning
- Position assignments and microphone management
- Planning Center integration for automatic sync

### 🎯 **Display Management**
- Real-time display updates
- Logo management with position and display mode controls
- Dark/light mode themes
- Location-specific timezones
- Microphone separator indicators

### 🏢 **Multi-Location Support**
- Campus/location management
- Location-specific configurations
- Global vs. location-specific people
- Timezone-aware displays

### 🔐 **Security & Administration**
- JWT-based authentication
- Role-based access control
- Auto-generated secure secrets
- Admin account creation on first run

## 🚀 Quick Start with Docker

### Prerequisites
- Docker and Docker Compose installed
- At least 2GB RAM available
- Ports 5000 and 5432 available

### Run with Docker Compose

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd micboard
   ```

2. **Start the application**
   ```bash
   docker-compose up --build
   ```

3. **Access the application**
   - **Web Interface**: http://localhost:5001
   - **Admin Login**: http://localhost:5001/admin
   - **API Health Check**: http://localhost:5001/api/health

4. **Default Admin Credentials**
   - **Username**: `admin`
   - **Password**: `admin`
   - ⚠️ **Change the password immediately after first login!**

## 🐳 Docker Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `POSTGRES_USER` | `micboard_user` | PostgreSQL username |
| `POSTGRES_PASSWORD` | `ef0d39f0c7d5b1047b84fe9e756392ee` | PostgreSQL password |
| `DATABASE_URL` | Auto-generated | Full database connection string |
| `JWT_SECRET` | Auto-generated | JWT signing secret |
| `PORT` | `5000` | Application port |
| `NODE_ENV` | `production` | Environment mode |
| `CORS_ORIGIN` | `http://localhost:5000` | CORS allowed origin |

### Volumes

- `./server/uploads` - Persistent file storage for uploads
- PostgreSQL data persists automatically

### Auto-Setup Features

The application automatically:
- ✅ Generates secure JWT secrets
- ✅ Creates database connection strings
- ✅ Sets up default admin account
- ✅ Initializes database schema
- ✅ Configures file upload directories

## 🏗️ Architecture

```
Micboard Application
├── 🖥️  React Frontend (TypeScript)
│   ├── Admin Dashboard
│   ├── Display Management
│   └── User Authentication
├── 🚀 Express Backend (Node.js/TypeScript)
│   ├── REST API
│   ├── JWT Authentication
│   ├── File Upload Handling
│   └── Planning Center Integration
└── 🗄️  PostgreSQL Database
    ├── People & Positions
    ├── Locations & Settings
    └── Upload Metadata
```

## 📡 API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/logout` - User logout

### Admin (Protected)
- `GET /api/admin/people` - List people
- `POST /api/admin/people/sync` - Sync from Planning Center
- `GET /api/admin/locations` - Manage locations
- `GET /api/admin/settings` - Application settings

### Display (Public)
- `GET /api/display` - Get display data
- `GET /uploads/*` - Serve uploaded files

## 🔧 Development

### Local Development Setup

1. **Install dependencies**
   ```bash
   npm install
   cd client && npm install
   cd ../server && npm install
   ```

2. **Environment Setup**
   ```bash
   cp server/.env.example server/.env
   # Edit .env with your configuration
   ```

3. **Database Setup**
   ```bash
   cd server
   npm run migrate
   npm run create-admin
   ```

4. **Start Development**
   ```bash
   npm run dev  # Runs both client and server
   ```

### Building for Production

```bash
# Build client and server
npm run build

# Or use Docker
docker-compose up --build
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with Docker: `docker-compose up --build`
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🙏 Acknowledgments

- Built for church communities to enhance their service displays
- Integrates with Planning Center Online for people management
- Uses modern web technologies for reliability and performance

---

**Micboard** - Making church displays beautiful and easy to manage! 🎵⛪
