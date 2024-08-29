import { Elysia } from "elysia";
import { cron, Patterns } from "@elysiajs/cron";
import { Logestic } from "logestic";

import uniqolor from "uniqolor";

type TPoint = {
  x: number;
  y: number;
};

type TLine = {
  color: string;
  decay: Date;
  positions: TPoint[];
};

const drawings: TLine[] = [];

const removeExpiredLines = () => {
  const now = new Date();
  const filteredDrawings = drawings.filter((line) => line.decay > now);
  drawings.length = 0;
  drawings.push(...filteredDrawings);
};

const app = new Elysia({
  websocket: {
    publishToSelf: true,
  },
  prefix: "/api",
})
  .ws("/ws", {
    open(ws) {
      const clientId = ws.id;
      const colorHex = uniqolor(clientId, {
        saturation: [50, 70],
        lightness: [30, 60],
      });

      ws.send({
        action: "config",
        data: colorHex,
      });

      ws.subscribe("drawings");
      ws.publish("drawings", { action: "init", data: drawings });
    },
    message(ws, message) {
      drawings.push(message as TLine);
      ws.publish("drawings", { action: "add", data: drawings });
    },
    close(ws) {
      ws.unsubscribe("drawings");
    },
  })
  .get("/", () => "hello")
  .use(
    cron({
      name: "trash-collector",
      pattern: Patterns.everyMinute(),
      run: () => {
        removeExpiredLines();
      },
    })
  )
  .use(Logestic.preset("common"))
  .listen(3024);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
