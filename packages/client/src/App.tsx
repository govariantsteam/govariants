import { useEffect, useState } from "react";
import { Routes, Route, Link } from "react-router-dom";
import { GameList } from "./GameList";
import "./App.css";

import { GamePage } from "./GamePage";
import { GameCreationForm } from "./GameCreationForm";
import { SocketTest } from "./sockets";

function App() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="about" element={<About />} />
        <Route path="game/:game_id" element={<GamePage />} />
      </Routes>
    </div>
  );
}

function Home() {
  return (
    <>
      <main>
        <h2>Welcome to Go variants!</h2>
        <div>
          <GameCreationForm />
          <hr />
          <GameList />
          <hr />
          <SocketTest />
          <hr />
        </div>
      </main>
      <nav>
        <Link to="/about">About</Link>
      </nav>
    </>
  );
}

function About() {
  return (
    <>
      <main>
        <h2>Who are we?</h2>
        <p>
          <span>Check us out on </span>
          <a href="https://github.com/benjaminpjones/govariants">Github</a>
        </p>
        <p>
          <span>Or post in the </span>
          <a href="https://forums.online-go.com/t/collective-development-of-a-server-for-variants/43682">
            OGS Forums
          </a>
        </p>
      </main>
      <nav>
        <Link to="/">Home</Link>
      </nav>
    </>
  );
}

export default App;
