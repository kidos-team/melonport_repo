import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';
import { FlowRouter } from 'meteor/kadira:flow-router';
import { Session } from 'meteor/session';
import { $ } from 'meteor/jquery';
import { BigNumber } from 'web3';

import { Assets } from '/imports/api/assets.js';

import './oracle.html';


Template.oracle.onCreated(() => {
  Meteor.subscribe('assets');
  Meteor.subscribe('liquidityProviderTransactions');
});


Template.oracle.helpers({
  'assets'() {
    return Assets.find({}, { sort: { createdAt: -1 } });
  },
  'formatPrice'() {
    const precision = this.precision;
    const divisor = Math.pow(10, precision);
    const price = this.priceFeed.price / divisor
    return price;
  },
  getStatus(UNIX_timestamp) {
    const now = new Date();
    const now_seconds = now / 1000;
    if (now_seconds - UNIX_timestamp > 5*60)
      return 'Delayed';
    return 'Current';
  },
  timeConverter(UNIX_timestamp) {
    var a = new Date(UNIX_timestamp * 1000);
    var months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
    var year = a.getFullYear();
    var month = months[a.getMonth()];
    var date = a.getDate();
    var hour = a.getHours();
    var min = a.getMinutes();
    var sec = a.getSeconds();
    var time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec ;
    return time;
  },
});

Template.oracle.onRendered(() => {});


Template.oracle.events({});
