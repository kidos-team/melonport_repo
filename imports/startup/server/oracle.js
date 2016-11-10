import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http'

import { Transactions } from '/imports/api/transactions.js';
import PriceFeedAsset from '/imports/lib/assets/PriceFeed.sol.js';


// CONSTANTS
const ABI = PriceFeedAsset.all_networks['2'].abi;
const PRICEFEED_ADDRESS = PriceFeedAsset.all_networks['2'].address;
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
  const prices = [result.data['BTC'], result.data['USD'], result.data['EUR']];
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
