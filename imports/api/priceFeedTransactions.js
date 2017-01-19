import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

export const PriceFeedTransactions = new Mongo.Collection('priceFeedTransactions');

if (Meteor.isServer) {
  // This code only runs on the server
  Meteor.publish('priceFeedTransactions', () =>
    PriceFeedTransactions.find({}, { sort: { createdAt: -1 } }),
  );
}
