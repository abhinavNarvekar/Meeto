import CallEndIcon from "@mui/icons-material/CallEnd";
import ChatIcon from "@mui/icons-material/Chat";
import MicIcon from "@mui/icons-material/Mic";
import MicOffIcon from "@mui/icons-material/MicOff";
import ScreenShareIcon from "@mui/icons-material/ScreenShare";
import VideocamIcon from "@mui/icons-material/Videocam";
import VideocamOffIcon from "@mui/icons-material/VideocamOff";
import Badge from "@mui/material/Badge";
import Button from "@mui/material/Button";
import IconButton from "@mui/material/IconButton";
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

          // ✅ FIX 1: Use ontrack instead of deprecated onaddstream
          // onaddstream is not supported on mobile browsers (iOS Safari, Chrome Android)
          connections.current[socketListId].ontrack = (event) => {
            // event.streams[0] is the remote MediaStream
            const remoteStream = event.streams[0];

            if (!remoteStream) return;

            let videoExists = videoRef.current.find(
              (v) => v.socketId === socketListId,
            );

            if (videoExists) {
              // Update existing entry only if stream actually changed
              if (videoExists.stream?.id !== remoteStream.id) {
                const updated = videoRef.current.map((v) =>
                  v.socketId === socketListId
                    ? { ...v, stream: remoteStream }
                    : v,
                );
                videoRef.current = updated;
                setVideos([...updated]);
              }
            } else {
              const newVideo = {
                socketId: socketListId,
                stream: remoteStream,
                autoPlay: true,
                playsInline: true,
              };

              setVideos((prevVideos) => {
                const updated = [...prevVideos, newVideo];
                videoRef.current = updated;
                return updated;
              });
            }
          };

          if (window.localStream !== undefined && window.localStream !== null) {
            // ✅ FIX 1 cont: use addTrack instead of deprecated addStream
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

            try {
              window.localStream.getTracks().forEach((track) => {
                connections.current[id2].addTrack(track, window.localStream);
              });
            } catch (err) {
              console.log(err);
            }

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

      // ✅ Use addTrack instead of addStream
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
    const newAudio = !audio;
    setAudio(newAudio);

    if (window.localStream) {
      window.localStream.getAudioTracks().forEach((track) => {
        track.enabled = newAudio;
      });
    }
  };

  let handleVideo = () => {
    const newCameraOn = !cameraOn;
    setCameraOn(newCameraOn);

    if (window.localStream) {
      window.localStream.getVideoTracks().forEach((track) => {
        track.enabled = newCameraOn;
      });
    }
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
      // ✅ Use addTrack
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

  useEffect(() => {
    if (cameraOn !== undefined || audio !== undefined) {
      getUserMedia();
    }
  }, [audio, cameraOn]);

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

      // ✅ Use addTrack
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

  // ✅ FIX 2: Use usernameRef.current so the closure always gets the latest value
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
        <div>
          <h2>Enter into Lobby</h2>

          <TextField
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            label="Username"
          />

          <br />
          <br />

          <Button variant="contained" onClick={connect}>
            Connect
          </Button>

          <video ref={localVideoRef} autoPlay muted style={{ width: 300 }} />
        </div>
      ) : (
        <div className={styles.meetVideoContainer}>
          {showModal && (
            <div className={styles.chatRoom}>
              <div className={styles.chatContainer}>
                <h1>Chat</h1>
                <div className={styles.chattingDisplay}>
                  {messages.length > 0 ? (
                    messages.map((item, index) => (
                      <div style={{ marginBottom: "20px" }} key={index}>
                        {/* ✅ FIX 2: Show "You" for own messages, sender name for others */}
                        <p style={{ fontWeight: "bold" }}>
                          {item.socketIdSender === socketIdRef.current
                            ? "You"
                            : item.sender || "Unknown"}
                        </p>
                        <p>{item.data}</p>
                      </div>
                    ))
                  ) : (
                    <p>No Messages yet</p>
                  )}
                </div>
                <div className={styles.chattingArea}>
                  <TextField
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && sendMessage()}
                    label="Type your message here..."
                    variant="outlined"
                  />
                  <Button variant="contained" onClick={sendMessage}>
                    Send
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className={styles.buttonContainer}>
            <IconButton onClick={handleVideo} style={{ color: "white" }}>
              {cameraOn ? <VideocamIcon /> : <VideocamOffIcon />}
            </IconButton>

            <IconButton onClick={handleEndCall} style={{ color: "red" }}>
              <CallEndIcon />
            </IconButton>

            <IconButton onClick={handleAudio} style={{ color: "white" }}>
              {audio ? <MicIcon /> : <MicOffIcon />}
            </IconButton>

            {screenAvailable && (
              <IconButton onClick={handleScreen} style={{ color: "white" }}>
                <ScreenShareIcon />
              </IconButton>
            )}

            <Badge badgeContent={newMessages} max={999} color="secondary">
              <IconButton
                onClick={() => {
                  setModal(!showModal);
                  setNewMessages(0);
                }}
                style={{ color: "white" }}
              >
                <ChatIcon />
              </IconButton>
            </Badge>
          </div>

          <div className={styles.conferenceView}>
            <video
              ref={localVideoRef}
              className={styles.meetUserVideo}
              autoPlay
              playsInline
              muted
            />

            {videos.map((v) => (
              <div key={v.socketId}>
                <video
                  data-socket={v.socketId}
                  ref={(ref) => {
                    if (ref && v.stream) {
                      ref.srcObject = v.stream;
                    }
                  }}
                  autoPlay
                  playsInline
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}