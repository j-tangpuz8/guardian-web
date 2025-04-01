import { Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { StreamChat } from 'stream-chat';
import { Chat } from 'stream-chat-react';
import config from "./config";
import Login from "./pages/Login";
import StandBy from "./pages/StandBy";
import MainScreen from "./pages/MainScreen";
import Register from "./pages/Register";
import Calls from "./pages/Calls";
import Status from "./pages/Status";

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [client, setClient] = useState<StreamChat | null>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');

    console.log('Auth check:', { storedUser, token, isAuthenticated }); // Debug log

    if (storedUser && token) {
      const chatClient = new StreamChat(config.STREAM_APIKEY);
      const user = JSON.parse(storedUser);
      
      chatClient.connectUser(
        {
          id: user.id,
          name: user.name || "Jolony Tangpuy",
        },
        token
      ).then(() => {
        setClient(chatClient);
        setIsAuthenticated(true);
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }

    return () => {
      if (client) {
        client.disconnectUser();
      }
    };
  }, []);

  console.log('Current auth state:', isAuthenticated);

  if (isLoading) {
    return null; 
  }

  return (
    <main>
      {client ? (
        <Chat client={client}>
          <Routes>
            <Route path="/" element={isAuthenticated ? <Navigate to="/status" /> : <Login />} />
            <Route path="/standby" element={<StandBy />} />
            <Route path="/main" element={isAuthenticated ? <MainScreen /> : <Navigate to="/" />} />
            <Route path="/register" element={<Register />} />
            <Route path="/call" element={isAuthenticated ? <Calls /> : <Navigate to="/" />} />
            <Route path="/status" element={isAuthenticated ? <Status /> : <Navigate to="/" />} />
          </Routes>
        </Chat>
      ) : (
        <Routes>
          <Route path="/" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      )}
    </main>
  );
}

export default App;