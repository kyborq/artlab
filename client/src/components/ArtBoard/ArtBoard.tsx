import { useRef, useEffect, useCallback, useState } from "react";
import styles from "./ArtBoard.module.css";
import { TLine } from "@/store/useArtStore";
import { addHours } from "date-fns";

type Props = {
  penColor: string;
  drawings: Array<TLine>;
  onDrawStart?: () => void;
  onDrawing?: () => void;
  onDrawEnd?: (lines: TLine) => void;
};

export const ArtBoard = ({ drawings, penColor, onDrawEnd }: Props) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [lines, setLines] = useState<Array<TLine>>(drawings);

  const resizeCanvas = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }
  };

  useEffect(() => {
    setLines(drawings);
  }, [drawings]);

  const drawLines = () => {
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext("2d");
      if (context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        lines.forEach((line) => {
          context.lineWidth = 4;
          context.strokeStyle = line.color;
          context.lineJoin = "round";
          context.beginPath();
          line.positions.forEach((point, index) => {
            if (index === 0) {
              context.moveTo(point.x, point.y);
            } else {
              context.lineTo(point.x, point.y);
            }
          });
          context.stroke();
          context.closePath();
        });
      }
    }
  };

  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  useEffect(() => {
    drawLines();
  }, [lines]);

  const startDrawing = useCallback(
    (event: MouseEvent | TouchEvent) => {
      if (!canvasRef.current) {
        return;
      }

      const context = canvasRef.current.getContext("2d");
      if (!context) {
        return;
      }

      const { clientX, clientY } = (event as TouchEvent).touches
        ? (event as TouchEvent).touches[0]
        : (event as MouseEvent);

      const newLine: TLine = {
        color: penColor,
        decay: addHours(new Date(), 4),
        positions: [
          {
            x: clientX,
            y: clientY,
          },
        ],
      };

      const draw = (e: MouseEvent | TouchEvent) => {
        const { clientX, clientY } = (e as TouchEvent).touches
          ? (e as TouchEvent).touches[0]
          : (e as MouseEvent);

        newLine.positions.push({
          x: clientX,
          y: clientY,
        });

        context.lineWidth = 4;
        context.strokeStyle = newLine.color;
        context.lineJoin = "round";
        context.beginPath();
        context.moveTo(
          newLine.positions[newLine.positions.length - 2].x,
          newLine.positions[newLine.positions.length - 2].y
        );
        context.lineTo(
          newLine.positions[newLine.positions.length - 1].x,
          newLine.positions[newLine.positions.length - 1].y
        );
        context.stroke();
        context.closePath();
      };

      const stop = () => {
        canvasRef.current?.removeEventListener("mousemove", draw);
        canvasRef.current?.removeEventListener("mouseup", stop);
        canvasRef.current?.removeEventListener("mouseleave", stop);
        canvasRef.current?.removeEventListener("touchmove", draw);
        canvasRef.current?.removeEventListener("touchend", stop);
        setLines((prevLines) => [...prevLines, newLine]);
        onDrawEnd && onDrawEnd(newLine);
      };

      canvasRef.current.addEventListener("mousemove", draw);
      canvasRef.current.addEventListener("mouseup", stop);
      canvasRef.current.addEventListener("mouseleave", stop);
      canvasRef.current.addEventListener("touchmove", draw);
      canvasRef.current.addEventListener("touchend", stop);
    },
    [onDrawEnd, penColor]
  );

  const removeLine = (x: number, y: number) => {
    setLines((prevLines) =>
      prevLines.filter((line) => {
        const isLineRemoved = line.positions.some((point) => {
          return Math.abs(point.x - x) < 10 && Math.abs(point.y - y) < 10;
        });
        return !isLineRemoved;
      })
    );
  };

  const handleRightClick = (event: MouseEvent) => {
    event.preventDefault(); // Prevent the default context menu from appearing
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      removeLine(x, y);
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.addEventListener("mousedown", startDrawing);
      canvas.addEventListener("touchstart", startDrawing);
      canvas.addEventListener("contextmenu", handleRightClick); // Add right-click handler
    }
    return () => {
      if (canvas) {
        canvas.removeEventListener("mousedown", startDrawing);
        canvas.removeEventListener("touchstart", startDrawing);
        canvas.removeEventListener("contextmenu", handleRightClick); // Clean up right-click handler
      }
    };
  }, [startDrawing]);

  return (
    <canvas
      ref={canvasRef}
      className={styles.ArtBoard}
      width={window.innerWidth}
      height={window.innerHeight}
    />
  );
};
