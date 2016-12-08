import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http'
import { BigNumber } from 'bignumber.js';

import { Transactions } from '/imports/api/transactions.js';
import PriceFeedAsset from '/imports/lib/assets/PriceFeed.sol.js';


// Constants
const ABI = PriceFeedAsset.all_networks['2'].abi;
const PRICEFEED_ADDRESS = "0x60440640630A03A146C4e38684B2AF0Fd9B32193";
const TOKEN_ADDRESSES = [
  '0x0000000000000000000000000000000000000000',
  '0x0000000000000000000000000000000000000001',
  '0x0000000000000000000000000000000000000002',
];
const PREMINED_PRECISION = new BigNumber(Math.pow(10,8));

// Creation of contract object
var PriceFeed = web3.eth.contract(ABI);
var priceFeedInstance = PriceFeed.at(PRICEFEED_ADDRESS);


// FUNCTIONS
function setPrice() {
  var result = HTTP.call('GET', 'https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=BTC,USD,EUR');
  const data = result.data;
  const prices = [
    1.0 / data['BTC'] * PREMINED_PRECISION,
    1.0 / data['USD'] * PREMINED_PRECISION,
    1.0 / data['EUR'] * PREMINED_PRECISION
  ];
  const txHash = priceFeedInstance.setPrice(TOKEN_ADDRESSES, prices);

  Transactions.insert({
    addresses: TOKEN_ADDRESSES,
    prices,
    txHash,
    createdAt: new Date(),
  });
  console.log('setPrice has been called');
}

function getEther() {
  HTTP.call('GET', 'http://faucet.ropsten.be:3001/donate/0x32CD3282d33fF58b4AE8402A226a0B27441B7F1A');
}


// EXECUTION
Meteor.startup(() => {
  // Set Price in regular time intervals
  Meteor.setInterval(getEther, 60000);
  Meteor.setInterval(setPrice, 300000);
});
