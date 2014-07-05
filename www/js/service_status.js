/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * 'License'); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * 'AS IS' BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

var app = {
    serviceId: undefined,
    service: undefined,
    lastLogTimestamp: undefined,
    reachLogBottom: false,
    readyToLoadMore: false,
    logIndices: [],
    // Application Constructor
    initialize: function() {
        this.bindEvents();
        this.onDeviceReady();
    },
    // Bind Event Listeners
    bindEvents: function() {
        // document.addEventListener('deviceready', this.onDeviceReady, false);
        window.onscroll = function(ev) {
            if ((window.innerHeight + window.scrollY) >= document.body.offsetHeight) {
                // you're at the bottom of the page
                if (app.readyToLoadMore && !app.reachLogBottom) {
                    parent.postMessage('show-loading', '*');
                    app.loadServiceLogData(app.service, function() {
                        parent.postMessage('hide-loading', '*');
                    });
                }
            }
        };
        window.addEventListener('message', function(e) {
            // console.log(e.data);
            if (e.data.startsWith('service-checked-')) {
                var checkedId = parseInt(e.data.substring(16));
                if (checkedId && app.serviceId == checkedId) {
                    parent.postMessage('show-loading', '*');
                    app.loadNewServiceLogData(app.service, function() {
                        parent.postMessage('hide-loading', '*');
                    });
                }
            }
        });
        document.getElementById('back-to-list').addEventListener('click', function(e) {
            e.preventDefault();
            parent.postMessage('back-to-list', '*');
            return false;
        });
        document.getElementById('check-service').addEventListener('click', function(e) {
            e.preventDefault();
            parent.postMessage('check-service-'+app.serviceId, '*');
            return false;
        });
        document.getElementById('edit-service').addEventListener('click', function(e) {
            e.preventDefault();
            parent.postMessage('edit-service-'+app.serviceId, '*');
            return false;
        });
        document.getElementById('delete-service').addEventListener('click', function(e) {
            e.preventDefault();
            // window.confirm('Sure you wanna delete this service?', function(confirmed) {
                // console.log(confirmed);
                // if (confirmed) {
                    parent.postMessage('delete-service-'+app.serviceId, '*');
                // }
            // });
            return false;
        });
        document.getElementById('clear-logs').addEventListener('click', function(e) {
            e.preventDefault();
            parent.postMessage('show-loading', '*');            
            db.removeOldServiceLogs(app.serviceId, 0, function(e) {
                app.clearServiceData();
                app.loadServiceData(function() {
                    parent.postMessage('hide-loading', '*');
                });
            })
            return false;
        });
    },
    getLogTemplate: function() {
        var template = document.createElement('li');
        template.className = 'log';
        template.dataset.rel = 'tooltip';
        template.innerHTML = '<span class="indicator"> </span>';
        return template;
    },
    getFrequencyLabel: function(frequency) {
        if (frequency == 0 || frequency == undefined) {
            return 'Manual';
        }
        else if (frequency == 1) {
            return '1 Minute';
        }
        else if (frequency > 1 && frequency < 60) {
            return '' + frequency + ' Minutes';
        }
        else if (frequency == 60) {
            return '1 Hour';
        }
        else if (frequency > 60 && frequency < 1440) {
            return '' + (frequency / 60) + ' Hours';
        }
        else if (frequency == 1440) {
            return '1 Day';
        }
        else {
            return '' + (frequency / 1440) + ' Days';
        }
    },
    clearServiceData: function() {
        app.lastLogTimestamp = undefined;
        app.readyToLoadMore = false;
        var logs = document.getElementById('monitor-logs');
        logs.innerHTML = '';
    },
    loadServiceData: function(callback) {
        db.getService(app.serviceId, function(service) {
            // console.log(service);
            if (service) {
                Transparency.render(document.getElementById('service-status'), {
                    'service-url': service.url,
                    'check-frequency': app.getFrequencyLabel(service.frequency),
                    'last-checked': service.lastCheck ? new Date(service.lastCheck).toLocaleString() : 'Never'
                }, {
                    'latest-status': {
                        html: function() {
                            return '<span class="indicator '+service.indicator+'"></span>'+service.latestStatus;
                        }
                    }
                });
                app.service = service;
                app.loadServiceLogData(service, callback);
            }
        });
    },
    loadServiceLogData: function(service, callback) {
        app.readyToLoadMore = false;
        if (!app.lastLogTimestamp) {
            app.lastLogTimestamp = new Date().getTime();
        }
        db.getServiceLogsPage(service.id, app.lastLogTimestamp, function(logs) {
            if (logs && logs.length > 0) {
                // console.log(log);
                var logsContainer = document.getElementById('monitor-logs');
                var fragment = document.createDocumentFragment();
                var log = undefined;
                for (var i = 0; i < logs.length; i++) {
                    log = logs[i];
                    //fills empty indicators
                    var prevLog = logs[i-1];
                    if (!prevLog) {
                        prevLog = {timestamp: app.lastLogTimestamp};
                    }
                    fragment.appendChild(app.buildSkippedLog(service, log, prevLog));
                    fragment.appendChild(app.buildCheckLog(log));
                }
                app.lastLogTimestamp = log.timestamp;
                logsContainer.appendChild(fragment);
            }
            else {
                app.reachLogBottom = true;
            }
            if (callback) {
                callback();
            }
            app.readyToLoadMore = true;
        });
    },
    loadNewServiceLogData: function(service, callback) {
        db.getLatestLog(service.id, function(log) {
            if (log) {
                //FIXME: this is not accurate, but the logic is already too complicated.
                var logsContainer = document.getElementById('monitor-logs');
                var fragment = document.createDocumentFragment();
                var checked = app.buildCheckLog(log);
                var skipped = app.buildSkippedLog(service, log, undefined);
                if (checked.querySelector('.index')) {
                    logsContainer.insertBefore(checked, logsContainer.firstChild);
                    logsContainer.insertBefore(skipped, logsContainer.firstChild);
                }
                else {
                    var firstIndex = logsContainer.querySelector('.index');
                    if (firstIndex) {
                        logsContainer.insertBefore(checked, firstIndex.nextSibling);
                        if (skipped.querySelector('.index')) {
                            logsContainer.insertBefore(skipped, logsContainer.firstChild);
                        }
                        else {
                            logsContainer.insertBefore(skipped, firstIndex.nextSibling);
                        }
                    }
                    else {
                        logsContainer.insertBefore(checked, logsContainer.firstChild);
                        logsContainer.insertBefore(skipped, logsContainer.firstChild);
                    }
                }
            }
            if (callback) {
                callback();
            }
        });
    },
    buildTimeIndex: function(timestamp) {
        var logTime = new Date(timestamp);
        var month = logTime.getMonth() + 1;
        var day = logTime.getDate();
        var hour = logTime.getHours();
        var hour12 = (hour > 12) ? (hour - 12) : hour
        var ampm = (hour / 12 >= 1) ? 'pm' : 'am';
        var index = month+'-'+day+'-'+hour;
        if (app.logIndices.indexOf(index) == -1) {
            app.logIndices.push(index);
            var idx = document.createElement('li');
            idx.id = index;
            idx.className = 'index';
            idx.innerHTML = '<span><span>' + month + '/' + day + '</span>' + hour12 + ampm + '</span>';
            return idx;
        }
        return null;
    },
    buildSkippedLog: function(service, log, prevLog) {
        var fragment = document.createDocumentFragment();
        var prevLogTimestamp = new Date().getTime();
        if (prevLog) {
            prevLogTimestamp = prevLog.timestamp;
        }                            
        var diff = prevLogTimestamp - log.timestamp;
        var skipped = Math.round(diff / 60 / 1000 / service.frequency) - 1;
        // console.log('Skipped '+skipped+' times.')
        if (skipped > 0) {
            for (var j = 0; j < skipped; j++) {
                var skippedTimestamp = prevLogTimestamp - service.frequency * (j + 1) * 60 * 1000;
                var idx = app.buildTimeIndex(skippedTimestamp);
                if (idx) {
                    fragment.appendChild(idx);
                }
                var outputSkipped = Transparency.render(app.getLogTemplate(), {}, {
                    indicator: {
                        class: function() {
                            return 'indicator';
                        },
                        title: function() {
                            return 'System didn\'t wake up.';
                        },
                        'data-timestamp': function() {
                            return skippedTimestamp;
                        }
                    }
                });
                outputSkipped.addEventListener('click', Tooltip.show);
                fragment.appendChild(outputSkipped);
            }
        }
        return fragment;
    },
    buildCheckLog: function(log) {
        var fragment = document.createDocumentFragment();
        var status = (log.statusCode >= 200) ? ''+log.statusCode+' '+log.statusText : log.errorMessage;
        var idx = app.buildTimeIndex(log.timestamp);
        if (idx) {
            fragment.appendChild(idx);
        }
        var output = Transparency.render(app.getLogTemplate(), {}, {
            indicator: {
                class: function() {
                    return 'indicator ' + log.indicator;
                },
                title: function() {
                    return status;
                },
                'data-timestamp': function() {
                    return log.timestamp;
                }
            }
        });
        output.addEventListener('click', Tooltip.show);
        fragment.appendChild(output);
        return fragment;
    },
    // deviceready Event Handler
    onDeviceReady: function() {
        app.serviceId = getQueryParameters('id');
        if (app.serviceId) {
            // console.log('Fetching service status for id: '+ app.serviceId);
            Tooltip.initialize(function(target) {
                var node = target.firstChild;
                return '<span class="'+node.className+'"> </span>' + node.title + '<br>' + new Date(parseInt(node['data-timestamp'])).toLocaleString();
            });
            app.serviceId = parseInt(app.serviceId);
            parent.postMessage('show-loading', '*');
            db.initialize(function(conn) {
                app.loadServiceData(function() {
                    parent.postMessage('hide-loading', '*');                    
                });
            });
        }
    }
};

app.initialize();
