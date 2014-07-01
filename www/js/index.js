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
    wifiLock: undefined,
    connected: false,
    tasks: {},
    getServiceTemplate: function() {
        var template = document.createElement('li');
        template.className = 'service';
        template.innerHTML = '<a class="service-link" href=""><span class="indicator"> </span><span class="service-url"></span><span class="last-check"></span></a>';
        return template;
    },
    // Application Constructor
    initialize: function() {
        this.bindEvents();
    },
    // Bind Event Listeners
    //
    // Bind any events that are required on startup. Common events are:
    // 'load', 'deviceready', 'offline', and 'online'.
    bindEvents: function() {
        window.addEventListener('load', function () {
          Notification.requestPermission(function (status) {
            // This allows to use Notification.permission with Chrome/Safari
            if (Notification.permission !== status) {
              Notification.permission = status;
            }
          });
        });
        document.addEventListener('deviceready', this.onDeviceReady, false);
        document.getElementById('check-all').addEventListener('click', function(e) {
            e.preventDefault();
            db.listServices(function(service) {
                if (service) {
                    app.checkServiceStatus(service.id, service.url);
                }
            });
            return false;
        });
        document.getElementById('add-service').addEventListener('click', function(e) {
            e.preventDefault();
            var popup = document.getElementById('popup');
            popup.firstChild.src = 'add_service.html';
            popup.className = 'show';
            return false;
        });
        document.addEventListener('online', function() { app.connected = true; console.log('Now online.'); });
        document.addEventListener('offline', function() { app.connected = false; console.log('Now offline.'); });
        window.addEventListener('message', function(e) {
            console.log(e.data);
            if (e.data.startsWith('check-service-')) {
                // check service
                var serviceId = parseInt(e.data.substring(14));
                db.getService(serviceId, function(service) {
                    app.checkServiceStatus(serviceId, service.url, function(service) {
                        // callback when ready
                        popup.firstChild.contentWindow.postMessage('service-checked', '*');
                    });
                });
                return;
            }
            else if (e.data.startsWith('edit-service-')) {
                var serviceId = parseInt(e.data.substring(13));
                popup.firstChild.src = 'add_service.html?id='+serviceId;
                return;
            }
            else if (e.data.startsWith('add-service-')) {
                // render newly added service
                var serviceId = parseInt(e.data.substring(12));
                chronos.clearInterval(app.tasks[serviceId]);
                delete app.tasks[serviceId];
                db.getService(serviceId, function(service) {
                    if (service) {
                        app.renderService(service);
                        if (service.frequency > 0) {
                            // begin periodic check
                            var taskId = chronos.setInterval(function() {
                                app.checkServiceStatus(service.id, service.url);
                            }, service.frequency * 60 * 1000);                
                            app.tasks[service.id] = taskId;
                        }
                        else {
                            app.checkServiceStatus(service.id, service.url);
                        }
                    }
                });
            }
            else if (e.data.startsWith('delete-service-')) {
                // remove deleted service from UI
                var serviceId = parseInt(e.data.substring(15));
                document.getElementById('service-'+serviceId).remove();
                db.removeService(serviceId, function(e) {
                    chronos.clearInterval(app.tasks[serviceId]);
                    delete app.tasks[serviceId];
                })
            }
            popup.firstChild.src = 'about:blank';
            document.getElementById('popup').className = '';
        });
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        console.log('Device Ready!');
        console.log('Connection type: ' + navigator.connection.type);
        app.connected = (navigator.connection.type != Connection.NONE);
        if (window.navigator.requestWakeLock) {
            app.wifiLock = window.navigator.requestWakeLock('wifi');            
        }
        window.plugin.backgroundMode.enable();
        db.initialize(function(conn) {
            db.listServices(function(service) {
                if (service) {
                    app.renderService(service);
                    if (service.frequency > 0) {
                        var taskId = chronos.setInterval(function() {
                            app.checkServiceStatus(service.id, service.url);
                        }, service.frequency * 60 * 1000);                
                        app.tasks[service.id] = taskId;
                    }
                    else {
                        app.checkServiceStatus(service.id, service.url);
                    }
                }
            });
        });
    },
    renderService: function(service) {
        console.info(service);
        var data = {
            'service-link': {
                'service-url': service.url,
                'last-check': (service.lastCheck ? 'Checked ' + prettyDate(service.lastCheck) : 'Never checked')                
            }
        };
        var directive = {
            'service-link': {
                href: function() {
                    return '/service_status.html?id='+service.id
                },
                indicator: {
                    class: function() {
                        return 'indicator ' + service.indicator;
                    } 
                }
            }
        };
        var elem = document.getElementById('service-'+service.id);
        if (elem) {
            Transparency.render(elem, data, directive);
        }
        else {
            var result = Transparency.render(app.getServiceTemplate(), data, directive);
            result.id = 'service-' + service.id;
            result.addEventListener('click', function(e) {
                e.preventDefault();
                var popup = document.getElementById('popup');
                popup.firstChild.src = 'service_status.html?id='+service.id;
                popup.className = 'show';
                return false;
            });
            var services = document.getElementById('services');
            services.appendChild(result);
        }
    },
    urlStatus: function (url, callback)
    {
        var http = new XMLHttpRequest({mozSystem: true});
        http.onreadystatechange = function() {
            switch(http.readyState) {
                case 2:
                    callback(http.status, http.statusText);
                    console.log('http status: '+http.status+' '+http.statusText);
                case 0:
                case 1:
                case 3:
                case 4:
                    console.log('readystatechange: ' + http.readyState);
                    break;
                default:
                    break;
            }
        };
        http.open('HEAD', url + (url.indexOf('?') == -1 ? '?' : '&') + new Date().getTime(), true);
        http.send(null);
    },

    logServiceStatus: function(serviceId, log, callback) {
        log.serviceId = serviceId;
        log.timestamp = new Date().getTime();
        db.addServiceLog(serviceId, log, function() {
            console.log('Service log added.');
            var data =  {
                lastCheck: log.timestamp,
                indicator: log.indicator,
                latestStatus: (log.statusCode >= 200) ? (''+log.statusCode+' '+log.statusText) : log.errorMessage
            };
            db.modifyService(serviceId, data, function(service) {
                console.log('Service info updated.');
                app.renderService(service);
                if (callback) {
                    callback(service);
                }
            });
        });
    },

    checkServiceStatus: function(serviceId, url, callback) {
        // if (!app.connected) {
            // console.log('No connection.');
            // app.logServiceStatus(serviceId, {indicator: 'gray', errorMessage: 'No network connection.'});
        // }
        // else {
            try {
                app.urlStatus(url, function(status, statusText) {
                    if (0 == status || undefined == status) {
                        app.logServiceStatus(serviceId, {indicator: 'gray', errorMessage: 'No network connection.'}, callback);
                    }
                    else if (status != 200) {
                        //service down
                        app.logServiceStatus(serviceId, {indicator: 'red', statusCode: status, statusText: statusText}, callback);
                        navigator.notification.vibrate(2200);
                        if (device.platform == 'firefoxos') {
                            var n = new Notification('Server Down Alert: '+url);
                        }
                        else {
                            window.plugin.notification.local.add({title: 'Server Down Alert', message: url, led: 'FF0000'});
                        }
                    }
                    else {
                        //service is fine
                        app.logServiceStatus(serviceId, {indicator: 'green', statusCode: status, statusText: statusText}, callback);
                    }                    
                });
            }
            catch (e) {
                //network problem
                console.log(e.name);
                console.log(e.message);
                console.log(e);
                app.logServiceStatus(serviceId, {indicator: 'gray', errorMessage: e.name + ': ' + e.message}, callback);
            }
        // }
    }
};

app.initialize();
