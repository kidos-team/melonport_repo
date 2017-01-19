import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { Session } from 'meteor/session';

import EtherToken from '/imports/lib/assets/contracts/EtherToken.sol.js';
import BitcoinToken from '/imports/lib/assets/contracts/BitcoinToken.sol.js';
import DollarToken from '/imports/lib/assets/contracts/DollarToken.sol.js';
import EuroToken from '/imports/lib/assets/contracts/EuroToken.sol.js';
import PriceFeed from '/imports/lib/assets/contracts/PriceFeed.sol.js';
import Exchange from '/imports/lib/assets/contracts/Exchange.sol.js';
import Registrar from '/imports/lib/assets/contracts/Registrar.sol.js';
import Version from '/imports/lib/assets/contracts/Version.sol.js';
import Meta from '/imports/lib/assets/contracts/Meta.sol.js';

Meteor.startup(() => {
  Session.set('isServerConnected', true);
  Meteor.call('isServerConnected', (err, result) => {
    if (!err) {
      Session.set('isServerConnected', result);
    } else {
      console.log(err);
    }
  });

  Session.set('etherTokenContractAddress', EtherToken.all_networks['3'].address);
  Session.set('bitcoinTokenContractAddress', BitcoinToken.all_networks['3'].address);
  Session.set('dollarTokenContractAddress', DollarToken.all_networks['3'].address);
  Session.set('euroTokenContractAddress', EuroToken.all_networks['3'].address);
  Session.set('priceFeedContractAddress', PriceFeed.all_networks['3'].address);
  Session.set('exchangeContractAddress', Exchange.all_networks['3'].address);
  Session.set('registrarContractAddress', Registrar.all_networks['3'].address);
  Session.set('versionContractAddress', Version.all_networks['3'].address);
  Session.set('metaContractAddress', Meta.all_networks['3'].address);
});

Template.registerHelper('isConnected', () => Session.get('isConnected'));
Template.registerHelper('isServerConnected', () => Session.get('isServerConnected'));
Template.registerHelper('latestBlock', () => Session.get('latestBlock'));
// Contracts
Template.registerHelper('etherTokenContractAddress', () => Session.get('etherTokenContractAddress'));
Template.registerHelper('bitcoinTokenContractAddress', () => Session.get('bitcoinTokenContractAddress'));
Template.registerHelper('dollarTokenContractAddress', () => Session.get('dollarTokenContractAddress'));
Template.registerHelper('euroTokenContractAddress', () => Session.get('euroTokenContractAddress'));
Template.registerHelper('priceFeedContractAddress', () => Session.get('priceFeedContractAddress'));
Template.registerHelper('exchangeContractAddress', () => Session.get('exchangeContractAddress'));
Template.registerHelper('registrarContractAddress', () => Session.get('registrarContractAddress'));
Template.registerHelper('versionContractAddress', () => Session.get('versionContractAddress'));
Template.registerHelper('metaContractAddress', () => Session.get('metaContractAddress'));
