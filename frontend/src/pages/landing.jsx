import { Link, useNavigate } from "react-router-dom";
import "../App.css";
export default function Landing() {
  const router = useNavigate();
  return (
    <div className="landingPageContainer">
      <nav>
        <div className="navHeader">
          <h2>Meeto</h2>
        </div>
        <div className="navlist">
          <p onClick={() => router("/q23qsc")}>Join as Guest</p>
          <p onClick={() => router("/auth")}>Register</p>
          <p onClick={() => router("/auth")}>Login</p>
        </div>
      </nav>

      <div className="landingMainContainer">
        <div>
          <h1>
            <span style={{ color: "#FF9839" }}>Connect</span> with your Loved
            Ones!
          </h1>
          <p>Cover a distance by Meeto</p>
          <div role="button">
            <Link to={"/auth"}>Get Started</Link>
          </div>
        </div>
        <div>
          <img src="/mobile.png" alt="" />
        </div>
      </div>
    </div>
  );
}
