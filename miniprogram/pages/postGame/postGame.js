import { createGame } from "../../api/game";
import { fetchUserInfo, fetchUserProfile, addActiveTimestamp } from "../../api/user";
import { formatDateTwo, formatDateThree, getDateString, getDayOfWeek } from "../../api/util";
import { sendGameMessage } from "../../api/message";

const EDIT_TIME_DURATION = 1000;
const app = getApp();

Page({
  /**
   * Page initial data
   */
  data: {
    flag: false, //区分创建还是修改球局的标志
    level: "2.0",
    fileID: "", //图片的网络路径
    otherUserInfo: {}, //修改球局时，其他用户的信息
  },

  showToast(message) {
    wx.showToast({
      icon: "none",
      title: message,
    });
  },

  inputValid(value) {
    let { locationName, maxParticipantCount } = value;

    if (!maxParticipantCount) {
      this.showToast("请输入最大参与人数");
      return false;
    }

    if (!locationName) {
      this.showToast("请输入场地信息");
      return false;
    }

    const { startDate, endDate } = this.data;

    if (startDate > endDate) {
      this.showToast("开始时间应早于结束时间");
      return false;
    }

    return true;
  },

  handleSubmit(e) {
    const formInput = e.detail.value;
    const { locationName, maxParticipantCount, note } = formInput;
    const { startDate, endDate, userInfo, level } = this.data;
    const type = "game";
    const dayOfWeek = getDayOfWeek(startDate);
    const date = formatDateTwo(startDate);
    const startTime = formatDateThree(startDate);
    const endTime = formatDateThree(endDate);
    const senderId = userInfo._id;
    const receiverId = this.data.otherUserInfo._id;
    const otherUserInfo = this.data.otherUserInfo;
    let { location } = this.data;

    if (!this.inputValid(formInput)) {
      return;
    }

    if (!location) {
      location = {};
    }

    if (this.data.flag === false) {
      // 这里是创建球局
      location.name = locationName;
      const participants = [];
      participants.push(userInfo);

      if (this.data.otherUserInfo !== null && Object.keys(this.data.otherUserInfo).length !== 0) {
        participants.push(otherUserInfo);
      }

      console.log(participants);

      const gameBody = {
        level,
        maxParticipantCount: parseInt(maxParticipantCount),
        location,
        startDate,
        participants,
        endDate,
        note,
        chatCode: this.data.fileID,
      };

      wx.showLoading({
        title: "创建中...",
      });

      createGame(gameBody)
        .then((res) => {
          const gameInfo = {
            senderId,
            receiverId,
            type,
            location: locationName,
            dayOfWeek,
            startTime,
            endTime,
            date,
            id: res._id,
          };
          wx.hideLoading();
          wx.navigateBack({
            delta: 1,
          });
          sendGameMessage(gameInfo);
          addActiveTimestamp(endDate, wx.getStorageSync("userInfo")._id);
        })
        .catch((err) => {
          console.error("createGame", err);
          wx.showToast({
            title: "创建失败",
          });
        });
    }
    // 这里是修改球局
    else {
      wx.showLoading({
        title: "修改中...",
      });
      const gameBody = {
        level,
        maxParticipantCount: parseInt(maxParticipantCount),
        location,
        startDate,
        endDate,
        note,
        chatCode: this.data.fileID,
      };
      wx.cloud
        .callFunction({
          name: "editOneGame",
          data: {
            _id: this.data._id,
            gameBody,
          },
        })
        .then((res) => {
          wx.hideLoading();

          wx.navigateBack({
            delta: 1,
          });

          addActiveTimestamp(endDate, wx.getStorageSync("userInfo")._id);
          setTimeout(function () {
            wx.showToast({
              title: "修改成功",
              icon: "none",
            });
          }, EDIT_TIME_DURATION);
          console.log(res);
        });
    }
  },

  onMaxParticipantCountChoose(e) {
    this.setData({
      maxParticipantCount: e.currentTarget.dataset.count,
    });
  },

  chooseLocation() {
    // wx.chooseLocation().then((res) => {
    //   this.setData({
    //     location: res,
    //   });
    // });
  },

  onStartDatePicked(e) {
    const startDateStr = e.detail.value;
    const startDate = Date.parse((startDateStr + " " + this.data.startTimeStr).replace(/-/g, "/"));
    this.setData({
      startDateStr,
      startDate,
    });
    console.log(this.data.startDate);
  },

  onStartTimePicked(e) {
    const startTimeStr = e.detail.value;
    const startDate = Date.parse((this.data.startDateStr + " " + startTimeStr).replace(/-/g, "/"));

    this.setData({
      startTimeStr,
      startDate,
    });
  },

  onEndDatePicked(e) {
    const endDateStr = e.detail.value;
    const endDate = Date.parse((endDateStr + " " + this.data.endTimeStr).replace(/-/g, "/"));

    this.setData({
      endDateStr,
      endDate,
    });
  },

  onEndTimePicked(e) {
    const endTimeStr = e.detail.value;
    const endDate = Date.parse((this.data.endDateStr + " " + endTimeStr).replace(/-/g, "/"));

    this.setData({
      endTimeStr,
      endDate,
    });
  },

  ChooseImage() {
    wx.chooseImage({
      count: 1,
      sourceType: ["album"],
      success: (res) => {
        this.setData({
          imgSrc: res.tempFilePaths[0],
        });
        this.uploadImg(res);
      },
    });
  },

  deleteImg() {
    wx.cloud
      .deleteFile({
        fileList: [`${this.data.fileID}`],
      })
      .then((res) => {
        this.setData({
          fileID: "",
        });
      });
  },

  uploadImg(res) {
    wx.cloud
      .uploadFile({
        cloudPath: `user-avatars/${Date.now()}.png`,
        filePath: res.tempFilePaths[0],
      })
      .then((res) => {
        this.setData({
          fileID: res.fileID,
        });
      })
      .catch((error) => {
        console.log("图片上传失败！");
      });
  },

  handleLevelChange(e) {
    this.setData({
      level: e.detail.value,
    });
  },

  /**
   * Lifecycle function--Called when page load
   */
  onLoad: async function (options) {
    // 编辑球局时，options.flag不为空
    if (options.flag) {
      this.setData({
        flag: JSON.parse(options.flag),
        _id: options._id,
        isLoading: true,
      });
      // 调用云函数fetchOneGame查出指定id的数据
      wx.cloud
        .callFunction({
          name: "fetchOneGame",
          data: {
            _id: options._id,
          },
        })
        .then((res) => {
          const oneGame = res.result.data;
          this.setData({
            location: oneGame.location,
            maxParticipantCount: oneGame.maxParticipantCount,
            note: oneGame.note,
            startDateStr: formatDateTwo(oneGame.startDate),
            startTimeStr: formatDateThree(oneGame.startDate),
            endDateStr: formatDateTwo(oneGame.endDate),
            endTimeStr: formatDateThree(oneGame.endDate),
            level: oneGame.level,
            fileID: oneGame.chatCode,
            isLoading: false,
          });
        });
    }

    const now = new Date();
    const startDateStr = now.yyyymmdd();
    const startTimeStr = `${now.getHours()}:00`;
    const endDateStr = now.yyyymmdd();
    const endTimeStr = `${now.getHours()}:30`;
    const startDate = Date.parse((startDateStr + " " + startTimeStr).replace(/-/g, "/"));
    const endDate = Date.parse((endDateStr + " " + endTimeStr).replace(/-/g, "/"));

    fetchUserInfo().then((userInfo) => {
      this.setData({
        userInfo,
      });
    });

    this.setData({
      startDateStr,
      startTimeStr,
      endDateStr,
      endTimeStr,
      startDate,
      endDate,
    });

    if (options.id) {
      const id = JSON.parse(options.id);
      const otherUserInfo = await fetchUserProfile(id);
      addActiveTimestamp(this.data.endDate, id);
      this.setData({
        otherUserInfo: otherUserInfo,
      });
    }
  },
});
