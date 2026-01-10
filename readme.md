# ⚽ ElClasico - Football Tournament Management System

[![React](https://img.shields.io/badge/React-19.2.0-61DAFB?style=flat&logo=react&logoColor=white)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=flat&logo=node.js&logoColor=white)](https://nodejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Database-47A248?style=flat&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A comprehensive full-stack web application for managing football tournaments, teams, live matches, and interactive games. Built with modern technologies and designed for football enthusiasts, tournament organizers, and team managers.

![ElClasico Banner](./docs/images/logo.jpg)
*Professional tournament management at your fingertips*

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [System Architecture](#-system-architecture)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Running the Application](#-running-the-application)
- [Testing](#-testing)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [Screenshots](#-screenshots)
- [Contributing](#-contributing)
- [License](#-license)

---

## ✨ Features

### 🏆 Tournament Management
- **Create & Manage Tournaments**: Support for both League and Knockout formats
- **Automated Fixture Generation**: 
  - Round-robin scheduling for League tournaments
  - Bracket generation for Knockout tournaments (validates power of 2)
- **Real-time Status Tracking**: Open, Upcoming, Ongoing, and Finished states
- **Visual Brackets**: Interactive knockout brackets with winner progression

![Tournament Management](./docs/images/Admin-create-tournament-preview.png)

### 👥 Team Administration
- **Team Registration**: Managers can register teams with 5-a-side or 11-a-side formats
- **Approval Workflow**: Admin approval system for team registrations
- **Squad Management**: Full player roster management with edit capabilities
- **Team Status**: Pending, Approved, Rejected, and Removal Requested states
- **Smart Validation**: Ensures proper team size and tournament compatibility

![Team Management](./docs/images/Admin-team-approve-preview.png)

### 🏟️ Match Operations
- **Match Scheduling**: Set venues, dates, and kickoff times
- **Score Management**: Real-time score updates with penalty shootout support
- **League Tables**: Automatic standings calculation with points, wins, draws, and losses
- **Match History**: Complete match records with detailed statistics

![Match Operations](./docs/images/Matches-preview.png)

### 🌍 Live World Football
- **Real-time Scores**: Integration with external football API for live match data
- **Multi-league Support**: Track matches from major leagues worldwide
- **Date Filtering**: View matches from yesterday, today, or tomorrow
- **Team Crests**: Visual display of team logos and match status
- **Live Indicators**: Animated live status for ongoing matches

![Live Scores](./docs/images/World-football-livematches-preview.png)

### 🎮 Interactive Games

#### Guess the Player
- **Career Path Puzzle**: Identify players by their club transfer history
- **Hint System**: Reveal additional clubs for 10 coins per hint
- **Coin Rewards**: Earn 50 coins for correct guesses
- **Dynamic Loading**: Fetches random player data with visual club logos

![Guess Player Game](./docs/images/Guess-theplayer-preview.png)

#### Football Trivia
- **Multiple Choice Questions**: Sports trivia from external API
- **Score Tracking**: Track correct answers and progress
- **Knowledge Testing**: Challenge your football knowledge

### 🔔 Notification System
- **Real-time Notifications**: Instant updates for team status changes
- **Unread Badges**: Visual indicators for new notifications
- **Auto-refresh**: Polls for new notifications every 10 seconds
- **Mark as Read**: Automatic and manual read status management

### 👤 User Roles & Authentication
- **Secure Login/Registration**: JWT-based authentication
- **Role-based Access Control**: 
  - **Admin**: Full tournament and team management
  - **Manager**: Team registration and squad management
- **Session Persistence**: LocalStorage-based session management
- **Coin System**: Virtual currency for game features

---

## 🛠 Tech Stack

### Frontend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 19.2.0 | UI framework |
| **React Router DOM** | 7.9.6 | Client-side routing |
| **Axios** | 1.13.2 | HTTP client |
| **React Scripts** | 5.0.1 | Build tooling |

### Backend
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Node.js** | - | Runtime environment |
| **Express** | 5.1.0 | Web framework |
| **MongoDB** | - | NoSQL database |
| **Mongoose** | 8.20.0 | MongoDB ODM |
| **dotenv** | 17.2.3 | Environment configuration |
| **CORS** | 2.8.5 | Cross-origin resource sharing |

### Testing
| Technology | Version | Purpose |
|-----------|---------|---------|
| **Jest** | 30.2.0 | Testing framework |
| **Supertest** | 7.1.4 | HTTP assertion library |
| **@testing-library/react** | 16.3.0 | React component testing |
| **MongoDB Memory Server** | 10.4.1 | In-memory database for tests |

### External APIs
- **Football-Data.org**: Live match scores and team data
- **Open Trivia Database**: Trivia questions
- **Custom Player API**: Player career path data

---

## 🏗 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Layer                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  React SPA (Port 3000)                               │  │
│  │  - Component-based UI                                │  │
│  │  - State Management (useState, useEffect)            │  │
│  │  - Routing (React Router)                            │  │
│  │  - Axios HTTP Client                                 │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           ↓ HTTP/REST
┌─────────────────────────────────────────────────────────────┐
│                      Server Layer                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Express.js API (Port 5000)                          │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  Routes Layer                                  │  │  │
│  │  │  /api/* endpoints                              │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │  Controllers Layer                             │  │  │
│  │  │  - authController                              │  │  │
│  │  │  - tournamentController                        │  │  │
│  │  │  - teamController                              │  │  │
│  │  │  - matchController                             │  │  │
│  │  │  - notificationController                      │  │  │
│  │  │  - liveScoreController                         │  │  │
│  │  │  - minigameController                          │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           ↓ Mongoose ODM
┌─────────────────────────────────────────────────────────────┐
│                    Database Layer                           │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  MongoDB                                             │  │
│  │  Collections:                                        │  │
│  │  - users                                             │  │
│  │  - tournaments                                       │  │
│  │  - teams                                             │  │
│  │  - matches                                           │  │
│  │  - notifications                                     │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (v14.0.0 or higher) - [Download](https://nodejs.org/)
- **npm** (v6.0.0 or higher) - Comes with Node.js
- **MongoDB** (v4.0 or higher) - [Download](https://www.mongodb.com/try/download/community)
  - Or use [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) for cloud database
- **Git** - [Download](https://git-scm.com/)

---

## 🚀 Installation

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/ElClasico.git
cd ElClasico
```

### 2. Install Server Dependencies

```bash
cd server
npm install
```

This will install:
- express, mongoose, dotenv, cors, axios, string-similarity
- Development dependencies: jest, supertest, nodemon, mongodb-memory-server

### 3. Install Client Dependencies

```bash
cd ../client
npm install
```

This will install:
- react, react-dom, react-router-dom, axios, react-scripts
- Testing libraries: @testing-library/react, @testing-library/jest-dom

---

## ⚙️ Configuration

### 1. Server Configuration

Create a `.env` file in the `server` directory:

```bash
cd server
touch .env  # On Windows use: type nul > .env
```

Add the following environment variables:

```env
# MongoDB Connection
MONGO_URI=mongodb://localhost:27017/elclasico
# Or use MongoDB Atlas:
# MONGO_URI=mongodb+srv://username:password@cluster.mongodb.net/elclasico

# Server Port
PORT=5000

# API Keys (Optional - for live scores feature)
FOOTBALL_API_KEY=your_football_api_key_here
```

### 2. Client Configuration

The client is pre-configured to connect to `http://localhost:5000/api`. If you need to change this:

Edit `client/src/App.js`:
```javascript
const API_URL = 'http://localhost:5000/api';  // Change if needed
```

### 3. Database Setup

#### Option A: Local MongoDB
Start MongoDB service:
```bash
# Windows
net start MongoDB

# macOS (using brew)
brew services start mongodb-community

# Linux
sudo systemctl start mongod
```

#### Option B: MongoDB Atlas (Cloud)
1. Create a free account at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Create a new cluster
3. Get your connection string
4. Add it to your `.env` file

---

## 🎯 Running the Application

### Development Mode

#### 1. Start the Server

```bash
cd server
npm start
```

The server will run on `http://localhost:5000`

**For development with auto-reload:**
```bash
npm run dev  # If nodemon is configured
```

#### 2. Start the Client

Open a new terminal:

```bash
cd client
npm start
```

The React app will open automatically at `http://localhost:3000`

### Production Build

#### Build the Client

```bash
cd client
npm run build
```

This creates an optimized production build in the `client/build` folder.

#### Serve Production Build

You can serve the production build using a static server:

```bash
npm install -g serve
serve -s build -l 3000
```

---

## 🧪 Testing

### Server Tests

Run backend API tests:

```bash
cd server
npm test
```

Test coverage includes:
- Authentication endpoints
- Team registration and management
- Tournament creation and fixtures
- Match operations

### Client Tests

Run frontend component tests:

```bash
cd client
npm test
```

Press `a` to run all tests.

For coverage report:
```bash
npm test -- --coverage --watchAll=false
```

---

## 📊 Database Seeding

To populate the database with initial test data:

```bash
cd server
node seed.js
```

This will create:
- **Admin user**: `admin` / `admin`
- **Manager user**: `manager` / `manager`

All existing data will be cleared before seeding.

---

## 📡 API Documentation

### Base URL
```
http://localhost:5000/api
```

### Authentication Endpoints

| Method | Endpoint | Description | Body |
|--------|----------|-------------|------|
| POST | `/register` | Create new user | `{username, email, password, role}` |
| POST | `/login` | Authenticate user | `{username, password}` |

### Tournament Endpoints

| Method | Endpoint | Description | Body |
|--------|----------|-------------|------|
| GET | `/tournaments` | Get all tournaments | - |
| POST | `/tournaments` | Create tournament | `{name, type, startDate, endDate, location}` |
| POST | `/tournaments/:id/start` | Generate fixtures | - |
| DELETE | `/tournaments/:id` | Delete tournament | - |

### Team Endpoints

| Method | Endpoint | Description | Body |
|--------|----------|-------------|------|
| GET | `/teams` | Get all teams | Query: `?managerId=xxx&tournamentId=xxx` |
| POST | `/teams` | Register team | `{name, players[], tournamentId, managerId, teamSize}` |
| PUT | `/teams/:id` | Update team | `{name, players[]}` |
| PUT | `/teams/:id/status` | Update team status | `{status}` |
| DELETE | `/teams/:id` | Delete/withdraw team | `{role}` |

### Match Endpoints

| Method | Endpoint | Description | Body |
|--------|----------|-------------|------|
| GET | `/matches` | Get all matches | - |
| POST | `/matches` | Create match | `{tournamentId, homeTeam, awayTeam, date, venue}` |
| PUT | `/matches/:id` | Update score | `{homeScore, awayScore, homePenaltyScore, awayPenaltyScore}` |

### Notification Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/notifications/:userId` | Get user notifications |
| PUT | `/notifications/:id/read` | Mark notification as read |
| PUT | `/notifications/user/:userId/read-all` | Mark all as read |

### Live Score & Game Endpoints

| Method | Endpoint | Description | Body |
|--------|----------|-------------|------|
| GET | `/live-scores?date=YYYY-MM-DD` | Get live matches | - |
| GET | `/minigame/new` | Start new player game | - |
| POST | `/minigame/check` | Check answer | `{userId, guess, actualNameBase64}` |
| POST | `/minigame/hint` | Use hint | `{userId, cost}` |

---

## 📁 Project Structure

```
ElClasico/
├── client/                    # Frontend React application
│   ├── public/               # Static files
│   │   ├── index.html       # HTML template
│   │   ├── favicon.ico      # App icon
│   │   └── manifest.json    # PWA manifest
│   ├── src/
│   │   ├── App.js           # Main application component (905 lines)
│   │   ├── App.css          # Application styles
│   │   ├── index.js         # React entry point
│   │   ├── index.css        # Global styles
│   │   ├── setupTests.js    # Test configuration
│   │   ├── __mocks__/       # Test mocks
│   │   └── App.test.js      # Component tests
│   ├── package.json         # Frontend dependencies
│   └── README.md            # Create React App documentation
│
├── server/                   # Backend Node.js/Express application
│   ├── controllers/         # Business logic
│   │   ├── authController.js          # User authentication
│   │   ├── tournamentController.js    # Tournament management
│   │   ├── teamController.js          # Team operations
│   │   ├── matchController.js         # Match handling
│   │   ├── notificationController.js  # Notifications
│   │   ├── liveScoreController.js     # External API integration
│   │   └── minigameController.js      # Game logic
│   ├── models/              # Mongoose schemas
│   │   ├── User.js          # User model
│   │   ├── Tournament.js    # Tournament model
│   │   ├── Team.js          # Team model
│   │   ├── Match.js         # Match model
│   │   └── Notification.js  # Notification model
│   ├── routes/
│   │   └── api.js           # API route definitions
│   ├── tests/               # Server tests
│   │   ├── api.test.js      # API endpoint tests
│   │   └── team.test.js     # Team controller tests
│   ├── server.js            # Express server entry point
│   ├── seed.js              # Database seeding script
│   ├── .env                 # Environment variables (gitignored)
│   └── package.json         # Backend dependencies
│
├── .gitignore               # Git ignore rules
└── README.md                # This file
```

---

## 📸 Screenshots

### Admin Dashboard
![Admin Dashboard](./docs/images/Admin-Panel-preview.png)
*Admin dashboard showing team approval statistics and management tools*

### Dashboard Sidebar
![Dashboard Sidebar](./docs/images/Dashboard-sidepanel-preview.png)
*Navigation sidebar with role-based menu items*

### Tournament Management
![Create Tournament](./docs/images/Admin-create-tournament-preview.png)
*Admin interface for creating new tournaments*

### Team Approval Workflow
![Team Pending Status](./docs/images/Admin-team-pending-status-preview.png)
*Teams awaiting admin approval*

![Team Approval](./docs/images/Admin-team-approve-preview.png)
*Detailed team review and approval interface*

### Tournament Bracket
![Knockout Bracket - Logged In](./docs/images/Bracket-preview.png)
*Visual knockout tournament bracket with live match results*

![Knockout Bracket - Public View](./docs/images/NoLogin-bracket-preview.png)
*Public-facing tournament bracket without login*

### Matches & Teams
![Match Scheduling](./docs/images/Matches-preview.png)
*Match scheduling and score management*

![Tournament Teams](./docs/images/Tournament-teams-preview.png)
*View all teams registered in a tournament*

### Live World Football
![Live Matches](./docs/images/World-football-livematches-preview.png)
*Real-time scores from leagues worldwide*

![Multiple Leagues](./docs/images/Multiple-leagues-preview.png)
*Browse matches from different leagues*

### Manager Squad Management
![My Squads](./docs/images/Manager-mysquads-preview.png)
*Manager's team portfolio and status tracking*

![Team Creation](./docs/images/Manager-team-creation-preview.png)
*Register new team with player roster*

![Manager Team Status](./docs/images/Manager-team-pending-status-preview.png)
*Manager view of pending team approval*

### Interactive Games
![Guess the Player](./docs/images/Guess-theplayer-preview.png)
*Career path guessing game with hint system*

![Trivia Game](./docs/images/TriviaMinigame-question-preview.png)
*Football trivia challenge with multiple choice questions*

### Notification System
![Notifications](./docs/images/Notification-system-preview.png)
*Real-time notifications for team status updates*

### API Integration
![External API](./docs/images/API-requests-from-api-site-preview.png)
*Live football data integration from external API*

---

## 🎨 Key Features Showcase

### Automated Fixture Generation

**League Format:**
- Round-robin algorithm ensures every team plays every other team
- Equal home and away matches
- Automatic scheduling

**Knockout Format:**
- Binary tree bracket structure
- Power of 2 validation (4, 8, 16, 32 teams)
- Winner progression to next rounds
- Penalty shootout support for draws

### Real-time Notification System

```javascript
// Polls every 10 seconds for new notifications
useEffect(() => {
  if (user) {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 10000);
    return () => clearInterval(interval);
  }
}, [user, fetchNotifications]);
```

### Coin Economy System

- **Earn Coins**: 50 coins per correct player guess
- **Spend Coins**: 10 coins per hint in Guess the Player
- **Persistent Balance**: Synced with backend and localStorage

### Role-Based UI

Different interfaces based on user role:
- **Admin**: Team approval, tournament management, fixture generation
- **Manager**: Team registration, squad editing, game access
- **Public**: View tournaments, live matches, and trivia

---

## 🔧 Development Tips

### Hot Reload

Both client and server support hot reloading:
- Client: Automatic via React Scripts
- Server: Use `nodemon` for auto-restart on file changes

### Debugging

**Client:**
```bash
# React DevTools browser extension recommended
# Console logs available in browser DevTools
```

**Server:**
```bash
# Add to package.json scripts:
"debug": "node --inspect server.js"

# Then use Chrome DevTools or VS Code debugger
```

### Common Issues

1. **CORS Errors**: Ensure server has CORS enabled and client URL is allowed
2. **MongoDB Connection**: Verify MongoDB is running and connection string is correct
3. **Port Conflicts**: Change PORT in .env if 5000 is already in use
4. **Environment Variables**: Restart server after modifying .env file

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. **Fork the repository**
2. **Create a feature branch**
   ```bash
   git checkout -b feature/AmazingFeature
   ```
3. **Commit your changes**
   ```bash
   git commit -m 'Add some AmazingFeature'
   ```
4. **Push to the branch**
   ```bash
   git push origin feature/AmazingFeature
   ```
5. **Open a Pull Request**

### Code Style

- **Frontend**: Follow Airbnb React Style Guide
- **Backend**: Use ES6+ features, async/await for promises
- **Formatting**: Consistent indentation (2 spaces)
- **Comments**: Document complex logic and functions

---

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👨‍💻 Author

**Your Name**
- GitHub: [@mohannadx101](https://github.com/mohannadx101)
- Email: Mohannadx101@gmail.com

---

## 🙏 Acknowledgments

- [API-Football.com](https://www.api-football.com/) for live match API
- [Open Trivia Database](https://opentdb.com/) for trivia questions
- React community for excellent documentation
- MongoDB for robust database solution

---

## 📞 Support

For issues, questions, or suggestions:
- **Open an Issue**: [GitHub Issues](https://github.com/mohannadx101/ElClasico/issues)
- **Email**: mohannadx101@gmail.com

---

## 🗺️ Roadmap
**Postponed project**
---
