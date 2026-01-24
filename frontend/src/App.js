import React from "react";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "./context/AuthContext";
import ProtectedRoute from "./components/ProtectedRoute";
import LandingPage from "./pages/LandingPage";
import SignInPage from "./pages/SignInPage";
import SignUpPage from "./pages/SignUpPage";
import SessionsPage from "./pages/SessionsPage";
import ChatPage from "./pages/ChatPage";
import ChatHistoryPage from "./pages/ChatHistoryPage";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AuthProvider>
          <Toaster 
            position="top-center" 
            theme="dark"
            richColors 
            toastOptions={{
              style: {
                borderRadius: '9999px',
                padding: '12px 20px',
                background: 'rgba(255, 255, 255, 0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                color: '#fff',
              },
            }}
          />
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/signin" element={<SignInPage />} />
            <Route path="/signup" element={<SignUpPage />} />
            <Route 
              path="/sessions" 
              element={
                <ProtectedRoute>
                  <SessionsPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/sessions/:sessionId/chat" 
              element={
                <ProtectedRoute>
                  <ChatPage />
                </ProtectedRoute>
              } 
            />
            <Route 
              path="/sessions/:sessionId/history" 
              element={
                <ProtectedRoute>
                  <ChatHistoryPage />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </div>
  );
}

export default App;
