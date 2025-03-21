"use client";

import { useState } from "react";
import ArmTracker from "./components/ArmTracker";
import HandTracker from "./components/HandTracker";

export default function Home() {
  const [trackingMode, setTrackingMode] = useState<"arm" | "hand" | null>(null);
  const [showOverlay, setShowOverlay] = useState(true);

  return (
    <div className="flex flex-col items-center min-h-screen bg-black text-white p-4">
      <h1 className="text-2xl font-bold mb-4">Fruit Slicing Game</h1>

      {!trackingMode ? (
        <div className="flex flex-col items-center justify-center space-y-4 p-8 bg-gray-800 rounded-lg">
          <h2 className="text-xl mb-2">Select Tracking Mode</h2>
          <button
            onClick={() => setTrackingMode("arm")}
            className="px-6 py-3 bg-blue-600 rounded-md hover:bg-blue-700 transition-colors w-48"
          >
            Arm Tracking
          </button>
          <button
            onClick={() => setTrackingMode("hand")}
            className="px-6 py-3 bg-green-600 rounded-md hover:bg-green-700 transition-colors w-48"
          >
            Hand Tracking
          </button>
        </div>
      ) : (
        <div className="w-full max-w-2xl">
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl">
              {trackingMode === "arm" ? "Arm Tracking" : "Hand Tracking"} Mode
            </h2>
            <div className="flex space-x-2">
              <button
                onClick={() => setShowOverlay(!showOverlay)}
                className={`px-4 py-2 rounded-md transition-colors ${
                  showOverlay
                    ? "bg-purple-600 hover:bg-purple-700"
                    : "bg-gray-600 hover:bg-gray-700"
                }`}
              >
                {showOverlay ? "Hide Overlay" : "Show Overlay"}
              </button>
              <button
                onClick={() => setTrackingMode(null)}
                className="px-4 py-2 bg-red-600 rounded-md hover:bg-red-700 transition-colors"
              >
                Change Mode
              </button>
            </div>
          </div>

          <div className="rounded-lg overflow-hidden">
            {trackingMode === "arm" ? (
              <ArmTracker
                showOverlay={showOverlay}
                onPoseDetected={(results) => {
                  // Will be used for collision detection in the future
                  console.log("Pose detected:", results.poseLandmarks?.length);
                }}
              />
            ) : (
              <HandTracker
                showOverlay={showOverlay}
                onHandsDetected={(results) => {
                  // Will be used for collision detection in the future
                  console.log(
                    "Hands detected:",
                    results.multiHandLandmarks?.length
                  );
                }}
              />
            )}
          </div>

          <div className="mt-4 p-4 bg-gray-800 rounded-lg">
            <p>
              Move your {trackingMode === "arm" ? "arms" : "hands"} in front of
              the camera.
            </p>
            <p className="text-gray-400 text-sm mt-2">
              Note: This is a preview mode. Fruit slicing will be implemented in
              the next phase.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
