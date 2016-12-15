import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Session } from 'meteor/session';
import { $ } from 'meteor/jquery';

import { PriceFeedTransactions } from '/imports/api/priceFeedTransactions.js';
import { LiquidityProviderTransactions } from '/imports/api/liquidityProviderTransactions.js';

import './data.html';


Template.data.onCreated(function dataOnCreated() {
  Meteor.subscribe('priceFeedTransactions');
  Meteor.subscribe('liquidityProviderTransactions');
});


Template.data.helpers({
  'oracle'() {
    return {
      collection: PriceFeedTransactions,
      rowsPerPage: 5,
      showFilter: false,
      fields: [
        { key: 'createdAt', label: 'Tx Sent to Network At', sortOrder: 0, sortDirection: 'descending' },
        { key: 'BTC',  label: 'BTC/ETH', sortOrder: 1, sortDirection: 'ascending'},
        { key: 'USD',  label: 'USD/ETH', sortOrder: 2, sortDirection: 'ascending'},
        { key: 'EUR',  label: 'EUR/ETH', sortOrder: 3, sortDirection: 'ascending'},
        { key: 'lastUpdate', label: 'Contract Timestamp', sortOrder: 0, sortDirection: 'descending' },
      ],
    };
  },
  'liquidityProvider'() {
    return {
      collection: LiquidityProviderTransactions,
      rowsPerPage: 5,
      showFilter: false,
      fields: [
        { key: 'createdAt', label: 'Tx Sent to Network At', sortOrder: 0, sortDirection: 'descending' },
        { key: 'sell_how_much',  label: 'Sell how much', sortOrder: 1, sortDirection: 'ascending'},
        { key: 'sell_which_token',  label: 'Sell which token', sortOrder: 2, sortDirection: 'ascending'},
        { key: 'buy_how_much',  label: 'Buy how much', sortOrder: 3, sortDirection: 'ascending'},
        { key: 'buy_which_token',  label: 'Buy which token', sortOrder: 3, sortDirection: 'ascending'},
        { key: 'owner',  label: 'Owner', sortOrder: 3, sortDirection: 'ascending'},
        { key: 'id',  label: 'id', sortOrder: 3, sortDirection: 'ascending'},
        { key: 'active',  label: 'Active', sortOrder: 3, sortDirection: 'ascending'},
      ],
    };
  },
});

Template.data.onRendered(function dataOnRendered() {
});


Template.data.events({
});
