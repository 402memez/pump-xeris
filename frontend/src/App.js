import "@/App.css";
import { HashRouter, Routes, Route } from "react-router-dom";
import RocketGamePage from "./pages/RocketGamePage";
import { Toaster } from "./components/ui/sonner";

function App() {
  return (
    <div className="App">
      <HashRouter>
        <Routes>
          <Route path="/" element={<RocketGamePage />} />
        </Routes>
      </HashRouter>
      <Toaster />
    </div>
  );
}

export default App;

