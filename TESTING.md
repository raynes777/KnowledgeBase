# Testing Guide - Clinical Trial Documentation

## Prerequisites

1. **Backend running**: `docker-compose up -d` (from root directory)
2. **Frontend running**: `cd frontend && npm run dev`

## Test Workflow

### 1. Registration

1. Open [http://localhost:3000](http://localhost:3000)
2. Click "Don't have an account? Register here"
3. Fill the form:
   - Name: Test Sponsor
   - Email: sponsor@test.com
   - Password: password123
   - Role: Sponsor
   - Organization: Pharma Inc (optional)
4. Click "Register"
5. You'll be redirected to login after 2 seconds

### 2. Login

1. Enter credentials:
   - Email: sponsor@test.com
   - Password: password123
2. Click "Sign in"
3. You'll be redirected to the Dashboard

### 3. Dashboard

You should see:
- Header with your name and role
- "Create Document" button (if you're SPONSOR, RESEARCHER, or HOSPITAL)
- Empty document list (initially)

### 4. Create Document

1. Click "Create Document"
2. Fill the form:
   - Title: Protocol XYZ-2026
   - Document Type: Protocol
   - Initial Content: "Study objectives: Evaluate efficacy and safety of compound ABC in patients with condition XYZ..."
3. Click "Create"
4. The document appears in the list with:
   - Document type badge
   - Version number
   - Creator name
   - IOTA verification status (green checkmark with TX ID)

### 5. View Document Details

1. Click on the document in the list
2. You should see:
   - Document title and metadata
   - Current version number
   - IOTA Verification badge with:
     - Transaction ID (MOCK_TX_...)
     - Content hash (SHA-256)
   - Document content
   - Version history timeline

### 6. Test Different Roles

Create additional users with different roles to test permissions:

**Researcher:**
```
Email: researcher@test.com
Password: password123
Role: Researcher
```

**Ethics Committee:**
```
Email: ethics@test.com
Password: password123
Role: Ethics Committee
```

**Auditor:**
```
Email: auditor@test.com
Password: password123
Role: Auditor
```

### Expected Behavior by Role

| Role | Can Create Documents | Can View Documents | Create Button Shown |
|------|---------------------|-------------------|-------------------|
| SPONSOR | ✅ | ✅ | ✅ |
| RESEARCHER | ✅ | ✅ | ✅ |
| HOSPITAL | ✅ | ✅ | ✅ |
| ETHICS_COMMITTEE | ❌ | ✅ | ❌ |
| AUDITOR | ❌ | ✅ | ❌ |

## Backend API Testing

You can also test the backend directly with curl:

### Register
```bash
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User",
    "role": "SPONSOR",
    "organization": "Pharma Inc"
  }'
```

### Login
```bash
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

Save the `accessToken` from response.

### Create Document
```bash
TOKEN="<your_token_here>"

curl -X POST http://localhost:8080/api/documents \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "title": "Protocol XYZ-2026",
    "docType": "PROTOCOL",
    "initialContent": "Study objectives..."
  }'
```

### Get All Documents
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/documents
```

### Get Document by ID
```bash
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:8080/api/documents/<document_id>
```

### Verify Version
```bash
curl http://localhost:8080/api/verification/version/<version_id>
```

## Troubleshooting

### Frontend can't connect to backend

**Check backend status:**
```bash
docker-compose ps
```

**Check backend logs:**
```bash
docker-compose logs -f backend
```

**Backend should show:**
```
Started ClinicalTrialDocApplication in X.XXX seconds
```

### CORS errors

The backend CORS configuration should allow requests from `http://localhost:3000`. If you see CORS errors, check the SecurityConfig.java CORS settings.

### JWT token expired

Tokens expire after 24 hours. If you get 401 errors, login again to get a fresh token.

### Database connection errors

**Reset database:**
```bash
docker-compose down -v
docker-compose up -d --build
```

## Next Steps

Once basic testing works:

1. Test creating multiple documents with different types
2. Test with multiple users simultaneously
3. Verify IOTA transaction IDs are being generated
4. Check version history shows correctly
5. Test logout and re-login flow
6. Test permission restrictions (e.g., AUDITOR can't create documents)

## Known Limitations (MVP)

- IOTA service is mock (returns `MOCK_TX_*` IDs)
- No real-time collaboration
- No document editing (only creation)
- No transclusion UI
- No diff viewer for versions
- Version tree is flattened (no branching)
