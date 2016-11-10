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
      rowsPerPage: 10,
      showFilter: true,
      fields: ['createdAt', 'address'],
    };
  },
});

Template.daemon.onRendered(function daemonOnRendered() {
});


Template.daemon.events({
});
