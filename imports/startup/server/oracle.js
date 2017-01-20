import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http';
import async from 'async';

import { PriceFeedTransactions } from '/imports/api/priceFeedTransactions.js';
import { LiquidityProviderTransactions } from '/imports/api/liquidityProviderTransactions.js';

import EtherToken from '/imports/lib/assets/contracts/EtherToken.sol.js';
import BitcoinToken from '/imports/lib/assets/contracts/BitcoinToken.sol.js';
import RepToken from '/imports/lib/assets/contracts/RepToken.sol.js';
import EuroToken from '/imports/lib/assets/contracts/EuroToken.sol.js';
import PriceFeed from '/imports/lib/assets/contracts/PriceFeed.sol.js';
import Exchange from '/imports/lib/assets/contracts/Exchange.sol.js';

import Helpers from '/imports/lib/assets/utils/Helpers.js';
import SolKeywords from '/imports/lib/assets/utils/SolKeywords.js';

// Creation of contract object
PriceFeed.setProvider(web3.currentProvider);
const priceFeedContract = PriceFeed.at(PriceFeed.all_networks['3'].address);

const TOKEN_ADDRESSES = [
  BitcoinToken.all_networks['3'].address,
  RepToken.all_networks['3'].address,
  EuroToken.all_networks['3'].address,
];
const OWNER = web3.eth.coinbase;

// FUNCTIONS
export function setPrice() {
  const data = HTTP.call('GET', 'https://api.kraken.com/0/public/Ticker?pair=ETHXBT,REPETH,ETHEUR').data;
  const addresses = TOKEN_ADDRESSES;
  const inverseAtomizedPrices = Helpers.createInverseAtomizedPrices(
    [
      //TODO fix btcs precision
      data.result.XETHXXBT.c[0] * 100,
      data.result.XETHZUSD.c[0],
      data.result.XETHZEUR.c[0],
    ]);

  const txHash = priceFeedContract.setPrice(addresses, inverseAtomizedPrices, { from: OWNER })
  .then((result) => {
    return priceFeedContract.lastUpdate();
  })
  .then((result) => {
    const lastUpdate = result.toNumber();

    PriceFeedTransactions.insert({
      addresses: TOKEN_ADDRESSES,
      BTC: data.result.XETHXXBT.c[0],
      USD: data.result.XETHZUSD.c[0],
      EUR: data.result.XETHZEUR.c[0],
      inverseAtomizedPrices,
      txHash,
      lastUpdate: lastUpdate,
      createdAt: new Date(),
    });
  });
}
