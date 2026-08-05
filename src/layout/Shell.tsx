import { Outlet } from "react-router";
import { Toast } from "../ui/Feedback";
import { Sidebar } from "./Sidebar";

export function Shell() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-canvas">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Outlet />
      </div>
      <Toast />
    </div>
  );
}
