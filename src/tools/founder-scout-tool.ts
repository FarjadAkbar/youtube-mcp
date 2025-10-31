import { YouTubeClient } from '../youtube-client.js';

type MonthlyRevenueOption = '$10k/month' | '$30k/month' | '$50k/month' | '$100k/month';
type TopicOption = 'Founder Journey' | 'Business Model and Strategy' | 'Revenue Streams and Scale';
type GeographyOption = 'USA' | 'Europe' | 'Asia' | 'Global';

interface FounderScoutParams {
  monthlyRevenue: MonthlyRevenueOption;
  keyTopic: TopicOption;
  targetGeography: GeographyOption;
  apiKey?: string;
  maxResults?: number;
  confirm?: boolean;
}

interface BusinessReport {
  founderName: string;
  businessName: string;
  monthlyRevenue: string;
  insights: string[];
  founderStory: string;
  source: string;
}

export class FounderScoutTool {
  static async handle(params: FounderScoutParams, client: YouTubeClient): Promise<string> {
    const { monthlyRevenue, keyTopic, targetGeography } = params;

    if (!monthlyRevenue || !keyTopic || !targetGeography) {
      return FounderScoutTool.renderPrompt();
    }

    // Always include a confirmation header
    const confirmation = FounderScoutTool.renderConfirmation(params);

    // If caller only wants confirmation first
    if (params.confirm === true) {
      return confirmation + '\n\nRe-run with "confirm: false" to fetch and analyze videos.';
    }

    const maxResults = params.maxResults ?? 5;
    const query = `How I built a ${monthlyRevenue} business ${targetGeography}`;

    const searchResults = await client.searchVideos(query, maxResults);

    const reports: BusinessReport[] = [];

    for (const item of searchResults) {
      const videoId = item?.id?.videoId;
      if (!videoId) continue;

      const title: string = item.snippet?.title ?? '';
      const channelTitle: string = item.snippet?.channelTitle ?? '';
      const link = `https://www.youtube.com/watch?v=${videoId}`;

      let transcript = '';
      try {
        transcript = await client.getTranscript(videoId);
      } catch (_) {
        // Fallback to description if transcript unavailable
        transcript = item.snippet?.description ?? '';
      }

      const { founderName, businessName } = FounderScoutTool.extractEntities(title, channelTitle, transcript);
      const insights = FounderScoutTool.extractInsights(transcript, keyTopic);
      const founderStory = FounderScoutTool.composeFounderStory(transcript);

      reports.push({
        founderName,
        businessName,
        monthlyRevenue,
        insights,
        founderStory,
        source: link,
      });
    }

    return confirmation + '\n\n' + FounderScoutTool.renderReports(reports);
  }

  private static renderPrompt(): string {
    return [
      'Founder Scout needs your selections. Provide the following parameters:',
      '',
      'monthlyRevenue: one of ["$10k/month", "$30k/month", "$50k/month", "$100k/month"]',
      'keyTopic: one of ["Founder Journey", "Business Model and Strategy", "Revenue Streams and Scale"]',
      'targetGeography: one of ["USA", "Europe", "Asia", "Global"]',
      '',
      'Optionally include: { maxResults: number, confirm: boolean }',
    ].join('\n');
  }

  private static renderConfirmation(params: FounderScoutParams): string {
    return [
      'Founder Scout - Input Confirmation',
      '----------------------------------',
      `Monthly Revenue: ${params.monthlyRevenue ?? '(missing)'}`,
      `Key Topic: ${params.keyTopic ?? '(missing)'}`,
      `Target Geography: ${params.targetGeography ?? '(missing)'}`,
    ].join('\n');
  }

  private static extractEntities(title: string, channelTitle: string, transcript: string): { founderName: string; businessName: string } {
    const clean = (s: string) => (s || '').replace(/\s+/g, ' ').trim();

    // Heuristics for founder name
    let founderName = '';
    const founderPatterns = [
      /my name is ([A-Z][a-z]+(?: [A-Z][a-z]+){0,2})/i,
      /i'm ([A-Z][a-z]+(?: [A-Z][a-z]+){0,2})/i,
      /i am ([A-Z][a-z]+(?: [A-Z][a-z]+){0,2})/i,
      /with ([A-Z][a-z]+(?: [A-Z][a-z]+){0,2})/i,
    ];
    for (const re of founderPatterns) {
      const m = transcript.match(re);
      if (m && m[1]) { founderName = clean(m[1]); break; }
    }
    if (!founderName && channelTitle) founderName = clean(channelTitle);

    // Heuristics for business name
    let businessName = '';
    const businessPatterns = [
      /at ([A-Z][\w'&-]+(?: [A-Z][\w'&-]+){0,3})/,
      /from ([A-Z][\w'&-]+(?: [A-Z][\w'&-]+){0,3})/,
      /company (?:called|named) ([A-Z][\w'&-]+(?: [A-Z][\w'&-]+){0,3})/i,
      /founder of ([A-Z][\w'&-]+(?: [A-Z][\w'&-]+){0,3})/i,
    ];
    for (const re of businessPatterns) {
      const m = transcript.match(re);
      if (m && m[1]) { businessName = clean(m[1]); break; }
    }
    if (!businessName) {
      // Try from title parts
      const titleParts = title.split('|').map(p => clean(p));
      if (titleParts.length > 1) businessName = titleParts[1];
    }

    return {
      founderName: founderName || 'Unknown',
      businessName: businessName || 'Unknown',
    };
  }

  private static extractInsights(transcript: string, topic: TopicOption): string[] {
    const text = (transcript || '').replace(/\s+/g, ' ').trim();
    const sentences = text.split(/[.!?]+\s/).filter(s => s.length > 40 && s.length < 220);

    const topicKeywords: Record<TopicOption, string[]> = {
      'Founder Journey': ['started', 'first customer', 'mistake', 'learned', 'quit', 'challenge', 'pivot'],
      'Business Model and Strategy': ['pricing', 'subscription', 'margins', 'strategy', 'positioning', 'distribution', 'acquisition'],
      'Revenue Streams and Scale': ['revenue', 'arpu', 'mrr', 'churn', 'scale', 'growth', 'profit'],
    };

    const kws = topicKeywords[topic];
    const matches: string[] = [];
    for (const s of sentences) {
      const lower = s.toLowerCase();
      if (kws.some(k => lower.includes(k))) {
        matches.push(s.trim());
      }
      if (matches.length >= 8) break;
    }
    if (matches.length === 0 && sentences.length) {
      matches.push(sentences[0]);
    }
    return matches.slice(0, 8);
  }

  private static composeFounderStory(transcript: string): string {
    const text = (transcript || '').replace(/\s+/g, ' ').trim();
    if (text.length <= 400) return text;
    // Simple narrative: beginning + middle + end
    const parts = text.split(/[.!?]+\s/).filter(Boolean);
    const start = parts.slice(0, 3).join('. ');
    const end = parts.slice(-3).join('. ');
    return `${start}... ${end}`.slice(0, 1200);
  }

  private static renderReports(reports: BusinessReport[]): string {
    if (reports.length === 0) return 'No matching videos found.';

    let out = 'Founder Scout - Business Reports\n\n';
    out += '='.repeat(80) + '\n\n';
    reports.forEach((r, i) => {
      out += `Report ${i + 1}\n`;
      out += `Founder's Name: ${r.founderName}\n`;
      out += `Business Name: ${r.businessName}\n`;
      out += `Monthly Revenue: ${r.monthlyRevenue}\n`;
      out += `Source: ${r.source}\n`;
      out += '\nInsights:\n';
      r.insights.forEach((ins, idx) => {
        out += `- ${ins}\n`;
      });
      out += '\nFounder Story:\n';
      out += r.founderStory + '\n';
      out += '='.repeat(80) + '\n\n';
    });
    return out;
  }
}


