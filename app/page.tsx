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
  "Sign up now – be the first to open the future of local markets."
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
  const [source, setSource] = useState("stallholder"); 

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // jelzi, hogy a komponens már kliensen fut (hydration fix)
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
    const interval = setInterval(() => {
      setTeaserIndex((prev) => (prev + 1) % teaserMessages.length);
    }, 5000);
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
        throw new Error(data?.error || "Something went wrong. Please try again.");
      }

      setStatus("success");
      setStatusMessage("You’re in! We’ll email you as soon as ClueMart launches.");
      setEmail("");
    } catch (err: any) {
      setStatus("error");
      setStatusMessage(err.message || "Something went wrong. Please try again.");
    }
  };

  return (
    <>
      <main className="page">
        <video
          className="bg-video"
          src="/background.mp4"
          autoPlay
          muted
          loop
          playsInline
        />

        <audio ref={audioRef} src="/background.mp3" autoPlay loop muted />

        <button
          className={`mute-button ${muted ? "wiggle" : ""}`}
          onClick={toggleMute}
        >
          {muted ? "🔇" : "🔊"}
        </button>

        <div className="content-box">
          <h1 className="headline">Something new is coming to your market…</h1>

          {hasMounted && (
            <p key={teaserIndex} className="teaser-line">
              {teaserMessages[teaserIndex]}
            </p>
          )}

          {hasMounted && (
            <div className="countdown">
              <TimeBox label="Days" value={timeLeft.days} />
              <TimeBox label="Hours" value={timeLeft.hours} />
              <TimeBox label="Minutes" value={timeLeft.minutes} />
              <TimeBox label="Seconds" value={timeLeft.seconds} />
            </div>
          )}

          <p className="sub">
            Sign up and we&apos;ll notify you the moment ClueMart launches.
          </p>
			
		<div className="source-toggle">
  <button
    type="button"
    className={source === "stallholder" ? "toggle active" : "toggle"}
    onClick={() => setSource("stallholder")}
  >
    Stallholder
  </button>

  <button
    type="button"
    className={source === "organiser" ? "toggle active" : "toggle"}
    onClick={() => setSource("organiser")}
  >
    Organiser
  </button>
</div>
          <form className="form" onSubmit={handleSubmit}>
            <input
              type="email"
              required
              placeholder="Enter your email"
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={status === "loading"}
            />
            <button
              type="submit"
              className="button"
              disabled={status === "loading"}
            >
              {status === "loading" ? "Submitting..." : "Notify me"}
            </button>
          </form>

          {status !== "idle" && statusMessage && (
            <p
              className={`status-message ${
                status === "success" ? "status-success" : "status-error"
              }`}
            >
              {statusMessage}
            </p>
          )}
        </div>
      </main>

      <style jsx>{`
        .source-toggle {
  display: flex;
  justify-content: center;
  gap: 1rem;
  margin-bottom: 1.2rem;
}

.toggle {
  padding: 0.55rem 1.1rem;
  border-radius: 999px;
  background: rgba(255,255,255,0.15);
  border: 1px solid rgba(255,255,255,0.35);
  color: #fff;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.25s ease;
  backdrop-filter: blur(4px);
}

.toggle:hover {
  background: rgba(255,255,255,0.25);
}

.toggle.active {
  background: linear-gradient(135deg, #1fb597, #6b2d78);
  border-color: rgba(255,255,255,0.55);
}
        
        .page {
          position: relative;
          min-height: 100vh;
          width: 100%;
          overflow: hidden;
          display: flex;
          align-items: flex-start;
          justify-content: center;
          padding-top: 18vh;
          color: #fff;
          font-family: system-ui, sans-serif;
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
          0% { transform: rotate(0deg); }
          8% { transform: rotate(-10deg); }
          15% { transform: rotate(10deg); }
          22% { transform: rotate(-6deg); }
          30% { transform: rotate(6deg); }
          38% { transform: rotate(0deg); }
          100% { transform: rotate(0deg); }
        }

        .content-box {
          max-width: 720px;
          width: 90%;
          padding: 2rem;
          text-align: center;
          border-radius: 22px;
          background: rgba(0, 0, 0, 0.12);
          backdrop-filter: blur(6px) saturate(140%);
          border: 1px solid rgba(255, 255, 255, 0.22);
          box-shadow: 0 4px 18px rgba(0, 0, 0, 0.25);
          margin-top: 2rem;
        }

        .headline {
          font-size: clamp(2.2rem, 3vw, 3rem);
          font-weight: 700;
          margin-bottom: 1rem;
        }

        .teaser-line {
          margin-bottom: 1.1rem;
          font-size: 1.35rem;
          font-weight: 700;
          color: #fff;
          padding: 0.4rem 1rem;
          border-radius: 12px;
          background: rgba(0, 0, 0, 0.28);
          border: 1px solid rgba(255, 255, 255, 0.35);
          backdrop-filter: blur(4px);
          text-shadow: 0 2px 12px rgba(0, 0, 0, 0.55);
          animation: teaserFade 5s ease-in-out;
        }

        @keyframes teaserFade {
          0% { opacity: 0; transform: translateY(6px); }
          10% { opacity: 1; transform: translateY(0); }
          80% { opacity: 1; }
          100% { opacity: 0; transform: translateY(-4px); }
        }

        .countdown {
          display: flex;
          justify-content: center;
          gap: 1rem;
          margin-bottom: 1.25rem;
          flex-wrap: wrap;
        }

        .sub {
          font-size: 1.15rem;
          font-weight: 600;
          margin-bottom: 1.2rem;
          color: #fff;
          background: rgba(0, 0, 0, 0.25);
          padding: 0.4rem 1rem;
          border-radius: 12px;
          backdrop-filter: blur(4px);
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.45);
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

        .button {
          padding: 0.75rem 1.5rem;
          border-radius: 999px;
          background: linear-gradient(135deg, #1fb597, #6b2d78);
          color: #fff;
          font-weight: 600;
          cursor: pointer;
        }

        .button:disabled {
          opacity: 0.7;
          cursor: default;
        }

        .status-message {
          margin-top: 0.75rem;
          font-size: 0.9rem;
        }

        .status-success {
          color: #b9ffce;
        }

        .status-error {
          color: #ffb3b3;
        }
      `}</style>
    </>
  );
}

function TimeBox({ label, value }: { label: string; value: number }) {
  const padded = String(value).padStart(2, "0");

  return (
    <div className="box">
      <div className="value">{padded}</div>
      <div className="label">{label}</div>

      <style jsx>{`
        .box {
          min-width: 80px;
          padding: 0.6rem 0.75rem;
          border-radius: 16px;
          background: rgba(0, 0, 0, 0.35);
          border: 1px solid rgba(255, 255, 255, 0.2);
          backdrop-filter: blur(8px);
        }
        .value {
          font-size: 1.4rem;
          font-weight: 700;
        }
        .label {
          font-size: 0.7rem;
          text-transform: uppercase;
          opacity: 0.8;
          letter-spacing: 0.08em;
          margin-top: 0.1rem;
        }
      `}</style>
    </div>
  );
}