/**
 * Conversation Invite Card
 * 
 * A full-width card that appears in chat when main agent
 * decides user should practice free conversation.
 */

import React from 'react';
import { MessageCircle, ChevronRight, Sparkles } from 'lucide-react';

const ConversationInviteCard = ({
  onClick,
  topic = 'Free conversation practice',
  level,
  targetLanguage,
  description,
}) => {
  return (
    <div 
      className="w-full rounded-2xl overflow-hidden cursor-pointer group transition-all hover:border-[#8FEC78]/40"
      onClick={onClick}
      style={{
        background: 'linear-gradient(135deg, rgba(143, 236, 120, 0.08) 0%, rgba(74, 144, 217, 0.08) 100%)',
        border: '1px solid rgba(143, 236, 120, 0.2)',
      }}
    >
      <div className="p-6">
        <div className="flex items-start justify-between gap-4">
          {/* Left side - Info */}
          <div className="flex items-start gap-4">
            {/* Icon */}
            <div 
              className="h-14 w-14 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{
                background: 'rgba(143, 236, 120, 0.15)',
                border: '1px solid rgba(143, 236, 120, 0.25)',
              }}
            >
              <MessageCircle size={24} className="text-[#8FEC78]" />
            </div>
            
            {/* Text */}
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="text-xs uppercase tracking-[0.2em] text-[#8FEC78]/80">
                  Conversation Practice
                </p>
                <Sparkles size={12} className="text-[#8FEC78]/60" />
              </div>
              <h3 className="text-lg font-semibold text-white">
                {topic}
              </h3>
              {description && (
                <p className="text-sm text-white/50 mt-1 max-w-md">
                  {description}
                </p>
              )}
              
              {/* Meta info */}
              <div className="flex items-center gap-3 mt-3">
                {targetLanguage && (
                  <span className="text-xs text-white/40 px-2 py-1 rounded-full bg-white/5">
                    {targetLanguage}
                  </span>
                )}
                {level && (
                  <span className="text-xs text-white/40 px-2 py-1 rounded-full bg-white/5">
                    {level}
                  </span>
                )}
                <span className="text-xs text-white/30">
                  Realtime voice conversation (WebRTC)
                </span>
              </div>
            </div>
          </div>
          
          {/* Right side - Action */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-[#8FEC78] opacity-0 group-hover:opacity-100 transition-opacity">
              Start
            </span>
            <div 
              className="h-10 w-10 rounded-full flex items-center justify-center transition-all group-hover:bg-[#8FEC78]/20"
              style={{
                background: 'rgba(143, 236, 120, 0.1)',
                border: '1px solid rgba(143, 236, 120, 0.2)',
              }}
            >
              <ChevronRight 
                size={18} 
                className="text-[#8FEC78] transition-transform group-hover:translate-x-0.5" 
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom highlight bar */}
      <div 
        className="h-1 w-full transition-all group-hover:opacity-100 opacity-50"
        style={{
          background: 'linear-gradient(90deg, rgba(143, 236, 120, 0.5) 0%, rgba(74, 144, 217, 0.3) 100%)',
        }}
      />
    </div>
  );
};

export default ConversationInviteCard;
