@echo off
title CS2 Death Muter - Ngrok
echo.
echo CS2 Death Muter - Ngrok Tunnel
echo ==============================
echo.
echo Starting tunnel to port 3000...
echo.
echo Look for the "Forwarding" line after ngrok starts.
echo Share that URL with friends.
echo.
ngrok http 3000
pause
