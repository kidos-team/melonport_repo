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
const etherTokenContract = web3.eth.contract(EtherToken.all_networks['3'].abi).
  at(EtherToken.all_networks['3'].address);
const bitcoinTokenContract = web3.eth.contract(BitcoinToken.all_networks['3'].abi)
  .at(BitcoinToken.all_networks['3'].address);
const dollarTokenContract = web3.eth.contract(DollarToken.all_networks['3'].abi)
  .at(DollarToken.all_networks['3'].address);
const euroTokenContract = web3.eth.contract(EuroToken.all_networks['3'].abi)
  .at(EuroToken.all_networks['3'].address);
const priceFeedContract = web3.eth.contract(PriceFeed.all_networks['3'].abi)
  .at(PriceFeed.all_networks['3'].address);
const exchangeContract = web3.eth.contract(Exchange.all_networks['3'].abi)
  .at(Exchange.all_networks['3'].address);

const TOKEN_ADDRESSES = [
  bitcoinTokenContract.address,
  dollarTokenContract.address,
  euroTokenContract.address,
];


// FUNCTIONS
function setPrice() {
  const data = HTTP.call('GET', 'https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=BTC,USD,EUR').data;
  const addresses = TOKEN_ADDRESSES;
  const inverseAtomizedPrices = Helpers.createInverseAtomizedPrices(data);

  console.log('Data: ', data);
  const txHash = priceFeedContract.setPrice(addresses, inverseAtomizedPrices, { gas: 4000000, gasPrice: 200000000000 });
  // const lastUpdate = priceFeedContract.lastUpdate.call();
  // const lastUpdate = -1;

  // console.log('Last update: ', lastUpdate.toNumber())
  Transactions.insert({
    addresses: TOKEN_ADDRESSES,
    BTC: data['BTC'],
    USD: data['USD'],
    EUR: data['EUR'],
    inverseAtomizedPrices,
    txHash,
    
    // lastUpdate: lastUpdate.toNumber(),
    createdAt: new Date(),
  });
};

function getEther() {
  HTTP.call('GET', 'http://faucet.ropsten.be:3001/donate/0x32CD3282d33fF58b4AE8402A226a0B27441B7F1A');
};


// EXECUTION
Meteor.startup(() => {
  // Set Price in regular time intervals
  setPrice();
  Meteor.setInterval(getEther, 5 * 60 * 1000);
  Meteor.setInterval(setPrice, 10 * 60 * 1000);
});
