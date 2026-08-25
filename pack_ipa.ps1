Add-Type -AssemblyName System.IO.Compression.FileSystem

$stageDir = "ipa_staging"
if (Test-Path $stageDir) { Remove-Item -Recurse -Force $stageDir }
New-Item -ItemType Directory -Path $stageDir | Out-Null

$zipPath = "Dr-Badini-AI-IPA (6).zip"
Write-Host "Extracting base zip..."
[System.IO.Compression.ZipFile]::ExtractToDirectory($zipPath, "$stageDir\outer")

$ipaFile = Get-ChildItem "$stageDir\outer" -Filter "*.ipa" | Select-Object -First 1
Write-Host "Found IPA: $($ipaFile.FullName)"
[System.IO.Compression.ZipFile]::ExtractToDirectory($ipaFile.FullName, "$stageDir\payload_root")

$appDir = Get-ChildItem "$stageDir\payload_root\Payload" -Filter "*.app" | Select-Object -First 1
Write-Host "App bundle: $($appDir.FullName)"

$publicDir = Join-Path $appDir.FullName "public"
if (-not (Test-Path $publicDir)) {
    if (Test-Path (Join-Path $appDir.FullName "index.html")) {
        $publicDir = $appDir.FullName
    } else {
        New-Item -ItemType Directory -Path $publicDir | Out-Null
    }
}

Write-Host "Copying web assets to: $publicDir"
Copy-Item -Path "dist\*" -Destination $publicDir -Recurse -Force
Write-Host "Assets copied!"

$finalIpa = Join-Path (Get-Location) "Dr-Smart-Latest.ipa"
if (Test-Path $finalIpa) { Remove-Item -Force $finalIpa }
[System.IO.Compression.ZipFile]::CreateFromDirectory("$stageDir\payload_root", $finalIpa)

$finalZip = Join-Path (Get-Location) "Dr-Smart-Latest-IPA.zip"
if (Test-Path $finalZip) { Remove-Item -Force $finalZip }
$tempStage = "$stageDir\final_zip"
New-Item -ItemType Directory -Path $tempStage | Out-Null
Copy-Item -Path $finalIpa -Destination $tempStage
[System.IO.Compression.ZipFile]::CreateFromDirectory($tempStage, $finalZip)

Remove-Item -Recurse -Force $stageDir
Write-Host ""
Write-Host "SUCCESS!"
Get-Item $finalIpa, $finalZip | Select-Object Name, @{n='MB';e={[math]::Round($_.Length/1MB,1)}}, LastWriteTime
