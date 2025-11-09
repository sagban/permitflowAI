import { AgentResponse, SessionData, RunAgentRequest, AgentExecutionEvent } from '@/types';

// In development, always use relative URLs to leverage Vite proxy
// In production, use the full API base URL from env or default
// IMPORTANT: In dev mode, we ignore VITE_API_BASE_URL and use empty string to trigger proxy
const API_BASE_URL = import.meta.env.DEV 
  ? ''  // Empty string = relative URL, which triggers Vite proxy
  : (import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000');
const APP_NAME = import.meta.env.VITE_APP_NAME || 'sequential-agent';
const AUTH_TOKEN = import.meta.env.VITE_AUTH_TOKEN || '';

// Generate or retrieve user_id and session_id
const getUserId = (): string => {
  let userId = localStorage.getItem('permitflow_user_id');
  if (!userId) {
    userId = `user_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
    localStorage.setItem('permitflow_user_id', userId);
  }
  return userId;
};

const getSessionId = (workOrderId: string): string => {
  const key = `permitflow_session_${workOrderId}`;
  let sessionId = localStorage.getItem(key);
  if (!sessionId) {
    sessionId = `session_${workOrderId}_${Date.now()}`;
    localStorage.setItem(key, sessionId);
  }
  return sessionId;
};

const getHeaders = () => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  if (AUTH_TOKEN) {
    headers['Authorization'] = `Bearer ${AUTH_TOKEN}`;
  }
  return headers;
};

export const api = {
  checkSessionExists: async (
    userId: string,
    sessionId: string
  ): Promise<boolean> => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/apps/${APP_NAME}/users/${userId}/sessions/${sessionId}`,
        {
          method: 'GET',
          headers: getHeaders(),
        }
      );
      return response.ok;
    } catch {
      return false;
    }
  },

  createOrUpdateSession: async (
    userId: string,
    sessionId: string,
    sessionData: SessionData = {}
  ): Promise<void> => {
    const response = await fetch(
      `${API_BASE_URL}/apps/${APP_NAME}/users/${userId}/sessions/${sessionId}`,
      {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify({
          preferred_language: 'English',
          visit_count: 1,
          ...sessionData,
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || `Failed to create/update session: ${response.status}`);
    }
  },

  runAgent: async (
    userId: string,
    sessionId: string,
    prompt: string,
    streaming: boolean = false,
    onStreamEvent?: (event: AgentExecutionEvent) => void
  ): Promise<AgentExecutionEvent[]> => {
    const requestBody: RunAgentRequest = {
      app_name: APP_NAME,
      user_id: userId,
      session_id: sessionId,
      new_message: {
        role: 'user',
        parts: [{ text: prompt }],
      },
      streaming,
    };

    const response = await fetch(`${API_BASE_URL}/run_sse`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error || `Failed to run agent: ${response.status}`);
    }

    if (streaming) {
      // Handle SSE streaming
      return api.handleSSEStream(response, onStreamEvent);
    }

    return response.json();
  },

  handleSSEStream: async (
    response: Response,
    onEvent?: (event: AgentExecutionEvent) => void
  ): Promise<AgentExecutionEvent[]> => {
    const events: AgentExecutionEvent[] = [];
    const reader = response.body?.getReader();
    const decoder = new TextDecoder();

    if (!reader) {
      throw new Error('Response body is not readable');
    }

    let buffer = '';

    try {
      while (true) {
        const { done, value } = await reader.read();
        
        if (done) {
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || ''; // Keep incomplete line in buffer

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = line.slice(6); // Remove 'data: ' prefix
              if (data.trim()) {
                const event: AgentExecutionEvent = JSON.parse(data);
                events.push(event);
                onEvent?.(event);
              }
            } catch (e) {
              console.warn('Failed to parse SSE event:', line, e);
            }
          }
        }
      }

      // Process any remaining data in buffer
      if (buffer.trim()) {
        const lines = buffer.split('\n');
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const data = line.slice(6);
              if (data.trim()) {
                const event: AgentExecutionEvent = JSON.parse(data);
                events.push(event);
                onEvent?.(event);
              }
            } catch (e) {
              console.warn('Failed to parse SSE event:', line, e);
            }
          }
        }
      }
    } finally {
      reader.releaseLock();
    }

    return events;
  },

  executeSequentialAgent: async (
    workOrderId: string,
    onStreamEvent?: (event: AgentExecutionEvent) => void
  ): Promise<AgentResponse> => {
    const userId = getUserId();
    const sessionId = getSessionId(workOrderId);
    const prompt = `Generate permits for work order ${workOrderId}`;

    // Step 1: Check if session exists, then create or update
    const sessionExists = await api.checkSessionExists(userId, sessionId);
    if (!sessionExists) {
      // Create new session
      await api.createOrUpdateSession(userId, sessionId, {
        workOrderId,
        lastAccessed: new Date().toISOString(),
      });
    }
    // If session exists, we can optionally update it, but it's not required
    // The session will be used as-is for the agent execution

    // Step 2: Run the agent with streaming enabled
    const events = await api.runAgent(userId, sessionId, prompt, true, onStreamEvent);

    // Parse the agent response from execution events
    // Look for structured data in the events - check both data field and content.parts
    let structuredResponse: any = null;

    // First, try to find structured data in event.data
    for (const event of events) {
      if (event.data && typeof event.data === 'object') {
        if (event.data.hazards || event.data.permits) {
          structuredResponse = event.data;
          break;
        }
      }
    }

    // If not found, try to extract from content.parts (text that might contain JSON)
    if (!structuredResponse) {
      for (const event of events) {
        if (event.content?.parts) {
          for (const part of event.content.parts) {
            if (part.text) {
              // Try to parse JSON from text
              try {
                const parsed = JSON.parse(part.text);
                if (parsed.hazards || parsed.permits) {
                  structuredResponse = parsed;
                  break;
                }
              } catch {
                // Not JSON, continue
              }
            }
          }
        }
        if (structuredResponse) break;
      }
    }

    // If still not found, check the last event's text content
    if (!structuredResponse) {
      const lastEvent = events[events.length - 1];
      if (lastEvent?.content?.parts) {
        for (const part of lastEvent.content.parts) {
          if (part.text) {
            try {
              const parsed = JSON.parse(part.text);
              if (parsed.hazards || parsed.permits) {
                structuredResponse = parsed;
                break;
              }
            } catch {
              // Not JSON
            }
          }
        }
      }
    }

    if (structuredResponse) {
      // Set initial status as 'Draft' for all permits if not provided
      const permits = (structuredResponse.permits || []).map((permit: any) => ({
        ...permit,
        status: permit.status || 'Draft',
      }));

      return {
        workOrderId,
        hazards: structuredResponse.hazards || [],
        permits,
        validations: structuredResponse.validations || [],
        pdfLinks: structuredResponse.pdfLinks || [],
        runMeta: structuredResponse.runMeta || {
          policyVersion: 'v1.0',
          ragSnapshot: new Date().toISOString(),
        },
      };
    }

    throw new Error('Could not parse agent response. Expected structured data with hazards and permits.');
  },
};

