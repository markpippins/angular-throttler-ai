export interface ImageSearchResult {
  id: string;
  description: string;
  alt_description: string;
  urls: {
    thumb: string;
    small: string;
    regular: string;
  };
  user: {
    name: string;
    portfolio_url: string;
  };
}
