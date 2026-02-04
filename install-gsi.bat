@echo off
echo.
echo CS2 GSI Config Installer
echo ========================
echo.

set "CS2_CFG=%ProgramFiles(x86)%\Steam\steamapps\common\Counter-Strike Global Offensive\game\csgo\cfg"

if not exist "%CS2_CFG%" (
    echo CS2 cfg folder not found at default location.
    echo Looking in other common locations...

    if exist "C:\Program Files (x86)\Steam\steamapps\common\Counter-Strike Global Offensive\game\csgo\cfg" (
        set "CS2_CFG=C:\Program Files (x86)\Steam\steamapps\common\Counter-Strike Global Offensive\game\csgo\cfg"
    ) else if exist "D:\Steam\steamapps\common\Counter-Strike Global Offensive\game\csgo\cfg" (
        set "CS2_CFG=D:\Steam\steamapps\common\Counter-Strike Global Offensive\game\csgo\cfg"
    ) else if exist "D:\SteamLibrary\steamapps\common\Counter-Strike Global Offensive\game\csgo\cfg" (
        set "CS2_CFG=D:\SteamLibrary\steamapps\common\Counter-Strike Global Offensive\game\csgo\cfg"
    ) else if exist "E:\Steam\steamapps\common\Counter-Strike Global Offensive\game\csgo\cfg" (
        set "CS2_CFG=E:\Steam\steamapps\common\Counter-Strike Global Offensive\game\csgo\cfg"
    ) else if exist "E:\SteamLibrary\steamapps\common\Counter-Strike Global Offensive\game\csgo\cfg" (
        set "CS2_CFG=E:\SteamLibrary\steamapps\common\Counter-Strike Global Offensive\game\csgo\cfg"
    ) else (
        echo Could not find CS2 installation.
        echo.
        echo Manually copy "gamestate_integration_discordmuter.cfg" to:
        echo ^<Steam folder^>\steamapps\common\Counter-Strike Global Offensive\game\csgo\cfg\
        echo.
        pause
        exit /b 1
    )
)

echo Found CS2 at: %CS2_CFG%
echo.

copy /Y "gamestate_integration_discordmuter.cfg" "%CS2_CFG%\" >nul 2>&1

if %errorlevel% equ 0 (
    echo Config installed.
    echo.
    echo Next:
    echo 1. Restart CS2 if running
    echo 2. In Discord type: /register YOUR_STEAM_ID
    echo.
) else (
    echo Failed to copy. Try running as Administrator.
    echo.
)

pause
