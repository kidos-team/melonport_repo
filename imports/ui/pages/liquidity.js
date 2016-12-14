import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Session } from 'meteor/session';
import { $ } from 'meteor/jquery';

import { PriceFeedTransactions } from '/imports/api/priceFeedTransactions.js';

import './liquidity.html';


Template.liqidity.onCreated(function liqidityOnCreated() {
  Meteor.subscribe('priceFeedTransactions');
});


Template.liqidity.helpers({
  'settings'() {
    return {
      collection: PriceFeedTransactions,
      rowsPerPage: 5,
      showFilter: false,
      fields: [
        { key: 'createdAt', label: 'Tx Sent to Network At', sortOrder: 0, sortDirection: 'descending' },
        { key: 'BTC',  label: 'BTC', key: 'USD',  label: 'USD', key: 'EUR',  label: 'EUR', sortOrder: 1, sortDirection: 'ascending'},
        { key: 'txHash',  label: 'Tx Hash', sortOrder: 2, sortDirection: 'ascending'},
      ],
    };
  },
});

Template.liqidity.onRendered(function liqidityOnRendered() {
});


Template.liqidity.events({
});
