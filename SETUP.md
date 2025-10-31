# YouTube MCP Server - Setup Guide

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Build the Project
```bash
npm run build
```

### 3. Get a YouTube API Key

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable the **YouTube Data API v3**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "YouTube Data API v3"
   - Click "Enable"
4. Create credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "API Key"
   - Copy your API key

### 4. Configure Claude Desktop

#### Windows
Edit: `%APPDATA%\Claude\claude_desktop_config.json`

#### macOS
Edit: `~/Library/Application Support/Claude/claude_desktop_config.json`

Add the following configuration:

```json
{
  "mcpServers": {
    "youtube": {
      "command": "node",
      "args": ["E:\\projects\\mcps\\youtube-mcp\\dist\\index.js"],
      "env": {}
    }
  }
}
```

**Important:** Update the path `E:\\projects\\mcps\\youtube-mcp\\dist\\index.js` to match your actual project location.

### 5. Restart Claude Desktop

Close and reopen Claude Desktop to load the new MCP server.

## Usage

The YouTube MCP server provides 5 tools that you can use:

### 1. get_transcript
Get the transcript of a YouTube video.

**Parameters:**
- `videoId` - YouTube video ID (from URL: `youtube.com/watch?v=VIDEO_ID`)

**Example:**
```
Get the transcript for video dQw4w9WgXcQ
```

### 2. get_summary
Get a summary of a YouTube video.

**Parameters:**
- `videoId` - YouTube video ID

**Example:**
```
Summarize video dQw4w9WgXcQ
```

### 3. search_videos
Search YouTube and get transcripts and summaries.

**Parameters:**
- `query` - Search query for YouTube videos
- `maxResults` - Maximum number of results (default: 5)
- `apiKey` - Your YouTube API key

**Example:**
```
Search for "Python tutorial" and get transcripts and summaries
```

### 4. get_channel_info
Get information about a YouTube channel.

**Parameters:**
- `channelId` - YouTube channel ID
- `apiKey` - Your YouTube API key

**Example:**
```
Get info for channel UC8butISFwT-Wl7EV0hUK0BQ
```

### 5. analyze_channel
Analyze all videos from a channel and provide summary of content nature.

**Parameters:**
- `channelId` - YouTube channel ID
- `apiKey` - Your YouTube API key
- `maxVideos` - Maximum number of videos to analyze (default: 50)

**Example:**
```
Analyze channel UC8butISFwT-Wl7EV0hUK0BQ with my API key
```

## Providing API Keys

Each user provides their own API key when calling tools that require it:
- `search_videos`
- `get_channel_info`
- `analyze_channel`

You can also set a default API key using the environment variable `YOUTUBE_API_KEY` in the Claude Desktop configuration.

## Troubleshooting

### Server doesn't start
- Check that the path in `claude_desktop_config.json` is correct
- Ensure `npm run build` completed successfully
- Check that Node.js is installed and in your PATH

### Transcript errors
- Not all YouTube videos have transcripts
- Some videos may be region-restricted or private
- The video ID must be correct

### API errors
- Verify your YouTube API key is valid
- Check that the YouTube Data API v3 is enabled in Google Cloud Console
- Ensure your API key hasn't exceeded quota limits

## Features

✅ Get video transcripts  
✅ Generate video summaries  
✅ Search YouTube videos  
✅ Get channel information  
✅ Analyze channel content and nature  
✅ Support for multiple users with individual API keys  
✅ Intelligent summarization algorithms  
✅ Extract topics and keywords from content  
✅ Detailed content nature analysis  

