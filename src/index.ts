#!/usr/bin/env node

import express from 'express';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { 
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { YouTubeClient } from './youtube-client.js';
import { TranscriptTool } from './tools/transcript-tool.js';
import { SummaryTool } from './tools/summary-tool.js';
import { SearchTool } from './tools/search-tool.js';
import { ChannelInfoTool } from './tools/channel-info-tool.js';
import { ChannelAnalysisTool } from './tools/channel-analysis-tool.js';
import { FounderScoutTool } from './tools/founder-scout-tool.js';

class YouTubeMCPServer {
  private server: Server;
  private youtubeClients: Map<string, YouTubeClient> = new Map();
  private tools: Map<string, { handler: (params: any, client: YouTubeClient) => Promise<any> }> = new Map();
  private activeServers: Server[] = [];

  constructor() {
    this.server = new Server(
      {
        name: 'youtube-mcp-server',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.registerToolHandlers();
    this.setupHandlers();
  }

  private registerToolHandlers() {
    this.tools.set('get_transcript', {
      handler: TranscriptTool.handle,
    });

    this.tools.set('get_summary', {
      handler: SummaryTool.handle,
    });

    this.tools.set('search_videos', {
      handler: SearchTool.handle,
    });

    this.tools.set('get_channel_info', {
      handler: ChannelInfoTool.handle,
    });

    this.tools.set('analyze_channel', {
      handler: ChannelAnalysisTool.handle,
    });

    this.tools.set('founder_scout', {
      handler: FounderScoutTool.handle,
    });
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: [
          {
            name: 'get_transcript',
            description: 'Get the transcript of a YouTube video by video ID',
            inputSchema: {
              type: 'object',
              properties: {
                videoId: {
                  type: 'string',
                  description: 'YouTube video ID (e.g., from URL youtube.com/watch?v=VIDEO_ID)',
                },
              },
              required: ['videoId'],
            },
          },
          {
            name: 'get_summary',
            description: 'Get a summary of a YouTube video from its transcript',
            inputSchema: {
              type: 'object',
              properties: {
                videoId: {
                  type: 'string',
                  description: 'YouTube video ID',
                },
              },
              required: ['videoId'],
            },
          },
          {
            name: 'search_videos',
            description: 'Search YouTube videos and get their transcripts and summaries',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query for YouTube videos',
                },
                maxResults: {
                  type: 'number',
                  description: 'Maximum number of results to return (default: 5)',
                  default: 5,
                },
                apiKey: {
                  type: 'string',
                  description: 'YouTube Data API v3 key',
                },
              },
              required: ['query', 'apiKey'],
            },
          },
          {
            name: 'get_channel_info',
            description: 'Get information about a YouTube channel',
            inputSchema: {
              type: 'object',
              properties: {
                channelId: {
                  type: 'string',
                  description: 'YouTube channel ID',
                },
                apiKey: {
                  type: 'string',
                  description: 'YouTube Data API v3 key',
                },
              },
              required: ['channelId', 'apiKey'],
            },
          },
          {
            name: 'analyze_channel',
            description: 'Analyze all videos from a channel and provide summary of content nature',
            inputSchema: {
              type: 'object',
              properties: {
                channelId: {
                  type: 'string',
                  description: 'YouTube channel ID',
                },
                apiKey: {
                  type: 'string',
                  description: 'YouTube Data API v3 key',
                },
                maxVideos: {
                  type: 'number',
                  description: 'Maximum number of videos to analyze (default: 50)',
                  default: 50,
                },
              },
              required: ['channelId', 'apiKey'],
            },
          },
          {
            name: 'founder_scout',
            description: 'Founder Scout agent: confirm inputs, search videos, fetch transcripts, and create business reports',
            inputSchema: {
              type: 'object',
              properties: {
                monthlyRevenue: {
                  type: 'string',
                  description: 'One of: $10k/month, $30k/month, $50k/month, $100k/month',
                },
                keyTopic: {
                  type: 'string',
                  description: 'One of: Founder Journey, Business Model and Strategy, Revenue Streams and Scale',
                },
                targetGeography: {
                  type: 'string',
                  description: 'One of: USA, Europe, Asia, Global',
                },
                maxResults: {
                  type: 'number',
                  description: 'Max number of videos to analyze (default: 5)',
                  default: 5,
                },
                confirm: {
                  type: 'boolean',
                  description: 'If true, only returns confirmation. Set false to fetch results.',
                  default: true,
                },
                apiKey: {
                  type: 'string',
                  description: 'YouTube Data API v3 key',
                },
              },
              required: [],
            },
          },
        ],
      };
    });

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      const tool = this.tools.get(name);
      if (!tool) {
        throw new Error(`Unknown tool: ${name}`);
      }

      // Get or create YouTube client for the user
      const apiKey = args?.apiKey || process.env.YOUTUBE_API_KEY;
      if (!apiKey || typeof apiKey !== 'string') {
        throw new Error('API key required. Please provide apiKey parameter or set YOUTUBE_API_KEY environment variable.');
      }

      const clientKey: string = apiKey;
      let client = this.youtubeClients.get(clientKey);
      
      if (!client) {
        client = new YouTubeClient(apiKey);
        this.youtubeClients.set(clientKey, client);
      }

      try {
        const result = await tool.handler(args, client);
        return {
          content: [
            {
              type: 'text',
              text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        throw new Error(`Error executing tool ${name}: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error('YouTube MCP server running on stdio');
  }

  async runHttp(port: number = 3000) {
    const app = express();
    // Don't use express.json() middleware - the transport will read the body itself

    app.get('/sse', async (req, res) => {
      console.log('Got new SSE connection');
      // Use the same path for POSTs as the SSE path so clients that POST to /sse work
      const transport = new SSEServerTransport('/sse', res);
      const server = new Server(
        {
          name: 'youtube-mcp-server',
          version: '1.0.0',
        },
        {
          capabilities: {
            tools: {},
          },
        }
      );

      // Register tools and handlers for this server instance
      this.registerToolsForServer(server);
      this.setupHandlersForServer(server);
      
      console.log('Tools registered for server instance');
      console.log('Available tools:', Array.from(this.tools.keys()));

      // Connect server to transport
      await server.connect(transport);
      console.log('Server connected to transport');
      console.log('Server transport session ID:', (transport as any).sessionId);
      
      // Store the connection
      this.activeServers.push(server);
      
      server.onclose = () => {
        console.log('SSE connection closed');
        this.activeServers = this.activeServers.filter((s) => s !== server);
      };
    });

    // Accept POSTs on both /sse (preferred for compatibility) and /message (legacy)
    const handleMessagePost = async (req: any, res: any) => {
      const sessionId = req.query.sessionId as string;
      console.log('Received POST message for session:', sessionId);
      console.log('Active servers count:', this.activeServers.length);
      
      const server = this.activeServers.find(s => {
        const t = s.transport as any;
        return t && t.sessionId === sessionId;
      });
      
      if (!server) {
        console.log('Server not found for session:', sessionId);
        console.log('Available session IDs:', this.activeServers.map(s => (s.transport as any).sessionId));
        res.status(404).send('Session not found');
        return;
      }
      
      const transport = server.transport as SSEServerTransport;
      console.log('About to call transport.handlePostMessage');
      
      await transport.handlePostMessage(req, res);
      console.log('transport.handlePostMessage completed');
    };

    app.post('/sse', handleMessagePost);
    app.post('/message', handleMessagePost);

    app.listen(port, () => {
      console.log(`YouTube MCP HTTP server running on http://localhost:${port}/sse`);
    });
  }

  private registerToolsForServer(server: Server) {
    // Register list tools handler
    server.setRequestHandler(ListToolsRequestSchema, async () => {
      console.log('ListToolsRequestSchema handler called');
      return {
        tools: [
          {
            name: 'get_transcript',
            description: 'Get the transcript of a YouTube video by video ID',
            inputSchema: {
              type: 'object',
              properties: {
                videoId: {
                  type: 'string',
                  description: 'YouTube video ID (e.g., from URL youtube.com/watch?v=VIDEO_ID)',
                },
              },
              required: ['videoId'],
            },
          },
          {
            name: 'get_summary',
            description: 'Get a summary of a YouTube video from its transcript',
            inputSchema: {
              type: 'object',
              properties: {
                videoId: {
                  type: 'string',
                  description: 'YouTube video ID',
                },
              },
              required: ['videoId'],
            },
          },
          {
            name: 'search_videos',
            description: 'Search YouTube videos and get their transcripts and summaries',
            inputSchema: {
              type: 'object',
              properties: {
                query: {
                  type: 'string',
                  description: 'Search query for YouTube videos',
                },
                maxResults: {
                  type: 'number',
                  description: 'Maximum number of results to return (default: 5)',
                  default: 5,
                },
                apiKey: {
                  type: 'string',
                  description: 'YouTube Data API v3 key',
                },
              },
              required: ['query', 'apiKey'],
            },
          },
          {
            name: 'get_channel_info',
            description: 'Get information about a YouTube channel',
            inputSchema: {
              type: 'object',
              properties: {
                channelId: {
                  type: 'string',
                  description: 'YouTube channel ID',
                },
                apiKey: {
                  type: 'string',
                  description: 'YouTube Data API v3 key',
                },
              },
              required: ['channelId', 'apiKey'],
            },
          },
          {
            name: 'analyze_channel',
            description: 'Analyze all videos from a channel and provide summary of content nature',
            inputSchema: {
              type: 'object',
              properties: {
                channelId: {
                  type: 'string',
                  description: 'YouTube channel ID',
                },
                apiKey: {
                  type: 'string',
                  description: 'YouTube Data API v3 key',
                },
                maxVideos: {
                  type: 'number',
                  description: 'Maximum number of videos to analyze (default: 50)',
                  default: 50,
                },
              },
              required: ['channelId', 'apiKey'],
            },
          },
          {
            name: 'founder_scout',
            description: 'Founder Scout agent: confirm inputs, search videos, fetch transcripts, and create business reports',
            inputSchema: {
              type: 'object',
              properties: {
                monthlyRevenue: {
                  type: 'string',
                  description: 'One of: $10k/month, $30k/month, $50k/month, $100k/month',
                },
                keyTopic: {
                  type: 'string',
                  description: 'One of: Founder Journey, Business Model and Strategy, Revenue Streams and Scale',
                },
                targetGeography: {
                  type: 'string',
                  description: 'One of: USA, Europe, Asia, Global',
                },
                maxResults: {
                  type: 'number',
                  description: 'Max number of videos to analyze (default: 5)',
                  default: 5,
                },
                confirm: {
                  type: 'boolean',
                  description: 'If true, only returns confirmation. Set false to fetch results.',
                  default: true,
                },
                apiKey: {
                  type: 'string',
                  description: 'YouTube Data API v3 key',
                },
              },
              required: [],
            },
          },
        ],
      };
    });

    // Register call tool handler
    server.setRequestHandler(CallToolRequestSchema, async (request) => {
      console.log('CallToolRequestSchema handler called:', request.params.name);
      const { name, arguments: args } = request.params;

      const tool = this.tools.get(name);
      if (!tool) {
        throw new Error(`Unknown tool: ${name}`);
      }

      // Get or create YouTube client for the user
      const apiKey = args?.apiKey || process.env.YOUTUBE_API_KEY;
      if (!apiKey || typeof apiKey !== 'string') {
        throw new Error('API key required. Please provide apiKey parameter or set YOUTUBE_API_KEY environment variable.');
      }

      const clientKey: string = apiKey;
      let client = this.youtubeClients.get(clientKey);
      
      if (!client) {
        client = new YouTubeClient(apiKey);
        this.youtubeClients.set(clientKey, client);
      }

      try {
        const result = await tool.handler(args, client);
        return {
          content: [
            {
              type: 'text',
              text: typeof result === 'string' ? result : JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        throw new Error(`Error executing tool ${name}: ${error instanceof Error ? error.message : String(error)}`);
      }
    });
  }

  private setupHandlersForServer(server: Server) {
    // Tool handlers are registered in registerToolsForServer
  }
}

// Check if running in HTTP mode
const mode = process.env.MCP_SERVER_MODE || 'stdio';
const port = parseInt(process.env.MCP_SERVER_PORT || '3000');

const server = new YouTubeMCPServer();

if (mode === 'http') {
  server.runHttp(port).catch(console.error);
} else {
  server.run().catch(console.error);
}

