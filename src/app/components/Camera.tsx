"use client";

import { useRef, useEffect, useState } from "react";

interface CameraProps {
  onFrame?: (video: HTMLVideoElement) => void;
}

export default function Camera({ onFrame }: CameraProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [permissionGranted, setPermissionGranted] = useState<boolean | null>(
    null
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;

    async function setupCamera() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "user",
            width: { ideal: 640 },
            height: { ideal: 480 },
          },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setPermissionGranted(true);
        }
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Unknown error accessing camera");
        }
        setPermissionGranted(false);
      }
    }

    setupCamera();

    // Cleanup function
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (!videoRef.current || !onFrame) return;

    const video = videoRef.current;
    let animationId: number;

    const processFrame = () => {
      if (video.readyState === 4) {
        onFrame(video);
      }
      animationId = requestAnimationFrame(processFrame);
    };

    video.addEventListener("loadeddata", () => {
      animationId = requestAnimationFrame(processFrame);
    });

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [onFrame]);

  return (
    <div className="relative">
      {permissionGranted === false && (
        <div className="absolute inset-0 bg-black/80 flex items-center justify-center text-white p-4 text-center rounded">
          <p>
            Camera permission denied:{" "}
            {error || "Please allow camera access to play."}
          </p>
        </div>
      )}

      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full rounded-lg"
        style={{ transform: "scaleX(-1)" }} // Mirror video
      />
    </div>
  );
}
