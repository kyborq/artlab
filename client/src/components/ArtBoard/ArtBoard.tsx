import { useRef, useEffect, useCallback, useState } from "react";
import styles from "./ArtBoard.module.css";
import { TLine } from "@/store/useArtStore";
import { addHours } from "date-fns";
import { simplifyLine } from "@/utils/lines";

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
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [recentlyPanned, setRecentlyPanned] = useState(false);

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

  const drawLines = useCallback(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const context = canvas.getContext("2d");
      if (context) {
        context.clearRect(0, 0, canvas.width, canvas.height);
        context.save();
        context.translate(offset.x, offset.y);
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
        context.restore();
      }
    }
  }, [lines, offset]);

  useEffect(() => {
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
    return () => {
      window.removeEventListener("resize", resizeCanvas);
    };
  }, []);

  useEffect(() => {
    drawLines();
  }, [drawLines]);

  const startDrawing = useCallback(
    (event: MouseEvent | TouchEvent) => {
      if (!canvasRef.current || isPanning || recentlyPanned) {
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
            x: clientX - offset.x,
            y: clientY - offset.y,
          },
        ],
      };

      const draw = (e: MouseEvent | TouchEvent) => {
        const { clientX, clientY } = (e as TouchEvent).touches
          ? (e as TouchEvent).touches[0]
          : (e as MouseEvent);

        newLine.positions.push({
          x: clientX - offset.x,
          y: clientY - offset.y,
        });

        context.save();
        context.translate(offset.x, offset.y);
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
        context.restore();
      };

      const stop = () => {
        canvasRef.current?.removeEventListener("mousemove", draw);
        canvasRef.current?.removeEventListener("mouseup", stop);
        canvasRef.current?.removeEventListener("mouseleave", stop);
        canvasRef.current?.removeEventListener("touchmove", draw);
        canvasRef.current?.removeEventListener("touchend", stop);

        const simplifiedPositions = simplifyLine(newLine.positions, 2);
        const optimizedLine = { ...newLine, positions: simplifiedPositions };

        setLines((prevLines) => [...prevLines, optimizedLine]);
        onDrawEnd && onDrawEnd(optimizedLine);
      };

      canvasRef.current.addEventListener("mousemove", draw);
      canvasRef.current.addEventListener("mouseup", stop);
      canvasRef.current.addEventListener("mouseleave", stop);
      canvasRef.current.addEventListener("touchmove", draw);
      canvasRef.current.addEventListener("touchend", stop);
    },
    [onDrawEnd, penColor, isPanning, offset, recentlyPanned]
  );

  const removeLine = (x: number, y: number) => {
    setLines((prevLines) =>
      prevLines.filter((line) => {
        const isLineRemoved = line.positions.some((point) => {
          return (
            Math.abs(point.x - (x + offset.x)) < 10 &&
            Math.abs(point.y - (y + offset.y)) < 10
          );
        });
        return !isLineRemoved;
      })
    );
  };

  const handleRightClick = (event: MouseEvent) => {
    event.preventDefault();
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      removeLine(x, y);
    }
  };

  const startPanning = useCallback(
    (event: MouseEvent | TouchEvent) => {
      if (
        (event as MouseEvent).button === 1 ||
        (event as TouchEvent).touches?.length === 2
      ) {
        setIsPanning(true);
        const { clientX, clientY } = (event as TouchEvent).touches
          ? (event as TouchEvent).touches[0]
          : (event as MouseEvent);
        setPanStart({ x: clientX - offset.x, y: clientY - offset.y });
      }
    },
    [offset]
  );

  const pan = useCallback(
    (event: MouseEvent | TouchEvent) => {
      if (isPanning) {
        const { clientX, clientY } = (event as TouchEvent).touches
          ? (event as TouchEvent).touches[0]
          : (event as MouseEvent);
        setOffset({
          x: clientX - panStart.x,
          y: clientY - panStart.y,
        });
      }
    },
    [isPanning, panStart]
  );

  const stopPanning = useCallback(() => {
    setIsPanning(false);
    setRecentlyPanned(true);
    setTimeout(() => setRecentlyPanned(false), 100);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const handleMouseDown = (event: MouseEvent) => {
        if (event.button === 1) {
          startPanning(event);
        } else {
          startDrawing(event);
        }
      };

      const handleTouchStart = (event: TouchEvent) => {
        if (event.touches.length === 2) {
          startPanning(event);
        } else {
          startDrawing(event);
        }
      };

      canvas.addEventListener("mousedown", handleMouseDown);
      canvas.addEventListener("touchstart", handleTouchStart);
      canvas.addEventListener("contextmenu", handleRightClick);
      canvas.addEventListener("mousemove", pan);
      canvas.addEventListener("touchmove", pan);
      canvas.addEventListener("mouseup", stopPanning);
      canvas.addEventListener("mouseleave", stopPanning);
      canvas.addEventListener("touchend", stopPanning);

      return () => {
        if (canvas) {
          canvas.removeEventListener("mousedown", handleMouseDown);
          canvas.removeEventListener("touchstart", handleTouchStart);
          canvas.removeEventListener("contextmenu", handleRightClick);
          canvas.removeEventListener("mousemove", pan);
          canvas.removeEventListener("touchmove", pan);
          canvas.removeEventListener("mouseup", stopPanning);
          canvas.removeEventListener("mouseleave", stopPanning);
          canvas.removeEventListener("touchend", stopPanning);
        }
      };
    }
  }, [startDrawing, startPanning, pan, stopPanning, recentlyPanned]);

  return (
    <canvas
      ref={canvasRef}
      className={styles.ArtBoard}
      width={window.innerWidth}
      height={window.innerHeight}
    />
  );
};
