# ReadyRent Gala

A modern, full-featured rental management platform built with Next.js, TypeScript, and Prisma.

![CI/CD Pipeline](https://github.com/Mirxou/ReadyRent_Gala/actions/workflows/ci.yml/badge.svg)
![Security Checks](https://github.com/Mirxou/ReadyRent_Gala/actions/workflows/security.yml/badge.svg)

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Configuration](#configuration)
- [Development](#development)
- [Testing](#testing)
- [Building](#building)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)

## ✨ Features

- 🏠 Property management dashboard
- 👥 User authentication and authorization
- 📱 Responsive design with modern UI
- 🔒 Secure data encryption with bcrypt
- 🗺️ Google Maps integration
- 💬 Real-time notifications with Socket.io
- 📊 Analytics and reporting
- 🧪 Comprehensive test coverage
- ⚡ Optimized performance with Turbopack
- 🌙 Dark mode support

## 🛠 Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript
- **Backend**: Next.js API Routes
- **Database**: Prisma ORM with PostgreSQL
- **Authentication**: JWT with bcryptjs
- **Real-time**: Socket.io
- **UI Components**: Radix UI, Tailwind CSS
- **Testing**: Jest, Playwright, Testing Library
- **Build Tool**: Next.js with Turbopack
- **Package Manager**: npm

## 📦 Prerequisites

- Node.js >= 20.0.0
- npm >= 10.0.0
- PostgreSQL >= 12
- Redis (optional, for caching)

## 🚀 Installation

### 1. Clone the repository

```bash
git clone https://github.com/Mirxou/ReadyRent_Gala.git
cd ReadyRent_Gala
```

### 2. Install dependencies

```bash
npm install
```

### 3. Setup environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` and update with your configuration:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/readyrent"
NEXT_PUBLIC_API_URL="http://localhost:3000"
JWT_SECRET="your-jwt-secret"
GOOGLE_MAPS_API_KEY="your-api-key"
```

### 4. Setup database

```bash
npx prisma migrate dev --name init
npx prisma db seed  # optional, if seed script exists
```

## ⚙️ Configuration

### Database Configuration

Update your `DATABASE_URL` in `.env.local`:

```env
DATABASE_URL="postgresql://username:password@localhost:5432/readyrent_dev"
```

### API Configuration

```env
NEXT_PUBLIC_API_URL="http://localhost:3000"
API_SECRET_KEY="your-secret-key"
```

### Google Maps Configuration

```env
GOOGLE_MAPS_API_KEY="your-google-maps-api-key"
```

## 💻 Development

### Start development server

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server with Turbopack |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run type-check` | Run TypeScript type checking |
| `npm test` | Run unit tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Generate coverage report |
| `npm run test:e2e` | Run end-to-end tests |
| `npm run test:e2e:ui` | Run e2e tests with UI |
| `npm run test:lighthouse` | Run Lighthouse performance tests |

## 🧪 Testing

### Unit Tests

```bash
npm test
```

### Unit Tests with Coverage

```bash
npm run test:coverage
```

### E2E Tests

```bash
npm run test:e2e
```

### E2E Tests with UI

```bash
npm run test:e2e:ui
```

### All Tests

```bash
npm run test:all
```

## 🔨 Building

### Production Build

```bash
npm run build
```

### Start Production Server

```bash
npm start
```

## 📁 Project Structure

```
ReadyRent_Gala/
├── .github/
│   └── workflows/
│       ├── ci.yml              # CI/CD pipeline
│       └── security.yml        # Security checks
├── app/                        # Next.js app directory
│   ├── api/                    # API routes
│   ├── layout.tsx              # Root layout
│   └── page.tsx                # Home page
├── components/                 # React components
├── lib/                        # Utility functions
├── mini-services/              # Micro-services
│   └── notifications-service/  # Notification service
├── public/                     # Static assets
├── prisma/                     # Prisma schema & migrations
├── __tests__/                  # Test files
├── jest.config.js              # Jest configuration
├── tsconfig.json               # TypeScript configuration
├── package.json                # Dependencies
├── .env.example                # Environment variables template
└── README.md                   # This file
```

## 🔐 Security

- Regular dependency audits via GitHub Actions
- TypeScript strict mode enabled
- Environment variables for sensitive data
- JWT authentication with secure tokens
- CSRF protection
- Input validation and sanitization

## 📊 CI/CD Pipeline

The project uses GitHub Actions for:

- ✅ Unit testing with coverage reports
- 🔍 Code linting and type checking
- 🏗️ Building and deployment
- 🔐 Security scanning
- 📊 Coverage reporting via Codecov

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Standards

- Follow ESLint rules
- Write TypeScript with strict mode
- Add tests for new features
- Keep components focused and reusable

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👨‍💻 Author

**Mirxou**
- GitHub: [@Mirxou](https://github.com/Mirxou)

## 🙏 Acknowledgments

- Next.js team for the excellent framework
- Prisma for the ORM solution
- Radix UI for accessible components
- All contributors and supporters

## 📧 Support

For support, email support@readyrent.com or open an issue on GitHub.

---

<div align="center">

Made with ❤️ by Mirxou

⭐ If you find this project helpful, please consider giving it a star!

</div>
