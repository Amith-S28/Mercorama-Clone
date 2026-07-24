import type { Metadata } from "next";
import { LandingPage } from "./LandingClient";
import "./landing.css";

export const metadata: Metadata = {
  title: "Mercorama — Trade Readiness Intelligence Platform",
  description:
    "Advisory intelligence platform for Canadian export trade agencies. Assess readiness, model costs, and research markets — all in one workspace.",
};

export default function Home() {
  return <LandingPage />;
}
