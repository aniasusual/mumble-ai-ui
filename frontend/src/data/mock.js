// Mock data for Mumble AI Landing Page

export const mockWaitlistData = {
  // Simulated waitlist entries
  entries: [],
  
  // Add to waitlist (mock function)
  addToWaitlist: (email) => {
    const newEntry = {
      id: Date.now(),
      email,
      timestamp: new Date().toISOString()
    };
    mockWaitlistData.entries.push(newEntry);
    return newEntry;
  },
  
  // Check if email exists
  checkEmail: (email) => {
    return mockWaitlistData.entries.some(entry => entry.email === email);
  }
};

// Welcome message configuration
export const welcomeConfig = {
  message: "Welcome to Mumble AI. Your playground to learn anything. Start with learning languages.",
  delay: 1000, // Delay before speaking (ms)
  rate: 0.9, // Speech rate
  pitch: 1, // Speech pitch
};

// App information
export const appInfo = {
  name: "Mumble AI",
  tagline: "Your playground to learn anything",
  subtitle: "Start with learning languages",
  description: "A multi-agent AI system that acts as your personal language tutor. From planning your curriculum to making you fluent.",
  features: [
    "Personalized curriculum planning",
    "Adaptive learning paths",
    "Real-time conversation practice"
  ]
};
