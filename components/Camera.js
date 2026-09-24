"use client";

import { forwardRef, useEffect, useImperativeHandle, useRef, useState } from "react";

// Every frame is centre-cropped to 2:3 at 1024x1536 — the exact shape the
// render comes back in. Any other shape and the before/after slider no
// longer lines up (each side is object-cover cropped differently), and the
// model has to re-frame the body, which is where drift creeps in. It also
// keeps the upload small: the frame is sent twice (body read + fitting).
const OUT_W = 1024;
const OUT_H = 1536;

function drawCropped(source, sw, sh, mirror) {
  const target = OUT_W / OUT_H;
  let cw = sw;
  let ch = sh;
  if (sw / sh > target) cw = Math.round(sh * target);
  else ch = Math.round(sw / target);
  const sx = Math.round((sw - cw) / 2);
  const sy = Math.round((sh - ch) / 2);
  const canvas = document.createElement("canvas");
  canvas.width = OUT_W;
  canvas.height = OUT_H;
  const ctx = canvas.getContext("2d");
  if (mirror) {
    // Mirror the canvas the same way the preview is mirrored, so the saved
    // frame matches what she was looking at.
    ctx.translate(OUT_W, 0);
    ctx.scale(-1, 1);
  }
  ctx.drawImage(source, sx, sy, cw, ch, 0, 0, OUT_W, OUT_H);
  return canvas.toDataURL("image/jpeg", 0.92);
}

function grabFrame(video) {
  return drawCropped(video, video.videoWidth || 1080, video.videoHeight || 1920, true);
}

async function frameFromFile(file) {
  const bitmap = await createImageBitmap(file);
  return drawCropped(bitmap, bitmap.width, bitmap.height, false);
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
