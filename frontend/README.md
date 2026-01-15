# ReadyRent.Gala Frontend

Frontend application built with Next.js 16, TypeScript, Tailwind CSS, and shadcn/ui.

## Tech Stack

- **Next.js 16** - React framework with App Router
- **TypeScript** - Type safety
- **Tailwind CSS v4** - Styling
- **shadcn/ui** - UI components
- **Zustand** - State management
- **React Query** - Data fetching and caching
- **Axios** - HTTP client
- **React Hook Form** - Form handling

## Getting Started

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

### Environment Variables

Create `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NODE_ENV=development
```

### Build

```bash
npm run build
npm start
```

## Project Structure

```
frontend/
├── app/              # Next.js App Router
│   ├── (auth)/      # Authentication pages
│   ├── products/    # Product pages
│   └── layout.tsx   # Root layout
├── components/       # React components
│   ├── ui/          # shadcn/ui components
│   ├── navbar.tsx   # Navigation bar
│   └── footer.tsx   # Footer
└── lib/             # Utilities
    ├── api.ts       # API client
    ├── store.ts     # Zustand stores
    └── providers.tsx # React Query provider
```

## Features

- RTL Support (Arabic)
- Responsive Design (Mobile-First)
- Dark Mode Ready
- TypeScript throughout
- API Integration with Django Backend
