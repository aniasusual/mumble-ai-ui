import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const SidePanel = ({ isOpen, onClose, children, title, width = "500px" }) => {
  // Close on escape key
  React.useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    
    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop - Minimal */}
      <div
        className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
        style={{
          animation: "fadeIn 0.25s ease-out",
        }}
        onClick={onClose}
      />

      {/* Side Panel - Matching Product Style */}
      <div
        className="fixed top-0 right-0 bottom-0 z-50 flex flex-col shadow-2xl"
        style={{
          width: width,
          background: "rgba(10, 10, 10, 0.95)",
          backdropFilter: "blur(32px)",
          WebkitBackdropFilter: "blur(32px)",
          borderLeft: "1px solid rgba(255, 255, 255, 0.08)",
          animation: "slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Header - Minimal */}
        <div
          className="flex items-center justify-between px-8 py-5 border-b"
          style={{ borderColor: "rgba(255, 255, 255, 0.06)" }}
        >
          <h2 className="text-lg font-medium text-white">{title}</h2>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg flex items-center justify-center transition-all hover:bg-white/5"
            style={{ color: "rgba(255, 255, 255, 0.5)" }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content - Scrollable */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </>
  );
};

export default SidePanel;
