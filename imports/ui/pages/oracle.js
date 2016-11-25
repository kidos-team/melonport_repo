import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Session } from 'meteor/session';
import { $ } from 'meteor/jquery';

import { Transactions } from '/imports/api/transactions.js';

import './oracle.html';


Template.oracle.onCreated(function oracleOnCreated() {
  Meteor.subscribe('transactions');


});


Template.oracle.helpers({
  'settings'() {
    return {
      collection: Transactions,
      rowsPerPage: 5,
      showFilter: false,
      fields: [
        { key: 'createdAt', label: 'Tx Sent to Network At', sortOrder: 0, sortDirection: 'descending' },
        { key: 'prices',  label: '[BTC, USD, EUR]', sortOrder: 1, sortDirection: 'ascending'},
        { key: 'txHash',  label: 'Tx Hash', sortOrder: 2, sortDirection: 'ascending'},
      ],
    };
  },
});

Template.oracle.onRendered(function oracleOnRendered() {
});


Template.oracle.events({
});