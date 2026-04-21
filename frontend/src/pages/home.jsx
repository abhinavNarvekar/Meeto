import RestoreIcon from "@mui/icons-material/Restore";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
import TextField from "@mui/material/TextField";
import { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import "../App.css";
import { AuthContext } from "../contexts/AuthContext";
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
    <>
      <div className="navBar">
        <div style={{ display: "flex", alignItems: "center" }}>
          <h2>Meeto</h2>
        </div>

        <div style={{ display: "flex", alignItems: "center" }}>
          <IconButton onClick={
            ()=>{
              navigate("/history");
            }
          }>
            <RestoreIcon />
          </IconButton>
          <p>History</p>

          <Button
            variant="contained"
            onClick={() => {
              localStorage.removeItem("token");
              navigate("/auth");
            }}
          >
            Logout
          </Button>
        </div>
      </div>

      <div className="meetContainer">
        <div className="leftPanel">
          <div>
            <h2>Providing Quality Video Calls just Like Quality Education</h2>
            <div style={{ display: "flex", gap: "10px" }}>
              <TextField
                onChange={(e) => setMeetingCode(e.target.value)}
                label="Meeting Code"
                id="outlined-basic"
              ></TextField>
              <Button onClick={handleJoinVideoCall} variant="contained">
                Join Video Call
              </Button>
            </div>
          </div>
        </div>
        <div className="rightPanel">
          <img src="/logo3.png" alt="" />
        </div>
      </div>
    </>
  );
}

export default withAuth(HomeComponent);
