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
"use strict";

var app = {
    serviceId: undefined,
    // Application Constructor
    initialize: function() {
        db.initialize(function(conn) {
            app.serviceId = getQueryParameters('id');
            if (app.serviceId) {
                app.serviceId = parseInt(app.serviceId);
                db.getService(app.serviceId, function(service) {
                    app.bindData(service);
                });
            }
            app.bindEvents();
        });
        // this.onDeviceReady();
    },
    bindData: function(service) {
        if (service) {
            var title = document.getElementsByTagName('title');
            if (title && title.length > 0) {
                title[0].innerHTML = title[0].innerHTML.replace('Add', 'Edit');
            }
            var heading = document.getElementsByTagName('h1');
            if (heading && heading.length > 0) {
                heading[0].innerHTML = heading[0].innerHTML.replace('Add', 'Edit');
            }
            document.getElementById('scheme').value = service.scheme;
            document.getElementById('host').value = service.host;
            document.getElementById('port').value = service.port;
            document.getElementById('path').value = service.path;
            document.getElementById('frequency').value = service.frequency;
        }
    },
    // Bind Event Listeners
    bindEvents: function() {
        // document.addEventListener('deviceready', this.onDeviceReady, false);
        var form = document.getElementById('add-service-form');
        var saveService = function(e) {
            e.preventDefault();
            if (form.checkValidity()) {
                var data = {
                    scheme: document.getElementById('scheme').value,
                    host: document.getElementById('host').value,
                    port: parseInt(document.getElementById('port').value),
                    path: document.getElementById('path').value,
                    frequency: parseInt(document.getElementById('frequency').value),
                };
                if (app.serviceId) {
                    parent.postMessage('show-loading', '*');
                    db.modifyService(app.serviceId, data, function(service) {
                        parent.postMessage('hide-loading', '*');
                        parent.postMessage('add-service-'+service.id, '*');
                    });
                }
                else {
                    parent.postMessage('show-loading', '*');
                    db.addService(data, function(id) {
                        parent.postMessage('hide-loading', '*');
                        parent.postMessage('add-service-'+id, '*');
                    });
                }
            }
            else {
                if (!document.getElementById('host').checkValidity()) {
                    window.alert('Invalid hostname.');
                    document.getElementById('host').focus();
                }
                else if (!document.getElementById('port').checkValidity()) {
                    window.alert('Invalid port.');
                    document.getElementById('port').focus();
                }
                else if (!document.getElementById('path').checkValidity()) {
                    window.alert('Invalid path.');
                    document.getElementById('path').focus();
                }
            }
            return false;
        }
        document.getElementById('scheme').addEventListener('change', function(e) {
            var portInput = document.getElementById('port');
            if (this.value == 'http') {
                portInput.value = 80;
            }
            else if (this.value == 'https') {
                portInput.value = 443;
            }
        });
        form.addEventListener('submit', saveService);
        document.getElementById('add-service').addEventListener('click', saveService);
        document.getElementById('cancel-service-add').addEventListener('click', function(e) {
            e.preventDefault();
            parent.postMessage('cancel-service-add', '*');
            return false;
        });
    },
    // deviceready Event Handler
    // onDeviceReady: function() {
        // console.log('Device Ready!');
    // }
};

app.initialize();
