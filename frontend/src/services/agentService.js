import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
const AGENT_ID = 'mumble-ai-coach';
const CONVERSATION_AGENT_ID = 'conversation-agent';

/**
 * Send message to Main Agent (orchestrator)
 * @param {string} message - User message
 * @param {string} jobId - Optional job identifier (mapped to AgentOS session_id)
 * @param {object} user - User object with base_language
 * @returns {Promise} Response from agent
 */
export const sendMessageToAgent = async (message, jobId = null, user = null) => {
  try {
    const formData = new FormData();
    formData.append('message', message);
    formData.append('stream', 'false');
    formData.append('monitor', 'true');

    console.log("jobId: ", jobId);

    if (jobId) {
      formData.append('session_id', jobId);
    }

    // Pass base_language as dependency for agent runtime injection
    if (user?.base_language) {
      formData.append('dependencies', JSON.stringify({
        base_language: user.base_language,
        job_id: jobId || undefined,
      }));
      console.log("Passing base_language dependency:", user.base_language);
    } else if (jobId) {
      formData.append('dependencies', JSON.stringify({
        job_id: jobId,
      }));
    }

    const response = await axios.post(
      `${BACKEND_URL}/teams/${AGENT_ID}/runs`,
      formData,
      {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 180000, // 3 minutes for agent delegation
      }
    );

    console.log("response: ", response)

    return {
      success: true,
      content: response.data.content || response.data.response || '',
      jobId: response.data.session_id || jobId,
      metrics: response.data.metrics,
      memberResponses: response.data.member_responses || [],
    };
  } catch (error) {
    console.error('Agent API error:', error);
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Failed to communicate with agent',
    };
  }
};

/**
 * Create new AgentOS job session
 * @returns {Promise} Job session data
 */
export const createAgentJob = async () => {
  try {
    const response = await axios.post(
      `${BACKEND_URL}/teams/${AGENT_ID}/sessions`,
      {},
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      success: true,
      jobId: response.data.session_id || response.data.id,
      data: response.data,
    };
  } catch (error) {
    console.error('Create job error:', error);
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Failed to create job',
    };
  }
};

/**
 * Get AgentOS job history
 * @param {string} jobId - AgentOS job ID (session_id)
 * @returns {Promise} Job history
 */
export const getAgentJobHistory = async (jobId) => {
  try {
    const response = await axios.get(
      `${BACKEND_URL}/teams/${AGENT_ID}/sessions/${jobId}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      success: true,
      messages: response.data.messages || [],
      data: response.data,
    };
  } catch (error) {
    console.error('Get job history error:', error);
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Failed to fetch job history',
    };
  }
};

/**
 * List all AgentOS jobs
 * @returns {Promise} List of jobs
 */
export const listAgentJobs = async () => {
  try {
    const response = await axios.get(
      `${BACKEND_URL}/teams/${AGENT_ID}/sessions`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    return {
      success: true,
      jobs: response.data.sessions || response.data || [],
    };
  } catch (error) {
    console.error('List jobs error:', error);
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Failed to list jobs',
    };
  }
};

/**
 * Send message with streaming response
 * @param {string} message - User message
 * @param {string} jobId - Optional AgentOS job ID (session_id)
 * @param {Function} onChunk - Callback for each stream chunk
 * @param {object} user - User object with base_language
 * @returns {Promise} Final response
 */
export const sendMessageToAgentStreaming = async (message, jobId, onChunk, user = null) => {
  try {
    const formData = new FormData();
    formData.append('message', message);
    formData.append('stream', 'true');
    formData.append('monitor', 'true');
    if (jobId) {
      formData.append('session_id', jobId);
    }

    // Pass base_language as dependency for agent runtime injection
    if (user?.base_language) {
      formData.append('dependencies', JSON.stringify({
        base_language: user.base_language,
        job_id: jobId || undefined,
      }));
      console.log("Passing base_language dependency (streaming):", user.base_language);
    } else if (jobId) {
      formData.append('dependencies', JSON.stringify({
        job_id: jobId,
      }));
    }

    // Get token from localStorage for authentication
    const token = localStorage.getItem('token');
    const headers = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${BACKEND_URL}/teams/${AGENT_ID}/runs`, {
      method: 'POST',
      headers: headers,
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    let fullContent = '';
    let finalJobId = jobId;
    let buffer = '';

    return new Promise((resolve, reject) => {
      const processStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();

            if (done) {
              resolve({
                success: true,
                content: fullContent,
                jobId: finalJobId,
              });
              break;
            }

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';

            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));

                  if (data.content) {
                    fullContent += data.content;
                    onChunk(data.content);
                  }

                  if (data.session_id) {
                    finalJobId = data.session_id;
                  }

                  if (data.done || data.event === 'agent_response_complete') {
                    resolve({
                      success: true,
                      content: fullContent,
                      jobId: finalJobId,
                    });
                    return;
                  }
                } catch (parseError) {
                  console.error('Parse error:', parseError);
                }
              }
            }
          }
        } catch (error) {
          reject({
            success: false,
            error: 'Streaming connection failed: ' + error.message,
          });
        }
      };

      processStream();

      setTimeout(() => {
        reader.cancel();
        resolve({
          success: true,
          content: fullContent,
          jobId: finalJobId,
        });
      }, 60000);
    });
  } catch (error) {
    console.error('Streaming error:', error);
    return {
      success: false,
      error: error.message || 'Failed to stream response',
    };
  }
};

// ============================================
// CONVERSATION AGENT - Direct Voice Interaction
// ============================================

/**
 * Create a Realtime session via Conversation Agent tool handoff
 * @param {string} jobId - Session ID for continuity
 * @param {object} user - User object with base_language
 * @param {object} context - Conversation context (topic, level, target language)
 * @returns {Promise} Realtime session payload
 */
export const createConversationRealtimeSession = async (
  jobId = null,
  user = null,
  context = {}
) => {
  try {
    const formData = new FormData();
    formData.append('message', 'Create a realtime conversation session.');
    formData.append('stream', 'false');
    formData.append('monitor', 'true');

    if (jobId) {
      formData.append('session_id', jobId);
    }

    if (user?.base_language || context) {
      formData.append('dependencies', JSON.stringify({
        base_language: user?.base_language || undefined,
        target_language: context.targetLanguage || user?.target_language || undefined,
        level: context.level || user?.level || undefined,
        topic: context.topic || undefined,
        job_id: jobId || undefined,
      }));
    }

    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'multipart/form-data',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await axios.post(
      `${BACKEND_URL}/agents/${CONVERSATION_AGENT_ID}/runs`,
      formData,
      { headers, timeout: 60000 }
    );

    const content = response.data.content ?? response.data.response ?? response.data;
    let sessionPayload = content;
    if (typeof content === 'string') {
      try {
        sessionPayload = JSON.parse(content);
      } catch (e) {
        sessionPayload = { raw: content };
      }
    }

    return {
      success: true,
      session: sessionPayload,
      sessionId: response.data.session_id || jobId,
    };
  } catch (error) {
    console.error('Realtime session error:', error);
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Failed to create realtime session',
    };
  }
};

/**
 * Negotiate WebRTC SDP with backend realtime endpoint
 * @param {string} sdpOffer - SDP offer from RTCPeerConnection
 * @returns {Promise} SDP answer
 */
export const negotiateRealtime = async (sdpOffer) => {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/sdp',
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const response = await fetch(`${BACKEND_URL}/api/realtime/negotiate`, {
    method: 'POST',
    headers,
    body: sdpOffer,
  });

  const rawText = await response.text();

  if (!response.ok) {
    throw new Error(`Realtime negotiate failed: ${response.status} ${rawText}`);
  }

  // Try JSON first, then fallback to raw SDP text
  try {
    const data = JSON.parse(rawText);
    if (data?.sdp) return data.sdp;
    if (data?.detail) {
      throw new Error(`Realtime negotiate error: ${data.detail}`);
    }
  } catch (e) {
    // Not JSON, treat as SDP
  }

  return rawText;
};


/**
 * Send message to Conversation Agent (direct voice interaction)
 * @param {string} message - Text message (optional if audio provided)
 * @param {string} audioBase64 - Base64 encoded audio data (optional)
 * @param {string} audioFormat - Audio format (wav, mp3, etc.)
 * @param {string} jobId - Session ID for conversation continuity
 * @param {object} user - User object with base_language
 * @returns {Promise} Response with text and optional audio
 */
export const sendMessageToConversationAgent = async (
  message,
  audioBase64 = null,
  audioFormat = 'wav',
  jobId = null,
  user = null
) => {
  try {
    const formData = new FormData();
    
    // Add text message
    if (message) {
      formData.append('message', message);
    }
    
    // Add audio if provided
    if (audioBase64) {
      formData.append('audio', JSON.stringify([{
        content: audioBase64,
        format: audioFormat,
      }]));
    }
    
    formData.append('stream', 'false');
    formData.append('monitor', 'true');
    
    // Use same session for conversation continuity
    if (jobId) {
      formData.append('session_id', jobId);
    }
    
    // Pass user context
    if (user?.base_language) {
      formData.append('dependencies', JSON.stringify({
        base_language: user.base_language,
        target_language: user.target_language || undefined,
        level: user.level || undefined,
        job_id: jobId || undefined,
      }));
    }
    
    // Get auth token
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'multipart/form-data',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await axios.post(
      `${BACKEND_URL}/agents/${CONVERSATION_AGENT_ID}/runs`,
      formData,
      {
        headers,
        timeout: 60000, // 1 minute for audio processing
      }
    );
    
    console.log('Conversation agent response:', response.data);
    
    return {
      success: true,
      content: response.data.content || '',
      audioContent: response.data.response_audio?.content || null,
      audioTranscript: response.data.response_audio?.transcript || null,
      sessionId: response.data.session_id || jobId,
    };
  } catch (error) {
    console.error('Conversation agent error:', error);
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Failed to communicate with conversation agent',
    };
  }
};

/**
 * Send audio message to Conversation Agent with streaming response
 * @param {string} message - Text message (optional)
 * @param {string} audioBase64 - Base64 encoded audio
 * @param {string} audioFormat - Audio format
 * @param {string} jobId - Session ID
 * @param {Function} onTextChunk - Callback for text chunks
 * @param {Function} onAudioChunk - Callback for audio chunks (base64)
 * @param {object} user - User object
 * @returns {Promise} Final response
 */
export const sendMessageToConversationAgentStreaming = async (
  message,
  audioBase64,
  audioFormat,
  jobId,
  onTextChunk,
  onAudioChunk,
  user = null
) => {
  try {
    const formData = new FormData();
    
    if (message) {
      formData.append('message', message);
    }
    
    if (audioBase64) {
      formData.append('audio', JSON.stringify([{
        content: audioBase64,
        format: audioFormat,
      }]));
    }
    
    formData.append('stream', 'true');
    formData.append('monitor', 'true');
    
    if (jobId) {
      formData.append('session_id', jobId);
    }
    
    if (user?.base_language) {
      formData.append('dependencies', JSON.stringify({
        base_language: user.base_language,
        target_language: user.target_language || undefined,
        level: user.level || undefined,
        job_id: jobId || undefined,
      }));
    }
    
    const token = localStorage.getItem('token');
    const headers = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${BACKEND_URL}/agents/${CONVERSATION_AGENT_ID}/runs`, {
      method: 'POST',
      headers,
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    
    let fullContent = '';
    let fullAudio = '';
    let finalSessionId = jobId;
    let buffer = '';
    
    return new Promise((resolve, reject) => {
      const processStream = async () => {
        try {
          while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
              resolve({
                success: true,
                content: fullContent,
                audioContent: fullAudio || null,
                sessionId: finalSessionId,
              });
              break;
            }
            
            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n');
            buffer = lines.pop() || '';
            
            for (const line of lines) {
              if (line.startsWith('data: ')) {
                try {
                  const data = JSON.parse(line.slice(6));
                  
                  // Handle text content
                  if (data.content) {
                    fullContent += data.content;
                    if (onTextChunk) onTextChunk(data.content);
                  }
                  
                  // Handle audio content
                  if (data.response_audio?.content) {
                    fullAudio += data.response_audio.content;
                    if (onAudioChunk) onAudioChunk(data.response_audio.content);
                  }
                  
                  if (data.session_id) {
                    finalSessionId = data.session_id;
                  }
                  
                  if (data.done || data.event === 'agent_response_complete') {
                    resolve({
                      success: true,
                      content: fullContent,
                      audioContent: fullAudio || null,
                      sessionId: finalSessionId,
                    });
                    return;
                  }
                } catch (parseError) {
                  console.error('Parse error:', parseError);
                }
              }
            }
          }
        } catch (error) {
          reject({
            success: false,
            error: 'Streaming connection failed: ' + error.message,
          });
        }
      };
      
      processStream();
      
      // Timeout after 2 minutes for audio conversations
      setTimeout(() => {
        reader.cancel();
        resolve({
          success: true,
          content: fullContent,
          audioContent: fullAudio || null,
          sessionId: finalSessionId,
        });
      }, 120000);
    });
  } catch (error) {
    console.error('Conversation streaming error:', error);
    return {
      success: false,
      error: error.message || 'Failed to stream conversation response',
    };
  }
};

/**
 * Convert audio blob to base64
 * @param {Blob} audioBlob - Audio blob from MediaRecorder
 * @returns {Promise<string>} Base64 encoded audio
 */
export const audioToBase64 = (audioBlob) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      // Remove data URL prefix to get pure base64
      const base64 = reader.result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(audioBlob);
  });
};

/**
 * Convert base64 audio to playable blob URL
 * @param {string} base64Audio - Base64 encoded audio
 * @param {string} mimeType - Audio MIME type
 * @returns {string} Blob URL for audio playback
 */
export const base64ToAudioUrl = (base64Audio, mimeType = 'audio/wav') => {
  const binaryString = atob(base64Audio);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  const blob = new Blob([bytes], { type: mimeType });
  return URL.createObjectURL(blob);
};
