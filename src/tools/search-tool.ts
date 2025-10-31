import { YouTubeClient } from '../youtube-client.js';
import { SummaryTool } from './summary-tool.js';

export class SearchTool {
  static async handle(params: any, client: YouTubeClient): Promise<string> {
    const { query, maxResults = 5 } = params;

    if (!query) {
      throw new Error('query parameter is required');
    }

    // Search for videos
    const searchResults = await client.searchVideos(query, maxResults);
    
    if (searchResults.length === 0) {
      return `No videos found for query: "${query}"`;
    }

    // Process each video
    const results = [];
    
    for (const item of searchResults) {
      const videoId = item.id.videoId;
      const title = item.snippet.title;
      const channelTitle = item.snippet.channelTitle;
      const description = item.snippet.description;
      const publishedAt = item.snippet.publishedAt;
      
      try {
        // Get transcript
        const transcript = await client.getTranscript(videoId);
        
        // Generate summary
        const summary = SummaryTool.generateSummary(transcript.substring(0, 5000)); // Limit transcript for summary
        
        results.push({
          videoId,
          title,
          channelTitle,
          publishedAt,
          description: description.substring(0, 200),
          transcript: transcript.substring(0, 500), // First 500 chars of transcript
          summary,
          link: `https://www.youtube.com/watch?v=${videoId}`,
        });
      } catch (error) {
        // If transcript fails, still include basic info
        results.push({
          videoId,
          title,
          channelTitle,
          publishedAt,
          description: description.substring(0, 200),
          transcript: 'Transcript unavailable',
          summary: description.substring(0, 300),
          link: `https://www.youtube.com/watch?v=${videoId}`,
          error: `Failed to get transcript: ${error instanceof Error ? error.message : String(error)}`,
        });
      }
    }
    
    // Format the results
    let output = `Search Results for: "${query}"\n\n`;
    output += '='.repeat(80) + '\n\n';
    
    results.forEach((result, index) => {
      output += `Result ${index + 1}:\n`;
      output += `Title: ${result.title}\n`;
      output += `Channel: ${result.channelTitle}\n`;
      output += `Published: ${result.publishedAt}\n`;
      output += `Link: ${result.link}\n`;
      output += `\nDescription:\n${result.description}\n\n`;
      output += `Transcript (excerpt):\n${result.transcript}...\n\n`;
      output += `Summary:\n${result.summary}\n\n`;
      if (result.error) {
        output += `Note: ${result.error}\n`;
      }
      output += '='.repeat(80) + '\n\n';
    });
    
    return output;
  }
}

