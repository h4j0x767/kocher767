# Local IPA Packager for Dr. Smart
$ErrorActionPreference = "Stop"

Write-Host "1. Locating node/npm..."
$nodePath = "C:\Program Files\nodejs"
if (Test-Path $nodePath) {
    $env:Path = "$nodePath;$env:Path"
}

Write-Host "2. Running Vite build for latest React app..."
npm run build

Write-Host "3. Extracting base IPA container..."
$zipPath = "Dr-Badini-AI-IPA (6).zip"
$stageDir = "ipa_staging"
if (Test-Path $stageDir) { Remove-Item -Recurse -Force $stageDir }
New-Item -ItemType Directory -Path $stageDir | Out-Null

# Extract outer zip
Add-Type -AssemblyName System.IO.Compression.FileSystem
[System.IO.Compression.ZipFile]::ExtractToDirectory($zipPath, "$stageDir/outer")

# Find .ipa inside
$ipaFile = Get-ChildItem "$stageDir/outer" -Filter "*.ipa" | Select-Object -First 1
if (-not $ipaFile) {
    throw "No .ipa file found in zip!"
}

Write-Host "Found IPA: $($ipaFile.FullName). Extracting Payload..."
[System.IO.Compression.ZipFile]::ExtractToDirectory($ipaFile.FullName, "$stageDir/payload_root")

# Locate App.app inside Payload
$appDir = Get-ChildItem "$stageDir/payload_root/Payload" -Filter "*.app" | Select-Object -First 1
if (-not $appDir) {
    throw "No .app bundle found inside Payload!"
}
Write-Host "Found App bundle at: $($appDir.FullName)"

# Look for web assets folder (public or web assets)
$publicDir = Join-Path $appDir.FullName "public"
if (-not (Test-Path $publicDir)) {
    # If no public dir, check where index.html is located
    if (Test-Path (Join-Path $appDir.FullName "index.html")) {
        $publicDir = $appDir.FullName
    } else {
        New-Item -ItemType Directory -Path $publicDir | Out-Null
    }
}

Write-Host "4. Updating web assets with latest build (dist)..."
Copy-Item -Path "dist/*" -Destination $publicDir -Recurse -Force

Write-Host "5. Packaging updated IPA..."
$finalIpaPath = Join-Path (Get-Location) "Dr-Smart-Latest.ipa"
if (Test-Path $finalIpaPath) { Remove-Item -Force $finalIpaPath }

# Zip Payload folder into .ipa
[System.IO.Compression.ZipFile]::CreateFromDirectory("$stageDir/payload_root", $finalIpaPath)

Write-Host "6. Creating final ZIP wrapper: Dr-Smart-Latest-IPA.zip..."
$finalZipPath = Join-Path (Get-Location) "Dr-Smart-Latest-IPA.zip"
if (Test-Path $finalZipPath) { Remove-Item -Force $finalZipPath }

$tempZipStage = "$stageDir/final_zip"
New-Item -ItemType Directory -Path $tempZipStage | Out-Null
Copy-Item -Path $finalIpaPath -Destination $tempZipStage

[System.IO.Compression.ZipFile]::CreateFromDirectory($tempZipStage, $finalZipPath)

# Clean staging
Remove-Item -Recurse -Force $stageDir

Write-Host "SUCCESS! Generated latest IPA:"
Get-Item $finalIpaPath, $finalZipPath | Select-Object Name, Length, LastWriteTime
