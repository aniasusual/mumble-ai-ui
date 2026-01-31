import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

const SidePanel = ({ isOpen, onClose, children, title, width = "420px" }) => {
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
      {/* Backdrop - More Opaque */}
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        style={{
          animation: "fadeIn 0.25s ease-out",
        }}
        onClick={onClose}
      />

      {/* Side Panel - Transparent Glass Effect */}
      <div
        className="fixed z-50 flex flex-col shadow-2xl rounded-2xl overflow-hidden"
        style={{
          top: "16px",
          right: "16px",
          bottom: "16px",
          width: "calc(100% - 32px)",
          maxWidth: width,
          background: "#0f1115",
          opacity: 1,
          border: "1px solid rgba(255, 255, 255, 0.08)",
          boxShadow: "0 24px 60px rgba(0, 0, 0, 0.6)",
          animation: "slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* Header - Minimal */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b flex-shrink-0"
          style={{ borderColor: "rgba(255, 255, 255, 0.08)" }}
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
            transform: translateX(calc(100% + 16px));
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        /* Mobile adjustments */
        @media (max-width: 768px) {
          .fixed.z-50 {
            top: 0 !important;
            right: 0 !important;
            bottom: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            border-radius: 0 !important;
          }
        }
      `}</style>
    </>
  );
};

export default SidePanel;
