SerMon
======

A simple service monitor app based-on Cordova (Phonegap).
If you have your own website/web service/web app, 
you can use this app to monitor server availability. 
It notifies you when server returns unusual status code.


Screenshots
-----------
![Service List](https://raw.githubusercontent.com/yshlin/SerMon/master/screenshots/service_list.png?v=2)
![Add Service](https://raw.githubusercontent.com/yshlin/SerMon/master/screenshots/add_service.png?v=2)
![Service Status](https://raw.githubusercontent.com/yshlin/SerMon/master/screenshots/service_status.png?v=2)


Features
--------
* Cross-platform (aim for Firefox OS, Android, and iOS).
* Notification on status bar when service down.
* Simple and elegant user interface.
* Add/modify/remove service profile.
* Check service status periodically in the background.
* View all check logs, loaded page by page.
* Cleanup old logs everyday, keep latest 1200 logs.
* Safe and secure, all data stores locally.

Support
-------
* Firefox OS: works fine, tested on unagi (b2g 1.4) and flame (b2g 2.1).
* Android Open Web App: problem using privileged permissions, tested on Samsung I9100, require Firefox for Android installed.
* Android: works fine on emulator 4.4, chromium-based WebView is required for IndexedDB.
* iOS: not working, waiting for IndexedDB support on iOS safari 8.

Contribute
----------
### Prerequisites
* [git](http://git-scm.com/)
* [npm (node.js)](http://nodejs.org/)
* [cordova 3.5](http://cordova.apache.org)
* [Android SDK](http://developer.android.com/sdk/index.html) for Firefox OS and Android devices
* [mozilla-apk-cli](https://github.com/mozilla/apk-cli) for Open WebApp on android.
* [iOS SDK](https://developer.apple.com/devcenter/ios/index.action) for iOS devices/simulator
* [ios-sim](https://github.com/phonegap/ios-sim) for deployment on iOS simulator
* [ios-deploy](https://github.com/phonegap/ios-deploy) for deployment on iOS devices (plus your developer program account of course)

### Download and Setup

```sh
$ git clone https://github.com/yshlin/SerMon
$ cd SerMon
$ ./init.sh
```

### Making changes
* All source code lies in the `www` folder.
* For platform-specific files, put them in the `merges` folder.

### Build and Run

on Firefox OS:
```sh
$ cordova build firefoxos
$ cordova run firefoxos
```

Open WebApp on Android:
```sh
$ mozilla-apk-cli ./platforms/firefoxos/www/ sermon.apk
$ adb install sermon.apk
```

on Android:
```sh
$ cordova build android 
$ cordova run android
```

on iOS simulator:
```sh
$ cordova build ios 
$ cordova run ios --emulator
```

on iOS device:
```sh
$ cordova build ios 
$ cordova run ios
```

Trouble Shooting
----------------
**Q: Why the log always shows 'No connection'?**  
A: Pleas check your network connection, and make sure your server supports HTTP 'HEAD' request, sometimes it works for certain path.


**Q: Why it didn't check in the background?**  
A: You must manually open the app again after system restart, and make sure you (or the GC) didn't kill the app in the recent app list.


**Q: Why it always shows 'Checked just now'?**  
A: The last check time is updated when app resumes, so you can check updates by turning the screen off and on, or by switching the app off and back.


**Q: My battery is low, how can I turn the background check off?**  
A: Just terminate the app from the recent app list.

Reference
---------
* [Cordova documentation](http://cordova.apache.org/docs/en/3.5.0/)
* [Testing your native android app - Mozilla Hacks](https://hacks.mozilla.org/2014/06/testing-your-native-android-app/)
* [Using IndexedDB - MDN](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB)
