# Flowers for the Beloved

> A collection of digital, procedurally generated flowers, hand-coded with love as birthday gifts for beloved friends.

## 🌟 The Story

This project was born from a desire to create something deeply personal and unique for friends on their birthdays. It's a journey into the world of creative coding, driven not just by the pursuit of knowledge, but by the joy of making things for people I care about.

I was learning to code and dabbling in Three.js, and I wanted to create gifts that were more than just store-bought items. I wanted to give something that was a part of my journey, made with love, and represented the unique personality of each friend. Each "digital flower" in this collection is a testament to that idea—a blend of code, art, and friendship.

One of the flowers is for my friend, Prakriti, whose name means "nature" in Sanskrit. This project is a digital garden celebrating her and other friends who bring so much color to my life.

## ✨ Features

*   **Personalized Plant Identities:** Each person has a unique, procedurally generated 3D plant that represents their personality.
*   **Interactive 3D Scenes:** Built with React Three Fiber, the 3D scenes are not static models but are generated from scratch using mathematical functions, creating a truly unique and artistic experience.
*   **Interactive Valentine's Experience:** A special "Heart Bloom" scene that responds to microphone input (blowing) and allows users to leave persistent 3D messages on floating hearts.
*   **Immersive Atmosphere:** Soft background music and a gentle, unfolding animation create a calm and immersive experience.
*   **Heartfelt Messages:** Each plant is accompanied by a personalized birthday message and a set of "fun facts."
*   **Modern Web Experience:** A sleek, responsive, and modern web application built with the latest technologies.

## 🚀 Tech Stack

*   **Frontend:** [React](https://reactjs.org/), [Vite](https://vitejs.dev/)
*   **3D Graphics:** [React Three Fiber](https://docs.pmnd.rs/react-three-fiber/getting-started/introduction), [Three.js](https://threejs.org/)
*   **Styling:** [Tailwind CSS](https://tailwindcss.com/)

## 🌱 Project Structure

The project is structured to be modular and scalable. Here's a high-level overview of the key components:

```
├── public/                # Static assets (images, audio)
├── src/
│   ├── assets/            # React and Vite logos
│   ├── App.jsx            # Main application logic and state machine
│   ├── plantData.jsx      # The "database" mapping names to plant data
│   ├── *.jsx              # Individual, procedurally generated 3D plant scenes (e.g., prakriti.jsx, aarushi.jsx)
│   ├── *.css              # Component-specific styles
│   └── main.jsx           # Application entry point
├── package.json           # Project dependencies and scripts
└── README.md              # This file
```

## 🏃‍♀️ Getting Started

1.  **Clone the repository:**
    ```bash
    git clone <your-repository-url>
    ```
2.  **Navigate to the project directory:**
    ```bash
    cd prakriti
    ```
3.  **Install dependencies:**
    ```bash
    npm install
    ```
4.  **Run the development server:**
    ```bash
    npm run dev
    ```
5.  Open your browser and navigate to `http://localhost:5173` (or the address provided by Vite).

## 💐 Try It Out!

Once the application is running, you can enter one of the following names to see their personalized flower:

*   **prakriti** (Peace Lily)
*   **aarushi** (Gladiolus)
*   **simran** (Pink Carnation)
*   **kaashvi** (Blue Orchid)
*   **mahi** (Sweet Pea)
*   **jaiswal** (Lotus)
*   **valentine** (The Heart Bloom)

You can also enter the name of the flower directly.