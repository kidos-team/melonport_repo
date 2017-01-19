import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';

export const LiquidityProviderTransactions = new Mongo.Collection('liquidityProviderTransactions');

if (Meteor.isServer) {
  // This code only runs on the server
  Meteor.publish('liquidityProviderTransactions', () =>
    LiquidityProviderTransactions.find({}, { sort: { createdAt: -1 } }),
  );
}
