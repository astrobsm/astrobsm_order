# Production Deployment Script for Windows
# This script handles the complete deployment process including migrations

param(
    [string]$AppDir = "C:\inetpub\wwwroot\astrobsm_order",
    [string]$ServiceName = "astrobsm-order",
    [string]$Branch = "production-ready"
)

# Configuration
$ErrorActionPreference = "Stop"
$RepoUrl = "https://github.com/astrobsm/astrobsm_order.git"

# Functions
function Write-Info {
    param([string]$Message)
    Write-Host "ℹ️  $Message" -ForegroundColor Blue
}

function Write-Success {
    param([string]$Message)
    Write-Host "✅ $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "⚠️  $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "❌ $Message" -ForegroundColor Red
}

Write-Host "🚀 Starting Production Deployment" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan

try {
    # Step 1: Update code from repository
    Write-Info "Updating code from repository..."
    Set-Location $AppDir

    # Backup current version
    if (Test-Path "backup") {
        Remove-Item -Recurse -Force backup
    }
    Copy-Item -Recurse -Path . -Destination backup -Exclude @("backup", ".git")

    # Pull latest changes
    git fetch origin
    git reset --hard "origin/$Branch"
    Write-Success "Code updated successfully"

    # Step 2: Install/update dependencies
    Write-Info "Installing dependencies..."
    npm ci --production
    Write-Success "Dependencies installed"

    # Step 3: Run database migrations
    Write-Info "Running database migrations..."
    $env:NODE_ENV = "production"
    $migrationResult = & node deploy-migration.js
    
    if ($LASTEXITCODE -eq 0) {
        Write-Success "Database migrations completed"
    } else {
        Write-Error "Database migrations failed"
        throw "Migration failed with exit code $LASTEXITCODE"
    }

    # Step 4: Run health checks
    Write-Info "Running pre-deployment health checks..."

    # Check if required files exist
    $requiredFiles = @(
        "server\app.js",
        "server\database\db.js",
        "deploy-migration.js"
    )

    foreach ($file in $requiredFiles) {
        if (-not (Test-Path $file)) {
            Write-Error "Required file missing: $file"
            throw "Missing required file: $file"
        }
    }

    # Check if database connection works
    $dbCheck = & node -e @"
const pool = require('./server/database/db');
pool.query('SELECT 1').then(() => {
    console.log('✅ Database connection OK');
    process.exit(0);
}).catch(err => {
    console.error('❌ Database connection failed:', err.message);
    process.exit(1);
});
"@

    if ($LASTEXITCODE -ne 0) {
        Write-Error "Database health check failed"
        throw "Database connection test failed"
    }

    Write-Success "Health checks passed"

    # Step 5: Restart the application service
    Write-Info "Restarting application service..."

    # Check if running as Windows service or PM2
    $isWindowsService = Get-Service -Name $ServiceName -ErrorAction SilentlyContinue
    $isPM2 = $false
    
    # Check if PM2 is managing the process
    try {
        $pm2List = & pm2 list --silent 2>$null
        if ($pm2List -match $ServiceName) {
            $isPM2 = $true
        }
    } catch {
        # PM2 not available or not managing this app
    }

    if ($isWindowsService) {
        # Windows Service management
        Stop-Service -Name $ServiceName -Force -ErrorAction SilentlyContinue
        Start-Sleep 2
        Start-Service -Name $ServiceName
        Write-Success "Windows service restarted successfully"
    } elseif ($isPM2) {
        # PM2 management
        & pm2 restart $ServiceName
        Write-Success "PM2 service restarted successfully"
    } else {
        # Direct Node.js process management
        Write-Warning "No service manager detected. You may need to manually restart the application."
        Write-Info "To start manually: npm start"
    }

    # Step 6: Final health check
    Write-Info "Running post-deployment health check..."
    Start-Sleep 10

    # Check if application responds
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3000/api/health" -UseBasicParsing -TimeoutSec 10
        if ($response.StatusCode -eq 200) {
            Write-Success "Application is responding correctly"
        } else {
            Write-Warning "Unexpected response code: $($response.StatusCode)"
        }
    } catch {
        Write-Warning "Health endpoint not available, checking basic connectivity..."
        # Try basic port check
        $portTest = Test-NetConnection -ComputerName "localhost" -Port 3000 -WarningAction SilentlyContinue
        if ($portTest.TcpTestSucceeded) {
            Write-Success "Application is running on port 3000"
        } else {
            Write-Error "Application is not responding"
            throw "Application health check failed"
        }
    }

    # Step 7: Clean up
    Write-Info "Cleaning up..."
    if (Test-Path "backup") {
        Remove-Item -Recurse -Force backup
    }
    Write-Success "Cleanup completed"

    Write-Host ""
    Write-Host "🎉 Deployment completed successfully!" -ForegroundColor Green
    Write-Host "====================================" -ForegroundColor Green
    Write-Host "Application Directory: $AppDir" -ForegroundColor Cyan
    Write-Host "Port: 3000" -ForegroundColor Cyan
    Write-Host "Time: $(Get-Date)" -ForegroundColor Cyan
    Write-Host ""
    Write-Info "You can check the application at your domain/IP address"
    
    if ($isWindowsService) {
        Write-Info "View service status: Get-Service $ServiceName"
    } elseif ($isPM2) {
        Write-Info "View PM2 logs: pm2 logs $ServiceName"
    }

} catch {
    Write-Error "Deployment failed: $($_.Exception.Message)"
    
    # Restore backup if it exists
    if (Test-Path "backup") {
        Write-Info "Restoring from backup..."
        Remove-Item -Recurse -Force * -Exclude "backup"
        Move-Item backup\* . -Force
        Remove-Item -Recurse -Force backup
        Write-Success "Backup restored"
    }
    
    exit 1
}
