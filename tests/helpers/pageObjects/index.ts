import { Search } from './search';
import { Header } from './header';
import { Footer } from './footer';
import { Units } from './units';
import { TransactionsStats } from './txStats';

export interface pageObjects {
  search: Search;
  header: Header;
  footer: Footer;
  units: Units;
  transactionsStats: TransactionsStats;
}

export default (page): pageObjects => ({
  search: new Search(page),
  header: new Header(page),
  footer: new Footer(page),
  units: new Units(page),
  transactionsStats: new TransactionsStats(page),
});
