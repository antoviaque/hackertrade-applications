
Applications = new Meteor.Collection("applications_hackers");
Meteor.subscribe('applications_hackers');

Session.set('search_text', '');

function urlize(text) {
    var list = text.match(/\b(http:\/\/|www\.|http:\/\/www\.)[^ \n\r<]{2,200}\b/g);
    if(list) {
        for(i = 0; i < list.length; i++) {
            console.log(list[i]);
            var prot = list[i].indexOf('http://') === 0 || list[i].indexOf('https://') === 0 ? '' : 'http://';
            text = text.replace( list[i], "<a target='_blank' href='" + prot + list[i] + "'>"+ list[i] + "</a>" );
        }
    }
    return text;
}

function text2html(text) {
    var converter = new Showdown.converter();
    var html = converter.makeHtml(text);
    html = urlize(html);
    return html;
}

function format_db_applications(applications) {
    var formatted = [];

    applications.forEach(function(application) {
        application['links'] = text2html(application['links']);
        application['previous_works'] = text2html(application['previous_works']);
        application['price'] = text2html(application['price']);
        application['availabilities'] = text2html(application['availabilities']);
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

