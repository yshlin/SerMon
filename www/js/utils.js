"use strict";

document.body.addEventListener('contextmenu', function(e) {
    e.preventDefault();
    return false;
}, false);

function notify(title, message) {
    if (device.platform == 'firefoxos') {
        var n = new Notification(title + ': ' + message);
    }
    else {
        window.plugin.notification.local.add({title: title, message: message, led: 'FF0000'});
    }    
    navigator.notification.vibrate(2200);
}

function prettyDate(time){
    var date = new Date(time),
        diff = (((new Date()).getTime() - date.getTime()) / 1000),
        day_diff = Math.floor(diff / 86400);
            
    if ( isNaN(day_diff) || day_diff < 0 || day_diff >= 31 )
        return;
            
    return day_diff == 0 && (
            diff < 60 && "just now" ||
            diff < 120 && "1 minute ago" ||
            diff < 3600 && Math.floor( diff / 60 ) + " minutes ago" ||
            diff < 7200 && "1 hour ago" ||
            diff < 86400 && Math.floor( diff / 3600 ) + " hours ago") ||
        day_diff == 1 && "Yesterday" ||
        day_diff < 7 && day_diff + " days ago" ||
        day_diff < 31 && Math.ceil( day_diff / 7 ) + " weeks ago";
}

function getQueryParameters(name) {
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i=0;i<vars.length;i++) {
        var pair = vars[i].split("=");
        if (pair[0] == name) {
            return pair[1];
        }
    } 
    return '';
}

 function endsWith(str, suffix) {
    return str.indexOf(suffix, this.length - suffix.length) !== -1;
};

function startsWith(str, suffix) {
    return str.indexOf(suffix) == 0;
};

var Popup = {
    popup: undefined,
    initialize: function() {
        var pop = document.createElement('div');
        pop.id="popup";
        pop.innerHTML = '<iframe src="about:blank"></iframe>';
        Popup.popup = document.body.appendChild(pop);
    },
    postMessage: function(message) {
        if (Popup.popup.firstChild.src != 'about:blank') {
            Popup.popup.firstChild.contentWindow.postMessage(message, '*');
        }
    },
    show: function(url) {
        Popup.popup.firstChild.src = url;
        Popup.popup.className = 'show';
    },
    hide: function() {
        Popup.popup.firstChild.src = 'about:blank';
        Popup.popup.className = '';
    }
};

var Loading = {
    indicator: undefined,
    initialize: function() {
        var ind = document.createElement('div');
        ind.id = 'loading-indicator';
        ind.innerHTML = '<div></div><div></div><div></div><div></div><div></div><div></div><div></div><div></div>';
        Loading.indicator = document.body.appendChild(ind);
    },
    show: function() {
        Loading.indicator.className = 'show';
    },
    hide: function() {
        Loading.indicator.className = '';
    }
};

var Tooltip = {
    tooltip: undefined,
    target: undefined,
    contentGenerator: undefined,
    initialize: function(contentGenerator) {
        var tt = document.createElement('div');
        tt.id = 'tooltip';
        Tooltip.tooltip = document.body.appendChild(tt);
        Tooltip.contentGenerator = contentGenerator;
        Tooltip.bindEvents();
    },
    bindEvents: function() {
        //no need for dynamic generated content.
        /*
        var targets = document.querySelectorAll('[data-rel=tooltip]');
        for (var i = 0; i < targets.length; ++i) {
            console.log(targets[i]);
            targets[i].addEventListener('click', Tooltip.show);
            //targets[i].addEventListener('mouseleave', Tooltip.hide);
        }
        */
        Tooltip.tooltip.addEventListener('click', Tooltip.hide);
        window.addEventListener('resize', Tooltip.show);
    },
    show: function()
    {
        Tooltip.target = this;
        var tip;
        if (Tooltip.contentGenerator) {
            tip = Tooltip.contentGenerator(Tooltip.target);
        }
        else {
            tip = Tooltip.target['title'];
        }
        if (!tip || tip == '') {            
            return false;
        }
        Tooltip.tooltip.innerHTML = tip ;
        if (window.innerWidth < Tooltip.tooltip.offsetWidth * 1.5) {
            Tooltip.tooltip.style.maxWidth = (window.innerWidth / 2)+'px';
        }
        else {
            Tooltip.tooltip.style.maxWidth = 320 + 'px';
        }
        
        var pos_left = Tooltip.target.offsetLeft + ( Tooltip.target.offsetWidth / 2 ) - ( Tooltip.tooltip.offsetWidth / 2 ),
            pos_top  = Tooltip.target.offsetTop - Tooltip.tooltip.offsetHeight - 20;

        if (pos_left < 0) {
            pos_left = Tooltip.target.offsetLeft + Tooltip.target.offsetWidth / 2 - 20;
            Tooltip.tooltip.className += ' left';
        }
        else {
            Tooltip.tooltip.className = Tooltip.tooltip.className.replace('left', '');
        }
        
        if (pos_left + Tooltip.tooltip.offsetWidth > window.innerWidth) {
            pos_left = Tooltip.target.offsetLeft - Tooltip.tooltip.offsetWidth + Tooltip.target.offsetWidth / 2 + 20;
            Tooltip.tooltip.className +=' right';
        }
        else {
            Tooltip.tooltip.className = Tooltip.tooltip.className.replace('right', '');
        }
        
        if (pos_top < 0) {
            var pos_top  = Tooltip.target.offsetTop + Tooltip.target.offsetHeight;
            Tooltip.tooltip.className += ' top';
        }
        else {
            Tooltip.tooltip.className = Tooltip.tooltip.className.replace('top', '');
        }
        
        Tooltip.tooltip.style.left = pos_left + 'px';
        Tooltip.tooltip.style.top = pos_top + 'px';

        Tooltip.tooltip.className += ' show';
    },
    hide: function()
    {
        Tooltip.tooltip.className = '';
    }
};
