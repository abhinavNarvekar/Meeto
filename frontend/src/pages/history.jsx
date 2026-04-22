import HomeIcon from "@mui/icons-material/Home";
import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/AuthContext";
import "../styles/HistoryComponent.css";
export default function History() {
  const { getHistoryOfUser } = useContext(AuthContext);
  const [meetings, setMeetings] = useState([]);
  const routeTo = useNavigate();

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const history = await getHistoryOfUser();
        setMeetings(history || []);
      } catch {
        setMeetings([]);
      }
    };

    fetchHistory();
  }, []);

  let formatDate = (dateString) => {
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="historyWrapper">
      {/* Ambient orbs */}
      <div className="historyOrb historyOrb1" />
      <div className="historyOrb historyOrb2" />

      {/* ── NAVBAR ── */}
      <nav className="historyNav">
        <div className="historyNavBrand">
          <div className="historyNavDot" />
          <span className="historyNavName">NexMeet</span>
        </div>
        <button className="historyBackBtn" onClick={() => routeTo("/home")}>
          <HomeIcon style={{ fontSize: "1.1rem" }} />
          <span>Back to Home</span>
        </button>
      </nav>

      {/* ── CONTENT ── */}
      <main className="historyMain">
        <div className="historyHeader">
          <div className="historyHeaderIcon">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
          </div>
          <div>
            <h1 className="historyTitle">Meeting History</h1>
            <p className="historySubtitle">
              {meetings.length > 0
                ? `${meetings.length} past meeting${meetings.length !== 1 ? "s" : ""}`
                : "Your past meetings will appear here"}
            </p>
          </div>
        </div>

        {meetings?.length > 0 ? (
          <div className="historyList">
            {meetings.map((e, i) => (
              <div
                className="historyCard"
                key={i}
                style={{ animationDelay: `${i * 0.06}s` }}
              >
                <div className="historyCardLeft">
                  <div className="historyCardIndex">
                    {String(i + 1).padStart(2, "0")}
                  </div>
                </div>

                <div className="historyCardBody">
                  <div className="historyCardRow">
                    <span className="historyCardLabel">Meeting Code</span>
                    <span className="historyCardCode">{e.meetingCode}</span>
                  </div>
                  <div className="historyCardDivider" />
                  <div className="historyCardRow">
                    <span className="historyCardLabel">Date</span>
                    <span className="historyCardDate">
                      {formatDate(e.date)}
                    </span>
                  </div>
                </div>

                <button
                  className="historyCardRejoin"
                  onClick={() => routeTo(`/${e.meetingCode}`)}
                  title="Rejoin this meeting"
                >
                  <svg
                    width="16"
                    height="16"
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
            ))}
          </div>
        ) : (
          <div className="historyEmpty">
            <div className="historyEmptyIcon">
              <svg
                width="40"
                height="40"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                <circle cx="9" cy="7" r="4" />
                <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
              </svg>
            </div>
            <p className="historyEmptyTitle">No meetings yet</p>
            <p className="historyEmptyText">
              Once you join a meeting, it'll show up here.
            </p>
            <button
              className="historyGoHomeBtn"
              onClick={() => routeTo("/home")}
            >
              Go to Home
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
