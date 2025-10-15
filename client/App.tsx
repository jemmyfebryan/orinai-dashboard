import "./global.css";

import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import AgentEditor from "./pages/AgentEditor";
import AgentAssignment from "./pages/AgentAssignment";
import ChatPage from "./pages/ChatPage";
import NotificationSetting from "./pages/NotificationSetting";
import Layout from "./components/layout/Layout";

const queryClient = new QueryClient();

function isAuthed() {
  // Cookie authentication is handled automatically by the browser
  // We'll assume authenticated if the user reached this point
  return true;
}

function Protected({ children }: { children: React.ReactNode }) {
  if (!isAuthed()) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <Protected>
                <Layout>
                  <Index />
                </Layout>
              </Protected>
            }
          />
          <Route
            path="/agents/:id"
            element={
              <Protected>
                <Layout>
                  <AgentEditor />
                </Layout>
              </Protected>
            }
          />
          <Route
            path="/agents/new"
            element={
              <Protected>
                <Layout>
                  <AgentEditor />
                </Layout>
              </Protected>
            }
          />
          <Route
            path="/assign"
            element={
              <Protected>
                <Layout>
                  <AgentAssignment />
                </Layout>
              </Protected>
            }
          />
          <Route
            path="/chat"
            element={
              <Protected>
                <Layout>
                  <ChatPage />
                </Layout>
              </Protected>
            }
          />
          <Route
            path="/notification_setting"
            element={
              <Protected>
                <Layout>
                  <NotificationSetting />
                </Layout>
              </Protected>
            }
          />
          <Route
            path="/about"
            element={
              <Protected>
                <Layout>
                  <div className="p-6">About ORIN AI Chat Dashboard</div>
                </Layout>
              </Protected>
            }
          />
          <Route
            path="/how-it-works"
            element={
              <Protected>
                <Layout>
                  <div className="p-6">How it Works</div>
                </Layout>
              </Protected>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

createRoot(document.getElementById("root")!).render(<App />);
