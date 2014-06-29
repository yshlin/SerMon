/*
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing,
 * software distributed under the License is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
 * KIND, either express or implied.  See the License for the
 * specific language governing permissions and limitations
 * under the License.
 */

var app = {
    wifiLock: undefined,
    connected: false,
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
        document.addEventListener('online', function() { app.connected = true; });
        document.addEventListener('offline', function() { app.connected = false; });
    },
    // deviceready Event Handler
    //
    // The scope of 'this' is the event. In order to call the 'receivedEvent'
    // function, we must explicitly call 'app.receivedEvent(...);'
    onDeviceReady: function() {
        app.connected = (navigator.connection.type != Connection.NONE);
        app.receivedEvent('deviceready');
        var serverHost = 'mozilla.com.tw';
        if (window.navigator.requestWakeLock) {
            app.wifiLock = window.navigator.requestWakeLock('wifi');            
        }
        window.plugin.backgroundMode.enable();
        chronos.setInterval(function() {
            if (!app.connected) {
                console.log('No connection.');
                app.logServiceStatus('gray');
            }
            else {
                try {
                    var status = app.urlStatus('http://'+serverHost, function(status) {
                        if (0 == status || undefined == status) {
                            app.logServiceStatus('gray');
                        }
                        else if (status != 200) {
                            //service down
                            app.logServiceStatus('red');
                            navigator.notification.vibrate(2200);
                            if (device.platform == 'firefoxos') {
                                var n = new Notification('Server Down Alert: '+serverHost);
                            }
                            else {
                                window.plugin.notification.local.add({title: 'Server Down Alert', message: serverHost, led: 'FF0000'});
                            }
                        }
                        else {
                            //service is fine
                            app.logServiceStatus('green');
                        }                    
                    });
                }
                catch (e) {
                    //network problem
                    console.log(e.name);
                    console.log(e.message);
                    console.log(e);
                    app.logServiceStatus('gray');
                }
            }
        }, 15 * 60 * 1000);
    },
    // Update DOM on a Received Event
    receivedEvent: function(id) {
        var parentElement = document.getElementById(id);
        var listeningElement = parentElement.querySelector('.listening');
        var receivedElement = parentElement.querySelector('.received');

        listeningElement.setAttribute('style', 'display:none;');
        receivedElement.setAttribute('style', 'display:block;');

        console.log('Received Event: ' + id);
    },

    urlStatus: function (url, callback)
    {
        var http = new XMLHttpRequest({mozSystem: true});
        http.open('HEAD', url+'?'+new Date().getTime());
        http.onreadystatechange = function() {
            if (http.readyState == 4) {
                console.log('http status: '+http.status+' '+http.statusText);
                callback(http.status);
            } else {
                console.log('readystatechange: ' + http.readyState);
            }            
        };
        http.send();
    },

    logServiceStatus: function(status) {
        var light = document.createElement('span');
        light.className = 'light ' + status;
        var logs = document.getElementById('monitor-logs');
        logs.appendChild(light);
    }
};

app.initialize();
