import { createBrowserRouter } from "react-router-dom";

import { Root } from "./pages/Root";

export const router = createBrowserRouter([
  {
    index: true,
    element: <Root />,
  },
]);
