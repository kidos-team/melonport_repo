import { Meteor } from 'meteor/meteor';
import { HTTP } from 'meteor/http'

// Initialize web3 as global object for entire server side
import web3 from '/imports/lib/server/ethereum/web3.js';

// This defines all the collections, publications and methods that the application provides
// as an API to the client.
import '/imports/startup/server/register-apis.js';
import { setPrice } from '/imports/startup/server/oracle.js';
import { updateAssets } from '/imports/startup/server/assets.js';
import { createOrderBook, deleteAllOrders } from '/imports/startup/server/liqprov.js';
import '/imports/startup/server/firstcapital.js';

// Set defaultAccount
web3.eth.defaultAccount = web3.eth.coinbase;

function getEther() {
  HTTP.call('GET', 'http://faucet.ropsten.be:3001/donate/0xeaa1f63e60982c33868c8910EA4cd1cfB8eB9dcc');
}

// EXECUTION
Meteor.startup(() => {
  updateAssets();
  Meteor.setInterval(updateAssets, 10 * 60 * 1000);

  // Set Price in regular time intervals
  setPrice();
  Meteor.setInterval(getEther, 2 * 60 * 1000);
  Meteor.setInterval(setPrice, 10 * 60 * 1000);
  //TODO first delete existing orders then create new ones
  Meteor.setInterval(createOrderBook, 60 * 60 * 1000);
  Meteor.setInterval(deleteAllOrders, 60 * 60 * 1000);
});
