
Applications = new Meteor.Collection("applications_hackers");
Meteor.subscribe('applications_hackers');

Session.set('search_text', '');

function format_db_applications(applications) {
    var formatted = [];
    var converter = new Showdown.converter();

    applications.forEach(function(application) {
        application['links'] = converter.makeHtml(application['links']);
        application['previous_works'] = converter.makeHtml(application['previous_works']);
        application['price'] = converter.makeHtml(application['price']);
        application['availabilities'] = converter.makeHtml(application['availabilities']);
        formatted.push(application);
    });

    return formatted;
}

Template.applications.results = function () {
    var search_text = Session.get('search_text');
    if(search_text === '') {
        var applications = Applications.find({});
    } else {
        var applications = Applications.find({ $or: [
                { name: {$regex: search_text, $options: 'i'}},
                { links: {$regex: search_text, $options: 'i'}},
                { email: {$regex: search_text, $options: 'i'}},
                { previous_works: {$regex: search_text, $options: 'i'}},
                { price: {$regex: search_text, $options: 'i'}},
                { availabilities: {$regex: search_text, $options: 'i'}},
        ]});
    }

    return format_db_applications(applications);
};

Template.search.events = {
    'keyup #search-input': function(evt) {
        if(evt.type === "keyup" && evt.which === 13 || evt.type === "focusout") {
            Session.set('search_text', $('#search-input').val());
        }
    },
}

