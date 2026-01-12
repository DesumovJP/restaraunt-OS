"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  isQRScannerSupported,
  requestCameraPermission,
  startContinuousScan,
  parseProductQR,
} from "@/lib/qr";
import { Camera, Keyboard, X, QrCode, Loader2 } from "lucide-react";

interface QRScannerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScan: (data: {
    sku?: string;
    name?: string;
    quantity?: number;
    expiryDate?: Date;
    batchNumber?: string;
  }) => void;
}

type ScanMode = "camera" | "manual";

export function QRScanner({ open, onOpenChange, onScan }: QRScannerProps) {
  const [mode, setMode] = React.useState<ScanMode>("camera");
  const [isScanning, setIsScanning] = React.useState(false);
  const [hasPermission, setHasPermission] = React.useState<boolean | null>(null);
  const [manualInput, setManualInput] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const videoRef = React.useRef<HTMLVideoElement>(null);
  const stopScanRef = React.useRef<(() => void) | null>(null);

  // Check camera support
  const isCameraSupported = React.useMemo(() => {
    if (typeof window === "undefined") return false;
    return isQRScannerSupported() && "mediaDevices" in navigator;
  }, []);

  // Start camera scanning
  const startCamera = React.useCallback(async () => {
    if (!videoRef.current) return;

    setError(null);
    setIsScanning(true);

    try {
      const permission = await requestCameraPermission();
      setHasPermission(permission);

      if (!permission) {
        setError("Доступ до камери заборонено");
        setIsScanning(false);
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });

      videoRef.current.srcObject = stream;
      await videoRef.current.play();

      // Start scanning
      stopScanRef.current = startContinuousScan(
        videoRef.current,
        (result) => {
          if (result.success && result.data) {
            const parsedData = parseProductQR(result.data);
            onScan(parsedData);
            handleClose();
          }
        },
        300
      );
    } catch (err) {
      setError("Помилка камери. Спробуйте ручне введення.");
      setIsScanning(false);
    }
  }, [onScan]);

  // Stop camera
  const stopCamera = React.useCallback(() => {
    if (stopScanRef.current) {
      stopScanRef.current();
      stopScanRef.current = null;
    }

    if (videoRef.current?.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }

    setIsScanning(false);
  }, []);

  // Handle close
  const handleClose = React.useCallback(() => {
    stopCamera();
    setManualInput("");
    setError(null);
    onOpenChange(false);
  }, [stopCamera, onOpenChange]);

  // Handle manual submit
  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualInput.trim()) {
      const parsedData = parseProductQR(manualInput.trim());
      onScan(parsedData);
      handleClose();
    }
  };

  // Cleanup on unmount
  React.useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  // Start camera when mode changes
  React.useEffect(() => {
    if (open && mode === "camera" && isCameraSupported) {
      startCamera();
    } else {
      stopCamera();
    }
  }, [open, mode, isCameraSupported, startCamera, stopCamera]);

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-4 border-b bg-slate-50/50">
          <DialogTitle className="flex items-center gap-3 text-lg">
            <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
              <QrCode className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <span className="block">Сканування QR/штрих-коду</span>
              <DialogDescription className="text-xs font-normal mt-0.5">
                Наведіть камеру на код або введіть дані вручну
              </DialogDescription>
            </div>
          </DialogTitle>
        </DialogHeader>

        {/* Content */}
        <div className="px-6 py-5 space-y-5">
          {/* Mode toggle */}
          <div className="flex gap-3 p-1 bg-slate-100 rounded-xl">
            <Button
              variant={mode === "camera" ? "default" : "ghost"}
              className={cn(
                "flex-1 gap-2 h-11 rounded-lg transition-all",
                mode === "camera"
                  ? "bg-white shadow-sm text-slate-900"
                  : "hover:bg-slate-200/50 text-slate-600"
              )}
              onClick={() => setMode("camera")}
              disabled={!isCameraSupported}
            >
              <Camera className="h-4 w-4" />
              Камера
            </Button>
            <Button
              variant={mode === "manual" ? "default" : "ghost"}
              className={cn(
                "flex-1 gap-2 h-11 rounded-lg transition-all",
                mode === "manual"
                  ? "bg-white shadow-sm text-slate-900"
                  : "hover:bg-slate-200/50 text-slate-600"
              )}
              onClick={() => setMode("manual")}
            >
              <Keyboard className="h-4 w-4" />
              Вручну
            </Button>
          </div>

          {/* Camera mode */}
          {mode === "camera" && (
            <div className="space-y-4">
              {!isCameraSupported ? (
                <div className="text-center py-12 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                  <Camera className="h-12 w-12 mx-auto mb-3 text-slate-300" />
                  <p className="font-medium text-slate-600">Камера не підтримується</p>
                  <p className="text-sm text-muted-foreground mt-1">Використайте ручне введення</p>
                </div>
              ) : (
                <div className="relative aspect-square bg-slate-900 rounded-xl overflow-hidden">
                  <video
                    ref={videoRef}
                    className="w-full h-full object-cover"
                    playsInline
                    muted
                  />

                  {/* Scanning overlay */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    {/* Corner markers */}
                    <div className="relative w-52 h-52">
                      {/* Top-left */}
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-white rounded-tl-lg" />
                      {/* Top-right */}
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-white rounded-tr-lg" />
                      {/* Bottom-left */}
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-white rounded-bl-lg" />
                      {/* Bottom-right */}
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-white rounded-br-lg" />
                      {/* Center line animation */}
                      <div className="absolute inset-x-2 top-1/2 h-0.5 bg-blue-400 animate-pulse" />
                    </div>
                  </div>

                  {/* Loading indicator */}
                  {isScanning && (
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Сканування...
                    </div>
                  )}

                  {/* Error message */}
                  {error && (
                    <div className="absolute bottom-4 left-4 right-4 bg-red-500 text-white px-4 py-3 rounded-xl text-sm text-center font-medium">
                      {error}
                    </div>
                  )}
                </div>
              )}

              <p className="text-xs text-center text-muted-foreground">
                Розташуйте код в центрі рамки для автоматичного сканування
              </p>
            </div>
          )}

          {/* Manual mode */}
          {mode === "manual" && (
            <form onSubmit={handleManualSubmit} className="space-y-4">
              <div className="space-y-2">
                <label
                  htmlFor="manual-code"
                  className="text-sm font-medium text-slate-700 block"
                >
                  SKU або штрих-код
                </label>
                <Input
                  id="manual-code"
                  type="text"
                  placeholder="Введіть код товару..."
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  autoFocus
                  className="h-12 text-base"
                />
                <p className="text-xs text-muted-foreground">
                  Введіть SKU або відскануйте штрих-код сканером
                </p>
              </div>
              <Button
                type="submit"
                className="w-full h-12 text-base bg-blue-600 hover:bg-blue-700"
                disabled={!manualInput.trim()}
              >
                Підтвердити
              </Button>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
