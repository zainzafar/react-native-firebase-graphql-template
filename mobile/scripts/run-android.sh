#!/bin/bash

# Source the .env file to load all environment variables
if [ -f .env ]; then
    echo "Loading environment variables from .env file..."
    export $(grep -v '^#' .env | xargs)
    APPID="$ANDROID_APPLICATION_ID"
else
    echo "Warning: .env file not found, using default app ID"
    APPID="com.app"
fi

echo "Using application ID: $APPID"

# Run React Native Android with the detected app ID
react-native run-android --mode debug --appId "$APPID" --verbose
