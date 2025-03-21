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
  const cameraRef = useRef<Camera | null>(null);
  const handsModelRef = useRef<Hands | null>(null);
  const mountedRef = useRef(true);

  // Complete cleanup function
  const cleanup = () => {
    if (cameraRef.current) {
      try {
        cameraRef.current.stop();
      } catch (e) {
        console.error("Error stopping camera:", e);
      }
      cameraRef.current = null;
    }

    if (handsModelRef.current) {
      try {
        handsModelRef.current.close();
      } catch (e) {
        console.error("Error closing hands model:", e);
      }
      handsModelRef.current = null;
    }
  };

  // Execute cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      cleanup();
    };
  }, []);

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current || !mountedRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      setError("Canvas context not available");
      return;
    }

    // Clean up any existing instances first
    cleanup();

    async function initHands() {
      try {
        if (!mountedRef.current) return;

        // Initialize MediaPipe Hands
        handsModelRef.current = new Hands({
          locateFile: (file: string) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
          },
        });

        handsModelRef.current.setOptions({
          maxNumHands: 2,
          modelComplexity: 1,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        handsModelRef.current.onResults((results: Results) => {
          if (!canvas || !ctx || !mountedRef.current) return;

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

            // Use a semi-transparent black background for the stick figure
            ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            for (const landmarks of results.multiHandLandmarks) {
              // Draw connectors
              drawConnectors(ctx, landmarks, HAND_CONNECTIONS, {
                color: "#00FF00",
                lineWidth: 4,
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
          if (onHandsDetected && mountedRef.current) {
            onHandsDetected(results);
          }

          if (mountedRef.current) {
            setIsLoading(false);
          }
        });

        // Initialize camera
        if (!mountedRef.current) return;

        cameraRef.current = new Camera(video, {
          onFrame: async () => {
            if (handsModelRef.current && mountedRef.current) {
              try {
                await handsModelRef.current.send({ image: video });
              } catch (e) {
                // Ignore errors if component is unmounting
                if (mountedRef.current) {
                  console.error("Error sending frame to hands model:", e);
                }
              }
            }
          },
          width: 640,
          height: 480,
        });

        if (mountedRef.current) {
          await cameraRef.current.start();
        }
      } catch (err) {
        if (!mountedRef.current) return;

        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError("Failed to initialize hand tracking");
        }
        setIsLoading(false);
      }
    }

    // Only initialize if component is still mounted
    if (mountedRef.current) {
      initHands();
    }

    // Cleanup function
    return cleanup;
  }, [onHandsDetected, showOverlay]);

  return (
    <div
      id="hand-tracker-container"
      className="relative w-full h-auto"
      style={{ overflow: "hidden" }}
    >
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

      <div className="relative" style={{ aspectRatio: "4/3" }}>
        <video
          ref={videoRef}
          className="w-full h-full rounded-lg"
          playsInline
          autoPlay
          muted
          style={{ transform: "scaleX(-1)", display: "none" }}
        />
        <canvas
          ref={canvasRef}
          className="w-full h-full rounded-lg pointer-events-none absolute top-0 left-0"
          style={{ transform: "scaleX(-1)" }}
        />
      </div>
    </div>
  );
}
