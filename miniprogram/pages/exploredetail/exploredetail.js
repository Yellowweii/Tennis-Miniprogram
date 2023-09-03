import { navigateToChat, navigateToExplore } from "../../navigator";

const app = getApp();

Page({
  /**
   * 页面的初始数据
   */
  data: {
    matchedUserInfo: {},
    isTraining: false,
    appBarHeight: app.globalData.toolbarHeight + app.globalData.statusBarHeight,
    statusBarHeight: app.globalData.statusBarHeight,
    menu: app.globalData.menu,
  },

  onLoad: function (options) {
    if (options.info) {
      const info = JSON.parse(options.info);
      console.log(info);

      this.setData({
        matchedUserInfo: info,
      });
    }
  },

  handleContactPerson() {
    const id = this.data.matchedUserInfo._id;
    navigateToChat(id);
    this.filterPerson();
  },

  handleFilterPerson() {
    this.filterPerson();
    const tab = "explore";
    navigateToExplore(tab);
  },

  filterPerson() {
    const filteredUsers = { _id: this.data.matchedUserInfo._id, filterTimestamp: Date.now() };
    const filteredUsersList = wx.getStorageSync("filteredUsers");
    filteredUsersList.push(filteredUsers);
    wx.setStorageSync("filteredUsers", filteredUsersList);
  },

  backPage() {
    const pages = getCurrentPages();
    console.log(pages);
    if (pages.length == 1) {
      wx.reLaunch({
        url: "/pages/index/index",
      });
    } else {
      wx.navigateBack({
        delta: 1,
      });
    }
  },

  onShareAppMessage() {},

  onShareTimeline() {
    return {
      title: `${wx.getStorageSync("userInfo").nickname}`,
    };
  },
});
