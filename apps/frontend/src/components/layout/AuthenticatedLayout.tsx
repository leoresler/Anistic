import { Outlet } from "react-router-dom";

import { RouteProgressBar } from "../navigation/RouteProgressBar";
import { ScrollToTop } from "../navigation/ScrollToTop";
import { Footer } from "./Footer";
import { Sidebar } from "./Sidebar";

export const AuthenticatedLayout = () => (
  <div className="grain flex min-h-screen bg-anime-main text-cream-primary">
    <ScrollToTop />
    <RouteProgressBar />
    <Sidebar />
    <main className="relative z-10 min-w-0 flex-1 pl-20">
      <Outlet />
      {/* <Footer /> */}
    </main>
  </div>
);
