import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';

export const Transactions = new Mongo.Collection('transactions');

if (Meteor.isServer) {
  // This code only runs on the server
  Meteor.publish('transactions', function transactionsPublication() {
    return Transactions.find();
  });
}

Meteor.methods({
  'transactions.insert'(address) {
    check(address, String);
    Transactions.insert({
      address,
      createdAt: new Date(),
    });
  },
});
