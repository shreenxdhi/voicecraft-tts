# Render Deployment Checklist

Follow these steps to ensure Coqui TTS works correctly when deployed to Render.

## Pre-Deployment

1. **Verify your `render.yaml` file:**
   - Contains all necessary dependencies (ffmpeg, python, espeak, libsndfile1)
   - Has the correct build commands to install TTS and download models
   - Uses the `npm run start-render` command which sets the `RENDER=true` environment variable

2. **Configure environment variables:**
   - Set `RENDER=true` in render.yaml
   - Set `VIRTUAL_ENV=/opt/render/project` for Coqui TTS to find its models

3. **Check package.json:**
   - Has the `start-render` script that sets the necessary environment variables

## Deployment Process

1. **Connect your GitHub repository to Render**
   - Create a new Web Service
   - Select your repository
   - Render will automatically detect the `render.yaml` file

2. **During initial build:**
   - Monitor the build logs to ensure all steps complete successfully
   - Pay special attention to the model download steps
   - Verify that espeak and other dependencies are correctly installed

3. **Check logs after deployment:**
   - Confirm that Coqui TTS is detected by the application
   - Verify models are found in the correct locations

## Troubleshooting

If Coqui TTS is not working after deployment:

1. **Check for missing dependencies:**
   ```bash
   heroku run bash
   which espeak
   which ffmpeg
   ls -la .models
   ```

2. **Verify Python and TTS installation:**
   ```bash
   python3 --version
   python3 -m pip list | grep TTS
   ```

3. **Test TTS directly:**
   ```bash
   python3 -m TTS.bin.list_models
   python3 -m TTS.bin.tts --text "Test" --model_name tts_models/en/ljspeech/glow-tts --out_path test.wav
   ```

4. **Rebuild the deployment:**
   - Sometimes a clean rebuild can resolve caching or incomplete download issues

5. **Increase storage size:**
   - If you're using many models, you may need a larger storage plan on Render

## Common Errors

1. **"Espeak not found" error:**
   - Make sure `espeak` is installed in the build command
   - Try installing espeak-ng as an alternative

2. **"Model not found" error:**
   - Check if the model was downloaded during build
   - Add specific model download commands to the build process

3. **"Command not found" error:**
   - Verify the Python and TTS installation paths
   - Check if the command is being run with the correct Python interpreter

4. **Memory errors during synthesis:**
   - Adjust your Render instance to a larger memory tier
   - Consider optimizing the code to use less memory during synthesis

## Testing After Deployment

1. Test with Google TTS voices first to ensure basic functionality
2. Try each available Coqui voice and check for specific errors
3. Monitor CPU and memory usage during Coqui TTS requests

Remember that the application will automatically fall back to Google TTS if there are issues with Coqui, so your service will remain functional even if some advanced voice options are temporarily unavailable. 