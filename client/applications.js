//
//  Copyright (C) 2012 Xavier Antoviaque <xavier@antoviaque.org>
//  Copyright (C) 2012 Meteor <contact@meteor.com>
//
//  This software's license gives you freedom; you can copy, convey,
//  propagate, redistribute and/or modify this program under the terms of
//  the GNU Affero General Public License (AGPL) as published by the Free
//  Software Foundation (FSF), either version 3 of the License, or (at your
//  option) any later version of the AGPL published by the FSF.
//
//  This program is distributed in the hope that it will be useful, but
//  WITHOUT ANY WARRANTY; without even the implied warranty of
//  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero
//  General Public License for more details.
//
//  You should have received a copy of the GNU Affero General Public License
//  along with this program in a file in the toplevel directory called
//  "AGPLv3".  If not, see <http://www.gnu.org/licenses/>.
//


// DB Collections ////////////////////////////////////////////////////////

Applications = new Meteor.Collection("applications_hackers");
Meteor.subscribe('applications_hackers');


// Session variables /////////////////////////////////////////////////////
// Text from the search input field
Session.set('search_text', '');

// _id of the application for which a new tag is being added
Session.equals('editing_addtag', null);

// Utils /////////////////////////////////////////////////////////////////

// Formatting //

function urlize(text) {
    var list = text.match(/\b(http:\/\/|www\.|http:\/\/www\.)[^ \n\r<]{2,200}\b/g);
    if(list) {
        for(i = 0; i < list.length; i++) {
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

// In-place editing //

// Returns an event_map key for attaching "ok/cancel" events to
// a text input (given by selector)
var okcancel_events = function (selector) {
    return 'keyup '+selector+', keydown '+selector+', focusout '+selector;
};

// Creates an event handler for interpreting "escape", "return", and "blur"
// on a text field and calling "ok" or "cancel" callbacks.
var make_okcancel_handler = function(options) {
    var ok = options.ok || function() {};
    var cancel = options.cancel || function() {};

    return function(evt) {
        if(evt.type === "keydown" && evt.which === 27) {
            // escape = cancel
            cancel.call(this, evt);

        } else if(evt.type === "keyup" && evt.which === 13 ||
                  evt.type === "focusout") {
            // blur/return/enter = ok/submit if non-empty
            var value = String(evt.target.value || "");
            if(value) {
                ok.call(this, value, evt);
            } else {
                cancel.call(this, evt);
            }
        };
    };
};

// Finds a text input in the DOM by id and focuses it.
var focus_field_by_id = function(id) {
    var input = document.getElementById(id);
    if(input) {
        input.focus();
        input.select();
    }
};


// Templates /////////////////////////////////////////////////////////////

// {{> applications }}

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

// {{> application_item }}

Template.application_item.tag_objs = function () {
    var application_id = this._id;
    return _.map(this.tags || [], function (tag) {
        return {application_id: application_id, tag: tag};
    });
};

Template.application_item.adding_tag = function () {
    return Session.equals('editing_addtag', this._id);
};


// Events ////////////////////////////////////////////////////////////////

// {{> search }}

Template.search.events = {
    'keyup #search-input': function(evt) {
        if(evt.type === "keyup" && evt.which === 13 || evt.type === "focusout") {
            Session.set('search_text', $('#search-input').val());
        }
    },
}

// {{> application_item }}

Template.application_item.events = {
    'click .addtag': function(evt) {
        Session.set('editing_addtag', this._id);
        Meteor.flush(); // update DOM before focus
        focus_field_by_id("edittag-input");
    },
};

Template.application_item.events[okcancel_events('#edittag-input')] =
    make_okcancel_handler({
        ok: function (value) {
            Applications.update(this._id, {$addToSet: {tags: value}});
            Session.set('editing_addtag', null);
        },
        cancel: function () {
            Session.set('editing_addtag', null);
        }
    });

// {{> application_tag }}

Template.application_tag.events = {
    'click .remove': function (evt) {
        var tag = this.tag;
        var id = this.application_id;

        evt.target.parentNode.style.opacity = 0;
        // wait for CSS animation to finish
        Meteor.setTimeout(function () {
            Applications.update({_id: id}, {$pull: {tags: tag}});
        }, 300);
   }
};



