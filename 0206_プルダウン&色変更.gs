//プルダウンを作成
function createDropdown_Order() {

  // 日付取得
  const date = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd HH:mm:ss');
  // 月によってシートを変える部分
  // date から月だけ取り出す
  var date_split = date.split(' ');
  var year_month_day = date_split[0];
  var year_month_day_split = year_month_day.split("-");
  var month = year_month_day_split[1];
  SHEET_NAME = month + '月';

  //SSのIDを取得
  const SHEET_ID = CreateSS.read_Order_SS();
  const sheet_data = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);
  //プルダウン作成範囲
  var range = sheet_data.getRange(2, 9, 100);
  //入力規則
  var values = ["未対応", "対応済み", "✕"];

  //プルダウン作成
  var rule = SpreadsheetApp.newDataValidation().requireValueInList(values).build();
  range.setDataValidation(rule);

}

//プルダウンを作成
function createDropdown_Repair() {

  // 日付取得
  const date = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd HH:mm:ss');
  // 月によってシートを変える部分
  // date から月だけ取り出す
  var date_split = date.split(' ');
  var year_month_day = date_split[0];
  var year_month_day_split = year_month_day.split("-");
  var month = year_month_day_split[1];
  SHEET_NAME = month + '月';

  //SSのIDを取得
  const SHEET_ID = CreateSS.read_Repair_SS();
  const sheet_data = SpreadsheetApp.openById(SHEET_ID).getSheetByName(SHEET_NAME);

  //プルダウン作成範囲 I列
  var range = sheet_data.getRange(2, 9, 100);
  //入力規則
  var values = ["未対応", "対応中", "対応済み", "✕"];

  //プルダウン作成
  var rule = SpreadsheetApp.newDataValidation().requireValueInList(values).build();
  range.setDataValidation(rule);

}

//セルの色を青色
function change_cell_color_order() {

  // 日付取得
  const date = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd HH:mm:ss');
  // 月によってシートを変える部分
  // date から月だけ取り出す
  var date_split = date.split(' ');
  var year_month_day = date_split[0];
  var year_month_day_split = year_month_day.split("-");
  var month = year_month_day_split[1];
  SHEET_NAME = month + '月';

  //SSのIDを取得(order)
  const SHEET_ID_ORDER = CreateSS.read_Order_SS();
  const sheet_data_order = SpreadsheetApp.openById(SHEET_ID_ORDER).getSheetByName(SHEET_NAME);
  let range_order = sheet_data_order.getRange(1, 1, 1, 100)
  range_order.setBackgroundColor("#a4c2f4");

}

//セルの色を黄色
function change_cell_color_repair() {

  // 日付取得
  const date = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd HH:mm:ss');
  // 月によってシートを変える部分
  // date から月だけ取り出す
  var date_split = date.split(' ');
  var year_month_day = date_split[0];
  var year_month_day_split = year_month_day.split("-");
  var month = year_month_day_split[1];
  SHEET_NAME = month + '月';

  //SSのIDを取得(order)
  const SHEET_ID_ORDER = CreateSS.read_Repair_SS();
  const sheet_data_order = SpreadsheetApp.openById(SHEET_ID_ORDER).getSheetByName(SHEET_NAME);
  let range_order = sheet_data_order.getRange(1, 1, 1, 100)
  range_order.setBackgroundColor("#ffe599");

}