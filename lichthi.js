const folderIds = [
    "1grnqT7EmFG4CFPoVmqTD4nao1YvcHBVT",
];
const apiKey = "AIzaSyCu6BDhyYqOj0AVa2M5rr1dqBKJ_9nSQS4"; // <-- Lưu ý: Bạn cần thay thế API Key này bằng khóa API thật của mình để truy cập Google Drive.

function normalizeText(text) {
    return text.toLowerCase().replace(/\s+/g, ' ').trim();
}

async function fetchAllFiles(folderId) {
    let files = [];
    let pageToken = null;

    try {
        do {
            const url = `https://www.googleapis.com/drive/v3/files?q='${folderId}'+in+parents&key=${apiKey}&pageSize=100${pageToken ? `&pageToken=${pageToken}` : ''}`;
            const res = await fetch(url);
            if (!res.ok) {
                console.error('Lỗi khi tải file từ Google Drive:', res.statusText);
                return [];
            }
            const data = await res.json();

            files = files.concat(data.files || []);
            pageToken = data.nextPageToken;
        } while (pageToken);
    } catch (error) {
        console.error('Có lỗi xảy ra khi gọi API Google Drive:', error);
        return [];
    }
    return files;
}

async function loadFiles() {
    let allFiles = [];
    for (const folderId of folderIds) {
        const files = await fetchAllFiles(folderId);
        allFiles = allFiles.concat(files);
    }
    displayFiles(allFiles);
}

function displayFiles(files) {
    const list = document.getElementById("fileList");
    const fileCount = document.getElementById("fileCount");

    // Xóa nội dung cũ trước khi hiển thị lại
    list.innerHTML = "";

    const keywordRaw = document.getElementById("searchInput").value;
    const keyword = normalizeText(keywordRaw);

    const filteredFiles = files.filter(file => {
        const fileName = normalizeText(file.name);
        return fileName.includes(keyword);
    });

    if (filteredFiles.length === 0 && keyword.length > 0) {
        fileCount.textContent = `Không tìm thấy tệp nào phù hợp với "${keywordRaw}"`;
    } else {
        fileCount.textContent = `${filteredFiles.length} tệp`;
    }

    if (filteredFiles.length === 0 && keyword.length === 0) {
        list.innerHTML = "<p style='text-align: center; width: 100%; margin-top: 2rem; color: #555;'>Chưa có lịch thi nào được tải lên.</p>";
    } else {
        filteredFiles.forEach(file => {
            const viewerUrl = `https://drive.google.com/file/d/${file.id}/preview`;
            const card = document.createElement("div");
            card.className = "file-card";
            card.innerHTML = `<h3>${file.name}</h3><button onclick="openViewer('${viewerUrl}')">👁️ Xem</button>`;
            list.appendChild(card);
        });
    }
}

document.getElementById("searchInput").addEventListener("input", loadFiles);

function openViewer(url) {
    document.getElementById("viewerFrame").src = url;
    document.getElementById("viewerOverlay").classList.remove("hidden");
}

document.getElementById("closeViewer").onclick = () => {
    document.getElementById("viewerFrame").src = "";
    document.getElementById("viewerOverlay").classList.add("hidden");
};

// Xử lý sự kiện khi thay đổi lựa chọn trong dropdown
document.getElementById("pageSelect").addEventListener("change", function () {
    const selected = this.value;
    const examSearchInstructions = document.getElementById("examSearchInstructions");
    const fileListContainer = document.getElementById("fileList");
    const searchInput = document.getElementById("searchInput");
    const fileCountSpan = document.getElementById("fileCount");

    if (selected === "exam-search") {
        examSearchInstructions.classList.remove("hidden");
        fileListContainer.classList.add("hidden"); // Ẩn danh sách file
        searchInput.classList.add("hidden"); // Ẩn thanh tìm kiếm
        fileCountSpan.classList.add("hidden"); // Ẩn số lượng tệp
    } else {
        examSearchInstructions.classList.add("hidden");
        fileListContainer.classList.remove("hidden"); // Hiển thị lại danh sách file
        searchInput.classList.remove("hidden"); // Hiển thị lại thanh tìm kiếm
        fileCountSpan.classList.remove("hidden"); // Hiển thị lại số lượng tệp

        if (selected === "index.html") {
            loadFiles(); // Tải lại danh sách file cho "Lịch thi"
            searchInput.value = ""; // Xóa nội dung tìm kiếm
        } else {
            // Trường hợp bạn có các trang khác ngoài index.html và exam-search
            window.location.href = selected;
        }
    }
});

// Khi trang vừa tải xong, kiểm tra lựa chọn hiện tại để ẩn/hiện thông báo
document.addEventListener('DOMContentLoaded', () => {
    const examSearchInstructions = document.getElementById("examSearchInstructions");
    const pageSelect = document.getElementById("pageSelect");
    const fileListContainer = document.getElementById("fileList");
    const searchInput = document.getElementById("searchInput");
    const fileCountSpan = document.getElementById("fileCount");

    // Đặt giá trị dropdown về "Lịch thi" khi tải lại trang
    pageSelect.value = "index.html";

    // Ẩn thông báo hướng dẫn và đảm bảo hiển thị các phần tử của "Lịch thi"
    examSearchInstructions.classList.add("hidden");
    fileListContainer.classList.remove("hidden");
    searchInput.classList.remove("hidden");
    fileCountSpan.classList.remove("hidden");

    loadFiles(); // Tải các file khi trang được tải lần đầu
});