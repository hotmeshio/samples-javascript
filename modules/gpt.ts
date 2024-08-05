import { Types } from '@hotmeshio/hotmesh';
import OpenAI from 'openai';
import { APIErrorResponse, APIResponse, ChatMessage, IndexFormat } from '../types/gpt';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

class GPTService {
  /**
   * @private
   */
  convertToIndexFormat(schemaMap: Record<string, Types.WorkflowSearchSchema>): IndexFormat[] {
    return Object.keys(schemaMap).map((index) => ({
      index: index,
      fields: Object.entries(schemaMap[index]).reduce((acc, [key, field]) => {
        if (field.indexed !== true) {
          const fieldName = field.fieldName ? field.fieldName : `_${key}`;
          const sortable = field.sortable ? 'sortable' : 'unsortable';
          const example = field.examples?.join(', ') ?? '';
          acc.push([fieldName, field.type, sortable, example]);
        }
        return acc;
      }, [] as Array<[string, string, 'sortable' | 'unsortable', string]>)
    }));
  }
  
  /**
   * @private
   */
  normalizeWhitespace(text: string) {
    return text.replace(/\s+/g, ' ').trim();
  }

  /**
   * @private
   */
  prepareMessages(messages: ChatMessage[]) {
    const cleaned = messages.map((message: ChatMessage) => ({
      ...message,
      content: this.normalizeWhitespace(message.content)
    }));
    console.log(cleaned, JSON.stringify(cleaned).length);
    return cleaned;
  }

  /**
   * Contextualizes the query based on the provided indexes and
   * generates a Redis FT.SEARCH query. Returns a JSON object
   * with 'prose' and 'ft_query' array.
   */
  async ask(messages: ChatMessage[], schemaMap: Record<string, Types.WorkflowSearchSchema>): Promise<APIResponse | APIErrorResponse> {
    const indexes = this.convertToIndexFormat(schemaMap);
    const now = Date.now();
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: this.prepareMessages([
        {
          role: 'system',
          content: `YOU: A Redis FT.SEARCH and FT.AGGREGATE expert.
                    ##ASSIGNMENT##
                    Process user input considering the schemas for Redis FT.SEARCH index fields provided below. Generate 'prose', a consise, unambiguous English language restatement of the query, and create a Redis FT.SEARCH query from 'prose' with precise field names as per provided schemas. Output a JSON object with 'prose' and 'ft_query' (a tokenized array of strings starting with the token, FT.SEARCH or FT.AGGREGATE).
                    
                    ##ASSIGNMENT PRINCIPLES##
                    Adapt queries considering FT indexes, ensure field name prefixes (_), maintain 'prose' user-friendly, and clarify ambiguity.
                    
                    ##INDEXES##
                    ${JSON.stringify(indexes)}`
        },
        ...messages as ChatMessage[],
        {
          'role': 'system',
          'content': `##TIME QUERY FORMAT##
                      Current GMT timevalue is ${now}.
                      Resolve numeric ranges BEFORE generating the FT.SEARCH query. 24h[${now - 86400 * 1000} ${now}] 7d[${now - 86400 * 1000 * 7} ${now}] 30d[${now - 86400 * 1000 * 30} ${now}] 365d[${now - 86400 * 1000 * 365} ${now}]
                      NEVER perform calculations in the query.`
        },
        {
          'role': 'system',
          'content': `##FT.SEARCH QUERY FORMAT##
                      Escape all the TAG special characters (.&-,).
                      Use the provided INDEXES to generate the FT.SEARCH RETURN field names.
                      Always use FT.AGGREGATE for aggregation queries.`
        },
        {
          'role': 'system',
          'content': `##RESPONSE FORMAT##
                      Return only raw JSON. The first character of your response must always be: {
                      NEVER WRAP/PREFIX (eg \`\`\`json)
                        #EX1#
                        {"prose": "Find bills for user, user-luke.birdeau.6 from the past month", ft_query: ["FT.SEARCH", "bill", "@_userId:{user\\\\-luke\\\\@birdeau\\\\.6} @_timestamp:[1712012653023 1712013253023]", "SORTBY", "_timestamp", "DESC", "LIMIT", "0", "1000", "RETURN", "4", "_id", "_userId", "_timestamp", "_plan"]}
                        #EX2#
                        {"prose": "Find the user, luke.birdeau.12", ft_query: ["FT.SEARCH", "user", "@_id:{luke.\\\\birdeau\\\\.12}", "LIMIT", "0", "1", "RETURN", "7", "_id", "_first", "_last", "_email", "_plan", "_cycle", "_planId"]}
                        #EX3#
                        {"prose": "Group all users by their plan and cycle", ft_query: ["FT.AGGREGATE", "user", "*", "GROUPBY", "2", "@_plan", "@_cycle", "REDUCE", "COUNT", "0", "as", "count"]}`
            }
      ]),
      temperature: 0.1,
      max_tokens: 4096,
      top_p: 0.8,
      frequency_penalty: 0,
      presence_penalty: 0.5,
    });
    const output = response.choices[0].message.content;
    try {
      const obj = output ? JSON.parse(output) : {};
      return { status: 'success', ...obj, timestamp: now };
    } catch(e) {
      return { status: 'error', message: 'Invalid JSON response from GPT-4', output, timestamp: now };
    }
  }
}

const GPT = new GPTService();
export { GPT };
