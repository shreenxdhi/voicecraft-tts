# Render Deployment Checklist

Use this checklist to ensure your Render deployment is properly configured and running.

## Pre-Deployment

- [ ] **GitHub Repository**
  - [ ] All code is committed and pushed to your repository
  - [ ] `render.yaml` is present at the root of your repository
  - [ ] `download-models.sh` has execute permissions (`chmod +x download-models.sh`)
  
- [ ] **Dependencies**
  - [ ] Node.js dependencies listed in package.json
  - [ ] Python dependencies specified in render.yaml (TTS==0.22.0)
  - [ ] System dependencies in render.yaml (ffmpeg, espeak-ng, libsndfile1)
  
- [ ] **Environment Variables**
  - [ ] All necessary environment variables defined in render.yaml
  - [ ] PORT set to 3001
  - [ ] RENDER set to true
  - [ ] TTS_CACHE_DIR set to /opt/render/project/.models

## Deployment Process

- [ ] **Create Render Web Service**
  - [ ] Sign in to Render dashboard
  - [ ] Connect GitHub repository
  - [ ] Select Node.js environment
  - [ ] Choose appropriate region
  - [ ] Set plan (Free is fine for testing)
  
- [ ] **Build Phase**
  - [ ] Monitor build logs for errors
  - [ ] Verify system dependencies installed successfully
  - [ ] Check TTS installation completed
  - [ ] Confirm model downloads were successful
  
- [ ] **Initial Deployment**
  - [ ] Wait for build to complete (may take 10-15 minutes for model downloads)
  - [ ] Verify service status shows "Live"
  - [ ] Check server started successfully

## Post-Deployment Verification

- [ ] **Basic Functionality**
  - [ ] Application loads in browser
  - [ ] Voice selection dropdown works
  - [ ] Text input field works
  
- [ ] **Voice Generation**
  - [ ] Google TTS voice works
  - [ ] Coqui premium voices work (if not, verify fallback to Google TTS)
  - [ ] Audio playback functions correctly
  
- [ ] **Run Diagnostics**
  - [ ] Run `node render-monitor.js your-render-url`
  - [ ] Check system status at `/system-check` endpoint
  - [ ] Test Coqui at `/debug-coqui` endpoint

## Troubleshooting

If deployment fails or voices aren't working:

1. **Check Build Logs**
   - Look for errors during model downloads
   - Verify system dependencies installed correctly

2. **Check Application Logs**
   - Examine server startup logs
   - Look for errors in voice generation

3. **Test Fallback Mechanism**
   - Verify Google TTS works even if Coqui fails

4. **Common Issues**
   - Memory limits on free plan (model downloads may fail)
   - Missing system dependencies
   - Timeout during build (models take time to download)

## Optimization

- [ ] **Performance**
  - [ ] Consider using Render disk for persistent storage
  - [ ] Upgrade plan if needed for better performance
  - [ ] Enable auto-scaling if traffic increases

- [ ] **Monitoring**
  - [ ] Set up status alerts
  - [ ] Monitor memory usage
  - [ ] Track API usage 