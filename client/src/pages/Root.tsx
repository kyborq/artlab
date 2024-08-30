import { ArtBoard } from "@/components";
import { useArtStore } from "@/store/useArtStore";
import { useEffect, useState } from "react";
import useWebSocket from "react-use-websocket";

const WS_URL = `ws://${window.location.hostname}:3024/api/ws`;

export const Root = () => {
  const { lastJsonMessage, sendJsonMessage } = useWebSocket<{
    action: string;
    data: any;
  }>(WS_URL, {
    share: false,
    shouldReconnect: () => true,
  });

  const [color, setColor] = useState<string>("black");
  const { setArts, arts } = useArtStore();

  useEffect(() => {
    if (lastJsonMessage && lastJsonMessage.action === "config") {
      setColor(lastJsonMessage.data.color);
    }

    if (lastJsonMessage && lastJsonMessage.action === "init") {
      setArts(lastJsonMessage.data);
    }

    if (lastJsonMessage && lastJsonMessage.action === "add") {
      setArts(lastJsonMessage.data);
    }
  }, [lastJsonMessage]);

  return (
    <>
      <ArtBoard
        penColor={color}
        drawings={arts}
        onDrawEnd={(line) => {
          sendJsonMessage(line);
        }}
      />
    </>
  );
};
