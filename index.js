const instructionArrow = document.getElementById('instruction-arrow');

// ⏰ Hiển thị đồng hồ
function updateClock() {
    const now = new Date();
    document.getElementById('clock').textContent = now.toLocaleTimeString('vi-VN');
    const options = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' };
    document.getElementById('date').textContent = now.toLocaleDateString('vi-VN', options);
}
setInterval(updateClock, 1000);
updateClock();

// ☰ Mở sidebar
window.showSidebar = function() {
    document.getElementById('sidebar').classList.add('show');
    document.getElementById('overlay').classList.add('show');
    document.getElementById('toggleBtn').classList.add('hide');
    // Ẩn mũi tên khi sidebar mở
    instructionArrow.style.opacity = '0';
    instructionArrow.style.pointerEvents = 'none'; // Thêm dòng này
}

// ❌ Đóng sidebar + collapse thẻ cha
window.hideSidebar = function() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('overlay');
    const toggleBtn = document.getElementById('toggleBtn');
    const searchInput = document.getElementById('search-input');

    sidebar.classList.remove('show');
    overlay.classList.remove('show');
    toggleBtn.classList.remove('hide');

    // Xóa nội dung tìm kiếm và reset menu
    searchInput.value = '';
    filterMenu();
}

// 🔁 Chuyển trang + tô màu
window.loadPage = function(event, pageUrl) {
    const iframeView = document.getElementById('iframeView');
    
    // Ẩn mũi tên ngay lập tức và ngăn chặn click
    instructionArrow.style.opacity = '0';
    instructionArrow.style.pointerEvents = 'none';

    // Đặt src của iframe
    iframeView.src = pageUrl;

    // Reset màu nút
    document.querySelectorAll('.sidebar button').forEach(btn => btn.classList.remove('active'));
    document.querySelectorAll('.sidebar details').forEach(detail => detail.classList.remove('active-parent'));
    
    // Tô màu nút đã chọn
    const clickedBtn = event.target;
    const parentDetail = clickedBtn.closest('details');
    if (parentDetail) parentDetail.classList.add('active-parent');
    clickedBtn.classList.add('active');

    hideSidebar();
}

// 🔄 Chỉ cho mở 1 thẻ cha cùng lúc
document.querySelectorAll('.sidebar details').forEach((detail) => {
    detail.addEventListener('toggle', () => {
        if (detail.open) {
            document.querySelectorAll('.sidebar details').forEach((d) => {
                if (d !== detail) {
                    d.removeAttribute('open');
                }
            });
        }
    });
});

// Lọc menu
window.filterMenu = function() {
    const input = document.getElementById('search-input');
    const filter = input.value.toLowerCase();
    const sidebar = document.getElementById('sidebar');
    const detailsElements = sidebar.getElementsByTagName('details');
    const allButtons = sidebar.querySelectorAll('button');

    if (filter === "") {
        for (let i = 0; i < allButtons.length; i++) {
            allButtons[i].style.display = 'block';
        }
        for (let i = 0; i < detailsElements.length; i++) {
            detailsElements[i].open = false;
            detailsElements[i].style.display = 'block';
        }
        return;
    }

    for (let i = 0; i < allButtons.length; i++) {
        allButtons[i].style.display = 'none';
    }

    for (let i = 0; i < detailsElements.length; i++) {
        const details = detailsElements[i];
        const summary = details.querySelector('summary');
        const summaryText = summary.textContent.toLowerCase();
        let hasMatch = false;

        if (summaryText.includes(filter)) {
            details.style.display = 'block';
            details.open = true;
            hasMatch = true;
            const childButtons = details.querySelectorAll('button');
            for (let j = 0; j < childButtons.length; j++) {
                childButtons[j].style.display = 'block';
            }
        } else {
            const childButtons = details.querySelectorAll('button');
            for (let j = 0; j < childButtons.length; j++) {
                const button = childButtons[j];
                const buttonText = button.textContent.toLowerCase();
                if (buttonText.includes(filter)) {
                    button.style.display = 'block';
                    details.style.display = 'block';
                    details.open = true;
                    hasMatch = true;
                } else {
                    button.style.display = 'none';
                }
            }
        }
        if (!hasMatch) {
            details.style.display = 'none';
        }
    }
}

// ✅ Logic hoàn chỉnh để kiểm soát mũi tên
const iframeView = document.getElementById('iframeView');
// Giả định 'instructionArrow' đã được định nghĩa và có thể truy cập được

iframeView.addEventListener('load', function() {
    // Luôn truy cập location của iframe sau khi tải xong
    const currentSrc = iframeView.contentWindow.location.href;
    
    // ĐỊNH NGHĨA DANH SÁCH CÁC TRANG CẦN ẨN MŨI TÊN
    const pagesToHideArrow = [
        'lichthi.html', 
        'timmonthi.html', // Đã sửa lỗi logic từ lần trước
        'thoikhoabieu.html', 
        'tinhdiemdtu.html', 
        'dtumaps.html', 
        'anhsv.html',
        'tinhdiemhocphandtu.html'
    ];
    
    // KIỂM TRA: Sử dụng .some() để kiểm tra xem URL có chứa BẤT KỲ chuỗi nào trong danh sách không
    const shouldHide = pagesToHideArrow.some(page => currentSrc.includes(page));

    if (shouldHide) {
        // Nếu URL chứa BẤT KỲ trang nào trong danh sách, mũi tên sẽ ẩn và không nhận click.
        instructionArrow.style.opacity = '0';
        instructionArrow.style.pointerEvents = 'none';
    } else {
        // Ngược lại, mũi tên sẽ hiển thị và nhận click.
        instructionArrow.style.opacity = '1';
        instructionArrow.style.pointerEvents = 'auto';
    }
});

// ---

// Hiển thị mũi tên khi trang vừa tải lần đầu
window.onload = function() {
    instructionArrow.style.opacity = '1';
    instructionArrow.style.pointerEvents = 'auto';
};

