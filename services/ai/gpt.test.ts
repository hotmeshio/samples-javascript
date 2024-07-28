import 'dotenv/config';
import { GPT } from './gpt'

async function main() {

  const terminalToString = (query: string[]): string => {
    if (!query) return '';
    return query.map(item => {
      // Double escape backslashes first to avoid escaping newly added backslashes from wrapping quotes
      let result = item.replace(/\\/g, '\\\\');
      
      // Wrap the string in quotes if it contains spaces or if it originally contained backslashes
      if (result.includes(' ') || item.includes('\\')) {
        result = `"${result}"`;
      }
      
      return result;
    }).join(' ');
  };

  type ChatMessage = {
    role: 'user' | 'system' | 'assistant';
    content: string;
  }
  

  // Correctly handling command-line arguments passed to the script.
  // Arguments are after `--` hence the search term is expected to be at `process.argv[2]` when using `npm run script-name -- 'search term'`
  const searchTerm = process.argv[2]; // Adjusting for `npm run` argument passing

  if (!searchTerm) {
    console.error('Please provide a search term as an argument.');
    return;
  } else {
    console.log('searching...', searchTerm);
  }

  const response = await GPT.ask([
    {
      role: 'user',
      content: searchTerm
    }
  ] as ChatMessage[]);

  console.log(response);
  console.log(terminalToString(response.ft_query));
}

main();
