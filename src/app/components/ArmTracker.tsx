"use client";

import { useRef, useEffect, useState } from "react";
import { Camera } from "@mediapipe/camera_utils";
import { Pose, POSE_CONNECTIONS, Results } from "@mediapipe/pose";
import { drawConnectors, drawLandmarks } from "@mediapipe/drawing_utils";

interface ArmTrackerProps {
  onPoseDetected?: (results: Results) => void;
  showOverlay?: boolean;
}

export default function ArmTracker({
  onPoseDetected,
  showOverlay = true,
}: ArmTrackerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cameraRef = useRef<Camera | null>(null);
  const poseModelRef = useRef<Pose | null>(null);
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

    if (poseModelRef.current) {
      try {
        poseModelRef.current.close();
      } catch (e) {
        console.error("Error closing pose model:", e);
      }
      poseModelRef.current = null;
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

    async function initPose() {
      try {
        if (!mountedRef.current) return;

        // Initialize MediaPipe Pose
        poseModelRef.current = new Pose({
          locateFile: (file: string) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
          },
        });

        poseModelRef.current.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          enableSegmentation: false,
          smoothSegmentation: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        poseModelRef.current.onResults((results: Results) => {
          if (!canvas || !ctx || !mountedRef.current) return;

          // Set canvas dimensions to match video
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          // Clear canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Only draw the video feed when not showing overlay
          ctx.save();
          if (!showOverlay) {
            ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);
          }

          // Draw landmarks overlay if enabled
          if (showOverlay && results.poseLandmarks) {
            // Use a black/clear background for the stick figure
            ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
            ctx.fillRect(0, 0, canvas.width, canvas.height);

            // Draw connectors (stick figure lines)
            drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, {
              color: "#00FF00",
              lineWidth: 4,
            });

            // Draw landmarks as points
            drawLandmarks(ctx, results.poseLandmarks, {
              color: "#FF0000",
              lineWidth: 1,
              radius: 3,
            });
          }

          ctx.restore();

          // Call the callback with pose results
          if (onPoseDetected && mountedRef.current) {
            onPoseDetected(results);
          }

          if (mountedRef.current) {
            setIsLoading(false);
          }
        });

        // Initialize camera
        if (!mountedRef.current) return;

        cameraRef.current = new Camera(video, {
          onFrame: async () => {
            if (poseModelRef.current && mountedRef.current) {
              try {
                await poseModelRef.current.send({ image: video });
              } catch (e) {
                // Ignore errors if component is unmounting
                if (mountedRef.current) {
                  console.error("Error sending frame to pose model:", e);
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
          setError("Failed to initialize pose tracking");
        }
        setIsLoading(false);
      }
    }

    // Only initialize if component is still mounted
    if (mountedRef.current) {
      initPose();
    }

    // Cleanup function
    return cleanup;
  }, [onPoseDetected, showOverlay]);

  return (
    <div
      id="arm-tracker-container"
      className="relative w-full h-auto"
      style={{ overflow: "hidden" }}
    >
      {isLoading && (
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white z-10">
          <p>Loading pose detection...</p>
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
