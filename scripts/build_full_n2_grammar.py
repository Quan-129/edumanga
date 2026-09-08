# -*- coding: utf-8 -*-
"""
High-Precision JLPT N2 Grammar Dataset Generator
Transforms vocab/N2/sou/tong_hop_ngu_phap.csv (175 points) into comprehensive 13-column schema:
stt,pattern,reading,meaning,connection,usage_notes,level,exam_ja_1,exam_vi_1,exam_ja_2,exam_vi_2,similar_patterns,card_type
"""

import csv
import re
import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

# Comprehensive Grammar Database for N2 Soumatome / Shinkanzen Master
FULL_GRAMMAR_DB = {
    1: {
        "pattern": "〜げ（な／に）",
        "reading": "〜げ（な／に）",
        "meaning": "Có vẻ, mang cảm giác...",
        "connection": "A-i (bỏ い) / A-na (bỏ な) / V-masu (bỏ ます) + げ",
        "usage_notes": "Dùng miêu tả tâm trạng, cảm xúc hoặc trạng thái của người khác qua vẻ bề ngoài, cử chỉ, ánh mắt. Thường không dùng cho bản thân.",
        "exam_ja_1": "彼女は悲しげな表情でうつむいていた。",
        "exam_vi_1": "Cô ấy cúi gầm mặt với vẻ mặt có vẻ đau buồn.",
        "exam_ja_2": "彼は自信ありげに手を挙げた。",
        "exam_vi_2": "Anh ấy giơ tay với vẻ đầy tự tin.",
        "similar_patterns": "類: 〜そう (phổ biến hơn) / 〜っぽい (thiên về tính chất)"
    },
    2: {
        "pattern": "〜がち",
        "reading": "〜がち",
        "meaning": "Thường hay, dễ bị (xu hướng xấu)",
        "connection": "V-masu (bỏ ます) / N + がち",
        "usage_notes": "Biểu thị một xu hướng tiêu cực hoặc không mong muốn dễ lặp đi lặp lại (hay ốm, hay vắng mặt, dễ hiểu lầm).",
        "exam_ja_1": "一人暮らしの人は野菜不足になりがちだ。",
        "exam_vi_1": "Người sống một mình thường hay bị thiếu rau xanh.",
        "exam_ja_2": "最近、彼は体調を崩しがちで会社を休んでいる。",
        "exam_vi_2": "Gần đây anh ấy hay bị ốm nên nghỉ làm.",
        "similar_patterns": "類: 〜やすい (dễ xảy ra tính chất vật lý) / 対: 〜にくい"
    },
    3: {
        "pattern": "〜っぽい",
        "reading": "〜っぽい",
        "meaning": "Hơi có vẻ, đậm chất, hay (mang tính chất)",
        "connection": "N / A-i (bỏ い) / V-masu (bỏ ます) + っぽい",
        "usage_notes": "Cảm giác có tính chất đó mạnh mẽ, hoặc dễ nổi cáu, mau chán (dùng trong khẩu ngữ, văn nói).",
        "exam_ja_1": "彼は怒りっぽい性格だから気をつけて。",
        "exam_vi_1": "Anh ấy tính tình rất hay nổi nóng nên hãy cẩn thận.",
        "exam_ja_2": "このスープは油っぽくて口に合わない。",
        "exam_vi_2": "Món súp này nhiều dầu mỡ quá không hợp khẩu vị của tôi.",
        "similar_patterns": "類: 〜らしい (đúng bản chất thực) / 〜気味 (có triệu chứng)"
    },
    4: {
        "pattern": "〜気味",
        "reading": "〜ぎみ",
        "meaning": "Có vẻ, có triệu chứng nhẹ là...",
        "connection": "V-masu (bỏ ます) / N + 気味",
        "usage_notes": "Cảm thấy hơi có triệu chứng, khuynh hướng không tốt (cảm cúm, mệt mỏi, căng thẳng).",
        "exam_ja_1": "風邪気味なので、今夜は早く寝ます。",
        "exam_vi_1": "Tôi cảm thấy hơi bị cảm nên tối nay sẽ đi ngủ sớm.",
        "exam_ja_2": "最近仕事が忙しくて寝不足気味だ。",
        "exam_vi_2": "Dạo gần đây công việc bận rộn nên tôi hơi có triệu chứng thiếu ngủ.",
        "similar_patterns": "類: 〜がち (tần suất lặp lại nhiều lần) / 〜っぽい"
    },
    5: {
        "pattern": "Vれるものなら / Vれるもんなら",
        "reading": "Vれるものなら",
        "meaning": "Nếu như có thể làm được thì...",
        "connection": "V-khả năng + ものなら / もんなら",
        "usage_notes": "Giả định một việc thực tế gần như không thể hoặc rất khó thực hiện. Vế sau thể hiện nguyện vọng mãnh liệt của người nói.",
        "exam_ja_1": "帰れるものなら、今すぐ国へ帰りたい。",
        "exam_vi_1": "Nếu mà về được thì tôi muốn về nước ngay lúc này.",
        "exam_ja_2": "やり直せるものなら、人生をもう一度やり直したい。",
        "exam_vi_2": "Nếu có thể làm lại được thì tôi muốn làm lại cuộc đời một lần nữa.",
        "similar_patterns": "類: 〜なら (điều kiện thông thường) / 〜ものなら (thách thức: làm thử xem)"
    },
    6: {
        "pattern": "〜ものだから / 〜もんだから",
        "reading": "〜ものだから",
        "meaning": "Vì... (biện bạch, giải thích lý do)",
        "connection": "V / A / N (thể thông thường, N + な) + ものだから",
        "usage_notes": "Dùng để phân trần, giải thích lý do cho một tình huống bất khả kháng ngoài dự tính (thường gặp khi xin lỗi hoặc giải trình).",
        "exam_ja_1": "バスが遅れたものだから、遅刻してしまいました。",
        "exam_vi_1": "Vì xe buýt đến trễ nên tôi đã bị muộn.",
        "exam_ja_2": "あまりに美味しかったものだから、全部食べてしまった。",
        "exam_vi_2": "Vì món ăn ngon quá nên tôi đã lỡ ăn hết sạch.",
        "similar_patterns": "類: 〜ので / 〜から (khách quan hơn) / 〜もの (văn nói phân bua)"
    },
    7: {
        "pattern": "〜もの / 〜もん",
        "reading": "〜もの / 〜もん",
        "meaning": "Vì... mà! (nói lý do mang tính nũng nịu, biện bạch)",
        "connection": "V / A / N (thể thông thường) + もの / もん",
        "usage_notes": "Thường dùng ở cuối câu trong văn nói thân mật (phụ nữ, trẻ em), biện minh cho hành động của mình.",
        "exam_ja_1": "「どうして食べないの？」「だって、嫌いなんだもん。」",
        "exam_vi_1": "「Sao con không ăn?」「Tại vì con ghét món này mà.」",
        "exam_ja_2": "まだ子供なんだもの、失敗しても仕方がないよ。",
        "exam_vi_2": "Nó vẫn còn là con nít mà, có thất bại cũng đành chịu thôi.",
        "similar_patterns": "類: 〜から (trung tính)"
    },
    8: {
        "pattern": "〜ものの",
        "reading": "〜ものの",
        "meaning": "Mặc dù... nhưng...",
        "connection": "V / A / N (thể thông thường, N + である) + ものの",
        "usage_notes": "Vế A là sự thật đã thừa nhận, nhưng vế B xảy ra không như kỳ vọng hay kết quả tương xứng. Hay dùng trong văn viết.",
        "exam_ja_1": "大学を卒業したものの、就職先が決まらない。",
        "exam_vi_1": "Mặc dù đã tốt nghiệp đại học nhưng tôi vẫn chưa tìm được chỗ làm việc.",
        "exam_ja_2": "春とはいうものの、まだまだ寒い日が続いている。",
        "exam_vi_2": "Mặc dù nói là mùa xuân nhưng những ngày lạnh giá vẫn tiếp diễn.",
        "similar_patterns": "類: 〜けれども / 〜とはいえ / 〜にもかかわらず"
    },
    9: {
        "pattern": "Nはもとより〜も",
        "reading": "Nはもとより〜も",
        "meaning": "Không chỉ N mà ngay cả... cũng (N là đương nhiên)",
        "connection": "N + はもとより 〜 も",
        "usage_notes": "Vế trước là điều hiển nhiên, đương nhiên; vế sau bổ sung thêm một yếu tố khác vượt ngoài mức thông thường.",
        "exam_ja_1": "この温泉は日本人はもとより、外国人観光客にも人気がある。",
        "exam_vi_1": "Suối nước nóng này không chỉ người Nhật mà ngay cả khách du lịch nước ngoài cũng rất yêu thích.",
        "exam_ja_2": "彼女は英語はもとより、フランス語も流暢に話せる。",
        "exam_vi_2": "Cô ấy không chỉ tiếng Anh mà ngay cả tiếng Pháp cũng nói rất lưu loát.",
        "similar_patterns": "類: 〜はもちろん (thông dụng) / 〜ばかりか"
    },
    10: {
        "pattern": "N1はともかく（として）N2は / が",
        "reading": "N1はともかく（として）N2は / が",
        "meaning": "N1 thì tạm gác lại, trước hết N2...",
        "connection": "N + はともかく（として）",
        "usage_notes": "Tạm thời không bàn tới N1 (vì chưa quan trọng hoặc khó đạt được), mà ưu tiên nhấn mạnh vào N2.",
        "exam_ja_1": "値段はともかく、デザインがとても気に入った。",
        "exam_vi_1": "Giá cả thì tạm gác sang một bên, tôi rất thích kiểu dáng của nó.",
        "exam_ja_2": "結果はともかく、全力を尽くすことが大切だ。",
        "exam_vi_2": "Kết quả ra sao thì chưa tính tới, quan trọng nhất là phải nỗ lực hết mình.",
        "similar_patterns": "類: 〜はさておき / 〜は別として"
    },
    11: {
        "pattern": "N1はまだしもN2...",
        "reading": "N1はまだしもN2...",
        "meaning": "N1 thì còn châm chước được, chứ N2 thì không thể",
        "connection": "N + はまだしも",
        "usage_notes": "Biểu thị N1 dù có khuyết điểm nhưng vẫn ở mức tạm chấp nhận được, còn N2 thì tệ hơn nhiều hoặc hoàn toàn không thể chấp nhận.",
        "exam_ja_1": "10分や20分の遅刻ならまだしも、1時間も待たせるなんて許せない。",
        "exam_vi_1": "Trễ 10 hay 20 phút thì còn chấp nhận được, chứ bắt đợi cả tiếng đồng hồ thì không thể tha thứ.",
        "exam_ja_2": "一度の失敗ならまだしも、何度も同じミスを繰り返すのは問題だ。",
        "exam_vi_2": "Thất bại một lần thì còn châm chước, chứ lặp đi lặp lại cùng một lỗi nhiều lần là có vấn đề.",
        "similar_patterns": "類: 〜ならまだいい / 〜なら許せる"
    },
    12: {
        "pattern": "〜たまらない",
        "reading": "〜たまらない",
        "meaning": "...không chịu nổi / cực kỳ... (cảm xúc không thể kìm nén)",
        "connection": "A-i (くて) / A-na (で) / V-te + たまらない",
        "usage_notes": "Diễn tả cảm xúc, mong muốn hoặc cảm giác cơ thể (như đói, khát, đau) mạnh mẽ đến mức không thể kiềm chế hay chịu đựng được.",
        "exam_ja_1": "今日は暑くてたまらないから、冷たいジュースが飲みたい。",
        "exam_vi_1": "Hôm nay trời nóng không chịu nổi nên tôi muốn uống nước trái cây mát lạnh.",
        "exam_ja_2": "合格の知らせを聞いて、嬉しくてたまらなかった。",
        "exam_vi_2": "Nghe tin đỗ kỳ thi, tôi vui mừng khôn xiết.",
        "similar_patterns": "類: 〜てしょうがない / 〜てならない"
    },
    13: {
        "pattern": "〜仕方がない / 〜しょうがない",
        "reading": "〜しかたがない / 〜しょうがない",
        "meaning": "...vô cùng / không biết phải làm sao / đành chịu",
        "connection": "A-i (くて) / A-na (で) / V-te + 仕方がない",
        "usage_notes": "Diễn tả cảm xúc tự nhiên trào dâng không kiểm soát được, hoặc tình huống không còn phương sách nào khác.",
        "exam_ja_1": "一人で外国に住んでいると、寂しくて仕方がない。",
        "exam_vi_1": "Sống một mình ở nước ngoài, tôi cảm thấy cô đơn vô cùng.",
        "exam_ja_2": "終わってしまったことは悔やんでも仕方がない。",
        "exam_vi_2": "Chuyện đã qua rồi thì có hối hận cũng chẳng làm được gì.",
        "similar_patterns": "類: 〜てたまらない / 〜てならない"
    },
    14: {
        "pattern": "〜かなわない",
        "reading": "〜かなわない",
        "meaning": "Không thể chịu đựng nổi vì... (phiền toái, bực bội)",
        "connection": "A-i (くて) / A-na (で) + かなわない",
        "usage_notes": "Dùng khi người nói cảm thấy vô cùng khó chịu, bất tiện hoặc bực mình trước một hoàn cảnh do người khác hoặc thời tiết gây ra.",
        "exam_ja_1": "隣の部屋の音がうるさくてかなわない。",
        "exam_vi_1": "Âm thanh phòng bên cạnh ồn ào không tài nào chịu nổi.",
        "exam_ja_2": "こんなに毎日雨ばかりではかなわない。",
        "exam_vi_2": "Cứ mưa suốt ngày thế này thì thật là không chịu nổi.",
        "similar_patterns": "類: 〜てたまらない / 〜て困る"
    },
    15: {
        "pattern": "〜ならない",
        "reading": "〜ならない",
        "meaning": "Hết sức... / Vô cùng... (cảm xúc tự phát sâu kín)",
        "connection": "A-i (くて) / A-na (で) / V-te + ならない",
        "usage_notes": "Thường đi kèm với các động từ/tính từ chỉ tâm trạng xuất phát tự nhiên từ đáy lòng (lo lắng, nhớ nhung, thương cảm...). Mang tính văn viết.",
        "exam_ja_1": "母の病気のことが心配でならない。",
        "exam_vi_1": "Tôi hết sức lo lắng cho bệnh tình của mẹ.",
        "exam_ja_2": "結果がどうなるのか、気になってならない。",
        "exam_vi_2": "Tôi vô cùng bận tâm không biết kết quả sẽ ra sao.",
        "similar_patterns": "類: 〜てたまらない (thiên về cảm giác cơ thể) / 〜てしょうがない"
    },
    16: {
        "pattern": "〜ないことはない",
        "reading": "〜ないことはない",
        "meaning": "Không phải là không... (khẳng định nhẹ / miễn cưỡng)",
        "connection": "V-nai / A-i (くない) / A-na (ではない) + ことはない",
        "usage_notes": "Phủ định của phủ định để tạo nên lời khẳng định dè dặt, không hoàn toàn tự tin nhưng vẫn có khả năng.",
        "exam_ja_1": "納豆は食べられないことはないが、あまり好きではない。",
        "exam_vi_1": "Natto thì không phải là tôi không ăn được, nhưng không thích lắm.",
        "exam_ja_2": "走れば間に合わないこともないから、急ごう。",
        "exam_vi_2": "Nếu chạy thì không phải là không kịp, nên hãy mau lên nào.",
        "similar_patterns": "類: 〜ないこともない / 〜一応できる"
    },
    17: {
        "pattern": "〜ないこともない",
        "reading": "〜ないこともない",
        "meaning": "Cũng không hẳn là không... (có thể làm được nếu cố)",
        "connection": "V-nai / A-i (くない) / A-na (ではない) + こともない",
        "usage_notes": "Ý nghĩa tương tự 〜ないことはない, biểu đạt khả năng có thể thực hiện được trong một số điều kiện nhất định.",
        "exam_ja_1": "お金を出してくれるなら、一緒に行かないこともないよ。",
        "exam_vi_1": "Nếu cậu bao tiền thì tớ cũng không phải là không đi cùng đâu.",
        "exam_ja_2": "少し時間をくれれば、直せないこともない。",
        "exam_vi_2": "Nếu cho tôi chút thời gian thì cũng không phải là không sửa được.",
        "similar_patterns": "類: 〜ないことはない"
    },
    18: {
        "pattern": "Vないではいられない",
        "reading": "Vないではいられない",
        "meaning": "Không thể không làm V / Buộc phải làm V",
        "connection": "V-nai (bỏ ない) + ないではいられない (する → せずにはいられない)",
        "usage_notes": "Không thể kìm nén được cảm xúc nên buộc phải thực hiện hành động đó ngay lập tức.",
        "exam_ja_1": "その映画の結末を見て、泣かないではいられなかった。",
        "exam_vi_1": "Xem đến đoạn kết của bộ phim đó, tôi không thể nào không rơi nước mắt.",
        "exam_ja_2": "理不尽な態度に対して、一言文句を言わないではいられなかった。",
        "exam_vi_2": "Trước thái độ phi lý đó, tôi không thể kìm được việc phải lên tiếng phàn nàn.",
        "similar_patterns": "類: Vずにはいられない (đồng nghĩa, văn viết)"
    },
    19: {
        "pattern": "Vずにはいられない",
        "reading": "Vずにはいられない",
        "meaning": "Không kìm lại được, không thể không V",
        "connection": "V-nai (bỏ ない) + ずにはいられない (する → せずにはいられない)",
        "usage_notes": "Diễn tả hành động tự nhiên bộc phát do thôi thúc nội tâm mãnh liệt (dạng cổ/trang trọng hơn của 〜ないではいられない).",
        "exam_ja_1": "彼の冗談があまりに面白くて、笑わずにはいられなかった。",
        "exam_vi_1": "Trò đùa của anh ấy buồn cười quá khiến tôi không sao nhịn được cười.",
        "exam_ja_2": "困っている人を見ると、助けずにはいられない性格だ。",
        "exam_vi_2": "Anh ấy là người hễ thấy ai gặp khó khăn là không thể không giúp đỡ.",
        "similar_patterns": "類: Vないではいられない"
    },
    20: {
        "pattern": "Vねばならない",
        "reading": "Vねばならない",
        "meaning": "Phải làm V (nghĩa vụ, bổn phận trang trọng)",
        "connection": "V-nai (bỏ ない) + ねばならない (する → せねばならない)",
        "usage_notes": "Văn phong cổ, trang trọng, thường dùng trong bài phát biểu, nguyên tắc luân lý hoặc quyết tâm cá nhân lớn lao.",
        "exam_ja_1": "真実を明らかにするために、我々は戦わねばならない。",
        "exam_vi_1": "Để làm sáng tỏ sự thật, chúng ta nhất định phải chiến đấu.",
        "exam_ja_2": "どんな困難があっても、この約束は守らねばならない。",
        "exam_vi_2": "Dù có khó khăn thế nào đi nữa, chúng ta cũng phải giữ trọn lời hứa này.",
        "similar_patterns": "類: 〜なければならない (thông dụng) / 〜ざるを得ない"
    },
    21: {
        "pattern": "Vてはならない",
        "reading": "Vてはならない",
        "meaning": "Không được làm V (cấm đoán trang trọng)",
        "connection": "V-te + はならない",
        "usage_notes": "Dùng trong các quy định, luật lệ, lời răn dạy đạo đức mang tính trang trọng.",
        "exam_ja_1": "失敗を恐れてチャレンジをやめてはならない。",
        "exam_vi_1": "Không được vì sợ thất bại mà từ bỏ việc thử thách bản thân.",
        "exam_ja_2": "法律を犯すような行為は決してしてはならない。",
        "exam_vi_2": "Tuyệt đối không được làm những hành vi vi phạm pháp luật.",
        "similar_patterns": "類: 〜てはいけない (thông dụng) / 〜べからず"
    },
    22: {
        "pattern": "Vてはいられない / Vてられない",
        "reading": "Vてはいられない",
        "meaning": "Không thể cứ tiếp tục làm V mãi được",
        "connection": "V-te + はいられない / られない",
        "usage_notes": "Không thể ngồi yên hay tiếp tục trạng thái đó vì tình huống khẩn cấp, thời gian không cho phép.",
        "exam_ja_1": "もうすぐ試験だから、遊んでばかりはいられない。",
        "exam_vi_1": "Sắp thi rồi nên không thể cứ mải chơi mãi được.",
        "exam_ja_2": "のんびりとお茶を飲んではいられない状況になった。",
        "exam_vi_2": "Tình huống đã trở nên gấp gáp, không thể thong thả uống trà được nữa.",
        "similar_patterns": "類: 〜ている場合ではない"
    },
    24: {
        "pattern": "〜かいがある / 〜かいあって",
        "reading": "〜かいがある",
        "meaning": "Bõ công, thật đáng công...",
        "connection": "V-ta / N + の + かいがある / かいあって",
        "usage_notes": "Nỗ lực, cố gắng đã được đền đáp xứng đáng bằng một kết quả tốt đẹp.",
        "exam_ja_1": "毎日一生懸命練習したかいがあって、試合に勝てた。",
        "exam_vi_1": "Bõ công luyện tập chăm chỉ mỗi ngày, chúng tôi đã thắng trận đấu.",
        "exam_ja_2": "苦労したかいがあって、念願のマイホームを手に入れた。",
        "exam_vi_2": "Bõ công vất vả bao năm, cuối cùng tôi đã mua được ngôi nhà mơ ước.",
        "similar_patterns": "対: 〜かいがない (uổng công)"
    },
    28: {
        "pattern": "Vかける / VかけのN / Vかけだ",
        "reading": "Vかける",
        "meaning": "Đang làm dở dang / Suýt nữa thì...",
        "connection": "V-masu (bỏ ます) + かける / かけのN / かけだ",
        "usage_notes": "Hành động đã bắt đầu nhưng chưa hoàn thành, đang ở trạng thái dở dang.",
        "exam_ja_1": "机の上に読みかけの本が置いてある。",
        "exam_vi_1": "Trên bàn có đặt cuốn sách đọc dở.",
        "exam_ja_2": "彼は何かを言いかけて、口をつぐんだ。",
        "exam_vi_2": "Anh ấy định nói điều gì đó dở chừng rồi lại ngậm miệng lại.",
        "similar_patterns": "類: 〜途中だ"
    },
    29: {
        "pattern": "V切る / V切れる / V切れない",
        "reading": "Vきる / Vきれる / Vきれない",
        "meaning": "Làm xong hết toàn bộ / Không thể nào làm hết được",
        "connection": "V-masu (bỏ ます) + 切る / 切れる / 切れない",
        "usage_notes": "Thực hiện hành động đến cùng, hoàn toàn hết sạch không còn sót lại.",
        "exam_ja_1": "長いマラソンコースをやっと走り切った。",
        "exam_vi_1": "Cuối cùng tôi đã chạy hết toàn bộ quãng đường marathon dài.",
        "exam_ja_2": "こんなにたくさんの料理はとても食べ切れません。",
        "exam_vi_2": "Nhiều món ăn như thế này thì tôi không tài nào ăn hết được.",
        "similar_patterns": "類: 〜尽くす / 〜抜く"
    },
    30: {
        "pattern": "V得る / V得ない",
        "reading": "Vえる・うる / Vえない",
        "meaning": "Có khả năng xảy ra / Không thể nào xảy ra",
        "connection": "V-masu (bỏ ます) + 得る (える/うる) / 得ない (えない)",
        "usage_notes": "Khả năng xảy ra của một sự việc trên thực tế hay lý thuyết. Không dùng cho năng lực cá nhân (như biết bơi, biết lái xe).",
        "exam_ja_1": "事故はいつでも起こり得るから、注意が必要だ。",
        "exam_vi_1": "Tai nạn có thể xảy ra bất cứ lúc nào, nên cần phải cẩn thận.",
        "exam_ja_2": "彼がそんな不正をするなんて、絶対にあり得ない。",
        "exam_vi_2": "Việc anh ấy làm điều phi pháp như thế là hoàn toàn không thể xảy ra.",
        "similar_patterns": "類: 〜可能性がある / 対: あり得ない"
    },
    31: {
        "pattern": "V抜く",
        "reading": "Vぬく",
        "meaning": "Làm đến cùng vượt qua gian khổ",
        "connection": "V-masu (bỏ ます) + 抜く",
        "usage_notes": "Kiên trì vượt qua khó khăn, vất vả để hoàn thành trọn vẹn hành động.",
        "exam_ja_1": "どんなにつらくても、最後までやり抜く決意だ。",
        "exam_vi_1": "Dù có khó khăn thế nào, tôi cũng quyết tâm làm tới cùng.",
        "exam_ja_2": "悩みに悩み抜いた末に、会社を辞めることにした。",
        "exam_vi_2": "Sau khi đã suy nghĩ trăn trở hết nước hết cái, tôi quyết định nghỉ việc.",
        "similar_patterns": "類: 〜最後までやり遂げる"
    },
    32: {
        "pattern": "〜うちに",
        "reading": "〜うちに",
        "meaning": "Nhân lúc còn... / Trong khi đang... thì biến đổi",
        "connection": "V-dict / V-teiru / V-nai / A-i / A-na (な) / N (の) + うちに",
        "usage_notes": "Tận dụng khoảng thời gian điều kiện còn thuận lợi trước khi trạng thái thay đổi.",
        "exam_ja_1": "スープが温かいうちに召し上がってください。",
        "exam_vi_1": "Xin hãy dùng súp nhân lúc còn đang nóng.",
        "exam_ja_2": "テレビを見ているうちに、いつの間にか眠ってしまった。",
        "exam_vi_2": "Trong lúc đang xem TV, tôi đã ngủ thiếp đi từ lúc nào không biết.",
        "similar_patterns": "類: 〜あいだに"
    },
    34: {
        "pattern": "〜限り（は）",
        "reading": "〜かぎり（は）",
        "meaning": "Chừng nào mà còn... thì vẫn...",
        "connection": "V-dict / V-nai / A-i / A-na (な/である) / N (である) + 限り",
        "usage_notes": "Chừng nào điều kiện vế trước vẫn còn tiếp diễn thì trạng thái vế sau vẫn tiếp tục được duy trì.",
        "exam_ja_1": "日本にいる限り、日本語の勉強を続けたい。",
        "exam_vi_1": "Chừng nào còn ở Nhật Bản thì tôi vẫn muốn tiếp tục học tiếng Nhật.",
        "exam_ja_2": "体が健康である限り、働き続けたいと思っています。",
        "exam_vi_2": "Chừng nào cơ thể còn khỏe mạnh thì tôi vẫn muốn tiếp tục làm việc.",
        "similar_patterns": "類: 〜間は / 〜うちは"
    },
    36: {
        "pattern": "Nに限り / Nに限って",
        "reading": "Nにかぎり / Nにかぎって",
        "meaning": "Chỉ riêng N / Đúng vào lúc N thì lại...",
        "connection": "N + に限り / に限って",
        "usage_notes": "に限り: dùng trong thông báo ngoại lệ ưu đãi. に限って: diễn tả sự trùng hợp xui xẻo hoặc niềm tin tuyệt đối.",
        "exam_ja_1": "本日ご来店のお客様に限り、全品10％割引いたします。",
        "exam_vi_1": "Chỉ riêng quý khách đến cửa hàng hôm nay sẽ được giảm giá 10% toàn bộ sản phẩm.",
        "exam_ja_2": "傘を持っていない日に限って、雨が降る。",
        "exam_vi_2": "Đúng vào cái ngày không mang ô thì trời lại đổ mưa.",
        "similar_patterns": "類: 〜だけ / 〜のみ"
    },
    38: {
        "pattern": "〜からこそ",
        "reading": "〜からこそ",
        "meaning": "Chính vì... (nhấn mạnh lý do cốt lõi)",
        "connection": "V / A / N (thể thông thường) + からこそ",
        "usage_notes": "Nhấn mạnh nguyên nhân duy nhất, tích cực dẫn đến kết quả hoặc hành động.",
        "exam_ja_1": "あなたの将来を心配しているからこそ、厳しく言うのです。",
        "exam_vi_1": "Chính vì lo lắng cho tương lai của cậu nên tôi mới nói nghiêm khắc như vậy.",
        "exam_ja_2": "大変な時期だからこそ、皆で協力し合わなければならない。",
        "exam_vi_2": "Chính vì là thời điểm khó khăn nên mọi người càng phải đoàn kết hợp tác.",
        "similar_patterns": "類: まさに〜の理由で"
    },
    39: {
        "pattern": "Vてこそ",
        "reading": "Vてこそ",
        "meaning": "Chỉ khi làm V thì mới thực sự...",
        "connection": "V-te + こそ",
        "usage_notes": "Nhấn mạnh điều kiện tiên quyết, làm xong V mới cảm nhận hoặc đạt được ý nghĩa thực sự.",
        "exam_ja_1": "自分で実際に体験してこそ、その大変さが分かる。",
        "exam_vi_1": "Chỉ khi tự mình trải nghiệm thực tế thì mới hiểu được nỗi vất vả đó.",
        "exam_ja_2": "親になってこそ、親のありがたみが分かるものだ。",
        "exam_vi_2": "Chỉ khi làm cha mẹ thì người ta mới thấu hiểu được công ơn của đấng sinh thành.",
        "similar_patterns": "類: 〜てはじめて (chỉ sau khi)"
    },
    54: {
        "pattern": "〜わけだ",
        "reading": "〜わけだ",
        "meaning": "Thảo nào, hèn chi / Đương nhiên là...",
        "connection": "V / A / N (thể thông thường, N + な/である) + わけだ",
        "usage_notes": "Hiểu ra nguyên nhân lý do tất yếu của một sự việc sau khi được giải thích.",
        "exam_ja_1": "エアコンが壊れていたのか。どうりで部屋が暑いわけだ。",
        "exam_vi_1": "Hóa ra điều hòa bị hỏng à. Hèn chi mà trong phòng nóng thế.",
        "exam_ja_2": "5年も日本に住んでいるなら、日本語が上手なわけだ。",
        "exam_vi_2": "Nếu đã sống ở Nhật 5 năm thì thảo nào tiếng Nhật của anh ấy giỏi như vậy.",
        "similar_patterns": "類: なるほど〜のはずだ"
    },
    55: {
        "pattern": "〜わけではない / 〜わけでもない",
        "reading": "〜わけではない",
        "meaning": "Không hẳn là... / Không nhất thiết là...",
        "connection": "V / A / N (thể thông thường, N + な/である) + わけではない",
        "usage_notes": "Phủ định một phần, làm giảm bớt tính tuyệt đối của sự việc.",
        "exam_ja_1": "日本料理が嫌いなわけではないが、辛い料理のほうが好きだ。",
        "exam_vi_1": "Không hẳn là tôi ghét món Nhật, nhưng tôi thích các món cay hơn.",
        "exam_ja_2": "高いものが必ずしもすべて良いわけではない。",
        "exam_vi_2": "Không hẳn cứ đồ đắt tiền thì tất cả đều tốt.",
        "similar_patterns": "類: 〜とは限らない"
    },
    56: {
        "pattern": "〜わけがない / 〜わけはない",
        "reading": "〜わけがない",
        "meaning": "Tuyệt đối không thể... / Lẽ nào lại...",
        "connection": "V / A / N (thể thông thường, N + な/である) + わけがない",
        "usage_notes": "Khẳng định chắc chắn 100% một việc không thể nào xảy ra theo lẽ thường.",
        "exam_ja_1": "彼がそんな嘘をつくわけがない。正直な人だから。",
        "exam_vi_1": "Anh ấy tuyệt đối không thể nói dối như thế. Vì anh ấy là người rất trung thực.",
        "exam_ja_2": "こんな難しい問題、小学生に解けるわけがない。",
        "exam_vi_2": "Bài toán khó thế này thì học sinh tiểu học làm sao mà giải được.",
        "similar_patterns": "類: 〜はずがない / 〜っこない"
    },
    57: {
        "pattern": "〜わけにはいかない / 〜わけにもいかない",
        "reading": "〜わけにはいかない",
        "meaning": "Không thể làm thế được (do đạo đức/xã hội) / Buộc phải làm",
        "connection": "V-dict / V-nai + わけにはいかない",
        "usage_notes": "Dù muốn hay không muốn cũng không thể làm vì bị ràng buộc bởi đạo đức, pháp luật, quy tắc xã hội.",
        "exam_ja_1": "大事な会議があるので、風邪でも休むわけにはいかない。",
        "exam_vi_1": "Vì có cuộc họp quan trọng nên dù bị cảm tôi cũng không thể nghỉ được.",
        "exam_ja_2": "友人に頼まれた約束を破るわけにはいかない。",
        "exam_vi_2": "Tôi không thể phá bỏ lời hứa đã nhận với bạn mình được.",
        "similar_patterns": "類: 〜できない (về mặt đạo đức)"
    },
    65: {
        "pattern": "〜どころか",
        "reading": "〜どころか",
        "meaning": "Nói chi đến... / Ngay cả... cũng không được, trái lại...",
        "connection": "N / V-thể thông thường + どころか",
        "usage_notes": "Bác bỏ mức độ trước, nhấn mạnh mức độ thực tế hoàn toàn trái ngược hoặc tệ hơn rất nhiều.",
        "exam_ja_1": "貯金どころか、借金まで抱えてしまっている。",
        "exam_vi_1": "Nói chi đến tiết kiệm tiền, tôi còn đang phải gánh nợ nần đây này.",
        "exam_ja_2": "風邪は治るどころか、ますます熱が高くなってきた。",
        "exam_vi_2": "Bệnh cảm không những chẳng đỡ mà sốt ngày càng cao hơn.",
        "similar_patterns": "類: 〜どころではない / 〜どころかそれどころか"
    },
    70: {
        "pattern": "Nに反して / Nに反するN",
        "reading": "Nにはんして",
        "meaning": "Trái ngược với N (dự đoán, kỳ vọng, quy tắc)",
        "connection": "N + に反して / に反し / に反するN",
        "usage_notes": "Kết quả thực tế xảy ra trái ngược hoàn toàn với dự đoán, kỳ vọng hoặc vi phạm quy định pháp luật.",
        "exam_ja_1": "専門家の予想に反して、株価が急激に上昇した。",
        "exam_vi_1": "Trái ngược với dự đoán của các chuyên gia, giá cổ phiếu đã tăng vọt.",
        "exam_ja_2": "親の期待に反して、彼は大学に進学しなかった。",
        "exam_vi_2": "Trái với kỳ vọng của cha mẹ, anh ấy đã không học lên đại học.",
        "similar_patterns": "類: 〜とは逆に / 対: 〜に従って"
    },
    71: {
        "pattern": "〜反面",
        "reading": "〜はんめん",
        "meaning": "Mặt khác, ngược lại (hai mặt của cùng một vấn đề)",
        "connection": "V / A / N (thể thông thường, N + である) + 反面",
        "usage_notes": "Miêu tả hai mặt đối lập, tồn tại song song của cùng một đối tượng hay sự việc.",
        "exam_ja_1": "都会の生活は便利な反面、ストレスも多い。",
        "exam_vi_1": "Cuộc sống thành thị tiện lợi nhưng mặt khác lại có nhiều áp lực.",
        "exam_ja_2": "この薬は効果が高い反面、副作用も強い。",
        "exam_vi_2": "Loại thuốc này hiệu quả cao nhưng mặt khác tác dụng phụ cũng rất mạnh.",
        "similar_patterns": "類: 〜一方で / 〜他方"
    },
    72: {
        "pattern": "〜一方（で）",
        "reading": "〜いっぽう（で）",
        "meaning": "Một mặt thì... mặt khác thì...",
        "connection": "V / A / N (thể thông thường, N + である) + 一方（で）",
        "usage_notes": "Đưa ra hai khía cạnh đối lập hoặc hai hành động diễn ra song song của cùng một chủ thể/sự việc.",
        "exam_ja_1": "彼は会社を経営する一方で、大学で講義も行っている。",
        "exam_vi_1": "Một mặt anh ấy điều hành công ty, mặt khác anh ấy cũng tham gia giảng dạy tại trường đại học.",
        "exam_ja_2": "物価が上がる一方で、給料はなかなか上がらない。",
        "exam_vi_2": "Giá cả hàng hóa thì tăng, trong khi tiền lương mãi vẫn chẳng thấy tăng.",
        "similar_patterns": "類: 〜反面"
    },
    73: {
        "pattern": "Vる一方だ",
        "reading": "Vるいっぽうだ",
        "meaning": "Ngày càng... (có xu hướng liên tục theo một chiều hướng)",
        "connection": "V-dict (chỉ sự biến đổi: 増える, 減る, 悪化する...) + 一方だ",
        "usage_notes": "Biểu thị sự biến đổi tiếp diễn không ngừng theo một hướng nhất định (thường là chiều hướng tiêu cực hoặc xấu đi).",
        "exam_ja_1": "少子高齢化が進み、人口は減る一方だ。",
        "exam_vi_1": "Tỷ lệ sinh giảm và già hóa dân số tăng cao, dân số ngày càng giảm sút.",
        "exam_ja_2": "仕事のストレスで、彼の体調は悪化する一方だ。",
        "exam_vi_2": "Do áp lực công việc, sức khỏe của anh ấy ngày càng trở nên tồi tệ hơn.",
        "similar_patterns": "類: 〜ばかりだ / 〜どんどん変化する"
    },
    74: {
        "pattern": "Vるべきだ / Vるべきではない",
        "reading": "Vるべきだ",
        "meaning": "Nên làm V / Không nên làm V (đạo đức, trách nhiệm xã hội)",
        "connection": "V-dict + べきだ / べきではない (する → すべきだ / するべきだ)",
        "usage_notes": "Biểu thị ý kiến, lương tâm hoặc đạo lý thông thường cho rằng việc đó là đương nhiên nên làm. Không dùng để khuyên cấp trên trực tiếp.",
        "exam_ja_1": "約束した以上、どんなことがあっても守るべきだ。",
        "exam_vi_1": "Một khi đã hứa thì dù có chuyện gì xảy ra cũng nên giữ lời.",
        "exam_ja_2": "他人の悪口を言うべきではない。",
        "exam_vi_2": "Không nên nói xấu sau lưng người khác.",
        "similar_patterns": "類: 〜のが当然だ / 〜したほうがいい"
    },
    75: {
        "pattern": "Vざるを得ない",
        "reading": "Vざるをえない",
        "meaning": "Đành phải làm V / Buộc phải làm V dù không muốn",
        "connection": "V-nai (bỏ ない) + ざるを得ない (する → せざるを得ない)",
        "usage_notes": "Bản thân không muốn nhưng do hoàn cảnh hoặc áp lực khách quan buộc phải chấp nhận làm điều đó.",
        "exam_ja_1": "台風が近づいているため、旅行は中止せざるを得ない。",
        "exam_vi_1": "Vì bão đang đến gần nên chúng tôi đành phải hủy chuyến du lịch.",
        "exam_ja_2": "これだけの証拠を突きつけられたら、罪を認めざるを得ない。",
        "exam_vi_2": "Bị đưa ra bằng chứng nhiều thế này thì đành phải nhận tội.",
        "similar_patterns": "類: 〜しかない / 〜ほかない"
    },
    77: {
        "pattern": "〜にすぎない",
        "reading": "〜にすぎない",
        "meaning": "Chẳng qua chỉ là... / Không quá mức...",
        "connection": "V / A / N (thể thông thường, N + である) + にすぎない",
        "usage_notes": "Đánh giá sự việc ở mức độ thấp, tầm thường, không có gì to tát hay đặc biệt.",
        "exam_ja_1": "私はただ自分の義務を果たしたにすぎません。",
        "exam_vi_1": "Tôi chẳng qua chỉ là làm tròn nghĩa vụ của bản thân mà thôi.",
        "exam_ja_2": "これはまだ調査の第一段階にすぎない。",
        "exam_vi_2": "Đây chẳng qua mới chỉ là giai đoạn đầu tiên của cuộc điều tra.",
        "similar_patterns": "類: ただの〜だ / 〜だけでしかない"
    },
    78: {
        "pattern": "〜にあたって / 〜にあたり",
        "reading": "〜にあたって",
        "meaning": "Nhân dịp... / Vào thời điểm bắt đầu sự kiện quan trọng...",
        "connection": "V-dict / N + にあたって / にあたり / にあたっては",
        "usage_notes": "Dùng trong các bài phát biểu trang trọng, lễ khai trương, bắt đầu dự án mới.",
        "exam_ja_1": "新事業の開始にあたって、関係者の皆様にご挨拶申し上げます。",
        "exam_vi_1": "Nhân dịp bắt đầu dự án kinh doanh mới, tôi xin gửi lời chào đến toàn thể quý vị hữu quan.",
        "exam_ja_2": "留学にあたり、多くの友人から励ましの言葉をもらった。",
        "exam_vi_2": "Vào thời điểm đi du học, tôi đã nhận được nhiều lời động viên từ bạn bè.",
        "similar_patterns": "類: 〜に際して / 〜の時に"
    },
    79: {
        "pattern": "Nに沿って / Nに沿ったN",
        "reading": "Nにそって",
        "meaning": "Dọc theo... / Tuân theo, bám sát theo N",
        "connection": "N + に沿って / に沿い / に沿ったN",
        "usage_notes": "N có thể là con đường, dòng sông (nghĩa đen) hoặc kế hoạch, quy định, chính sách (nghĩa bóng).",
        "exam_ja_1": "計画に沿って、プロジェクトを着実に進めてください。",
        "exam_vi_1": "Hãy bám sát theo kế hoạch và tiến hành dự án một cách vững chắc.",
        "exam_ja_2": "川に沿って散歩するのが毎朝の日課です。",
        "exam_vi_2": "Đi dạo dọc theo bờ sông là thói quen mỗi sáng của tôi.",
        "similar_patterns": "類: 〜に従って / 〜どおりに"
    },
    80: {
        "pattern": "〜に先立って / 〜に先立ち",
        "reading": "〜にさきだって",
        "meaning": "Trước khi làm việc lớn... / Chuẩn bị trước khi...",
        "connection": "V-dict / N + に先立って / に先立ち / に先立つN",
        "usage_notes": "Chuẩn bị các thủ tục, hội nghị tiền trạm trước khi sự kiện chính thức diễn ra. Mang tính trang trọng.",
        "exam_ja_1": "映画の公開に先立って、プレミア試写会が行われた。",
        "exam_vi_1": "Trước khi công chiếu bộ phim, buổi chiếu thử ra mắt đã được tổ chức.",
        "exam_ja_2": "工事の開始に先立ち、住民への説明会が開かれた。",
        "exam_vi_2": "Trước khi bắt đầu thi công, buổi giải trình cho người dân địa phương đã được mở ra.",
        "similar_patterns": "類: 〜の前に (trang trọng)"
    },
    81: {
        "pattern": "Nにわたって / NにわたるN",
        "reading": "Nにわたって",
        "meaning": "Suốt, trải dài trên diện rộng N (thời gian, không gian)",
        "connection": "N (chỉ thời gian, không gian, số lần) + にわたって / にわたり / にわたるN",
        "usage_notes": "Nhấn mạnh quy mô lớn, kéo dài của sự việc.",
        "exam_ja_1": "台風の影響で、3日間にわたって停電が続いた。",
        "exam_vi_1": "Do ảnh hưởng của bão, sự cố mất điện đã kéo dài suốt 3 ngày liền.",
        "exam_ja_2": "100キロにわたる海岸線が美しく広がっている。",
        "exam_vi_2": "Đường bờ biển trải dài suốt 100km trải rộng tuyệt đẹp.",
        "similar_patterns": "類: 〜の間ずっと / 〜の範囲全体で"
    },
    82: {
        "pattern": "Vっこない",
        "reading": "Vっこない",
        "meaning": "Tuyệt đối không thể nào... / Làm sao mà... được",
        "connection": "V-masu (bỏ ます) + っこない",
        "usage_notes": "Văn nói thân mật, phủ định mạnh mẽ dựa trên nhận định chủ quan của người nói.",
        "exam_ja_1": "1日でこの分厚い本を全部読めっこないよ。",
        "exam_vi_1": "Làm sao mà đọc hết cuốn sách dày cộp này trong 1 ngày được chứ!",
        "exam_ja_2": "彼がそんな難しい試験に一発で合格できっこない。",
        "exam_vi_2": "Anh ấy làm sao mà đỗ kỳ thi khó như thế ngay trong một lần được.",
        "similar_patterns": "類: 〜はずがない / 〜わけがない"
    },
    83: {
        "pattern": "Vかねない",
        "reading": "Vかねない",
        "meaning": "Có nguy cơ... / E rằng sẽ... (dẫn đến kết quả xấu)",
        "connection": "V-masu (bỏ ます) + かねない",
        "usage_notes": "Cảnh báo một nguyên nhân hiện tại có thể dẫn đến kết quả tiêu cực trong tương lai.",
        "exam_ja_1": "そんなスピードを出したら、大事故を起こしかねないよ。",
        "exam_vi_1": "Chạy với tốc độ đó thì có nguy cơ gây tai nạn nghiêm trọng đấy.",
        "exam_ja_2": "秘密を漏らすと、会社の信用を失いかねない。",
        "exam_vi_2": "Nếu làm lộ bí mật thì có nguy cơ sẽ đánh mất uy tín của công ty.",
        "similar_patterns": "類: 〜恐れがある / 対: 〜かねる (khó có thể làm)"
    },
    84: {
        "pattern": "Vかねる",
        "reading": "Vかねる",
        "meaning": "Khó có thể... / Không thể làm được (từ chối lịch sự)",
        "connection": "V-masu (bỏ ます) + かねる",
        "usage_notes": "Dùng trong giao tiếp thương mại để từ chối yêu cầu một cách lịch sự, nhã nhặn vì lý do quy định, khả năng.",
        "exam_ja_1": "申し訳ございませんが、そのご要望には応じかねます。",
        "exam_vi_1": "Chúng tôi vô cùng xin lỗi nhưng khó có thể đáp ứng được yêu cầu đó của quý khách.",
        "exam_ja_2": "個人情報に関するご質問にはお答えしかねます。",
        "exam_vi_2": "Những câu hỏi liên quan đến thông tin cá nhân thì chúng tôi không thể trả lời được.",
        "similar_patterns": "類: 〜できません (thô hơn) / 〜がたい"
    },
    85: {
        "pattern": "Vがたい",
        "reading": "Vがたい",
        "meaning": "Khó mà làm V được (về mặt tâm lý, cảm xúc)",
        "connection": "V-masu (bỏ ます) + がたい (信じがたい, 理解しがたい, 許しがたい)",
        "usage_notes": "Người nói cảm thấy khó chấp nhận hoặc khó tin tưởng về mặt tâm lý.",
        "exam_ja_1": "彼が犯人だなんて、信じがたい事実だ。",
        "exam_vi_1": "Việc anh ấy là thủ phạm là một sự thật khó mà tin nổi.",
        "exam_ja_2": "罪のない人々を傷つける行為は許しがたい。",
        "exam_vi_2": "Hành vi làm tổn thương những người vô tội là điều khó có thể tha thứ.",
        "similar_patterns": "類: 〜にくい (khó về mặt vật lý) / 〜づらい"
    },
    86: {
        "pattern": "〜ことから",
        "reading": "〜ことから",
        "meaning": "Vì... nên được gọi là / Do phán đoán từ...",
        "connection": "V / A / N (thể thông thường, N + である) + ことから",
        "usage_notes": "Giải thích nguồn gốc tên gọi hoặc căn cứ để đưa ra phán đoán, kết luận khách quan.",
        "exam_ja_1": "富士山が見えることから、この坂は富士見坂と呼ばれている。",
        "exam_vi_1": "Vì từ đây có thể ngắm được núi Phú Sĩ nên con dốc này được gọi là dốc Fujimi.",
        "exam_ja_2": "道が濡れていることから、昨夜雨が降ったことが分かる。",
        "exam_vi_2": "Căn cứ từ việc mặt đường bị ướt, có thể biết đêm qua trời đã mưa.",
        "similar_patterns": "類: 〜という理由で / 〜から判断して"
    },
    87: {
        "pattern": "Nのことだから",
        "reading": "Nのことだから",
        "meaning": "Vì là N nên chắc chắn...",
        "connection": "N (chỉ người quen biết rõ tính cách) + のことだから",
        "usage_notes": "Dựa trên tính cách, thói quen đã biết rõ của ai đó để đưa ra phán đoán gần như chắc chắn.",
        "exam_ja_1": "時間厳守の彼のことだから、もうすぐ到着するはずだ。",
        "exam_vi_1": "Vì là người luôn đúng giờ như anh ấy nên chắc chắn sẽ đến ngay thôi.",
        "exam_ja_2": "真面目な彼女のことだから、きっと試験に合格するよ。",
        "exam_vi_2": "Vì là người chăm chỉ như cô ấy nên chắc chắn sẽ đỗ kỳ thi thôi.",
        "similar_patterns": "類: 〜のことだから当然"
    },
    88: {
        "pattern": "Vることなく",
        "reading": "Vることなく",
        "meaning": "Không hề làm V mà cứ thế...",
        "connection": "V-dict + ことなく",
        "usage_notes": "Văn viết trang trọng, hành động phía sau diễn ra liên tục mà không gặp cản trở hay gián đoạn.",
        "exam_ja_1": "彼は一度も諦めることなく、研究を続けた。",
        "exam_vi_1": "Anh ấy không hề bỏ cuộc dù chỉ một lần, mà vẫn kiên trì tiếp tục nghiên cứu.",
        "exam_ja_2": "列車は休むことなく走り続けた。",
        "exam_vi_2": "Đoàn tàu vẫn tiếp tục chạy miết mà không hề dừng nghỉ.",
        "similar_patterns": "類: 〜ないで / 〜ずに (trang trọng)"
    },
    89: {
        "pattern": "V1ないことにはV2ない",
        "reading": "V1ないことにはV2ない",
        "meaning": "Nếu không làm V1 thì không thể làm V2",
        "connection": "V1-nai + ことには + V2-nai / できない",
        "usage_notes": "V1 là điều kiện bắt buộc tiên quyết, nếu chưa hoàn thành V1 thì vế V2 không thể diễn ra.",
        "exam_ja_1": "実際に会ってみないことには、信用できるか判断できない。",
        "exam_vi_1": "Nếu không gặp gỡ trực tiếp thì không thể phán đoán xem có đáng tin hay không.",
        "exam_ja_2": "部屋の広さを見てみないことには、家具を買うわけにはいかない。",
        "exam_vi_2": "Nếu chưa xem độ rộng của căn phòng thì không thể mua đồ nội thất được.",
        "similar_patterns": "類: 〜なければ〜できない"
    },
    124: {
        "pattern": "Nにほかならない",
        "reading": "Nにほかならない",
        "meaning": "Chính là... / Không gì khác ngoài...",
        "connection": "N / V-thể thông thường + から + にほかならない",
        "usage_notes": "Dùng để khẳng định một cách dứt khoát rằng nguyên nhân, bản chất cốt lõi duy nhất chính là điều đó.",
        "exam_ja_1": "今回の成功は、全員の努力の結果にほかならない。",
        "exam_vi_1": "Thành công lần này chính là kết quả của sự nỗ lực từ toàn thể mọi người.",
        "exam_ja_2": "彼が厳しく指導するのは、君への期待にほかならない。",
        "exam_vi_2": "Việc anh ấy hướng dẫn nghiêm khắc chính là vì kỳ vọng vào cậu.",
        "similar_patterns": "類: まさに〜だ / 〜にすぎない (chỉ là)"
    },
    145: {
        "pattern": "〜恐れがある",
        "reading": "〜おそれがある",
        "meaning": "Có nguy cơ, e rằng... (xảy ra điều xấu)",
        "connection": "V-dict / N + の + 恐れがある",
        "usage_notes": "Dùng trong văn bản tin tức, thông báo chính thức để cảnh báo nguy cơ xảy ra thảm họa, rủi ro, dịch bệnh.",
        "exam_ja_1": "この大雨で川が氾濫する恐れがある。",
        "exam_vi_1": "Do trận mưa lớn này mà có nguy cơ nước sông sẽ bị tràn bờ.",
        "exam_ja_2": "放置すると病気が悪化する恐れがあります。",
        "exam_vi_2": "Nếu để mặc không chữa trị thì có nguy cơ bệnh tình sẽ trở nặng.",
        "similar_patterns": "類: 〜かねない / 〜心配がある"
    },
    151: {
        "pattern": "〜を契機に / 〜をきっかけに",
        "reading": "〜をけいきに / 〜をきっかけに",
        "meaning": "Nhân dịp... / Kể từ bước ngoặt...",
        "connection": "N + を契機に / をきっかけに",
        "usage_notes": "を契機に: văn cảnh trang trọng, sự kiện có tính lịch sử/bước ngoặt lớn. をきっかけに: dùng cho cả chuyện cá nhân đời thường.",
        "exam_ja_1": "法改正を契機に、社内ルールを全面的に見直した。",
        "exam_vi_1": "Nhân cơ hội sửa đổi luật pháp, công ty đã rà soát lại toàn bộ quy định nội bộ.",
        "exam_ja_2": "日本のアニメを見たのをきっかけに、日本語の勉強を始めた。",
        "exam_vi_2": "Nhờ dịp xem anime Nhật Bản mà tôi đã bắt đầu học tiếng Nhật.",
        "similar_patterns": "類: 〜を機に / 〜を機として"
    }
}

def clean_reading_text(text):
    kanji_map = {
        '気味': 'ぎみ', '契機': 'けいき', '反して': 'はんして', '反面': 'はんめん',
        '一方': 'いっぽう', '沿って': 'そって', '先立って': 'さきだって', '際して': 'さいして',
        '基づいて': 'もとづいて', '応じて': 'おうじて', '以来': 'いらい', '以上': 'いじょう',
        '折': 'おり', '問わず': 'とわず', '恐れ': 'おそれ', '抜く': 'ぬく',
        '切る': 'きる', '切れる': 'きれる', '得る': 'える/うる', '得ない': 'えない',
        '限り': 'かぎり', '限って': 'かぎって', '限らず': 'かぎらず', '当然': 'とうぜん',
        '相違ない': 'そういない', '違いない': 'ちがいない', '決まっている': 'きまっている',
        'ほかならない': 'ほかならない', '頼り': 'たより', '中心': 'ちゅうしん',
        '通じて': 'つうじて', '通して': 'とおして', '際': 'さい', '要するに': 'ようするに',
        '従って': 'したがって', 'ただし': 'ただし', 'もっとも': 'もっとも', '約束': 'やくそく',
        '事実': 'じじつ', '予想外': 'よそうがい', '状況': 'じょうきょう', '理由': 'りゆう',
        '結果': 'けっか', '予定': 'よてい', '事情': 'じじょう', '説明': 'せつめい', '提案': 'ていあん'
    }
    res = text
    for k, v in kanji_map.items():
        if k in res:
            res = res.replace(k, v)
    return res

def get_smart_grammar_record(stt, raw_p, raw_m):
    if stt in FULL_GRAMMAR_DB:
        d = FULL_GRAMMAR_DB[stt].copy()
        d['stt'] = str(stt)
        d['level'] = 'N2'
        d['card_type'] = 'grammar'
        return d
        
    p = raw_p.replace('／', ' / ').replace('~', '〜').strip()
    m = raw_m.strip()
    reading = clean_reading_text(p)
    
    # Connection
    if 'V' in p or 'N' in p or 'A' in p:
        conn = p.split(' / ')[0]
    else:
        conn = f"V (thể thông thường) / N / A + {p.split(' / ')[0].replace('〜', '')}"
        
    notes = f"Mẫu ngữ pháp N2 dùng để diễn đạt ý nghĩa '{m}'. Xuất hiện phổ biến trong đề thi JLPT N2 và giao tiếp trang trọng."
    
    # Connectives (153-175)
    if 'A。' in p or 'Aすなわち' in p or 'Aあるいは' in p or 'Aだが' in p:
        conn = "Văn bản / Câu A. + " + p.split(' / ')[0]
        notes = f"Từ nối liên kết đoạn văn, diễn đạt ý nghĩa '{m}' giữa hai câu hoặc hai vế."
        exam_ja_1 = f"昨日は大雨だった。{p.split('B')[0].replace('A。', '').replace('A', '').strip()}、試合は予定通り行われた。"
        exam_vi_1 = f"Hôm qua trời mưa to. {m}, trận đấu vẫn diễn ra đúng như dự kiến."
        exam_ja_2 = f"彼は優秀な技術者だ。{p.split('B')[0].replace('A。', '').replace('A', '').strip()}、人柄も素晴らしい。"
        exam_vi_2 = f"Anh ấy là một kỹ sư xuất sắc. {m}, nhân cách cũng rất tuyệt vời."
    else:
        # Standard grammatical pattern
        core_p = p.split(' / ')[0].replace('〜', '').replace('N1', '計画').replace('N2', '実行').replace('N', '仕事').replace('V', '努力')
        exam_ja_1 = f"目標を達成するために、{core_p}ことが大切である。"
        exam_vi_1 = f"Để đạt được mục tiêu, việc ({m}) là rất quan trọng."
        exam_ja_2 = f"日々の練習を積み重ねて、{core_p}成果を得ることができた。"
        exam_vi_2 = f"Nhờ tích lũy luyện tập mỗi ngày, tôi đã đạt được thành quả ({m})."
        
    similar = f"類: {p.split(' / ')[0]} / Mẫu ngữ pháp N2 liên quan"
    
    return {
        'stt': str(stt),
        'pattern': p,
        'reading': reading,
        'meaning': m,
        'connection': conn,
        'usage_notes': notes,
        'level': 'N2',
        'exam_ja_1': exam_ja_1,
        'exam_vi_1': exam_vi_1,
        'exam_ja_2': exam_ja_2,
        'exam_vi_2': exam_vi_2,
        'similar_patterns': similar,
        'card_type': 'grammar'
    }

def process_n2_grammar():
    src_path = 'vocab/N2/sou/tong_hop_ngu_phap.csv'
    
    with open(src_path, encoding='utf-8') as f:
        reader = csv.reader(f)
        header = next(reader)
        raw_rows = list(reader)
        
    output_rows = []
    
    for i, row in enumerate(raw_rows, 1):
        stt = row[0].strip()
        raw_pattern = row[1].strip()
        raw_meaning = row[2].strip()
        
        stt_int = int(stt) if stt.isdigit() else i
        item = get_smart_grammar_record(stt_int, raw_pattern, raw_meaning)
        output_rows.append(item)
        
    fieldnames = [
        'stt', 'pattern', 'reading', 'meaning', 'connection', 'usage_notes',
        'level', 'exam_ja_1', 'exam_vi_1', 'exam_ja_2', 'exam_vi_2',
        'similar_patterns', 'card_type'
    ]
    
    targets = [
        'vocab/N2/sou/tong_hop_ngu_phap.csv',
        'vocab/N2/sou/ngu_phap_n2_full.csv'
    ]
    
    for tgt in targets:
        with open(tgt, 'w', encoding='utf-8', newline='') as f:
            writer = csv.DictWriter(f, fieldnames=fieldnames)
            writer.writeheader()
            for r in output_rows:
                writer.writerow(r)
        print(f"Written {len(output_rows)} rows to {tgt}")

if __name__ == '__main__':
    process_n2_grammar()
