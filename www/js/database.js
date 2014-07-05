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

var db = {
    connection: undefined,
    logsPerPage: 120,
    initialize: function(callback) {
        var request = indexedDB.open('sermon', 1);
        request.onerror = function(event) {
            navigator.notification.alert('Init database error: ' + event.target.errorCode, function(){});
        };
        request.onsuccess = function(event) {
            db.connection = request.result;
            callback(db.connection);
        };
        request.onupgradeneeded = function(event) { 
            var conn = event.target.result;
            if (1 == conn.version) {
                var serviceObjectStore = conn.createObjectStore('service', { keyPath: 'id', autoIncrement: true });
                serviceObjectStore.createIndex('scheme', 'scheme', { unique: false });
                serviceObjectStore.createIndex('host', 'host', { unique: false });
                serviceObjectStore.createIndex('port', 'port', { unique: false });
                serviceObjectStore.createIndex('path', 'path', { unique: false });
                serviceObjectStore.createIndex('frequency', 'frequency', { unique: false });
                serviceObjectStore.createIndex('indicator', 'indicator', { unique: false });
                serviceObjectStore.createIndex('lastCheck', 'lastCheck', { unique: false });
                serviceObjectStore.createIndex('latestStatus', 'latestStatus', { unique: false });
                var logObjectStore = conn.createObjectStore('service_log', { keyPath: 'id', autoIncrement: true });
                logObjectStore.createIndex('serviceId', 'serviceId', { unique: false });
                logObjectStore.createIndex('indicator', 'indicator', { unique: false });
                logObjectStore.createIndex('timestamp', 'timestamp', { unique: false });
                logObjectStore.createIndex('statusCode', 'statusCode', { unique: false });
                logObjectStore.createIndex('statusText', 'statusText', { unique: false });
                logObjectStore.createIndex('erroeMessage', 'erroeMessage', { unique: false });
                logObjectStore.createIndex('serviceId_timestamp', ['serviceId', 'timestamp'], { unique: false });
            }
        };
    },
    composeServiceUrl: function(service) {
        return service.scheme + '://' + service.host + ':' + service.port + service.path
    },
    addService: function(service, callback) {
        service.url = db.composeServiceUrl(service);
        var transaction = db.connection.transaction(['service'], 'readwrite');
        transaction.onerror = function(event) {
            navigator.notification.alert('Add service error: ' + event.target.errorCode, function(){});
        };
        var objectStore = transaction.objectStore('service');
        var request = objectStore.add(service);
        request.onsuccess = function(event) {
            var serviceId = event.target.result;
            callback(serviceId);
        };
    },
    modifyService: function(serviceId, service, callback) {
        var transaction = db.connection.transaction(['service'], 'readwrite');
        var objectStore = transaction.objectStore('service');
        var request = objectStore.get(serviceId);
        request.onsuccess = function(event) {
            var data = request.result;
            data.scheme = service.scheme ? service.scheme : data.scheme;
            data.host = service.host != undefined ? service.host : data.host;
            data.port = service.port != undefined ? service.port : data.port;
            data.path = service.path != undefined ? service.path : data.path;
            data.frequency = service.frequency != undefined ? service.frequency : data.frequency;
            data.lastCheck = service.lastCheck != undefined ? service.lastCheck : data.lastCheck;
            data.indicator = service.indicator != undefined ? service.indicator : data.indicator;
            data.latestStatus = service.latestStatus != undefined ? service.latestStatus : data.latestStatus;
            data.url = db.composeServiceUrl(data);
            var requestUpdate = objectStore.put(data);
            requestUpdate.onerror = function(event) {
                navigator.notification.alert('Modify service error: ' + event.target.errorCode, function(){});
            };
            requestUpdate.onsuccess = function(event) {
                // console.log(event.target.result);
                callback(data);
            };
        }
        request.onerror = function(event) {
            navigator.notification.alert('Get service error: ' + event.target.errorCode, function(){});
        }
    },
    removeService: function(serviceId, callback) {
        var transaction = db.connection.transaction(['service'], 'readwrite');
        var objectStore = transaction.objectStore('service');
        var request = objectStore.delete(serviceId);
        request.onsuccess = function(event) {
            callback(event);
            db.removeOldServiceLogs(serviceId, 0);
        }
        request.onerror = function(event) {
            navigator.notification.alert('Remove service error: ' + event.target.errorCode, function(){});
        }
    },
    getService: function(serviceId, callback) {
        var transaction = db.connection.transaction(['service']);
        var objectStore = transaction.objectStore('service');
        var request = objectStore.get(serviceId);
        request.onsuccess = function(event) {
            var service = event.target.result;
            // service.id = serviceId;
            callback(service);
        }
        request.onerror = function(event) {
            navigator.notification.alert('Get service error: ' + event.target.errorCode, function(){});
        }
    },
    listServices: function(callback) {
        var transaction = db.connection.transaction(['service']);
        var objectStore = transaction.objectStore('service');
        var cursor = objectStore.openCursor();
        cursor.onsuccess = function(event) {
            var cursor = event.target.result;
            if (cursor) {
                var service = cursor.value;
                // service.id = cursor.primaryKey;
                callback(service);
                cursor.continue();
            }
            else {
                callback(undefined);
            }
        }
    },
    addServiceLog: function(serviceId, log, callback) {
        var transaction = db.connection.transaction(['service_log'], 'readwrite');
        transaction.onerror = function(event) {
            navigator.notification.alert('Add service error: ' + event.target.errorCode, function(){});
        };
        var objectStore = transaction.objectStore('service_log');
        log.serviceId = serviceId;
        var request = objectStore.add(log);
        request.onsuccess = function(event) {
            var logId = event.target.result;
            callback(logId);
        };
    },
    listServiceLogs: function(serviceId, callback) {
        var transaction = db.connection.transaction(['service_log']);
        var objectStore = transaction.objectStore('service_log');
        var index = objectStore.index('serviceId');
        var cursor = index.openCursor(IDBKeyRange.only(serviceId), 'prev');
        cursor.onsuccess = function(event) {
            var cursor = event.target.result;
            if (cursor) {
                callback(cursor.value);
                cursor.continue();
            }
            else {
                callback(undefined);
            }
        }
    },
    getLatestLog: function(serviceId, callback) {
        db.getServiceLogsPageWithSize(serviceId, new Date().getTime(), 1, function(logs) {
            if (logs && logs.length > 0) {
                callback(logs[0]);
            }
            else {
                callback(undefined);
            }
        });
    },
    getServiceLogsPage: function(serviceId, prevLogTimestamp, callback) {
        db.getServiceLogsPageWithSize(serviceId, prevLogTimestamp, db.logsPerPage, callback);
    },
    getServiceLogsPageWithSize: function(serviceId, prevLogTimestamp, pageSize, callback) {
        var transaction = db.connection.transaction(['service_log']);
        var objectStore = transaction.objectStore('service_log');
        var index = objectStore.index('serviceId_timestamp');
        var cursor = index.openCursor(
            IDBKeyRange.bound([serviceId, 0], [serviceId, prevLogTimestamp], false, true), 'prev');
        var count = 0;
        var logsPage = [];
        cursor.onsuccess = function(event) {
            var cursor = event.target.result;
            if (cursor) {
                if (count < pageSize) {
                    // console.log(cursor.value);
                    logsPage.push(cursor.value);
                    cursor.continue();
                    count++;
                }
                else {
                    callback(logsPage);
                }
            }
            else {
                callback(logsPage);
            }
        }
    },
    removeOldServiceLogs: function(serviceId, daysBefore, callback) {
        var logTransaction = db.connection.transaction(['service_log'], 'readwrite');
        var logObjectStore = logTransaction.objectStore('service_log');
        var index = logObjectStore.index('serviceId_timestamp');
        var cursor = index.openCursor(
            IDBKeyRange.bound([serviceId, 0], [serviceId, new Date().getTime() - daysBefore*24*60*60*1000], false, false));
        cursor.onsuccess = function(event) {
            var cursor = event.target.result;
            if (cursor) {
                // console.log(cursor.value);
                cursor.delete();
                cursor.continue();
            }
            else {
                callback(event);
            }
        }
    }
};
