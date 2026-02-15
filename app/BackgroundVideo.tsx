"use client";

export default function BackgroundVideo() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <video
        src="/background.mp4"
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="h-full w-full object-cover"
        style={{ filter: "brightness(0.9)" }}
      />
      <div className="absolute inset-0 bg-black/25" />
    </div>
  );
}
