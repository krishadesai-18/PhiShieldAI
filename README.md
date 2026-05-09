# PhiShield AI

AI-powered phishing email detection and analysis platform built to identify suspicious and malicious emails using intelligent threat analysis.

##Live Demo
[PhiShield AI](https://phi-shield-ai.vercel.app/)

---

#About The Project

PhiShield AI is a modern cybersecurity web application designed to detect phishing and suspicious emails using AI-based analysis techniques.

The platform allows users to:
- Scan email content
- Detect phishing attempts
- Analyze suspicious links and sender patterns
- View confidence scores and threat explanations
- Maintain scan history
- Monitor email threat activity through a clean dashboard

---

#Features

- Google Authentication
- AI-Powered Phishing Detection
- Interactive Dashboard
- Scan History Tracking
- Safe / Suspicious / Phishing Classification
- Threat Confidence Scores
- Modern Dark Theme UI
- Responsive Design
- Persistent Login Sessions
- Delete History Functionality
- Detailed Threat Analysis

---

# Tech Stack

- ## Frontend
- React.js
- Tailwind CSS
- JavaScript

- ## Backend & Services
- Firebase Authentication
- Firebase Firestore
- Google AI Integration

## Deployment
- Vercel

---

# How It Works

1. User signs in using Google Authentication.
2. Email content is submitted for analysis.
3. The AI engine evaluates:
   - Suspicious keywords
   - Sender behavior
   - Malicious links
   - Urgency patterns
   - Domain anomalies
4. The system classifies emails as:
   - Safe
   - Suspicious
   - Phishing
5. Results are stored in scan history.

---

# Threat Classification Logic

| Confidence Score | Classification |
|------------------|---------------|
| 0–39%            | Safe |
| 40–75%           | Suspicious |
| 76–100%          | Phishing |

---

# Authentication Flow

- First-time users sign in with Google.
- Returning users stay logged in automatically.
- Logout securely clears the session.
- Protected routes prevent unauthorized access.

---

# Responsive Design

Optimized for:
- Desktop
- Tablet
- Mobile Devices

---

# Installation

```bash
git clone <your-repository-link>

cd phishield-ai

npm install

npm run dev
