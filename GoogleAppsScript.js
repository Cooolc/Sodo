/**
 * ====================================================================
 * MÃ GOOGLE APPS SCRIPT KẾT NỐI SƠ ĐỒ TIỆC CƯỚI VỚI GOOGLE SHEETS
 * ====================================================================
 * 
 * HƯỚNG DẪN THIẾT LẬP (MẤT KHOẢNG 3 - 5 PHÚT):
 * --------------------------------------------------------------------
 * 1. Mở một file Google Sheet mới trên Google Drive (hoặc file có sẵn).
 * 2. Đặt tên file là: "SoDo_TiecCuoi_DuLieu".
 * 3. Trên thanh menu Google Sheet, chọn:
 *      Tiện ích mở rộng (Extensions) > Apps Script.
 * 4. Xóa toàn bộ nội dung trong cửa sổ mã (nếu có) và DÁN TOÀN BỘ đoạn code này vào.
 * 5. Bấm nút "Lưu" (biểu tượng đĩa mềm 💾 hoặc Ctrl + S).
 * 6. Bấm nút màu xanh "Triển khai" (Deploy) ở góc trên bên phải:
 *      -> Chọn "Quản lý bản triển khai mới" (New deployment).
 *      -> Bấm biểu tượng bánh răng ⚙️ bên cạnh "Chọn loại", chọn: "Ứng dụng web" (Web app).
 *      -> Phần "Mô tả" (Description): ghi "Sơ đồ tiệc cưới API".
 *      -> Phần "Thực thi dưới dạng" (Execute as): Chọn "Tôi" (Me - email của bạn).
 *      -> Phần "Ai có quyền truy cập" (Who has access): Chọn "Bất kỳ ai" (Anyone).
 *         (Quan trọng: phải chọn "Bất kỳ ai" để web có thể đọc/ghi dữ liệu mà không bắt đăng nhập tài khoản Google).
 *      -> Bấm "Triển khai" (Deploy).
 * 7. Cấp quyền truy cập nếu Google hỏi xác nhận.
 * 8. Copy đường link "URL ứng dụng web" (có dạng: https://script.google.com/macros/s/.../exec).
 * 9. Mở trang web Sơ Đồ Tiệc Cưới -> Bấm nút "🔄 Đồng Bộ Dữ Liệu" -> Dán link này vào ô "Link Web App Google Sheet" -> Bấm "Lưu Kết Nối"!
 * ====================================================================
 */

// Mã PIN quản trị (Khớp với mã PIN trên Website)
const ADMIN_PIN = "12345";

// Tên 2 Sheet lưu trữ
const SHEET_BAN = "DanhSachBan";
const SHEET_KHACH = "DanhSachKhach";

function doGet(e) {
  return handleRequest(e);
}

function doPost(e) {
  return handleRequest(e);
}

function handleRequest(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    initSheets(ss);

    const params = e && e.parameter ? e.parameter : {};
    let postData = {};
    if (e && e.postData && e.postData.contents) {
      try {
        postData = JSON.parse(e.postData.contents);
      } catch (err) {
        postData = {};
      }
    }

    const action = params.action || postData.action || "get";
    const pin = params.pin || postData.pin || "";

    // 1. ACTION: GET (Đọc toàn bộ dữ liệu bàn & khách gửi về cho Website)
    if (action === "get") {
      const data = getAllData(ss);
      return createJsonResponse({ success: true, data: data });
    }

    // Xác thực mã PIN trước khi cho phép ghi dữ liệu
    if (pin !== ADMIN_PIN) {
      return createJsonResponse({ 
        success: false, 
        error: "Mã PIN không chính xác! Không có quyền chỉnh sửa." 
      });
    }

    // 2. ACTION: SAVE hoặc INIT (Lưu toàn bộ danh sách bàn & khách từ Web lên Google Sheet)
    if (action === "save" || action === "init" || action === "update") {
      let tables = postData.data;
      if (!tables && params.data) {
        try { tables = JSON.parse(params.data); } catch (err) {}
      }

      if (tables && Array.isArray(tables) && tables.length > 0) {
        saveAllData(ss, tables);
        return createJsonResponse({ 
          success: true, 
          message: "Đã cập nhật dữ liệu thành công lên Google Sheet!" 
        });
      }
      return createJsonResponse({ success: false, error: "Dữ liệu bàn không hợp lệ!" });
    }

    return createJsonResponse({ success: false, error: "Lệnh không hợp lệ!" });
  } catch (err) {
    return createJsonResponse({ success: false, error: "Lỗi máy chủ: " + err.toString() });
  }
}

function createJsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

// Khởi tạo tiêu đề các Sheet nếu chưa có
function initSheets(ss) {
  let sheetBan = ss.getSheetByName(SHEET_BAN);
  if (!sheetBan) {
    sheetBan = ss.insertSheet(SHEET_BAN);
    sheetBan.appendRow([
      "Mã Bàn (ID)", 
      "Số Bàn", 
      "Nhà", 
      "Tên Đại Diện / Phân Loại", 
      "Tên Nhóm Chi Tiết", 
      "Màu Sắc", 
      "Vị Trí & Đặc Điểm", 
      "Số Khách Đang Xếp", 
      "Cập Nhật Lúc"
    ]);
    sheetBan.getRange(1, 1, 1, 9)
      .setBackground("#0f172a")
      .setFontColor("#f59e0b")
      .setFontWeight("bold")
      .setHorizontalAlignment("center");
    sheetBan.setFrozenRows(1);
  }

  let sheetKhach = ss.getSheetByName(SHEET_KHACH);
  if (!sheetKhach) {
    sheetKhach = ss.insertSheet(SHEET_KHACH);
    sheetKhach.appendRow([
      "Mã Bàn (ID)", 
      "Số Bàn", 
      "Nhà", 
      "Tên Khách / Đại Diện Gia Đình", 
      "Số Lượng (Người)", 
      "Ghi Chú", 
      "Cập Nhật Lúc"
    ]);
    sheetKhach.getRange(1, 1, 1, 7)
      .setBackground("#0f172a")
      .setFontColor("#38bdf8")
      .setFontWeight("bold")
      .setHorizontalAlignment("center");
    sheetKhach.setFrozenRows(1);
  }
}

// Đọc toàn bộ dữ liệu từ Google Sheet ra dạng mảng JSON cho website
function getAllData(ss) {
  const sheetBan = ss.getSheetByName(SHEET_BAN);
  const sheetKhach = ss.getSheetByName(SHEET_KHACH);
  if (!sheetBan || !sheetKhach) return [];

  // 1. Đọc Sheet Khách
  const khachRows = sheetKhach.getDataRange().getValues();
  const guestsByTable = {};
  for (let i = 1; i < khachRows.length; i++) {
    const row = khachRows[i];
    const tableId = String(row[0] || "").trim();
    if (!tableId) continue;
    if (!guestsByTable[tableId]) guestsByTable[tableId] = [];
    guestsByTable[tableId].push({
      name: String(row[3] || "Khách mời").trim(),
      count: parseInt(row[4], 10) || 1,
      note: String(row[5] || "").trim()
    });
  }

  // 2. Đọc Sheet Bàn
  const banRows = sheetBan.getDataRange().getValues();
  const tables = [];
  for (let i = 1; i < banRows.length; i++) {
    const row = banRows[i];
    const id = String(row[0] || "").trim();
    if (!id) continue;
    const guests = guestsByTable[id] || [];
    const guestCount = guests.reduce((sum, g) => sum + (parseInt(g.count, 10) || 0), 0);
    tables.push({
      id: id,
      tableNo: parseInt(row[1], 10) || 0,
      side: String(row[2] || "").includes("Trai") ? "groom" : "bride",
      sideName: String(row[2] || ""),
      customLabel: String(row[3] || ""),
      displayCategory: String(row[3] || ""),
      groupName: String(row[4] || ""),
      customColor: String(row[5] || ""),
      highlight: String(row[6] || ""),
      guestCount: guestCount,
      guests: guests
    });
  }
  return tables;
}

// Lưu dữ liệu từ Website vào Google Sheet
function saveAllData(ss, tables) {
  let sheetBan = ss.getSheetByName(SHEET_BAN);
  let sheetKhach = ss.getSheetByName(SHEET_KHACH);
  const nowStr = Utilities.formatDate(new Date(), "GMT+7", "dd/MM/yyyy HH:mm:ss");

  // Xóa dữ liệu cũ (giữ dòng tiêu đề)
  if (sheetBan.getLastRow() > 1) {
    sheetBan.getRange(2, 1, sheetBan.getLastRow() - 1, 9).clearContent();
  }
  if (sheetKhach.getLastRow() > 1) {
    sheetKhach.getRange(2, 1, sheetKhach.getLastRow() - 1, 7).clearContent();
  }

  const banDataRows = [];
  const khachDataRows = [];

  tables.forEach(t => {
    const sideLabel = t.side === "groom" ? "Nhà Trai" : "Nhà Gái";
    const totalGuests = (t.guests || []).reduce((sum, g) => sum + (parseInt(g.count, 10) || 0), 0);
    banDataRows.push([
      t.id,
      t.tableNo,
      sideLabel,
      t.customLabel || t.displayCategory || "",
      t.groupName || "",
      t.customColor || "",
      t.highlight || "",
      totalGuests,
      nowStr
    ]);

    if (t.guests && t.guests.length > 0) {
      t.guests.forEach(g => {
        khachDataRows.push([
          t.id,
          t.tableNo,
          sideLabel,
          g.name || "Khách mời",
          parseInt(g.count, 10) || 1,
          g.note || "",
          nowStr
        ]);
      });
    }
  });

  if (banDataRows.length > 0) {
    sheetBan.getRange(2, 1, banDataRows.length, 9).setValues(banDataRows);
  }
  if (khachDataRows.length > 0) {
    sheetKhach.getRange(2, 1, khachDataRows.length, 7).setValues(khachDataRows);
  }
}
