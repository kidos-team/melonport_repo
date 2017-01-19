import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';

export const PriceFeedTransactions = new Mongo.Collection('priceFeedTransactions');

if (Meteor.isServer) {
  // This code only runs on the server
  Meteor.publish('priceFeedTransactions', function priceFeedTransactionsPublication() {
    return PriceFeedTransactions.find({}, { sort: { createdAt: -1 } });
  });
}
