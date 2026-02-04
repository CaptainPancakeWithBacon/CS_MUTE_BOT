#!/bin/bash

echo ""
echo "CS2 Discord Auto-Muter Setup"
echo "============================"
echo ""

if [ ! -f .env ]; then
    echo "Creating .env file..."
    cp .env.example .env
    echo "Created .env - add your Discord bot token to it"
else
    echo ".env file already exists"
fi

echo ""

if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo "Node.js installed: $NODE_VERSION"

    MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'.' -f1 | tr -d 'v')
    if [ "$MAJOR_VERSION" -lt 16 ]; then
        echo "Warning: Node.js v16.9.0 or higher required"
    fi
else
    echo "Node.js is not installed"
    echo "Install from https://nodejs.org/"
    exit 1
fi

echo ""

if [ -d "node_modules" ]; then
    echo "Dependencies already installed"
else
    echo "Installing dependencies..."
    npm install
    if [ $? -eq 0 ]; then
        echo "Done"
    else
        echo "Failed to install dependencies"
        exit 1
    fi
fi

echo ""
echo "============================"
echo "Setup complete"
echo ""
echo "Next:"
echo "1. Add bot token to .env"
echo "2. Set up ngrok"
echo "3. Update friend-config with ngrok URL"
echo "4. Run start-server.bat and start-ngrok.bat"
echo ""
