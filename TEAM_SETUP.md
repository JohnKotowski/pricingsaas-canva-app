# Team Setup Instructions

## Quick Start (5 minutes)

1. **Clone this repository:**
   ```bash
   git clone [REPO_URL]
   cd pricingsaas-canva-app
   ```

2. **Run the setup script:**
   ```bash
   ./setup.sh
   ```

3. **Configure your environment:**
   - Edit `.env` file with your credentials (see `.env.example`)
   - Ask team lead for Canva App ID and Supabase credentials

4. **Start the app:**
   ```bash
   npm start
   ```

5. **Open in browser:** http://localhost:8080

## What the setup script does

- ✅ Installs Homebrew (if needed)
- ✅ Installs Git (if needed) 
- ✅ Installs Node.js via nvm (if needed)
- ✅ Installs Supabase CLI (if needed)
- ✅ Installs all npm dependencies
- ✅ Creates `.env` file from template

## Requirements

- Mac computer (macOS)
- Internet connection
- About 5 minutes

## Troubleshooting

**Script permission error?**
```bash
chmod +x setup.sh
```

**Node version issues?**
```bash
nvm use
```

**Port already in use?**
```bash
npm start -- --port 8081
```

## Development Commands

```bash
npm start              # Start dev server
npm start --use-https  # Start with HTTPS (Safari)
npm run build          # Build for production
npm run lint           # Check code
npm test              # Run tests
```

## Need Help?

Contact the team lead for:
- Repository URL
- Canva App ID  
- Supabase credentials
- Access to Canva Developer Portal