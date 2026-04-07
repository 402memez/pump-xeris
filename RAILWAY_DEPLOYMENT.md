# 🚂 Railway Deployment Guide for Rocket Crash Game

## Quick Setup (Option 1: Single Service - Recommended for Testing)

### Step 1: Prepare Your Repository
✅ Already done! The `railway.toml` file is configured in the root.

### Step 2: Create Railway Project
1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository
5. Railway will automatically detect the configuration

### Step 3: Set Environment Variables in Railway
Click on your service → Variables tab → Add these:

**Required:**
```
MONGO_URL=mongodb://mongo:27017/crash_game
DB_NAME=crash_game
PORT=8001
```

**Optional (if using MongoDB Atlas):**
```
MONGO_URL=mongodb+srv://username:password@cluster.mongodb.net/crash_game?retryWrites=true&w=majority
```

### Step 4: Add MongoDB Service (if not using Atlas)
1. In your Railway project, click "+ New"
2. Select "Database" → "Add MongoDB"
3. Railway will create a MongoDB instance and set `MONGO_URL` automatically
4. Update `MONGO_URL` to use the internal Railway MongoDB URL

### Step 5: Deploy!
- Railway will automatically deploy on every git push
- Check the deployment logs
- Once deployed, you'll get a URL like: `https://your-app.up.railway.app`

---

## Option 2: Separate Services (Production Setup)

### Backend Service:
1. Create new service → Deploy from GitHub
2. **Root Directory:** `/backend`
3. **Environment Variables:**
   ```
   MONGO_URL=<your-mongodb-url>
   DB_NAME=crash_game
   PORT=8001
   ```
4. **Start Command:** `uvicorn server:socket_asgi_app --host 0.0.0.0 --port $PORT`

### Frontend Service:
1. Create another service → Deploy from GitHub
2. **Root Directory:** `/frontend`
3. **Environment Variables:**
   ```
   REACT_APP_BACKEND_URL=https://your-backend-service.up.railway.app
   ```
4. **Build Command:** `yarn install && yarn build`
5. **Start Command:** Railway auto-detects (serves static build)

---

## Important Notes

### ✅ Fixed for Railway:
- **Removed `emergentintegrations`** package (not available on public PyPI)
- **Created `railway.toml`** configuration file
- **Updated requirements.txt** to remove Emergent-specific packages

### 🔧 Current Configuration:
- **Backend Port:** Uses Railway's `$PORT` environment variable
- **Socket.io:** Configured for production with websocket transport
- **CORS:** Set to allow all origins (configure for production)

### 📝 After Deployment:
1. Get your backend Railway URL (e.g., `https://your-app.up.railway.app`)
2. Update frontend `REACT_APP_BACKEND_URL` to point to it
3. Test Socket.io connection
4. Configure MongoDB connection string

### 🚨 Troubleshooting:

**If build fails:**
- Check Railway logs for specific errors
- Verify all environment variables are set
- Ensure MongoDB is accessible

**If Socket.io doesn't connect:**
- Check that backend URL in frontend matches your Railway backend service
- Verify CORS settings in `server.py`
- Check Railway logs for connection errors

**MongoDB connection issues:**
- Verify `MONGO_URL` is correct
- For Railway MongoDB, use internal connection string
- For Atlas, ensure IP whitelist includes `0.0.0.0/0`

---

## Environment Variables Reference

### Backend (.env)
```bash
MONGO_URL=mongodb://localhost:27017/crash_game
DB_NAME=crash_game
```

### Frontend (.env)
```bash
REACT_APP_BACKEND_URL=https://your-backend.up.railway.app
```

---

## Testing Your Deployment

1. **Backend Health Check:**
   ```bash
   curl https://your-backend.up.railway.app/api/game/state
   ```

2. **Frontend Access:**
   - Open `https://your-frontend.up.railway.app` in browser
   - Click "Connect Wallet"
   - Check browser console for any errors

3. **Socket.io Connection:**
   - Watch game multiplier updates in real-time
   - Check Network tab for websocket connection

---

## 🎯 Ready to Deploy!

Push your code to GitHub, and Railway will automatically deploy it!

```bash
git add .
git commit -m "Configure for Railway deployment"
git push origin main
```

Then go to Railway dashboard and watch it build! 🚀
