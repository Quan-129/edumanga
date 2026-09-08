import os, sys
sys.stdout.reconfigure(encoding='utf-8')
for ch in range(6, 11):
    os.makedirs(f"N2/kịch bản/Chương {ch}", exist_ok=True)

# ============================================================
# CHAPTER 6: Giao thông & Đi lại | Vocab STT 196-234 | Grammar STT 31-36
# ============================================================
chuong_06 = """```text
[CHAPTER CHARACTER LORE]
- Narrator:
  + Appearance: 22 years old, 4th-year female student, thin glasses, confident.
  + Outfit: White shirt, navy blazer, carrying a digital tablet.
  + Role: Objective narrator observing urban transportation and commuter life.
- Minh:
  + Appearance: 21 years old, male student, short black hair, practical.
  + Outfit: Light grey t-shirt, dark pants, carrying a backpack and metro card.
  + Role: CS intern navigating urban transport to reach the FoodTech office daily.
- Lan:
  + Appearance: 21 years old, female art student, creative ponytail.
  + Outfit: Casual striped jacket, canvas tote bag with art prints.
  + Role: Minh's twin sister, cycling to university through the city each morning.
- Trưởng phòng Hoàng:
  + Appearance: 38 years old, sharp glasses, professional manager.
  + Outfit: Dark business suit, carrying a slim laptop bag.
  + Role: Minh's tech manager, advocating for sustainable office commuting.
- Chị Vy:
  + Appearance: 29 years old, female traffic analyst, sharp eyes, energetic.
  + Outfit: Smart casual blazer, wearing a city transit badge.
  + Role: Urban transport data researcher collaborating with Minh's team on smart routing.
```

```text
[PAGE 1 - CHAPTER THUMBNAIL]
PROMPT:
A cinematic anime manga cover. In the foreground, Minh stands confidently on a modern elevated metro platform overlooking the bustling Ho Chi Minh City skyline at sunrise. His twin sister Lan cycles along a green bike lane below. Holographic city route maps float around Minh. Dynamic urban lighting, energetic perspective, masterpiece.

TEXT OVERLAY:
NHỊP SỐNG ĐÔ THỊ

--------------------------------------------------

[PAGE 2 - SCENE]
PANEL 1:
Early morning metro station. Crowds of commuters move efficiently through turnstiles.

PANEL 2:
Minh taps his smart transit card and walks through the gate.

PANEL 3:
Narrator stands on the metro platform, observing the morning rush.

[PAGE 2 - DIALOGUE]
PANEL 1:
Narrator (Dẫn) : "Mỗi buổi sáng, hàng triệu 乗客 (じょうきゃく - Thừa Khách - hành khách) di chuyển qua hệ thống 交通機関 (こうつうきかん - Giao Thông Cơ Quan - phương tiện giao thông công cộng) hiện đại."

PANEL 2:
Minh : "Tuyến 地下鉄 (ちかてつ - Địa Hạ Thiết - tàu điện ngầm) này giúp mình tránh hoàn toàn tình trạng kẹt xe giờ cao điểm."

PANEL 3:
Narrator : "Hạ tầng giao thông thông minh đang từng bước thay đổi diện mạo đô thị Việt Nam."

--------------------------------------------------

[PAGE 3 - SCENE]
PANEL 1:
Inside the metro carriage. Passengers sit quietly, some reading, some on phones.

PANEL 2:
Minh opens his laptop on the fold-out tray, reviewing code during the commute.

PANEL 3:
The metro glides smoothly past glass skyscrapers.

[PAGE 3 - DIALOGUE]
PANEL 1:
Minh (Nghĩ) : "Thời gian di chuyển trên 車両 (しゃりょう - Xa Lượng - toa xe, phương tiện) metro là lúc mình có thể tập trung đọc tài liệu kỹ thuật nhất."

PANEL 2:
Narrator (Dẫn) : "Đường sắt đô thị đang dần trở thành 幹線 (かんせん - Cán Tuyến - tuyến đường chính) giao thông không thể thiếu của các thành phố lớn."

PANEL 3:
Minh : "Mỗi 停留所 (ていりゅうじょ - Đình Lưu Sở - trạm dừng, bến xe buýt) đều có bảng thông tin thời gian thực rất tiện lợi."

--------------------------------------------------

[PAGE 4 - SCENE]
PANEL 1:
At the office. Chị Vy presents a city traffic flow heat map on the main screen.

PANEL 2:
Minh analyzes the congestion patterns near the restaurant delivery zones.

PANEL 3:
Trưởng phòng Hoàng draws a new optimized delivery route on the digital map.

[PAGE 4 - DIALOGUE]
PANEL 1:
Chị Vy : "Bản đồ nhiệt này cho thấy các 渋滞 (じゅうたい - Sáp Trệ - ùn tắc giao thông) xảy ra chủ yếu tại các nút giao 交差点 (こうさてん - Giao Soa Điểm - ngã tư) vào giờ tan tầm."

PANEL 2:
Minh : "Thuật toán định tuyến của em có thể tự động 回避 (かいひ - Hồi Tỵ - né tránh, phòng tránh) các khu vực tắc nghẽn và đề xuất 迂回路 (うかいろ - Vũ Hồi Lộ - đường vòng) tối ưu."

PANEL 3:
Trưởng phòng Hoàng : "Tuyến giao hàng mới này sẽ giảm thời gian di chuyển trung bình xuống 25%."

--------------------------------------------------

[PAGE 5 - SCENE]
PANEL 1:
Lan cycles energetically through a shaded bike lane lined with tropical trees.

PANEL 2:
She signals a right turn using her hand gesture at an intersection.

PANEL 3:
Lan parks her bicycle neatly in the campus bike rack.

[PAGE 5 - DIALOGUE]
PANEL 1:
Narrator (Dẫn) : "Ngày càng nhiều bạn trẻ chọn xe 自転車 (じてんしゃ - Tự Chuyển Xa - xe đạp) để di chuyển thân thiện với môi trường."

PANEL 2:
Lan (Nghĩ) : "Đạp xe mỗi sáng vừa giúp mình rèn sức khỏe, vừa tránh được bãi 駐車場 (ちゅうしゃじょう - Trú Xa Tràng - bãi giữ xe, bãi đỗ) đắt đỏ trong trường."

PANEL 3:
Lan : "Chiếc xe đạp gấp này là người bạn đồng hành trung thành nhất của em!"

--------------------------------------------------

[PAGE 6 - SCENE]
PANEL 1:
Busy intersection. A delivery scooter runs a red light.

PANEL 2:
Traffic police officer steps forward, activating the bodycam.

PANEL 3:
The delivery rider receives a traffic citation.

[PAGE 6 - DIALOGUE]
PANEL 1:
Narrator (Dẫn) : "Việc vi phạm 信号無視 (しんごうむし - Tín Hiệu Vô Thị - vượt đèn đỏ) không chỉ gây nguy hiểm mà còn dẫn đến 罰金 (ばっきん - Phạt Kim - tiền phạt) và điểm trừ bằng lái."

PANEL 2:
Cảnh sát : "Anh vừa vượt 赤信号 (あかしんごう - Xích Tín Hiệu - đèn đỏ), xuất trình 運転免許証 (うんてんめんきょしょう - Vận Chuyển Miễn Hứa Chứng - bằng lái xe) cho chúng tôi."

PANEL 3:
Người giao hàng : "Dạ em xin lỗi, em không cẩn thận ạ."

--------------------------------------------------

[PAGE 7 - SCENE]
PANEL 1:
Minh's team runs a live simulation of the food delivery routing system on screen.

PANEL 2:
Multiple animated scooter icons move optimally through the digital city grid.

PANEL 3:
Chị Vy records the efficiency metrics in her research notebook.

[PAGE 7 - DIALOGUE]
PANEL 1:
Minh : "Hệ thống phân tích 交通量 (こうつうりょう - Giao Thông Lượng - lưu lượng giao thông) theo thời gian thực để tự động điều chỉnh lộ trình."

PANEL 2:
Chị Vy : "Dữ liệu cho thấy các xe giao hàng đã giảm 30% quãng đường thực tế so với khi dùng 地図 (ちず - Địa Đồ - bản đồ) thông thường."

PANEL 3:
Trưởng phòng Hoàng : "Đây chính là sức mạnh thực sự của việc ứng dụng AI vào logistics đô thị."

--------------------------------------------------

[PAGE 8 - SCENE]
PANEL 1:
Heavy rain pours on the city. A massive traffic pileup spreads for 3 kilometers.

PANEL 2:
Minh receives a push notification about alternate route suggestions.

PANEL 3:
Minh reroutes smoothly, arriving at the office on time.

[PAGE 8 - DIALOGUE]
PANEL 1:
Narrator (Dẫn) : "Khi 大雨 (おおあめ - Đại Vũ - mưa to) ập đến bất ngờ, hệ thống giao thông đô thị phải đối mặt với áp lực cực lớn."

PANEL 2:
Minh : "Hệ thống đã tự động đề xuất 抜け道 (ぬけみち - Bạt Đạo - đường tắt, lối thoát) qua các khu dân cư nhỏ để tránh điểm nghẽn chính."

PANEL 3:
Minh (Nghĩ) : "Công nghệ thông minh giúp mình kiểm soát được biến số thời tiết bất ngờ."

--------------------------------------------------

[PAGE 9 - SCENE]
PANEL 1:
Minh presents the smart routing module at the quarterly tech showcase.

PANEL 2:
Transportation ministry officials in the front row take notes attentively.

PANEL 3:
A standing ovation follows Minh's presentation.

[PAGE 9 - DIALOGUE]
PANEL 1:
Minh : "Mô hình tối ưu hóa 輸送 (ゆそう - Du Tống - vận chuyển, vận tải) này ~にほかならない (~にほかならない - chính là / không gì khác ngoài) bước đột phá trong quản lý logistics đô thị thông minh."

PANEL 2:
Quan chức : "Nghiên cứu này hoàn toàn 応用 (おうよう - Ứng Dụng - ứng dụng) được vào các dự án quy hoạch giao thông quốc gia."

PANEL 3:
Chị Vy (Thầm) : "Minh trình bày tự tin và thuyết phục hơn rất nhiều so với lần đầu gặp."

--------------------------------------------------

[PAGE 10 - SCENE]
PANEL 1:
After the event. Minh and Chị Vy debrief over coffee in the building lobby.

PANEL 2:
Chị Vy shares mobility research data from Singapore and Tokyo.

PANEL 3:
Minh takes notes enthusiastically.

[PAGE 10 - DIALOGUE]
PANEL 1:
Chị Vy : "Hệ thống 公共交通 (こうきょうこうつう - Công Cộng Giao Thông - giao thông công cộng) tại Tokyo phục vụ đúng giờ đến 99.7% 〜にしては (~にしては - xét theo tiêu chuẩn ấy mà thấy...) một thành phố với 14 triệu dân."

PANEL 2:
Minh : "Con số đó thật ấn tượng, đúng là ~にしては (~にしては - so với quy mô dân số khổng lồ đó mà vẫn đúng giờ được) thì cần một hệ sinh thái vận hành cực kỳ tinh vi."

PANEL 3:
Minh : "Đây là hướng phát triển mà Việt Nam hoàn toàn có thể học hỏi và ứng dụng."

--------------------------------------------------

[PAGE 11 - SCENE]
PANEL 1:
Lan waits at a bus stop, checking the live arrival app on her phone.

PANEL 2:
The bus arrives precisely on the predicted time shown on the app.

PANEL 3:
Lan boards the bus smoothly, smiling at the real-time accuracy.

[PAGE 11 - DIALOGUE]
PANEL 1:
Lan : "Ứng dụng theo dõi 路線バス (ろせんバス - Lộ Tuyến Bus - xe buýt tuyến) thời gian thực xịn thật, đến đúng giờ như đồng hồ!"

PANEL 2:
Narrator (Dẫn) : "Khi người dùng có thể 予測 (よそく - Dự Trắc - dự đoán) chính xác giờ đến của phương tiện, trải nghiệm đi lại cải thiện đáng kể."

PANEL 3:
Lan : "Tiết kiệm được 15 phút chờ đợi mỗi ngày là lợi ích thiết thực với sinh viên như em."

--------------------------------------------------

[PAGE 12 - SCENE]
PANEL 1:
Night time. Minh and Trưởng phòng Hoàng walk out of the building into the drizzle.

PANEL 2:
They share an umbrella, walking toward the parking structure.

PANEL 3:
Trưởng phòng Hoàng offers to drive Minh to the nearby metro station.

[PAGE 12 - DIALOGUE]
PANEL 1:
Trưởng phòng Hoàng : "Anh sẽ 乗せる (のせる - Thừa - cho lên xe, cho đi nhờ xe) em đến ga metro Bình Dương cho tiện nhé."

PANEL 2:
Minh : "Em cảm ơn anh, nhưng em không muốn làm phiền anh phải 寄り道 (よりみち - Ký Đạo - đi vòng, ghé qua) khi trời đang mưa."

PANEL 3:
Trưởng phòng Hoàng : "Không sao đâu, đường về của anh qua đó rồi, cùng đi thôi!"

--------------------------------------------------

[PAGE 13 - SCENE]
PANEL 1:
Minh and Trưởng phòng Hoàng in the car, stopped at a red light.

PANEL 2:
A cyclist carefully crosses in front of them in the rain.

PANEL 3:
Trưởng phòng Hoàng nods respectfully and waits.

[PAGE 13 - DIALOGUE]
PANEL 1:
Trưởng phòng Hoàng : "Trong giao thông, 譲り合う (ゆずりあう - Nhường Hợp - nhường nhịn lẫn nhau) là văn hóa văn minh quan trọng nhất."

PANEL 2:
Minh : "Đúng vậy anh, sự an toàn của mọi người trên đường phải luôn được đặt lên hàng đầu."

PANEL 3:
Narrator (Dẫn) : "Ý thức giao thông cao là nền tảng để xây dựng một đô thị văn minh và an toàn."

--------------------------------------------------

[PAGE 14 - SCENE]
PANEL 1:
Weekend morning. Minh and Lan plan a day trip by train to a nearby beach city.

PANEL 2:
They browse the online rail ticket booking platform on a laptop.

PANEL 3:
Two e-tickets are successfully booked and saved to their phones.

[PAGE 14 - DIALOGUE]
PANEL 1:
Lan : "Cuối tuần này hai anh em mình đi du lịch bằng 電車 (でんしゃ - Điện Xa - tàu điện) đến Vũng Tàu luôn nhé anh hai!"

PANEL 2:
Minh : "Đặt vé 往復 (おうふく - Vãng Phục - khứ hồi, đi về) trước 3 ngày sẽ được giảm giá sớm đó em."

PANEL 3:
Lan : "Xong rồi! Ghế cạnh cửa sổ nhìn ra biển nữa, hoàn hảo!"

--------------------------------------------------

[PAGE 15 - SCENE]
PANEL 1:
At the train station. Massive departure boards display train numbers and platforms.

PANEL 2:
Minh and Lan rush toward Platform 3 with their backpacks.

PANEL 3:
They board the train just as the departure whistle sounds.

[PAGE 15 - DIALOGUE]
PANEL 1:
Loa ga : "Hành khách trên chuyến tàu số SE7 đi Vũng Tàu xin mời lên 乗り場 (のりば - Thừa Tràng - bến lên xe, cửa lên tàu) số 3!"

PANEL 2:
Minh (Hét) : "Mau lên Lan ơi, còn 3 phút là tàu 出発 (しゅっぱつ - Xuất Phát - khởi hành) rồi!"

PANEL 3:
Lan : "Anh hai chạy trước đi, em theo kịp ngay đây!"

--------------------------------------------------

[PAGE 16 - SCENE]
PANEL 1:
Scenic countryside view from the train window. Rice fields and winding rivers pass by.

PANEL 2:
Lan sketches the panoramic landscape rapidly in her notebook.

PANEL 3:
Minh sleeps peacefully in his seat, finally resting.

[PAGE 16 - DIALOGUE]
PANEL 1:
Lan : "Nhìn ra cửa sổ thấy phong cảnh 車窓 (しゃそう - Xa Song - cửa sổ tàu xe) thay đổi từng khoảnh khắc, cảm giác tự do vô cùng!"

PANEL 2:
Narrator (Dẫn) : "Hành trình di chuyển đôi khi không chỉ là phương tiện đến đích mà còn là trải nghiệm đáng nhớ tự thân nó."

PANEL 3:
Lan (Thầm) : "Anh hai ngủ ngon quá, chắc mấy hôm nay làm việc quá sức rồi."

--------------------------------------------------

[PAGE 17 - SCENE]
PANEL 1:
Vung Tau beach promenade. Minh and Lan walk along the seafront.

PANEL 2:
They rent a tandem bicycle and pedal along the coastal road.

PANEL 3:
Sea breeze and golden afternoon light fill the scene.

[PAGE 17 - DIALOGUE]
PANEL 1:
Minh : "Thuê xe đạp đôi 〜がてら (~がてら - Nhân tiện, vừa làm vừa) ngắm biển là ý tưởng hay nhất hôm nay của em đấy Lan!"

PANEL 2:
Lan : "Đi chơi 〜がてら (~がてら - Vừa thư giãn vừa) phác thảo tranh phong cảnh biển là sở thích lớn nhất của em!"

PANEL 3:
Minh : "Hôm nay là ngày nghỉ ngơi xứng đáng nhất sau bao tuần làm việc căng thẳng."

--------------------------------------------------

[PAGE 18 - SCENE]
PANEL 1:
On the beach. Lan sets up her compact watercolor kit on a folding table.

PANEL 2:
She paints a panoramic ocean sunset with precise brushstrokes.

PANEL 3:
Local tourists stop to admire her artwork.

[PAGE 18 - DIALOGUE]
PANEL 1:
Lan : "Vừa đi du lịch 〜かたがた (~かたがた - Vừa nghỉ ngơi kiêm luôn) tìm cảm hứng sáng tác là kế hoạch lý tưởng nhất!"

PANEL 2:
Khách du lịch : "Cô bé vẽ đẹp lắm đấy! Tranh màu nước phong cảnh biển này mang đậm hơi thở cuộc sống."

PANEL 3:
Lan : "Cảm ơn cô, đây là tác phẩm em vẽ tặng cả nhà làm kỷ niệm chuyến đi!"

--------------------------------------------------

[PAGE 19 - SCENE]
PANEL 1:
Sunset. Minh sits on a wooden pier, feet dangling over the water.

PANEL 2:
He types reflective notes about urban mobility into his research journal app.

PANEL 3:
The golden sky reflects perfectly on the calm sea surface.

[PAGE 19 - DIALOGUE]
PANEL 1:
Minh (Nghĩ) : "Hôm nay 〜かねて (~かねて - Từ trước, sẵn có) mình đã ấp ủ ý tưởng nghiên cứu này, nay đây mới thực sự có thời gian để ghi chép hoàn chỉnh."

PANEL 2:
Narrator (Dẫn) : "Đôi khi ta cần bước ra khỏi nhịp sống hối hả của đô thị để nhìn thấy rõ hơn những điều thực sự quan trọng."

PANEL 3:
Minh (Thầm) : "Chuyến đi này tiếp thêm cho mình rất nhiều năng lượng và cảm hứng mới."

--------------------------------------------------

[PAGE 20 - SCENE]
PANEL 1:
Next morning at Vung Tau. Minh and Lan take a shuttle bus back to the main train station.

PANEL 2:
Minh helps an elderly passenger lift their heavy luggage onto the overhead rack.

PANEL 3:
The passenger bows gratefully.

[PAGE 20 - DIALOGUE]
PANEL 1:
Narrator (Dẫn) : "Trên các phương tiện 公共 (こうきょう - Công Cộng - công cộng), sự quan tâm và tương trợ lẫn nhau làm cho hành trình trở nên ấm áp hơn."

PANEL 2:
Cụ già : "Cảm ơn cháu trai tốt bụng, hành lý nặng quá bà không với tới được."

PANEL 3:
Minh : "Dạ không có chi ạ, bà cứ yên tâm ngồi nghỉ ngơi cho thoải mái nhé."

--------------------------------------------------

[PAGE 21 - SCENE]
PANEL 1:
Back in the city. Minh visits Chị Vy's research lab for the final data handover.

PANEL 2:
Together they finalize the transport optimization report for the city council.

PANEL 3:
The printed report is handed to the transportation committee.

[PAGE 21 - DIALOGUE]
PANEL 1:
Chị Vy : "Chúng ta đã 〜やら〜やら (~やら〜やら - nào là... nào là) thu thập đủ dữ liệu tốc độ trung bình, mật độ lưu lượng và thời gian tắc nghẽn."

PANEL 2:
Minh : "Báo cáo này sẽ là nền tảng để thành phố hoạch định hệ thống 環状線 (かんじょうせん - Hoàn Trạng Tuyến - tuyến vành đai) vận tải mới."

PANEL 3:
Chị Vy : "Đây là thành quả xứng đáng sau hàng tháng nghiên cứu và thực địa cùng nhau!"

--------------------------------------------------

[PAGE 22 - SCENE]
PANEL 1:
Tech conference hall. Minh's team wins the "Smart City Innovation Award".

PANEL 2:
The award trophy is presented to Minh and Chị Vy on stage.

PANEL 3:
Trưởng phòng Hoàng and the FoodTech team applaud from the front row.

[PAGE 22 - DIALOGUE]
PANEL 1:
Người dẫn chương trình : "Giải thưởng Đổi mới Thành phố Thông minh năm nay thuộc về nhóm nghiên cứu FoodTech Logistics!"

PANEL 2:
Chị Vy : "Chúng tôi xin 受賞 (じゅしょう - Thụ Thưởng - nhận giải thưởng) với lòng biết ơn sâu sắc đến toàn bộ đội ngũ."

PANEL 3:
Minh (Thầm) : "Kết quả này là của cả đội, không của riêng mình."

--------------------------------------------------

[PAGE 23 - SCENE]
PANEL 1:
Celebration dinner. The whole FoodTech team gathers around a large round table.

PANEL 2:
Minh calls home to share the award news with his parents.

PANEL 3:
Mrs. Hân on the phone screen beams with radiant maternal pride.

[PAGE 23 - DIALOGUE]
PANEL 1:
Minh : "Bố mẹ ơi, nhóm con vừa đạt giải thưởng công nghệ đô thị cấp quốc gia ạ!"

PANEL 2:
Hân : "Con trai của mẹ giỏi quá! Bố mẹ tự hào về con lắm đấy!"

PANEL 3:
Nam : "Thành công này là phần thưởng xứng đáng cho sự nỗ lực không ngừng của con."

--------------------------------------------------

[PAGE 24 - SCENE]
PANEL 1:
Evening walk home. Minh and Lan cross the iconic lit pedestrian bridge.

PANEL 2:
City lights shimmer on the river surface below.

PANEL 3:
Both siblings pause to take in the beautiful night view.

[PAGE 24 - DIALOGUE]
PANEL 1:
Lan : "Nhìn thành phố về đêm từ cây cầu đi bộ này lúc nào cũng đẹp như tranh vẽ."

PANEL 2:
Minh : "Mỗi ánh đèn dưới kia đều là một câu chuyện của một con người đang sống và cống hiến."

PANEL 3:
Narrator (Dẫn) : "Thành phố không chỉ là những con đường và tòa nhà, mà là tổng hòa của bao nhịp đập con tim đang yêu thương và hy vọng."

--------------------------------------------------

[PAGE 25 - SCENE]
PANEL 1:
Next week at the office. Minh presents the next-phase proposal for expanding the routing system.

PANEL 2:
The proposal includes integration with motorbike sharing platforms.

PANEL 3:
The executive board votes unanimously to fund the expansion.

[PAGE 25 - DIALOGUE]
PANEL 1:
Minh : "Ở 〜にあたって (~にあたって - Vào dịp, nhân cơ hội) mở rộng hệ thống sang tích hợp xe ôm công nghệ, chúng ta cần nâng cấp toàn bộ lớp xử lý dữ liệu thời gian thực."

PANEL 2:
Trưởng phòng Hoàng : "Hội đồng đã thông qua kế hoạch, ngân sách sẽ được giải ngân ngay trong tuần tới."

PANEL 3:
Minh : "Chúng ta sẽ thay đổi cách hàng triệu người di chuyển trong thành phố mỗi ngày."

--------------------------------------------------

[PAGE 26 - SCENE]
PANEL 1:
At the university. Minh is invited to give a guest lecture on smart transport tech.

PANEL 2:
A packed auditorium of junior students listens with wide eyes.

PANEL 3:
Multiple hands shoot up during the Q&A session.

[PAGE 26 - DIALOGUE]
PANEL 1:
Minh : "Đứng 〜にあたり (~にあたり - Vào lúc, nhân dịp) trở lại giảng đường với tư cách người chia sẻ kiến thức thực tế là trải nghiệm đặc biệt với mình."

PANEL 2:
Sinh viên : "Anh Minh, làm thế nào để em có thể thực tập tại công ty công nghệ ngay từ năm 3 ạ?"

PANEL 3:
Minh : "Hãy xây dựng portfolio dự án thực tế từ sớm và không sợ gửi CV lạnh đến các startup!"

--------------------------------------------------

[PAGE 27 - SCENE]
PANEL 1:
Late night. Minh updates his personal tech blog with the week's learnings.

PANEL 2:
He uploads a tutorial on building city traffic APIs.

PANEL 3:
Within an hour, 500 developers bookmark the article.

[PAGE 27 - DIALOGUE]
PANEL 1:
Minh (Nghĩ) : "Tri thức chỉ thực sự có giá trị khi được chia sẻ rộng rãi cho cộng đồng."

PANEL 2:
Narrator (Dẫn) : "Người kỹ sư trẻ không chỉ xây dựng hệ thống mà còn có trách nhiệm lan tỏa kiến thức cho thế hệ sau."

PANEL 3:
Minh : "Kết nối và chia sẻ - đó là nền tảng của một cộng đồng công nghệ lành mạnh và phát triển."

--------------------------------------------------

[PAGE 28 - SCENE]
PANEL 1:
Weekend morning. Mr. Nam receives a city heritage craftsman award at the community hall.

PANEL 2:
The whole family attends the ceremony dressed neatly.

PANEL 3:
Minh and Lan applaud proudly from the audience.

[PAGE 28 - DIALOGUE]
PANEL 1:
Người trao giải : "Giải thưởng Nghệ nhân Di sản Thành phố trân trọng trao tặng cho ông Nam, chủ tiệm bánh thủ công 50 năm lịch sử."

PANEL 2:
Nam : "Tôi xin được chia sẻ vinh dự này cùng gia đình và tất cả những người đã yêu thương hương vị bánh của chúng tôi."

PANEL 3:
Minh (Nghĩ) : "Bố là người thầy và nguồn cảm hứng lớn nhất trong cuộc đời mình."

--------------------------------------------------

[PAGE 29 - SCENE]
PANEL 1:
Family walk at sunset along the riverside park.

PANEL 2:
The four family members walk side by side in comfortable silence.

PANEL 3:
Lan links arms with Mrs. Hân, both smiling warmly.

[PAGE 29 - DIALOGUE]
PANEL 1:
Narrator (Dẫn) : "Giữa nhịp sống đô thị tất bật, những khoảnh khắc giản dị bên gia đình chính là bến đỗ bình yên nhất."

PANEL 2:
Hân : "Dù thành phố có thay đổi bao nhiêu, miễn là cả nhà vẫn cùng nhau là đủ."

PANEL 3:
Nam : "Đúng vậy, đây mới là hành trình đáng giá nhất trong cuộc đời."

--------------------------------------------------

[PAGE 30 - SCENE]
PANEL 1:
Dawn shot of the city skyline. Metro trains and buses move through gleaming elevated tracks.

PANEL 2:
Narrator stands on the rooftop observation deck above the city.

PANEL 3:
Close-up of the Narrator smiling at the horizon.

[PAGE 30 - DIALOGUE]
PANEL 1:
Minh : "Mỗi ngày thức dậy, thành phố lại bắt đầu một nhịp sống mới với hàng triệu câu chuyện đang song hành."

PANEL 2:
Narrator (Dẫn) : "Giao thông không chỉ là cơ sở hạ tầng kỹ thuật, mà là mạch máu kết nối mọi cơ hội và ước mơ của con người đô thị."

PANEL 3:
Narrator : "Hãy di chuyển an toàn, văn minh và trân trọng từng hành trình trong cuộc sống nhé!"
```

```text
[PREVIOUS_SUMMARY]:
Chương 6 theo dõi Minh và nhóm FoodTech phát triển thành công hệ thống định tuyến giao hàng thông minh tích hợp dữ liệu giao thông thời gian thực, đạt giải thưởng Đổi mới Thành phố Thông minh cấp quốc gia. Bên cạnh đó, hai anh em Minh - Lan có chuyến nghỉ phục hồi năng lượng tại biển Vũng Tàu, còn bố Nam được vinh danh với giải Nghệ nhân Di sản Thành phố.

[EXISTING_CHARACTERS_DATA]:
- Narrator: Appearance: 22 years old, 4th-year female student, thin glasses. Outfit: White shirt, navy blazer, tablet. Role: Objective narrator and urban mobility analyst.
- Minh: Appearance: 21 years old, short black hair, award-winning intern. Outfit: Light grey t-shirt, dark pants. Role: Smart city tech researcher and software intern.
- Lan: Appearance: 21 years old, creative ponytail. Outfit: Striped jacket, canvas tote. Role: Art student and watercolor landscape painter.
- Nam: Appearance: 52 years old, city heritage craftsman award winner. Outfit: Traditional baker uniform. Role: Celebrated artisan baker.
- Hân: Appearance: 50 years old, warm mother. Outfit: Casual blouse. Role: Family's heart and moral anchor.
- Trưởng phòng Hoàng: Appearance: 38 years old, sharp glasses. Outfit: Dark business suit. Role: FoodTech tech director.
- Chị Vy: Appearance: 29 years old, sharp eyes, energetic. Outfit: Smart casual blazer. Role: Urban transport data researcher.
```
"""

with open("N2/kịch bản/Chương 6/chuong_06.md", "w", encoding="utf-8") as f:
    f.write(chuong_06)
print("Chapter 6 OK")
