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

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");

    if (!ctx) {
      setError("Canvas context not available");
      return;
    }

    let poseModel: Pose | null = null;
    let camera: Camera | null = null;

    async function initPose() {
      try {
        // Initialize MediaPipe Pose
        poseModel = new Pose({
          locateFile: (file: string) => {
            return `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`;
          },
        });

        poseModel.setOptions({
          modelComplexity: 1,
          smoothLandmarks: true,
          enableSegmentation: false,
          smoothSegmentation: false,
          minDetectionConfidence: 0.5,
          minTrackingConfidence: 0.5,
        });

        poseModel.onResults((results: Results) => {
          if (!canvas || !ctx) return;

          // Set canvas dimensions to match video
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          // Clear canvas
          ctx.clearRect(0, 0, canvas.width, canvas.height);

          // Only draw if overlay is enabled
          if (showOverlay && results.poseLandmarks) {
            // First draw the image from the video to the canvas
            ctx.save();
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

            // Draw connectors
            drawConnectors(ctx, results.poseLandmarks, POSE_CONNECTIONS, {
              color: "#00FF00",
              lineWidth: 2,
            });

            // Draw landmarks - only arm points for better visibility
            const armPoints = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22]; // Shoulder, elbow, wrist and hand landmarks
            const filteredLandmarks = results.poseLandmarks.filter(
              (_: unknown, index: number) => armPoints.includes(index)
            );

            drawLandmarks(ctx, filteredLandmarks, {
              color: "#FF0000",
              lineWidth: 1,
              radius: 3,
            });

            ctx.restore();
          }

          // Call the callback with pose results
          if (onPoseDetected) {
            onPoseDetected(results);
          }

          setIsLoading(false);
        });

        // Initialize camera
        camera = new Camera(video, {
          onFrame: async () => {
            if (poseModel) {
              await poseModel.send({ image: video });
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
          setError("Failed to initialize pose tracking");
        }
        setIsLoading(false);
      }
    }

    initPose();

    // Cleanup function
    return () => {
      if (camera) {
        camera.stop();
      }
      if (poseModel) {
        poseModel.close();
      }
    };
  }, [onPoseDetected, showOverlay]);

  return (
    <div className="relative">
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
