import { http, HttpResponse } from 'msw';
import type { WorkflowNodeData } from '../types';

export const handlers = [
  // GET /automations: return a static JSON array of available automated actions
  http.get('/automations', () => {
    return HttpResponse.json([
      { id: 'send_email', name: 'Send Email', requiredParams: ['recipient', 'subject', 'body'] },
      { id: 'generate_document', name: 'Generate Document', requiredParams: ['template_id', 'data_source'] },
      { id: 'slack_notification', name: 'Slack Notification', requiredParams: ['channel', 'message'] },
      { id: 'schedule_meeting', name: 'Schedule Meeting', requiredParams: ['participants', 'duration', 'topic'] },
    ]);
  }),

  // POST /simulate: intercept the serialized graph JSON and return a mock execution log
  http.post('/simulate', async ({ request }) => {
    let payload;
    try {
      // Define the expected network payload shape cleanly, no UI libraries attached
      payload = await request.json() as {
        nodes: { id: string; type: string; data: WorkflowNodeData }[];
        edges: { id: string; source: string; target: string }[]
      };
    } catch {
      return HttpResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    const { nodes = [], edges = [] } = payload;

    // Fixed the string matching to align with our Zustand store
    const startNodes = nodes.filter((node) => node.type === 'startNode');

    if (startNodes.length === 0) {
      return HttpResponse.json(
        { error: 'Workflow simulation failed: Missing a Start Node.' },
        { status: 400 }
      );
    }

    const executionLog = [
      { timestamp: new Date().toISOString(), level: 'info', message: 'Simulation started.' },
      { timestamp: new Date().toISOString(), level: 'info', message: `Found ${startNodes.length} Start Node(s).` },
      { timestamp: new Date().toISOString(), level: 'info', message: `Total nodes processed: ${nodes.length}.` },
      { timestamp: new Date().toISOString(), level: 'info', message: `Total edges processed: ${edges.length}.` },
      { timestamp: new Date().toISOString(), level: 'info', message: 'Simulation completed successfully.' },
    ];

    return HttpResponse.json({
      status: 'success',
      executionLog,
    });
  }),
];