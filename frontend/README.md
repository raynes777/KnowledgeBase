# Clinical Trial Documentation - Frontend

React + TypeScript frontend for the Clinical Trial Documentation platform.

## Stack

- **Vite** - Build tool
- **React 18** - UI library
- **TypeScript** - Type safety
- **TailwindCSS** - Styling
- **React Router** - Navigation
- **Axios** - HTTP client with JWT interceptors
- **React Query** - Data fetching and caching
- **Zustand** - State management

## Setup

### Development

```bash
# Install dependencies
npm install

# Start dev server (requires backend running on http://localhost:8080)
npm run dev

# Frontend will be available at http://localhost:3000
```

### Build for Production

```bash
npm run build
npm run preview
```

## Project Structure

```
frontend/
├── src/
│   ├── lib/
│   │   ├── api.ts          # Axios client with JWT interceptor
│   │   └── auth.ts         # Auth utilities (token storage)
│   ├── pages/
│   │   ├── Login.tsx       # Login page
│   │   ├── Register.tsx    # Registration page
│   │   ├── Dashboard.tsx   # Document list + create
│   │   └── DocumentDetail.tsx  # Document viewer with version history
│   ├── store/
│   │   └── authStore.ts    # Zustand auth state
│   ├── types/
│   │   └── index.ts        # TypeScript interfaces
│   ├── App.tsx             # Router setup
│   └── main.tsx            # React Query provider
├── vite.config.ts          # Vite config with API proxy
└── tailwind.config.js      # TailwindCSS config
```

## Features

### Authentication
- Login/Register with role selection
- JWT token storage in localStorage
- Automatic token injection in API requests
- Auto-redirect on 401

### Dashboard
- List all documents accessible by user
- Create new documents (SPONSOR, RESEARCHER, HOSPITAL roles)
- Filter by document type
- View IOTA verification status

### Document Detail
- View document content
- Version history timeline
- IOTA verification badge
- Content hash display

### Role-Based Access
- **SPONSOR**: Can create and manage documents
- **RESEARCHER**: Can create and view assigned documents
- **HOSPITAL**: Can create local documents
- **ETHICS_COMMITTEE**: View only + approval (future)
- **AUDITOR**: View only + audit trail

## API Integration

All API calls go through the Axios client in `src/lib/api.ts`:

```typescript
// Auth
authApi.register(data)
authApi.login(data)

// Documents
documentApi.create(data)
documentApi.getAll()
documentApi.getById(id)
documentApi.getVersions(id)

// Verification
verificationApi.verifyVersion(versionId)
```

The API proxy in `vite.config.ts` forwards `/api/*` requests to `http://localhost:8080`.

## Development Workflow

1. Start backend: `docker-compose up -d` (from root directory)
2. Start frontend: `npm run dev` (from frontend directory)
3. Open http://localhost:3000
4. Register a new user
5. Login and create documents

## Environment Variables

No `.env` file needed for development. The Vite proxy handles API routing.

For production, set `VITE_API_URL` if backend is on different domain.

## TODO

- [ ] Document editor with rich text
- [ ] Real-time collaboration
- [ ] PDF export
- [ ] Advanced search/filters
- [ ] Transclusion UI
- [ ] Diff viewer for versions
