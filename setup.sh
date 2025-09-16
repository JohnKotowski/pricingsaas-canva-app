#!/bin/bash

# Canva App Local Development Setup Script
# Run this script to set up everything needed to run the app locally

set -e  # Exit on any error

echo "🚀 Setting up Canva App Local Development Environment..."
echo ""

# Check if running on macOS
if [[ "$OSTYPE" != "darwin"* ]]; then
    echo "❌ This script is designed for macOS only"
    exit 1
fi

# Install Homebrew if not present
if ! command -v brew &> /dev/null; then
    echo "📦 Installing Homebrew..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
    
    # Add Homebrew to PATH for Apple Silicon Macs
    if [[ $(uname -m) == "arm64" ]]; then
        echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
        eval "$(/opt/homebrew/bin/brew shellenv)"
    fi
else
    echo "✅ Homebrew already installed"
fi

# Install Git if not present
if ! command -v git &> /dev/null; then
    echo "📝 Installing Git..."
    brew install git
else
    echo "✅ Git already installed"
fi

# Install Node.js via nvm if not present
if ! command -v node &> /dev/null; then
    echo "🟢 Installing Node.js..."
    
    # Install nvm
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.5/install.sh | bash
    
    # Source nvm
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    [ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"
    
    # Install and use Node version from .nvmrc if present, otherwise latest LTS
    if [ -f ".nvmrc" ]; then
        nvm install
        nvm use
    else
        nvm install --lts
        nvm use --lts
    fi
else
    echo "✅ Node.js already installed ($(node --version))"
fi

# Install Supabase CLI
if ! command -v supabase &> /dev/null; then
    echo "🗄️ Installing Supabase CLI..."
    brew install supabase/tap/supabase
else
    echo "✅ Supabase CLI already installed"
fi

# Install Canva CLI
if ! command -v canva &> /dev/null; then
    echo "🎨 Installing Canva CLI..."
    npm install -g @canva/cli@latest
else
    echo "✅ Canva CLI already installed"
fi

# Check if we're in a git repo and pull latest changes
if [ ! -f "package.json" ]; then
    echo "📂 Please run this script from the project directory"
    echo "   First clone the repo: git clone https://github.com/JohnKotowski/pricingsaas-canva-app.git"
    echo "   Then cd into it and run this script"
    exit 1
fi

# Pull latest changes if we're in a git repository
if [ -d ".git" ]; then
    echo "🔄 Pulling latest changes from repository..."
    if git pull origin main 2>/dev/null; then
        echo "✅ Repository updated successfully"
    else
        echo "⚠️ Could not pull latest changes (may need to commit or stash local changes)"
        echo "   Your local changes:"
        git status --porcelain 2>/dev/null || true
        echo ""
        echo "Press Enter to continue with current version..."
        read -r
    fi
else
    echo "⚠️ Not a git repository - using current files"
fi

# Install npm dependencies only if node_modules doesn't exist or package.json is newer
if [ ! -d "node_modules" ] || [ "package.json" -nt "node_modules" ]; then
    echo "📦 Installing npm dependencies..."
    npm install
else
    echo "✅ npm dependencies already installed"
fi

# Create .env file from template if it doesn't exist
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo "⚙️ Creating .env file from template..."
        cp .env.example .env
        echo "📝 Please edit .env file with your actual values"
    else
        echo "⚠️ No .env.example found. Please create .env manually"
    fi
else
    echo "✅ .env file already exists"
fi

echo ""
echo "🎉 Setup complete!"
echo ""

# Check if Canva app exists and user has access
echo "🎨 Checking Canva app configuration..."

# Login check
if ! canva login --check &> /dev/null; then
    echo "⚠️ Canva CLI not logged in. Please login:"
    echo "   Run: canva login"
    echo "   Then grant access to your Canva account"
    echo ""
    echo "Press Enter after you've logged in..."
    read -r
fi

# Check if app exists by trying to list apps
if canva apps list &> /dev/null; then
    # Get the app ID from .env
    app_id=$(grep "CANVA_APP_ID=" .env | cut -d'=' -f2)
    
    # Check if our specific app exists
    if canva apps list | grep -q "$app_id" 2>/dev/null; then
        echo "✅ Canva app ($app_id) found and accessible"
    else
        echo "⚠️ Canva app ($app_id) not found in your account"
        echo "   This could mean:"
        echo "   1. You need to create a new app in Canva Developer Portal"
        echo "   2. You don't have access to this app"
        echo "   3. App ID in .env is incorrect"
        echo ""
        echo "   Visit: https://www.canva.com/developers/apps"
        echo "   Or create a new app with: canva apps create \"My App\""
        echo ""
        echo "Press Enter to continue anyway..."
        read -r
    fi
else
    echo "⚠️ Could not check Canva apps (login may be required)"
    echo "   You may need to:"
    echo "   1. Run: canva login"
    echo "   2. Create an app at: https://www.canva.com/developers/apps"
    echo ""
    echo "Press Enter to continue..."
    read -r
fi

echo "✅ Environment configuration ready"

# Function to kill process on port
kill_port() {
    local port=$1
    local pid=$(lsof -ti:$port 2>/dev/null)
    if [ -n "$pid" ]; then
        echo "🔄 Port $port is occupied (PID: $pid). Killing existing process..."
        kill -9 $pid 2>/dev/null || true
        sleep 1
    fi
}

# Function to start server with port fallback
start_server() {
    local port=8080
    local max_attempts=5
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        echo "🚀 Starting development server on port $port..."
        
        # Kill any existing process on the port
        kill_port $port
        
        # Try to start the server
        if [ $port -eq 8080 ]; then
            # Use default npm start for port 8080
            CANVA_FRONTEND_PORT=$port npm start &
        else
            # Use custom port
            CANVA_FRONTEND_PORT=$port npm start -- --port $port &
        fi
        
        local server_pid=$!
        sleep 3
        
        # Check if server started successfully
        if kill -0 $server_pid 2>/dev/null && curl -s http://localhost:$port >/dev/null 2>&1; then
            echo "✅ Server started successfully on http://localhost:$port"
            echo "   Press Ctrl+C to stop the server"
            echo ""
            
            # Open browser
            sleep 1 && open http://localhost:$port &
            
            # Wait for the server process
            wait $server_pid
            return 0
        else
            echo "❌ Failed to start on port $port"
            kill $server_pid 2>/dev/null || true
            port=$((port + 1))
            attempt=$((attempt + 1))
        fi
    done
    
    echo "❌ Could not start server after $max_attempts attempts"
    echo "   Please check if ports 8080-$((8080 + max_attempts - 1)) are available"
    return 1
}

# Start the development server
echo "🚀 Starting development server..."
echo "   Will open in your browser automatically..."
echo ""

start_server