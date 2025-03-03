import { createBrowserRouter, RouterProvider } from "react-router";
import HomePage from "./pages/home/home";

const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
  },
]);

export type AppRouterProps = {};
export const AppRouter = ({}: AppRouterProps) => {
  return <RouterProvider router={router}></RouterProvider>;
};
