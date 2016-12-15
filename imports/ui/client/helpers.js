import { Meteor } from 'meteor/meteor';
import { Session } from 'meteor/session';

import EtherToken from '/imports/lib/assets/contracts/EtherToken.sol.js';
import BitcoinToken from '/imports/lib/assets/contracts/BitcoinToken.sol.js';
import DollarToken from '/imports/lib/assets/contracts/DollarToken.sol.js';
import EuroToken from '/imports/lib/assets/contracts/EuroToken.sol.js';
import PriceFeed from '/imports/lib/assets/contracts/PriceFeed.sol.js';
import Exchange from '/imports/lib/assets/contracts/Exchange.sol.js';

Meteor.startup(() => {
  Session.set('isServerConnected', true);
  Meteor.call('isServerConnected', (err, result) => {
    if(!err) {
      Session.set('isServerConnected', result);
    } else {
      console.log(err);
    }
  });

  Session.set('priceFeedContractAddress', PriceFeed.all_networks['3'].address);
  Session.set('exchangeContractAddress', Exchange.all_networks['3'].address);
});

Template.registerHelper('isConnected', () => Session.get('isConnected'));
Template.registerHelper('isServerConnected', () => Session.get('isServerConnected'));
Template.registerHelper('latestBlock', () => Session.get('latestBlock'));

Template.registerHelper('priceFeedContractAddress', () => Session.get('priceFeedContractAddress'));
Template.registerHelper('exchangeContractAddress', () => Session.get('exchangeContractAddress'));
