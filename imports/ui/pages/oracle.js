import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Session } from 'meteor/session';
import { $ } from 'meteor/jquery';

import { PriceFeedTransactions } from '/imports/api/priceFeedTransactions.js';

import './oracle.html';


Template.oracle.onCreated(function oracleOnCreated() {
  Meteor.subscribe('priceFeedTransactions');
});


Template.oracle.helpers({
  'settings'() {
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

Template.oracle.onRendered(function oracleOnRendered() {
});


Template.oracle.events({
});
