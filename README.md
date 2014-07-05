SerMon
======

A simple service monitor app based-on Cordova (Phonegap).


Features
--------
* Cross-platform (aim for Firefox OS, Android, and iOS).
* Notification on status bar when service down.
* Simple and elegant user interface.
* Add/modify/remove service profile.
* Check service status periodically in the background.
* Cleanup old logs everyday, keep latest 1200 logs.


Support
-------
* Firefox OS: tested on unagi (b2g 1.4) and flame (b2g 2.1).
* Android Open WebApp: tested on Samsung I9100, require Firefox for Android installed.
* Android: tested on emulator 4.4, chromium-based WebView is required for IndexedDB.
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

Reference
---------
* [Cordova documentation](http://cordova.apache.org/docs/en/3.5.0/)
* [Testing your native android app - Mozilla Hacks](https://hacks.mozilla.org/2014/06/testing-your-native-android-app/)
* [Using IndexedDB - MDN](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB)
