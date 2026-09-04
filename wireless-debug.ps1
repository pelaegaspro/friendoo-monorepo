<#
.SYNOPSIS
    Friendoo Wireless Debugging Utility
.DESCRIPTION
    Enables wireless debugging over Wi-Fi for Android devices:
    - Pair device via Android 11+ Wireless Debugging Pairing Code
    - Connect directly to already-paired wireless endpoint
    - Switch an existing USB-connected phone to wireless (TCP/IP 5555) with 1 click
    - Install latest Friendoo APK wirelessly
#>

[CmdletBinding()]
param(
    [string]$Connect,
    [string]$Pair,
    [string]$Code,
    [switch]$UsbToWifi,
    [switch]$Install,
    [switch]$Status,
    [switch]$DisconnectAll
)

$ApkPath = Join-Path $PSScriptRoot "flutter_app\build\app\outputs\flutter-apk\app-debug.apk"
$HistoryFile = Join-Path $PSScriptRoot ".wireless_adb_history.txt"

function Get-AdbDevices {
    $raw = & adb devices -l
    $lines = $raw | Where-Object { $_ -match "\b(device|offline|unauthorized)\b" -and $_ -notmatch "List of devices" }
    return $lines
}

function Show-Header {
    Clear-Host
    Write-Host "==========================================================" -ForegroundColor Cyan
    Write-Host "         FRIENDOO ANDROID WIRELESS DEBUGGING              " -ForegroundColor White
    Write-Host "==========================================================" -ForegroundColor Cyan
    Write-Host ""
}

function Show-Devices {
    $devices = Get-AdbDevices
    if ($devices) {
        Write-Host "Currently connected devices:" -ForegroundColor Green
        foreach ($d in $devices) {
            Write-Host "  -> $d" -ForegroundColor Yellow
        }
    } else {
        Write-Host "No devices currently connected." -ForegroundColor DarkGray
    }
    Write-Host ""
}

function Do-Install {
    if (-not (Test-Path $ApkPath)) {
        Write-Host "[-] APK not found at: $ApkPath" -ForegroundColor Red
        Write-Host "    Run 'flutter build apk --debug' first." -ForegroundColor Yellow
        return
    }

    $raw = & adb devices | Where-Object { $_ -match "\bdevice\b" -and $_ -notmatch "List of devices" }
    if (-not $raw) {
        Write-Host "[-] No authorized active devices found to install to." -ForegroundColor Red
        return
    }

    foreach ($line in $raw) {
        $devId = ($line -split "\s+")[0].Trim()
        if ($devId) {
            Write-Host "[*] Installing to $devId..." -ForegroundColor Cyan
            & adb -s $devId install -r $ApkPath
            if ($LASTEXITCODE -eq 0) {
                Write-Host "[+] Successfully installed on $devId" -ForegroundColor Green
            } else {
                Write-Host "[-] Installation failed on $devId" -ForegroundColor Red
            }
        }
    }
}

function Do-UsbToWifi {
    Write-Host "[*] Detecting USB device to switch to wireless..." -ForegroundColor Cyan
    $devices = & adb devices | Where-Object { $_ -match "\bdevice\b" -and $_ -notmatch "List of devices" -and $_ -notmatch ":" }
    if (-not $devices) {
        Write-Host "[-] No USB-connected device found. Please connect your phone via USB cable once first, or use option [1] for Wi-Fi pairing code." -ForegroundColor Yellow
        return
    }

    $devId = ($devices[0] -split "\s+")[0].Trim()
    Write-Host "[+] Found USB device: $devId" -ForegroundColor Green

    # Detect Wi-Fi IP address
    $wlan = & adb -s $devId shell ip -f inet addr show wlan0 2>$null
    $ip = $null
    if ($wlan -match "inet\s+(\d+\.\d+\.\d+\.\d+)") {
        $ip = $matches[1]
    }

    if (-not $ip) {
        $ipRoute = & adb -s $devId shell ip route 2>$null
        if ($ipRoute -match "src\s+(\d+\.\d+\.\d+\.\d+)") {
            $ip = $matches[1]
        }
    }

    if (-not $ip) {
        $ip = Read-Host "Could not auto-detect phone Wi-Fi IP. Please enter phone IP (e.g. 192.168.1.45)"
    }

    if (-not $ip) {
        Write-Host "[-] No IP address provided." -ForegroundColor Red
        return
    }

    Write-Host "[*] Setting adb tcpip on port 5555..." -ForegroundColor Cyan
    & adb -s $devId tcpip 5555
    Start-Sleep -Seconds 2

    Write-Host "[*] Connecting to $ip:5555..." -ForegroundColor Cyan
    & adb connect "$ip:5555"

    Start-Sleep -Seconds 1
    Show-Devices
    Write-Host "[+] You can now unplug the USB cable! The phone will remain connected over Wi-Fi." -ForegroundColor Green
    Set-Content -Path $HistoryFile -Value "$ip:5555"
}

function Do-Pair {
    param([string]$pairTarget, [string]$pairCode)

    if (-not $pairTarget) {
        Write-Host ""
        Write-Host "On your Android device:" -ForegroundColor Cyan
        Write-Host "1. Open Settings -> Developer Options -> Wireless debugging (toggle ON)" -ForegroundColor White
        Write-Host "2. Tap 'Pair device with pairing code'" -ForegroundColor White
        Write-Host "3. Note the 'IP address & Port' and 6-digit 'Wi-Fi pairing code'" -ForegroundColor White
        Write-Host ""
        $pairTarget = Read-Host "Enter Pairing IP:Port (e.g. 192.168.1.35:37891)"
    }

    if (-not $pairCode) {
        $pairCode = Read-Host "Enter 6-digit Wi-Fi pairing code"
    }

    if ($pairTarget -and $pairCode) {
        Write-Host "[*] Pairing with $pairTarget using code $pairCode..." -ForegroundColor Cyan
        & adb pair $pairTarget $pairCode

        if ($LASTEXITCODE -eq 0) {
            Write-Host "[+] Pairing succeeded!" -ForegroundColor Green
            Write-Host ""
            Write-Host "Now look at the main 'Wireless debugging' screen (NOT the pairing popup):" -ForegroundColor Cyan
            $connectTarget = Read-Host "Enter Connection IP:Port (e.g. 192.168.1.35:42135)"
            if ($connectTarget) {
                & adb connect $connectTarget
                Set-Content -Path $HistoryFile -Value $connectTarget
            }
        } else {
            Write-Host "[-] Pairing failed. Verify your phone and PC are on the same Wi-Fi network." -ForegroundColor Red
        }
    }
}

function Do-Connect {
    param([string]$target)

    if (-not $target) {
        $defaultTarget = ""
        if (Test-Path $HistoryFile) {
            $defaultTarget = (Get-Content $HistoryFile -ErrorAction SilentlyContinue | Select-Object -First 1).Trim()
        }

        $prompt = "Enter phone IP:Port (shown on Wireless debugging screen)"
        if ($defaultTarget) {
            $prompt += " [Default: $defaultTarget]"
        }
        $entered = Read-Host $prompt
        if (-not $entered -and $defaultTarget) {
            $target = $defaultTarget
        } else {
            $target = $entered
        }
    }

    if ($target) {
        Write-Host "[*] Connecting to $target..." -ForegroundColor Cyan
        & adb connect $target
        Set-Content -Path $HistoryFile -Value $target
        Start-Sleep -Seconds 1
        Show-Devices
    }
}

# CLI Parameter handlers
if ($Connect) {
    Do-Connect $Connect
    exit
}
if ($Pair) {
    Do-Pair $Pair $Code
    exit
}
if ($UsbToWifi) {
    Do-UsbToWifi
    exit
}
if ($Install) {
    Do-Install
    exit
}
if ($Status) {
    Show-Devices
    exit
}
if ($DisconnectAll) {
    & adb disconnect
    Write-Host "[+] Disconnected all wireless endpoints." -ForegroundColor Green
    exit
}

# Interactive Menu
do {
    Show-Header
    Show-Devices

    Write-Host "Select an option:" -ForegroundColor Yellow
    Write-Host " [1] Pair device with pairing code (Android 11+ Wireless Debugging)" -ForegroundColor White
    Write-Host " [2] Connect to already-paired wireless device" -ForegroundColor White
    Write-Host " [3] Switch connected USB phone to Wireless (1-Click, no code needed)" -ForegroundColor White
    Write-Host " [4] Install Friendoo debug APK to connected wireless device(s)" -ForegroundColor White
    Write-Host " [5] Refresh devices list" -ForegroundColor White
    Write-Host " [6] Disconnect all wireless devices" -ForegroundColor White
    Write-Host " [0] Exit" -ForegroundColor Gray
    Write-Host ""
    $choice = Read-Host "Choose [0-6]"

    switch ($choice) {
        "1" {
            Do-Pair
            Write-Host "`nPress Enter to return to menu..."; [void][Console]::ReadLine()
        }
        "2" {
            Do-Connect
            Write-Host "`nPress Enter to return to menu..."; [void][Console]::ReadLine()
        }
        "3" {
            Do-UsbToWifi
            Write-Host "`nPress Enter to return to menu..."; [void][Console]::ReadLine()
        }
        "4" {
            Do-Install
            Write-Host "`nPress Enter to return to menu..."; [void][Console]::ReadLine()
        }
        "5" {
            # Loop will refresh
        }
        "6" {
            & adb disconnect
            Write-Host "[+] Disconnected all." -ForegroundColor Green
            Start-Sleep -Seconds 1
        }
        "0" {
            break
        }
    }
} while ($choice -ne "0")
