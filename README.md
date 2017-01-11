![Electron windows autoupdate](https://daks2k3a4ib2z.cloudfront.net/575a64b411eec78e2b2e9461/580f26fa5f425a295506f837_blog-title-electron-win.jpg)
# Get that God damn Windows Auto Update working on Electron!
Yes, this is what this repository is about!

## Let's do it
In this repository is everything you need to have in order to make Windows Auto Update work.
Which is:
- Electron
- Electron packager (builder), I use `electron-builder` which can build all the platform just on Mac
- Some [index.html](index.html) file that Electron can load and where it boots `electorn.autoUpdater`

## Behind the scenes
We don't quite need to know much about how this works behind the scenes but just to clarify some terms.

`electron-builder` uses `Squirrel`. That is a packager that is capable of automatical build of setup files for `.exe` binaries.

You need a installer because just bold `.exe` files cannot be auto update with Electron. You need to packager capable of calling `Squirrel`.

Of course `Squirrel` is a Windows application, that's why you still need some runtime. On Linux or Mac you can simply use Wine.

I would this perfect tutorial how to install Wine on the mac via `brew`: [https://www.davidbaumgold.com/tutorials/wine-mac/](https://www.davidbaumgold.com/tutorials/wine-mac/).

The update process itself is based on `.nupkg` packages which is a binary format similar to `.zip` and holds source code of your application.

Squirell generates `your-app-1.0.0-full.nupkg` which is complete application binary and if it's possible it also generates a file called
`your-app-1.0.0-delta.nupkg`.

This `*-delta.nupkg` is immportant for auto updates. This file holds patch that needs to be applied to previous version of your app to update to the next version.

So how you force `electron-builder` to create such file for you? The key is the `RELEASES` file. This file is always generated by `Squirrel`.
It is a simply list of available app versions with checksums and names of `*.nupkg` files for every version.

## Let's do this
Alright, first. Make sure you already are on Windows machine and if not, just download and install Wine - [Mac guide here](https://www.davidbaumgold.com/tutorials/wine-mac/).
You will also need to install mono which can be installed through homebrew.

```
brew install mono
```

Once you are ready with this, you can install this repo:
```
npm install
//or
yarn install
```
Alright, verify that everything works by starting prebuilt of our app:
```
npm start
```
Such app, right? Note that version number is dynamic and will change when we update our app.

Let's try to create a Windows build I prepared for you:
```
npm run build
``` 

Alright this fails. The reason is that I already added a line that tells `Squirrel` where it should find all my app releases in `RELEASES` file.

We have not yet built any Windows app, so let's just delete one line from [package.json](package.json).
Note that `electron-builder` uses `package.json` to configurate the build, and so far I got everything I needed, no programming required.
```
// delete this line:
"remoteReleases": "http://localhost:9000/dist/win1/"

//lets do the build again
npm run build
```
Now everything should go OK. You may have troubles with Wine. Make sure you did the steps described above.

**NOTE** that in `package.json` this part:
```
"win": {
  "certificateFile": "./certs/my_signing_key.pfx",
  "certificatePassword": ""
}
```
I generated dummy certificates to sign this app, if you don't provide these files, autoUpdate will not work!
Replace these lines with your own certificate info. Guide to generate such certificates is here: [https://www.npmjs.com/package/electron-installer-windows](https://www.npmjs.com/package/electron-installer-windows) 

So what do we have now? Well, in `dist/win` there is something like `electron-windows-autoupdate-1.0.0-full.nupkg` which is a packed binary.
Along with `electron-windows-autoupdate Setup 1.0.0` which is Windows installer of our App. Great.

If you don't like the file names, just change `name` key in [package.json](package.json), so that it suits your needs.

The most important part to make Windows AutoUpdate work is however this simple text file [RELEASES](dist/win/RELEASES) (`dist/win/RELEASES`).

This file is the key to create `*-delta.nupkg` files needed for auto update. Squirrel must be able to find this file,
unfortunately `electron-builder` only support web links to releases file in config, but we are programmers, right? No problem for us.

So now is the task to make folder `dist/win` accesable over internet. In production, you would probably upload all this artifacts
from `dist/win` to `S3 bucket` or whatever, and just pasted the links. Well, in dev mode, we would be OK just with `SimpleHTTPServer` which is
shipped on `Mac` as well as on `Linux` and `Windows` if you download `python`. You can of course use any other server, that can server static files,
`express, webpack, apache, nginx` whatever. The only requirement is that we have a web url that points to `dist/win`.

So firstly. Rename `dist/win` to some other name I use `dist/win1`. The reason for renaming is that the `electron-builder` will overwrite folder `dist/win`
with all it's content and we want to keep it for auto update, so renaming make sure that everything is OK.

Then just:
```
// start server here
python -m SimpleHTTPServer 9000

// or just
npm run start:server
```

So now if you do:
```
open http://localhost:9000/dist/win1/RELEASES
```
It should open `RELEASES` in the browser, maybe it downloads it. Anyway everything but `404` is OK.

So now we have to tell `Squirrel` that we already have some versions of our app built and we want another version to be an update of older ones.

To do that, just **bump version** in [package.json](package.json) to eg. `2.0.0`.
If you won't bump version, new build will not be an update of previous version.

Now let's put back that line we deleted from `electron-builder` config in `package.json`.

So your key `build` in `package.json` should look like this.
```
"build": {
  "squirrelWindows": {
    "remoteReleases": "http://localhost:9000/dist/win1/"
  },
  "win": {
    "certificateFile": "./certs/my_signing_key.pfx",
    "certificatePassword": ""
  }
},
```
**NOTE** that in `remoteReleases` you **just** specify path to **folder** where `RELEASES` and `*-*.nupkg` files are,
not path to individial files!

So run again the build script:
```
// make sure serve runs in root of this repo
// npm run start:server
npm run build
```

Now in `dist` folder there should be `dist/win` and `dist/win1`

And to verify that `Squirell` seen previous `RELEASES`, take a look into [dist/win/RELEASES](dist/win/RELEASES).
And here you should see something like this:
```
CF1472BFD1F777AAE09501313AA55A7C080CD620 electron-windows-autoupdate-1.0.0-full.nupkg 54575243
7CD4A1765DF084BFE36FC615A63D05DA3CB89ABD electron-windows-autoupdate-2.0.0-delta.nupkg 34921
A94689C1884E9ED50963BFF58ED974AA4D17EEA1 electron-windows-autoupdate-2.0.0-full.nupkg 54576239
```
If there is just one line, it means that you did not bump version in `package.json`.

If you have 3 lines, than great, `Squirrel` noticed previous version and created `*-delta.nupkg`
which holds difference between older version and current. There is also a note about `*-full.nupkg` which is package binary of the 
next version of your app that you just built.

So now all the update files are prepared we may implement app code that will implement auto update in the app.

## Handle auto update in the app
All the magic you can see in [index.html](index.html).

Things to notice are:
- auto update event listener registered by `autoUpdate.on()`
- most important event is `update-downloaded`, after this event you can install the udpate
- `autoUpdater.setFeedURL()` which I may get to
- finally `autoUpdater.checkForUpdates()` that is all you need to do to check for update and download it
- and of course `autoUpdater.quitAndInstall()` called after `update-downloaded` is fired

### Setting auto update feed URL
Note this line `autoUpdater.setFeedURL('http://localhost:9000/dist/win/')`. AutoUpdater uses `Squirrel` in the background,
so it requires URL to folder where all the required files are located. These files are familiar `*-full/delta.nupkg` and `RELEASES`.

But this time, this url **must poin to folder where update files are located**.

So in our case, we have old update files in `dist/win1` but files for newer version (along with `RELEASES` with all the versions)
is in `dist/win`.   

So now this time on Windows machine, because we will try install and auto update our app, we have to start a server that would point to `dist/win`
and set `autoUpdater.setFeedURL()` accordingly.

We can copy update files to windows machine, or upload them to the web, and set the url, so that it points to the **folder** with `*.nupkg and RELEASES`.

You can use `SimpleHTTPServer` again even on Windows, just make sure you have `python` installed and in your `PATH`.

You can clone this repo and run:
```
npm run start:server
```
Again and it should all work.

Now, this is the time to run windows installer, but make sure you install the first version from `dist/win1/*Setup<version>.exe`!!

Once done, you should see `Current version is: 1.0.0` in our awesome app. Also you should see some logs in console saying that an update is available,
then that the update is available, being downloaded and finally an alert pop ups, confirm it and App will automaticaly update!!

Now you see `Current version is: <BUMPED VERSION>`

## FAQ
### No update is available
Make sure that `dist/win` is accesible via browser on your Windows machine.
Make sure you have correct url set on updater by calling `autoUpdater.setFeedURL()`.

### /RELEASES/ not found
Make sure server is running and in `package.json` correct `"remoteReleases"` is set.

### Cannot get signature of running application
Code sign was not applied, take a look here how to generate one: [https://www.npmjs.com/package/electron-installer-windows](https://www.npmjs.com/package/electron-installer-windows)

## Other question?
Just ask! team@avocode.com!

