import OpenAI from "openai";

// Initialization of the OpenAI client with the API key
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

type ChatMessage = {
  role: 'user' | 'system' | 'assistant';
  content: string;
}

// Definition of indexes as constants outside the class
const INDEXES = [
  { index: 'bill', aliases: ['bill', 'invoice'], return: 4, fields: [['_id', 'TAG', 'unsortable', 'nsfdiu67sdufhwe'], ['_userId', 'TAG', 'unsortable', 'x.x'], ['_timestamp', 'NUMERIC', 'sortable', '1712029138408'], ['_plan', 'TAG', 'sortable', 'enterprise']] },
  { index: 'user', aliases: ['user', 'customer'], return: 7, fields: [['_id', 'TAG', 'unsortable', 'x.x.x'], ['_first', 'TEXT', 'unsortable', 'Jim'], ['_last', 'TEXT', 'unsortable', 'Jim'], ['_email', 'TAG', 'unsortable', 'fred@gmail.com'], ['_plan', 'TAG', 'sortable', 'enterprise'], ['_cycle', 'TAG', 'sortable', 'yearly'], ['_planId', 'TAG', 'unsortable', '678uh678uht567uh']] },
  { index: 'test', aliases: ['test'], return: 7, fields: [['_id', 'TAG', 'unsortable', 'x.x.x'], ['_type', 'TAG', 'sortable',  'ok'], ['_timestamp', 'NUMERIC', 'sortable', '1712029138408'], ['_width', 'NUMERIC', 'sortable', '2'], ['_depth', 'NUMERIC', 'sortable', '4'], ['_duration', 'NUMERIC', 'sortable', '1250'], ['_wait', 'TAG', 'sortable', 'false']]},
  { index: 'order', aliases: ['order', 'mail piece', 'postcard', 'letter', 'self mailer', 'check', 'snap pack'], return: 18, fields: [['_account_id', 'TAG', 'sortable', 'f38d32ade3621a4075e7'], ['_billing_group_id', 'TAG', 'unsortable', ''], ['_campaign_id', 'TAG', 'unsortable', ''], ['_bleed', 'TAG', 'sortable', 'false'], ['_color', 'TAG', 'sortable', 'false'], ['_custom_envelope_id', 'TAG', 'sortable', 'env_24e10e220f891bcb'], ['_double_sided', 'TAG', 'sortable', 'true'], ['_id', 'TAG', 'sortable', 'ord_letter123'], ['_object', 'TAG', 'sortable', 'letter'], ['_pages', 'NUMERIC', 'sortable', ''], ['_partner_id', 'TAG', 'sortable', ''], ['_perforation_placement', 'TAG', 'sortable', ''], ['_product_id', 'TAG', 'unsortable', 'prd_a300000001'], ['_return_envelope_id', 'TAG', 'unsortable', 'renv_ba8b60dfb944e46'], ['_send_date', 'TAG', 'sortable', '2024-02-28T00:14:07.348Z'], ['_target_delivery_date', 'TAG', 'sortable', ''], ['_size', 'TAG', 'sortable', 'us_letter'], ['_sla', 'TAG', 'sortable', '']] },
];

class GPTService {

  /**
   * Normalizes whitespace in a string.
   */
  normalizeWhitespace(text: string) {
    return text.replace(/\s+/g, ' ').trim();
  }

  /**
   * Prepares messages for API interaction, normalizing whitespace and validating content.
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
   * Generates example queries based on predefined indexes. This function creates
   * sample 'prose' and 'ft_query' pairs for each index to assist in forming
   * the queries sent to GPT for runtime analysis.
   */
  generateExamples(now: number) {
    const index = INDEXES[0];
    const tsQuery = `@_timestamp:[${now - (86400 * 1000 * 7)} ${now}]`; // Last week

    return [
      {
        prose: `Find the most recent ${index.aliases[1] || index.aliases[0]}`,
        ft_query: ['FT.SEARCH', index.index, '*', 'SORTBY', '_timestamp', 'DESC', 'LIMIT', '0', '3', 'RETURN', '4', '_id', '_userId', '_timestamp', '_plan'],
      },
      {
        prose: `Find ${index.aliases[0]}s from the past week`,
        ft_query: ['FT.SEARCH', index.index, tsQuery, 'LIMIT', '0', '1000', 'RETURN', '4', '_id', '_userId', '_timestamp', '_plan'],
      }   
    ];
  }

  /**
   * Contextualizes the query based on the provided indexes and
   * generates a Redis FT.SEARCH query. Returns a JSON object
   * with 'prose' and 'ft_query' array. If no indexes are provided,
   * the default indexes are used. If the user's query is ambiguous,
   * the system will clarify the query by returning a JSON object with
   * 'question' as the single field in the JSON.
   * 
   * @param messages 
   * @param indexes 
   * @returns 
   */
  async ask(messages: ChatMessage[], indexes = INDEXES) {
    const now = Date.now();
    const examples = this.generateExamples(now);
    //todo: interleave generic examples using deterministic logic to seed best-practice examples for user's indexes
    const _autoGenExampleSection = `### EXAMPLES ###\n${examples.map(example => `#Q#: '${example.prose}', #A#: ${JSON.stringify(example)}`).join('\n')}`;
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

// Export a single instance of the GPT class
const GPT = new GPTService();
export { GPT };
