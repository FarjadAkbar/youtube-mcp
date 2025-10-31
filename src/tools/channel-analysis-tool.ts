import { YouTubeClient } from '../youtube-client.js';
import { SummaryTool } from './summary-tool.js';

export class ChannelAnalysisTool {
  static async handle(params: any, client: YouTubeClient): Promise<string> {
    const { channelId, maxVideos = 50 } = params;

    if (!channelId) {
      throw new Error('channelId parameter is required');
    }

    // Get channel videos
    const videos = await client.getChannelVideos(channelId, maxVideos);
    
    if (videos.length === 0) {
      return `No videos found for channel: ${channelId}`;
    }

    let output = `Channel Content Analysis\n\n`;
    output += '='.repeat(80) + '\n\n';
    output += `Analyzing ${videos.length} videos from channel...\n\n`;

    // Analyze videos
    const videoSummaries = [];
    const topics: string[] = [];
    const keywords: Map<string, number> = new Map();
    
    for (const video of videos) {
      const videoId = video.contentDetails?.videoId || video.snippet?.resourceId?.videoId;
      const title = video.snippet.title;
      
      if (!videoId) continue;
      
      try {
        const transcript = await client.getTranscript(videoId);
        const summary = SummaryTool.generateSummary(transcript.substring(0, 3000));
        
        videoSummaries.push({
          videoId,
          title,
          summary,
        });
        
        // Extract topics and keywords from transcript
        this.extractTopicsAndKeywords(transcript, topics, keywords);
      } catch (error) {
        // Skip videos without transcripts
      }
    }

    // Generate content nature summary
    const contentNature = this.analyzeContentNature(videoSummaries, topics, keywords);
    
    output += `Total Videos Analyzed: ${videoSummaries.length}\n\n`;
    output += contentNature;
    output += '\n' + '='.repeat(80) + '\n\n';
    
    // Add sample video summaries
    output += 'Sample Video Summaries:\n\n';
    videoSummaries.slice(0, 5).forEach((video, index) => {
      output += `${index + 1}. ${video.title}\n`;
      output += `   ${video.summary}\n`;
      output += `   Link: https://www.youtube.com/watch?v=${video.videoId}\n\n`;
    });
    
    return output;
  }

  private static extractTopicsAndKeywords(
    transcript: string,
    topics: string[],
    keywords: Map<string, number>
  ): void {
    // Common keywords to track
    const commonWords = ['learn', 'how', 'tutorial', 'guide', 'tips', 'tricks', 
                         'explain', 'understand', 'beginner', 'advanced', 'review',
                         'comparison', 'best', 'worst', 'free', 'paid', 'tool'];
    
    const lowerTranscript = transcript.toLowerCase();
    const words = lowerTranscript.split(/\s+/);
    
    for (const word of commonWords) {
      if (lowerTranscript.includes(word)) {
        keywords.set(word, (keywords.get(word) || 0) + 1);
      }
    }
    
    // Extract sentence patterns that indicate topics
    const sentences = transcript.split(/[.!?]+/);
    for (const sentence of sentences) {
      if (sentence.length > 30 && sentence.length < 150) {
        topics.push(sentence.trim());
        if (topics.length > 50) break; // Limit topics
      }
    }
  }

  private static analyzeContentNature(
    videoSummaries: any[],
    topics: string[],
    keywords: Map<string, number>
  ): string {
    let analysis = 'Content Nature Analysis:\n\n';
    
    // Analyze keywords
    analysis += 'Most Common Themes:\n';
    const sortedKeywords = Array.from(keywords.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    for (const [keyword, count] of sortedKeywords) {
      analysis += `- ${keyword} (appears ${count} times)\n`;
    }
    
    analysis += '\n';
    
    // Determine content type
    const hasTutorials = keywords.has('tutorial') || keywords.has('how');
    const hasReviews = keywords.has('review') || keywords.has('comparison');
    const hasGuide = keywords.has('guide') || keywords.has('tips');
    
    analysis += 'Content Type: ';
    const types = [];
    if (hasTutorials) types.push('Tutorial/Educational');
    if (hasReviews) types.push('Reviews');
    if (hasGuide) types.push('Guide/How-to');
    
    if (types.length > 0) {
      analysis += types.join(', ');
    } else {
      analysis += 'General Video Content';
    }
    
    analysis += '\n\n';
    
    // Overall nature
    analysis += 'Overall Nature:\n';
    const avgTranscriptLength = videoSummaries.reduce((sum, v) => sum + v.summary.length, 0) / videoSummaries.length;
    
    if (avgTranscriptLength > 1000) {
      analysis += 'Content appears to be detailed and comprehensive, suggesting educational or in-depth content.\n';
    } else if (avgTranscriptLength > 500) {
      analysis += 'Content is moderately detailed, suggesting informative videos with practical information.\n';
    } else {
      analysis += 'Content is concise, suggesting short-form or entertainment-focused videos.\n';
    }
    
    analysis += `Average content depth: ${Math.round(avgTranscriptLength)} characters per summary.\n`;
    
    return analysis;
  }
}

