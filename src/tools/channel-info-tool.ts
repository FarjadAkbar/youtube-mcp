import { YouTubeClient } from '../youtube-client.js';

export class ChannelInfoTool {
  static async handle(params: any, client: YouTubeClient): Promise<string> {
    const { channelId } = params;

    if (!channelId) {
      throw new Error('channelId parameter is required');
    }

    const channelInfo = await client.getChannelInfo(channelId);
    const snippet = channelInfo.snippet || {};
    const statistics = channelInfo.statistics || {};
    const branding = channelInfo.brandingSettings || {};
    
    let output = `Channel Information\n\n`;
    output += '='.repeat(80) + '\n\n';
    output += `Channel ID: ${channelId}\n`;
    output += `Title: ${snippet.title}\n`;
    output += `Description: ${snippet.description || 'N/A'}\n`;
    output += `Custom URL: ${snippet.customUrl || 'N/A'}\n`;
    output += `Published At: ${snippet.publishedAt}\n`;
    output += `Country: ${snippet.country || 'N/A'}\n`;
    output += `\nStatistics:\n`;
    output += `- View Count: ${parseInt(statistics.viewCount || '0').toLocaleString()}\n`;
    output += `- Subscriber Count: ${parseInt(statistics.subscriberCount || '0').toLocaleString()}\n`;
    output += `- Video Count: ${parseInt(statistics.videoCount || '0').toLocaleString()}\n`;
    output += `- Hidden Subscriber Count: ${statistics.hiddenSubscriberCount ? 'Yes' : 'No'}\n`;
    
    if (branding.channel) {
      output += `\nChannel Branding:\n`;
      output += `- Keywords: ${branding.channel.keywords || 'N/A'}\n`;
      output += `- Feature: ${branding.channel.feature || 'N/A'}\n`;
      output += `- Unsubscribed Trailer: ${branding.channel.unsubscribedTrailer || 'N/A'}\n`;
    }
    
    if (snippet.thumbnails) {
      const thumbnails = snippet.thumbnails;
      if (thumbnails.high) {
        output += `\nChannel Thumbnail: ${thumbnails.high.url}\n`;
      }
      if (thumbnails.default) {
        output += `Channel Banner: ${thumbnails.default.url}\n`;
      }
    }
    
    output += `\nChannel URL: https://www.youtube.com/channel/${channelId}\n`;
    
    return output;
  }
}

