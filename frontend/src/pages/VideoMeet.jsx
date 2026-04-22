import CallEndIcon from "@mui/icons-material/CallEnd";
import ChatIcon from "@mui/icons-material/Chat";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import StopScreenShareIcon from "@mui/icons-material/StopScreenShare";
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

  // KEY FIX: Two separate refs for lobby vs meeting self-view.
  // The old code used one ref (localVideoRef) for both the lobby <video>
  // and the meeting self-view <video>. When React unmounted the lobby and
  // mounted the meeting view, the ref re-pointed to the new DOM node but
  // srcObject was never re-assigned — so the in-call self-view stayed black.
  const lobbyVideoRef = useRef(null);
  const meetingVideoRef = useRef(null);

  const usernameRef = useRef("");

  const [messages, setMessages] = React.useState([]);
  const [message, setMessage] = React.useState("");

  let [showModal, setModal] = React.useState(false);
  let [newMessages, setNewMessages] = React.useState(0);

  const [videoAvailable, setVideoAvailable] = React.useState(true);
  const [audioAvailable, setAudioAvailable] = React.useState(true);
  const [videos, setVideos] = React.useState([]);
  const [cameraOn, setCameraOn] = React.useState(true);
  const [audio, setAudio] = React.useState(true);
  const [askForUsername, setAskForUsername] = React.useState(true);
  const [username, setUsername] = React.useState("");
  const [screenAvailable, setScreenAvailable] = React.useState(
    !!(navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia),
  );

  useEffect(() => {
    usernameRef.current = username;
  }, [username]);

  // Request camera on mount so lobby preview is live immediately
  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((stream) => {
        setVideoAvailable(true);
        setAudioAvailable(true);
        window.localStream = stream;
        if (lobbyVideoRef.current) {
          lobbyVideoRef.current.srcObject = stream;
        }
      })
      .catch((err) => {
        console.log("Could not get media on mount:", err);
        setVideoAvailable(false);
        setAudioAvailable(false);
      });

    return () => {
      if (window.localStream) {
        window.localStream.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  // When lobby unmounts and meeting mounts, assign the stream to the new ref.
  // This runs after askForUsername flips to false and the meeting DOM renders.
  useEffect(() => {
    if (!askForUsername && meetingVideoRef.current && window.localStream) {
      meetingVideoRef.current.srcObject = window.localStream;
    }
  }, [askForUsername]);

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

          if (window.localStream) {
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
    setAskForUsername(false);
    // The useEffect watching askForUsername handles re-assigning srcObject
    // to meetingVideoRef once the meeting DOM mounts.
    connectToSocketServer();
  };

  // Replace tracks on all peer connections (used for screen share swap)
  const replaceTracksOnPeers = (stream) => {
    for (let id in connections.current) {
      if (id === socketIdRef.current) continue;
      const senders = connections.current[id].getSenders();
      stream.getTracks().forEach((track) => {
        const existingSender = senders.find(
          (s) => s.track && s.track.kind === track.kind,
        );
        if (existingSender) {
          existingSender.replaceTrack(track);
        } else {
          connections.current[id].addTrack(track, stream);
        }
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
          .catch(console.log);
      });
    }
  };

  let getUserMediaSuccess = (stream) => {
    if (window.localStream) {
      window.localStream.getTracks().forEach((track) => track.stop());
    }
    window.localStream = stream;
    if (meetingVideoRef.current) {
      meetingVideoRef.current.srcObject = stream;
    }
    replaceTracksOnPeers(stream);

    stream.getVideoTracks().forEach((track) => {
      track.onended = () => {
        setScreen(false);
        restoreWebcam();
      };
    });
  };

  const restoreWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoAvailable,
        audio: audioAvailable,
      });
      stream.getVideoTracks().forEach((t) => {
        t.enabled = cameraOn;
      });
      stream.getAudioTracks().forEach((t) => {
        t.enabled = audio;
      });
      window.localStream = stream;
      if (meetingVideoRef.current) {
        meetingVideoRef.current.srcObject = stream;
      }
      replaceTracksOnPeers(stream);
    } catch (err) {
      console.log("restoreWebcam error:", err);
    }
  };

  let handleAudio = () => {
    setAudio((prev) => {
      const newAudio = !prev;
      if (window.localStream) {
        window.localStream.getAudioTracks().forEach((t) => {
          t.enabled = newAudio;
        });
      }
      return newAudio;
    });
  };

  let handleVideo = () => {
    setCameraOn((prev) => {
      const newCameraOn = !prev;
      if (window.localStream) {
        window.localStream.getVideoTracks().forEach((t) => {
          t.enabled = newCameraOn;
        });
      }
      return newCameraOn;
    });
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

  let handleScreen = async () => {
    if (screen) {
      setScreen(false);
      await restoreWebcam();
    } else {
      if (!navigator.mediaDevices.getDisplayMedia) return;
      try {
        const stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
        setScreen(true);
        getUserMediaSuccess(stream);
      } catch (err) {
        console.log("Screen share error:", err);
        setScreen(false);
      }
    }
  };

  let routeTo = useNavigate();

  let handleEndCall = () => {
    try {
      if (meetingVideoRef.current && meetingVideoRef.current.srcObject) {
        meetingVideoRef.current.srcObject.getTracks().forEach((t) => t.stop());
      }
    } catch (e) {
      console.log(e);
    }
    if (socketRef.current) socketRef.current.disconnect();
    routeTo("/home");
  };

  let sendMessage = () => {
    if (!message.trim()) return;
    socketRef.current.emit("chat-message", message, usernameRef.current);
    setMessage("");
  };

  return (
    <div>
      {askForUsername ? (
        <div className={styles.lobbyWrapper}>
          <div className={styles.lobbyCard}>
            <div className={styles.lobbyGlow1} />
            <div className={styles.lobbyGlow2} />
            <div className={styles.lobbyInner}>
              <div className={styles.lobbyBrand}>
                <div className={styles.lobbyDot} />
                <span className={styles.lobbyBrandText}>Meeto</span>
              </div>
              <h2 className={styles.lobbyTitle}>Ready to join?</h2>
              <p className={styles.lobbySubtitle}>
                Check your camera and enter your name
              </p>

              <div className={styles.lobbyVideoWrap}>
                {/* Lobby uses lobbyVideoRef — gets stream on mount */}
                <video
                  ref={lobbyVideoRef}
                  autoPlay
                  muted
                  playsInline
                  className={styles.lobbyVideo}
                />
                <div className={styles.lobbyVideoLabel}>
                  <span className={styles.liveIndicator} /> Preview
                </div>
              </div>

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
        <div className={styles.meetVideoContainer}>
          {/* Chat panel */}
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

          {/* Remote video grid */}
          <div className={styles.conferenceView}>
            {videos.map((v) => (
              <div key={v.socketId} className={styles.remoteVideoTile}>
                <video
                  data-socket={v.socketId}
                  ref={(ref) => {
                    if (ref && v.stream) ref.srcObject = v.stream;
                  }}
                  autoPlay
                  playsInline
                  className={styles.remoteVideo}
                  onLoadedMetadata={(e) => e.target.play().catch(() => {})}
                />
                <div className={styles.videoTileLabel}>
                  <span className={styles.videoTileIcon}>👤</span>
                  <span>Participant</span>
                </div>
              </div>
            ))}
          </div>

          {/* Self-view — uses meetingVideoRef, stream assigned by useEffect */}
          <div className={styles.selfViewContainer}>
            <video
              ref={meetingVideoRef}
              className={styles.meetUserVideo}
              autoPlay
              playsInline
              muted
              onLoadedMetadata={(e) => e.target.play().catch(() => {})}
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
                >
                  {cameraOn ? <VideocamIcon /> : <VideocamOffIcon />}
                  <span>{cameraOn ? "Camera" : "No cam"}</span>
                </button>
                <button
                  className={`${styles.ctrlBtn} ${!audio ? styles.ctrlBtnOff : ""}`}
                  onClick={handleAudio}
                >
                  {audio ? <MicIcon /> : <MicOffIcon />}
                  <span>{audio ? "Mic" : "Muted"}</span>
                </button>
              </div>
              <button className={styles.ctrlBtnEnd} onClick={handleEndCall}>
                <CallEndIcon />
              </button>
              <div className={styles.controlGroup}>
                {screenAvailable && (
                  <button
                    className={`${styles.ctrlBtn} ${screen ? styles.ctrlBtnActive : ""}`}
                    onClick={handleScreen}
                  >
                    {screen ? <StopScreenShareIcon /> : <ScreenShareIcon />}
                    <span>{screen ? "Stop" : "Share"}</span>
                  </button>
                )}
                <button
                  className={`${styles.ctrlBtn} ${showModal ? styles.ctrlBtnActive : ""}`}
                  onClick={() => {
                    setModal(!showModal);
                    setNewMessages(0);
                  }}
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
