import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Box from "@mui/material/Box";
import CssBaseline from "@mui/material/CssBaseline";
import Snackbar from "@mui/material/Snackbar";
import TextField from "@mui/material/TextField";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import * as React from "react";
import { AuthContext } from "../contexts/AuthContext";
import "../styles/AuthComponent.css";
const theme = createTheme();

export default function Authentication() {
  const [username, setUsername] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [name, setName] = React.useState("");
  const [error, setError] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [formState, setFormState] = React.useState(0);
  const [open, setOpen] = React.useState(false);

  const { handleRegister, handleLogin } = React.useContext(AuthContext);

  let handleAuth = async () => {
    try {
      if (formState === 0) {
        const result = await handleLogin(username, password);
        setMessage(result);
      }
      if (formState === 1) {
        const result = await handleRegister(username, password, name);
        setMessage(result);
        setOpen(true);
        setError("");
        setUsername("");
        setFormState(0);
        setPassword("");
      }
    } catch (err) {
      let message = err.response.data.message;
      setError(message);
    }
  };

  const inputSx = {
    "& .MuiOutlinedInput-root": {
      "& fieldset": { borderColor: "rgba(99,102,241,0.25)" },
      "&:hover fieldset": { borderColor: "rgba(99,102,241,0.55)" },
      "&.Mui-focused fieldset": { borderColor: "#6366f1" },
      backgroundColor: "rgba(15,23,42,0.6)",
      borderRadius: "12px",
      color: "#e2e8f0",
    },
    "& .MuiInputLabel-root": { color: "#64748b" },
    "& .MuiInputLabel-root.Mui-focused": { color: "#818cf8" },
    "& .MuiOutlinedInput-input": { color: "#e2e8f0" },
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />

      <div className="authWrapper">
        {/* Background orbs */}
        <div className="authOrb authOrb1" />
        <div className="authOrb authOrb2" />
        <div className="authOrb authOrb3" />

        {/* CENTERED CONTAINER */}
        <div className="authCenterContainer">
          {/* Optional left content (hidden on mobile automatically) */}
          <div className="authLeftContent">
            <h1>
              Connect with anyone,
              <br />
              <span>instantly.</span>
            </h1>
            <p>HD video calls. Zero friction. Built for real conversations.</p>
          </div>

          {/* FORM CARD */}
          <div className="authCard">
            <div className="authCardGlow" />

            <div className="authCardInner">
              <div className="authIconWrap">
                <LockOutlinedIcon
                  style={{ fontSize: "1.3rem", color: "#818cf8" }}
                />
              </div>

              {/* Tabs */}
              <div className="authTabs">
                <button
                  type="button"
                  className={`authTab ${formState === 0 ? "authTabActive" : ""}`}
                  onClick={() => setFormState(0)}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  className={`authTab ${formState === 1 ? "authTabActive" : ""}`}
                  onClick={() => setFormState(1)}
                >
                  Sign Up
                </button>
                <div
                  className="authTabSlider"
                  style={{
                    transform:
                      formState === 0 ? "translateX(0)" : "translateX(100%)",
                  }}
                />
              </div>

              <h2 className="authFormTitle">
                {formState === 0 ? "Welcome back" : "Create account"}
              </h2>

              <Box
                component="form"
                noValidate
                sx={{
                  width: "100%",
                  display: "flex",
                  flexDirection: "column",
                  gap: "14px",
                }}
              >
                {formState === 1 && (
                  <TextField
                    fullWidth
                    label="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    sx={inputSx}
                  />
                )}

                <TextField
                  fullWidth
                  label="Username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  sx={inputSx}
                />

                <TextField
                  fullWidth
                  type="password"
                  label="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  sx={inputSx}
                />

                {error && <div className="authError">{error}</div>}

                <button
                  className="authSubmitBtn"
                  type="button"
                  onClick={handleAuth}
                >
                  {formState === 0 ? "Sign In" : "Create Account"}
                </button>
              </Box>
            </div>
          </div>
        </div>

        <Snackbar open={open} autoHideDuration={4000} message={message} />
      </div>
    </ThemeProvider>
  );
}
