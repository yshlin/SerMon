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
    // Application Constructor
    initialize: function() {
        this.bindEvents();
        this.onDeviceReady();
    },
    // Bind Event Listeners
    bindEvents: function() {
        // document.addEventListener('deviceready', this.onDeviceReady, false);
        window.addEventListener('message', function(e) {
            console.log(e.data);
            if (e.data.startsWith('service-checked-')) {
                var checkedId = parseInt(e.data.substring(16));
                if (checkedId && app.serviceId == checkedId) {
                    app.clearServiceData();
                    parent.postMessage('show-loading', '*');
                    app.loadServiceData(function() {
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
        var logs = document.getElementById('monitor-logs');
        logs.innerHTML = '';
    },
    loadServiceData: function(callback) {
        db.getService(app.serviceId, function(service) {
            console.log(service);
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
                db.listServiceLogs(app.serviceId, function(log) {
                    if (log) {
                        // console.log(log);
                        var logs = document.getElementById('monitor-logs');
                        //fills empty indicators, but can't get the time diff right due to callback timing.
                        /*
                        if (logs.children.length > 0) {
                            var prevLog = logs.lastChild;
                            var diff = parseInt(prevLog.firstChild['data-timestamp']) - log.timestamp;
                            var skipped = Math.round(diff / 1000 / service.frequency) - 1;
                            console.log('Skipped '+skipped+' times.')
                            if (skipped > 0) {
                                for (var i = 0; i < skipped; i++) {
                                    var outputSkipped = Transparency.render(app.getLogTemplate(), {}, {
                                        indicator: {
                                            class: function() {
                                                return 'indicator';
                                            },
                                            title: function() {
                                                return 'System didn\'t wake up, skipped.';
                                            },
                                            'data-timestamp': function() {
                                                return log.timestamp - service.frequency * (i + 1);
                                            }
                                        }
                                    });
                                    logs.appendChild(outputSkipped);
                                }
                            }
                        }*/
                        var status = (log.statusCode >= 200) ? ''+log.statusCode+' '+log.statusText : log.errorMessage;
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
                        logs.appendChild(output);
                    }
                    else {
                        if (callback) {
                            callback();
                        }
                    }
                });
            }
        });
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
