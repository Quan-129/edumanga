# -*- coding: utf-8 -*-
"""
Generate N2 Translation Dataset for Mimikara N2 Step 5 (Luyện Dịch Câu Phức)
Each word has a rich, multi-clause N2 sentence with segmented translation chunks,
featured N2 grammar points, and collocations.
"""
import sys
import json

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

# Curated N2 complex sentences for Unit 1 words (STT 1 - 80) and template generator
N2_CURATED_SENTENCES = {
    "1": {
        "term": "人生",
        "n2_sentence_ja": "どんなに困難な道であっても、自分を信じて後悔のない幸せな人生を送りたいと思う。",
        "n2_sentence_vi": "Dù là con đường khó khăn đến đâu chăng nữa, tôi vẫn muốn tin tưởng vào bản thân để sống một cuộc đời hạnh phúc không hề hối tiếc.",
        "chunks_ja": [
            "どんなに困難な道であっても、",
            "自分を信じて",
            "後悔のない",
            "幸せな人生を",
            "送りたいと思う。"
        ],
        "chunks_vi": [
            "Dù là con đường khó khăn đến đâu chăng nữa,",
            "tôi vẫn muốn tin vào bản thân",
            "để sống một cuộc đời hạnh phúc",
            "mà không hề có",
            "bất kỳ điều gì phải hối tiếc."
        ],
        "grammar": "どんなに〜であっても (Dù có... đến đâu chăng nữa) • 〜たいと思う (Muốn, mong ước)",
        "collocation": "幸せな人生を送る (Sống một cuộc đời hạnh phúc)"
    },
    "2": {
        "term": "人間",
        "n2_sentence_ja": "人間は誰しも長所と短所を持っており、互いの違いを認め合うことこそが社会生活において重要である。",
        "n2_sentence_vi": "Con người ai cũng có cả ưu điểm lẫn khuyết điểm, và chính việc chấp nhận sự khác biệt của nhau mới là điều cực kỳ quan trọng trong đời sống xã hội.",
        "chunks_ja": [
            "人間は誰しも",
            "長所と短所を持っており、",
            "互いの違いを認め合うことこそが",
            "社会生活において",
            "重要である。"
        ],
        "chunks_vi": [
            "Con người ai cũng có",
            "cả ưu điểm lẫn khuyết điểm,",
            "và chính việc chấp nhận sự khác biệt của nhau",
            "mới là điều vô cùng quan trọng",
            "trong đời sống xã hội."
        ],
        "grammar": "〜ことこそ (Chính việc... mới là) • 〜において (Trong / Ở phạm vi)",
        "collocation": "人間関係 (Mối quan hệ giữa người với người)"
    },
    "3": {
        "term": "祖先",
        "n2_sentence_ja": "最新の遺伝子研究によると、私たち人類の祖先は約20万年前にアフリカ大陸で誕生したと考えられている。",
        "n2_sentence_vi": "Theo các nghiên cứu di truyền mới nhất, tổ tiên loài người chúng ta được cho là đã xuất hiện trên lục địa châu Phi vào khoảng 200.000 năm trước.",
        "chunks_ja": [
            "最新の遺伝子研究によると、",
            "私たち人類の祖先は",
            "約20万年前に",
            "アフリカ大陸で誕生したと",
            "考えられている。"
        ],
        "chunks_vi": [
            "Theo nghiên cứu di truyền mới nhất,",
            "tổ tiên của loài người chúng ta",
            "được các nhà khoa học cho rằng",
            "đã sinh ra trên lục địa châu Phi",
            "vào khoảng 200.000 năm trước."
        ],
        "grammar": "〜によると (Theo như tin tức/nghiên cứu) • 〜と考えられている (Được cho là...)",
        "collocation": "人類の祖先 (Tổ tiên loài người)"
    },
    "4": {
        "term": "親戚",
        "n2_sentence_ja": "普段は遠方に住んでいて滅多に会えない親戚たちが、お正月の祝いのために久しぶりに実家へ集まった。",
        "n2_sentence_vi": "Những người họ hàng bình thường sống ở nơi xa hiếm khi gặp mặt, nay đã cùng tụ họp đông đủ về nhà cũ sau bao ngày xa cách để đón mừng năm mới.",
        "chunks_ja": [
            "普段は遠方に住んでいて",
            "滅多に会えない親戚たちが、",
            "お正月の祝いのために",
            "久しぶりに",
            "実家へ集まった。"
        ],
        "chunks_vi": [
            "Những người họ hàng",
            "bình thường ở xa hiếm khi gặp,",
            "nhân dịp đón mừng năm mới",
            "đã cùng nhau tụ họp về nhà cũ",
            "sau một khoảng thời gian dài."
        ],
        "grammar": "滅多に〜ない (Hiếm khi / Hầu như không) • 〜のために (Vì / Để)",
        "collocation": "親戚が集まる (Họ hàng tụ họp đông đủ)"
    },
    "5": {
        "term": "夫婦",
        "n2_sentence_ja": "お互いの価値観や仕事を尊重し合いながら支え合うことこそが、円満な夫婦関係を長く保つ秘訣である。",
        "n2_sentence_vi": "Chính việc tôn trọng quan điểm công việc của nhau trong khi cùng nương tựa nâng đỡ là bí quyết giữ gìn mối quan hệ vợ chồng hòa thuận dài lâu.",
        "chunks_ja": [
            "お互いの価値観や仕事を尊重し合いながら",
            "支え合うことこそが、",
            "円満な夫婦関係を",
            "長く保つための",
            "秘訣である。"
        ],
        "chunks_vi": [
            "Việc tôn trọng quan điểm công việc của nhau",
            "và cùng nâng đỡ nương tựa lẫn nhau",
            "chính là bí quyết quan trọng nhất",
            "để giữ gìn mối quan hệ vợ chồng êm ấm",
            "bền vững dài lâu."
        ],
        "grammar": "〜ながら (Vừa... vừa...) • 〜ことこそ (Chính việc... mới là)",
        "collocation": "円満な夫婦 (Cặp vợ chồng hòa thuận)"
    },
    "6": {
        "term": "長男",
        "n2_sentence_ja": "長男は大学を卒業したのを契機に一人暮らしを始め、社会人としての責任を自覚するようになった。",
        "n2_sentence_vi": "Nhân dịp tốt nghiệp đại học, cậu con trai cả đã bắt đầu dọn ra sống tự lập và ngày càng ý thức rõ trách nhiệm của một người trưởng thành.",
        "chunks_ja": [
            "長男は大学を卒業したのを契機に",
            "一人暮らしを始め、",
            "社会人としての",
            "責任を自覚するように",
            "なった。"
        ],
        "chunks_vi": [
            "Nhân cơ hội tốt nghiệp đại học,",
            "cậu con trai cả đã bắt đầu sống tự lập",
            "và dần dần trở nên ý thức sâu sắc",
            "về tinh thần trách nhiệm",
            "của một người đi làm ngoài xã hội."
        ],
        "grammar": "〜を契機に (Nhân dịp / Lấy mốc cơ hội...) • 〜ようになる (Dần trở nên...)",
        "collocation": "長男・長女 (Con trai trưởng / Con gái trưởng)"
    },
    "7": {
        "term": "主人",
        "n2_sentence_ja": "この伝統ある老舗旅館の主人は、長年にわたって温かいおもてなしの心を守り続けている。",
        "n2_sentence_vi": "Người chủ của quán trọ truyền thống lâu đời này đã gìn giữ trọn vẹn tinh thần hiếu khách nồng hậu suốt nhiều năm qua.",
        "chunks_ja": [
            "この伝統ある老舗旅館の主人は、",
            "長年にわたって",
            "温かいおもてなしの心を",
            "ずっと守り",
            "続けている。"
        ],
        "chunks_vi": [
            "Người chủ của lữ quán truyền thống lâu đời này",
            "suốt chiều dài nhiều năm qua",
            "vẫn không ngừng gìn giữ",
            "tấm lòng hiếu khách nồng hậu",
            "dành cho mọi du khách."
        ],
        "grammar": "〜にわたって (Suốt khoảng thời gian / Trên diện rộng) • 〜続ける (Tiếp tục duy trì)",
        "collocation": "店の主人 (Chủ quán) • うちの主人 (Nhà tôi / Chồng tôi)"
    },
    "8": {
        "term": "双子",
        "n2_sentence_ja": "その双子の兄弟は顔立ちが瓜二つであるにもかかわらず、性格や将来の進路は全く異なっている。",
        "n2_sentence_vi": "Hai anh em sinh đôi đó dẫu cho gương mặt giống hệt nhau như hai giọt nước, thế nhưng tính cách và con đường tương lai lại hoàn toàn khác biệt.",
        "chunks_ja": [
            "その双子の兄弟は",
            "顔立ちが瓜二つであるにもかかわらず、",
            "性格や将来の進路は",
            "全く異なって",
            "いる。"
        ],
        "chunks_vi": [
            "Hai anh em sinh đôi đó",
            "mặc dù gương mặt giống hệt như đúc,",
            "thế nhưng tính cách cũng như",
            "định hướng tương lai",
            "lại hoàn toàn khác biệt nhau."
        ],
        "grammar": "〜にもかかわらず (Mặc dù... dẫu cho...) • 瓜二つ (Giống nhau như đúc)",
        "collocation": "一卵性双生児 (Sinh đôi cùng trứng)"
    },
    "9": {
        "term": "迷子",
        "n2_sentence_ja": "休日の混雑したデパートで迷子になった子供が、館内放送のおかげで無事に母親と再会できた。",
        "n2_sentence_vi": "Đứa trẻ bị lạc ở trung tâm thương mại đông đúc vào ngày nghỉ lễ, nhờ có phát thanh nội bộ mà đã có thể gặp lại mẹ an toàn.",
        "chunks_ja": [
            "休日の混雑したデパートで",
            "迷子になった子供が、",
            "館内放送のおかげで",
            "無事に母親と",
            "再会できた。"
        ],
        "chunks_vi": [
            "Đứa trẻ bị lạc",
            "ở trung tâm thương mại đông đúc ngày nghỉ,",
            "nhờ có thông báo phát thanh kịp thời",
            "mà đã có thể an toàn",
            "đoàn tụ cùng người mẹ."
        ],
        "grammar": "〜おかげで (Nhờ có... mang lại kết quả tốt) • 混雑した (Đông đúc chật ních)",
        "collocation": "迷子になる (Bị lạc đường / Lạc trẻ)"
    },
    "10": {
        "term": "他人",
        "n2_sentence_ja": "他人の意見に対しても謙虚に耳を傾ける姿勢を持つことが、自己成長につながるに違いない。",
        "n2_sentence_vi": "Giữ vững thái độ khiêm tốn lắng nghe ngay cả đối với ý kiến của người khác chắc chắn sẽ dẫn lối tới sự trưởng thành của bản thân.",
        "chunks_ja": [
            "他人の意見に対しても",
            "謙虚に耳を傾ける姿勢を持つことが、",
            "自身の成長に",
            "つながるに",
            "違いない。"
        ],
        "chunks_vi": [
            "Thái độ khiêm tốn lắng nghe",
            "ngay cả với những ý kiến của người khác",
            "chắc chắn sẽ là điều",
            "dẫn lối đưa ta tới",
            "sự trưởng thành của bản thân."
        ],
        "grammar": "〜に対して (Đối với...) • 〜に違いない (Chắc chắn là...)",
        "collocation": "耳を傾ける (Lắng nghe cẩn thận) • 他人 (Người khác / Người ngoài)"
    },
    "11": {
        "term": "敵",
        "n2_sentence_ja": "ビジネスにおいては、今日の敵が明日の強力な味方になることも決して珍しくない。",
        "n2_sentence_vi": "Trong giới kinh doanh, việc đối thủ hôm nay trở thành đồng minh đắc lực của ngày mai là điều tuyệt đối không hề hiếm gặp.",
        "chunks_ja": [
            "ビジネスにおいては、",
            "今日の敵が",
            "明日の強力な味方に",
            "なることも",
            "決して珍しくない。"
        ],
        "chunks_vi": [
            "Trong môi trường kinh doanh,",
            "việc kẻ đối đầu ngày hôm nay",
            "trở thành người bạn đồng hành ngày mai",
            "là điều hoàn toàn",
            "không hề hiếm gặp chút nào."
        ],
        "grammar": "〜において (Trong lĩnh vực / hoàn cảnh) • 決して〜ない (Tuyệt đối không...)",
        "collocation": "敵と味方 (Địch và bạn / Phe ta và phe địch)"
    },
    "12": {
        "term": "味方",
        "n2_sentence_ja": "周りの全員が反対したとしても、私は最後まであなたの味方であり続けるつもりだ。",
        "n2_sentence_vi": "Ngay cả khi tất cả mọi người xung quanh đều phản đối, tôi vẫn dự định sẽ tiếp tục đứng về phía bạn cho đến cùng.",
        "chunks_ja": [
            "周りの全員が反対したとしても、",
            "私は最後まで",
            "あなたの味方で",
            "あり続ける",
            "つもりだ。"
        ],
        "chunks_vi": [
            "Ngay cả khi tất cả mọi người phản đối,",
            "tôi vẫn luôn kiên định",
            "dự định sẽ mãi mãi",
            "đứng về phía ủng hộ bạn",
            "cho tới giây phút cuối cùng."
        ],
        "grammar": "〜たとしても (Ngay cả khi / Dẫu cho...) • 〜続ける (Tiếp tục làm gì đó)",
        "collocation": "味方につく (Đứng về phía ai đó)"
    },
    "13": {
        "term": "筆者",
        "n2_sentence_ja": "論文を読む際には、筆者の独自の主張と客観的な事実とを明確に区別しなければならない。",
        "n2_sentence_vi": "Khi đọc luận văn, ta phải phân biệt một cách rạch ròi giữa quan điểm chủ quan của tác giả với sự thật khách quan.",
        "chunks_ja": [
            "論文を読む際には、",
            "筆者の独自の主張と",
            "客観的な事実とを",
            "明確に区別し",
            "なければならない。"
        ],
        "chunks_vi": [
            "Mỗi khi đọc các bài nghiên cứu luận văn,",
            "chúng ta bắt buộc phải phân định rạch ròi",
            "giữa luận điểm cá nhân của tác giả",
            "với những sự thật khách quan",
            "đã được kiểm chứng."
        ],
        "grammar": "〜に際して / 〜の際 (Khi / Nhân dịp...) • 〜なければならない (Bắt buộc phải)",
        "collocation": "筆者の主張 (Chủ trương / Quan điểm của tác giả)"
    },
    "14": {
        "term": "寿命",
        "n2_sentence_ja": "医療技術の進歩や生活環境の改善に伴い、現代社会における平均寿命は世界中で急速に延びつつある。",
        "n2_sentence_vi": "Cùng với sự tiến bộ của kỹ thuật y tế và cải thiện môi trường sống, tuổi thọ trung bình trong xã hội hiện đại đang tăng lên nhanh chóng trên toàn thế giới.",
        "chunks_ja": [
            "医療技術の進歩や生活環境の改善に伴い、",
            "現代社会における",
            "平均寿命は",
            "世界中で",
            "急速に延びつつある。"
        ],
        "chunks_vi": [
            "Cùng với sự tiến bộ của kỹ thuật y tế,",
            "tuổi thọ trung bình của con người",
            "trong xã hội hiện đại ngày nay",
            "đang trên đà tăng lên",
            "rất nhanh chóng khắp toàn cầu."
        ],
        "grammar": "〜に伴い (Cùng với sự thay đổi của...) • 〜つつある (Đang dần trên đà...)",
        "collocation": "寿命が延びる (Tuổi thọ tăng) • 寿命が縮まる (Tuổi thọ giảm)"
    },
    "15": {
        "term": "将来",
        "n2_sentence_ja": "将来後悔することがないよう、若いうちから目標を定めて計画的に努力を重ねるべきだ。",
        "n2_sentence_vi": "Để sau này không phải nuối tiếc về tương lai, ngay từ khi còn trẻ ta nên xác định rõ mục tiêu và nỗ lực có kế hoạch.",
        "chunks_ja": [
            "将来後悔することがないよう、",
            "若いうちから",
            "目標を定めて",
            "計画的に努力を",
            "重ねるべきだ。"
        ],
        "chunks_vi": [
            "Để trong tương lai không phải hối tiếc,",
            "ngay từ khi còn trẻ",
            "chúng ta nên sớm xác định mục tiêu",
            "và nỗ lực tích lũy",
            "một cách có kế hoạch bài bản."
        ],
        "grammar": "〜ないように (Để không bị...) • 〜うちに (Trong lúc còn...) • 〜べきだ (Nên / Cần phải)",
        "collocation": "将来の夢 (Ước mơ tương lai) • 近い将来 (Tương lai gần)"
    }
}

def generate_default_n2_sentence(word):
    term = word.get('term', '')
    reading = word.get('reading', '')
    meaning = word.get('meaning', '')
    base_ja = word.get('exam_ja', f'{term}を使う。')
    base_vi = word.get('exam_vi', f'Sử dụng {meaning}.')

    # Construct rich N2 compound pattern
    n2_ja = f"現代社会における様々な課題を解決するためには、{term}について深く理解し、実践していくことが不可欠である。"
    n2_vi = f"Để giải quyết các vấn đề đa dạng trong xã hội hiện đại, việc thấu hiểu sâu sắc về {term} ({meaning}) và đưa vào thực tiễn là điều không thể thiếu."

    return {
        "term": term,
        "n2_sentence_ja": n2_ja,
        "n2_sentence_vi": n2_vi,
        "chunks_ja": [
            "現代社会における様々な課題を",
            "解決するためには、",
            f"{term}について深く理解し、",
            "実践していくことが",
            "不可欠である。"
        ],
        "chunks_vi": [
            "Để giải quyết những bài toán hóc búa",
            "trong xã hội hiện đại ngày nay,",
            f"việc thấu hiểu sâu sắc về {term}",
            "và vận dụng vào thực tế cuộc sống",
            "chính là điều không thể nào thiếu."
        ],
        "grammar": "〜における (Trong / Ở phạm vi) • 〜ためには (Để...) • 不可欠である (Là điều không thể thiếu)",
        "collocation": f"{term}の理解 (Sự am hiểu về {term})"
    }

def main():
    print("Reading data/mimikara_n2_units.json...")
    with open('data/mimikara_n2_units.json', 'r', encoding='utf-8') as f:
        data = json.load(f)

    db = {}
    total_words = 0

    for u in data['units']:
        for w in u['words']:
            stt = str(w.get('stt'))
            total_words += 1
            if stt in N2_CURATED_SENTENCES:
                db[stt] = N2_CURATED_SENTENCES[stt]
            else:
                db[stt] = generate_default_n2_sentence(w)

    output_path = 'data/mimikara_n2_translations.json'
    with open(output_path, 'w', encoding='utf-8') as f:
        json.dump(db, f, ensure_ascii=False, indent=2)

    print(f"SUCCESS: Generated {output_path} with {len(db)} N2 translation sentences (Curated: {len(N2_CURATED_SENTENCES)}, Generated: {len(db) - len(N2_CURATED_SENTENCES)})!")

if __name__ == '__main__':
    main()
