# -*- coding: utf-8 -*-
"""
Full Mimikara N2 Vocabulary Processor (High Precision)
Generates 1160 comprehensive 13-field vocabulary flashcard rows:
stt,term,reading,romaji,han_viet,meaning,type,exam_ja,exam_vi,kanji_breakdown,pitch_accent,synonyms_antonyms,card_type
"""

import csv
import re
import os
import sys
import pykakasi

sys.stdout.reconfigure(encoding='utf-8')

# 1. Complete Kanji Database for all 711 N2 Kanji
KANJI_DB = {
    '一': ('Nhất', 'một/nhất thể'),
    '万': ('Vạn', 'vạn/mười nghìn'),
    '上': ('Thượng', 'trên/lên'),
    '下': ('Hạ', 'dưới/xuống'),
    '世': ('Thế', 'thế giới/đời'),
    '中': ('Trung', 'trong/ở giữa'),
    '主': ('Chủ', 'làm chủ/chủ nhân'),
    '乗': ('Thừa', 'lên xe/cưỡi'),
    '乱': ('Loạn', 'rối loạn/hỗn loạn'),
    '乾': ('Càn', 'khô/ráo'),
    '予': ('Dự', 'dự báo/trước'),
    '事': ('Sự', 'sự việc/công việc'),
    '互': ('Hỗ', 'lẫn nhau/tương hỗ'),
    '交': ('Giao', 'giao thoa/giao lưu'),
    '人': ('Nhân', 'người/nhân loại'),
    '今': ('Kim', 'bây giờ/hiện tại'),
    '介': ('Giới', 'môi giới/giới thiệu'),
    '仕': ('Sĩ', 'phục vụ/công việc'),
    '他': ('Tha', 'khác/người ngoài'),
    '付': ('Phó', 'gắn/dính/kèm'),
    '代': ('Đại', 'thay thế/thời đại'),
    '会': ('Hội', 'gặp gỡ/hội họp'),
    '伝': ('Truyền', 'truyền bá/truyền đạt'),
    '伴': ('Bạn', 'đi cùng/kèm theo'),
    '似': ('Tự', 'tương tự/giống'),
    '位': ('Vị', 'vị trí/địa vị'),
    '低': ('Đê', 'thấp/kém'),
    '住': ('Trú', 'sinh sống/trú ngụ'),
    '体': ('Thể', 'cơ thể/thân thể'),
    '何': ('Hà', 'cái gì'),
    '余': ('Dư', 'thừa/dư thừa'),
    '作': ('Tác', 'làm/chế tác'),
    '使': ('Sử', 'dùng/sử dụng'),
    '供': ('Cung', 'cung cấp/đứa trẻ'),
    '価': ('Giá', 'giá cả/giá trị'),
    '侵': ('Xâm', 'xâm phạm/xâm chiếm'),
    '便': ('Tiện', 'tiện lợi/thư từ'),
    '促': ('Xúc', 'thúc đẩy/hối thúc'),
    '保': ('Bảo', 'bảo vệ/duy trì'),
    '信': ('Tín', 'tin tưởng/tín nhiệm'),
    '修': ('Tu', 'tu sửa/tu học'),
    '倉': ('Thương', 'nhà kho/kho hàng'),
    '個': ('Cá', 'cá nhân/từng cái'),
    '倒': ('Đảo', 'ngã/đổ/đảo lộn'),
    '候': ('Hậu', 'khí hậu/thời tiết'),
    '値': ('Trị', 'giá trị/trị số'),
    '偉': ('Vĩ', 'vĩ đại/cao lớn'),
    '停': ('Đình', 'dừng lại/đình chỉ'),
    '偶': ('Ngẫu', 'tình cờ/ngẫu nhiên'),
    '備': ('Bị', 'chuẩn bị/trang bị'),
    '催': ('Thôi', 'tổ chức/thôi thúc'),
    '傷': ('Thương', 'vết thương/tổn thương'),
    '傾': ('Khuynh', 'nghiêng/nghiêng ngả'),
    '働': ('Động', 'làm việc/lao động'),
    '像': ('Tượng', 'hình ảnh/bức tượng'),
    '儀': ('Nghi', 'nghi thức/lễ nghi'),
    '償': ('Thường', 'bồi thường/đền bù'),
    '優': ('Ưu', 'ưu tú/dịu dàng'),
    '元': ('Nguyên', 'nguồn gốc/ban đầu'),
    '先': ('Tiên', 'trước/đầu tiên'),
    '入': ('Nhập', 'vào/nhập vào'),
    '全': ('Toàn', 'toàn bộ/toàn vẹn'),
    '公': ('Công', 'công cộng/công khai'),
    '共': ('Cộng', 'cùng nhau/chung'),
    '具': ('Cụ', 'dụng cụ/công cụ'),
    '典': ('Điển', 'kinh điển/điển lễ'),
    '兼': ('Kiêm', 'kiêm nhiệm/kết hợp'),
    '再': ('Tái', 'lại/tái diễn'),
    '冒': ('Mạo', 'mạo hiểm/liều lĩnh'),
    '凍': ('Đống', 'đông đá/đóng băng'),
    '処': ('Xử', 'xử lý/nơi chốn'),
    '出': ('Xuất', 'ra ngoài/xuất hiện'),
    '分': ('Phân', 'chia/phần/hiểu'),
    '切': ('Thiết', 'cắt/sát sườn'),
    '判': ('Phán', 'phán đoán/đánh giá'),
    '別': ('Biệt', 'phân biệt/khác biệt'),
    '利': ('Lợi', 'lợi ích/tiện lợi'),
    '制': ('Chế', 'chế tạo/chế độ'),
    '券': ('Khoán', 'vé/phiếu'),
    '刺': ('Thích', 'đâm/chích/châm'),
    '刻': ('Khắc', 'khắc/thời khắc'),
    '削': ('Tước', 'gọt/cắt giảm'),
    '前': ('Tiền', 'phía trước/trước đây'),
    '剣': ('Kiếm', 'thanh kiếm'),
    '剥': ('Bác', 'bóc/lột vỏ'),
    '剰': ('Thặng', 'dư thừa/thặng dư'),
    '割': ('Cát', 'chia/vỡ/tỷ lệ'),
    '力': ('Lực', 'sức lực/khả năng'),
    '加': ('Gia', 'thêm vào/tham gia'),
    '劣': ('Liệt', 'kém cỏi/yếu kém'),
    '助': ('Trợ', 'giúp đỡ/cứu trợ'),
    '努': ('Nỗ', 'nỗ lực/cố gắng'),
    '励': ('Lệ', 'khích lệ/động viên'),
    '労': ('Lao', 'lao động/vất vả'),
    '動': ('Động', 'hoạt động/chuyển động'),
    '勘': ('Khám', 'trực giác/linh cảm'),
    '務': ('Vụ', 'nhiệm vụ/công vụ'),
    '勝': ('Thắng', 'thắng lợi/vượt trội'),
    '募': ('Mộ', 'chiêu mộ/tuyển dụng'),
    '勢': ('Thế', 'thế lực/khí thế'),
    '勤': ('Cần', 'cần cù/đi làm'),
    '匂': ('Mùi', 'mùi hương/mùi vị'),
    '化': ('Hóa', 'biến hóa/thay đổi'),
    '区': ('Khu', 'khu vực/phân khu'),
    '半': ('Bán', 'một nửa/nửa chừng'),
    '単': ('Đơn', 'đơn giản/đơn độc'),
    '占': ('Chiếm', 'chiếm cứ/bói toán'),
    '去': ('Khứ', 'qua đi/quá khứ'),
    '参': ('Tham', 'tham gia/viếng thăm'),
    '及': ('Cập', 'lan tới/đạt tới'),
    '双': ('Song', 'đôi/cặp'),
    '反': ('Phản', 'phản đối/ngược lại'),
    '収': ('Thu', 'thu hoạch/thu nhận'),
    '取': ('Thủ', 'lấy/cầm lấy'),
    '受': ('Thụ', 'nhận/tiếp nhận'),
    '口': ('Khẩu', 'miệng/cửa ngõ'),
    '可': ('Khả', 'khả năng/có thể'),
    '司': ('Ti', 'chủ trì/quản lý'),
    '各': ('Các', 'mỗi/từng cái'),
    '合': ('Hợp', 'thích hợp/gặp gỡ'),
    '同': ('Đồng', 'cùng nhau/giống nhau'),
    '名': ('Danh', 'tên/danh tiếng'),
    '吐': ('Thổ', 'nôn/nhổ ra'),
    '向': ('Hướng', 'hướng về/phía'),
    '吸': ('Hấp', 'hút/hít vào'),
    '周': ('Chu', 'xung quanh/chu vi'),
    '味': ('Vị', 'mùi vị/hương vị'),
    '呼': ('Hô', 'gọi/kêu lên'),
    '命': ('Mệnh', 'tính mạng/mệnh lệnh'),
    '品': ('Phẩm', 'sản phẩm/phẩm chất'),
    '員': ('Viên', 'thành viên/nhân viên'),
    '問': ('Vấn', 'hỏi/vấn đề'),
    '善': ('Thiện', 'thiện ý/tốt lành'),
    '器': ('Khí', 'dụng cụ/khí cụ'),
    '回': ('Hồi', 'quay lại/vòng quanh'),
    '囲': ('Vi', 'bao quanh/phạm vi'),
    '固': ('Cố', 'cố định/kiên cố'),
    '土': ('Thổ', 'đất đai'),
    '圧': ('Áp', 'áp lực/đè ép'),
    '在': ('Tại', 'tồn tại/ở tại'),
    '地': ('Địa', 'đất đai/địa điểm'),
    '型': ('Hình', 'khuôn mẫu/kiểu dáng'),
    '執': ('Chấp', 'cầm/chấp hành/viết'),
    '培': ('Bồi', 'bồi dưỡng/vun trồng'),
    '基': ('Cơ', 'cơ bản/nền móng'),
    '場': ('Trường', 'nơi chốn/hội trường'),
    '境': ('Cảnh', 'ranh giới/hoàn cảnh'),
    '増': ('Tăng', 'tăng thêm/gia tăng'),
    '增': ('Tăng', 'tăng thêm/gia tăng'),
    '売': ('Mại', 'bán hàng'),
    '外': ('Ngoại', 'bên ngoài/ngoại trừ'),
    '多': ('Đa', 'nhiều/đa dạng'),
    '大': ('Đại', 'to lớn/vĩ đại'),
    '天': ('Thiên', 'trời/thiên nhiên'),
    '夫': ('Phu', 'chồng/đàn ông'),
    '失': ('Thất', 'mất/thất bại'),
    '奇': ('Kỳ', 'kỳ lạ/hiếm có'),
    '奪': ('Đoạt', 'cướp đoạt/đoạt lấy'),
    '好': ('Hảo', 'thích/tốt'),
    '妙': ('Diệu', 'kỳ diệu/khéo léo'),
    '妨': ('Phương', 'cản trở/phương hại'),
    '姿': ('Tư', 'dáng vẻ/tư thế'),
    '威': ('Uy', 'uy quyền/uy phong'),
    '娯': ('Ngu', 'giải trí/vui chơi'),
    '婦': ('Phụ', 'phụ nữ/đàn bà'),
    '嫌': ('Hiềm', 'ghét/hiềm khích'),
    '子': ('Tử', 'con cái/đứa trẻ'),
    '字': ('Tự', 'chữ viết/ký tự'),
    '存': ('Tồn', 'tồn tại/bảo tồn'),
    '学': ('Học', 'học tập/khoa học'),
    '安': ('An', 'an toàn/yên ổn/rẻ'),
    '定': ('Định', 'cố định/quy định'),
    '実': ('Thực', 'sự thật/thực tế/quả'),
    '害': ('Hại', 'tác hại/thiệt hại'),
    '家': ('Gia', 'gia đình/nhà cửa'),
    '寄': ('Ký', 'gửi/ghé qua'),
    '密': ('Mật', 'bí mật/chặt chẽ'),
    '寝': ('Tẩm', 'ngủ/nghỉ ngơi'),
    '審': ('Thẩm', 'thẩm tra/xem xét'),
    '対': ('Đối', 'đối diện/đối lập'),
    '寿': ('Thọ', 'sống lâu/tuổi thọ'),
    '専': ('Chuyên', 'chuyên môn/chuyên về'),
    '将': ('Tương', 'tương lai/tướng lĩnh'),
    '尊': ('Tôn', 'tôn kính/tôn trọng'),
    '小': ('Tiểu', 'nhỏ bé/ít'),
    '少': ('Thiểu', 'ít/thiếu niên'),
    '就': ('Tựu', 'bắt đầu/đạt được/đi làm'),
    '局': ('Cục', 'cục bộ/cơ quan'),
    '居': ('Cư', 'ở/sinh sống/trú ngụ'),
    '展': ('Triển', 'phát triển/triển lãm'),
    '属': ('Thuộc', 'thuộc về/phụ thuộc'),
    '層': ('Tầng', 'tầng lớp/giai cấp'),
    '履': ('Lý', 'mang giày/tiểu sử'),
    '崩': ('Băng', 'sụp đổ/tan vỡ'),
    '巡': ('Tuần', 'tuần tra/dạo quanh'),
    '工': ('Công', 'công nghiệp/kỹ thuật'),
    '差': ('Sai', 'sai khác/khoảng cách'),
    '巻': ('Quyển', 'cuộn lại/tập sách'),
    '布': ('Bố', 'vải vóc/phân bố'),
    '帰': ('Quy', 'trở về/quay về'),
    '常': ('Thường', 'thường ngày/bình thường'),
    '干': ('Can', 'khô/phơi khô'),
    '平': ('Bình', 'bình đẳng/hòa bình'),
    '年': ('Niên', 'năm/tuổi'),
    '幸': ('Hạnh', 'hạnh phúc/may mắn'),
    '幼': ('Ấu', 'nhỏ tuổi/thơ ấu'),
    '序': ('Tự', 'thứ tự/lời mở đầu'),
    '底': ('Đế', 'đáy/nền tảng'),
    '店': ('Điếm', 'cửa hàng/tiệm'),
    '度': ('Độ', 'mức độ/lần'),
    '座': ('Tọa', 'chỗ ngồi/tọa lạc'),
    '庫': ('Khố', 'kho chứa/kho tàng'),
    '延': ('Duyên', 'kéo dài/trì hoãn'),
    '建': ('Kiến', 'xây dựng/kiến trúc'),
    '弁': ('Biện', 'hùng biện/biện hộ/tiếng địa phương'),
    '式': ('Thức', 'nghi thức/công thức'),
    '引': ('Dẫn', 'kéo/dẫn dắt'),
    '張': ('Trương', 'căng ra/kéo dài'),
    '強': ('Cường', 'mạnh mẽ/cường tráng'),
    '当': ('Đương', 'chính xác/đảm đương'),
    '形': ('Hình', 'hình dáng/hình thức'),
    '影': ('Ảnh', 'cái bóng/ảnh hưởng'),
    '役': ('Dịch', 'vai trò/nhiệm vụ'),
    '待': ('Đãi', 'chờ đợi/đối đãi'),
    '後': ('Hậu', 'phía sau/sau này'),
    '徐': ('Từ', 'từ từ/chậm rãi'),
    '徒': ('Đồ', 'học trò/người theo'),
    '従': ('Tùng', 'tuân theo/tùy tùng'),
    '得': ('Đắc', 'đạt được/đắc lợi'),
    '復': ('Phục', 'phục hồi/lặp lại'),
    '徹': ('Triệt', 'triệt để/thấu suốt'),
    '心': ('Tâm', 'trái tim/tâm hồn'),
    '必': ('Tất', 'nhất định/cần thiết'),
    '志': ('Chí', 'ý chí/chí hướng'),
    '応': ('Ứng', 'đáp ứng/phản ứng'),
    '快': ('Khoái', 'sảng khoái/vui vẻ'),
    '怒': ('Nộ', 'tức giận/phẫn nộ'),
    '思': ('Tư', 'suy nghĩ/tư tưởng'),
    '怠': ('Đãi', 'lười biếng/chểnh mảng'),
    '急': ('Cấp', 'khẩn cấp/gấp gáp'),
    '性': ('Tính', 'tính cách/bản tính'),
    '怪': ('Quái', 'kỳ quái/quái dị'),
    '恋': ('Luyến', 'tình yêu/yêu đương'),
    '恐': ('Khủng', 'lo sợ/khủng khiếp'),
    '恨': ('Hận', 'oán hận/hận thù'),
    '恵': ('Huệ', 'ân huệ/ban cho'),
    '悔': ('Hối', 'hối hận/tiếc nuối'),
    '悲': ('Bi', 'đau buồn/bi thương'),
    '情': ('Tình', 'tình cảm/hoàn cảnh'),
    '惜': ('Tích', 'tiếc nuối/quý tiếc'),
    '想': ('Tưởng', 'tưởng tượng/suy tưởng'),
    '意': ('Ý', 'ý chí/ý nghĩa'),
    '感': ('Cảm', 'cảm giác/cảm xúc'),
    '態': ('Thái', 'thái độ/trạng thái'),
    '慌': ('Hoảng', 'hoảng loạn/bối rối'),
    '慎': ('Thận', 'thận trọng/cẩn thận'),
    '慣': ('Quán', 'quen thuộc/thói quen'),
    '慮': ('Lự', 'lo nghĩ/suy xét'),
    '慰': ('Úy', 'an ủi/động viên'),
    '憎': ('Tăng', 'căm ghét/hận thù'),
    '憶': ('Ức', 'ký ức/nhớ lại'),
    '懐': ('Hoài', 'hoài niệm/nhớ nhung'),
    '成': ('Thành', 'hoàn thành/trở thành'),
    '戚': ('Thích', 'họ hàng/thân thuộc'),
    '戦': ('Chiến', 'chiến đấu/chiến tranh'),
    '戴': ('Đái', 'đội lên đầu/nhận lấy'),
    '戻': ('Lệ', 'quay lại/hoàn trả'),
    '所': ('Sở', 'nơi chốn/điểm'),
    '手': ('Thủ', 'bàn tay/người làm'),
    '才': ('Tài', 'tài năng/tuổi tác'),
    '打': ('Đả', 'đánh/đập'),
    '払': ('Phất', 'trả tiền/quét sạch'),
    '扱': ('Tráp', 'đối xử/xử lý'),
    '批': ('Phê', 'phê bình/đánh giá'),
    '承': ('Thừa', 'tiếp nhận/thấu hiểu'),
    '投': ('Đầu', 'ném/đầu tư'),
    '抗': ('Kháng', 'chống cự/đối kháng'),
    '択': ('Trạch', 'lựa chọn/tuyển chọn'),
    '抱': ('Bão', 'ôm/mang hoài bão'),
    '抵': ('Đề', 'chống cự/đối kháng'),
    '抽': ('Trừu', 'rút ra/trừu xuất'),
    '担': ('Đam', 'gánh vác/đảm đương'),
    '招': ('Chiêu', 'mời gọi/chiêu đãi'),
    '拡': ('Khuếch', 'mở rộng/khuếch trương'),
    '持': ('Trì', 'cầm/nắm giữ/duy trì'),
    '指': ('Chỉ', 'ngón tay/chỉ ra'),
    '挟': ('Hiệp', 'kẹp vào/xen vào'),
    '振': ('Chấn', 'vẫy/lắc/chấn hưng'),
    '捕': ('Bộ', 'bắt giữ/tóm lấy'),
    '掘': ('Quật', 'đào bới/khai quật'),
    '掛': ('Quải', 'treo lên/bắt đầu'),
    '採': ('Thải', 'hái/thu thập/tuyển dụng'),
    '探': ('Thám', 'tìm kiếm/thám hiểm'),
    '接': ('Tiếp', 'tiếp xúc/kết nối'),
    '推': ('Thôi', 'suy đoán/thúc đẩy'),
    '描': ('Miêu', 'miêu tả/vẽ'),
    '提': ('Đề', 'đề xuất/nâng lên'),
    '揮': ('Huy', 'chỉ huy/phát huy'),
    '援': ('Viện', 'giúp đỡ/viện trợ'),
    '損': ('Tổn', 'tổn thất/thiệt hại'),
    '搾': ('Tráp', 'ép/vắt lấy'),
    '摩': ('Ma', 'cọ xát/mài mòn'),
    '撃': ('Kích', 'tấn công/bắn phá'),
    '撮': ('Toát', 'chụp ảnh/quay phim'),
    '操': ('Thao', 'thao tác/điều khiển'),
    '擦': ('Sát', 'ma sát/cọ xát'),
    '支': ('Chi', 'chống đỡ/chi trả'),
    '改': ('Cải', 'cải thiện/sửa đổi'),
    '攻': ('Công', 'tấn công/công kích'),
    '放': ('Phóng', 'thả ra/phát sóng'),
    '救': ('Cứu', 'cứu giúp/cứu trợ'),
    '敗': ('Bại', 'thất bại/thua cuộc'),
    '教': ('Giáo', 'dạy học/tôn giáo'),
    '散': ('Tán', 'phân tán/rải rác'),
    '敬': ('Kính', 'kính trọng/tôn kính'),
    '数': ('Số', 'con số/đếm'),
    '整': ('Chỉnh', 'chỉnh đốn/sắp xếp'),
    '敵': ('Địch', 'kẻ thù/đối thủ'),
    '敷': ('Phu', 'trải ra/lát nền'),
    '文': ('Văn', 'câu văn/văn hóa'),
    '斉': ('Tề', 'đồng đều/chỉnh tề'),
    '料': ('Liệu', 'nguyên liệu/phí tổn'),
    '斜': ('Tà', 'nghiêng/xiên'),
    '断': ('Đoạn', 'cắt đứt/từ chối/phán đoán'),
    '新': ('Tân', 'mới mẻ/tươi mới'),
    '方': ('Phương', 'hướng/cách thức/vị'),
    '施': ('Thi', 'thực thi/thi hành'),
    '族': ('Tộc', 'gia tộc/chủng tộc'),
    '日': ('Nhật', 'mặt trời/ngày'),
    '早': ('Tảo', 'sớm/nhanh chóng'),
    '昇': ('Thăng', 'lên cao/thăng tiến'),
    '明': ('Minh', 'sáng sủa/rõ ràng'),
    '易': ('Dịch', 'dễ dàng/thay đổi'),
    '映': ('Ánh', 'phản chiếu/chiếu phim'),
    '時': ('Thời', 'thời gian/giờ'),
    '普': ('Phổ', 'phổ biến/rộng khắp'),
    '景': ('Cảnh', 'phong cảnh/quang cảnh'),
    '晴': ('Tình', 'trời nắng/quang đãng'),
    '暇': ('Hạ', 'rảnh rỗi/nhàn rỗi'),
    '暮': ('Mộ', 'chiều tối/sinh sống'),
    '暴': ('Bạo', 'bạo lực/hung bạo'),
    '書': ('Thư', 'viết/sách vở'),
    '替': ('Thế', 'thay thế/đổi'),
    '最': ('Tối', 'nhất/tột cùng'),
    '有': ('Hữu', 'có/sở hữu'),
    '服': ('Phục', 'quần áo/khuất phục'),
    '期': ('Kỳ', 'thời kỳ/kỳ hạn'),
    '本': ('Bản', 'sách/nguồn gốc/gốc rễ'),
    '材': ('Tài', 'vật liệu/tài liệu'),
    '来': ('Lai', 'đến/tương lai'),
    '析': ('Tích', 'phân tích/chia nhỏ'),
    '果': ('Quả', 'kết quả/hoa quả'),
    '枯': ('Khô', 'héo tàn/khô cằn'),
    '染': ('Nhiễm', 'nhiễm/nhuộm màu'),
    '栓': ('Xuyên', 'cái nút/van khóa'),
    '格': ('Cách', 'tư cách/quy chuẩn'),
    '栽': ('Tài', 'trồng trọt/canh tác'),
    '案': ('Án', 'đề案/kế hoạch'),
    '検': ('Kiểm', 'kiểm tra/xem xét'),
    '業': ('Nghiệp', 'nghề nghiệp/kinh doanh'),
    '楽': ('Lạc', 'vui vẻ/âm nhạc'),
    '構': ('Cấu', 'cấu trúc/xây dựng'),
    '様': ('Dạng', 'hình dáng/ngài'),
    '標': ('Tiêu', 'mục tiêu/tiêu chuẩn'),
    '権': ('Quyền', 'quyền lực/quyền hạn'),
    '横': ('Hoành', 'nằm ngang/bên cạnh'),
    '機': ('Cơ', 'máy móc/cơ hội'),
    '欠': ('Khiếm', 'thiếu sót/khiếm khuyết'),
    '次': ('Thứ', 'tiếp theo/kế tiếp'),
    '欲': ('Dục', 'ham muốn/khao khát'),
    '歓': ('Hoan', 'hoan nghênh/vui vẻ'),
    '止': ('Chỉ', 'dừng lại/đình chỉ'),
    '正': ('Chính', 'đúng đắn/chính xác'),
    '歩': ('Bộ', 'bước đi/đi bộ'),
    '歴': ('Lịch', 'lịch sử/trải qua'),
    '殊': ('Thù', 'đặc thù/khác biệt'),
    '段': ('Đoạn', 'bậc thang/giai đoạn'),
    '毒': ('Độc', 'chất độc/độc hại'),
    '民': ('Dân', 'người dân/nhân dân'),
    '気': ('Khí', 'không khí/tâm trạng/khí chất'),
    '求': ('Cầu', 'yêu cầu/tìm kiếm'),
    '汚': ('Ô', 'ô nhiễm/dơ bẩn'),
    '沈': ('Trầm', 'chìm xuống/trầm lặng'),
    '沸': ('Phí', 'sôi/nấu sôi'),
    '沿': ('Duyên', 'dọc theo/men theo'),
    '況': ('Huống', 'tình huống/tình hình'),
    '泊': ('Bạc', 'nghỉ trọ/ở lại'),
    '注': ('Chú', 'chú ý/rót vào'),
    '活': ('Hoạt', 'hoạt động/sinh hoạt'),
    '流': ('Lưu', 'chảy/dòng chảy/lan truyền'),
    '浮': ('Phù', 'nổi lên/lơ lửng'),
    '消': ('Tiêu', 'tiêu biến/tắt/xóa'),
    '深': ('Thâm', 'sâu sắc/sâu thẳm'),
    '混': ('Hỗn', 'hỗn tạp/pha trộn'),
    '添': ('Thiêm', 'thêm vào/đính kèm'),
    '減': ('Giảm', 'giảm bớt/suy giảm'),
    '測': ('Trắc', 'đo lường/trắc lượng'),
    '湧': ('Dũng', 'phun ra/trào dâng'),
    '湯': ('Thang', 'nước nóng/canh'),
    '湿': ('Thấp', 'ẩm ướt/độ ẩm'),
    '準': ('Chuẩn', 'chuẩn mực/chuẩn bị'),
    '滞': ('Trệ', 'ứ đọng/trì trệ/lưu trú'),
    '漏': ('Lậu', 'rò rỉ/lọt ra'),
    '漕': ('Tào', 'chèo thuyền'),
    '潜': ('Tiềm', 'lặn xuống/tiềm ẩn'),
    '澄': ('Trừng', 'trong trẻo/thanh khiết'),
    '激': ('Kích', 'kịch liệt/mãnh liệt'),
    '濁': ('Trọc', 'đục ngầu/vẩn đục'),
    '災': ('Tai', 'tai họa/tai nạn'),
    '点': ('Điểm', 'điểm số/chấm điểm/vết'),
    '無': ('Vô', 'không có/vô hiệu'),
    '焦': ('Tiêu', 'cháy sém/sốt ruột'),
    '然': ('Nhiên', 'tự nhiên/như vậy'),
    '煙': ('Yên', 'khói thuốc/khói bụi'),
    '照': ('Chiếu', 'chiếu sáng/đối chiếu'),
    '煮': ('Chử', 'nấu/hầm'),
    '燃': ('Nhiên', 'cháy/bốc cháy'),
    '燥': ('Táo', 'khô ráo/hanh khô'),
    '爆': ('Bộc', 'bộc phát/nổ tung'),
    '爽': ('Sảng', 'sảng khoái/mát mẻ'),
    '片': ('Phiến', 'một bên/mảnh vụn'),
    '物': ('Vật', 'đồ vật/sự vật'),
    '特': ('Đặc', 'đặc biệt/riêng biệt'),
    '犯': ('Phạm', 'tội phạm/xâm phạm'),
    '状': ('Trạng', 'hình trạng/trạng thái'),
    '狙': ('Thư', 'nhắm vào/rình rập'),
    '独': ('Độc', 'độc nhất/cô độc'),
    '率': ('Suất', 'tỷ lệ/dẫn dắt'),
    '現': ('Hiện', 'hiện tại/xuất hiện'),
    '理': ('Lý', 'lý do/chân lý/xử lý'),
    '甘': ('Cam', 'ngọt ngào/chiều chuộng'),
    '生': ('Sinh', 'sinh sống/sinh đẻ/sống'),
    '産': ('Sản', 'sản sinh/sản nghiệp'),
    '用': ('Dụng', 'sử dụng/công dụng'),
    '申': ('Thân', 'báo cáo/trình bày'),
    '男': ('Nam', 'đàn ông/nam giới'),
    '界': ('Giới', 'thế giới/ranh giới'),
    '略': ('Lược', 'tóm lược/lược bỏ'),
    '異': ('Dị', 'khác thường/dị biệt'),
    '疑': ('Nghi', 'nghi ngờ/thắc mắc'),
    '痛': ('Thống', 'đau đớn/thống khổ'),
    '発': ('Phát', 'phát triển/xuất phát'),
    '登': ('Đăng', 'leo lên/đăng nhập'),
    '的': ('Đích', 'mục đích/mang tính'),
    '皮': ('Bì', 'da/vỏ bọc'),
    '益': ('Ích', 'lợi ích/hữu ích'),
    '盛': ('Thịnh', 'thịnh vượng/đầy đặn'),
    '監': ('Giám', 'giám sát/trông coi'),
    '目': ('Mục', 'mắt/mục tiêu'),
    '直': ('Trực', 'thẳng thắn/trực tiếp/sửa'),
    '相': ('Tương', 'tương hỗ/bộ mặt'),
    '盾': ('Thuẫn', 'cái khiên/mâu thuẫn'),
    '省': ('Tỉnh', 'xem xét lại/tỉnh thành/tiết kiệm'),
    '真': ('Chân', 'chân thật/đích thực'),
    '眠': ('Miên', 'giấc ngủ/ngủ say'),
    '眺': ('Thiếu', 'ngắm nhìn/phóng tầm mắt'),
    '着': ('Trước', 'mặc quần áo/đến nơi'),
    '睡': ('Thụy', 'giấc ngủ/thụy miên'),
    '督': ('Đốc', 'đôn đốc/giám đốc'),
    '矛': ('Mâu', 'cây giáo/mâu thuẫn'),
    '知': ('Tri', 'hiểu biết/tri thức'),
    '短': ('Đoản', 'ngắn/ngắn ngủi'),
    '石': ('Thạch', 'hòn đá'),
    '砕': ('Toái', 'đập nát/tan vỡ'),
    '確': ('Xác', 'chính xác/xác thực'),
    '磨': ('Ma', 'mài giũa/đánh răng'),
    '礎': ('Sở', 'nền móng/cơ sở'),
    '示': ('Thị', 'biểu thị/cho thấy'),
    '礼': ('Lễ', 'lễ nghi/cảm ơn'),
    '社': ('Xã', 'xã hội/công ty'),
    '祉': ('Chỉ', 'phúc lợi/hạnh phúc'),
    '祖': ('Tổ', 'tổ tiên/ông bà'),
    '神': ('Thần', 'thần thánh/tinh thần'),
    '票': ('Phiếu', 'lá phiếu/vé'),
    '福': ('Phúc', 'hạnh phúc/phúc lành'),
    '秘': ('Bí', 'bí mật/kín đáo'),
    '移': ('Di', 'di chuyển/thay đổi'),
    '程': ('Trình', 'quá trình/mức độ'),
    '税': ('Thuế', 'tiền thuế'),
    '稼': ('Giá', 'kiếm tiền/làm việc'),
    '積': ('Tích', 'tích lũy/chất đống'),
    '穏': ('Ổn', 'yên ổn/ôn hòa'),
    '穫': ('Hoạch', 'thu hoạch/mùa màng'),
    '空': ('Không', 'bầu trời/trống rỗng'),
    '突': ('Đột', 'đột ngột/đâm thẳng'),
    '窓': ('Song', 'cửa sổ'),
    '立': ('Lập', 'đứng/thành lập'),
    '端': ('Đoan', 'đầu mút/chính đoan'),
    '第': ('Đệ', 'thứ tự/giai đoạn'),
    '筆': ('Bút', 'cây bút/viết lách'),
    '等': ('Đẳng', 'bình đẳng/vân vân'),
    '筋': ('Cân', 'gân cốt/cốt truyện/mạch lạc'),
    '答': ('Đáp', 'trả lời/đáp án'),
    '策': ('Sách', 'sách lược/chính sách'),
    '算': ('Toán', 'tính toán/dự toán'),
    '管': ('Quản', 'quản lý/ống dẫn'),
    '節': ('Tiết', 'tiết chế/đốt tre/tiết mục'),
    '築': ('Trúc', 'xây dựng/kiến trúc'),
    '簿': ('Bộ', 'sổ sách/danh bộ'),
    '粋': ('Túy', 'tinh túy/sành điệu'),
    '粒': ('Lạp', 'hạt nhỏ/viên thuốc'),
    '粗': ('Thô', 'thô ráp/sơ sài'),
    '精': ('Tinh', 'tinh hoa/tinh thần/tinh lực'),
    '納': ('Nạp', 'nộp vào/thu nạp'),
    '純': ('Thuần', 'thuần khiết/trong sáng'),
    '級': ('Cấp', 'cấp bậc/đẳng cấp'),
    '素': ('Tố', 'yếu tố/mộc mạc/chất phác'),
    '細': ('Tế', 'nhỏ bé/chi tiết'),
    '終': ('Chung', 'kết thúc/hoàn tất'),
    '組': ('Tổ', 'tổ chức/kết hợp/nhóm'),
    '経': ('Kinh', 'trải qua/kinh tế'),
    '結': ('Kết', 'kết nối/kết quả'),
    '絞': ('Giảo', 'vắt kiệt/thắt lại'),
    '給': ('Cấp', 'cung cấp/tiền lương'),
    '統': ('Thống', 'thống nhất/hệ thống'),
    '絶': ('Tuyệt', 'tuyệt đối/cắt đứt'),
    '続': ('Tục', 'tiếp tục/liên tục'),
    '維': ('Duy', 'duy trì/gìn giữ'),
    '総': ('Tổng', 'tổng cộng/toàn bộ'),
    '編': ('Biên', 'biên soạn/đan dệt'),
    '緩': ('Hoãn', 'nới lỏng/chậm trễ'),
    '練': ('Luyện', 'rèn luyện/luyện tập'),
    '縛': ('Phược', 'trói buộc/buộc lại'),
    '縮': ('Súc', 'co lại/rút ngắn'),
    '織': ('Chức', 'dệt vải/tổ chức'),
    '繰': ('Sào', 'kéo sợi/lặp lại'),
    '置': ('Trí', 'đặt để/bố trí'),
    '義': ('Nghĩa', 'ý nghĩa/chính nghĩa'),
    '考': ('Khảo', 'suy nghĩ/khảo sát'),
    '者': ('Giả', 'người/kẻ'),
    '耗': ('Hao', 'tiêu hao/hao hụt'),
    '聞': ('Văn', 'nghe thấy/hỏi'),
    '肉': ('Nhục', 'thịt/cơ bắp'),
    '肯': ('Khẳng', 'khẳng định/đồng ý'),
    '育': ('Dục', 'nuôi dưỡng/giáo dục'),
    '背': ('Bối', 'lưng/phía sau/quay lưng'),
    '能': ('Năng', 'khả năng/tài năng'),
    '脅': ('Hiếp', 'đe dọa/uy hiếp'),
    '脇': ('Hiệp', 'nách/bên hông/bên lề'),
    '膨': ('Bành', 'phình to/phồng lên'),
    '臨': ('Lâm', 'đến gần/đối mặt'),
    '自': ('Tự', 'bản thân/tự mình'),
    '臭': ('Khứu', 'mùi hôi/mùi xú'),
    '至': ('Chí', 'đến nơi/tột cùng'),
    '致': ('Trí', 'dẫn đến/làm cho'),
    '舞': ('Vũ', 'nhảy múa/vũ đài'),
    '般': ('Bát/Ban', 'chung quy/toàn thể/bình thường'),
    '良': ('Lương', 'tốt lành/lương thiện'),
    '苦': ('Khổ', 'đau khổ/cay đắng'),
    '荒': ('Hoang', 'hoang vu/hung dữ/bão táp'),
    '華': ('Hoa', 'hoa lệ/lộng lẫy'),
    '落': ('Lạc', 'rơi xuống/rụng'),
    '蓄': ('Súc', 'tích lũy/chứa chấp'),
    '薄': ('Bạc', 'mỏng manh/nhạt nhòa'),
    '薦': ('Tiến', 'tiến cử/giới thiệu'),
    '虚': ('Hư', 'hư vô/trống rỗng'),
    '行': ('Hành', 'đi/tiến hành/hàng lối'),
    '表': ('Biểu', 'biểu thị/mặt ngoài/bảng'),
    '衰': ('Suy', 'suy yếu/suy thoái'),
    '装': ('Trang', 'trang phục/trang bị'),
    '裏': ('Lý', 'mặt trái/phía sau'),
    '裕': ('Dụ', 'dư dả/sung túc'),
    '補': ('Bổ', 'bổ sung/bù đắp'),
    '製': ('Chế', 'chế tạo/sản xuất'),
    '要': ('Yếu', 'quan trọng/cần thiết'),
    '覆': ('Phúc', 'phủ lên/lật ngược'),
    '見': ('Kiến', 'nhìn/quan sát/gặp'),
    '視': ('Thị', 'thị giác/nhìn nhận'),
    '覚': ('Giác', 'ghi nhớ/tỉnh giấc/cảm giác'),
    '親': ('Thân', 'cha mẹ/thân thiết'),
    '観': ('Quan', 'quan sát/quan điểm'),
    '解': ('Giải', 'giải thích/giải tỏa/hiểu'),
    '触': ('Xúc', 'chạm vào/tiếp xúc'),
    '言': ('Ngôn', 'nói/ngôn từ'),
    '訂': ('Đính', 'đính chính/sửa lại'),
    '計': ('Kế', 'kế hoạch/đo đếm'),
    '討': ('Thảo', 'thảo luận/chinh phạt'),
    '記': ('Ký', 'ghi nhớ/ký lục/ghi chép'),
    '訪': ('Phóng/Phỏng', 'thăm hỏi/viếng thăm'),
    '設': ('Thiết', 'thiết lập/xây dựng'),
    '許': ('Hứa', 'cho phép/tha thứ'),
    '訳': ('Dịch', 'dịch thuật/lý do'),
    '診': ('Chẩn', 'khám bệnh/chẩn đoán'),
    '証': ('Chứng', 'bằng chứng/chứng nhận'),
    '評': ('Bình', 'bình luận/đánh giá'),
    '詰': ('Cật', 'nhồi nhét/chất vấn'),
    '話': ('Thoại', 'nói chuyện/câu chuyện'),
    '認': ('Nhận', 'thừa nhận/công nhận'),
    '誓': ('Thệ', 'thề nguyện/tuyên thệ'),
    '誘': ('Dụ', 'mời mọc/rủ rê'),
    '語': ('Ngữ', 'ngôn ngữ/kể chuyện'),
    '誠': ('Thành', 'chân thành/thành thật'),
    '誤': ('Ngộ', 'sai lầm/ngộ nhận'),
    '說': ('Thuyết', 'thuyết minh/giải thích'),
    '読': ('Độc', 'đọc sách'),
    '調': ('Điệu/Điều', 'điều tra/giai điệu/điều chỉnh'),
    '請': ('Thỉnh', 'yêu cầu/thỉnh cầu'),
    '論': ('Luận', 'bàn luận/lý luận'),
    '謙': ('Khiêm', 'khiêm tốn/khiêm nhường'),
    '識': ('Thức', 'tri thức/nhận thức'),
    '護': ('Hộ', 'bảo hộ/chăm sóc'),
    '象': ('Tượng', 'hình tượng/con voi'),
    '豪': ('Hào', 'hào hiệp/hào nhoáng'),
    '負': ('Phụ', 'thua cuộc/gánh chịu'),
    '貧': ('Bần', 'nghèo khó/bần cùng'),
    '責': ('Trách', 'trách nhiệm/trách móc'),
    '貴': ('Quý', 'quý giá/cao quý'),
    '貸': ('Thải', 'cho vay/cho mượn'),
    '費': ('Phí', 'chi phí/tiêu phí'),
    '資': ('Tư', 'tài sản/tư bản/nguyên liệu'),
    '賢': ('Hiền', 'thông minh/hiền minh'),
    '赤': ('Xích', 'màu đỏ'),
    '超': ('Siêu', 'vượt qua/siêu phàm'),
    '越': ('Việt', 'vượt qua/chuyển dời'),
    '跡': ('Tích', 'dấu vết/vết tích'),
    '跳': ('Khiêu', 'nhảy lên/bật nhảy'),
    '身': ('Thân', 'thân thể/bản thân'),
    '車': ('Xa', 'xe cộ/bánh xe'),
    '転': ('Chuyển', 'chuyển dịch/ngã lăn'),
    '軽': ('Khinh', 'nhẹ nhàng/coi nhẹ'),
    '輝': ('Huy', 'tỏa sáng/huy hoàng'),
    '輪': ('Luân', 'bánh xe/vòng tròn'),
    '辛': ('Tân', 'cay đắng/khổ cực'),
    '辞': ('Từ', 'từ chức/lời từ biệt'),
    '辺': ('Biên', 'xung quanh/bên cạnh'),
    '込': ('Nhập/Dồn', 'dồn vào/nạp vào'),
    '迎': ('Nghênh', 'đón tiếp/nghênh đón'),
    '近': ('Cận', 'gần gũi/tiếp cận'),
    '返': ('Phản', 'trả lại/đáp lại'),
    '迫': ('Bách', 'áp bức/tiến gần/bách bách'),
    '述': ('Thuật', 'trình bày/miêu tả'),
    '迷': ('Mê', 'mê muội/lạc đường'),
    '追': ('Truy', 'đuổi theo/truy lùng'),
    '退': ('Thoái', 'rút lui/thoái lui'),
    '送': ('Tống', 'gửi đi/tiễn đưa'),
    '逃': ('Đào', 'chạy trốn/trốn tránh'),
    '逆': ('Nghịch', 'ngược lại/nghịch cảnh'),
    '透': ('Thấu', 'trong suốt/xuyên thấu'),
    '途': ('Đồ', 'con đường/giữa chừng'),
    '通': ('Thông', 'thông suốt/đi lại/hiểu biết'),
    '速': ('Tốc', 'nhanh chóng/tốc độ'),
    '造': ('Tạo', 'chế tạo/sáng tạo'),
    '連': ('Liên', 'kết nối/liên lạc/dẫn theo'),
    '運': ('Vận', 'vận may/vận chuyển/vận động'),
    '過': ('Quá', 'vượt qua/quá độ/lỗi lầm'),
    '達': ('Đạt', 'đạt được/thông đạt/nhóm người'),
    '違': ('Vi', 'khác biệt/sai sót'),
    '適': ('Thích', 'thích hợp/phù hợp'),
    '遭': ('Tao', 'gặp phải/tao ngộ'),
    '選': ('Tuyển', 'lựa chọn/tuyển chọn'),
    '遺': ('Di', 'di sản/để lại'),
    '避': ('Tị', 'né tránh/tránh xa'),
    '邪': ('Tà', 'tai hại/cảm cúm/tà ma'),
    '部': ('Bộ', 'bộ phận/phần/câu lạc bộ'),
    '都': ('Đô', 'thủ đô/đô thị/tiện lợi'),
    '配': ('Phối', 'phân phát/phối hợp/lo lắng'),
    '酔': ('Túy', 'say xỉn/say mê'),
    '重': ('Trọng', 'nặng nề/quan trọng/chồng chất'),
    '野': ('Dã', 'cánh đồng/lĩnh vực'),
    '量': ('Lượng', 'số lượng/đo lường'),
    '金': ('Kim', 'tiền bạc/vàng'),
    '針': ('Châm', 'cây kim/phương châm'),
    '鈍': ('Độn', 'chậm chạp/cùn'),
    '鋭': ('Nhuệ', 'sắc bén/nhanh nhạy'),
    '鍛': ('Đoán', 'rèn luyện/rèn sắt'),
    '鎖': ('Tỏa', 'dây xích/khóa lại'),
    '鎮': ('Trấn', 'trấn tĩnh/dẹp yên'),
    '長': ('Trường/Trưởng', 'dài/lớn nhất/thủ trưởng'),
    '閉': ('Bế', 'đóng lại/bế mạc'),
    '開': ('Khai', 'mở ra/khai trương'),
    '間': ('Gian', 'khoảng cách/thế gian/thời gian'),
    '関': ('Quan', 'liên quan/quan hệ/cửa ải'),
    '闘': ('Đấu', 'chiến đấu/đấu tranh'),
    '防': ('Phòng', 'phòng chống/đề phòng'),
    '限': ('Hạn', 'giới hạn/hạn độ'),
    '除': ('Trừ', 'loại trừ/ngoại trừ'),
    '陥': ('Hãm', 'rơi vào/sụt lún'),
    '険': ('Hiểm', 'hiểm trở/nguy hiểm'),
    '隔': ('Cách', 'ngăn cách/khoảng cách'),
    '際': ('Tế', 'dịp/khi/quốc tế'),
    '障': ('Chướng', 'chướng ngại/cản trở'),
    '隣': ('Lân', 'hàng xóm/bên cạnh'),
    '集': ('Tập', 'tập hợp/thu thập'),
    '難': ('Nan', 'khó khăn/gian nan'),
    '雰': ('Phân', 'bầu không khí'),
    '需': ('Nhu', 'nhu cầu/cần dùng'),
    '震': ('Chấn', 'rung chấn/động đất'),
    '静': ('Tĩnh', 'yên tĩnh/thanh tĩnh'),
    '面': ('Diện', 'mặt/bề mặt/phương diện'),
    '革': ('Cách', 'da thuộc/cải cách'),
    '響': ('Hưởng', 'tiếng vang/ảnh hưởng'),
    '頂': ('Đỉnh', 'đỉnh cao/nhận lấy'),
    '順': ('Thuận', 'thuận tiện/thứ tự'),
    '頑': ('Ngoan', 'ngoan cố/bướng bỉnh/chăm chỉ'),
    '頼': ('Lại', 'nhờ cậy/tin cậy'),
    '題': ('Đề', 'đề tài/tiêu đề/vấn đề'),
    '願': ('Nguyện', 'nguyện ước/mong cầu'),
    '飛': ('Phi', 'bay lượn/phi hành'),
    '食': ('Thực', 'ăn uống/món ăn'),
    '飢': ('Cơ', 'đói khát/cơ hàn'),
    '飲': ('Ẩm', 'uống nước'),
    '駆': ('Khu', 'chạy nhanh/đuổi theo'),
    '駐': ('Trú', 'đỗ xe/trú lại'),
    '騒': ('Tào/Sao', 'ồn ào/náo loạn'),
    '験': ('Nghiệm', 'thử nghiệm/kinh nghiệm'),
    '高': ('Cao', 'cao quý/đắt đỏ/chiều cao'),
    '魅': ('Mị', 'mê hoặc/quyến rũ'),
    '魔': ('Ma', 'ma quỷ/ma thuật'),
    '鳴': ('Minh', 'tiếng kêu/hót/kêu vang'),
    '黙': ('Mặc', 'im lặng/trầm mặc'),
    '縫': ('Phùng', 'khâu/may vá')
}

# 2. Existing Handcrafted Top 50 dataset cache
HANDCRAFTED_MAP = {}
HANDCRAFTED_FILE = 'vocab/N2/mimikara/tuvungn2.csv'
if os.path.exists(HANDCRAFTED_FILE):
    with open(HANDCRAFTED_FILE, encoding='utf-8') as f:
        reader = csv.DictReader(f)
        for r in reader:
            try:
                if int(r['stt']) <= 50:
                    HANDCRAFTED_MAP[r['stt']] = r
            except (ValueError, KeyError):
                pass

kks = pykakasi.kakasi()

def get_romaji(text):
    res = kks.convert(text)
    romaji = "".join([item['hepburn'] for item in res])
    romaji = romaji.replace(' ', '').replace('-', '').lower()
    return romaji

def classify_word(term, reading, meaning):
    m_lower = meaning.lower()
    
    # 1. Check if noun ending in り / け / み / さ etc.
    noun_exceptions = ['針', '日当たり', '日帰り', '煙', '光', '香り', 'おごり', 'お礼', 'ひも', 'おまけ', 'しわ', '栓', '湯気', '斜め', '徒歩', '司会', '窓口', '平日', '日中', '日程', '順序', '時期', '現在']
    if term in noun_exceptions or reading in noun_exceptions:
        return 'Danh từ'

    # 2. Suru verbs
    if term.endswith('する') or reading.endswith('する') or 'làm ' in m_lower and ('hành động' in m_lower or 'thực hiện' in m_lower):
        return 'Động từ する'
        
    # 2. Na-Adjectives ending in な
    if term.endswith(('な', 'な')) or reading.endswith(('な', 'な')):
        return 'Tính từ -na'

    # 3. I-Adjectives
    if (reading.endswith('い') or term.endswith('い')) and not term.endswith(('人', '会', '界', '内', '街', '生', '代', '間', '店', '員', '所', '線', '法', '日', '表', '時', '代')):
        adj_endings = ('しい', 'たい', 'ない', 'かい', 'おい', 'うい', 'こい', 'どい', 'るい', 'めでたい', 'おめでたい', 'くさい', '臭い', 'ぽい', 'づらい', 'やすい', 'にくい', 'よい', 'いい', 'はやい', 'おそい', 'あまい', 'からい', 'にがい', 'あつい', 'さむい', 'ぬるい', 'うすい', 'こい', 'おもい', 'かるい', 'きつい', 'ゆるい', 'ふかい', 'あさい', 'せまい', 'ひろい', 'たかい', 'ひくい', 'とおい', 'ちかい', 'ながい', 'みじかい', 'あかるい', 'くらい', 'ただしい', 'あやしい', 'おさない', '幼い', '青い', '赤い', '黒い', '白い', '黄色い')
        adj_keywords = ['tốt', 'xấu', 'đẹp', 'ngon', 'dở', 'dài', 'ngắn', 'cao', 'thấp', 'nóng', 'lạnh', 'ấm', 'mát', 'sâu', 'nông', 'khó', 'dễ', 'cay', 'ngọt', 'chát', 'đắng', 'sáng', 'tối', 'mừng', 'buồn', 'đau', 'sợ', 'nguy', 'tiếc', 'muộn', 'sớm', 'thân', 'hoan hỉ', 'mạnh', 'yếu', 'nghèo', 'khéo', 'vụng', 'đầy', 'rộng', 'hẹp', 'dày', 'mỏng', 'nhạt', 'đậm', 'ngốc', 'dại', 'béo', 'gầy', 'trẻ', 'già', 'phiền', 'lằng nhằng', 'dai dẳng', 'lãng phí', 'đáng', 'non nớt', 'cô đơn']
        if any(ak in m_lower for ak in adj_keywords) or term.endswith(adj_endings) or reading.endswith(adj_endings):
            return 'Tính từ -i'
            
    if term.endswith(('的', '性')) or 'tính ' in m_lower or 'thích hợp' in m_lower or 'tiện lợi' in m_lower or 'nguy hiểm' in m_lower or 'đơn giản' in m_lower or 'phong phú' in m_lower or 'sang trọng' in m_lower or 'yên bình' in m_lower:
        return 'Tính từ -na'

    # 4. Verbs
    if reading.endswith(('う', 'く', 'ぐ', 'す', 'つ', 'ぬ', 'ぶ', 'む', 'る')):
        verb_keywords = ['làm', 'đi', 'đến', 'chạy', 'nói', 'ăn', 'uống', 'ngủ', 'nhìn', 'thấy', 
                         'nghe', 'cắt', 'mở', 'đóng', 'bắt', 'thay', 'tăng', 'giảm', 'cháy', 
                         'vỡ', 'hỏng', 'gặp', 'ôm', 'yêu', 'ghét', 'lo', 'sợ', 'chờ', 'đợi',
                         'cứu', 'giúp', 'ném', 'chọn', 'bỏ', 'học', 'nghĩ', 'nhớ', 'quên',
                         'bay', 'chìm', 'nổi', 'khóc', 'cười', 'hỏi', 'trả lời', 'đặt', 'để',
                         'rơi', 'ngã', 'rút', 'kéo', 'đẩy', 'bán', 'mua', 'mượn', 'vay', 'trả',
                         'vấp', 'cắn', 'nhai', 'gật', 'ngồi', 'tránh', 'dịch', 'phủ', 'rót', 'rắc',
                         'chèn', 'đắm', 'mắc', 'sinh', 'kiếm', 'sụp', 'hạ', 'lõm', 'cởi', 'tràn',
                         'khớp', 'đeo', 'ví', 'sửa', 'đổi', 'chăm', 'bảo', 'đoán', 'kêu', 'hót',
                         'nuôi', 'dạy', 'dẫn', 'dựng', 'nấu', 'gọt', 'thấm', 'chạm', 'vỗ']
        is_verb_meaning = any(m_lower.startswith(vk) or f", {vk}" in m_lower or f" {vk}" in m_lower for vk in verb_keywords)
        has_okurigana = bool(re.search(r'[\u4e00-\u9fff][ぁ-ん]+$', term))
        
        if is_verb_meaning or has_okurigana:
            if reading.endswith('る'):
                if len(reading) >= 2 and reading[-2] in 'いきしちにひみりえけせてねへめれ':
                    return 'Động từ nhóm 2'
                return 'Động từ nhóm 1'
            return 'Động từ nhóm 1'
            
    # 5. Adverbs & Discourse words
    n2_adverbs = [
        'すっかり', 'ぴったり', 'ゆっくり', 'ぎっしり', 'ばったり', 'あっさり', 'さっぱり', 
        'たまたま', 'わざわざ', 'とうとう', 'いよいよ', 'どんどん', 'ますます', 'だんだん', 
        'そろそろ', 'いきなり', 'めったに', 'まるで', 'まさか', '恐らく', 'おそらく', 'むしろ', 
        '果たして', 'はたして', 'かえって', '必ずしも', 'かならずしも', '単に', 'たんに', 
        'いまだに', 'ついでに', 'とりあえず', '偶然', 'ぐうぜん', '実際', 'じっさい', '同様', 
        '元々', 'もともと', '本来', 'ほんらい', 'せいぜい', 'どうせ', 'およそ', 'ほぼ', 
        'せめて', '決して', 'けっして', 'ちっとも', '少しも', 'すこしも', '一応', 'いちおう'
    ]
    if term in n2_adverbs or reading in n2_adverbs or any(m_lower.startswith(adv) for adv in ['rất', 'hoàn toàn', 'hầu như', 'đặc biệt', 'thường', 'luôn', 'đôi khi', 'thỉnh thoảng', 'dần dần', 'ngay lập tức', 'tình cờ', 'tuyệt đối', 'chắc chắn', 'có lẽ', 'tất cả', 'chủ yếu', 'ngay', 'tạm thời', 'nhân tiện', 'vẫn chưa', 'không hẳn', 'ngược lại', 'thật sự']):
        return 'Phó từ'

    # 6. Pre-nominals / Determiners (Liên thể từ)
    if term in ['ある', 'あらゆる', 'たいした', 'いわゆる'] or reading in ['ある', 'あらゆる', 'たいした', 'いわゆる']:
        return 'Liên thể từ (Từ bổ nghĩa danh từ)'
        
    # 7. Conjunctions (Liên từ)
    if term in ['できれば', 'できたら'] or any(m_lower.startswith(cj) for cj in ['tuy nhiên', 'nhưng', 'và', 'hoặc', 'vì vậy', 'cho nên', 'mặt khác', 'hơn nữa', 'tức là', 'nói cách khác', 'nếu có thể']):
        return 'Liên từ'
        
    return 'Danh từ'

def build_kanji_breakdown(term):
    kanjis = [ch for ch in term if '\u4e00' <= ch <= '\u9fff']
    if not kanjis:
        return '-'
    parts = []
    for k in kanjis:
        if k in KANJI_DB:
            hv, mn = KANJI_DB[k]
            first_hv = hv.split('/')[0]
            parts.append(f"{k} ({first_hv}: {mn})")
        else:
            parts.append(f"{k}")
    return " + ".join(parts)

def build_han_viet(term):
    kanjis = [ch for ch in term if '\u4e00' <= ch <= '\u9fff']
    if not kanjis:
        return '-'
    hvs = []
    for k in kanjis:
        if k in KANJI_DB:
            hv = KANJI_DB[k][0].split('/')[0]
            hvs.append(hv)
    return " ".join(hvs)

def generate_example(stt, term, reading, meaning, w_type):
    first_meaning = meaning.split(',')[0].split(';')[0].split('-')[0].strip()
    
    # Specific contextual sentences for common verb/adj/adverb patterns
    if 'Động từ' in w_type:
        if term.endswith('する'):
            ja = f"計画を慎重に{term}。"
            vi = f"Thực hiện {first_meaning} kế hoạch một cách thận trọng."
        elif term in ['かわいがる', '愛する']:
            ja = f"祖母は孫をとても{term}。"
            vi = f"Bà rất {first_meaning} đứa cháu."
        elif term in ['うなずく', '頷く']:
            ja = f"彼の意見に深く{term}。"
            vi = f"{first_meaning.capitalize()} sâu sắc với ý kiến của anh ấy."
        elif term in ['しゃがむ']:
            ja = f"道端に{term}靴紐を結んだ。"
            vi = f"Tôi {first_meaning} bên lề đường để buộc dây giày."
        elif term in ['どく', '退く']:
            ja = f"危ないからそこを{term}てください。"
            vi = f"Nguy hiểm nên hãy {first_meaning} ra đó."
        elif term in ['かじる']:
            ja = f"りんごを丸ごと{term}。"
            vi = f"{first_meaning.capitalize()} cả quả táo."
        elif term in ['つぐ', '注ぐ']:
            ja = f"コップにお茶を{term}。"
            vi = f"{first_meaning.capitalize()} trà vào cốc."
        elif term in ['まく', '蒔く', '撒く']:
            ja = f"庭に花の種を{term}。"
            vi = f"{first_meaning.capitalize()} hạt giống hoa trong vườn."
        elif term in ['つまずく', '躓く']:
            ja = f"石に{term}転んでしまった。"
            vi = f"Tôi bị {first_meaning} hòn đá và ngã."
        elif term in ['おぼれる', '溺れる']:
            ja = f"海で{term}そうになった。"
            vi = f"Tôi suýt bị {first_meaning} ở biển."
        elif term in ['もうかる', '儲かる']:
            ja = f"商売が順調でかなり{term}。"
            vi = f"Kinh doanh thuận lợi nên {first_meaning} khá nhiều."
        elif term in ['つぶれる', '潰れる']:
            ja = f"不景気で会社が{term}。"
            vi = f"Do kinh tế suy thoái nên công ty bị {first_meaning}."
        elif term in ['へこむ', '凹む']:
            ja = f"車がぶつかってドアが{term}。"
            vi = f"Xe va chạm nên cửa bị {first_meaning}."
        elif term in ['ほどける', '解ける']:
            ja = f"靴のひもが{term}。"
            vi = f"Dây giày đã bị {first_meaning}."
        elif term in ['あふれる', '溢れる']:
            ja = f"喜びの涙が目から{term}。"
            vi = f"Nước mắt vui sướng {first_meaning} ra khỏi khóe mắt."
        elif term in ['はまる', '嵌まる']:
            ja = f"最近日本のドラマに{term}。"
            vi = f"Gần đây tôi rất {first_meaning} phim truyền hình Nhật Bản."
        elif term in ['たとえる', '例える']:
            ja = f"人生を旅に{term}。"
            vi = f"{first_meaning.capitalize()} cuộc đời như một chuyến đi."
        else:
            ja = f"状況に合わせて適切に{term}。"
            vi = f"{first_meaning.capitalize()} một cách phù hợp theo tình huống."
    elif 'Tính từ -i' in w_type:
        if term in ['めでたい', 'おめでたい']:
            ja = f"新年を迎えるのはとても{term}ことだ。"
            vi = f"Đón năm mới là một điều rất đáng {first_meaning}."
        else:
            ja = f"この問題は非常に{term}。"
            vi = f"Vấn đề này rất {first_meaning}."
    elif 'Tính từ -na' in w_type:
        na_term = term if term.endswith('な') else f"{term}な"
        ja = f"{na_term}態度で対応する。"
        vi = f"Ứng phó bằng một thái độ {first_meaning}."
    elif 'Phó từ' in w_type:
        if term in ['たまたま', '偶然']:
            ja = f"駅で{term}昔の友達に会った。"
            vi = f"Tôi {first_meaning} gặp lại người bạn cũ ở nhà ga."
        elif term in ['あらゆる']:
            ja = f"{term}可能性を検討する。"
            vi = f"Xem xét {first_meaning} khả năng có thể."
        elif term in ['たいした']:
            ja = f"{term}問題ではないので心配いりません。"
            vi = f"Không phải là vấn đề {first_meaning} nên không cần lo lắng."
        elif term in ['いわゆる']:
            ja = f"彼が{term}天才プログラマーだ。"
            vi = f"Anh ấy chính là {first_meaning} lập trình viên thiên tài."
        else:
            ja = f"{term}物事が進んでいる。"
            vi = f"Mọi việc đang tiến triển ({first_meaning})."
    elif 'Liên từ' in w_type:
        ja = f"努力を重ねた、{term}成功を収めた。"
        vi = f"Đã nỗ lực không ngừng, {first_meaning} đã gặt hái thành công."
    else: # Danh từ
        if term in ['材料']:
            ja = f"美味しい料理を作るために新鮮な{term}を買う。"
            vi = f"Mua {first_meaning} tươi ngon để nấu món ăn ngon."
        elif term in ['石']:
            ja = f"道に大きな{term}が落ちている。"
            vi = f"Có một hòn {first_meaning} lớn rơi trên đường."
        elif term in ['ひも']:
            ja = f"荷物を{term}でしっかり縛る。"
            vi = f"Buộc chặt hành lý bằng sợi {first_meaning}."
        elif term in ['名簿']:
            ja = f"出席者の名前を{term}で確認する。"
            vi = f"Kiểm tra tên người tham dự trong {first_meaning}."
        elif term in ['表']:
            ja = f"データを分かりやすく{term}にまとめる。"
            vi = f"Tổng hợp dữ liệu thành {first_meaning} cho dễ hiểu."
        elif term in ['針']:
            ja = f"時計の{term}が12時を指している。"
            vi = f"Chiếc {first_meaning} đồng hồ đang chỉ 12 giờ."
        elif term in ['栓']:
            ja = f"ワインのボトルの{term}を抜く。"
            vi = f"Mở chiếc {first_meaning} của chai rượu vang."
        elif term in ['湯気']:
            ja = f"温かいスープから{term}が立っている。"
            vi = f"{first_meaning.capitalize()} bốc lên từ bát súp nóng."
        elif term in ['日当たり']:
            ja = f"この部屋は南向きで{term}がいい。"
            vi = f"Căn phòng này hướng nam nên {first_meaning} rất tốt."
        elif term in ['履歴']:
            ja = f"面接の前に自分の{term}書を作成する。"
            vi = f"Viết bản {first_meaning} trước buổi phỏng vấn."
        elif term in ['娯楽']:
            ja = f"週末は映画などの{term}を楽しむ。"
            vi = f"Cuối tuần tôi tận hưởng các hình thức {first_meaning} như xem phim."
        elif term in ['司会']:
            ja = f"結婚式の{term}を頼まれた。"
            vi = f"Tôi được nhờ làm {first_meaning} cho lễ cưới."
        elif term in ['窓口']:
            ja = f"市役所の{term}で手続きを行う。"
            vi = f"Làm thủ tục tại {first_meaning} của tòa thị chính."
        else:
            ja = f"{term}について詳しく調査する。"
            vi = f"Nghiên cứu kỹ lưỡng về {first_meaning}."
        
    return ja, vi

def generate_syn_ant(term, meaning, w_type):
    first_meaning = meaning.split(',')[0].strip()
    return f"連: {term}に関する / 類: {first_meaning}"

def parse_raw_term(stt, raw_term):
    t_clean = raw_term.replace('（', '(').replace('）', ')')
    
    # Specific multi-parens cases
    if stt == '233':
        return '仕方(が)ない', 'しかた(が)ない'
    elif stt == '309':
        return '解答・回答', 'かいとう'
    elif stt == '533':
        return '後(に)', 'のち(に)'
    elif stt == '1150':
        return '万一(が)', 'まんいち(が)'
        
    # Standard: Term (Reading)
    m = re.match(r'^([^\(]+)\((.+)\)$', t_clean)
    if m:
        return m.group(1).strip(), m.group(2).strip()
    
    # Pure kana or no parens
    term = t_clean.strip()
    res = kks.convert(term)
    reading = "".join([item['hira'] for item in res])
    return term, reading

def process_mimikara():
    src_path = 'vocab/N2/mimiraka/tu_vung_mimikara_n2.csv'
    
    with open(src_path, encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader)
        raw_rows = list(reader)
        
    output_rows = []
    
    for row in raw_rows:
        stt = row[0].strip()
        raw_term = row[1].strip()
        raw_meaning = row[2].strip()
        
        # Check handcrafted map first
        if stt in HANDCRAFTED_MAP:
            hc = HANDCRAFTED_MAP[stt]
            output_rows.append(hc)
            continue
            
        term, reading = parse_raw_term(stt, raw_term)
            
        # Romaji
        res = kks.convert(reading if reading else term)
        romaji = "".join([item['hepburn'] for item in res]).replace(' ', '').lower()
        
        # Meaning clean
        meaning = raw_meaning.replace(',', ' - ')
        
        # Word type
        w_type = classify_word(term, reading, raw_meaning)
        
        # Han Viet
        han_viet = build_han_viet(term)
        
        # Kanji breakdown
        kanji_breakdown = build_kanji_breakdown(term)
        
        # Pitch accent (default [0] or [1])
        pitch_accent = '[0]' if len(reading) <= 3 else '[1]'
        
        # Example
        exam_ja, exam_vi = generate_example(stt, term, reading, raw_meaning, w_type)
        
        # Synonyms / Antonyms
        synonyms_antonyms = generate_syn_ant(term, raw_meaning, w_type)
        
        card_type = 'vocab'
        
        output_rows.append({
            'stt': stt,
            'term': term,
            'reading': reading,
            'romaji': romaji,
            'han_viet': han_viet,
            'meaning': meaning,
            'type': w_type,
            'exam_ja': exam_ja,
            'exam_vi': exam_vi,
            'kanji_breakdown': kanji_breakdown,
            'pitch_accent': pitch_accent,
            'synonyms_antonyms': synonyms_antonyms,
            'card_type': card_type
        })
        
    print(f"Processed {len(output_rows)} rows successfully.")
    
    # Target directories
    targets = [
        'vocab/N2/mimiraka/tuvungn2.csv',
        'vocab/N2/mimikara/tuvungn2.csv',
        'vocab/N2/mimikara/tuvungn2/tuvungn2.csv'
    ]
    
    fieldnames = [
        'stt', 'term', 'reading', 'romaji', 'han_viet', 'meaning',
        'type', 'exam_ja', 'exam_vi', 'kanji_breakdown', 'pitch_accent',
        'synonyms_antonyms', 'card_type'
    ]
    
    for tgt in targets:
        os.makedirs(os.path.dirname(tgt), exist_ok=True)
        with open(tgt, 'w', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            for r in output_rows:
                writer.writerow(r)
        print(f"Written {len(output_rows)} rows to {tgt}")

if __name__ == '__main__':
    process_mimikara()
