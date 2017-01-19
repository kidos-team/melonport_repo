import { Meteor } from 'meteor/meteor';
import { Template } from 'meteor/templating';

import { Assets } from '/imports/api/assets.js';

import './oracle.html';


Template.oracle.onCreated(() => {
  Meteor.subscribe('assets');
  Meteor.subscribe('liquidityProviderTransactions');
});


Template.oracle.helpers({
  assets() {
    return Assets.find({}, { sort: { createdAt: -1 } });
  },
  formatPrice() {
    const precision = this.precision;
    const divisor = 10 ** precision;
    const price = this.priceFeed.price / divisor;
    return price;
  },
  getStatus(unixTimestamp) {
    const now = new Date();
    const nowSeconds = now / 1000;
    if (nowSeconds - unixTimestamp > 5 * 60) {
      return 'Delayed';
    }
    return 'Current';
  },
  timeConverter(unixTimestamp) {
    const a = new Date(unixTimestamp * 1000);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const year = a.getFullYear();
    const month = months[a.getMonth()];
    const date = a.getDate();
    const hour = a.getHours();
    const min = a.getMinutes();
    const sec = a.getSeconds();
    const time = date + ' ' + month + ' ' + year + ' ' + hour + ':' + min + ':' + sec;
    return time;
  },
});

Template.oracle.onRendered(() => {});


Template.oracle.events({});
