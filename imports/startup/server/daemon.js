import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http'
import async from 'async';

import { PriceFeedTransactions } from '/imports/api/priceFeedTransactions.js';
import { LiquidityProviderTransactions } from '/imports/api/liquidityProviderTransactions.js';

import EtherToken from '/imports/lib/assets/contracts/EtherToken.sol.js';
import BitcoinToken from '/imports/lib/assets/contracts/BitcoinToken.sol.js';
import DollarToken from '/imports/lib/assets/contracts/DollarToken.sol.js';
import EuroToken from '/imports/lib/assets/contracts/EuroToken.sol.js';
import PriceFeed from '/imports/lib/assets/contracts/PriceFeed.sol.js';
import Exchange from '/imports/lib/assets/contracts/Exchange.sol.js';

import Helpers from '/imports/lib/assets/lib/Helpers.js';
import SolKeywords from '/imports/lib/assets/lib/SolKeywords.js';
import SolConstants from '/imports/lib/assets/lib/SolConstants.js';


const TOKEN_ADDRESSES = [
  BitcoinToken.all_networks['3'].address,
  DollarToken.all_networks['3'].address,
  EuroToken.all_networks['3'].address,
];

const NUM_OFFERS = 3;
const OWNER = web3.eth.coinbase;

// Creation of contract object
PriceFeed.setProvider(web3.currentProvider);
const priceFeedContract = PriceFeed.at(PriceFeed.all_networks['3'].address);

EtherToken.setProvider(web3.currentProvider);
const etherTokenContract = EtherToken.at(EtherToken.all_networks['3'].address);
BitcoinToken.setProvider(web3.currentProvider);
const bitcoinTokenContract = BitcoinToken.at(BitcoinToken.all_networks['3'].address);
Exchange.setProvider(web3.currentProvider);
const exchangeContract = Exchange.at(Exchange.all_networks['3'].address);

// FUNCTIONS
function setPrice() {
  const data = HTTP.call('GET', 'https://api.kraken.com/0/public/Ticker?pair=ETHXBT,ETHEUR,ETHUSD').data;


  const addresses = TOKEN_ADDRESSES;
  const inverseAtomizedPrices = Helpers.createInverseAtomizedPrices(
   [
     //TODO fix precision
     data.result.XETHXXBT.c[0] * 100,
     data.result.XETHZUSD.c[0],
     data.result.XETHZEUR.c[0]
   ]);
   console.log(inverseAtomizedPrices)

  const txHash = priceFeedContract.setPrice(addresses, inverseAtomizedPrices)
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
    done();
  });
};

function createOrderBook() {
  const data = HTTP.call('GET', 'https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=BTC,USD,EUR').data;

  let testCases = [];
  for (let i = 0; i < NUM_OFFERS; i += 1) {
    testCases.push(
      {
        sell_how_much: Helpers.createAtomizedPrices(data)[0] * (1 - (i * 0.1)),
        sell_which_token: bitcoinTokenContract.address,
        buy_how_much: 1 * SolKeywords.ether,
        buy_which_token: etherTokenContract.address,
        id: i + 1,
        owner: OWNER,
        active: true,
      },
    );
  }

  console.log(testCases)

  let txHash;
  async.mapSeries(
    testCases,
    (testCase, callbackMap) => {
      console.log(testCase)

      bitcoinTokenContract.approve(exchangeContract.address, testCase.sell_how_much, { from: OWNER })
        .then(() => bitcoinTokenContract.allowance(OWNER, exchangeContract.address))
        .then((result) => {
          return exchangeContract.offer(
          testCase.sell_how_much,
          testCase.sell_which_token,
          testCase.buy_how_much,
          testCase.buy_which_token,
          { from: OWNER });
        })
        .then((txHash) => {
          txHash = txHash;
          Object.assign({ txHash }, testCase);
          console.log('Tx hash: ', txHash)
          return exchangeContract.lastOfferId({ from: OWNER });
        })
        .then((lastOfferId) => {
          LiquidityProviderTransactions.insert({
            sell_how_much: testCase.sell_how_much,
            sell_which_token: testCase.sell_which_token,
            buy_which_token: testCase.buy_which_token,
            buy_how_much: testCase.buy_how_much,
            owner: OWNER,
            active: testCase.active,
            id: lastOfferId.toNumber(),
            txHash,
            createdAt: new Date(),
          });
          callbackMap(null, testCase);
        });
    },
    (err, results) => {
      testCases = results;
      done();
    },
  );
}

function getEther() {
  HTTP.call('GET', 'http://faucet.ropsten.be:3001/donate/0xeaa1f63e60982c33868c8910EA4cd1cfB8eB9dcc');
};


// EXECUTION
Meteor.startup(() => {
  setPrice()
  // Set Price in regular time intervals
  Meteor.setInterval(getEther, 2 * 60 * 1000);
  Meteor.setInterval(setPrice, 10 * 60 * 1000);
  Meteor.setInterval(createOrderBook, 60 * 60 * 1000);
});
