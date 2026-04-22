import CallEndIcon from "@mui/icons-material/CallEnd";
import ChatIcon from "@mui/icons-material/Chat";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import Badge from "@mui/material/Badge";
import TextField from "@mui/material/TextField";
import React, { useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import io from "socket.io-client";
import server from "../environment";
import styles from "../styles/videoComponent.module.css";

const server_url = server;

const peerConfigConnections = {
  iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
};

export default function VideoMeet() {
  const { url } = useParams();
  const [screen, setScreen] = React.useState(false);
  const videoRef = React.useRef([]);
  const connections = React.useRef({});
  const socketRef = React.useRef();
  const socketIdRef = React.useRef();
  const localVideoRef = React.useRef();

  // ✅ Use a ref for username inside socket callbacks to avoid stale closures
  const usernameRef = useRef("");

  const [messages, setMessages] = React.useState([]);
  const [message, setMessage] = React.useState("");

  let [showModal, setModal] = React.useState(false);
  let [newMessages, setNewMessages] = React.useState(0);

  const [videoAvailable, setVideoAvailable] = React.useState(true);
  const [audioAvailable, setAudioAvailable] = React.useState(true);
  const [videos, setVideos] = React.useState([]);
  const [cameraOn, setCameraOn] = React.useState(true);
  const [audio, setAudio] = React.useState();
  const [askForUsername, setAskForUsername] = React.useState(true);
  const [username, setUsername] = React.useState("");
  const [screenAvailable, setScreenAvailable] = React.useState(true);

  // Keep usernameRef in sync with username state
  useEffect(() => {
    usernameRef.current = username;
  }, [username]);

  let gotMessageFromServer = (fromId, message) => {
    let signal = JSON.parse(message);

    if (fromId !== socketIdRef.current) {
      if (signal.sdp) {
        connections.current[fromId]
          .setRemoteDescription(new RTCSessionDescription(signal.sdp))
          .then(() => {
            if (signal.sdp.type === "offer") {
              connections.current[fromId].createAnswer().then((description) => {
                connections.current[fromId]
                  .setLocalDescription(description)
                  .then(() => {
                    socketRef.current.emit(
                      "signal",
                      fromId,
                      JSON.stringify({
                        sdp: connections.current[fromId].localDescription,
                      }),
                    );
                  });
              });
            }
          })
          .catch(console.log);
      }

      if (signal.ice) {
        connections.current[fromId]
          .addIceCandidate(new RTCIceCandidate(signal.ice))
          .catch(console.log);
      }
    }
  };

  let addMessage = (data, sender, socketIdSender) => {
    setMessages((prevMessages) => [
      ...prevMessages,
      { sender, data, socketIdSender },
    ]);
    if (socketIdSender !== socketIdRef.current) {
      setNewMessages((prev) => prev + 1);
    }
  };

  let connectToSocketServer = () => {
    socketRef.current = io.connect(server_url);

    socketRef.current.on("signal", gotMessageFromServer);

    socketRef.current.on("connect", () => {
      socketIdRef.current = socketRef.current.id;

      socketRef.current.emit("join-call", window.location.href);

      socketRef.current.on("chat-message", addMessage);

      socketRef.current.on("user-left", (id) => {
        setVideos((prevVideos) => prevVideos.filter((v) => v.socketId !== id));
      });

      socketRef.current.on("user-joined", (id, clients) => {
        clients.forEach((socketListId) => {
          if (connections.current[socketListId]) return;

          connections.current[socketListId] = new RTCPeerConnection(
            peerConfigConnections,
          );

          connections.current[socketListId].onicecandidate = (event) => {
            if (event.candidate) {
              socketRef.current.emit(
                "signal",
                socketListId,
                JSON.stringify({ ice: event.candidate }),
              );
            }
          };

          connections.current[socketListId].ontrack = (event) => {
            const remoteStream = event.streams[0];
            if (!remoteStream) return;

            setVideos((prevVideos) => {
              const exists = prevVideos.find(
                (v) => v.socketId === socketListId,
              );
              if (exists) return prevVideos;

              const updated = [
                ...prevVideos,
                {
                  socketId: socketListId,
                  stream: remoteStream,
                  autoPlay: true,
                  playsInline: true,
                },
              ];
              videoRef.current = updated;
              return updated;
            });
          };

          if (window.localStream !== undefined && window.localStream !== null) {
            window.localStream.getTracks().forEach((track) => {
              connections.current[socketListId].addTrack(
                track,
                window.localStream,
              );
            });
          } else {
            let blackSilence = (...args) =>
              new MediaStream([black(...args), silence()]);
            window.localStream = blackSilence();
            window.localStream.getTracks().forEach((track) => {
              connections.current[socketListId].addTrack(
                track,
                window.localStream,
              );
            });
          }
        });

        if (id === socketIdRef.current) {
          for (let id2 in connections.current) {
            if (id2 === socketIdRef.current) continue;

            connections.current[id2].createOffer().then((description) => {
              connections.current[id2]
                .setLocalDescription(description)
                .then(() => {
                  socketRef.current.emit(
                    "signal",
                    id2,
                    JSON.stringify({
                      sdp: connections.current[id2].localDescription,
                    }),
                  );
                });
            });
          }
        }
      });
    });
  };

  const connect = async () => {
    await getPermissions();
    setAskForUsername(false);
    getMedia();
  };

  let getUserMediaSuccess = (stream) => {
    try {
      window.localStream.getTracks().forEach((track) => track.stop());
    } catch (err) {
      console.log(err);
    }

    window.localStream = stream;

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = stream;
    }

    for (let id in connections.current) {
      if (id === socketIdRef.current) continue;

      window.localStream.getTracks().forEach((track) => {
        connections.current[id].addTrack(track, window.localStream);
      });

      connections.current[id].createOffer().then((description) => {
        connections.current[id]
          .setLocalDescription(description)
          .then(() => {
            socketRef.current.emit(
              "signal",
              id,
              JSON.stringify({ sdp: connections.current[id].localDescription }),
            );
          })
          .catch((err) => console.log(err));
      });
    }

    stream.getVideoTracks().forEach((track) => {
      track.onended = () => {
        setScreen(false);

        try {
          let tracks = window.localStream.getTracks();
          tracks.forEach((t) => t.stop());
        } catch (err) {
          console.log(err);
        }

        let blackSilence = (...args) =>
          new MediaStream([black(...args), silence()]);
        window.localStream = blackSilence();
        getUserMedia();
      };
    });
  };

  let handleAudio = () => {
    setAudio((prev) => {
      const newAudio = !prev;
      if (window.localStream) {
        window.localStream.getAudioTracks().forEach((track) => {
          track.enabled = newAudio;
        });
      }
      return newAudio;
    });
  };

  let handleVideo = () => {
    setCameraOn((prev) => {
      const newCameraOn = !prev;
      if (window.localStream) {
        window.localStream.getVideoTracks().forEach((track) => {
          track.enabled = newCameraOn;
        });
      }
      return newCameraOn;
    });
  };

  const getPermissions = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      setVideoAvailable(true);
      setAudioAvailable(true);

      window.localStream = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.log(err);
    }

    for (let id in connections.current) {
      window.localStream.getTracks().forEach((track) => {
        connections.current[id].addTrack(track, window.localStream);
      });

      connections.current[id].createOffer().then((description) => {
        connections.current[id].setLocalDescription(description).then(() => {
          socketRef.current.emit(
            "signal",
            id,
            JSON.stringify({ sdp: connections.current[id].localDescription }),
          );
        });
      });
    }
  };

  let silence = () => {
    let ctx = new AudioContext();
    let oscillator = ctx.createOscillator();
    let dst = oscillator.connect(ctx.createMediaStreamDestination());
    oscillator.start();
    return Object.assign(dst.stream.getAudioTracks()[0], { enabled: false });
  };

  let black = ({ width = 640, height = 480 } = {}) => {
    let canvas = document.createElement("canvas");
    canvas.getContext("2d").fillRect(0, 0, width, height);
    let stream = canvas.captureStream();
    return Object.assign(stream.getVideoTracks()[0], { enabled: false });
  };

  const getMedia = () => {
    setAudio(audioAvailable);
    connectToSocketServer();
  };

  const getUserMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: cameraOn,
        audio,
      });

      window.localStream = stream;

      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      for (let id in connections.current) {
        if (id === socketIdRef.current) continue;

        const senders = connections.current[id].getSenders();
        senders.forEach((sender) => {
          connections.current[id].removeTrack(sender);
        });

        stream.getTracks().forEach((track) => {
          connections.current[id].addTrack(track, stream);
        });

        connections.current[id].createOffer().then((description) => {
          connections.current[id].setLocalDescription(description).then(() => {
            socketRef.current.emit(
              "signal",
              id,
              JSON.stringify({ sdp: connections.current[id].localDescription }),
            );
          });
        });
      }
    } catch (err) {
      console.log(err);
    }
  };

  let getDisplayMediaSuccess = (stream) => {
    try {
      window.localStream.getTracks().forEach((track) => track.stop());
    } catch (err) {
      console.log(err);
    }

    window.localStream = stream;
    localVideoRef.current.srcObject = stream;

    for (let id in connections.current) {
      if (id === socketIdRef.current) continue;

      window.localStream.getTracks().forEach((track) => {
        connections.current[id].addTrack(track, window.localStream);
      });

      connections.current[id].createOffer().then((description) => {
        connections.current[id]
          .setLocalDescription(description)
          .then(() => {
            socketRef.current.emit(
              "signal",
              id,
              JSON.stringify({ sdp: connections.current[id].localDescription }),
            );
          })
          .catch((err) => console.log(err));
      });
    }
  };

  let routeTo = useNavigate();

  let handleEndCall = () => {
    try {
      let tracks = localVideoRef.current.srcObject.getTracks();
      tracks.forEach((track) => track.stop());
    } catch (e) {
      console.log(e);
    }

    routeTo("/home");
  };

  let sendMessage = () => {
    socketRef.current.emit("chat-message", message, usernameRef.current);
    setMessage("");
  };

  let displayMediaOptions = () => {
    if (screen) {
      if (navigator.mediaDevices.getDisplayMedia) {
        navigator.mediaDevices
          .getDisplayMedia({ video: true, audio: true })
          .then((stream) => getDisplayMediaSuccess(stream))
          .catch((err) => console.log(err));
      }
    }
  };

  useEffect(() => {
    if (screen !== undefined) {
      displayMediaOptions();
    }
  }, [screen]);

  let handleScreen = () => {
    setScreen(true);
  };

  return (
    <div>
      {askForUsername ? (
        /* ── LOBBY SCREEN ── */
        <div className={styles.lobbyWrapper}>
          <div className={styles.lobbyCard}>
            {/* Decorative glow orbs */}
            <div className={styles.lobbyGlow1} />
            <div className={styles.lobbyGlow2} />

            <div className={styles.lobbyInner}>
              <div className={styles.lobbyBrand}>
                <div className={styles.lobbyDot} />
                <span className={styles.lobbyBrandText}>NexMeet</span>
              </div>

              <h2 className={styles.lobbyTitle}>Ready to join?</h2>
              <p className={styles.lobbySubtitle}>
                Check your camera and enter your name
              </p>

              {/* Live preview */}
              <div className={styles.lobbyVideoWrap}>
                <video
                  ref={localVideoRef}
                  autoPlay
                  muted
                  className={styles.lobbyVideo}
                />
                <div className={styles.lobbyVideoLabel}>
                  <span className={styles.liveIndicator} /> Preview
                </div>
              </div>

              {/* Username input */}
              <div className={styles.lobbyInputWrap}>
                <TextField
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  onKeyPress={(e) =>
                    e.key === "Enter" && username.trim() && connect()
                  }
                  label="Your name"
                  variant="outlined"
                  fullWidth
                  InputProps={{
                    style: { color: "#e2e8f0", borderRadius: "12px" },
                  }}
                  InputLabelProps={{ style: { color: "#94a3b8" } }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": { borderColor: "rgba(99,102,241,0.4)" },
                      "&:hover fieldset": {
                        borderColor: "rgba(99,102,241,0.7)",
                      },
                      "&.Mui-focused fieldset": { borderColor: "#6366f1" },
                      backgroundColor: "rgba(15,23,42,0.6)",
                      borderRadius: "12px",
                    },
                  }}
                />
              </div>

              <button
                className={styles.lobbyJoinBtn}
                onClick={connect}
                disabled={!username.trim()}
              >
                <span>Join Meeting</span>
                <svg
                  width="20"
                  height="20"
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
          </div>
        </div>
      ) : (
        /* ── MAIN CONFERENCE SCREEN ── */
        <div className={styles.meetVideoContainer}>
          {/* Chat slide-in panel */}
          <div
            className={`${styles.chatRoom} ${showModal ? styles.chatRoomOpen : ""}`}
          >
            <div className={styles.chatContainer}>
              <div className={styles.chatHeader}>
                <h1 className={styles.chatTitle}>In-call messages</h1>
                <button
                  className={styles.chatClose}
                  onClick={() => {
                    setModal(false);
                    setNewMessages(0);
                  }}
                >
                  ✕
                </button>
              </div>

              <div className={styles.chattingDisplay}>
                {messages.length > 0 ? (
                  messages.map((item, index) => {
                    const isMe = item.socketIdSender === socketIdRef.current;
                    return (
                      <div
                        key={index}
                        className={`${styles.messageBubbleWrap} ${isMe ? styles.messageBubbleWrapMe : styles.messageBubbleWrapOther}`}
                      >
                        {!isMe && (
                          <span className={styles.messageSender}>
                            {item.sender || "Unknown"}
                          </span>
                        )}
                        <div
                          className={`${styles.messageBubble} ${isMe ? styles.messageBubbleMe : styles.messageBubbleOther}`}
                        >
                          {item.data}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className={styles.noMessages}>
                    <ChatIcon
                      style={{
                        fontSize: 40,
                        color: "#334155",
                        marginBottom: 8,
                      }}
                    />
                    <p>No messages yet</p>
                  </div>
                )}
              </div>

              <div className={styles.chattingArea}>
                <TextField
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                  placeholder="Send a message…"
                  variant="outlined"
                  size="small"
                  fullWidth
                  InputProps={{
                    style: {
                      color: "#e2e8f0",
                      borderRadius: "10px",
                      fontSize: "0.9rem",
                    },
                  }}
                  sx={{
                    "& .MuiOutlinedInput-root": {
                      "& fieldset": { borderColor: "rgba(99,102,241,0.3)" },
                      "&:hover fieldset": {
                        borderColor: "rgba(99,102,241,0.6)",
                      },
                      "&.Mui-focused fieldset": { borderColor: "#6366f1" },
                      backgroundColor: "rgba(15,23,42,0.8)",
                      borderRadius: "10px",
                    },
                  }}
                />
                <button className={styles.sendBtn} onClick={sendMessage}>
                  Send
                </button>
              </div>
            </div>
          </div>

          {/* Video grid */}
          <div className={styles.conferenceView}>
            {videos.map((v) => (
              <div key={v.socketId} className={styles.remoteVideoTile}>
                <video
                  data-socket={v.socketId}
                  ref={(ref) => {
                    if (ref && v.stream) {
                      ref.srcObject = v.stream;
                    }
                  }}
                  autoPlay
                  playsInline
                  className={styles.remoteVideo}
                />
                <div className={styles.videoTileLabel}>
                  <span className={styles.videoTileIcon}>👤</span>
                  <span>Participant</span>
                </div>
              </div>
            ))}
          </div>

          {/* Local self-view (floating, bottom-right) */}
          <div className={styles.selfViewContainer}>
            <video
              ref={localVideoRef}
              className={styles.meetUserVideo}
              autoPlay
              playsInline
              muted
            />
            <div className={styles.selfViewLabel}>You</div>
          </div>

          {/* Control bar */}
          <div className={styles.buttonContainer}>
            <div className={styles.controlBar}>
              <div className={styles.controlGroup}>
                <button
                  className={`${styles.ctrlBtn} ${!cameraOn ? styles.ctrlBtnOff : ""}`}
                  onClick={handleVideo}
                  title={cameraOn ? "Turn off camera" : "Turn on camera"}
                >
                  {cameraOn ? <VideocamIcon /> : <VideocamOffIcon />}
                  <span>{cameraOn ? "Camera" : "No cam"}</span>
                </button>

                <button
                  className={`${styles.ctrlBtn} ${!audio ? styles.ctrlBtnOff : ""}`}
                  onClick={handleAudio}
                  title={audio ? "Mute" : "Unmute"}
                >
                  {audio ? <MicIcon /> : <MicOffIcon />}
                  <span>{audio ? "Mic" : "Muted"}</span>
                </button>
              </div>

              <button
                className={styles.ctrlBtnEnd}
                onClick={handleEndCall}
                title="Leave meeting"
              >
                <CallEndIcon />
              </button>

              <div className={styles.controlGroup}>
                {screenAvailable && (
                  <button
                    className={styles.ctrlBtn}
                    onClick={handleScreen}
                    title="Share screen"
                  >
                    <ScreenShareIcon />
                    <span>Share</span>
                  </button>
                )}

                <button
                  className={`${styles.ctrlBtn} ${showModal ? styles.ctrlBtnActive : ""}`}
                  onClick={() => {
                    setModal(!showModal);
                    setNewMessages(0);
                  }}
                  title="Chat"
                >
                  <Badge badgeContent={newMessages} max={999} color="error">
                    <ChatIcon />
                  </Badge>
                  <span>Chat</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
