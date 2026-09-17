"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

// Capture at the video's native size, downscale only past 1536 on the long
// edge. A 640x480 capture is the most common reason a result comes back soft.
function grabFrame(video, maxEdge = 1536) {
  const vw = video.videoWidth || 1080;
  const vh = video.videoHeight || 1920;
  const scale = Math.min(1, maxEdge / Math.max(vw, vh));
  const w = Math.round(vw * scale);
  const h = Math.round(vh * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  // Mirror the canvas the same way the preview is mirrored, so the saved
  // frame matches what she was looking at.
  ctx.translate(w, 0);
  ctx.scale(-1, 1);
  ctx.drawImage(video, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.92);
}

async function frameFromFile(file, maxEdge = 1536) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d").drawImage(bitmap, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.92);
}

// Camera refused or missing is never a dead end and never a silent
// substitution — it says so in one sentence and hands over a file picker.
const Camera = forwardRef(function Camera({ onReady, onFrame }, ref) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [error, setError] = useState(null); // "denied" | "unavailable" | null

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1440 }, height: { ideal: 1920 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
        onReady?.();
      } catch (e) {
        setError(e?.name === "NotAllowedError" ? "denied" : "unavailable");
      }
    })();
    return () => {
      cancelled = true;
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useImperativeHandle(ref, () => ({
    capture() {
      if (!videoRef.current) return null;
      const frame = grabFrame(videoRef.current);
      onFrame?.(frame);
      return frame;
    },
  }));

  if (error) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-[3cqw] bg-void px-[8cqw] text-center">
        <p className="font-body text-[2.2cqw] leading-[1.4] text-bone">
          {error === "denied" ? "Camera access was declined." : "No camera found on this device."}
        </p>
        <label className="btn-primary flex cursor-pointer items-center justify-center text-[1.6cqw] leading-none">
          Use a photo instead
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              onFrame?.(await frameFromFile(file));
            }}
          />
        </label>
      </div>
    );
  }

  return (
    <video
      ref={videoRef}
      playsInline
      muted
      autoPlay
      className="absolute inset-0 h-full w-full object-cover"
      style={{ transform: "scaleX(-1)" }}
    />
  );
});

export default Camera;
