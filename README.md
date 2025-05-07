# Quiver ⚡️💬

**Quiver** is the ultimate real‑time chat playground—where bursts of conversation fly fast, and every message **zhiiing**s with personality. Whether you’re doodling with friends, dropping voice notes with crunchy effects, or plotting your next meetup with pin‑drop precision, Quiver has you covered. 🚀

---

## 🚀 Why Quiver?

* **Instant Vibes**: Real‑time messaging powered by **Socket.IO**—no more waiting for replies. ⚡
  
* **Sketch & Share**: Unleash your inner artist with **react‑sketch‑canvas** and **Fabric.js** integration. Draw it, send it, love it. 🎨
  
* **Voice Remix**: Record and play with audio via **Tone.js**—think voice messages with a twist. 🎛️
  
* **Glow & Pop**: Eye‑candy UI animations courtesy of **Framer Motion** and **tsparticles**. Your chat never looked so lit. ✨
  
* **Cloud‑power**: Media uploads (images, sketches) handled by **Cloudinary**—fast, reliable, and scalable. ☁️
  
* **Rock‑solid Backend**: **Firebase** for Auth, Firestore, and Storage—security you can trust. 🔒

---

## 🛠 Tech Stack

| Category               | Technology                                                                                             |
| ---------------------- | ------------------------------------------------------------------------------------------------------ |
| Framework              | React (^18.2.0)                                                                                        |
| Styling & Layout       | Bootstrap (^5.3.5)                                                                                     |
| Real‑Time Messaging    | Socket.IO Client (^4.8.1)                                                                              |
| Backend Services       | Firebase (^11.6.0)                                                                                     |
| Media Storage          | Cloudinary (^2.6.0)                                                                                    |
| Canvas & Sketching     | react‑sketch‑canvas (^6.2.0), Fabric (^5.5.2)                                                          |
| Audio Processing       | Tone.js (^15.0.4)                                                                                      |
| Animations & Particles | Framer Motion (^12.6.5), tsparticles (^3.8.1), tsparticles‑slim (^2.12.0), react‑tsparticles (^2.12.2) |
| Icons & Graphics       | React Icons (^5.5.0), Lucide‑React (^0.503.0)                                                          |
| Routing                | React Router DOM (^7.5.0)                                                                              |
| Autocomplete           | react‑places‑autocomplete (^7.3.0)                                                                     |

---

## 📥 Installation

1. **Clone this arrow**

   ```bash
   git clone git@github.com:mrrafi2/Quiver.git
   cd quiver
   ```
2. **Install dependencies**

   ```bash
   npm install
   # or yarn install
   ```
3. **Env setup**: create a `.env.local` in the root

   ```bash
   # Firebase
   VITE_FIREBASE_API_KEY=YOUR_API_KEY
   VITE_FIREBASE_AUTH_DOMAIN=YOUR_AUTH_DOMAIN
   VITE_FIREBASE_PROJECT_ID=YOUR_PROJECT_ID
   VITE_FIREBASE_STORAGE_BUCKET=YOUR_STORAGE_BUCKET
   VITE_FIREBASE_MESSAGING_SENDER_ID=YOUR_MESSAGING_SENDER_ID
   VITE_FIREBASE_APP_ID=YOUR_APP_ID

   # Cloudinary
   VITE_CLOUDINARY_CLOUD_NAME=YOUR_CLOUD_NAME
   VITE_CLOUDINARY_UPLOAD_PRESET=YOUR_UPLOAD_PRESET
   ```
4. **Fire it up**

   ```bash
   npm run dev
   # or yarn dev
   ```

Open `http://localhost:3000` and let the conversations zzzing. 🎉

---

## 🖥️ Usage Highlights

* **Mood Chats & DMs**: Show and update your mood on chat one‑to‑one.
  
* **Draw Mode**: Hit the 🖌️ icon to open the sketchpad—share your masterpiece.
  
* **Voice Effects**: Press and hold 🎙️ to record, then apply filters—robotize, echo, or glitch. 🔊
  
* **Live Cursor**: See where friends are typing in real‑time.
  

---

## 📦 Deployment

Quiver loves the cloud:

* **Vercel**: Connect your repo, set env vars, then `git push`. 💥
* **Netlify**: Drag‑and‑drop deploy or link GitHub.
* **Firebase Hosting**:

  ```bash
  npm install -g firebase-tools
  firebase login
  firebase init hosting
  firebase deploy
  ```

---

## 🤝 Contributing

1. Fork it 🍴
2. Create a feature branch: `git checkout -b feature/your‑amazing‑idea`
3. Commit with 🔥: \`git commit -m "Add 🔥 feature"
4. Push & PR: `git push origin feature/your‑amazing‑idea`

We’re all about collaboration—shoot your shot! 🎯

---

## 📜 License

MIT © \[Your Name]

---

*“Words fly fast; let Quiver be your quiver.”* 🎯
