// 応答メッセージURL
const REPLY = "https://api.line.me/v2/bot/message/reply";

// アクセストークン
const ACCESS_TOKEN = "SgxRnP/KvikkBl75WPt/zkhfUTprSRH2lHofJk5853HQJsCX9w5v+crRdMJ/krOlQDPKTZiDulMVOLFxzZkAfFuk1SLZ+NxpVm6zewTiU48Nqtv/2KLM/RGqI+qYr2NtItk4tmwWxZr5VN5Wfp8FvQdB04t89/1O/w1cDnyilFU=";

// スプレッドシート情報
const ORDER_SHEET_ID   = CreateSS.read_Order_SS();
const ORDER_SHEET      = SpreadsheetApp.openById(ORDER_SHEET_ID);
const REPAIR_SHEET_ID   = CreateSS.read_Repair_SS();
const REPAIR_SHEET      = SpreadsheetApp.openById(REPAIR_SHEET_ID);
var NOW_IMG_SHEET; // 画像を書き込むスプシ
var SHEET_NAME; // 画像を書き込むシート

// Google Drive ID
const GOOGLE_DRIVE_ID = "1uD84z4wr3ZAyG5ppGYpoXX-vWRtXQXEV";

// LINE IDと本名を紐付けたシート
const USER_SHEET_ID = '1dSWxumprdpmV60pi9bsr3XjvdTjGlUkKx36Ev0T2Pws';
const USER_SHEET = SpreadsheetApp.openById(USER_SHEET_ID).getSheetByName('シート1');

// LINEから送られてきたデータを取得 doPost()
function doPost(e) {
  // 日付取得
  const date = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd HH:mm:ss');
  // 月によってシートを変える部分
  // date から月だけ取り出す
  var date_split = date.split(' ');
  var year_month_day = date_split[0];
  var year_month_day_split = year_month_day.split("-");
  var month = year_month_day_split[1];
  SHEET_NAME = month + '月';
  NOW_IMG_SHEET = REPAIR_SHEET.getSheetByName(SHEET_NAME);

  //メッセージの元データを取得
  const rowData = JSON.parse(e.postData.contents);
  var dataLen = rowData.events.length;
  for(var i = 0; i < dataLen; i++){
    const data = rowData.events[i];
    const replyToken = data.replyToken;
    const lineUserId = data.source.userId;

    // 送信されたメッセージの種類を取得
    // https://developers.line.biz/ja/docs/messaging-api/message-types/#sticker-messages
    const postType = data.message.type;
    if(postType === "image"){
      imageSave(replyToken, data, lineUserId);
    }else{
      // メッセージ取得
      var userMessage = data.message.text;

      // スプレッドシートに書き込む各要素を取得
      var message_elements = userMessage.split("\n");
      var mode = message_elements[0];
      if(mode == '【注文内容】'){
        order(data);
      }else if(mode == '【修理依頼内容】'){
        repair(data);
      }
    }
  }

  return ContentService.createTextOutput(JSON.stringify({ 'content': 'post ok' })).setMimeType(ContentService.MimeType.JSON);
}


// 送信された画像を保存 imageSave()
function imageSave(replyToken, data, lineUserId) {
  // LINEから画像取得 getImg()
  const imgData = getImg(data);
  // Googleドライブに保存　saveImg()
  const url = saveImg(imgData);

  const info = desideImgLog(lineUserId, url);
  
  // //「保存完了」とLINEにメッセージを送る
  sendMessage(replyToken, info);
}


// LINEから画像取得　getImg()
function getImg(data) {
  const IMG_URL = 'https://api-data.line.me/v2/bot/message/' + data.message.id + '/content';
  const HEAD = {
    "method":"get",
    "headers": {
      "Authorization" : "Bearer " + ACCESS_TOKEN
    }
  }
  const imgData = UrlFetchApp.fetch(IMG_URL, HEAD);
  return imgData;
}


// Googleドライブに保存　saveImg()
function saveImg(imgBinary, range){
  //GoogleDriveフォルダID
  const folder = DriveApp.getFolderById(GOOGLE_DRIVE_ID);
  //ランダムな文字列を生成して、画像のファイル名とする
  const fileName = Math.random().toString(36).slice(-8);
  //Googleドライブのフォルダに画像を生成
  const imageFile = folder.createFile(imgBinary.getBlob().setName(fileName));;
  //画像ファイルURL取得
  const imageURL = 'https://drive.google.com/uc?export=view&id=' + imageFile.getId();
  //画像ファイルにリンクでアクセスの権限付与
  imageFile.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
  
  return imageURL
}

// どちらに保存するか決定する
function desideImgLog(lineUserId, url){
  var TMP_ORDER_SHEET = ORDER_SHEET.getSheetByName(SHEET_NAME);
  var TMP_REPAIR_SHEET = REPAIR_SHEET.getSheetByName(SHEET_NAME);
  var orderImgInfo = '', repairImgInfo = '';
  var order_index_time = '2000-01-01 00:00:00', order_index_colmn;
  var repair_index_time = '2000-01-01 00:00:00', repair_index_column, repair_index_row;

  var i = 2;
  while (TMP_ORDER_SHEET.getRange(i, 1).getValue() != "") {
    if (TMP_ORDER_SHEET.getRange(i, 3).getValue().match(lineUserId)) {
      order_index_time = TMP_ORDER_SHEET.getRange(i, 2).getValue();
      if(TMP_ORDER_SHEET.getRange(i, 11).getValue() == ""){
        order_index_colmn = i;
      }else{
        orderImgInfo = '画像は1つの注文に1つまでしか添付できません';
      }
      
      break; // 最新のを見つけたら抜ける
    }
    i++;
  }

  i = 2;
  while (TMP_REPAIR_SHEET.getRange(i, 1).getValue() != "") {
    if (TMP_REPAIR_SHEET.getRange(i, 3).getValue().match(lineUserId)) {
      repair_index_time = TMP_REPAIR_SHEET.getRange(i, 2).getValue();
      repair_index_column = i;
      if(TMP_REPAIR_SHEET.getRange(i, 13).getValue() == ""){
        repair_index_row = 13;
      }else if(TMP_REPAIR_SHEET.getRange(i, 14).getValue() == ""){
        repair_index_row = 14;
      }else if(TMP_REPAIR_SHEET.getRange(i, 15).getValue() == ""){
        repair_index_row = 15;
      }else{
        repairImgInfo = '画像は1つの注文に3つまでしか添付できません';
      }
      
      break; // 最新のを見つけたら抜ける
    }
    i++;
  }

  var order_date = new Date(order_index_time).getTime()
  var repair_date = new Date(repair_index_time).getTime()
  if(order_date > repair_date){
    if(orderImgInfo == ''){
      orderImgInfo = '画像を保存しました'
      TMP_ORDER_SHEET.getRange(order_index_colmn, 11).setValue(url);
    }
    return orderImgInfo;
  }else{
    if(repairImgInfo == ''){
      repairImgInfo = '画像を1枚保存しました'
      TMP_REPAIR_SHEET.getRange(repair_index_column, repair_index_row).setValue(url);
      
      // setValueの反映が遅いので、flush()を使って強制的に反映させる
      SpreadsheetApp.flush();
    }
    return repairImgInfo;
  }
}

// ユーザーのプロフィール名取得 getUserDisplayName()
function getUserDisplayName(userId) {
  const url = 'https://api.line.me/v2/bot/profile/' + userId;
  const userProfile = UrlFetchApp.fetch(url,{
    'headers': {
      'Authorization' : 'Bearer ' + ACCESS_TOKEN,
    },
  })
  return JSON.parse(userProfile).displayName;
}

// LINEにメッセージ送信 sendMessage()
function sendMessage(replyToken, replyText) {
  const postData = {
    "replyToken" : replyToken,
    "messages" : [
      {
        "type" : "text",
        "text" : replyText
      }
    ]
  };
  const headers = {
    "Content-Type" : "application/json; charset=UTF-8",
    "Authorization" : "Bearer " + ACCESS_TOKEN
  };
  const options = {
    "method" : "POST",
    "headers" : headers,
    "payload" : JSON.stringify(postData)
  };
  return UrlFetchApp.fetch(REPLY, options);
}