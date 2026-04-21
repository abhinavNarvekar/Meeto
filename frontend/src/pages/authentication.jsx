import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import Avatar from "@mui/material/Avatar";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CssBaseline from "@mui/material/CssBaseline";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Snackbar from "@mui/material/Snackbar";
import TextField from "@mui/material/TextField";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import * as React from "react";
import { AuthContext } from "../contexts/AuthContext";
const theme = createTheme();

export default function Authentication() {
  const [username, setUsername] = React.useState();
  const [password, setPassword] = React.useState();
  const [name, setName] = React.useState();
  const [error, setError] = React.useState();
  const [message, setMessage] = React.useState();
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
      // setError(err.response.data.message);
      let message = err.response.data.message;
      setError(message);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Grid container component="main" sx={{ minHeight: "100vh" }}>
        {/* Left panel — hero image, hidden on mobile */}
        {/* Left panel — hero image, hidden on mobile */}
        <Grid item xs={false} sm={6} md={6}>
          <Box
            sx={{
              width: "100%",
              height: "100%",
              minHeight: "100vh",
              overflow: "hidden",
              display: { xs: "none", sm: "block" },
            }}
          >
            <img
              src="/scenery.jpg"
              alt="Scenic background"
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          </Box>
        </Grid>

        {/* Right panel — sign-in form */}
        <Grid item xs={12} sm={6} md={6} component={Paper} elevation={6} square>
          <Box
            sx={{
              my: { xs: 4, sm: 8 },
              mx: { xs: 2, sm: 4 },
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
            }}
          >
            <Avatar sx={{ m: 1, bgcolor: "secondary.main" }}>
              <LockOutlinedIcon />
            </Avatar>
            <div>
              <Button
                variant={formState === 0 ? "contained" : ""}
                onClick={() => setFormState(0)}
              >
                Sign In
              </Button>

              <Button
                variant={formState === 1 ? "contained" : ""}
                onClick={() => setFormState(1)}
              >
                Sign Up
              </Button>
            </div>

            <Box component="form" noValidate sx={{ mt: 1, width: "100%" }}>
              {/* <p>{name}</p> */}
              {formState === 1 ? (
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="name"
                  label="Full Name"
                  name="name"
                  value={name}
                  autoFocus
                  inputProps={{ "aria-label": "Fullname" }}
                  onChange={(e) => setName(e.target.value)}
                />
              ) : null}

              <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label="Username"
                name="username"
                value={username}
                autoFocus
                inputProps={{ "aria-label": "Username" }}
                onChange={(e) => setUsername(e.target.value)}
              />

              <TextField
                margin="normal"
                required
                fullWidth
                id="password"
                label="Password"
                name="password"
                type="password"
                value={password}
                inputProps={{ "aria-label": "Password" }}
                onChange={(e) => setPassword(e.target.value)}
              />

              <p style={{ color: "red" }}>{error}</p>

              <Button
                type="button"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                onClick={handleAuth}
              >
                {formState === 0 ? "Log In" : "Register"}
              </Button>
            </Box>
          </Box>
        </Grid>
      </Grid>

      <Snackbar
        open={open}
        autoHideDuration={4000}
        message={message}
      ></Snackbar>
    </ThemeProvider>
  );
}
