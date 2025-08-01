export interface LibgenBook {
  id: string;
  title: string;
  author: string;
  publisher?: string;
  year?: string;
  format?: string;
  size?: string;
  mirrorLink: string;
  source: 'libgen';
}

interface LibgenHtmlResponse {
  success: boolean;
  books: LibgenBook[];
  error?: string;
}

// Function to parse Libgen HTML response
function parseLibgenHtml(html: string): LibgenBook[] {
  try {
    // Create a temporary DOM parser
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    
    // Look for table rows containing book data
    const rows = doc.querySelectorAll('table[border="1"] tr');
    const books: LibgenBook[] = [];
    
    rows.forEach((row, index) => {
      // Skip header row
      if (index === 0) return;
      
      const cells = row.querySelectorAll('td');
      if (cells.length >= 9) {
        // Extract book information from table cells
        const titleCell = cells[2];
        const authorCell = cells[1];
        const publisherCell = cells[3];
        const yearCell = cells[4];
        const formatCell = cells[8];
        const sizeCell = cells[7];
        
        // Extract mirror links
        const mirrorLinks = cells[9]?.querySelectorAll('a') || [];
        const firstMirrorLink = mirrorLinks[0]?.getAttribute('href') || '';
        
        if (titleCell && authorCell && firstMirrorLink) {
          books.push({
            id: `libgen-${index}`,
            title: titleCell.textContent?.trim() || 'Unknown Title',
            author: authorCell.textContent?.trim() || 'Unknown Author',
            publisher: publisherCell?.textContent?.trim() || '',
            year: yearCell?.textContent?.trim() || '',
            format: formatCell?.textContent?.trim() || '',
            size: sizeCell?.textContent?.trim() || '',
            mirrorLink: firstMirrorLink,
            source: 'libgen'
          });
        }
      }
    });
    
    return books;
  } catch (error) {
    console.error('Error parsing Libgen HTML:', error);
    return [];
  }
}

// Function to search Libgen
export async function searchLibgen(query: string): Promise<LibgenHtmlResponse> {
  try {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://libgen.is/search.php?req=${encodedQuery}&res=25&column=title`;
    
    // Use a CORS proxy for development
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    
    const response = await fetch(proxyUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    const html = data.contents;
    
    const books = parseLibgenHtml(html);
    
    return {
      success: true,
      books
    };
  } catch (error) {
    console.error('Error searching Libgen:', error);
    return {
      success: false,
      books: [],
      error: error instanceof Error ? error.message : 'Failed to search Libgen'
    };
  }
}

// Alternative approach using a different CORS proxy
export async function searchLibgenAlternative(query: string): Promise<LibgenHtmlResponse> {
  try {
    const encodedQuery = encodeURIComponent(query);
    const url = `https://libgen.is/search.php?req=${encodedQuery}&res=25&column=title`;
    
    // Use cors-anywhere proxy (note: this requires the proxy to be running)
    const proxyUrl = `https://cors-anywhere.herokuapp.com/${url}`;
    
    const response = await fetch(proxyUrl, {
      headers: {
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const html = await response.text();
    const books = parseLibgenHtml(html);
    
    return {
      success: true,
      books
    };
  } catch (error) {
    console.error('Error searching Libgen (alternative):', error);
    return {
      success: false,
      books: [],
      error: error instanceof Error ? error.message : 'Failed to search Libgen'
    };
  }
}