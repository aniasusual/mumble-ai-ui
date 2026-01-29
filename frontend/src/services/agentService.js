import axios from 'axios';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
const AGENT_ID = 'mumble-ai-coach';

/**
 * Send message to Main Agent (orchestrator)
 * @param {string} message - User message
 * @param {string} sessionId - Optional AgentOS session ID for continuity
 * @param {object} user - User object with base_language
 * @returns {Promise} Response from agent
 */
export const sendMessageToAgent = async (message, sessionId = null, user = null) => {
  try {
    const formData = new FormData();
    formData.append('message', message);
    formData.append('stream', 'false');
    formData.append('monitor', 'true');

    console.log("sessionId: ", sessionId)

    if (sessionId) {
      formData.append('session_id', sessionId);
    }

    // Pass base_language as dependency for agent runtime injection
    if (user?.base_language) {
      formData.append('dependencies', JSON.stringify({
        base_language: user.base_language
      }));
      console.log("Passing base_language dependency:", user.base_language);
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
      sessionId: response.data.session_id || sessionId,
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
 * Create new AgentOS session
 * @returns {Promise} Session data
 */
export const createAgentSession = async () => {
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
      sessionId: response.data.session_id || response.data.id,
      data: response.data,
    };
  } catch (error) {
    console.error('Create session error:', error);
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Failed to create session',
    };
  }
};

/**
 * Get AgentOS session history
 * @param {string} sessionId - AgentOS session ID
 * @returns {Promise} Session history
 */
export const getAgentSessionHistory = async (sessionId) => {
  try {
    const response = await axios.get(
      `${BACKEND_URL}/teams/${AGENT_ID}/sessions/${sessionId}`,
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
    console.error('Get session history error:', error);
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Failed to fetch session history',
    };
  }
};

/**
 * List all AgentOS sessions
 * @returns {Promise} List of sessions
 */
export const listAgentSessions = async () => {
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
      sessions: response.data.sessions || response.data || [],
    };
  } catch (error) {
    console.error('List sessions error:', error);
    return {
      success: false,
      error: error.response?.data?.detail || error.message || 'Failed to list sessions',
    };
  }
};

/**
 * Send message with streaming response
 * @param {string} message - User message
 * @param {string} sessionId - Optional AgentOS session ID
 * @param {Function} onChunk - Callback for each stream chunk
 * @param {object} user - User object with base_language
 * @returns {Promise} Final response
 */
export const sendMessageToAgentStreaming = async (message, sessionId, onChunk, user = null) => {
  try {
    const formData = new FormData();
    formData.append('message', message);
    formData.append('stream', 'true');
    formData.append('monitor', 'true');
    if (sessionId) {
      formData.append('session_id', sessionId);
    }

    // Pass base_language as dependency for agent runtime injection
    if (user?.base_language) {
      formData.append('dependencies', JSON.stringify({
        base_language: user.base_language
      }));
      console.log("Passing base_language dependency (streaming):", user.base_language);
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
    let finalSessionId = sessionId;
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

                  if (data.content) {
                    fullContent += data.content;
                    onChunk(data.content);
                  }

                  if (data.session_id) {
                    finalSessionId = data.session_id;
                  }

                  if (data.done || data.event === 'agent_response_complete') {
                    resolve({
                      success: true,
                      content: fullContent,
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

      setTimeout(() => {
        reader.cancel();
        resolve({
          success: true,
          content: fullContent,
          sessionId: finalSessionId,
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
