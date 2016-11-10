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


// Only if fully synced
if (web3.eth.syncing === false) {
  const filter = web3.eth.filter('latest');
  filter.watch((error, log) => {
    const currentBlock = web3.eth.blockNumber;
    if (currentBlock % 100 === 0) {

      var result = HTTP.call('GET', 'https://min-api.cryptocompare.com/data/price?fsym=ETH&tsyms=BTC,USD,EUR');
      const prices = [result.data['BTC'], result.data['USD'], result.data['EUR']];
      const txHash = priceFeedInstance.setPrice(TOKEN_ADDRESSES, prices);

      Transactions.insert({
        addresses: TOKEN_ADDRESSES,
        prices,
        txHash,
        createdAt: new Date(),
      });
    }
  });
}
