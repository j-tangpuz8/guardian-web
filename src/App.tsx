import {Routes, Route} from "react-router-dom";
import Login from "./pages/Login";
import StandBy from "./pages/StandBy";
import MainScreen from "./pages/MainScreen";
import Register from "./pages/Register";
import Calls from "./pages/Calls";

function App() {
  return (
    <main>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/standby" element={<StandBy />} />
        <Route path="/main" element={<MainScreen />} />
        <Route path="/register" element={<Register />} />
        <Route path="/call" element={<Calls />} />
      </Routes>
    </main>
  );
}

export default App;
