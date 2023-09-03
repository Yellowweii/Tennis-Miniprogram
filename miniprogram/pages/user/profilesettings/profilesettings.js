import { fetchUserInfo, signup, updateUserInfo } from "../../../api/user";

Page({
  data: {
    gender: "male",
    availableDate: "workday",
    availableTime: "daylight",
  },

  handleAvatarChoosen(e) {
    const { avatarUrl } = e.detail;
    this.setData({
      avatarUrl,
      avatarChanged: true,
    });
  },

  handleLevelChange(e) {
    this.setData({
      level: e.detail.value,
    });
  },

  handleGenderSelect(e) {
    const gender = e.currentTarget.dataset.gender;
    this.setData({
      gender,
    });
  },

  handleDaySelect(e) {
    const availableDate = e.currentTarget.dataset.day;
    this.setData({
      availableDate,
    });
  },

  handleTimeSelect(e) {
    const availableTime = e.currentTarget.dataset.time;
    this.setData({
      availableTime,
    });
  },

  handleDaySelect(e) {
    const availableDate = e.currentTarget.dataset.day;
    this.setData({
      availableDate,
    });
  },

  handleTimeSelect(e) {
    const availableTime = e.currentTarget.dataset.time;
    this.setData({
      availableTime,
    });
  },

  handleDaySelect(e) {
    const availableDate = e.currentTarget.dataset.day;
    this.setData({
      availableDate,
    });
  },

  handleTimeSelect(e) {
    const availableTime = e.currentTarget.dataset.time;
    this.setData({
      availableTime,
    });
  },

  handleSubmit(e) {
    console.log(e.detail.value);
    const { nickname, court, club, introduction } = e.detail.value;
    const { avatarUrl, gender, edit, avatarChanged, level } = this.data;
    let { availableDate, availableTime } = this.data;

    if (availableDate === "workday") {
      availableDate = "工作日";
      this.setData({
        availableDate,
      });
    } else if (availableDate === "weekend") {
      availableDate = "周末";
      this.setData({
        availableDate,
      });
    } else {
      availableDate = "工作日+周末";
      this.setData({
        availableDate,
      });
    }

    if (availableTime === "daylight") {
      availableTime = "白天";
      this.setData({
        availableTime,
      });
    } else {
      availableTime = "晚上";
      this.setData({
        availableTime,
      });
    }

    if (!avatarUrl || avatarUrl.length === 0) {
      wx.showToast({
        title: "请上传头像",
        icon: "none",
      });
      return;
    }

    if (!nickname || nickname.length === 0) {
      wx.showToast({
        title: "昵称不能为空",
        icon: "none",
      });
      return;
    }

    wx.showLoading({
      title: "正在记下来...",
    });

    if (edit) {
      const userId = this.data.userInfo._id;
      if (avatarChanged) {
        wx.cloud.uploadFile({
          cloudPath: `user-avatars/${Date.now()}.png`,
          filePath: avatarUrl,
          success: (res) => {
            updateUserInfo(userId, {
              nickname,
              level,
              gender,
              court,
              club,
              day,
              availableDate,
              availableTime,
              introduction,
              avatarUrl: res.fileID,
            }).then(() => {
              wx.hideLoading();
              wx.navigateBack();
            });
          },
        });
      } else {
        updateUserInfo(userId, {
          nickname,
          level,
          gender,
          court,
          club,
          availableDate,
          availableTime,
          introduction,
        }).then(() => {
          wx.hideLoading();
          wx.navigateBack();
        });
      }
    } else {
      this.signup(nickname, level, avatarUrl, gender, court, club, availableDate, availableTime, introduction);
    }
  },

  signup(nickname, level, avatarUrl, gender, court, club, availableDate, availableTime, introduction) {
    wx.cloud.uploadFile({
      cloudPath: `user-avatars/${Date.now()}.png`,
      filePath: avatarUrl,
      success: (res) => {
        signup({
          nickname,
          level,
          avatarUrl: res.fileID,
          gender,
          court,
          club,
          availableDate,
          availableTime,
          introduction,
          activeTimestamps: [],
        })
          .then((res) => {
            wx.hideLoading();
            wx.navigateBack({
              delta: 2,
            });
            fetchUserInfo().then((userInfo) => {
              getApp().globalData.userInfo = userInfo;
            });
          })
          .catch((err) => {
            wx.hideLoading();
            console.log(err);
            wx.showToast({
              title: "注册失败",
              icon: "none",
            });
          });
      },
      fail: (err) => {
        wx.hideLoading();
        console.log(err);
        wx.showToast({
          title: "上传头像失败",
          icon: "none",
        });
      },
    });
  },

  onLoad(options) {
    if (options.edit === "true") {
      this.setData({
        edit: true,
      });

      fetchUserInfo().then((userInfo) => {
        if (userInfo) {
          const { avatarUrl, nickname, level, gender, club, court, introduction } = userInfo;
          this.setData({
            userInfo,
            avatarUrl,
            gender,
            nickname,
            level,
            club,
            court,
            introduction,
          });
        }
      });
    }
  },
});
