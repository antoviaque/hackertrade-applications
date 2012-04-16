Applications = new Meteor.Collection("applications_hackers");

Meteor.publish('applications_hackers', function () {
  return Applications.find();
});


