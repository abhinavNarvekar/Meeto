
Meeto is a full-stack real-time video conferencing application that enables seamless communication through video, audio, and live chat. It is built using modern web technologies with secure authentication, responsive design, and deployed for real-world usage.

🚀 Live Demo

🌐 Live App: https://meetobackend.onrender.com



✨ Features
🔐 User Authentication (Register / Login)
🎥 Real-time video calling using WebRTC
🎤 Mute / Unmute audio
📷 Toggle camera on/off
💬 In-meeting live chat
👥 Multi-user room support
📱 Fully mobile responsive UI
⚡ Fast real-time signaling with Socket.IO
🌐 Deployed on Render



🛠 Tech Stack
Frontend
React.js
Material UI (MUI)
CSS Modules / Responsive Design
Backend
Node.js
Express.js
Socket.IO


Core Technologies
WebRTC (peer-to-peer communication)
REST APIs (Authentication)
Deployment
Render (Full-stack hosting)


ScreenShots:
<img width="1440" height="852" alt="image" src="https://github.com/user-attachments/assets/86b03208-dc98-4006-b0e2-7279f68a412f" />
<img width="1440" height="880" alt="image" src="https://github.com/user-attachments/assets/37bdf230-f102-4ceb-876e-2d240fb85f1e" />
<img width="1440" height="865" alt="image" src="https://github.com/user-attachments/assets/4b900075-7cec-4d86-91dd-2e2d99de374a" />
<img width="1440" height="862" alt="image" src="https://github.com/user-attachments/assets/751f22fe-8bc3-4a93-8c69-03068dde1820" />
<img width="2880" height="1712" alt="image" src="https://github.com/user-attachments/assets/8cc3016f-9c3d-47b4-83c4-5150bad06a0a" />










📁 Project Structure
meeto/
│
├── frontend/          # React frontend
│   ├── components/
│   ├── pages/
│   ├── styles/
│   └── utils/
│
├── backend/           # Node.js backend
│   ├── controllers/
│   ├── routes/
│   ├── socket/
│   └── models/
│
└── README.md
⚙️ Installation & Setup
1. Clone the repository
git clone https://github.com/your-username/meeto.git
cd meeto
2. Setup Backend
cd backend
npm install
npm run dev
3. Setup Frontend
cd frontend
npm install
npm start
🌐 Environment Variables

Create a .env file in the backend:

PORT=5000
MONGO_URI=your_mongodb_connection


🔌 How It Works



Users register/login securely (JWT-based authentication)
Users join a room via unique room ID
Socket.IO connects all participants in the room
WebRTC establishes peer-to-peer media connections
Audio/video streams are exchanged directly between users
Chat messages are synced in real-time
📱 Responsive Design
Optimized for mobile, tablet, and desktop
Adaptive UI for video grid and controls
Touch-friendly controls for mobile users

🚧 Future Improvements
🎥 Meeting recording
🔊 Noise cancellation
📅 Scheduling meetings
🔗 Shareable invite links
🧠 AI-based background blur
🧑‍💻 Author

Abhinav Narvekar
Computer Engineering Student — Goa Engineering College

📜 License

This project is licensed under the MIT License.
