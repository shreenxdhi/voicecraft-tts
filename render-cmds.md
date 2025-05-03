# Render Deployment Commands

## Initial Deployment

Follow these steps to deploy your application to Render.com:

1. **Sign up/Login to Render**
   Visit https://dashboard.render.com and sign up or log in

2. **Connect GitHub Repository**
   - Click "New +" and select "Web Service"
   - Connect your GitHub account if not already done
   - Select the repository: `shreenxdhi/voicecraft-tts`

3. **Configure Service**
   - Name: `voicecraft-tts` (or choose your own)
   - Environment: `Node`
   - Region: Choose closest to your users
   - Branch: `main`
   - Render will automatically detect your `render.yaml` configuration
   - Click "Create Web Service"

## Render CLI Commands

If you prefer using the Render CLI, here are useful commands:

```bash
# Install Render CLI
npm install -g @render/cli

# Login to Render
render login

# Deploy your service
render deploy

# View logs for your service
render logs voicecraft-tts

# Scale your service
render scale voicecraft-tts --plan standard
```

## Monitoring and Management

```bash
# View service status
render service status voicecraft-tts

# View environment variables
render env voicecraft-tts

# Add new environment variable
render env set voicecraft-tts KEY=VALUE
```

## Troubleshooting

For debugging deployment issues:

1. Check service logs in the Render dashboard
2. View build logs for detailed error messages
3. Use the `/debug-coqui` endpoint to test Coqui TTS functionality
4. Check if model downloads completed successfully

## Manual Deployment

If you prefer to manually configure the service:

```
Build Command:
apt-get update && apt-get install -y ffmpeg python3-pip python3-dev espeak espeak-ng libsndfile1 && pip3 install TTS==0.22.0 && chmod +x download-models.sh && ./download-models.sh && npm install

Start Command:
node render-server.js
```

Environment Variables:
- `NODE_VERSION`: 18.17.1
- `RENDER`: true
- `PORT`: 3001
- `VIRTUAL_ENV`: /opt/render/project
- `TTS_CACHE_DIR`: /opt/render/project/.models 