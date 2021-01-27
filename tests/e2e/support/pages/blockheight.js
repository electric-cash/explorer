const blockheight = {
  details: {
    jsonTab: "[data-toggle='tab'][href='#tab-json'][role='tab']",
    detailsTab: "[data-toggle='tab'][href='#tab-json'][role='tab']",
    hash: " span.text-md[style='width: 100%; word-break: break-all;']",
    txid: '.card-header > a',
  },
  jsonTab: {
    blockHeight: '#tab-json-block-summary > pre > .json > :nth-child(12)',
    hash: '#tab-json-block-summary > pre > .json > :nth-child(2)',
    txid: ':nth-child(2) > pre > .json > :nth-child(2)',
  },
};

export default blockheight;
