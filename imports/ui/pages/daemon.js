import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Session } from 'meteor/session';
import { $ } from 'meteor/jquery';

import { Transactions } from '/imports/api/transactions.js';

import './daemon.html';


Template.daemon.onCreated(function daemonOnCreated() {
  Meteor.subscribe('transactions');

  Session.set('isServerConnected', true);
  Meteor.call('isServerConnected', (err, result) => {
    if(!err) {
      Session.set('isServerConnected', result);
    } else {
      console.log(err);
    }
  });
});


Template.daemon.helpers({
  'settings'() {
    return {
      collection: Transactions,
      rowsPerPage: 5,
      showFilter: true,
      fields: [
        { key: 'createdAt', label: 'Tx Sent to Network At', sortOrder: 0, sortDirection: 'descending' },
        { key: 'prices',  label: '[BTC, USD, EUR]', sortOrder: 1, sortDirection: 'ascending'},
        { key: 'txHash',  label: 'Tx Hash', sortOrder: 2, sortDirection: 'ascending'},
      ],
    };
  },
});

Template.daemon.onRendered(function daemonOnRendered() {
});


Template.daemon.events({
});
