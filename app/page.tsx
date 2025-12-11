"use client";

import { useEffect, useState, useRef, FormEvent } from "react";

type TimeLeft = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
};

const targetDate = new Date("2025-12-22T00:00:00+13:00");

function calculateTimeLeft(): TimeLeft {
  const now = new Date().getTime();
  const distance = targetDate.getTime() - now;

  if (distance <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  }

  return {
    days: Math.floor(distance / (1000 * 60 * 60 * 24)),
    hours: Math.floor(
      (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    ),
    minutes: Math.floor(
      (distance % (1000 * 60 * 60)) / (1000 * 60)
    ),
    seconds: Math.floor((distance % (1000 * 60)) / 1000),
  };
}

const teaserMessages = [
  "Your market is about to come alive.",
  "The days of chaotic organising are almost over.",
  "One home for organisers, stallholders, and visitors.",
  "No more lost messages. No more crossed wires.",
  "What used to take six conversations will soon take one tap.",
  "Your stall deserves more attention. Very soon… it will get it.",
  "A market isn’t just stalls — it’s a community.",
  "Something new is coming to local events in Aotearoa.",
  "Sign up now – be the first to open the future of local markets.",
];

type Status = "idle" | "loading" | "success" | "error";

export default function Page() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft);
  const [muted, setMuted] = useState(true);
  const [teaserIndex, setTeaserIndex] = useState(0);
  const [hasMounted, setHasMounted] = useState(false);

  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<Status>("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [source, setSource] = useState<"stallholder" | "organiser" | "">("");

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // csak kliensen fusson a dinamikus rész (hydration fix)
  useEffect(() => {
    setHasMounted(true);
  }, []);

  // countdown frissítés
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // teaser szövegek váltása
  useEffect(() => {
    const interval = setInterval(
      () => setTeaserIndex((prev) => (prev + 1) % teaserMessages.length),
      5000
    );
    return () => clearInterval(interval);
  }, []);

  // kattintásra auto-unmute zene
  useEffect(() => {
    const unmuteOnClick = () => {
      if (audioRef.current) {
        audioRef.current.muted = false;
        setMuted(false);
        window.removeEventListener("click", unmuteOnClick);
      }
    };
    window.addEventListener("click", unmuteOnClick);
    return () => window.removeEventListener("click", unmuteOnClick);
  }, []);

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !audioRef.current.muted;
    setMuted(audioRef.current.muted);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes("@")) {
      setStatus("error");
      setStatusMessage("Please enter a valid email address.");
      return;
    }

    if (!source) {
      setStatus("error");
      setStatusMessage(
        "Please choose whether you’re a stallholder or an organiser first."
      );
      return;
    }

    setStatus("loading");
    setStatusMessage("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, source }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(
          data?.error || "Something went wrong. Please try again."
        );
      }

      setStatus("success");
      setStatusMessage(
        "You’re in! We’ll email you as soon as ClueMart launches."
      );
      setEmail("");
    } catch (err: any) {
      setStatus("error");
      setStatusMessage(
        err?.message || "Something went wrong. Please try again."
      );
    }
  };

  return (
    <>
      <main className="page">
        {/* háttérvideó */}
        <video
          className="bg-video"
          src="/background.mp4"
          autoPlay
          muted
          loop
          playsInline
        />

        {/* ClueMart logo */}
        <div className="logo-bar">
          <img src="/logo.png" alt="ClueMart logo" className="logo-img" />
        </div>

        {/* háttérzene */}
        <audio ref={audioRef} src="/background.mp3" autoPlay loop muted />

        {/* mute / unmute gomb */}
        <button
          className={`mute-button ${muted ? "wiggle" : ""}`}
          onClick={toggleMute}
        >
          {muted ? "🔇" : "🔊"}
        </button>

        <div className="content-box">
          {/* HERO HEADLINE saját blur-dobozban */}
          <div className="hero-blur">
            <h1 className="hero-text">
              Something new is coming to your market…
            </h1>
          </div>

          {/* rotáló teaser szövegek */}
          {hasMounted && (
            <p key={teaserIndex} className="teaser-line">
              {teaserMessages[teaserIndex]}
            </p>
          )}

          {/* countdown – most már blur-dobozban */}
          {hasMounted && (
  <div className="countdown-wrapper">
    <p className="countdown-title">ClueMart goes live in</p>
    <div className="countdown">
      <TimeBox label="Days" value={timeLeft.days} />
      <TimeBox label="Hours" value={timeLeft.hours} />
      <TimeBox label="Minutes" value={timeLeft.minutes} />
      <TimeBox label="Seconds" value={timeLeft.seconds} />
    </div>
  </div>
)}

          <p className="sub">
            Sign up and we&apos;ll notify you the moment ClueMart launches.
          </p>

          {/* Stallholder / Organiser váltó */}
          <div className="source-toggle">
            <button
              type="button"
              className={source === "stallholder" ? "toggle active" : "toggle"}
              onClick={() => {
                setSource("stallholder");
                if (status === "error") {
                  setStatus("idle");
                  setStatusMessage("");
                }
              }}
            >
              Stallholder
            </button>

            <button
              type="button"
              className={source === "organiser" ? "toggle active" : "toggle"}
              onClick={() => {
                setSource("organiser");
                if (status === "error") {
                  setStatus("idle");
                  setStatusMessage("");
                }
              }}
            >
              Organiser
            </button>
          </div>

          {/* status üzenet fent az input felett */}
          {status !== "idle" && statusMessage && (
            <p
              className={`status-message ${
                status === "success" ? "status-success" : "status-error"
              }`}
            >
              {statusMessage}
            </p>
          )}

          {/* email form */}
          <form className="form" onSubmit={handleSubmit}>
            <input
              type="email"
              required
              placeholder="Enter your email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={() => {
                if (!source) {
                  setStatus("error");
                  setStatusMessage(
                    "Please choose if you’re a stallholder or an organiser first."
                  );
                }
              }}
              disabled={status === "loading"}
            />
            <button
              type="submit"
              className="button"
              disabled={status === "loading" || !source}
            >
              {status === "loading" ? "Submitting..." : "Notify me"}
            </button>
          </form>
        </div>
      </main>

      <style jsx>{`
        /* teljes oldal layout */
        .page {
          position: relative;
          min-height: 100vh;
          width: 100%;
          overflow: hidden;
          display: flex;
          justify-content: center;
          align-items: flex-start;
          padding-top: 18vh;
          color: #ffffff;
          font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
            sans-serif;
        }

        .bg-video {
          position: fixed;
          top: 50%;
          left: 50%;
          min-width: 100%;
          min-height: 100%;
          transform: translate(-50%, -50%);
          object-fit: cover;
          z-index: -2;
          opacity: 0;
          animation: fadeInVideo 0.6s ease-out forwards;
        }

        /* videó kontrollok elrejtése */
        .bg-video::-webkit-media-controls {
          display: none !important;
        }
        .bg-video::-webkit-media-controls-enclosure {
          display: none !important;
        }
        .bg-video::-webkit-media-controls-panel {
          display: none !important;
        }

        @keyframes fadeInVideo {
          to {
            opacity: 1;
          }
        }

        .logo-bar {
          position: absolute;
          top: 20px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 9;
        }

        .logo-img {
          height: 90px;
          width: auto;
        }

        @media (max-width: 600px) {
          .logo-img {
            height: 62px;
          }
        }

        .mute-button {
          position: fixed;
          top: 20px;
          right: 20px;
          font-size: 1.5rem;
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          padding: 0.4rem 0.7rem;
          border-radius: 50%;
          cursor: pointer;
          backdrop-filter: blur(6px);
          z-index: 10;
        }

        .wiggle {
          animation: wiggle 2.2s ease-in-out infinite;
        }

        @keyframes wiggle {
          0% {
            transform: rotate(0deg);
          }
          8% {
            transform: rotate(-10deg);
          }
          15% {
            transform: rotate(10deg);
          }
          22% {
            transform: rotate(-6deg);
          }
          30% {
            transform: rotate(6deg);
          }
          38% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(0deg);
          }
        }

        .content-box {
          width: 100%;
          max-width: 720px;
          padding: 0 1.5rem 2.5rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          text-align: center;
        }

        .hero-blur {
          backdrop-filter: blur(10px) saturate(150%);
          -webkit-backdrop-filter: blur(10px) saturate(150%);
          background: rgba(0, 0, 0, 0.35);
          border-radius: 20px;
          border: 1px solid rgba(255, 255, 255, 0.4);
          padding: 1.3rem 1.9rem;
          display: inline-block;
          margin-bottom: 1.5rem;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.35);
        }

        .hero-text {
          font-size: clamp(1.6rem, 2.4vw, 2.1rem);
          font-weight: 700;
          line-height: 1.25;
          margin: 0;
          color: #ffffff;
          text-shadow: 0 2px 14px rgba(0, 0, 0, 0.7);
        }

        @media (max-width: 600px) {
          .hero-blur {
            padding: 1rem 1.4rem;
          }
          .hero-text {
            font-size: 1.6rem;
          }
        }

        .teaser-line {
          margin-bottom: 1.1rem;
          font-size: 1.1rem;
          font-weight: 600;
          color: #fff;
          padding: 0.45rem 1rem;
          border-radius: 12px;
          background: rgba(0, 0, 0, 0.28);
          border: 1px solid rgba(255, 255, 255, 0.35);
          backdrop-filter: blur(4px);
          text-shadow: 0 2px 12px rgba(0, 0, 0, 0.55);
          animation: teaserFade 5s ease-in-out;
        }

        @keyframes teaserFade {
          0% {
            opacity: 0;
            transform: translateY(6px);
          }
          10% {
            opacity: 1;
            transform: translateY(0);
          }
          80% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translateY(-4px);
          }
        }

        /* countdown blur box */
        .countdown {
          display: flex;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 1.25rem;
          flex-wrap: wrap;

          padding: 1rem 1.4rem;
          border-radius: 16px;
          background: rgba(0, 0, 0, 0.32);
          border: 1px solid rgba(255, 255, 255, 0.35);
          backdrop-filter: blur(8px);
          -webkit-backdrop-filter: blur(8px);
          box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
        }
        
        .countdown-wrapper {
  margin-bottom: 1.5rem;
  padding: 1rem 1.6rem 1.3rem;
  border-radius: 22px;
  background: rgba(0, 0, 0, 0.45);
  border: 1px solid rgba(255, 255, 255, 0.45);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  box-shadow: 0 10px 26px rgba(0, 0, 0, 0.45);
}

.countdown-title {
  margin: 0 0 0.55rem;
  font-size: 0.85rem;
  text-transform: uppercase;
  letter-spacing: 0.16em;
  color: rgba(255, 255, 255, 0.9);
  opacity: 0.95;
}

        .sub {
          font-size: 1.05rem;
          font-weight: 600;
          margin-bottom: 1.2rem;
          color: #fff;
          background: rgba(0, 0, 0, 0.25);
          padding: 0.45rem 1rem;
          border-radius: 12px;
          backdrop-filter: blur(4px);
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.45);
        }

        .source-toggle {
          display: flex;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 1.2rem;
          flex-wrap: wrap;
        }

        .toggle {
          padding: 0.55rem 1.1rem;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.15);
          border: 1px solid rgba(255, 255, 255, 0.35);
          color: #fff;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.25s ease;
          backdrop-filter: blur(4px);
        }

        .toggle:hover {
          background: rgba(255, 255, 255, 0.25);
        }

        .toggle.active {
          background: linear-gradient(135deg, #1fb597, #6b2d78);
          border-color: rgba(255, 255, 255, 0.55);
        }

        .form {
          display: flex;
          gap: 0.75rem;
          justify-content: center;
          flex-wrap: wrap;
        }

        .input {
          padding: 0.75rem 1rem;
          border-radius: 999px;
          border: 2px solid rgba(255, 255, 255, 0.65);
          background: rgba(0, 0, 0, 0.25);
          color: white;
          min-width: 260px;
          max-width: 320px;
          font-size: 0.95rem;
        }

        .input::placeholder {
          color: rgba(255, 255, 255, 0.8);
        }

        .button {
          padding: 0.75rem 1.5rem;
          border-radius: 999px;
          background: linear-gradient(135deg, #1fb597, #6b2d78);
          color: #fff;
          font-weight: 600;
          cursor: pointer;
          border: none;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.35);
          transition: transform 0.15s ease, box-shadow 0.15s ease;
        }

        .button:hover:enabled {
          transform: translateY(-1px);
          box-shadow: 0 14px 30px rgba(0, 0, 0, 0.45);
        }

        .button:disabled {
          opacity: 0.7;
          cursor: default;
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.3);
        }

        .status-message {
          margin-bottom: 0.6rem;
          font-size: 1rem;
          padding: 0.6rem 1rem;
          border-radius: 10px;
          backdrop-filter: blur(6px);
        }

        .status-error {
          color: #ff4d4d;
          background: rgba(255, 80, 80, 0.15);
          border: 1px solid rgba(255, 150, 150, 0.4);
          font-weight: 600;
          text-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
        }

        .status-success {
          color: #b9ffce;
        }

        /* countdown belső elemek */
        .time-box {
          min-width: 90px;
          padding: 0.4rem 0.5rem;
          border-radius: 12px;
        }

        .time-value {
          font-size: 1.5rem;
          font-weight: 700;
          color: #ffffff;
          text-shadow: 0 2px 8px rgba(0, 0, 0, 0.5);
        }

        .time-label {
          font-size: 0.7rem;
          text-transform: uppercase;
          opacity: 0.9;
          letter-spacing: 0.1em;
          margin-top: 0.1rem;
          color: rgba(255, 255, 255, 0.95);
        }
      `}</style>
    </>
  );
}

function TimeBox({ label, value }: { label: string; value: number }) {
  const padded = String(value).padStart(2, "0");

  return (
    <div className="time-box">
      <div className="time-value">{padded}</div>
      <div className="time-label">{label}</div>
    </div>
  );
}