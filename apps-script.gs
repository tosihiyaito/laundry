/** ランドリーアプリ用 データ保存スクリプト（Googleスプレッドシートに貼り付け） **/
const SHEET_NAME = 'records';
const HEADERS = ['日付','担当者','確認者','大','中','小','乾燥機代','ジャンボ','バス','フェイス','メモ','id','登録日時'];

function getSheet_() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET_NAME);
  if (!sh) sh = ss.insertSheet(SHEET_NAME);
  if (sh.getLastRow() === 0) sh.appendRow(HEADERS);
  return sh;
}
// 日付を必ず "YYYY-MM-DD" に正規化（SheetsがDate型に変換してしまった場合の保険）
function ymd_(v) {
  if (Object.prototype.toString.call(v) === '[object Date]') {
    return Utilities.formatDate(v, 'Asia/Tokyo', 'yyyy-MM-dd');
  }
  v = String(v || '');
  const m = v.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (m) return m[1] + '-' + m[2] + '-' + m[3];
  const d = new Date(v);
  if (!isNaN(d.getTime())) return Utilities.formatDate(d, 'Asia/Tokyo', 'yyyy-MM-dd');
  return v;
}
function recToRow_(r) {
  r = r || {}; const s = r.sizes || {}, t = r.towels || {};
  return [r.date||'', r.staff||'', r.confirmer||'',
    Number(s['大'])||0, Number(s['中'])||0, Number(s['小'])||0, Number(r.fee)||0,
    Number(t['ジャンボタオル'])||0, Number(t['バスタオル'])||0, Number(t['フェイスタオル'])||0,
    r.memo||'', r.id||'', r.createdAt||''];
}
function rowToRec_(row) {
  return { date:ymd_(row[0]), staff:String(row[1]||''), confirmer:String(row[2]||''),
    sizes:{'大':Number(row[3])||0,'中':Number(row[4])||0,'小':Number(row[5])||0}, fee:Number(row[6])||0,
    towels:{'ジャンボタオル':Number(row[7])||0,'バスタオル':Number(row[8])||0,'フェイスタオル':Number(row[9])||0},
    memo:String(row[10]||''), id:String(row[11]||''), createdAt:String(row[12]||'') };
}
function doGet(e) {
  const sh = getSheet_(); const last = sh.getLastRow();
  let records = [];
  if (last > 1) records = sh.getRange(2,1,last-1,HEADERS.length).getValues().filter(r => r[11]).map(rowToRec_);
  const out = JSON.stringify({ ok:true, records:records });
  const cb = e && e.parameter && e.parameter.callback;
  if (cb) return ContentService.createTextOutput(cb + '(' + out + ')').setMimeType(ContentService.MimeType.JAVASCRIPT);
  return ContentService.createTextOutput(out).setMimeType(ContentService.MimeType.JSON);
}
function doPost(e) {
  try {
    const records = (JSON.parse(e.postData.contents).records) || [];
    const sh = getSheet_(); const last = sh.getLastRow();
    if (last > 1) sh.getRange(2,1,last-1,HEADERS.length).clearContent();
    if (records.length) {
      // 日付(1列目)と登録日時(13列目)はテキスト保存し、Sheetsの日付自動変換を防ぐ
      sh.getRange(2,1,records.length,1).setNumberFormat('@');
      sh.getRange(2,HEADERS.length,records.length,1).setNumberFormat('@');
      sh.getRange(2,1,records.length,HEADERS.length).setValues(records.map(recToRow_));
    }
    return ContentService.createTextOutput(JSON.stringify({ ok:true, count:records.length })).setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({ ok:false, error:String(err) })).setMimeType(ContentService.MimeType.JSON);
  }
}
