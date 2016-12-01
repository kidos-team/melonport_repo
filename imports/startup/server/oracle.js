import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http'

import { Transactions } from '/imports/api/transactions.js';
import PriceFeedAsset from '/imports/lib/assets/PriceFeed.sol.js';


// CONSTANTS
const ABI = PriceFeedAsset.all_networks['2'].abi;
const PRICEFEED_ADDRESS = "0x60440640630A03A146C4e38684B2AF0Fd9B32193";
const TOKEN_ADDRESSES = [
  '0x0000000000000000000000000000000000000000',
  '0x0000000000000000000000000000000000000001',
  '0x0000000000000000000000000000000000000002',
];
// creation of contract object
var PriceFeed = web3.eth.contract(ABI);
var priceFeedInstance = PriceFeed.at(PRICEFEED_ADDRESS);


// FUNCTIONS
// Initialize everything on new network
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


// EXECUTION
Meteor.startup(() => {
  // Set Price in regular time intervals
  Meteor.setInterval(setPrice, 300000);
});
