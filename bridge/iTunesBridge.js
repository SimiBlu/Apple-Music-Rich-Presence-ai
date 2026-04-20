const { exec } = require("child_process");
const Path = require("path");
const fs = require("fs");
const os = require("os");

const version = os.platform();
const DEVMODE = process.env.DEV === 'true';

const LIBPATH = (
  version === "darwin"
    ? (
      DEVMODE
        ? Path.resolve("./bridge/OSABridge.js")
        : Path.join(process.resourcesPath, "./app/bridge/OSABridge.js")
    )
    : (
      DEVMODE
        ? Path.resolve("./bridge/WSBridge.ps1")
        : Path.join(process.resourcesPath, "./app/bridge/WSBridge.ps1")
    )
);

function childprocessExec(str, options = { encoding: "utf8" }) {
  return new Promise((resolve, reject) => {
    exec(str, options, (err, stdout, stderr) => {
      if (err) return reject(err);
      resolve(stdout);
    });
  });
}

class MusicBridge {
  constructor() {
    this.data = {};
    this.currentSong = {};
    this.setup();
  }

  async setup() {
    try {
      if (version === "win32") {
        this.currentSong = JSON.parse(
          (await childprocessExec(
            `powershell.exe -ExecutionPolicy Bypass -File "${LIBPATH}" -Command currentTrack`,
            { encoding: "utf8" }
          )).trim()
        );
      } else if (version === "darwin") {
        this.currentSong = JSON.parse(
          (await childprocessExec(`osascript "${LIBPATH}" currentTrack`, { encoding: "utf8" })).trim()
        );
      }
    } catch (e) {
      this.currentSong = { state: "Loading/Not playing" };
    }
  }

  async exec(option) {
    if (version === "win32") {
      return childprocessExec(
        `powershell.exe -ExecutionPolicy Bypass -File "${LIBPATH}" -Command "${option}"`,
        { encoding: "utf8" }
      );
    } else if (version === "darwin") {
      return childprocessExec(`osascript "${LIBPATH}" "${option}"`, { encoding: "utf8" });
    }
  }

  async getCurrentSong() {
    if (version === "win32") {
      this.currentSong = JSON.parse(
        (await childprocessExec(
          `powershell.exe -ExecutionPolicy Bypass -File "${LIBPATH}" -Command currentTrack`,
          { encoding: "utf8" }
        )).trim()
      );
    } else if (version === "darwin") {
      this.currentSong = JSON.parse(
        (await childprocessExec(`osascript "${LIBPATH}" currentTrack`, { encoding: "utf8" })).trim()
      );
    }
    return this.currentSong;
  }

  async getState() {
    this.data.state = (await this.exec("playerState")).trim();
    this.currentSong.state = this.data.state;
    return this.data.state;
  }
}

module.exports = MusicBridge;
