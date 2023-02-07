function repair(data) {
  // 日付取得
  const date = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd HH:mm:ss');

  // 月によってシートを変える部分
  // date から月だけ取り出す
  var date_split = date.split(' ');
  var year_month_day = date_split[0];
  var year_month_day_split = year_month_day.split("-");
  var month = year_month_day_split[1];

  var sheet_name = month + '月';
  // {sheet_name}のシートが存在するか
  var is_being = REPAIR_SHEET.getSheetByName(sheet_name);
  if (!is_being) {
    // 存在していないなら、新しくシートを作る
    var insert_sheet = REPAIR_SHEET.insertSheet(sheet_name);
    // 1行目を挿入 
    insert_sheet.appendRow(['注文方法', '注文日時', 'LINE ID', '客先名', '発注者名', '機械名', '機種', '製造番号', '受注表', '内容', '部品名', '数量', '画像1', '画像2', '画像3', '備考']);
    change_cell_color_repair()
    createDropdown_Repair()
  }
  // 現在のシートをsheetオブジェクトとして取得
  // Spreadsheet型ではなくSHEET型じゃないとgetRange(a, b, c, d)が使えないので注意
  var NOW_SHEET = REPAIR_SHEET.getSheetByName(sheet_name);
  // リプライトークン取得
  const replyToken = data.replyToken;

  //ユーザーID取得
  const lineUserId = data.source.userId;

  // ユーザ名取得
  var userName = getUserDisplayName(lineUserId);

  // メッセージ取得
  var userMessage = data.message.text;
  // スプレッドシートに書き込む各要素を取得
  var message_elements = userMessage.split("\n");
  var name_text = message_elements[2].split('：');
  var name = name_text[1];
  var model_text = message_elements[3].split('：');
  var model = model_text[1];
  var serial_text = message_elements[4].split('：');
  var serial = serial_text[1];
  var symptom_text = message_elements[5].split('：');
  var symptom = symptom_text[1];

  var symptom_col;
  for (symptom_col = 6; !message_elements[symptom_col].match('：'); symptom_col++) {
    symptom += '\n' + message_elements[symptom_col];
  }
  const next_col = symptom_col;

  var symptom_name = '';
  var symptom_count = '';
  var machine_image = '';
  var repair_name = '';
  var remarks = '';
  if (symptom == '納品のみ') {
    var symptom_name_text = message_elements[6].split('：');
    symptom_name = symptom_name_text[1];
    var symptom_count_text = message_elements[7].split('：');
    symptom_count = symptom_count_text[1];
    var machine_image_text = message_elements[8].split('：');
    machine_image = machine_image_text[1];
    var repair_name_text = message_elements[9].split('：');
    repair_name = repair_name_text[1];
    var remarks_text = message_elements[10].split('：');
    remarks = remarks_text[1];
    if (message_elements.length > 11) {
      for (var j = 11; j < message_elements.length; j++) {
        remarks += '\n' + message_elements[j];
      }
    }
  } else {
    var machine_image_text = message_elements[next_col].split('：');
    machine_image = machine_image_text[1];
    var repair_name_text = message_elements[next_col + 1].split('：');
    repair_name = repair_name_text[1];
    var remarks_text = message_elements[next_col + 2].split('：');
    remarks = remarks_text[1];
    if (message_elements.length > next_col + 3) {
      for (var j = next_col + 3; j < message_elements.length; j++) {
        remarks += '\n' + message_elements[j];
      }
    }
  }
  // 注文番号を計算
  // LINEからの注文：L-MMdd{count}
  // ex:9/18の3件目の注文→L-091803
  var day = year_month_day_split[2];
  var monthZero = ('00' + month).slice(-2);
  var dayZero = ('00' + day).slice(-2);
  // 同じ日付の注文を数える  
  var j = 2;
  var count = 1;
  while (NOW_SHEET.getRange(j, 1).getValue() != "") {
    if (NOW_SHEET.getRange(j, 1).getValue().match(monthZero + dayZero)) {
      count++;
    }
    j++;
  }
  var countZero = ('00' + count).slice(-2);

  var orderNumber = 'S-' + monthZero + dayZero + countZero;

  // USER_SHEETから、LINE IDと一致した本名を取ってくる
  j = 2
  var realName = ''
  while (USER_SHEET.getRange(j, 1).getValue() != "") {
    if (USER_SHEET.getRange(j, 1).getValue().match(lineUserId)) {
      realName = USER_SHEET.getRange(j, 2).getValue();
    }
    j++;
  }
  // USER_SHEETに無いLINE IDだった場合は、LINEのユーザ名の先頭に(N)をつける
  if (realName == '') {
    realName = '(N)' + userName;
  }
  if (repair_name != '') {
    userName = repair_name;
  } else {
    userName = realName;
  }

  // スプレッドシートに記録
  NOW_SHEET.appendRow([orderNumber, date, lineUserId, userName, realName, name, model, serial, '未対応', symptom, symptom_name, symptom_count, '', '', '', remarks]);

  // 日付順に並び替え（最新の情報がスプシ2行目にくるように）
  const numColumn = NOW_SHEET.getLastColumn(); // 最後列の列番号を取得
  const numRow = NOW_SHEET.getLastRow() - 1;  // 最後行の行番号を取得
  let dataRange = NOW_SHEET.getRange(2, 1, numRow, numColumn);
  dataRange.sort([{ column: 2, ascending: false }]);

  // 完了メッセージを送る
  if (machine_image == 'あり') {
    sendMessage(replyToken, '画像を送信してください\n(3枚まで送信可能です)');
  } else {
    sendMessage(replyToken, '修理依頼を受け付けました');
  }

  return ContentService.createTextOutput(JSON.stringify({ 'content': 'post ok' })).setMimeType(ContentService.MimeType.JSON);
}