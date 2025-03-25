@echo off
cd flask-server
start cmd /k python server.py
cd ..
cd main-react-app
@REM For Manager and Employee React App
start cmd /k npm run dev
start cmd /k npm run dev