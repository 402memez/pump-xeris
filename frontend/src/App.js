import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import CrashGame from "./pages/CrashGame";
import { Toaster } from "./components/ui/sonner";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<CrashGame />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </div>
  );
}

export default App;

