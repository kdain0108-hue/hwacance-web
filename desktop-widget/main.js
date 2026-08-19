const { app, BrowserWindow, Tray, Menu, screen } = require("electron");
const path = require("path");
const fs = require("fs");

const WIDGET_WIDTH = 320;
const WIDGET_HEIGHT = 196;
const MARGIN = 20;

const POSITION_FILE = path.join(app.getPath("userData"), "widget-position.json");

let mainWindow = null;
let tray = null;
let savePositionTimer = null;

function loadSavedPosition(){
  try{
    const raw = fs.readFileSync(POSITION_FILE, "utf8");
    const parsed = JSON.parse(raw);
    if(typeof parsed.x === "number" && typeof parsed.y === "number") return parsed;
  }catch(e){ /* no saved position yet, or unreadable — fall back to default */ }
  return null;
}

function savePosition(x, y){
  clearTimeout(savePositionTimer);
  savePositionTimer = setTimeout(() => {
    try{ fs.writeFileSync(POSITION_FILE, JSON.stringify({ x, y })); }catch(e){ /* ignore write failures */ }
  }, 300);
}

function bottomRightOf(display){
  const { width, height, x: originX, y: originY } = display.workArea;
  return { x: originX + width - WIDGET_WIDTH - MARGIN, y: originY + height - WIDGET_HEIGHT - MARGIN };
}

function createWindow(){
  const saved = loadSavedPosition();
  const startPos = saved || bottomRightOf(screen.getPrimaryDisplay());

  mainWindow = new BrowserWindow({
    width: WIDGET_WIDTH,
    height: WIDGET_HEIGHT,
    x: startPos.x,
    y: startPos.y,
    frame: false,
    resizable: false,
    movable: true,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: false,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, "widget.html"));
  mainWindow.once("ready-to-show", () => mainWindow.show());
  mainWindow.setAlwaysOnTop(true, "screen-saver");
  mainWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });

  mainWindow.on("moved", () => {
    const [x, y] = mainWindow.getPosition();
    savePosition(x, y);
  });
}

function moveToDisplay(display){
  if(!mainWindow) return;
  const pos = bottomRightOf(display);
  mainWindow.setPosition(pos.x, pos.y);
  savePosition(pos.x, pos.y);
}

function buildTrayMenu(){
  const displays = screen.getAllDisplays();
  const displayItems = displays.map((d, i) => ({
    label: displays.length > 1
      ? `모니터 ${i + 1}로 이동 (${d.size.width}×${d.size.height}${d.id === screen.getPrimaryDisplay().id ? ", 주 모니터" : ""})`
      : "화면 오른쪽 아래로 이동",
    click: () => moveToDisplay(d)
  }));

  return Menu.buildFromTemplate([
    {
      label: "보이기 / 숨기기",
      click: () => {
        if(!mainWindow) return;
        mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
      }
    },
    { type: "separator" },
    ...displayItems,
    { type: "separator" },
    { label: "종료", click: () => app.quit() }
  ]);
}

function createTray(){
  tray = new Tray(path.join(__dirname, "icon.png"));
  tray.setToolTip("화캉스 위젯");
  tray.setContextMenu(buildTrayMenu());
  tray.on("click", () => {
    if(!mainWindow) return;
    mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
  });

  // 모니터 연결/해제 시 이동 메뉴 목록을 다시 만든다.
  screen.on("display-added", () => tray.setContextMenu(buildTrayMenu()));
  screen.on("display-removed", () => tray.setContextMenu(buildTrayMenu()));
}

app.whenReady().then(() => {
  createWindow();
  createTray();
});

app.on("window-all-closed", () => {
  if(process.platform !== "darwin") app.quit();
});
