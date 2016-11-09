import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Session } from 'meteor/session';
import { $ } from 'meteor/jquery';
import { BigNumber } from 'web3';

import './daemon.html';


Template.daemon.onCreated(function daemonOnCreated() {
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
});


Template.daemon.onRendered(function daemonOnRendered() {
});


Template.daemon.events({
});
