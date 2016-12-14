import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';

export const LiquidityProviderTransactions = new Mongo.Collection('liquidityProviderTransactions');

if (Meteor.isServer) {
  // This code only runs on the server
  Meteor.publish('liquidityProviderTransactions', function liquidityProviderTransactionsPublication() {
    return LiquidityProviderTransactions.find({}, { sort: { createdAt: -1 } });
  });
}

Meteor.methods({
  'liquidityProviderTransactions.insert'(address) {
    check(address, String);
    LiquidityProviderTransactions.insert({
      address,
      createdAt: new Date(),
    });
  },
});
