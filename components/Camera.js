"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

// Capture at the video's native size, downscale only past 1600 on the long
// edge. The render comes back at 1024x1536, so anything larger is detail
// the model throws away — and a 2560px frame at q0.95 was a multi-MB
// upload on shop wifi or 5G, sent twice (body read + fitting), brushing
// Vercel's 4.5 MB request limit.
function grabFrame(video, maxEdge = 1600) {
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
  return canvas.toDataURL("image/jpeg", 0.9);
}

async function frameFromFile(file, maxEdge = 1600) {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  canvas.getContext("2d").drawImage(bitmap, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", 0.9);
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
        // "ideal" past 4K just tells the browser to hand over the best this
        // camera has — it never fails for asking too high.
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 4096 }, height: { ideal: 2160 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }

        // Some devices still hand back less than they're capable of until
        // asked directly — pin the track to its own reported ceiling.
        const [track] = stream.getVideoTracks();
        const caps = track.getCapabilities?.();
        if (caps?.width?.max && caps?.height?.max) {
          await track
            .applyConstraints({ width: { ideal: caps.width.max }, height: { ideal: caps.height.max } })
            .catch(() => {});
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
