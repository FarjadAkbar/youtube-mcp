# Running YouTube MCP Server in HTTP Mode

This project can now run in HTTP/SSE mode for testing with ngrok and the MCP Playground.

## Running the HTTP Server

### Windows PowerShell:
```powershell
$env:MCP_SERVER_MODE='http'; node dist/index.js
```

### Windows CMD:
```cmd
set MCP_SERVER_MODE=http && node dist/index.js
```

### Linux/Mac:
```bash
MCP_SERVER_MODE=http node dist/index.js
```

The server will start on `http://localhost:3000`

### Endpoints:
- SSE Connection: `http://localhost:3000/sse`
- Message Endpoint: `http://localhost:3000/message?sessionId=<session-id>`

## Using with ngrok

1. Install ngrok (if not already installed):
   ```bash
   npm install -g ngrok
   ```

2. In a new terminal, expose the local server:
   ```bash
   ngrok http 3000
   ```

3. You'll get a public URL like: `https://abc123.ngrok-free.app`

4. Use this URL in the MCP Playground: `https://abc123.ngrok-free.app/sse`

## Testing with MCP Playground

1. Go to [Model Context Protocol Playground](https://playground.modelcontextprotocol.io)
2. Enter your ngrok URL: `https://<your-subdomain>.ngrok-free.app/sse`
3. The MCP server will expose these tools:
   - `get_transcript` - Get video transcripts
   - `get_summary` - Get video summaries
   - `search_videos` - Search YouTube videos
   - `get_channel_info` - Get channel information
   - `analyze_channel` - Analyze channel content

## Switching Between Modes

The server supports two modes:
- **stdio**: For Claude Desktop (default)
- **http**: For web/testing with ngrok

The mode is controlled by the `MCP_SERVER_MODE` environment variable.

## Changing the Port

To run on a different port:
```powershell
$env:MCP_SERVER_MODE='http'; $env:MCP_SERVER_PORT='8080'; node dist/index.js
```

