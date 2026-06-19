// ==UserScript==
// @name           ucjsDownloadsManager.uc.js
// @namespace      http://space.geocities.yahoo.co.jp/gl/alice0775
// @description    Donloads Manager
// @include        main
// @include        chrome://browser/content/downloads/contentAreaDownloadsView.xul
// @compatibility  Firefox 61
// @author         Alice0775
// @version        2018/07/01 16:30 revert Disable btn
// @version        2018/06/12 21:30 remove unused
// @version        2018/06/12 21:00 fix for private window mode
// @version        2018/06/07 12:00 fix file name for history
// @version        2018/04/14 00:00 de XUL overlay
// @version        2017/12/10 12:00 fix error when DO_NOT_DELETE_HISTORY = true
// @version        2017/12/10 12:00 remove workaround Bug 1279329. Disable btn while clear list is doing
// @version        2016/06/10 00:00 Workaround Bug 1279329
// @version        2016/05/04 20:30 remove typo
// @version        2016/05/04 20:00 remove in-content css, add preference for Taskbar Progress
// @version        2016/05/03 01:00 Indicate Taskbar Progress
// @version        2016/04/19 07:00 change title dexcription "/" instead of " of "
// @version        2015/05/08 00:00 remove padding due to Bug 1160734
// @version        2015/03/29 00:00 Check window.windowState instead of sizemode attribute
// @version        2014/12/28 23:00 Skip save window size if closed immediately
// @version        2014-12-23 23:00 number of files
// @version        2014-10-23 22:00 number of files
// @version        2014/10/18 20:00 fix posiotion
// @version        2014/06/07 20:00 Woraround closes
// @version        2014/06/03 12:00 
// @version        2014/05/15 22:00 clean up
// @version        2014/05/15 20:00 removed the following oraround
// @version        2014/05/15 19:00 Woraround closes the manager 10 seconds after download completion
// @version        2014/03/31 00:00 fix for browser.download.manager.showWhenStarting
// @version        2014/03/01 12:00 Bug 978291
// @version        2013/12/19 17:10 rename REMEMBERHISTOTY to DO_NOT_DELETE_HISTORY
// @version        2013/12/19 17:00 fix do not close the Manager if there is main window
// @version        2013/12/18 23:10 
// @version        2013/12/16 23:10 open only download added
// @version        2013/12/16 02:00 defineLazyModuleGetter for Firefox26
// @version        2013/12/15 22:00 typo and correct version date
// @version        2013/12/15 08:00 label placeholder size
// @version        2013/12/14 20:10 Search
// @version        2013/12/14 19:30 getBoolPref
// @version        2013/12/14 18:30 typo and fix closeWhenDone
// @version        2013/12/14 18:00 browser.download.manager.showWhenStarting , browser.download.manager.closeWhenDone
// @version        2013/12/02 00:00 
// @note           Require Sub-Script/Overlay Loader v3.0.40mod
// @note           preferences: (bool) browser.download.manager.showWhenStarting
// @note                        (bool) browser.download.manager.closeWhenDone
// @note                        (bool) browser.download.manager.showProgressInTaskButton
// ==/UserScript== 

if (location.href == "chrome://browser/content/browser.xul") {
  Cu.import("resource://gre/modules/Services.jsm");

  window.ucjs_downloadManager = {
    _summary: null,
    _list: null,

    createElement: function(localName, arryAttribute) {
      let elm = document.createElement(localName);
      for(let i = 0; i < arryAttribute.length; i++) {
        elm.setAttribute(arryAttribute[i].attr, arryAttribute[i].value);
      }
      return elm;
    },

    init: function() {
      window.addEventListener("unload", this, false);

      let ref = document.getElementById("menu_openDownloads");
      let menu = ref.parentNode.insertBefore(
        this.createElement("menuitem",
          [{attr: "label", value:"Open Download Manager"},
           {attr: "accesskey", value:"D"},
           {attr : "oncommand", value: "ucjs_downloadManager.openDownloadManager(true);"}
          ]), ref);

      XPCOMUtils.defineLazyModuleGetter(this, "Downloads",
                "resource://gre/modules/Downloads.jsm");
      // Ensure that the DownloadSummary object will be created asynchronously.
      if (!this._summary) {
        this.Downloads.getSummary(this.Downloads.ALL).then(summary => {
          this._summary = summary;
          return this._summary.addView(this);
        }).then(null, Cu.reportError);
      }

      if (!this._list) {
        this.Downloads.getList(this.Downloads.ALL).then(list => {
          this._list = list;
          return this._list.addView(this);
        }).then(null, Cu.reportError);
      }
    },

    uninit: function() {
      window.removeEventListener("unload", this, false);

      if (this._summary) {
        this._summary.removeView(this);
      }
      if (this._list) {
        this._list.removeView(this);
      }
    },

    handleEvent: function(event) {
      switch (event.type) {
        case "unload":
          this.uninit();
          break;
      }
    },

    openDownloadManager: function ucjs_openDownloadManager(aForceFocus) {
      var enumerator = Services.wm.getEnumerator(null);
      while(enumerator.hasMoreElements()) {
        var win = enumerator.getNext();
        if (win.location == "chrome://browser/content/downloads/contentAreaDownloadsView.xul"
          && PrivateBrowsingUtils.isWindowPrivate(window) ==
             PrivateBrowsingUtils.isWindowPrivate(win)) {
          if (aForceFocus)
            win.focus();
          return;
        }
      }

      try {
        var height = Math.max(100,Services.prefs.getIntPref("browser.download.manager.size.height"));
        var width  = Math.max(300,Services.prefs.getIntPref("browser.download.manager.size.width"));
        var screenX = Math.min(Math.max(0,Services.prefs.getIntPref("browser.download.manager.size.screenX")), screen.availWidth - width);
        var screenY = Math.min(Math.max(0,Services.prefs.getIntPref("browser.download.manager.size.screenY")), screen.availHeight - height);
      } catch(r){
        height = 300;
        width  = 600;
        screenX = 0;
        screenY = 0;
      }
      var win = window.open("chrome://browser/content/downloads/contentAreaDownloadsView.xul",
                            "Download" +
                              (PrivateBrowsingUtils.isWindowPrivate(window) ? " - Private Window"
                                                                            : ""),
                            "outerWidth=" + width + ",outerHeight=" + height +
                            ",left=" + screenX + ",top=" + screenY +
                            ",chrome,toolbar=yes,dialog=no,resizable");
    },

    closeDownloadManager: function ucjs_closeDownloadManager() {
      var enumerator = Services.wm.getEnumerator(null);
      while(enumerator.hasMoreElements()) {
        var win = enumerator.getNext();
        if (win.location == "chrome://browser/content/downloads/contentAreaDownloadsView.xul") {
          win.close();
          return;
        }
      }
    },

    onDownloadAdded: function (aDownload) {
      var showWhenStarting = true;
      try {
        showWhenStarting = Services.prefs.getBoolPref("browser.download.manager.showWhenStarting");
      } catch(e) {}
      var numDls = 0;
      if (showWhenStarting) {
        if (this._list) {
          this._list.getAll().then(downloads => {
            for (let download of downloads) {
              if (!download.stopped)
                numDls++;
            }
            if (numDls > 0)
              this.openDownloadManager(false);
          }).then(null, Cu.reportError);
        }
      }
    },

    onDownloadChanged: function (aDownload) {
      if (!this._list)
        return;
      this._list.getAll().then(downloads => {
        var num = 0;
        for (let download of downloads) {
          if (!download.succeeded)
            num++;
        }
        if (num == 0) {
          var closeWhenDone = false;
          try {
            closeWhenDone = Services.prefs.getBoolPref("browser.download.manager.closeWhenDone");
          } catch(e) {}
          if (closeWhenDone) {
            this.closeDownloadManager();
          }
        }
      }).then(null, Cu.reportError);
    }
  };
  ucjs_downloadManager.init();
}


if (window.opener && location.href == "chrome://browser/content/downloads/contentAreaDownloadsView.xul") {
  
  Cu.import("resource://gre/modules/Services.jsm");
  Cu.import("resource://gre/modules/DownloadIntegration.jsm");

  window.ucjs_downloadManagerMain = {
    originalTitle:"",
    _summary: null,
    _list: null,
    _wait:false,

    createElement: function(localName, arryAttribute) {
      let elm = document.createElement(localName);
      for(let i = 0; i < arryAttribute.length; i++) {
        elm.setAttribute(arryAttribute[i].attr, arryAttribute[i].value);
      }
      return elm;
    },

    init: function() {
      window.addEventListener("unload", this, false);

      // xxx remove in-content css
      var elements = document.childNodes;
      for (var i = 0; i <= elements.length; i++) {
        var element = elements[i];
        if (element.nodeValue.indexOf("chrome://browser/skin/downloads/contentAreaDownloadsView.css") > -1) {
          document.removeChild(element);
          break;
        }
      }
      
      var style = ' \
        @namespace url(http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul); \
        #contentAreaDownloadsView { \
          padding: 0 ; \
        } \
        #downloadsRichListBox:empty + #downloadsListEmptyDescription { \
          pointer-events: none; \
        } \
       '.replace(/\s+/g, " ");
      var sspi = document.createProcessingInstruction(
        'xml-stylesheet',
        'type="text/css" href="data:text/css,' + encodeURIComponent(style) + '"'
      );
      document.insertBefore(sspi, document.documentElement);
      sspi.getAttribute = function(name) {
        return document.documentElement.getAttribute(name);
      };

      let ref = document.documentElement;
      ref = ref.appendChild(this.createElement("hbox", []));
      ref.appendChild(this.createElement("button",
        [{attr: "id", value: "ucjs_clearListButton"},
         {attr: "label", value: "Clear List"},
         {attr: "accesskey", value: "C"},
         {attr: "oncommand", value: "ucjs_downloadManagerMain.clearDownloads();"}
        ]));
      ref.appendChild(this.createElement("spacer",
        [{attr: "flex", value: "1"}]));
      ref.appendChild(this.createElement("textbox",
        [{attr: "clickSelectsAll", value: "true"},
         {attr: "type", value: "search"},
         {attr: "placeholder", value: "Search..."},
         {attr: "aria-autocomplete", value: "list"},
         {attr: "oncommand", value: "ucjs_downloadManagerMain.doSearch(this.value);"}
        ]));

      let filterBox = ref.appendChild(this.createElement("hbox", []));
      filterBox.setAttribute("style", "margin-top: 4px; margin-bottom: 4px;");
      let filterButtons = [
        { id: "filter-all", label: "All", filter: "all" },
        { id: "filter-image", label: "Images", filter: "image" },
        { id: "filter-video", label: "Videos", filter: "video" },
        { id: "filter-document", label: "Documents", filter: "document" },
        { id: "filter-archive", label: "Archives", filter: "archive" },
        { id: "filter-other", label: "Other", filter: "other" }
      ];
      filterButtons.forEach((btn) => {
        let button = this.createElement("button", [
          { attr: "id", value: "ucjs_filter_" + btn.filter },
          { attr: "label", value: btn.label },
          { attr: "type", value: "radio" },
          { attr: "group", value: "downloadFilter" },
          { attr: "oncommand", value: "ucjs_downloadManagerMain.setFilter('" + btn.filter + "');" }
        ]);
        filterBox.appendChild(button);
      });

      this.originalTitle = document.title +
                           (PrivateBrowsingUtils.isWindowPrivate(window) ? " - Private Window"
                                                                         : "");

/*
      // xxx Bug 1279329 "Copy Download Link" of context menu in Library is grayed out
      var listBox = document.getElementById("downloadsRichListBox");
      var placesView = listBox._placesView;
      var place = placesView.place;
      placesView.place= null;
      placesView.place = place;
*/

      setTimeout(function(){this._wait = true}.bind(this), 0);

      // Ensure that the DownloadSummary object will be created asynchronously.
      if (!this._summary) {
        Downloads.getSummary(Downloads.ALL).then(summary => {
          this._summary = summary;
          return this._summary.addView(this);
        }).then(null, Cu.reportError);
      }

      if (!this._list) {
        Downloads.getList(Downloads.ALL).then(list => {
          this._list = list;
          return this._list.addView(this);
        }).then(() => {
          setTimeout(function() {
            this._initFilter();
          }.bind(this), 200);
        }).then(null, Cu.reportError);
      } else {
        setTimeout(function() {
          this._initFilter();
        }.bind(this), 200);
      }

      try {
        var showProgressInTaskButton = Services.prefs.getBoolPref("browser.download.manager.showProgressInTaskButton")
      } catch(ex) {
        showProgressInTaskButton = true; //default
      }
      if (showProgressInTaskButton)
        setTimeout(function() {
          try {
            let docShell = window.QueryInterface(Ci.nsIInterfaceRequestor)
                                  .getInterface(Ci.nsIWebNavigation)
                                  .QueryInterface(Ci.nsIDocShellTreeItem).treeOwner
                                  .QueryInterface(Ci.nsIInterfaceRequestor)
                                  .getInterface(Ci.nsIXULWindow).docShell;
            let gWinTaskbar = Components.classes["@mozilla.org/windows-taskbar;1"]
                                      .getService(Components.interfaces.nsIWinTaskbar);
            this._taskbarProgress = gWinTaskbar.getTaskbarProgress(docShell);
          } catch(ex) {
            this._taskbarProgress = null;
          }
        }.bind(this), 10);
    },

    uninit: function() {
      window.removeEventListener("unload", this, false);

      this._taskbarProgress = null;
      if (this._wait)
        this.saveSizePosition();

      if (this._summary) {
        this._summary.removeView(this);
      }
      if (this._list) {
        this._list.removeView(this);
      }
    },

    handleEvent: function(event) {
      switch (event.type) {
        case "unload":
          this.uninit();
          break;
      }
    },

    saveSizePosition: function() {
      if (window.windowState == 3) {
        Services.prefs.setIntPref("browser.download.manager.size.height", window.outerHeight);
        Services.prefs.setIntPref("browser.download.manager.size.width", window.outerWidth);
        Services.prefs.setIntPref("browser.download.manager.size.screenX", window.screenX);
        Services.prefs.setIntPref("browser.download.manager.size.screenY", window.screenY);
      }
    },

    onSummaryChanged: function () {
      if (!this._summary)
        return;
      if (this._summary.allHaveStopped || this._summary.progressTotalBytes == 0) {
        document.title = this.originalTitle;
        if (this._taskbarProgress) {
          this._taskbarProgress.setProgressState(
                                     Ci.nsITaskbarProgress.STATE_NO_PROGRESS, 0, 0);
        }
        Cu.import("resource://gre/modules/Services.jsm");
        var enumerator = Services.wm.getEnumerator("navigator:browser");
        while(enumerator.hasMoreElements()) {
          return;
        }

        var closeWhenDone = false;
        try {
          closeWhenDone = Services.prefs.getBoolPref("browser.download.manager.closeWhenDone");
        } catch(e) {}
        if (closeWhenDone) {
          DownloadIntegration._store.save();
          window.close();
        }

      } else {

        // If the last browser window has been closed, we have no indicator any more.
        if (this._taskbarProgress) {
          if (this._summary.allHaveStopped || this._summary.progressTotalBytes == 0) {
            this._taskbarProgress.setProgressState(
                                     Ci.nsITaskbarProgress.STATE_NO_PROGRESS, 0, 0);
          } else {
            // For a brief moment before completion, some download components may
            // report more transferred bytes than the total number of bytes.  Thus,
            // ensure that we never break the expectations of the progress indicator.
            let progressCurrentBytes = Math.min(this._summary.progressTotalBytes,
                                                this._summary.progressCurrentBytes);
            this._taskbarProgress.setProgressState(
                                     Ci.nsITaskbarProgress.STATE_NORMAL,
                                     progressCurrentBytes,
                                     this._summary.progressTotalBytes);
          }
        }

        // Update window title
        var numDls = 0;
        if (!this._list)
          return;
        this._list.getAll().then(downloads => {
          for (let download of downloads) {
            if (download.hasProgress && !download.succeeded)
              numDls++;
          }

          let progressCurrentBytes = Math.min(this._summary.progressTotalBytes,
                                            this._summary.progressCurrentBytes);
          let percent = Math.floor(progressCurrentBytes / this._summary.progressTotalBytes * 100);
          let text = percent + "%/" + numDls + (numDls < 2 ? " file - " : " files - ") ;
          document.title = text + this.originalTitle;
        }).then(null, Cu.reportError);
      }
    },

    clearDownloads: function ucjs_clearDownloads() {
      var DO_NOT_DELETE_HISTORY = true; /* custmizable true or false */
      var richListBox = document.getElementById("downloadsRichListBox");

      var places = [];
      function addPlace(aURI, aTitle, aVisitDate) {
        places.push({
          uri: aURI,
          title: aTitle,
          visits: [{
            visitDate: (aVisitDate || Date.now()) * 1000,
            transitionType: Ci.nsINavHistoryService.TRANSITION_LINK
          }]
        });
      }
      function moveDownloads2History(d) {
        if (DO_NOT_DELETE_HISTORY &&
            !PrivateBrowsingUtils.isWindowPrivate(window)) {
          for (let element of richListBox.childNodes) {
            let download = element._shell.download;
            let aURI = makeURI(download.source.url);
            // let aTitle = document.getAnonymousElementByAttribute(element, "class", "downloadTarget").value
            let aTitle = download.target.path;
            aTitle = aTitle.match( /[^\\]+$/i )[0];
            aTitle = aTitle.match( /[^/]+$/i )[0];

            let aVisitDate = download.endTime || download.startTime;
            addPlace(aURI, aTitle, aVisitDate)
          }
        }

        // Clear List
        richListBox._placesView.doCommand('downloadsCmd_clearDownloads');

        if (DO_NOT_DELETE_HISTORY &&
            !PrivateBrowsingUtils.isWindowPrivate(window)) {
          if (places.length > 0) {
            var asyncHistory = Components.classes["@mozilla.org/browser/history;1"]
                     .getService(Components.interfaces.mozIAsyncHistory);
              asyncHistory.updatePlaces(places);
          }
        }
      }
      var btn = document.getElementById("ucjs_clearListButton");
      moveDownloads2History(0);
    },

    doSearch: function ucjs_doSearch(filterString) {
      var richListBox = document.getElementById("downloadsRichListBox");
      richListBox._placesView.searchTerm = filterString;
    },

    FILTER_PREF: "browser.download.manager.filterType",
    _currentFilter: "all",

    _mimeCategories: {
      image: ["image/"],
      video: ["video/"],
      document: [
        "application/pdf",
        "application/msword",
        "application/vnd.ms-word",
        "application/vnd.ms-excel",
        "application/vnd.ms-powerpoint",
        "application/vnd.openxmlformats-officedocument",
        "application/vnd.oasis.opendocument",
        "text/plain",
        "text/rtf",
        "application/rtf",
        "application/x-pdf"
      ],
      archive: [
        "application/zip",
        "application/x-zip-compressed",
        "application/x-rar-compressed",
        "application/x-rar",
        "application/x-7z-compressed",
        "application/x-7z",
        "application/x-tar",
        "application/x-gzip",
        "application/gzip",
        "application/x-bzip2",
        "application/x-bzip"
      ]
    },

    _initFilter: function() {
      try {
        var savedFilter = Services.prefs.getCharPref(this.FILTER_PREF);
        if (savedFilter) {
          this._currentFilter = savedFilter;
        }
      } catch(e) {}
      this._updateFilterButtons();
      this._applyFilterRetry(0);
      this._setupListObserver();
    },

    _applyFilterRetry: function(attempt) {
      this.applyFilter();
      if (attempt < 8) {
        var delay = attempt < 3 ? 200 * (attempt + 1) : 500 * (attempt - 2);
        setTimeout(function() {
          this._applyFilterRetry(attempt + 1);
        }.bind(this), delay);
      }
    },

    _setupListObserver: function() {
      var richListBox = document.getElementById("downloadsRichListBox");
      if (!richListBox) return;
      if (this._listObserver) {
        this._listObserver.disconnect();
      }
      this._listObserver = new MutationObserver(function(mutations) {
        var shouldRefresh = false;
        for (var i = 0; i < mutations.length; i++) {
          var m = mutations[i];
          if (m.type == "childList" && (m.addedNodes.length > 0 || m.removedNodes.length > 0)) {
            shouldRefresh = true;
            break;
          }
          if (m.type == "attributes") {
            var attrName = m.attributeName ? m.attributeName.toLowerCase() : "";
            if (attrName.indexOf("mime") >= 0 || attrName.indexOf("type") >= 0 ||
                attrName.indexOf("class") >= 0 || attrName.indexOf("value") >= 0) {
              shouldRefresh = true;
              break;
            }
          }
        }
        if (shouldRefresh) {
          if (this._filterTimer) clearTimeout(this._filterTimer);
          var self = this;
          this._filterTimer = setTimeout(function() {
            self.applyFilter();
          }, 100);
        }
      }.bind(this));
      this._listObserver.observe(richListBox, { 
        childList: true, 
        subtree: true, 
        attributes: true, 
        attributeFilter: ["mimetype", "class", "value", "uri", "url", "type", "href"] 
      });
    },

    _updateFilterButtons: function() {
      var filters = ["all", "image", "video", "document", "archive", "other"];
      filters.forEach(function(filter) {
        var btn = document.getElementById("ucjs_filter_" + filter);
        if (btn) {
          if (filter == this._currentFilter) {
            btn.setAttribute("checked", "true");
          } else {
            btn.removeAttribute("checked");
          }
        }
      }.bind(this));
    },

    setFilter: function(aFilter) {
      this._currentFilter = aFilter;
      try {
        Services.prefs.setCharPref(this.FILTER_PREF, aFilter);
      } catch(e) {}
      this._updateFilterButtons();
      this.applyFilter();
    },

    _fileExtensions: {
      image: ["jpg", "jpeg", "png", "gif", "bmp", "webp", "svg", "ico", "tif", "tiff", "heic", "heif", "avif", "apng"],
      video: ["mp4", "avi", "mkv", "mov", "wmv", "flv", "webm", "m4v", "3gp", "ts", "mpg", "mpeg", "vob", "ogv", "rmvb"],
      document: ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "odt", "ods", "odp", "txt", "rtf", "csv", "md", "epub", "mobi", "chm", "pages", "numbers", "key"],
      archive: ["zip", "rar", "7z", "tar", "gz", "gzip", "bz2", "bzip2", "xz", "lz", "z", "cab", "iso", "dmg", "pkg", "deb", "rpm", "apk", "jar", "war"]
    },

    _getMimeCategory: function(aMimeType, aFileName) {
      if (!aMimeType && !aFileName) return "other";
      if (aMimeType) {
        aMimeType = aMimeType.toLowerCase();
        for (var category in this._mimeCategories) {
          var prefixes = this._mimeCategories[category];
          for (var i = 0; i < prefixes.length; i++) {
            if (aMimeType.indexOf(prefixes[i]) == 0) {
              return category;
            }
          }
        }
      }
      if (aFileName) {
        var match = aFileName.match(/\.([a-zA-Z0-9]+)$/);
        if (match) {
          var ext = match[1].toLowerCase();
          for (var cat in this._fileExtensions) {
            var exts = this._fileExtensions[cat];
            if (exts.indexOf(ext) >= 0) {
              return cat;
            }
          }
        }
      }
      return "other";
    },

    applyFilter: function() {
      var richListBox = document.getElementById("downloadsRichListBox");
      if (!richListBox) return;
      var items = richListBox.querySelectorAll("richlistitem.download");
      var visibleCount = 0;

      var listData = {};
      try {
        if (this._list && typeof this._list.getAll == "function") {
          var downloads = this._list.getAll();
          for (var di = 0; di < downloads.length; di++) {
            var d = downloads[di];
            try {
              var key = "";
              if (d.source && d.source.url) {
                key = d.source.url;
              } else if (d.target && d.target.path) {
                key = d.target.path;
              }
              if (key) {
                listData[key] = {
                  contentType: d.contentType || "",
                  path: (d.target && d.target.path) ? d.target.path : "",
                  url: (d.source && d.source.url) ? d.source.url : ""
                };
              }
            } catch(ee) {}
          }
        }
      } catch(e) {}

      var getFromListData = function(aUrlOrPath) {
        if (!aUrlOrPath) return null;
        if (listData[aUrlOrPath]) return listData[aUrlOrPath];
        for (var k in listData) {
          if (k.indexOf(aUrlOrPath) >= 0 || aUrlOrPath.indexOf(k) >= 0) {
            return listData[k];
          }
        }
        return null;
      };

      for (var i = 0; i < items.length; i++) {
        var item = items[i];
        var mimeType = "";
        var fileName = "";
        var itemUri = "";
        try {
          if (item._shell && item._shell.download) {
            mimeType = item._shell.download.contentType || "";
            try {
              var dl = item._shell.download;
              if (dl.target && dl.target.path) {
                var path = dl.target.path;
                fileName = path.replace(/^.*[\\\/]/, '');
              }
              if (!mimeType && dl.contentType) {
                mimeType = dl.contentType;
              }
            } catch(ee) {}
          }
        } catch(e) {}

        if (!mimeType) {
          var icon = item.querySelector(".downloadTypeIcon");
          if (icon) {
            mimeType = icon.getAttribute("mimetype") || icon.getAttribute("mime-type") || "";
          }
        }

        if (!fileName) {
          var targetEl = item.querySelector(".downloadTarget");
          if (targetEl) {
            fileName = targetEl.getAttribute("value") || targetEl.textContent || "";
          }
        }

        if (!itemUri) {
          try {
            var attrs = item.attributes;
            for (var j = 0; j < attrs.length; j++) {
              var attrName = attrs[j].name.toLowerCase();
              if (attrName == "uri" || attrName == "url" || attrName == "href") {
                var uri = attrs[j].value;
                itemUri = uri;
                if (!fileName) {
                  var lastSlash = Math.max(uri.lastIndexOf("/"), uri.lastIndexOf("\\"));
                  if (lastSlash >= 0) {
                    fileName = decodeURIComponent(uri.substring(lastSlash + 1));
                  }
                }
                break;
              }
            }
          } catch(e2) {}
        }

        if ((!mimeType || !fileName) && itemUri) {
          var matched = getFromListData(itemUri);
          if (matched) {
            if (!mimeType && matched.contentType) mimeType = matched.contentType;
            if (!fileName && matched.path) {
              fileName = matched.path.replace(/^.*[\\\/]/, '');
            }
          }
        }

        var category = this._getMimeCategory(mimeType, fileName);
        if (this._currentFilter == "all" || category == this._currentFilter) {
          item.removeAttribute("hidden");
          item.style.display = "";
          visibleCount++;
        } else {
          item.setAttribute("hidden", "true");
          item.style.display = "none";
        }
      }
      var emptyDesc = document.getElementById("downloadsListEmptyDescription");
      if (emptyDesc) {
        if (this._currentFilter != "all" && visibleCount == 0) {
          emptyDesc.removeAttribute("hidden");
          emptyDesc.style.display = "";
          emptyDesc.textContent = "No downloads in this category";
        } else {
          if (items.length > 0) {
            emptyDesc.setAttribute("hidden", "true");
            emptyDesc.style.display = "none";
          }
        }
      }
    },

    onDownloadAdded: function(aDownload) {
      setTimeout(function() {
        this.applyFilter();
      }.bind(this), 100);
    },

    onDownloadChanged: function(aDownload) {
      setTimeout(function() {
        this.applyFilter();
      }.bind(this), 100);
    },

    onDownloadRemoved: function(aDownload) {
      setTimeout(function() {
        this.applyFilter();
      }.bind(this), 100);
    }
  };
  ucjs_downloadManagerMain.init();
}
