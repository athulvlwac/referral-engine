import { RouterProvider } from "react-router-dom";
import { appRouter } from "@/app/router";

export const App = () => {
  return <RouterProvider router={appRouter} />;
};

