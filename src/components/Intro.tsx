"use client";

import { useEffect, useState } from "react";
import { site } from "@/content/site";

const INTRO_KEY = "portfolio-intro-seen";

export function Intro() {
  const [show, setShow] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduced) return;
    if (sessionStorage.getItem(INTRO_KEY) === "1") return;

    setShow(true);
    const finish = window.setTimeout(() => {
      sessionStorage.setItem(INTRO_KEY, "1");
      setDone(true);
      window.setTimeout(() => setShow(false), 520);
    }, 1100);

    return () => window.clearTimeout(finish);
  }, []);

  if (!show) return null;

  return (
    <div
      className={`intro-veil${done ? " is-done" : ""}`}
      aria-hidden
    >
      <p className="intro-mark">{site.nameDisplay}</p>
    </div>
  );
}
