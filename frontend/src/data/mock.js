// Mock data for Mumble AI Landing Page

export const mockWaitlistData = {
  entries: [],
  
  addToWaitlist: (email) => {
    const newEntry = {
      id: Date.now(),
      email,
      timestamp: new Date().toISOString()
    };
    mockWaitlistData.entries.push(newEntry);
    return newEntry;
  },
  
  checkEmail: (email) => {
    return mockWaitlistData.entries.some(entry => entry.email === email);
  }
};

// AI Tutor introduction - personal and engaging
export const welcomeConfig = {
  tutorName: "Mia",
  introMessage: `Hi! I'm Mia, your personal AI language tutor. I'll guide you from your first word to fluent conversations. No rigid lessons, just natural learning, tailored to you. Let's make you fluent.`,
  delay: 800,
  voice: "nova", // Energetic, upbeat
  speed: 1.0,
};

// App information - minimalistic
export const appInfo = {
  name: "mumble",
  tagline: "Learn languages naturally",
  description: "Your AI tutor. From first words to fluent conversations.",
};
