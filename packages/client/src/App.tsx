import { useEffect, useState } from "react";
import { Routes, Route, Link } from "react-router-dom";
import { GameList } from "./GameList";
import { SERVER_URL } from "./requests";
import "./App.css";

import io from "socket.io-client";
import { GamePage } from "./GamePage";

const socket = io(SERVER_URL);

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
  const [isConnected, setIsConnected] = useState(socket.connected);
  const [lastPong, setLastPong] = useState<string | null>(null);

  useEffect(() => {
    socket.on("connect", () => {
      setIsConnected(true);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("pong", () => {
      setLastPong(new Date().toISOString());
    });

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("pong");
    };
  }, []);

  const sendPing = () => {
    socket.emit("ping");
  };

  return (
    <>
      <main>
        <h2>Welcome to Go variants!</h2>
        <div>
          <hr />
          <h3>socket.io tests...</h3>
          <p>Connected: {"" + isConnected}</p>
          <p>{`Last pong: ${lastPong || "-"}`}</p>
          <button onClick={sendPing}>Send ping</button>
          <hr />
          <GameList />
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
