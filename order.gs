function order(data) {
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
  var is_being = ORDER_SHEET.getSheetByName(sheet_name);
  if (!is_being) {
    // 存在していないなら、新しくシートを作る
    var insert_sheet = ORDER_SHEET.insertSheet(sheet_name);

    // 1行目を挿入 
    insert_sheet.appendRow(['注文方法', '注文日時', 'LINE ID', '客先名', '発注者名', '商品名', '数量', '単位', '受注表', '希望納期', '画像', '備考', '発注先', '送り先', '発注', '着']);
    change_cell_color_order()
    createDropdown_Order()

  }


  // 現在のシートをsheetオブジェクトとして取得
  // Spreadsheet型ではなくSHEET型じゃないとgetRange(a, b, c, d)が使えないので注意
  var NOW_SHEET = ORDER_SHEET.getSheetByName(sheet_name);

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
  var num_text = message_elements[3].split('：');
  var num = num_text[1];
  var unit_text = message_elements[4].split('：');
  var unit = unit_text[1];
  var deadline_text = message_elements[5].split('：');
  var deadline = deadline_text[1];
  var file_text = message_elements[6].split('：');
  var file = file_text[1];
  var order_name_text = message_elements[7].split('：');
  var order_name = order_name_text[1];
  var note_text = message_elements[8].split('：');
  var note = note_text[1];
  if (message_elements.length > 9) {
    for (var j = 9; j < message_elements.length; j++) {
      note += '\n' + message_elements[j];
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
  var count_zero = ('00' + count).slice(-2);

  var order_number = 'L-' + monthZero + dayZero + count_zero;

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
  if (order_name != '') {
    userName = order_name;
  } else {
    userName = realName
  }

  // スプレッドシートに記録
  NOW_SHEET.appendRow([order_number, date, lineUserId, userName, realName, name, num, unit, '未対応', deadline, '', note]);

  // 完了メッセージを送る
  if (file == 'あり') {
    sendMessage(replyToken, '画像を送信してください\n(1枚まで送信可能です)');
  } else {
    sendMessage(replyToken, '注文を受け付けました');
  }

  // 日付順に並び替え（最新の情報がスプシ2行目にくるように）
  const numColumn = NOW_SHEET.getLastColumn(); // 最後列の列番号を取得
  const numRow = NOW_SHEET.getLastRow() - 1;  // 最後行の行番号を取得
  let dataRange = NOW_SHEET.getRange(2, 1, numRow, numColumn);
  dataRange.sort([{ column: 2, ascending: false }]);

  return ContentService.createTextOutput(JSON.stringify({ 'content': 'post ok' })).setMimeType(ContentService.MimeType.JSON);
}