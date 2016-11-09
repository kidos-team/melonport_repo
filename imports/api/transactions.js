import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';

export const Transactions = new Mongo.Collection('transactions');


Meteor.methods({
  'transactions.insert'(address) {
    check(address, String);
    Transactions.insert({
      ip: this.connection.clientAddress,
      address,
      createdAt: new Date(),
    });
  },
});
