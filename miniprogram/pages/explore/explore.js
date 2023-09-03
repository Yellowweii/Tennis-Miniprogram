import { navigateToPostGame, navigateToExploreDetail } from "../../navigator";
import { matchUsers } from "../../api/match";

const app = getApp();
const TIMESTAMP = 1000 * 60 * 60 * 24;
const TEN_DAYS = 1000 * 60 * 60 * 24 * 10;

Component({
  options: {
    addGlobalClass: true,
  },
  /**
   * Component properties
   */
  properties: {},

  /**
   * Component initial data
   */
  data: {
    handleDelay: false,
  },

  lifetimes: {
    attached() {
      this.handleDelay();
      const datestr = Date.now();
      if (!wx.getStorageSync("filteredUsers")) {
        wx.setStorageSync("filteredUsers", []);
      } else {
        const filteredUsers = wx.getStorageSync("filteredUsers").filter((item) => (datestr - item.filterTimestamp) / TIMESTAMP <= 3);
        wx.setStorageSync("filteredUsers", filteredUsers);
      }
      this.getMatchUsers();
    },
  },

  /**
   * Component methods
   */
  methods: {
    postGame() {
      navigateToPostGame();
    },

    handleViewInfo(e) {
      const info = JSON.stringify(this.data.matchedUsers[e.currentTarget.dataset.index]);
      navigateToExploreDetail(info);
    },

    handleUpdateList() {
      const filteredUsers = this.data.matchedUsers.map((item) => {
        return {
          filterTimestamp: Date.now(),
          _id: item._id,
        };
      });
      wx.setStorageSync("filteredUsers", [...wx.getStorageSync("filteredUsers"), ...filteredUsers]);
      this.matchUsers(true);
    },

    handleDelay() {
      var that = this;
      that.setData({
        handleDelay: true,
      });
    },

    getMatchUsers() {
      this.matchUsers(true);
    },

    matchUsers(flag) {
      this.setData({
        loading: true,
      });
      matchUsers({
        userId: app.userInfo._id,
        filteredUsers: wx.getStorageSync("filteredUsers"),
        latitude: app.globalData.latitude,
        longitude: app.globalData.longitude,
        isChangeList: flag,
      }).then((res) => {
        const nowTimestamp = Date.now();

        const matchedUsers = res.result.matchedUsers.map((user) => {
          const modifiedUser = { ...user };
          if (modifiedUser.activeTimestamps && modifiedUser.activeTimestamps.length > 0) {
            const lastTimestamp = modifiedUser.activeTimestamps[modifiedUser.activeTimestamps.length - 1];
            modifiedUser.isWithinTenDays = nowTimestamp - lastTimestamp <= TEN_DAYS;
          } else {
            modifiedUser.isWithinTenDays = false;
          }
          return modifiedUser;
        });
        this.setData({
          matchedUsers: matchedUsers,
          loading: false,
        });

        console.log(matchedUsers);
      });
    },
  },
});
