"use client";

import { useRef, useEffect, useState } from "react";
import SignaturePadLib from "signature_pad";
import { Eraser, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SignaturePadProps {
  onSignatureChange: (data: string | null) => void;
  width?: number;
  height?: number;
}

export function SignaturePad({
  onSignatureChange,
  width = 500,
  height = 200,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const signaturePadRef = useRef<SignaturePadLib | null>(null);
  const [isEmpty, setIsEmpty] = useState(true);

  useEffect(() => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ratio = Math.max(window.devicePixelRatio || 1, 1);
      canvas.width = canvas.offsetWidth * ratio;
      canvas.height = canvas.offsetHeight * ratio;
      canvas.getContext("2d")?.scale(ratio, ratio);

      signaturePadRef.current = new SignaturePadLib(canvas, {
        backgroundColor: "rgb(255, 255, 255)",
        penColor: "rgb(0, 0, 0)",
      });

      signaturePadRef.current.addEventListener("endStroke", () => {
        setIsEmpty(signaturePadRef.current?.isEmpty() ?? true);
        if (signaturePadRef.current && !signaturePadRef.current.isEmpty()) {
          onSignatureChange(signaturePadRef.current.toDataURL("image/png"));
        }
      });
    }

    return () => {
      signaturePadRef.current?.off();
    };
  }, []);

  const clear = () => {
    signaturePadRef.current?.clear();
    setIsEmpty(true);
    onSignatureChange(null);
  };

  const undo = () => {
    if (signaturePadRef.current) {
      const data = signaturePadRef.current.toData();
      if (data.length > 0) {
        data.pop();
        signaturePadRef.current.fromData(data);
        setIsEmpty(signaturePadRef.current.isEmpty());
        if (signaturePadRef.current.isEmpty()) {
          onSignatureChange(null);
        } else {
          onSignatureChange(signaturePadRef.current.toDataURL("image/png"));
        }
      }
    }
  };

  return (
    <div className="space-y-2">
      <div className="relative rounded-lg border-2 border-dashed bg-white">
        <canvas
          ref={canvasRef}
          className="w-full cursor-crosshair touch-none"
          style={{ height: `${height}px` }}
        />
        {isEmpty && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <p className="text-sm text-gray-400">Sign here</p>
          </div>
        )}
      </div>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={undo}
          disabled={isEmpty}
        >
          <RotateCcw className="mr-1 h-3 w-3" />
          Undo
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={clear}
          disabled={isEmpty}
        >
          <Eraser className="mr-1 h-3 w-3" />
          Clear
        </Button>
      </div>
    </div>
  );
}
