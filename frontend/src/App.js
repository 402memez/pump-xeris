import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import RocketGamePage from "./pages/RocketGamePage";
import { Toaster } from "./components/ui/sonner";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<RocketGamePage />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </div>
  );
}

export default App;

