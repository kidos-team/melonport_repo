import { Meteor } from 'meteor/meteor';
import { Mongo } from 'meteor/mongo';
import { check } from 'meteor/check';

export const Assets = new Mongo.Collection('assets');

if (Meteor.isServer) {
  // This code only runs on the server
  Meteor.publish('assets', () => {
    return Assets.find({}, { sort: { name: -1, createdAt: -1 } });
  });
}

Meteor.methods({});
