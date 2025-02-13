# Quizify - Secure Online Quiz Platform 🎯

**Quizify** is an interactive and secure online quiz platform designed to minimize cheating and enhance the online assessment experience. It uses real-time event tracking and a smooth, responsive UI to provide a seamless test-taking environment.

**Quizify Backend Repo :-** https://github.com/Gaurav-Soni24/quizify-backend

## 🚀 Features

- 🛑 **Anti-cheating System**: Detects tab switches and flags suspicious activity.
- 📡 **Real-time Quiz Management**: Monitor quiz sessions and track participant activity.
- 🎨 **Interactive & Responsive UI**: Clean and intuitive design for all devices.
- 🔐 **Secure Sessions**: Custom event tracking to prevent unauthorized actions.

## 🛠️ Tech Stack

### Frontend:
- Vanilla JavaScript
- Bootstrap

### Backend:
- Node.js
- Express.js

### Database:
- Firebase Firestore

### Security Measures:
- Custom event tracking using browser APIs.

## 💡 Challenges & Solutions

### **Challenge:** Preventing students from switching tabs during quizzes.
- **Solution:** Implemented browser event listeners to detect tab changes. If a participant switches tabs, the system records the event and may terminate or flag the quiz session.

## ⚙️ Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/Gaurav-Soni24/quizify-backend.git
   ```
2. Navigate to the project directory:
   ```bash
   cd quizify-backend
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Set up Firebase Firestore and configure the environment variables.
5. Start the server:
   ```bash
   npm start
   ```
   
## 🤝 Contributing

Contributions are welcome! If you have ideas for improving Quizify or new anti-cheating mechanisms, feel free to fork the repo and create a pull request.

## 📄 License

This project is licensed under the MIT License.

---

**Crafted with ❤️ by Gaurav Soni.**

Happy Quizzing! 🎯

