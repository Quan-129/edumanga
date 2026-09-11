# -*- coding: utf-8 -*-
"""
Generate Kanji Radical Decomposition database for Mimikara N2
Fetches CJKVI IDS and generates data/kanji_radicals_n2.json
"""
import sys
import json
import urllib.request
import re

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

# Comprehensive table of Radicals & Common Sub-components (Vietnamese names & meanings)
RADICALS_TABLE = {
    '一': ('Nhất', 'Số một, mặt đất, sự khởi đầu'),
    '丨': ('Cổn', 'Nét sổ dọc xuyên suốt'),
    '丶': ('Chủ', 'Nét chấm, giọt nước, điểm sáng'),
    '丿': ('Phiệt', 'Nét phẩy xiên, vết chém'),
    '乀': ('Phất', 'Nét mác lượn phải'),
    '乛': ('Ất', 'Nét gập ngang móc'),
    '乙': ('Ất', 'Can Ất, uốn lượn mềm mại'),
    '亅': ('Quyết', 'Nét móc câu nhọn'),
    '二': ('Nhị', 'Số hai, tầng lớp song song'),
    '亠': ('Đầu', 'Mái che trên cao, chóp đỉnh'),
    '人': ('Nhân', 'Con người, nhân loại'),
    '亻': ('Nhân đứng', 'Con người đang đứng hoạt động'),
    '儿': ('Nhi', 'Đôi chân bước, đứa trẻ thơ'),
    '入': ('Nhập', 'Đi vào bên trong, thu nhận'),
    '八': ('Bát', 'Số tám, tách ra hai bên'),
    '丷': ('Bát biến thể', 'Hai chấm nhỏ tỏa ra'),
    '冂': ('Quynh', 'Vùng biên cương, khung thành'),
    '冖': ('Mịch', 'Khăn trùm che phủ kín'),
    '冫': ('Băng', 'Băng tuyết, hàn lạnh giá buốt'),
    '几': ('Kỷ', 'Chiếc bàn trà nhỏ, chỗ dựa'),
    '凵': ('Khảm', 'Hố sâu há miệng đón nhận'),
    '刀': ('Đao', 'Thanh đao, nhát chém sắc bén'),
    '刂': ('Đao đứng', 'Vũ khí chém phạt, phân tách'),
    '力': ('Lực', 'Sức mạnh, cánh tay gân guốc'),
    '勹': ('Bao', 'Bao bọc, ôm trọn trong lòng'),
    '匕': ('Chủy', 'Cái thìa múc, đoản kiếm'),
    '匚': ('Phương', 'Chiếc hộp chữ nhật đựng báu vật'),
    '匸': ('Hệ', 'Góc che đậy kín đáo'),
    '十': ('Thập', 'Số mười, hoàn hảo trọn vẹn'),
    '卜': ('Bốc', 'Quẻ bói toán, dự tri tương lai'),
    '卩': ('Tiết', 'Đốt tre, người quỳ phục lệnh'),
    '厂': ('Hán', 'Vách núi đá đứng chênh vênh'),
    '厶': ('Khư', 'Sự riêng tư, góc nhỏ kín đáo'),
    '又': ('Hựu', 'Lại nữa, bàn tay phải nắm lấy'),
    '口': ('Khẩu', 'Cái miệng, lời nói, ô vuông'),
    '囗': ('Vi', 'Tường thành bao quanh khép kín'),
    '土': ('Thổ', 'Đất đai màu mỡ, cội nguồn'),
    '士': ('Sĩ', 'Kẻ sĩ có tài đức, học giả'),
    '夂': ('Trĩ', 'Bước đi chậm chạp từ tốn'),
    '夊': ('Tuy', 'Đi chậm bước sau'),
    '夕': ('Tịch', 'Hoàng hôn, đêm tối huyền ảo'),
    '大': ('Đại', 'To lớn vĩ đại, người dang rộng tay'),
    '女': ('Nữ', 'Người phụ nữ dịu dàng khéo léo'),
    '子': ('Tử', 'Đứa con thơ, học trò hiếu học'),
    '宀': ('Miên', 'Mái nhà ấm cúng che mưa nắng'),
    '寸': ('Thốn', 'Tấc đất, quy tắc thước đo gang tấc'),
    '小': ('Tiểu', 'Nhỏ bé, tinh xảo, đơn sơ'),
    '⺌': ('Tiểu đầu', 'Tia sáng nhỏ lóe lên chói lọi'),
    '尢': ('Uông', 'Đôi chân cong què quặt'),
    '尸': ('Thi', 'Thân xác, chỗ tựa lưng'),
    '屮': ('Triệt', 'Mầm non mới nhú khỏi mặt đất'),
    '山': ('Sơn', 'Ngọn núi hùng vĩ sừng sững'),
    '川': ('Xuyên', 'Dòng sông ba nhánh chảy xiết'),
    '巛': ('Xuyên biến thể', 'Dòng suối uốn lượn róc rách'),
    '工': ('Công', 'Công cụ người thợ, công trình'),
    '己': ('Kỷ', 'Bản thân, tự mình làm chủ'),
    '已': ('Dĩ', 'Đã rồi, hoàn thành'),
    '巳': ('Tỵ', 'Chi Tỵ, con rắn'),
    '巾': ('Cân', 'Mảnh khăn vải thêu dệt'),
    '干': ('Can', 'Can thiệp, lá chắn che đỡ'),
    '幺': ('Yêu', 'Sợi tơ non, bé bỏng non nớt'),
    '广': ('Quảng', 'Ngôi nhà rộng tựa sườn non'),
    '廴': ('Dẫn', 'Bước chân dài tiến bước'),
    '廾': ('Củng', 'Chắp hai tay cung kính nâng lên'),
    '弋': ('Dặc', 'Cọc gỗ bắn tên, cắm mốc'),
    '弓': ('Cung', 'Cây cung bắn tên uốn cong'),
    '彐': ('Kế', 'Đầu con nhím, dấu bàn tay'),
    '彡': ('Sam', 'Hoa văn rực rỡ, sợi lông tơ'),
    '彳': ('Xích', 'Bước chân trái trên hành trình dài'),
    '心': ('Tâm', 'Trái tim nồng ấm, tâm tư tình cảm'),
    '忄': ('Tâm đứng', 'Cảm xúc rung động trong lòng'),
    '戈': ('Qua', 'Cây giáo dài chiến đấu bảo vệ'),
    '戶': ('Hộ', 'Cánh cửa nhà đơn lẻ đơn sơ'),
    '手': ('Thủ', 'Bàn tay khéo léo lao động'),
    '扌': ('Thủ đứng', 'Cánh tay hành động quả quyết'),
    '支': ('Chi', 'Cành cây non, nhánh con'),
    '攵': ('Phác', 'Gõ nhẹ rèn giũa tri thức'),
    '文': ('Văn', 'Hoa văn, văn chương chữ nghĩa'),
    '斗': ('Đẩu', 'Cái đấu đong thóc, chòm sao Bắc Đẩu'),
    '斤': ('Cân', 'Chiếc rìu chặt cây đẽo gọt'),
    '方': ('Phương', 'Phương hướng bốn phương, bè gỗ'),
    '无': ('Vô', 'Không có, hư không'),
    '日': ('Nhật', 'Mặt trời chói lọi, ngày tháng'),
    '曰': ('Viết', 'Mở miệng nói rằng, phát biểu'),
    '月': ('Nguyệt', 'Mặt trăng vằng vặc, bắp thịt nhục'),
    '木': ('Mộc', 'Cây cối sinh sôi, gỗ quý'),
    '欠': ('Khiếm', 'Ngáp dài mỏi mệt, thiếu thốn'),
    '止': ('Chỉ', 'Dừng bước chân lại vững vàng'),
    '歹': ('Đãi', 'Xương tàn mục, hiểm nguy tàn tạ'),
    '殳': ('Thù', 'Binh khí bằng gỗ dẹp loạn'),
    '毋': ('Vô', 'Lời mẹ khuyên răn chớ nên làm'),
    '比': ('Tỉ', 'So sánh đối chiếu ngang vai'),
    '毛': ('Mao', 'Lông vũ mượt mà, tơ mịn'),
    '氏': ('Thị', 'Dòng dõi danh gia vọng tộc'),
    '気': ('Khí', 'Khí chất trời đất, hơi thở sự sống'),
    '气': ('Khí', 'Hơi mây bay bổng tầng cao'),
    '水': ('Thủy', 'Nước suối nguồn tưới mát'),
    '氵': ('Thủy ba chấm', 'Dòng nước tuôn trào cuồn cuộn'),
    '火': ('Hỏa', 'Ngọn lửa bốc cháy rực hồng'),
    '灬': ('Hỏa bốn chấm', 'Than hồng cháy rực dưới đáy'),
    '爪': ('Trảo', 'Móng vuốt thú dữ săn mồi'),
    '爫': ('Trảo đầu', 'Móng vuốt chộp lấy từ trên'),
    '父': ('Phụ', 'Người cha nghiêm khắc trụ cột'),
    '爻': ('Hào', 'Các vạch quẻ Dịch đan xen'),
    '爿': ('Tường', 'Tấm ván gỗ dựng vách'),
    '片': ('Phiến', 'Mảnh gỗ mỏng xẻ đôi'),
    '牙': ('Nha', 'Răng nanh sắc nhọn chắc khỏe'),
    '牛': ('Ngưu', 'Con trâu cần cù chăm chỉ cày bừa'),
    '⺧': ('Ngưu đứng', 'Trâu bò sức khỏe dẻo dai'),
    '犬': ('Khuyển', 'Con chó trung thành giữ nhà'),
    '犭': ('Khuyển đứng', 'Thú hoang bốn chân nhanh nhẹn'),
    '玄': ('Huyền', 'Màu đen sâu thẳm, bí ẩn huyền diệu'),
    '玉': ('Ngọc', 'Viên ngọc quý phát sáng lung linh'),
    '王': ('Vương', 'Vị vua quyền uy thống trị'),
    '瓜': ('Qua', 'Quả dưa chín ngọt thơm lành'),
    '瓦': ('Ngõa', 'Viên ngói nung lợp mái nhà'),
    '甘': ('Cam', 'Vị ngọt ngào nơi đầu lưỡi'),
    '生': ('Sinh', 'Mầm sống vươn chồi nảy lộc'),
    '用': ('Dụng', 'Sử dụng công cụ, đồ đạc có ích'),
    '田': ('Điền', 'Thửa ruộng màu mỡ phì nhiêu'),
    '疋': ('Sơ', 'Bàn chân sải bước, sấp vải dệt'),
    '疒': ('Nạch', 'Căn bệnh mệt mỏi nằm dưỡng thân'),
    '癶': ('Bát', 'Hai bàn chân bước ngược chiều'),
    '白': ('Bạch', 'Màu trắng tinh khiết, hạt gạo sáng'),
    '皮': ('Bì', 'Lớp da bảo vệ bao phủ'),
    '皿': ('Mãnh', 'Chiếc đĩa đựng thức ăn thịnh soạn'),
    '目': ('Mục', 'Đôi mắt tinh anh quan sát tỏ tường'),
    '矛': ('Mâu', 'Ngọn giáo mâu nhọn xung trận'),
    '矢': ('Thỉ', 'Mũi tên phóng trúng tâm bia'),
    '石': ('Thạch', 'Tảng đá kiên cố vững chãi vĩnh cửu'),
    '示': ('Thị', 'Bàn thờ tổ tiên, sự hiển thị linh thiêng'),
    '礻': ('Thị biến thể', 'Thần linh phù hộ may mắn bình an'),
    '禾': ('Hòa', 'Cây lúa trĩu bông mùa màng bội thu'),
    '穴': ('Huyệt', 'Hang đá trú ẩn sâu trong lòng núi'),
    '立': ('Lập', 'Đứng thẳng hiên ngang giữa đất trời'),
    '竹': ('Trúc', 'Cây tre trúc dẻo dai thẳng thắn'),
    '⺮': ('Trúc biến thể', 'Thẻ tre, ống trúc lưu giữ tri thức'),
    '米': ('Mễ', 'Hạt gạo nuôi sống nhân gian'),
    '糸': ('Mịch', 'Sợi tơ se duyên bền chặt kết nối'),
    '缶': ('Phẫu', 'Bình sành vò gốm miệng hẹp'),
    '网': ('Võng', 'Lưới đánh cá giăng bắt'),
    '罒': ('Võng đầu', 'Tấm lưới chụp xuống'),
    '羊': ('Dương', 'Con cừu hiền lành, điềm lành'),
    '羽': ('Vũ', 'Đôi cánh lông vũ bay lượn trên mây'),
    '老': ('Lão', 'Bậc trưởng lão tóc bạc thông thái'),
    '耂': ('Lão đầu', 'Kính trọng người cao tuổi'),
    '而': ('Nhi', 'Bộ râu cằm trang nghiêm, nối tiếp'),
    '耒': ('Lỗi', 'Chiếc bừa cày cấy ruộng đồng'),
    '耳': ('Nhĩ', 'Đôi tai lắng nghe thấu suốt'),
    '聿': ('Duật', 'Cây bút lông ghi chép sử thư'),
    '肉': ('Nhục', 'Thịt cơ bắp nuôi dưỡng sinh lực'),
    '臣': ('Thần', 'Vị quan trung nghĩa một lòng cúc cung'),
    '自': ('Tự', 'Cái mũi, chính bản thân mình tự chủ'),
    '至': ('Chí', 'Đến tận cùng, chạm tới đỉnh cao'),
    '臼': ('Cữu', 'Chiếc cối đá giã gạo ngày mùa'),
    '舌': ('Thiệt', 'Chiếc lưỡi nếm vị cất lời hay'),
    '舟': ('Chu', 'Chiếc thuyền rẽ sóng ra khơi'),
    '艮': ('Cấn', 'Dừng chân kiên định, quẻ Cấn vững chãi'),
    '色': ('Sắc', 'Sắc màu dung mạo rạng rỡ'),
    '艸': ('Thảo', 'Cỏ cây hoa lá tốt tươi'),
    '艹': ('Thảo biến thể', 'Mầm thảo mộc thảo dược quý'),
    '虍': ('Hổ', 'Bộ da vằn chúa sơn lâm uy dũng'),
    '虫': ('Trùng', 'Sâu bọ côn trùng cần mẫn'),
    '血': ('Huyết', 'Giọt máu đỏ thắm nhiệt huyết'),
    '行': ('Hành', 'Ngã tư đường phố, bước đi hành động'),
    '衣': ('Y', 'Áo quần vải vóc che thân'),
    '衤': ('Y biến thể', 'Tà áo ấm áp nâng niu'),
    '西': ('Tây', 'Phương Tây hoàng hôn mặt trời lặn'),
    '覀': ('Tây biến thể', 'Mái che phía tây'),
    '見': ('Kiến', 'Đôi mắt trông thấy thấu suốt'),
    '角': ('Giác', 'Chiếc sừng nhọn uy lực của thú săn'),
    '言': ('Ngôn', 'Lời nói chân thành ngay thẳng'),
    '訁': ('Ngôn biến thể', 'Ngôn ngữ truyền đạt tư duy'),
    '谷': ('Cốc', 'Thung lũng sâu suối róc rách'),
    '豆': ('Đậu', 'Hạt đậu bùi béo, chén đựng lễ tế'),
    '豕': ('Thỉ', 'Con heo béo tròn gia tài sung túc'),
    '貝': ('Bối', 'Vỏ sò tiền tệ cổ xưa quý giá giàu sang'),
    '赤': ('Xích', 'Màu đỏ rực rỡ như than hồng'),
    '走': ('Tẩu', 'Chạy nhanh vươn tới mục tiêu'),
    '足': ('Túc', 'Bàn chân bước đi vững vàng đầy đủ'),
    '身': ('Thân', 'Vóc dáng thân hình con người'),
    '車': ('Xa', 'Bánh xe lăn bánh chở nặng đường xa'),
    '辛': ('Tân', 'Vị cay nồng, gian nan tôi luyện'),
    '辰': ('Thần', 'Ngôi sao mai Thần, rồng thiêng'),
    '辶': ('Sước', 'Bước chân phiêu bạt dặm trường'),
    '邑': ('Ấp', 'Vùng đất ấp thành cư trú'),
    '阝': ('Phụ / Ấp', 'Gò đất cao che chở / Thôn ấp trù phú'),
    '酉': ('Dậu', 'Bình rượu ủ men thơm nồng say'),
    '里': ('Lý', 'Thôn làng ngàn dặm, dặm đường dài'),
    '金': ('Kim', 'Vàng bạc châu báu, kim loại quý'),
    '钅': ('Kim biến thể', 'Kim loại rèn giũa sắc bén'),
    '長': ('Trường', 'Dài lâu, người lớn tuổi tài ba'),
    '門': ('Môn', 'Cánh cổng lớn chào đón khách quý'),
    '阜': ('Phụ', 'Gò đống đất đá cao sừng sững'),
    '隶': ('Đãi', 'Kịp đến nơi, bắt kịp thời khắc'),
    '隹': ('Chuy', 'Chim đuôi ngắn đậu cành trúc'),
    '雨': ('Vũ', 'Cơn mưa tưới mát vạn vật xanh tươi'),
    '靑': ('Thanh', 'Màu xanh biếc của tuổi thanh xuân'),
    '青': ('Thanh', 'Màu xanh hy vọng và sức trẻ'),
    '非': ('Phi', 'Sai trái, hai cánh vỗ ngược chiều'),
    '面': ('Diện', 'Gương mặt diện mạo sáng tỏ'),
    '革': ('Cách', 'Tấm da thú thuộc, cách mạng đổi mới'),
    '韋': ('Vi', 'Tấm da thú bao quanh bảo vệ'),
    '音': ('Âm', 'Âm thanh thanh thoát ngân nga'),
    '頁': ('Hiệp', 'Trang sách tri thức lật mở, cái đầu'),
    '風': ('Phong', 'Cơn gió lộng bốn phương trời'),
    '飛': ('Phi', 'Đôi cánh sải dài bay vút lên cao'),
    '食': ('Thực', 'Bữa cơm ngon lành bổ dưỡng'),
    '飠': ('Thực biến thể', 'Món ăn nuôi dưỡng thân thể'),
    '首': ('Thủ', 'Cái đầu lãnh đạo dẫn dắt đoàn đội'),
    '香': ('Hương', 'Hương thơm lúa chín thơm ngát đồng nội'),
    '馬': ('Mã', 'Chiến mã tung vó phi ngàn dặm'),
    '骨': ('Cốt', 'Xương cốt cốt cách vững vàng'),
    '高': ('Cao', 'Tòa lầu cao vút chạm mây trời'),
    '髟': ('Bưu', 'Mái tóc dài bồng bềnh bay trong gió'),
    '鬥': ('Đấu', 'Giao chiến phân tài cao thấp'),
    '鬯': ('Sưởng', 'Chén rượu nghệ thơm nồng dâng tế'),
    '鬲': ('Cách', 'Chiếc đỉnh đồng ba chân vững chãi'),
    '鬼': ('Quỷ', 'Bóng ma quỷ quái bí ẩn'),
    '魚': ('Ngư', 'Con cá bơi lội tung tăng trong dòng biếc'),
    '鳥': ('Điểu', 'Loài chim hót líu lo trên cành biếc'),
    '鹵': ('Lỗ', 'Vùng đất mặn kết tinh muối trắng'),
    '鹿': ('Lộc', 'Con hươu sao mang lại tài lộc cát tường'),
    '麥': ('Mạch', 'Bông lúa mạch vàng óng ả'),
    '麻': ('Ma', 'Cây gai dệt bao bố ấm áp'),
    '黃': ('Hoàng', 'Sắc vàng hoàng kim rực rỡ'),
    '黍': ('Thử', 'Cây kê dẻo hạt ngọt ngào'),
    '黑': ('Hắc', 'Màu đen huyền bí sâu thẳm'),
    '黹': ('Chỉ', 'Đường kim mũi chỉ thêu hoa'),
    '黽': ('Mãnh', 'Con ếch nhái chăm chỉ bên bờ nước'),
    '鼎': ('Đỉnh', 'Đỉnh đồng ba chân biểu tượng uy quyền'),
    '鼓': ('Cổ', 'Chiếc trống trận gióng vang thúc giục'),
    '鼠': ('Thử', 'Chú chuột nhanh nhẹn thông minh'),
    '鼻': ('Tị', 'Chiếc mũi hít thở khí trời'),
    '齊': ('Tề', 'Đều đặn ngay ngắn trật tự chỉnh tề'),
    '齒': ('Xỉ', 'Hàm răng trắng đều đặn nhai kỹ'),
    '竜': ('Long', 'Con rồng uốn lượn bay lượn'),
    '龍': ('Long', 'Rồng thần uy nghi bay giữa mây ngàn'),
    '龜': ('Quy', 'Rùa thiêng nghìn năm trường thọ'),
    '龠': ('Dược', 'Ống sáo trúc ngân vang giai điệu'),
    # Common composite sub-components
    '共': ('Cộng', 'Cùng nhau chung sức'),
    '且': ('Thả', 'Chồng chất lên, hơn nữa'),
    '寺': ('Tự', 'Ngôi chùa thanh tịnh'),
    '分': ('Phân', 'Chia tách rành mạch'),
    '反': ('Phản', 'Quay ngược lại, phản kháng'),
    '不': ('Bất', 'Không, chối từ'),
    '化': ('Hóa', 'Biến hóa đổi thay'),
    '加': ('Gia', 'Thêm vào, gia tăng'),
    '古': ('Cổ', 'Xưa cũ, ngàn năm'),
    '央': ('Ương', 'Chính giữa trung tâm'),
    '台': ('Thai', 'Bệ đỡ, khán đài'),
    '皮': ('Bì', 'Lớp da thuộc'),
    '民': ('Dân', 'Nhân dân trăm họ'),
    '交': ('Giao', 'Giao lưu kết bạn'),
    '光': ('Quang', 'Ánh sáng rực rỡ'),
    '各': ('Các', 'Từng người, các nơi'),
    '合': ('Hợp', 'Hòa hợp, vừa khít'),
    '同': ('Đồng', 'Cùng một chí hướng'),
    '寺': ('Tự', 'Ngôi chùa thanh tịnh'),
    '成': ('Thành', 'Thành tựu, hoàn tất'),
    '有': ('Hữu', 'Có được, sở hữu'),
    '毎': ('Mỗi', 'Mỗi ngày, thường xuyên'),
    '求': ('Cầu', 'Tìm kiếm, cầu thị'),
    '更': ('Canh', 'Đổi thay, thêm nữa'),
    '良': ('Lương', 'Lương thiện tốt đẹp'),
    '甫': ('Phủ', 'Người đàn ông đức độ'),
    '者': ('Giả', 'Người, kẻ tài giỏi'),
    '門': ('Môn', 'Cánh cổng rộng mở'),
    '章': ('Chương', 'Chương hồi rực rỡ'),
    '商': ('Thương', 'Thương buôn buôn bán'),
    '帯': ('Đới', 'Dải thắt lưng buộc chặt'),
    '票': ('Phiếu', 'Lá phiếu bầu chọn'),
    '暴': ('Bạo', 'Mạnh bạo, bùng cháy'),
    '未': ('Vị', 'Chưa đến lúc, tương lai'),
    '末': ('Mạt', 'Ngọn cây, kết thúc'),
    '本': ('Bản', 'Gốc rễ, sách vở'),
    '正': ('Chính', 'Ngay thẳng chính trực'),
    '世': ('Thế', 'Thế gian ba mươi năm'),
    '平': ('Bình', 'Bình an phẳng lặng'),
    '去': ('Khứ', 'Đã qua đi, rời khỏi'),
    '令': ('Lệnh', 'Mệnh lệnh ban xuống'),
    '包': ('Bao', 'Gói ghém ôm trọn'),
    '半': ('Bán', 'Một nửa cân phân'),
    '司': ('Ty', 'Cai quản quản lý'),
    '市': ('Thị', 'Khu chợ sầm uất'),
    '失': ('Thất', 'Đánh mất, rơi rớt'),
    '必': ('Tất', 'Tất yếu nhất định'),
    '冬': ('Đông', 'Mùa đông tuyết phủ'),
    '白': ('Bạch', 'Màu trắng thuần khiết'),
    '母': ('Mẫu', 'Người mẹ chở che'),
    '主': ('Chủ', 'Làm chủ đứng đầu'),
    '北': ('Bắc', 'Phương bắc gió lạnh'),
    '世': ('Thế', 'Cuộc đời thế hệ'),
    '申': ('Thân', 'Bày tỏ nói ra'),
    '由': ('Do', 'Nguồn gốc lý do'),
    '甲': ('Giáp', 'Áo giáp bảo vệ'),
    '巨': ('Cự', 'Khổng lồ đồ sộ'),
    '皮': ('Bì', 'Lớp da bọc ngoài'),
    '央': ('Ương', 'Chính giữa tim gan'),
    '交': ('Giao', 'Giao lưu đan chéo'),
    '次': ('Thứ', 'Kế tiếp sau đó'),
    '多': ('Đa', 'Nhiều vô kể'),
    '式': ('Thức', 'Khuôn phép quy cách'),
    '百': ('Bách', 'Một trăm tròn trĩnh'),
    '竹': ('Trúc', 'Cây tre ngay thẳng'),
    '米': ('Mễ', 'Hạt gạo thơm lành'),
    '糸': ('Mịch', 'Sợi chỉ tơ tằm')
}

IDS_OPS = set('⿰⿱⿲⿳⿴⿵⿶⿷⿸⿹⿺⿻')

# Expansions for non-standard strokes/ligatures
EXPAND_MAP = {
    '丆': ['一', '丿'],
    '𠁣': ['門'],
    '𠃛': [],
    '亇': ['⺮'],
    '肀': ['聿'],
    '耂': ['老'],
    '𠂒': ['牛'],
    '帚': ['彐', '冖', '巾'],
    '啇': ['亠', '冂', '古'],
    '戠': ['音', '戈'],
    '冓': ['土', '冂'],
    '竟': ['立', '日', '儿'],
    '冊': ['冂', '一'],
    '侖': ['人', '冊']
}

def main():
    print("1. Downloading IDS database...")
    url = 'https://raw.githubusercontent.com/cjkvi/cjkvi-ids/master/ids.txt'
    req = urllib.request.urlopen(url)
    ids_map = {}
    for line in req:
        l = line.decode('utf-8').strip()
        if not l or l.startswith('#'): continue
        parts = l.split('\t')
        if len(parts) >= 3:
            char = parts[1]
            decomp = parts[2].split('[')[0].strip()
            ids_map[char] = decomp

    print(f"Loaded {len(ids_map)} IDS entries.")

    print("2. Reading Mimikara N2 dataset...")
    with open('data/mimikara_n2_units.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    # Collect all unique Kanji and their associated words/hanviet/meaning
    kanji_info = {}
    for u in data['units']:
        for w in u['words']:
            term = w.get('term', '')
            breakdown = w.get('kanji_breakdown', '')
            han_viet = w.get('han_viet', '')
            parts = breakdown.split('+') if breakdown else []
            for part in parts:
                m = re.match(r'^([^\(（]+)[\(（]([^:\：\)]+)[:\：]?([^\)）]*)[\)）]', part.strip())
                if m:
                    k = m.group(1).strip()
                    hv = m.group(2).strip()
                    mn = m.group(3).strip()
                    if k not in kanji_info:
                        kanji_info[k] = {'hanviet': hv, 'meaning': mn}

            for ch in term:
                if '\u4e00' <= ch <= '\u9faf' and ch not in kanji_info:
                    kanji_info[ch] = {'hanviet': '', 'meaning': ''}

    print(f"Total unique Kanji in Mimikara: {len(kanji_info)}")

    def decompose(ch, depth=0):
        if ch not in ids_map or depth > 2:
            return [ch]
        raw = ids_map[ch]
        chars = [c for c in raw if c not in IDS_OPS]
        if not chars:
            return [ch]
        res = []
        for c in chars:
            if c in EXPAND_MAP:
                res.extend(EXPAND_MAP[c])
            elif c in '丆':
                res.extend(['一', '丿'])
            elif len(chars) <= 2 and depth == 0 and c in ids_map and c in '𠂊':
                res.extend(decompose(c, depth + 1))
            else:
                res.append(c)
        cleaned = []
        for c in res:
            if c and c not in cleaned:
                cleaned.append(c)
        # Cap satellites to at most 4 nodes for perfect radial UI
        return cleaned[:4] if cleaned else [ch]

    # Build final database
    output_db = {}
    for k, info in kanji_info.items():
        components = decompose(k)
        
        # If components is just [k] and k is in RADICALS_TABLE, provide stroke primitives if possible
        if components == [k]:
            if k == '石':
                components = ['丿', '一', '口']
            elif k == '生':
                components = ['丿', '土', '一']
            elif k == '人':
                components = ['丿', '乀']
            elif k == '大':
                components = ['一', '人']
            elif k == '天':
                components = ['一', '大']
            elif k == '夫':
                components = ['一', '大']
            elif k == '木':
                components = ['十', '八']
            elif k == '本':
                components = ['木', '一']
            elif k == '休':
                components = ['亻', '木']
            elif k == '体':
                components = ['亻', '本']
            elif k == '日':
                components = ['口', '一']
            elif k == '目':
                components = ['口', '二']
            elif k == '田':
                components = ['囗', '十']

        # Enrich components with name and meaning
        enriched_comps = []
        for comp in components:
            if comp in RADICALS_TABLE:
                name, mean = RADICALS_TABLE[comp]
                enriched_comps.append({
                    'char': comp,
                    'name': f'Bộ {name}' if not name.startswith('Bộ') else name,
                    'meaning': mean
                })
            elif comp in kanji_info and kanji_info[comp]['hanviet']:
                hv = kanji_info[comp]['hanviet']
                mn = kanji_info[comp]['meaning'] or 'Thành phần chữ Hán'
                enriched_comps.append({
                    'char': comp,
                    'name': f'{hv}',
                    'meaning': mn
                })
            else:
                enriched_comps.append({
                    'char': comp,
                    'name': f'Thành phần {comp}',
                    'meaning': 'Nét / Bộ thủ cấu thành'
                })

        # Generate mnemonic story
        story = ""
        comp_str = " + ".join([f"<b>{c['char']}</b> ({c['name']})" for c in enriched_comps])
        target_name = info['meaning'] or info['hanviet'] or k
        if len(enriched_comps) >= 2:
            story = f"Kết hợp từ {comp_str} ➔ Tạo nên chữ <b>{k}</b>: <i>\"{target_name}\"</i>"
        elif len(enriched_comps) == 1:
            story = f"Chữ <b>{k}</b> ({enriched_comps[0]['name']}) ➔ Ý nghĩa: <i>\"{target_name}\"</i>"

        output_db[k] = {
            'char': k,
            'hanviet': info['hanviet'],
            'meaning': info['meaning'],
            'components': enriched_comps,
            'story': story
        }

    # Write JSON
    out_json_path = 'data/kanji_radicals_n2.json'
    with open(out_json_path, 'w', encoding='utf-8') as f:
        json.dump(output_db, f, ensure_ascii=False, indent=2)

    print(f"SUCCESS: Generated {out_json_path} with {len(output_db)} Kanji entries!")

if __name__ == '__main__':
    main()
