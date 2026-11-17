# Setup Guide

## Prerequisites

- Python 3.10+
- Node.js 20+
- PostgreSQL 15+
- Expo Go or a simulator/emulator

## Backend

1. Create and activate a virtual environment.
2. Install dependencies:
   ```bash
   cd backend
   python -m venv .venv
   .venv\Scripts\activate
   pip install -r requirements.txt
   ```
3. Copy the example environment file and update values.
4. Start the Flask app:
   ```bash
   python app.py
   ```

## Mobile

1. Install dependencies:
   ```bash
   cd mobile
   npm install
   ```
2. Copy the example environment file and adjust the API base URL:
   ```bash
   copy .env.example .env
   ```
   Use the correct URL for your target:
   - Browser/web: `http://127.0.0.1:5000`
   - Android emulator: `http://10.0.2.2:5000`
   - Physical phone on the same Wi-Fi: `http://<your-dev-lan-ip>:5000`

   > `127.0.0.1` on a phone points to the phone itself, not your development computer.
3. Start the backend server:
   ```bash
   cd ../backend
   .venv\Scripts\activate
   python app.py
   ```
4. Start Expo:
   ```bash
   cd ../mobile
   npx expo start
   ```
5. For same-Wi-Fi testing:
   - Ensure the backend is reachable from the phone's network.
   - Allow inbound traffic through the backend firewall if prompted.
   - Use your computer's LAN IP in the mobile `.env` file.
   - Android emulator should use `http://10.0.2.2:5000`.
