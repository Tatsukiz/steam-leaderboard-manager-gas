/**
 * Steam Leaderboard Manager (Google Apps Script)
 *
 * Version: 1.0.0
 * License: MIT
 *
 * Manage Steam leaderboard entries from a Google Spreadsheet.
 * View entries, delete fraudulent scores, and register new entries
 * — all without any command-line tools.
 *
 * Unofficial tool. Not affiliated with or endorsed by Valve Corporation.
 *
 * Setup:
 * 1. Create a new Google Spreadsheet
 * 2. Extensions > Apps Script > paste this code and save
 * 3. Reload the spreadsheet — "Steam Leaderboard" menu appears
 * 4. Menu > "Setup (API Key / App ID)" to register your credentials
 * 5. Approve the Google authorization prompt on first run
 *
 * Note:
 * - The API key is stored in Script Properties. It is not visible to
 *   spreadsheet viewers, but anyone with script-editor access can see it.
 *   Be careful with sharing settings.
 * - Deletions are irreversible.
 * - Do not edit or delete row 1 of the "Entries" sheet, or cell B1 of the
 *   "Register Entries" sheet — the delete and bulk-register actions read the
 *   target leaderboard from them.
 */

var API_BASE = 'https://partner.steam-api.com/ISteamLeaderboards';

// ================================================================
// Translations / 翻訳
// ================================================================

var STRINGS_ = {
  en: {
    // Sheet names
    sheetBoards: 'Leaderboards',
    sheetEntries: 'Entries',
    sheetRegister: 'Register Entries',

    // Menu
    menuTitle: 'Steam Leaderboard',
    menuListBoards: 'Get Leaderboard List',
    menuFetchEntries: 'Get Entries',
    menuRegisterEntry: 'Register Entry (Single)',
    menuSetupRegister: 'Prepare Registration Sheet',
    menuBulkRegister: 'Bulk Register from Sheet',
    menuDeleteChecked: 'Delete Checked Rows',
    menuSetup: 'Setup (API Key / App ID)',
    menuLanguage: 'Language: English → 日本語',

    // Setup
    setupKeyTitle: 'Setup 1/2',
    setupKeyPrompt: 'Enter your Publisher API Key.\n(Leave empty to keep current setting)',
    setupAppIdTitle: 'Setup 2/2',
    setupAppIdPrompt: 'Enter your game\'s App ID.\n(Leave empty to keep current setting)',
    setupAppIdInvalid: 'App ID must be a number: {value}',
    setupDone: 'Settings saved. Start with "Get Leaderboard List".',

    // Config errors
    errNoConfig: 'API Key / App ID not configured. Run "Setup" from the menu first.',
    errInvalidKey: 'API key is invalid (403). Verify you are using a Publisher API key.',
    errApiHttp: 'API Error HTTP {code}\n{body}',
    errJsonParse: 'Could not parse API response as JSON:\n{body}',

    // Leaderboard list
    boardsHeaderId: 'ID',
    boardsHeaderName: 'Name',
    boardsHeaderEntries: 'Entries',
    boardsHeaderDisplayName: 'Display Name',
    boardsEmpty: 'No leaderboards found',
    boardsFetched: '{count} leaderboard(s) fetched.',

    // Entry fetch
    fetchPromptTitle1: 'Get Entries 1/2',
    fetchPromptName: 'Enter a leaderboard name or numeric ID.\n(Check the "Leaderboards" sheet for names)',
    fetchPromptTitle2: 'Get Entries 2/2',
    fetchPromptCount: 'How many entries to fetch? (e.g. 100)',
    entriesHeaderDelete: 'Delete',
    entriesHeaderRank: 'Rank',
    entriesHeaderScore: 'Score',
    entriesHeaderSteamId: 'SteamID64',
    entriesHeaderProfile: 'Profile URL',
    entriesHeaderMemo: 'Memo',
    entriesEmpty: 'No entries found',
    entriesFetched: '{count} entries fetched.\nCheck the "Delete" column for rows to remove,\nthen run "Delete Checked Rows" from the menu.',
    entriesLbLabel: 'Leaderboard:',
    entriesIdLabel: 'ID:',

    // Resolve
    resolveNotFound: 'Leaderboard "{name}" not found.\nAvailable: {list}',

    // Delete
    deleteNoSheet: '"{sheet}" sheet not found. Run "Get Entries" first.',
    deleteNoLbId: 'Leaderboard ID not found. Run "Get Entries" first.',
    deleteNoEntries: 'No entries found.',
    deleteBadSteamId: 'Row {row}: Invalid SteamID64 (must be 17 digits): {value}',
    deleteNoneChecked: 'No rows are checked. Check the "Delete" column for rows you want to remove.',
    deleteConfirmTitle: 'Confirm Deletion',
    deleteConfirmMsg: 'Deleting {count} entry/entries from leaderboard "{name}" (ID: {id}).\nThis action cannot be undone.\n\n{summary}\n\nProceed?',
    deleteSummaryItem: '  - {steamid} (Score: {score})',
    deleteCancelled: 'Cancelled. Nothing was deleted.',
    deleteCellDone: 'Deleted {time}',
    deleteCellFailed: 'Delete failed (result={code})',
    deleteCellError: 'Delete failed: {msg}',
    deleteResultMsg: 'Done: {ok} succeeded / {ng} failed',
    deleteFailedList: '\n\nFailed:\n{details}',
    deleteRefreshNote: '\n\nTo see updated rankings, run "Get Entries" again.',

    // Register (single)
    regPromptTitle1: 'Register Entry 1/3',
    regPromptName: 'Enter a leaderboard name or numeric ID.\n(Check the "Leaderboards" sheet for names)',
    regPromptTitle2: 'Register Entry 2/3',
    regPromptSteamId: 'Enter the SteamID64 (17-digit number).',
    regBadSteamId: 'Invalid SteamID64 (must be 17 digits): {value}',
    regPromptTitle3: 'Register Entry 3/3',
    regPromptScore: 'Enter the score (integer).\n\nDefault: KeepBest (only updates if the new score is better).\nTo force overwrite, prefix with "!" (e.g. !12345)',
    regBadScore: 'Score must be an integer: {value}',
    regConfirmTitle: 'Confirm Registration',
    regConfirmMsg: 'Registering to leaderboard "{name}" (ID: {id})\nSteamID64: {steamid}\nScore: {score}\nMethod: {method}\n\nProceed?',
    regCancelled: 'Cancelled.',
    regSuccess: 'Registration complete.\nSteamID64: {steamid}\nScore: {score}',
    regFailed: 'Registration failed (result={code})\n\nAPI response: {body}',
    regError: 'Registration failed: {msg}',

    // Register sheet setup
    regSheetHeader: 'Leaderboard:',
    regSheetIdLabel: 'ID:',
    regSheetColSteamId: 'SteamID64',
    regSheetColScore: 'Score',
    regSheetColResult: 'Result',
    regSheetReady: '"{sheet}" sheet is ready.\n\n' +
      '1. Enter a leaderboard name or numeric ID in cell B1.\n' +
      '2. Enter SteamID64 (column A) and Score (column B) from row 3.\n' +
      '3. Run "Bulk Register from Sheet" from the menu.\n\n' +
      '* Existing scores are only updated if the new score is better (KeepBest).',

    // Bulk register
    bulkNoSheet: '"{sheet}" sheet not found.\nRun "Prepare Registration Sheet" from the menu first.',
    bulkNoLbName: 'Enter a leaderboard name or numeric ID in cell B1.',
    bulkNoEntries: 'No entries found. Enter SteamID64 and Score from row 3.',
    bulkBadSteamId: 'Row {row}: Invalid SteamID64 (must be 17 digits): {value}',
    bulkBadScore: 'Row {row}: Score must be an integer: {value}',
    bulkNoTargets: 'No entries to register.',
    bulkConfirmTitle: 'Confirm Bulk Registration',
    bulkConfirmMsg: 'Registering {count} entry/entries to leaderboard "{name}" (ID: {id}).\n\n' +
      '* Existing scores are only updated if the new score is better (KeepBest).\n\nProceed?',
    bulkCancelled: 'Cancelled. Nothing was registered.',
    bulkCellDone: 'Registered {time}',
    bulkCellFailed: 'Failed (result={code})',
    bulkCellError: 'Failed: {msg}',
    bulkResultMsg: 'Done: {ok} succeeded / {ng} failed',
    bulkFailedList: '\n\nFailed:\n{details}',

    // Language toggle
    langSwitched: 'Language switched to English.\nPlease reload the spreadsheet to update sheet names.'
  },

  ja: {
    // Sheet names
    sheetBoards: 'リーダーボード一覧',
    sheetEntries: 'エントリ',
    sheetRegister: 'エントリ登録',

    // Menu
    menuTitle: 'Steamリーダーボード',
    menuListBoards: 'リーダーボード一覧を取得',
    menuFetchEntries: 'エントリを取得',
    menuRegisterEntry: 'エントリを登録(1件)',
    menuSetupRegister: '登録シートを準備',
    menuBulkRegister: 'シートから一括登録',
    menuDeleteChecked: 'チェックした行を削除',
    menuSetup: '初期設定(APIキー/AppID)',
    menuLanguage: '言語: 日本語 → English',

    // Setup
    setupKeyTitle: '初期設定 1/2',
    setupKeyPrompt: 'パブリッシャーAPIキーを入力してください。\n(現在の設定を変えない場合は空のままOK)',
    setupAppIdTitle: '初期設定 2/2',
    setupAppIdPrompt: 'ゲームのAppIDを入力してください。\n(現在の設定を変えない場合は空のままOK)',
    setupAppIdInvalid: 'AppIDは数値で入力してください: {value}',
    setupDone: '設定を保存しました。「リーダーボード一覧を取得」から始めてください。',

    // Config errors
    errNoConfig: 'APIキー/AppIDが未設定です。メニューの「初期設定」を先に実行してください。',
    errInvalidKey: 'APIキーが無効です(403)。パブリッシャーAPIキーか確認してください。',
    errApiHttp: 'APIエラー HTTP {code}\n{body}',
    errJsonParse: '応答をJSONとして解釈できませんでした:\n{body}',

    // Leaderboard list
    boardsHeaderId: 'ID',
    boardsHeaderName: '名前',
    boardsHeaderEntries: 'エントリ数',
    boardsHeaderDisplayName: '表示名',
    boardsEmpty: 'リーダーボードがありません',
    boardsFetched: '{count}件のリーダーボードを取得しました。',

    // Entry fetch
    fetchPromptTitle1: 'エントリ取得 1/2',
    fetchPromptName: 'リーダーボード名または数値IDを入力してください。\n(「リーダーボード一覧」シートで確認できます)',
    fetchPromptTitle2: 'エントリ取得 2/2',
    fetchPromptCount: '取得する件数を入力してください(例: 100)',
    entriesHeaderDelete: '削除する',
    entriesHeaderRank: '順位',
    entriesHeaderScore: 'スコア',
    entriesHeaderSteamId: 'SteamID64',
    entriesHeaderProfile: 'プロフィールURL',
    entriesHeaderMemo: 'メモ',
    entriesEmpty: 'エントリがありません',
    entriesFetched: '{count}件のエントリを取得しました。\n削除したい行の「削除する」にチェックを入れて、\nメニューの「チェックした行を削除」を実行してください。',
    entriesLbLabel: 'リーダーボード:',
    entriesIdLabel: 'ID:',

    // Resolve
    resolveNotFound: 'リーダーボード「{name}」が見つかりません。\n存在するもの: {list}',

    // Delete
    deleteNoSheet: '「{sheet}」シートがありません。先に「エントリを取得」を実行してください。',
    deleteNoLbId: 'リーダーボードIDが見つかりません。先に「エントリを取得」を実行してください。',
    deleteNoEntries: 'エントリがありません。',
    deleteBadSteamId: '行 {row} のSteamID64が不正です(17桁の数字である必要があります): {value}',
    deleteNoneChecked: 'チェックされた行がありません。削除したい行の「削除する」列にチェックを入れてください。',
    deleteConfirmTitle: '削除の確認',
    deleteConfirmMsg: 'リーダーボード「{name}」(ID: {id}) から\n以下の {count} 件を削除します。この操作は取り消せません。\n\n{summary}\n\nよろしいですか?',
    deleteSummaryItem: '  ・{steamid} (スコア: {score})',
    deleteCancelled: 'キャンセルしました。何も削除されていません。',
    deleteCellDone: '削除済み {time}',
    deleteCellFailed: '削除失敗 (result={code})',
    deleteCellError: '削除失敗: {msg}',
    deleteResultMsg: '完了: 成功 {ok}件 / 失敗 {ng}件',
    deleteFailedList: '\n\n失敗:\n{details}',
    deleteRefreshNote: '\n\n※最新の順位を確認するには、再度「エントリを取得」を実行してください。',

    // Register (single)
    regPromptTitle1: 'エントリ登録 1/3',
    regPromptName: 'リーダーボード名または数値IDを入力してください。\n(「リーダーボード一覧」シートで確認できます)',
    regPromptTitle2: 'エントリ登録 2/3',
    regPromptSteamId: 'SteamID64を入力してください(17桁の数字)。',
    regBadSteamId: 'SteamID64が不正です(17桁の数字である必要があります): {value}',
    regPromptTitle3: 'エントリ登録 3/3',
    regPromptScore: 'スコアを入力してください(整数)。\n\n' +
      '※デフォルトはKeepBest(現スコアより良い場合のみ更新)です。\n' +
      '強制上書きする場合は先頭に「!」を付けてください(例: !12345)',
    regBadScore: 'スコアは整数で入力してください: {value}',
    regConfirmTitle: '登録の確認',
    regConfirmMsg: 'リーダーボード「{name}」(ID: {id}) に\nSteamID64: {steamid}\nスコア: {score}\n更新方式: {method}\n\n登録しますか?',
    regCancelled: 'キャンセルしました。',
    regSuccess: '登録が完了しました。\nSteamID64: {steamid}\nスコア: {score}',
    regFailed: '登録失敗 (result={code})\n\nAPIの応答: {body}',
    regError: '登録失敗: {msg}',

    // Register sheet setup
    regSheetHeader: 'リーダーボード:',
    regSheetIdLabel: 'ID:',
    regSheetColSteamId: 'SteamID64',
    regSheetColScore: 'スコア',
    regSheetColResult: '結果',
    regSheetReady: '「{sheet}」シートを準備しました。\n\n' +
      '① B1セルにリーダーボード名または数値IDを入力してください。\n' +
      '② 3行目以降にSteamID64(A列)とスコア(B列)を入力してください。\n' +
      '③ 入力後にメニューの「シートから一括登録」を実行してください。\n\n' +
      '※既存スコアより悪い場合はスキップされます(KeepBest)。',

    // Bulk register
    bulkNoSheet: '「{sheet}」シートがありません。\n先にメニューの「登録シートを準備」を実行してください。',
    bulkNoLbName: 'B1セルにリーダーボード名または数値IDを入力してください。',
    bulkNoEntries: 'エントリがありません。3行目以降にSteamID64とスコアを入力してください。',
    bulkBadSteamId: '行 {row} のSteamID64が不正です(17桁の数字である必要があります): {value}',
    bulkBadScore: '行 {row} のスコアが不正です(整数である必要があります): {value}',
    bulkNoTargets: '登録対象のエントリがありません。',
    bulkConfirmTitle: '一括登録の確認',
    bulkConfirmMsg: 'リーダーボード「{name}」(ID: {id}) に\n{count}件のエントリを登録します。\n\n' +
      '※既存スコアより悪い場合はスキップされます(KeepBest)。\n\nよろしいですか?',
    bulkCancelled: 'キャンセルしました。何も登録されていません。',
    bulkCellDone: '登録済み {time}',
    bulkCellFailed: '登録失敗 (result={code})',
    bulkCellError: '登録失敗: {msg}',
    bulkResultMsg: '完了: 成功 {ok}件 / 失敗 {ng}件',
    bulkFailedList: '\n\n失敗:\n{details}',

    // Language toggle
    langSwitched: '言語を日本語に切り替えました。\nシート名を更新するにはスプレッドシートを再読み込みしてください。'
  }
};

// ================================================================
// i18n Helpers / i18nヘルパー
// ================================================================

function getLang_() {
  return PropertiesService.getScriptProperties().getProperty('LANG') || 'en';
}

function t_(key, replacements) {
  var lang = getLang_();
  var s = (STRINGS_[lang] && STRINGS_[lang][key]) || STRINGS_.en[key] || key;
  if (replacements) {
    Object.keys(replacements).forEach(function (k) {
      s = s.replace(new RegExp('\\{' + k + '\\}', 'g'), String(replacements[k]));
    });
  }
  return s;
}

function SHEET_BOARDS_() { return t_('sheetBoards'); }
function SHEET_ENTRIES_() { return t_('sheetEntries'); }
function SHEET_REGISTER_() { return t_('sheetRegister'); }

// ================================================================
// Menu / メニュー
// ================================================================

function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu(t_('menuTitle'))
    .addItem(t_('menuListBoards'), 'listLeaderboards')
    .addItem(t_('menuFetchEntries'), 'fetchEntries')
    .addSeparator()
    .addItem(t_('menuRegisterEntry'), 'registerEntry')
    .addItem(t_('menuSetupRegister'), 'setupRegisterSheet')
    .addItem(t_('menuBulkRegister'), 'bulkRegisterEntries')
    .addSeparator()
    .addItem(t_('menuDeleteChecked'), 'deleteCheckedEntries')
    .addSeparator()
    .addItem(t_('menuLanguage'), 'toggleLanguage')
    .addItem(t_('menuSetup'), 'setupConfig')
    .addToUi();
}

// ================================================================
// Language Toggle / 言語切替
// ================================================================

function toggleLanguage() {
  var props = PropertiesService.getScriptProperties();
  var current = props.getProperty('LANG') || 'en';
  var next = (current === 'ja') ? 'en' : 'ja';
  props.setProperty('LANG', next);
  onOpen();
  SpreadsheetApp.getUi().alert(
    next === 'ja'
      ? STRINGS_.ja.langSwitched
      : STRINGS_.en.langSwitched
  );
}

// ================================================================
// Setup / 設定
// ================================================================

function setupConfig() {
  var ui = SpreadsheetApp.getUi();
  var props = PropertiesService.getScriptProperties();

  var keyRes = ui.prompt(t_('setupKeyTitle'), t_('setupKeyPrompt'), ui.ButtonSet.OK_CANCEL);
  if (keyRes.getSelectedButton() !== ui.Button.OK) return;
  var key = keyRes.getResponseText().trim();
  if (key) props.setProperty('STEAM_KEY', key);

  var appidRes = ui.prompt(t_('setupAppIdTitle'), t_('setupAppIdPrompt'), ui.ButtonSet.OK_CANCEL);
  if (appidRes.getSelectedButton() !== ui.Button.OK) return;
  var appid = appidRes.getResponseText().trim();
  if (appid) {
    if (!/^\d+$/.test(appid)) {
      ui.alert(t_('setupAppIdInvalid', { value: appid }));
      return;
    }
    props.setProperty('STEAM_APPID', appid);
  }

  ui.alert(t_('setupDone'));
}

function getConfig_() {
  var props = PropertiesService.getScriptProperties();
  var key = props.getProperty('STEAM_KEY');
  var appid = props.getProperty('STEAM_APPID');
  if (!key || !appid) {
    throw new Error(t_('errNoConfig'));
  }
  return { key: key, appid: appid };
}

// ================================================================
// API Calls / API呼び出し
// ================================================================

function apiGet_(path, params) {
  var qs = Object.keys(params).map(function (k) {
    return encodeURIComponent(k) + '=' + encodeURIComponent(params[k]);
  }).join('&');
  var res = UrlFetchApp.fetch(API_BASE + '/' + path + '?' + qs, {
    method: 'get',
    muteHttpExceptions: true
  });
  return handleResponse_(res);
}

function apiPost_(path, params) {
  var res = UrlFetchApp.fetch(API_BASE + '/' + path, {
    method: 'post',
    payload: params,
    muteHttpExceptions: true
  });
  return handleResponse_(res);
}

function handleResponse_(res) {
  var code = res.getResponseCode();
  var body = res.getContentText();
  if (code === 403) {
    throw new Error(t_('errInvalidKey'));
  }
  if (code < 200 || code >= 300) {
    throw new Error(t_('errApiHttp', { code: code, body: body.slice(0, 300) }));
  }
  try {
    return JSON.parse(body);
  } catch (e) {
    throw new Error(t_('errJsonParse', { body: body.slice(0, 300) }));
  }
}

// ================================================================
// Leaderboard List / リーダーボード一覧
// ================================================================

function listLeaderboards() {
  var cfg = getConfig_();
  var data = apiGet_('GetLeaderboardsForGame/v2/', { key: cfg.key, appid: cfg.appid });
  var resp = data.response || {};
  var boards = resp.leaderboards || resp.leaderBoards || [];

  var sheet = getOrCreateSheet_(SHEET_BOARDS_());
  sheet.clear();
  sheet.getRange(1, 1, 1, 4)
    .setValues([[t_('boardsHeaderId'), t_('boardsHeaderName'), t_('boardsHeaderEntries'), t_('boardsHeaderDisplayName')]])
    .setFontWeight('bold')
    .setBackground('#e8eaf6');

  if (boards.length === 0) {
    sheet.getRange(2, 1).setValue(t_('boardsEmpty'));
    return;
  }

  var rows = boards.map(function (b) {
    return [b.id || '', b.name || '', b.entries || 0, b.display_name || b.displayName || ''];
  });
  sheet.getRange(2, 1, rows.length, 4).setValues(rows);
  sheet.autoResizeColumns(1, 4);
  sheet.activate();
  SpreadsheetApp.getUi().alert(t_('boardsFetched', { count: boards.length }));
}

// ================================================================
// Get Entries / エントリ取得
// ================================================================

function fetchEntries() {
  var ui = SpreadsheetApp.getUi();
  var cfg = getConfig_();

  var nameRes = ui.prompt(t_('fetchPromptTitle1'), t_('fetchPromptName'), ui.ButtonSet.OK_CANCEL);
  if (nameRes.getSelectedButton() !== ui.Button.OK) return;
  var nameOrId = nameRes.getResponseText().trim();
  if (!nameOrId) return;

  var topRes = ui.prompt(t_('fetchPromptTitle2'), t_('fetchPromptCount'), ui.ButtonSet.OK_CANCEL);
  if (topRes.getSelectedButton() !== ui.Button.OK) return;
  var top = parseInt(topRes.getResponseText().trim(), 10) || 50;

  var board = resolveLeaderboard_(cfg, nameOrId);

  var data = apiGet_('GetLeaderboardEntries/v1/', {
    key: cfg.key,
    appid: cfg.appid,
    leaderboardid: board.id,
    rangestart: 0,
    rangeend: top,
    datarequest: 'RequestGlobal'
  });

  var info = data.leaderboardEntryInformation || {};
  var entries = info.leaderboardEntries || (data.response || {}).entries || [];

  var sheet = getOrCreateSheet_(SHEET_ENTRIES_());
  sheet.clear();
  // Header + metadata (record leaderboard ID for deletion reference)
  sheet.getRange(1, 1, 1, 6)
    .setValues([[t_('entriesLbLabel'), board.name, t_('entriesIdLabel'), board.id, '', '']]);
  sheet.getRange(2, 1, 1, 6)
    .setValues([[t_('entriesHeaderDelete'), t_('entriesHeaderRank'), t_('entriesHeaderScore'),
                 t_('entriesHeaderSteamId'), t_('entriesHeaderProfile'), t_('entriesHeaderMemo')]])
    .setFontWeight('bold')
    .setBackground('#fce4ec');

  if (entries.length === 0) {
    sheet.getRange(3, 1).setValue(t_('entriesEmpty'));
    sheet.activate();
    return;
  }

  var rows = entries.map(function (e) {
    var steamid = String(e.steamID || e.steamid || '');
    return [
      false,
      e.rank || e.globalRank || '',
      e.score != null ? e.score : '',
      steamid,
      steamid ? 'https://steamcommunity.com/profiles/' + steamid : '',
      ''
    ];
  });
  sheet.getRange(3, 1, rows.length, 6).setValues(rows);
  // Format SteamID64 as text to preserve 17-digit precision
  sheet.getRange(3, 4, rows.length, 1).setNumberFormat('@');
  sheet.getRange(3, 4, rows.length, 1).setValues(rows.map(function (r) { return [r[3]]; }));
  // Insert checkboxes
  sheet.getRange(3, 1, rows.length, 1).insertCheckboxes();
  sheet.autoResizeColumns(1, 6);
  sheet.activate();
  ui.alert(t_('entriesFetched', { count: entries.length }));
}

function resolveLeaderboard_(cfg, nameOrId) {
  var data = apiGet_('GetLeaderboardsForGame/v2/', { key: cfg.key, appid: cfg.appid });
  var resp = data.response || {};
  var boards = resp.leaderboards || resp.leaderBoards || [];

  if (/^\d+$/.test(nameOrId)) {
    var idNum = parseInt(nameOrId, 10);
    for (var i = 0; i < boards.length; i++) {
      if (parseInt(boards[i].id, 10) === idNum) {
        return { id: idNum, name: boards[i].name || String(idNum) };
      }
    }
    return { id: idNum, name: String(idNum) };
  }

  for (var j = 0; j < boards.length; j++) {
    if (String(boards[j].name).toLowerCase() === nameOrId.toLowerCase()) {
      return { id: parseInt(boards[j].id, 10), name: boards[j].name };
    }
  }
  var names = boards.map(function (b) { return b.name; }).join(', ') || '(none)';
  throw new Error(t_('resolveNotFound', { name: nameOrId, list: names }));
}

// ================================================================
// Delete Entries / エントリ削除
// ================================================================

function deleteCheckedEntries() {
  var ui = SpreadsheetApp.getUi();
  var cfg = getConfig_();
  var sheetName = SHEET_ENTRIES_();

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) {
    ui.alert(t_('deleteNoSheet', { sheet: sheetName }));
    return;
  }

  var lbId = sheet.getRange(1, 4).getValue();
  var lbName = sheet.getRange(1, 2).getValue();
  if (!lbId) {
    ui.alert(t_('deleteNoLbId'));
    return;
  }

  var lastRow = sheet.getLastRow();
  if (lastRow < 3) {
    ui.alert(t_('deleteNoEntries'));
    return;
  }

  var values = sheet.getRange(3, 1, lastRow - 2, 4).getValues();
  var targets = [];
  for (var i = 0; i < values.length; i++) {
    if (values[i][0] === true) {
      var steamid = String(values[i][3]).trim();
      if (!/^\d{17}$/.test(steamid)) {
        ui.alert(t_('deleteBadSteamId', { row: i + 3, value: steamid }));
        return;
      }
      targets.push({ row: i + 3, steamid: steamid, score: values[i][2] });
    }
  }

  if (targets.length === 0) {
    ui.alert(t_('deleteNoneChecked'));
    return;
  }

  var summary = targets.map(function (t) {
    return t_('deleteSummaryItem', { steamid: t.steamid, score: t.score });
  }).join('\n');
  var confirm = ui.alert(t_('deleteConfirmTitle'),
    t_('deleteConfirmMsg', { count: targets.length, name: lbName, id: lbId, summary: summary }),
    ui.ButtonSet.YES_NO);
  if (confirm !== ui.Button.YES) {
    ui.alert(t_('deleteCancelled'));
    return;
  }

  var ok = 0, ng = 0, ngDetails = [];
  for (var k = 0; k < targets.length; k++) {
    var tgt = targets[k];
    try {
      var result = apiPost_('DeleteLeaderboardScore/v1/', {
        key: cfg.key,
        appid: cfg.appid,
        leaderboardid: String(lbId),
        steamid: tgt.steamid
      });
      var r = result.result || result;
      var code = (r && typeof r === 'object') ? r.result : null;
      if (code === 1 || code == null) {
        ok++;
        sheet.getRange(tgt.row, 6).setValue(t_('deleteCellDone', { time: new Date().toLocaleString() }));
        sheet.getRange(tgt.row, 1, 1, 5).setBackground('#eeeeee').setFontLine('line-through');
      } else {
        ng++;
        ngDetails.push(tgt.steamid + ' (result=' + code + ')');
        sheet.getRange(tgt.row, 6).setValue(t_('deleteCellFailed', { code: code }));
      }
    } catch (e) {
      ng++;
      ngDetails.push(tgt.steamid + ' (' + e.message + ')');
      sheet.getRange(tgt.row, 6).setValue(t_('deleteCellError', { msg: e.message }));
    }
    Utilities.sleep(200); // Throttle consecutive API requests
  }

  var msg = t_('deleteResultMsg', { ok: ok, ng: ng });
  if (ng > 0) msg += t_('deleteFailedList', { details: ngDetails.join('\n') });
  msg += t_('deleteRefreshNote');
  ui.alert(msg);
}

// ================================================================
// Register Entry (Single) / エントリ登録（単体）
// ================================================================

function registerEntry() {
  var ui = SpreadsheetApp.getUi();
  var cfg = getConfig_();

  var nameRes = ui.prompt(t_('regPromptTitle1'), t_('regPromptName'), ui.ButtonSet.OK_CANCEL);
  if (nameRes.getSelectedButton() !== ui.Button.OK) return;
  var nameOrId = nameRes.getResponseText().trim();
  if (!nameOrId) return;

  var steamidRes = ui.prompt(t_('regPromptTitle2'), t_('regPromptSteamId'), ui.ButtonSet.OK_CANCEL);
  if (steamidRes.getSelectedButton() !== ui.Button.OK) return;
  var steamid = steamidRes.getResponseText().trim();
  if (!/^\d{17}$/.test(steamid)) {
    ui.alert(t_('regBadSteamId', { value: steamid }));
    return;
  }

  var scoreRes = ui.prompt(t_('regPromptTitle3'), t_('regPromptScore'), ui.ButtonSet.OK_CANCEL);
  if (scoreRes.getSelectedButton() !== ui.Button.OK) return;
  var scoreText = scoreRes.getResponseText().trim();
  var forceUpdate = scoreText.charAt(0) === '!';
  if (forceUpdate) scoreText = scoreText.slice(1);
  var score = parseInt(scoreText, 10);
  if (isNaN(score)) {
    ui.alert(t_('regBadScore', { value: scoreText }));
    return;
  }

  var board = resolveLeaderboard_(cfg, nameOrId);
  var scoreMethod = forceUpdate ? 'ForceUpdate' : 'KeepBest';

  var confirm = ui.alert(t_('regConfirmTitle'),
    t_('regConfirmMsg', { name: board.name, id: board.id, steamid: steamid, score: score, method: scoreMethod }),
    ui.ButtonSet.YES_NO);
  if (confirm !== ui.Button.YES) {
    ui.alert(t_('regCancelled'));
    return;
  }

  try {
    var result = apiPost_('SetLeaderboardScore/v1/', {
      key: cfg.key,
      appid: cfg.appid,
      leaderboardid: String(board.id),
      steamid: steamid,
      score: String(score),
      scoremethod: scoreMethod
    });
    var r = result.result || result;
    var code = (r && typeof r === 'object') ? r.result : null;
    if (code === 1 || code == null) {
      ui.alert(t_('regSuccess', { steamid: steamid, score: score }));
    } else {
      ui.alert(t_('regFailed', { code: code, body: JSON.stringify(result).slice(0, 200) }));
    }
  } catch (e) {
    ui.alert(t_('regError', { msg: e.message }));
  }
}

// ================================================================
// Registration Sheet Setup / 登録シート準備
// ================================================================

function setupRegisterSheet() {
  var sheetName = SHEET_REGISTER_();
  var sheet = getOrCreateSheet_(sheetName);
  if (sheet.getLastRow() === 0 || sheet.getRange(1, 1).getValue() !== t_('regSheetHeader')) {
    sheet.clear();
    sheet.getRange(1, 1, 1, 4)
      .setValues([[t_('regSheetHeader'), '', t_('regSheetIdLabel'), '']]);
    sheet.getRange(1, 1, 1, 4)
      .setFontWeight('bold');
    sheet.getRange(2, 1, 1, 3)
      .setValues([[t_('regSheetColSteamId'), t_('regSheetColScore'), t_('regSheetColResult')]])
      .setFontWeight('bold')
      .setBackground('#e8f5e9');
    // Format SteamID64 column as text to preserve 17-digit precision
    sheet.getRange(3, 1, 100, 1).setNumberFormat('@');
    sheet.autoResizeColumns(1, 3);
  }
  sheet.activate();
  SpreadsheetApp.getUi().alert(t_('regSheetReady', { sheet: sheetName }));
}

// ================================================================
// Bulk Register / 一括登録
// ================================================================

function bulkRegisterEntries() {
  var ui = SpreadsheetApp.getUi();
  var cfg = getConfig_();
  var sheetName = SHEET_REGISTER_();

  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
  if (!sheet) {
    ui.alert(t_('bulkNoSheet', { sheet: sheetName }));
    return;
  }

  var lbNameOrId = String(sheet.getRange(1, 2).getValue()).trim();
  if (!lbNameOrId) {
    ui.alert(t_('bulkNoLbName'));
    return;
  }

  var lastRow = sheet.getLastRow();
  if (lastRow < 3) {
    ui.alert(t_('bulkNoEntries'));
    return;
  }

  var values = sheet.getRange(3, 1, lastRow - 2, 2).getValues();
  var targets = [];
  for (var i = 0; i < values.length; i++) {
    var steamid = String(values[i][0]).trim();
    var scoreVal = values[i][1];
    // Skip empty rows
    if (!steamid && (scoreVal === '' || scoreVal == null)) continue;
    if (!/^\d{17}$/.test(steamid)) {
      ui.alert(t_('bulkBadSteamId', { row: i + 3, value: steamid }));
      return;
    }
    var score = parseInt(String(scoreVal), 10);
    if (isNaN(score)) {
      ui.alert(t_('bulkBadScore', { row: i + 3, value: scoreVal }));
      return;
    }
    targets.push({ row: i + 3, steamid: steamid, score: score });
  }

  if (targets.length === 0) {
    ui.alert(t_('bulkNoTargets'));
    return;
  }

  var board = resolveLeaderboard_(cfg, lbNameOrId);
  sheet.getRange(1, 4).setValue(board.id);

  var confirm = ui.alert(t_('bulkConfirmTitle'),
    t_('bulkConfirmMsg', { count: targets.length, name: board.name, id: board.id }),
    ui.ButtonSet.YES_NO);
  if (confirm !== ui.Button.YES) {
    ui.alert(t_('bulkCancelled'));
    return;
  }

  var ok = 0, ng = 0, ngDetails = [];
  for (var k = 0; k < targets.length; k++) {
    var tgt = targets[k];
    try {
      var result = apiPost_('SetLeaderboardScore/v1/', {
        key: cfg.key,
        appid: cfg.appid,
        leaderboardid: String(board.id),
        steamid: tgt.steamid,
        score: String(tgt.score),
        scoremethod: 'KeepBest'
      });
      var r = result.result || result;
      var code = (r && typeof r === 'object') ? r.result : null;
      if (code === 1 || code == null) {
        ok++;
        sheet.getRange(tgt.row, 3).setValue(t_('bulkCellDone', { time: new Date().toLocaleString() }));
        sheet.getRange(tgt.row, 1, 1, 2).setBackground('#c8e6c9');
      } else {
        ng++;
        ngDetails.push(tgt.steamid + ' (result=' + code + ')');
        sheet.getRange(tgt.row, 3).setValue(t_('bulkCellFailed', { code: code }));
        sheet.getRange(tgt.row, 1, 1, 2).setBackground('#ffcdd2');
      }
    } catch (e) {
      ng++;
      ngDetails.push(tgt.steamid + ' (' + e.message + ')');
      sheet.getRange(tgt.row, 3).setValue(t_('bulkCellError', { msg: e.message }));
      sheet.getRange(tgt.row, 1, 1, 2).setBackground('#ffcdd2');
    }
    Utilities.sleep(200); // Throttle consecutive API requests
  }

  var msg = t_('bulkResultMsg', { ok: ok, ng: ng });
  if (ng > 0) msg += t_('bulkFailedList', { details: ngDetails.join('\n') });
  ui.alert(msg);
}

// ================================================================
// Utilities / ユーティリティ
// ================================================================

/**
 * Get or create a sheet by name.
 * When switching languages, if a sheet exists under the other language's name,
 * it will be renamed to match the current language.
 */
function getOrCreateSheet_(name) {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(name);
  if (sheet) return sheet;

  // Check if a sheet exists under the other language's name and rename it
  var lang = getLang_();
  var otherLang = (lang === 'ja') ? 'en' : 'ja';
  var sheetNameKeys = ['sheetBoards', 'sheetEntries', 'sheetRegister'];
  for (var i = 0; i < sheetNameKeys.length; i++) {
    if (STRINGS_[lang][sheetNameKeys[i]] === name) {
      var otherName = STRINGS_[otherLang][sheetNameKeys[i]];
      var otherSheet = ss.getSheetByName(otherName);
      if (otherSheet) {
        otherSheet.setName(name);
        return otherSheet;
      }
      break;
    }
  }

  return ss.insertSheet(name);
}
