const homepage = {
    header: {
      header: 'h1.page-title',
      logo: "[src='/img/logo/electric_vault.svg']",
      searchBar: ".search-input[placeholder='Search']",
      navBar: "img.settings-icon[src='/img/icons/settings.png']",
      navlist: "[aria-labelledby='navbarDropdown']",
      searchButton: "[type='image'][src='/img/icons/search.png']",
      noResultAlert: ".alert[role='alert']",
    },
    footer: {
      sourceLink: "a[href='https://github.com/electric-cash/explorer']",
    },
    networkSummary: {
      tools: '.nav-link > span',
      hashrate: ':nth-child(1) > .lead',
      difficulty: ':nth-child(5) > .lead',
      coinsinCirculation: ':nth-child(9) > .lead',
      totalTx: ':nth-child(2) > .lead',
      blockchainSize: ':nth-child(6) > .lead',
      marketCap: ':nth-child(10) > .lead',
      unconfirmedTx: ':nth-child(3) > .lead',
      numberOfWallet: ':nth-child(7) > .lead',
      exchangeRateUsd: ':nth-child(11) > .lead',
      chainwork: ':nth-child(4) > .lead',
      volume: ':nth-child(8) > .lead',
      exchangeRateBtc: ':nth-child(12) > .lead',
    },
    tools: {
      nodeStatus: "span.font-weight-bold a[href='/node-status']",
      BrowseBlocks: "span.font-weight-bold a[href='/blocks']",
      unconfirmedtransactions: "span.font-weight-bold a[href='/unconfirmed-tx']",
    },
    units: {
      units: ':nth-child(1n+0) > :nth-child(6) > .monospace > .border-dotted',
    },
    latestBlocks: {
      height:
        'tbody > :nth-child(1) > :nth-child(1) > a',
    },
  };
  
  export default homepage;
