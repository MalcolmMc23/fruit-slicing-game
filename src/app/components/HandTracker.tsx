"use client";

import { useRef, useEffect, useState } from "react";
import { Camera } from "@mediapipe/camera_utils";
import { Hands, HAND_CONNECTIONS, Results } from "@mediapipe/hands";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";

interface HandTrackerProps {
  onHandsDetected?: (results: Results) => void;
  showOverlay?: boolean;
}

export default function HandTracker({
  onHandsDetected,
  showOverlay = true,
}: HandTrackerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      setError("Canvas context not available");
      return;
    }

    let handsModel: Hands | null = null;
    let camera: Camera | null = null;

    async function initHands() {
      try {
        // Initialize MediaPipe Hands
        handsModel = new Hands({
          locateFile: (file: string) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
          },
        });

        handsModel.setOptions({
          maxNumHands: 2,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        handsModel.onResults((results: Results) => {
          if (!canvas || !ctx) return;

          // Set canvas dimensions to match video
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          // Clear canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Only draw if overlay is enabled
          if (showOverlay && results.multiHandLandmarks) {
            // Clear canvas and prepare for drawing
            ctx.save();
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            // Draw the video feed to the canvas
            ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

            for (const landmarks of results.multiHandLandmarks) {
              // Draw connectors
              drawConnectors(ctx, landmarks, HAND_CONNECTIONS, {
                color: "#00FF00",
                lineWidth: 3,
              });

              // Draw landmarks
              drawLandmarks(ctx, landmarks, {
                color: "#FF0000",
                lineWidth: 1,
                radius: 3,
              });
            }

            ctx.restore();
          }

          // Call callback with hand results
          if (onHandsDetected) {
            onHandsDetected(results);
          }

          setIsLoading(false);
        });

        // Initialize camera
        camera = new Camera(video, {
          onFrame: async () => {
            if (handsModel) {
              await handsModel.send({ image: video });
            }
          },
          width: 640,
          height: 480,
        });

        camera.start();
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Failed to initialize hand tracking");
        }
        setIsLoading(false);
      }
    }

    initHands();

    // Cleanup function
    return () => {
      if (camera) {
        camera.stop();
      }
      if (handsModel) {
        handsModel.close();
      }
    };
  }, [onHandsDetected, showOverlay]);

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white z-10">
          <p>Loading hand detection...</p>
        </div>
      )}

      {error && (
        <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center text-white p-4 text-center rounded z-10">
          <p>Error: {error}</p>
        </div>
      )}

      <div className="relative w-full h-full">
        <video
          ref={videoRef}
          className="w-full h-full rounded-lg hidden"
          playsInline
          autoPlay
          muted
          style={{ transform: "scaleX(-1)" }}
        />
        <canvas
          ref={canvasRef}
          className="w-full h-full rounded-lg pointer-events-none"
          style={{ transform: "scaleX(-1)" }}
        />
      </div>
    </div>
  );
}
