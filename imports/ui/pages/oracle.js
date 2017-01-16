import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Session } from 'meteor/session';
import { $ } from 'meteor/jquery';

import { PriceFeedTransactions } from '/imports/api/priceFeedTransactions.js';
import { LiquidityProviderTransactions } from '/imports/api/liquidityProviderTransactions.js';

import './oracle.html';


Template.oracle.onCreated(() => {
  Meteor.subscribe('priceFeedTransactions');
  Meteor.subscribe('liquidityProviderTransactions');
});


Template.oracle.helpers({
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
});

Template.oracle.onRendered(() => {});


Template.oracle.events({});
