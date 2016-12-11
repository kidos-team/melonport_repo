import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http'
import { BigNumber } from 'bignumber.js';

import { Transactions } from '/imports/api/transactions.js';

import EtherToken from '/imports/lib/assets/contracts/EtherToken.sol.js';
import BitcoinToken from '/imports/lib/assets/contracts/BitcoinToken.sol.js';
import DollarToken from '/imports/lib/assets/contracts/DollarToken.sol.js';
import EuroToken from '/imports/lib/assets/contracts/EuroToken.sol.js';
import PriceFeed from '/imports/lib/assets/contracts/PriceFeed.sol.js';
import Exchange from '/imports/lib/assets/contracts/Exchange.sol.js';

import Helpers from '/imports/lib/assets/lib/Helpers.js';
import SolKeywords from '/imports/lib/assets/lib/SolKeywords.js';
import SolConstants from '/imports/lib/assets/lib/SolConstants.js';


// Creation of contract object
// const priceFeedContract = web3.eth.contract(PriceFeed.all_networks['3'].abi)
//   .at(PriceFeed.all_networks['3'].address);
PriceFeed.setProvider(web3.currentProvider);
const priceFeedContract = PriceFeed.at(PriceFeed.all_networks['3'].address);
console.log(priceFeedContract.address)

const TOKEN_ADDRESSES = [
  BitcoinToken.all_networks['3'].address,
  DollarToken.all_networks['3'].address,
  EuroToken.all_networks['3'].address,
];


// FUNCTIONS
function setPrice() {
  const data = HTTP.call('GET', 'https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=BTC,USD,EUR').data;
  const addresses = TOKEN_ADDRESSES;
  const inverseAtomizedPrices = Helpers.createInverseAtomizedPrices(data);
  let txHash;
  let lastUpdate;

  priceFeedContract.setPrice(addresses, inverseAtomizedPrices).then((result) => {
    txHash = result;
    return priceFeedContract.lastUpdate.call();
  }).then((result) => {
    lastUpdate = result.toNumber();
    return Transactions.insert({
      addresses: TOKEN_ADDRESSES,
      BTC: data['BTC'],
      USD: data['USD'],
      EUR: data['EUR'],
      inverseAtomizedPrices,
      txHash,
      lastUpdate,
      createdAt: new Date(),
    });
  });
}

function getEther() {
  HTTP.call('GET', 'http://faucet.ropsten.be:3001/donate/0x32CD3282d33fF58b4AE8402A226a0B27441B7F1A');
}


// EXECUTION
Meteor.startup(() => {
  // Set Price in regular time intervals
  setPrice();
  Meteor.setInterval(getEther, 5 * 60 * 1000);
  Meteor.setInterval(setPrice, 10 * 60 * 1000);
});
