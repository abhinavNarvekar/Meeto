import RestoreIcon from "@mui/icons-material/Restore";
import TextField from "@mui/material/TextField";
import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";
import { AuthContext } from "../contexts/AuthContext";
import "../styles/HomeComponent.css";
import withAuth from "../utils/withAuth";
function HomeComponent() {
  let navigate = useNavigate();
  const [meetingCode, setMeetingCode] = useState("");
  const { addToUserHistory } = useContext(AuthContext);

  let handleJoinVideoCall = async () => {
    await addToUserHistory(meetingCode);
    navigate(`/${meetingCode}`);
  };

  return (
    <div className="homeWrapper">
      {/* Ambient background orbs */}
      <div className="homeOrb homeOrb1" />
      <div className="homeOrb homeOrb2" />
      <div className="homeOrb homeOrb3" />

      {/* ── NAVBAR ── */}
      <nav className="navBar">
        <div className="navBrand">
          <div className="navBrandDot" />
          <span className="navBrandName">Meeto</span>
        </div>

        <div className="navActions">
          <button
            className="navHistoryBtn"
            onClick={() => navigate("/history")}
          >
            <RestoreIcon style={{ fontSize: "1.1rem" }} />
            <span>History</span>
          </button>

          <button
            className="navLogoutBtn"
            onClick={() => {
              localStorage.removeItem("token");
              navigate("/auth");
            }}
          >
            Logout
          </button>
        </div>
      </nav>

      {/* ── HERO ── */}
      <main className="meetContainer">
        <div className="leftPanel">
          <div className="heroContent">
            <div className="heroBadge">
              <span className="heroBadgeDot" />
              HD Video · Zero Lag
            </div>

            <h1 className="heroHeading">
              Meet anyone,
              <br />
              <span className="heroHeadingAccent">anywhere.</span>
            </h1>

            <p className="heroSubtext">
              Crystal-clear video calls for teams and individuals. No downloads
              required — just share a code and connect.
            </p>

            <div className="joinRow">
              <div className="joinInputWrap">
                <TextField
                  onChange={(e) => setMeetingCode(e.target.value)}
                  value={meetingCode}
                  label="Meeting code"
                  variant="outlined"
                  onKeyPress={(e) =>
                    e.key === "Enter" &&
                    meetingCode.trim() &&
                    handleJoinVideoCall()
                  }
                  InputProps={{
                    style: { color: "#e2e8f0", borderRadius: "14px" },
                  }}
                  InputLabelProps={{ style: { color: "#64748b" } }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": { borderColor: "rgba(99,102,241,0.3)" },
                      "&:hover fieldset": {
                        borderColor: "rgba(99,102,241,0.6)",
                      },
                      "&.Mui-focused fieldset": { borderColor: "#6366f1" },
                      backgroundColor: "rgba(15,23,42,0.7)",
                      borderRadius: "14px",
                      fontSize: "0.95rem",
                    },
                    minWidth: "220px",
                  }}
                />
              </div>

              <button
                className="joinBtn"
                onClick={handleJoinVideoCall}
                disabled={!meetingCode.trim()}
              >
                Join call
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </button>
            </div>

            <div className="heroStats">
              <div className="heroStat">
                <span className="heroStatNum">256-bit</span>
                <span className="heroStatLabel">Encrypted</span>
              </div>
              <div className="heroStatDivider" />
              <div className="heroStat">
                <span className="heroStatNum">HD</span>
                <span className="heroStatLabel">Video quality</span>
              </div>
              <div className="heroStatDivider" />
              <div className="heroStat">
                <span className="heroStatNum">∞</span>
                <span className="heroStatLabel">Participants</span>
              </div>
            </div>
          </div>
        </div>

        <div className="rightPanel">
          {/* Decorative video-call mockup card */}
          <div className="mockCallCard">
            <div className="mockCallGrid">
              <div className="mockTile mockTileMain">
                <div className="mockAvatar mockAvatarBlue">A</div>
                <div className="mockTileLabel">Alex</div>
              </div>
              <div className="mockTile mockTileSide">
                <div className="mockAvatar mockAvatarPurple">S</div>
                <div className="mockTileLabel">Sam</div>
              </div>
              <div className="mockTile mockTileSide">
                <div className="mockAvatar mockAvatarTeal">M</div>
                <div className="mockTileLabel">Maya</div>
              </div>
              <div className="mockTile mockTileSide">
                <div className="mockAvatar mockAvatarOrange">J</div>
                <div className="mockTileLabel">Jordan</div>
              </div>
            </div>

            <div className="mockControls">
              <div className="mockBtn mockBtnRed">
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M6.6 10.8c1.4 2.8 3.8 5.1 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.1.4 2.3.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1-9.4 0-17-7.6-17-17 0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.3 0 .7-.2 1L6.6 10.8z" />
                </svg>
              </div>
              <div className="mockBtn mockBtnGray">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 14c1.7 0 3-1.3 3-3V5c0-1.7-1.3-3-3-3S9 3.3 9 5v6c0 1.7 1.3 3 3 3z" />
                </svg>
              </div>
              <div className="mockBtn mockBtnGray">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" />
                </svg>
              </div>
            </div>

            {/* Floating badge */}
            <div className="mockBadge">
              <span className="mockBadgeDot" />
              Live · 4 participants
            </div>

            {/* Logo image (preserved) */}
            <img src="/logo3.png" alt="NexMeet" className="mockLogoImg" />
          </div>
        </div>
      </main>
    </div>
  );
}

export default withAuth(HomeComponent);
