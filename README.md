# YouTube MCP Server

A Model Context Protocol (MCP) server that provides tools for interacting with YouTube content, including transcript retrieval, video summarization, channel analysis, and more.

## Features

- **Get Video Transcripts**: Retrieve and read transcripts from YouTube videos
- **Generate Summaries**: Get concise summaries of video content
- **Search Videos**: Search YouTube with automatic transcript retrieval and summarization
- **Channel Information**: Get detailed information about YouTube channels
- **Channel Analysis**: Analyze all videos from a channel to understand content nature and themes
- **Per-User API Keys**: Each user can provide their own API key for authentication

## Quick Setup

See [SETUP.md](SETUP.md) for detailed installation instructions.

### Basic Setup:
```bash
npm install
npm run build
```

## Available Tools

### 1. get_transcript
Get the transcript of a YouTube video.

**Parameters:**
- `videoId` (required): YouTube video ID

**Example:**
```json
{
  "videoId": "dQw4w9WgXcQ"
}
```

### 2. get_summary
Get a summary of a YouTube video.

**Parameters:**
- `videoId` (required): YouTube video ID

### 3. search_videos
Search YouTube videos and get their transcripts and summaries.

**Parameters:**
- `query` (required): Search query
- `maxResults` (optional): Maximum number of results (default: 5)
- `apiKey` (required): YouTube Data API v3 key

### 4. get_channel_info
Get information about a YouTube channel.

**Parameters:**
- `channelId` (required): YouTube channel ID
- `apiKey` (required): YouTube Data API v3 key

### 5. analyze_channel
Analyze all videos from a channel and provide summary of content nature.

**Parameters:**
- `channelId` (required): YouTube channel ID
- `apiKey` (required): YouTube Data API v3 key
- `maxVideos` (optional): Maximum number of videos to analyze (default: 50)

## Per-User API Keys

Each user provides their own API key when calling tools. The server supports multiple users simultaneously by managing separate YouTube clients for each API key.

## How to Use with Claude Desktop

Add this configuration to your Claude Desktop settings:

### Windows
Edit: `%APPDATA%\Claude\claude_desktop_config.json`

### macOS
Edit: `~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "youtube": {
      "command": "node",
      "args": ["E:\\projects\\mcps\\youtube-mcp\\dist\\index.js"],
      "env": {
        "YOUTUBE_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

Note: The API key in the config is optional. Users can also provide their own API key when calling the tools.

## Example Usage

### Get Transcript
```typescript
// Get transcript for a video
const transcript = await get_transcript({ videoId: "dQw4w9WgXcQ" });
```

### Search and Analyze Videos
```typescript
// Search for videos and get their transcripts and summaries
const results = await search_videos({
  query: "TypeScript tutorial",
  maxResults: 3,
  apiKey: "your_api_key"
});
```

### Analyze a Channel
```typescript
// Analyze channel content
const analysis = await analyze_channel({
  channelId: "UC_channel_id_here",
  apiKey: "your_api_key",
  maxVideos: 20
});
```

## Development

```bash
# Build in watch mode
npm run dev

# Build once
npm run build
```

## License

MIT

