// import logo from './logo.svg';
import { Route, BrowserRouter as Router, Routes } from "react-router-dom";
import "./App.css";
import { AuthProvider } from "./contexts/AuthContext";
import Authentication from "./pages/authentication";
import LandingPage from "./pages/landing";
import VideoMeetComponent from "./pages/VideoMeet";
import History from "./pages/history";
import HomeComponent from "./pages/home";
function App() {
  return (
    <>
      <Router>
        <AuthProvider>
          <Routes>
            {/* <Route path="/home"></Route> */}

            
            <Route path="/" element={<LandingPage />}></Route>
            <Route path="/home" element={<HomeComponent />}></Route>
            <Route path="/auth" element={<Authentication />}></Route>
            <Route path="/:url" element={<VideoMeetComponent />}></Route>
            <Route path="/history" element={<History/>}></Route>
          </Routes>
        </AuthProvider>
      </Router>
    </>
  );
}
export default App;
