const EXAM_FILE_URL = 'https://raw.githubusercontent.com/nhattan28/lich_thi_DTU/main/LICH_THI_KTHP.xlsx';

let EXAM_DATA = [];
let HEADERS = [];

// CÁC HẰNG SỐ MỚI HOẶC ĐÃ ĐỔI TÊN ĐỂ PHÙ HỢP
const STT_HEADER_NAME = 'STT';
const THU_HEADER_NAME = 'Thứ';
const NGAY_THI_HEADER_NAME = 'Ngày thi';
const GIO_THI_HEADER_NAME = 'Giờ thi';
const MA_MON_HEADER_NAME = 'Mã môn'; // Giữ lại Mã môn để tìm kiếm
const MON_THI_HEADER_NAME = 'Môn thi';
const HINHTHUC_HEADER_NAME = 'Hình thức thi';
const KHOI_THI_HEADER_NAME = 'Khối thi';
const DIA_DIEM_HEADER_NAME = 'Địa điểm';
const KHOA_CHUTRI_HEADER_NAME = 'Khoa chủ trì';
const GHICHU_HEADER_NAME = 'Ghi chú';
const SL_SV_HEADER_NAME = 'SL SV'; // Cột thay thế Mã môn trong hiển thị

// Thêm Mã ngành vào Key Columns dựa trên hình ảnh mới
const KEY_COLUMNS_TO_FIND = [STT_HEADER_NAME, THU_HEADER_NAME, NGAY_THI_HEADER_NAME, MA_MON_HEADER_NAME, MON_THI_HEADER_NAME, 'Mã ngành'];

// Tự động chạy hàm tải dữ liệu ngay khi trang web được mở
document.addEventListener('DOMContentLoaded', () => {
    loadAndProcessFile(EXAM_FILE_URL);
});

async function loadAndProcessFile(url) {
    if (!url || url === 'URL_FILE_EXCEL_CUA_BAN') {
        showModal('Lỗi Cấu Hình', 'Đường dẫn đến file lịch thi (EXAM_FILE_URL) chưa được thiết lập trong file `timmonthi.js`.', 'error', null, 0);
        document.querySelector('#resultTable tbody').innerHTML = `<tr><td colspan="100%">Lỗi cấu hình. Vui lòng liên hệ quản trị viên.</td></tr>`;
        // Cập nhật thống kê khi lỗi
        document.getElementById('resultStats').textContent = '0';
        return;
    }

    showModal('', '', 'info', null, 0.000000000001);

    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`Không thể tải file. (Mã lỗi: ${response.status})`);
        }

        const data = await response.arrayBuffer();
        processExcelData(data);

        EXAM_DATA = EXAM_DATA.filter(row => {
            const maMonKey = HEADERS.find(h => normalizeHeaderName(h).toUpperCase().includes(MA_MON_HEADER_NAME.toUpperCase())) || MA_MON_HEADER_NAME;
            const maMon = String(row[maMonKey] || '').trim();
            return maMon.length > 0 && !/^\d+$/.test(maMon);
        });

        showModal('', ``, 'success', null, 0.000000001);
        searchData();

    } catch (error) {
        console.error("Lỗi khi tải hoặc xử lý file:", error);
        showModal('Tải Lịch Thi Thất Bại!', `Đã xảy ra lỗi: ${error.message}.<br>Vui lòng kiểm tra lại đường dẫn file trên GitHub hoặc thử tải lại trang.`, 'error', null, 0);
        document.querySelector('#resultTable tbody').innerHTML = `<tr><td colspan="100%">Tải dữ liệu thất bại.</td></tr>`;
        // Cập nhật thống kê khi lỗi
        document.getElementById('resultStats').textContent = '0';
    }
}

function showModal(title, message, type = 'info', actions = null, duration = 0.0001) {
    const modal = document.getElementById('modalContainer');
    const content = modal.querySelector('.modal-content');
    const actionsContainer = document.getElementById('modalActions');

    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalMessage').innerHTML = message;

    let icon = '';
    content.className = `modal-content modal-${type}`;

    if (type === 'success') icon = '✅';
    else if (type === 'error') icon = '❌';
    else if (type === 'info') icon = 'ℹ️';
    else if (type === 'warning') icon = '⚠️';
    else if (type === 'confirm') icon = '❓';

    document.getElementById('modalIcon').textContent = icon;

    actionsContainer.innerHTML = '';
    if (actions && Array.isArray(actions)) {
        actions.forEach(action => {
            const button = document.createElement('button');
            button.className = `modal-btn modal-btn-${action.class}`;
            button.textContent = action.text;
            button.onclick = () => {
                hideModal();
                if (action.action) action.action();
            };
            actionsContainer.appendChild(button);
        });
    }
    actionsContainer.style.display = (actions && actions.length > 0) ? 'flex' : 'none';

    modal.classList.add('show');

    if (duration > 0 && (!actions || actions.length === 0)) {
        setTimeout(() => modal.classList.remove('show'), duration);
    }
}

function hideModal() {
    document.getElementById('modalContainer').classList.remove('show');
}

function showCopyConfirmModal() {
    const tableBody = document.querySelector('#resultTable tbody');
    if (tableBody.children.length === 0 || tableBody.querySelector('td').textContent.includes('Chưa có dữ liệu') || tableBody.querySelector('td').textContent.includes('Không tìm thấy') || tableBody.querySelector('td').textContent.includes('Tải dữ liệu thất bại')) {
        showModal('Không Có Dữ Liệu!', 'Không có dữ liệu để sao chép.', 'error');
        return;
    }

    const actions = [
        { text: 'Xác Nhận', class: 'confirm', action: copyTableImageToClipboard },
        { text: 'Hủy', class: 'cancel', action: hideModal }
    ];
    showModal('Xác Nhận Sao Chép', 'Bạn có muốn sao chép ảnh lịch thi này vào bộ nhớ tạm không?', 'confirm', actions, 0);
}

// File: timmonthi.js (Hàm copyTableImageToClipboard)

function copyTableImageToClipboard() {
    const tableWrapper = document.getElementById('tableWrapper');
    const captureArea = document.getElementById('captureArea');
    const exportHeader = document.getElementById('exportHeader');
    const exportTimeText = document.getElementById('exportTimeText');
    const exportDisclaimerText = document.getElementById('exportDisclaimerText');

    showModal('Đang Xử Lý...', 'Đang tạo ảnh và sao chép, vui lòng đợi...', 'info', null, 8000);

    const now = new Date();
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = now.getFullYear();

    exportTimeText.textContent = `Thời gian tra cứu: ${hours}:${minutes} - ${day}/${month}/${year}`;
    exportHeader.style.display = 'block';
    exportDisclaimerText.style.display = 'block'; // Hiển thị thông báo

    tableWrapper.classList.add('capturing');
    const originalScroll = tableWrapper.scrollTop;
    tableWrapper.scrollTop = 0;

    setTimeout(() => {
        html2canvas(captureArea, { scale: 2, useCORS: true, backgroundColor: '#ffffff' }).then(canvas => {
            // Ẩn các phần tử header và thông báo sau khi chụp xong
            exportHeader.style.display = 'none';
            exportDisclaimerText.style.display = 'none';
            tableWrapper.classList.remove('capturing');
            tableWrapper.scrollTop = originalScroll;

            // Bắt đầu logic SAO CHÉP VÀO CLIPBOARD
            canvas.toBlob(function (blob) {
                if (navigator.clipboard && navigator.clipboard.write) {
                    // API sao chép ảnh hiện đại
                    const item = new ClipboardItem({ "image/png": blob });
                    navigator.clipboard.write([item]).then(function () {
                        showModal('Thành Công! ✅', 'Ảnh lịch thi đã được sao chép vào bộ nhớ tạm. Bạn có thể dán (Paste) vào ứng dụng khác.', 'success', null, 2500);
                    }, function (err) {
                        console.error("Lỗi khi sao chép ảnh:", err);
                        showModal('Lỗi Sao Chép! ❌', 'Không thể sao chép ảnh. Vui lòng thử lại hoặc trình duyệt của bạn không hỗ trợ API này.', 'error');
                    });
                } else {
                    // Cảnh báo nếu trình duyệt không hỗ trợ API
                    showModal('Lỗi Trình Duyệt', 'Trình duyệt không hỗ trợ sao chép ảnh trực tiếp. Vui lòng thử cách chụp màn hình thủ công.', 'warning');
                }

            }, 'image/png');

        }).catch(error => {
            // Đảm bảo ẩn header/thông báo ngay cả khi có lỗi
            exportHeader.style.display = 'none';
            exportDisclaimerText.style.display = 'none';
            tableWrapper.classList.remove('capturing');
            tableWrapper.scrollTop = originalScroll;
            console.error("Lỗi khi tạo ảnh:", error);
            showModal('Lỗi!', 'Không thể tạo hình ảnh. Vui lòng thử lại.', 'error');
        });
    }, 150);
}

function excelSerialToJSDate(serial) {
    if (typeof serial !== 'number' || serial <= 0) return serial;
    const utc_days = Math.floor(serial - 25569);
    const date = new Date(utc_days * 86400 * 1000);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

function normalizeHeaderName(name) {
    return String(name || '').trim().replace(/\s+/g, ' ');
}

function getHeadersFromWorksheet(worksheet, rowIndex) {
    if (!worksheet || !worksheet['!ref']) return [];
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    const headerRange = { s: { r: rowIndex, c: range.s.c }, e: { r: rowIndex, c: range.e.c } };
    const headersArray = XLSX.utils.sheet_to_json(worksheet, { header: 1, range: XLSX.utils.encode_range(headerRange), defval: null })[0];
    return headersArray ? headersArray.map(h => normalizeHeaderName(h)).filter(Boolean) : [];
}

function findActualHeaderIndex(data) {
    const MAX_ROWS_TO_CHECK = 50;
    const workbook = XLSX.read(data, { type: 'array', raw: true });
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    if (!worksheet || !worksheet['!ref']) return -1;

    const normalizeKey = (key) => normalizeHeaderName(key).toUpperCase();

    for (let i = 0; i < MAX_ROWS_TO_CHECK; i++) {
        const currentHeaders = getHeadersFromWorksheet(worksheet, i);
        if (currentHeaders.length === 0) continue;
        const normalizedCurrentHeaders = currentHeaders.map(h => h.toUpperCase());
        const allKeysFound = KEY_COLUMNS_TO_FIND.every(key => normalizedCurrentHeaders.some(h => h.includes(normalizeKey(key))));

        if (allKeysFound) {
            HEADERS = currentHeaders;
            console.log(`✅ Header đã được tìm thấy ở dòng ${i + 1}.`);
            return i;
        }
    }
    return -1;
}

function processExcelData(data) {
    const workbook = XLSX.read(data, { type: 'array', raw: true });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet || !worksheet['!ref']) throw new Error('Không tìm thấy dữ liệu trong file Excel.');

    const headerRowIndex = findActualHeaderIndex(new Uint8Array(data));
    if (headerRowIndex === -1) {
        throw new Error(`Không thể tìm thấy hàng tiêu đề chứa các cột: ${KEY_COLUMNS_TO_FIND.join(', ')}.`);
    }

    const range = XLSX.utils.decode_range(worksheet['!ref']);
    const dataRange = { s: { r: headerRowIndex + 1, c: range.s.c }, e: range.e };

    EXAM_DATA = XLSX.utils.sheet_to_json(worksheet, {
        header: HEADERS,
        range: XLSX.utils.encode_range(dataRange),
        defval: "",
        raw: true
    });
    checkAndDisplayHeaders();
}

function checkAndDisplayHeaders() {
    const headerKeys = new Set(HEADERS.map(h => normalizeHeaderName(h).toUpperCase()));
    const requiredKeys = [MA_MON_HEADER_NAME, MON_THI_HEADER_NAME, NGAY_THI_HEADER_NAME];
    const missingCols = requiredKeys.filter(key => !headerKeys.has(key.toUpperCase()));
    if (missingCols.length > 0) {
        throw new Error(`File thiếu các cột quan trọng: ${missingCols.join(', ')}.`);
    }
}

const normalizeSearchString = (term) => String(term || '').trim().toUpperCase();

const splitSearchTerm = (term) => {
    const match = term.match(/^(.*)\s+([A-Z0-9-]+)$/i);

    if (match) {
        const [_, maMon, khoiThi] = match;
        return { maMon: maMon.trim().toUpperCase(), khoiThi: khoiThi.trim().toUpperCase() };
    }

    return { maMon: term.toUpperCase(), khoiThi: '' };
};

function searchData() {
    const resultStats = document.getElementById('resultStats');
    if (EXAM_DATA.length === 0) {
        resultStats.textContent = '0';
        displayResults([]);
        return;
    }

    const rawSearchText = document.getElementById('searchTermInput').value;
    const rawTerms = rawSearchText.split(',').map(normalizeSearchString).filter(Boolean);

    if (rawTerms.length === 0) {
        resultStats.textContent = `${EXAM_DATA.length}`;
        displayResults(EXAM_DATA);
        return;
    }

    const getHeaderKey = (targetName) => HEADERS.find(h => normalizeHeaderName(h).toUpperCase().includes(targetName.toUpperCase())) || targetName;
    const KHOI_THI_KEY = getHeaderKey(KHOI_THI_HEADER_NAME);
    const MA_MON_KEY = getHeaderKey(MA_MON_HEADER_NAME);
    const MON_THI_KEY = getHeaderKey(MON_THI_HEADER_NAME);
    const THU_KEY = getHeaderKey(THU_HEADER_NAME);
    const NGAY_THI_KEY = getHeaderKey(NGAY_THI_HEADER_NAME);
    const GIO_THI_KEY = getHeaderKey(GIO_THI_HEADER_NAME);
    const DIA_DIEM_KEY = getHeaderKey(DIA_DIEM_HEADER_NAME);
    const KHOA_CHUTRI_KEY = getHeaderKey(KHOA_CHUTRI_HEADER_NAME);
    const MA_NGANH_KEY = HEADERS.find(h => normalizeHeaderName(h).toUpperCase().includes('MÃ NGÀNH'.toUpperCase())) || 'Mã ngành';

    let foundTerms = new Set();
    const filteredData = EXAM_DATA.filter(row => {
        const maMonValue = normalizeSearchString(row[MA_MON_KEY]);
        const monThiValue = normalizeSearchString(row[MON_THI_KEY]);
        const khoiThiRaw = normalizeSearchString(row[KHOI_THI_KEY]);
        const thuValue = normalizeSearchString(row[THU_KEY]);
        const ngayThiValue = normalizeSearchString(excelSerialToJSDate(row[NGAY_THI_KEY]));
        const gioThiValue = normalizeSearchString(row[GIO_THI_KEY]);
        const diaDiemValue = normalizeSearchString(row[DIA_DIEM_KEY]);
        const khoaChuTriValue = normalizeSearchString(row[KHOA_CHUTRI_KEY]);
        const maNganhValue = normalizeSearchString(row[MA_NGANH_KEY]);


        return rawTerms.some(searchTerm => {
            let matchFound = false;
            const { maMon: searchMaMon, khoiThi: searchKhoiThi } = splitSearchTerm(searchTerm);

            // 1. Tìm kiếm theo Mã môn, Tên môn, Thứ, Ngày thi, Giờ thi, Địa điểm, Khoa chủ trì, Mã ngành
            if (monThiValue.includes(searchTerm) ||
                maMonValue.includes(searchTerm) ||
                thuValue.includes(searchTerm) ||
                ngayThiValue.includes(searchTerm) ||
                gioThiValue.includes(searchTerm) ||
                diaDiemValue.includes(searchTerm) ||
                khoaChuTriValue.includes(searchTerm) ||
                maNganhValue.includes(searchTerm) // Tìm kiếm theo Mã ngành
            ) {
                matchFound = true;
            }

            // 2. Tìm kiếm kết hợp Mã môn và Khối thi (ví dụ: CS 462 A)
            if (!matchFound && searchKhoiThi && maMonValue.includes(searchMaMon)) {
                const matchBracket = khoiThiRaw.match(/\((.*?)\)/);
                if (matchBracket) {
                    const sections = matchBracket[1].split(/[\s\-,]+/).filter(Boolean);
                    if (sections.includes(searchKhoiThi)) {
                        matchFound = true;
                    }
                }
            }

            if (matchFound) foundTerms.add(searchTerm);
            return matchFound;
        });
    });

    resultStats.textContent = `${filteredData.length}`;
    const notFoundTerms = new Set(rawTerms.filter(term => !foundTerms.has(term)));
    displayResults(filteredData, notFoundTerms, rawTerms);
}

function displayResults(data, notFoundTerms = new Set(), searchTerms = []) {
    const tableBody = document.querySelector('#resultTable tbody');
    const tableHead = document.querySelector('#resultTable thead tr');
    const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

    const getHeaderKey = (targetName) => HEADERS.find(h => normalizeHeaderName(h).toUpperCase().includes(targetName.toUpperCase())) || targetName;

    const KHOI_THI_KEY = getHeaderKey(KHOI_THI_HEADER_NAME);
    const MA_MON_KEY = getHeaderKey(MA_MON_HEADER_NAME);
    const MON_THI_KEY = getHeaderKey(MON_THI_HEADER_NAME);
    const SL_SV_KEY = getHeaderKey(SL_SV_HEADER_NAME); // Lấy khóa SL SV
    const NGAY_THI_KEY = getHeaderKey(NGAY_THI_HEADER_NAME);
    const MA_NGANH_KEY = HEADERS.find(h => normalizeHeaderName(h).toUpperCase().includes('MÃ NGÀNH'.toUpperCase())) || 'Mã ngành';


    tableHead.innerHTML = '';
    tableBody.innerHTML = '';

    if (HEADERS.length > 0) {
        HEADERS.forEach(header => {
            const th = document.createElement('th');
            // HIỂN THỊ CỘT SL SV THAY CHO MÃ MÔN TRÊN HEADER
            if (header === MA_MON_KEY) {
                th.textContent = SL_SV_HEADER_NAME;
            } else if (normalizeHeaderName(header).toUpperCase().includes('MÃ NGÀNH'.toUpperCase())) {
                th.textContent = 'Mã ngành'; // Fix tiêu đề nếu cần
            } else {
                th.textContent = header;
            }
            tableHead.appendChild(th);
        });
    }

    const colspan = HEADERS.length || 1;

    if (data.length === 0) {
        tableBody.innerHTML = `<tr><td colspan="${colspan}">Không tìm thấy kết quả phù hợp.</td></tr>`;
    } else {
        data.forEach(row => {
            const tr = document.createElement('tr');

            const rowMaMon = String(row[MA_MON_KEY] || '').toUpperCase();
            const rowMonThi = String(row[MON_THI_KEY] || '').toUpperCase();

            let lettersForThisRow = new Set();

            searchTerms.forEach(term => {
                const { maMon, khoiThi } = splitSearchTerm(term);
                if ((rowMaMon.includes(maMon) || rowMonThi.includes(maMon)) && khoiThi) {
                    lettersForThisRow.add(khoiThi);
                }
            });

            const sortedLetters = [...lettersForThisRow].sort((a, b) => b.length - a.length);
            const rowRegex = sortedLetters.length > 0
                ? new RegExp(`\\b(${sortedLetters.map(escapeRegExp).join('|')})\\b`, 'gi')
                : null;

            HEADERS.forEach(header => {
                const td = document.createElement('td');
                let cellValue = row[header] || '';

                // 1. Chuyển đổi ngày thi
                if (header === NGAY_THI_KEY && typeof cellValue === 'number' && cellValue > 0) {
                    cellValue = excelSerialToJSDate(cellValue);
                }

                // 2. HIỂN THỊ CỘT SL SV THAY CHO MÃ MÔN TRONG DATA
                if (header === MA_MON_KEY) {
                    cellValue = row[SL_SV_KEY] || ''; // Lấy giá trị của SL SV
                    td.textContent = cellValue;
                    tr.appendChild(td);
                    return;
                }

                // 3. Tô màu Khối thi
                if (header === KHOI_THI_KEY && rowRegex) {
                    const textContent = String(cellValue);
                    td.innerHTML = textContent.replace(rowRegex, `<span class="highlight-khoithi">$1</span>`);
                } else {
                    td.textContent = cellValue;
                }

                tr.appendChild(td);
            });
            tableBody.appendChild(tr);
        });
    }
}
