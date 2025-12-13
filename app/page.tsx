"use client";

import { FormEvent, useEffect, useRef, useState } from "react";

type TimeLeft = { days: number; hours: number; minutes: number; seconds: number };
type Status = "idle" | "loading" | "success" | "error";
type Source = "stallholder" | "organiser" | "visitor" | "";

// NZ time (Auckland) – Beta opens at Dec 25, 2025 00:01 (NZDT)
const targetDate = new Date("2025-12-25T00:01:00+13:00");

function calculateTimeLeft(): TimeLeft {
  const now = Date.now();
  const distance = targetDate.getTime() - now;

  if (distance <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };

  return {
    days: Math.floor(distance / (1000 * 60 * 60 * 24)),
    hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
    minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
    seconds: Math.floor((distance % (1000 * 60)) / 1000),
  };
}

function getApiErrorMessage(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  if (!("error" in data)) return null;
  const v = (data as { error?: unknown }).error;
  return typeof v === "string" ? v : String(v);
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

function TimeBox({ label, value }: { label: string; value: number }) {
  const padded = String(value).padStart(2, "0");

  return (
      <div className="time-box">
        <div className="time-value" suppressHydrationWarning>
          {padded}
        </div>
        <div className="time-label">{label}</div>
      </div>
  );
}

export default function Page() {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(() => calculateTimeLeft());

  const [teaserIndex, setTeaserIndex] = useState<number>(0);

  const [muted, setMuted] = useState<boolean>(true);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const [email, setEmail] = useState<string>("");
  const [status, setStatus] = useState<Status>("idle");
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [source, setSource] = useState<Source>("");

  // Countdown tick (client-only)
  useEffect(() => {
    const id = window.setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => window.clearInterval(id);
  }, []);

  // Rotate teaser text
  useEffect(() => {
    const id = window.setInterval(() => {
      setTeaserIndex((prev: number) => (prev + 1) % teaserMessages.length);
    }, 5000);

    return () => window.clearInterval(id);
  }, []);

  // Autoplay policy: first user gesture unmutes audio
  useEffect(() => {
    const onFirstUserGesture = () => {
      if (!audioRef.current) return;
      audioRef.current.muted = false;
      setMuted(false);
      window.removeEventListener("pointerdown", onFirstUserGesture);
      window.removeEventListener("keydown", onFirstUserGesture);
    };

    window.addEventListener("pointerdown", onFirstUserGesture);
    window.addEventListener("keydown", onFirstUserGesture);

    return () => {
      window.removeEventListener("pointerdown", onFirstUserGesture);
      window.removeEventListener("keydown", onFirstUserGesture);
    };
  }, []);

  const toggleMute = () => {
    if (!audioRef.current) return;
    audioRef.current.muted = !audioRef.current.muted;
    setMuted(audioRef.current.muted);
  };

  const clearErrorIfAny = () => {
    if (status === "error") {
      setStatus("idle");
      setStatusMessage("");
    }
  };

  const ensureSourceChosen = (): boolean => {
    if (!source) {
      setStatus("error");
      setStatusMessage("Please choose if you’re a stallholder, an organiser, or a visitor first.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (!email || !email.includes("@")) {
      setStatus("error");
      setStatusMessage("Please enter a valid email address.");
      return;
    }

    if (!ensureSourceChosen()) return;

    setStatus("loading");
    setStatusMessage("");

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source }),
      });

      if (!res.ok) {
        const data: unknown = await res.json().catch(() => null);
        const errMsg = getApiErrorMessage(data);
        setStatus("error");
        setStatusMessage(errMsg || "Something went wrong. Please try again.");
        return;
      }

      setStatus("success");
      setStatusMessage("You’re in! We’ll email you as soon as ClueMart Beta launches.");
      setEmail("");
    } catch (err: unknown) {
      setStatus("error");
      setStatusMessage(err instanceof Error ? err.message : "Something went wrong. Please try again.");
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
              preload="auto"
              disablePictureInPicture
              controls={false}
          />

          {/* keep this if you still want background audio */}
          <audio ref={audioRef} src="/background.mp3" autoPlay loop muted />

          <button
              className={`mute-button ${muted ? "wiggle" : ""}`}
              onClick={toggleMute}
              aria-label="Toggle sound"
              type="button"
          >
            {muted ? "🔇" : "🔊"}
          </button>

          <div className="content-box">
            <div className="hero-blur">
              <h1 className="hero-text">Something new is coming to your market…</h1>
            </div>

            <p key={teaserIndex} className="teaser-line">
              {teaserMessages[teaserIndex]}
            </p>

            <div className="countdown-wrapper">
              <p className="countdown-title">ClueMart Beta opens in</p>
              <div className="countdown">
                <TimeBox label="Days" value={timeLeft.days} />
                <TimeBox label="Hours" value={timeLeft.hours} />
                <TimeBox label="Minutes" value={timeLeft.minutes} />
                <TimeBox label="Seconds" value={timeLeft.seconds} />
              </div>
            </div>

            <p className="sub">Sign up and we&apos;ll notify you the moment ClueMart Beta launches.</p>

            <div className="source-toggle" role="group" aria-label="Choose your profile">
              <button
                  type="button"
                  className={source === "stallholder" ? "toggle active" : "toggle"}
                  onClick={() => {
                    setSource("stallholder");
                    clearErrorIfAny();
                  }}
              >
                Stallholder
              </button>

              <button
                  type="button"
                  className={source === "organiser" ? "toggle active" : "toggle"}
                  onClick={() => {
                    setSource("organiser");
                    clearErrorIfAny();
                  }}
              >
                Organiser
              </button>

              <button
                  type="button"
                  className={source === "visitor" ? "toggle active" : "toggle"}
                  onClick={() => {
                    setSource("visitor");
                    clearErrorIfAny();
                  }}
              >
                Visitor
              </button>
            </div>

            {/* ERROR/SUCCESS ABOVE INPUT */}
            {statusMessage && (
                <p className={`status-message ${status === "success" ? "status-success" : "status-error"}`}>
                  {statusMessage}
                </p>
            )}

            <form className="form" onSubmit={handleSubmit}>
              <input
                  type="email"
                  required
                  placeholder="Enter your email"
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => {
                    if (!source) ensureSourceChosen();
                  }}
                  disabled={status === "loading"}
              />

              <button type="submit" className="button" disabled={status === "loading" || !source}>
                {status === "loading" ? "Submitting..." : "Notify me"}
              </button>
            </form>
          </div>

          <style jsx>{`
            .page {
              position: relative;
              min-height: 100vh;
              width: 100%;
              overflow: hidden;
              display: flex;
              justify-content: center;
              align-items: flex-start;
              padding-top: calc(0px + env(safe-area-inset-top) + 0px); /* space for fixed logo + safe area */
              color: #ffffff;
              font-family: system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
            }

            .bg-video {
              position: fixed;
              inset: 0;
              width: 100%;
              height: 100%;
              object-fit: cover;
              z-index: -2;
            }


            @media (max-width: 600px) {
              .page {
                padding-top: calc(0px + env(safe-area-inset-top) + 0px);
              }
            }

            .mute-button {
              position: fixed;
              top: 18px;
              right: 18px;
              font-size: 1.5rem;
              background: rgba(0, 0, 0, 0.35);
              border: 1px solid rgba(255, 255, 255, 0.2);
              color: white;
              padding: 0.4rem 0.7rem;
              border-radius: 999px;
              cursor: pointer;
              backdrop-filter: blur(6px);
              z-index: 10002;
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
              padding: 1.2rem 1.8rem;
              display: inline-block;
              margin-bottom: 1.1rem;
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

            .countdown-wrapper {
              margin-bottom: 1.2rem;
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
            }

            .countdown {
              display: flex;
              justify-content: center;
              gap: 1rem;
              flex-wrap: wrap;
              padding: 1rem 1.4rem;
              border-radius: 16px;
              background: rgba(0, 0, 0, 0.32);
              border: 1px solid rgba(255, 255, 255, 0.35);
              backdrop-filter: blur(8px);
              -webkit-backdrop-filter: blur(8px);
              box-shadow: 0 6px 20px rgba(0, 0, 0, 0.35);
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
              gap: 0.75rem;
              margin-bottom: 0.7rem;
              flex-wrap: wrap;
            }

            .toggle {
              min-width: 140px;
              padding: 0.55rem 1.1rem;
              border-radius: 999px;
              text-align: center;
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

            @media (max-width: 600px) {
              .toggle {
                min-width: 46%;
              }
            }

            .status-message {
              margin: 0.2rem 0 0.85rem;
              font-size: 1rem;
              padding: 0.6rem 1rem;
              border-radius: 10px;
              backdrop-filter: blur(6px);
            }

            .status-error {
              color: #ff4d4d;
              background: rgba(255, 80, 80, 0.15);
              border: 1px solid rgba(255, 150, 150, 0.45);
              font-weight: 800;
              text-shadow: 0 2px 6px rgba(0, 0, 0, 0.4);
            }

            .status-success {
              color: #b9ffce;
              background: rgba(0, 0, 0, 0.18);
              border: 1px solid rgba(185, 255, 206, 0.25);
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
              font-weight: 700;
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
        </main>
      </>
  );
}