// app.js
Date.prototype.yyyymmdd = function () {
  var mm = this.getMonth() + 1; // getMonth() is zero-based
  var dd = this.getDate();

  return [this.getFullYear(), (mm > 9 ? "" : "0") + mm, (dd > 9 ? "" : "0") + dd].join("-");
};

Date.prototype.mmdd = function () {
  var mm = this.getMonth() + 1; // getMonth() is zero-based
  var dd = this.getDate();

  return [(mm > 9 ? "" : "0") + mm, (dd > 9 ? "" : "0") + dd].join("/");
};

Date.prototype.dateStr = function () {
  var now = new Date();

  if (now.getFullYear() == this.getFullYear() && now.getMonth() == this.getMonth() && now.getDate() == this.getDate()) {
    return "Today";
  }

  var mm = this.getMonth() + 1;
  var dd = this.getDate();

  if (now.getFullYear() == this.getFullYear()) {
    return [(mm > 9 ? "" : "0") + mm, (dd > 9 ? "" : "0") + dd].join("/");
  } else {
    return [this.getFullYear(), (mm > 9 ? "" : "0") + mm, (dd > 9 ? "" : "0") + dd].join("/");
  }
};

Date.prototype.hhmm = function () {
  var hh = this.getHours();
  var mm = this.getMinutes();

  return [(hh > 9 ? "" : "0") + hh, (mm > 9 ? "" : "0") + mm].join(":");
};

Date.prototype.hhmmss = function () {
  var hh = this.getHours();
  var mm = this.getMinutes();
  var ss = this.getSeconds();

  return [(hh > 9 ? "" : "0") + hh, (mm > 9 ? "" : "0") + mm, (ss > 9 ? "" : "0") + ss].join(":");
};

Date.prototype.addDays = function (days) {
  var date = new Date(this.valueOf());
  date.setDate(date.getDate() + days);
  return date;
};

Date.prototype.addMinutes = function (minutes) {
  var date = new Date(this.valueOf());
  return new Date(date.getTime() + minutes * 60000);
};

App({
  onLaunch: function () {
    if (!wx.cloud) {
      console.error("请使用 2.2.3 或以上的基础库以使用云能力");
    } else {
      wx.cloud.init({
        // env 参数说明：
        //   env 参数决定接下来小程序发起的云开发调用（wx.cloud.xxx）会默认请求到哪个云环境的资源
        //   此处请填入环境 ID, 环境 ID 可打开云控制台查看
        //   如不填则使用默认环境（第一个创建的环境）
        // env: 'my-env-id',
        traceUser: true,
      });

      wx.getSystemInfo({
        success: (e) => {
          console.log(e);

          this.globalData.windowWidth = e.windowWidth;
          this.globalData.statusBarHeight = e.statusBarHeight;

          // Bottom navigation bar
          this.globalData.navigationBarHeight = e.screenHeight - e.safeArea.bottom;

          // Toolbar
          let menu = wx.getMenuButtonBoundingClientRect();
          this.globalData.menu = menu;
          this.globalData.toolbarHeight = menu.height + (menu.top - e.statusBarHeight) * 2;
        },
      });
      //  get the latitude and longitude of the user
      // wx.authorize({
      //   scope: "scope.userLocation",
      // }).then(() => {
      //   wx.getLocation().then((res) => {
      //     this.globalData.latitude = res.latitude;
      //     this.globalData.longitude = res.longitude;
      //   });
      // });
    }
  },

  globalData: {},
});
