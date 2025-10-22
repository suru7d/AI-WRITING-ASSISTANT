import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./components/Home";
import About from "./components/About";
import Editor from "./components/Editor";
import Navbar from "./components/Navbar";
import LoginPage from "./components/Login";
import PrivateRoute from "./components/PrivateRoute";

export default function App() {
  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/about" element={<About />} />
        <Route
          path="/write"
          element={
            <PrivateRoute>
              <Editor />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
