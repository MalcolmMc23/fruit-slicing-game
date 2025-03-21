// Type definitions for MediaPipe libraries

declare module '@mediapipe/camera_utils' {
  export class Camera {
    constructor(
      videoElement: HTMLVideoElement,
      options?: {
        onFrame?: () => Promise<void>;
        width?: number;
        height?: number;
        facingMode?: string;
      }
    );
    start(): Promise<void>;
    stop(): void;
  }
}

declare module '@mediapipe/drawing_utils' {
  export function drawConnectors(
    canvasCtx: CanvasRenderingContext2D,
    landmarks: Array<{x: number, y: number, z?: number, visibility?: number}>,
    connections: Array<[number, number]>,
    options?: {
      color?: string;
      lineWidth?: number;
    }
  ): void;
  
  export function drawLandmarks(
    canvasCtx: CanvasRenderingContext2D,
    landmarks: Array<{x: number, y: number, z?: number, visibility?: number}>,
    options?: {
      color?: string;
      fillColor?: string;
      lineWidth?: number;
      radius?: number;
    }
  ): void;
}

declare module '@mediapipe/hands' {
  export const HAND_CONNECTIONS: Array<[number, number]>;
  
  export interface HandLandmark {
    x: number;
    y: number;
    z: number;
    visibility?: number;
  }
  
  export interface Results {
    multiHandLandmarks?: HandLandmark[][];
    multiHandedness?: Array<{
      index: number;
      score: number;
      label: string;
    }>;
    image: HTMLCanvasElement | HTMLVideoElement | HTMLImageElement;
  }
  
  export class Hands {
    constructor(options?: {
      locateFile?: (file: string) => string;
    });
    
    setOptions(options: {
      maxNumHands?: number;
      modelComplexity?: number;
      minDetectionConfidence?: number;
      minTrackingConfidence?: number;
    }): void;
    
    onResults(callback: (results: Results) => void): void;
    
    send(options: {
      image: HTMLCanvasElement | HTMLVideoElement | HTMLImageElement;
    }): Promise<void>;
    
    close(): void;
  }
}

declare module '@mediapipe/pose' {
  export const POSE_CONNECTIONS: Array<[number, number]>;
  
  export interface PoseLandmark {
    x: number;
    y: number;
    z: number;
    visibility?: number;
  }
  
  export interface Results {
    poseLandmarks?: PoseLandmark[];
    poseWorldLandmarks?: PoseLandmark[];
    segmentationMask?: HTMLCanvasElement;
    image: HTMLCanvasElement | HTMLVideoElement | HTMLImageElement;
  }
  
  export class Pose {
    constructor(options?: {
      locateFile?: (file: string) => string;
    });
    
    setOptions(options: {
      modelComplexity?: number;
      smoothLandmarks?: boolean;
      enableSegmentation?: boolean;
      smoothSegmentation?: boolean;
      minDetectionConfidence?: number;
      minTrackingConfidence?: number;
    }): void;
    
    onResults(callback: (results: Results) => void): void;
    
    send(options: {
      image: HTMLCanvasElement | HTMLVideoElement | HTMLImageElement;
    }): Promise<void>;
    
    close(): void;
  }
} 