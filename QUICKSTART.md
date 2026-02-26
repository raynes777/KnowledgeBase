# ⚡ Quick Start - Clinical Trial Documentation

**Get the full app running in 2 commands!**

## Prerequisites

- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed
- Nothing else! ✅

## 🚀 Start the App

```bash
# 1. Navigate to project directory
cd clinicalTriaDocumentation

# 2. Start everything
docker-compose up -d --build

# Wait ~5-8 minutes for first build...
```

## ✅ Verify It's Running

```bash
docker-compose ps
```

You should see:
```
NAME           STATUS
ctd_backend    Up (healthy)
ctd_frontend   Up (healthy)
ctd_postgres   Up (healthy)
```

## 🎨 Open the App

**Visit:** [http://localhost:3000](http://localhost:3000)

## 📝 Test the App

### 1. Register
- Click "Don't have an account? Register here"
- Fill form:
  - Name: Test User
  - Email: test@example.com
  - Password: password123
  - Role: Sponsor
- Click "Register"

### 2. Login
- Email: test@example.com
- Password: password123
- Click "Sign in"

### 3. Create Document
- Click "Create Document"
- Title: Protocol XYZ-2026
- Type: Protocol
- Content: "Study objectives: Evaluate efficacy..."
- Click "Create"

### 4. View Document
- Click on document in list
- See IOTA verification badge ✅
- Check version history

## 🛑 Stop the App

```bash
docker-compose stop
```

## 🗑️ Reset Everything

```bash
# This deletes the database!
docker-compose down -v
```

## 📚 Next Steps

- Read [TESTING.md](./TESTING.md) for detailed testing guide
- Read [DOCKER.md](./DOCKER.md) for Docker architecture
- Read [SETUP.md](./SETUP.md) for full setup guide

## 🆘 Troubleshooting

### Containers not starting?
```bash
docker-compose logs -f
```

### Port already in use?
Edit `docker-compose.yml` and change ports:
```yaml
ports:
  - "8081:8080"  # Backend
  - "3001:80"    # Frontend
```

### Build taking too long?
First build downloads dependencies (~500MB). Subsequent builds are fast!

### Frontend shows "Cannot connect"?
Wait for backend to be healthy:
```bash
docker-compose logs -f backend
# Wait for: "Started ClinicalTrialDocApplication in X.XXX seconds"
```

## 🔧 Useful Commands

```bash
# View logs
docker-compose logs -f

# Rebuild after code changes
docker-compose up -d --build

# Shell into containers
docker exec -it ctd_frontend sh
docker exec -it ctd_backend sh
docker exec -it ctd_postgres psql -U ctd_user -d ctd_db
```

## 🎯 What You Get

- ✅ Full-stack app (React + Spring Boot + PostgreSQL)
- ✅ JWT authentication with 5 roles
- ✅ Document creation and versioning
- ✅ IOTA blockchain verification (mock)
- ✅ Xanadu content versioning system
- ✅ Audit trail
- ✅ Production-ready Docker setup

**Now start building! 🚀**
