import csv, sys
sys.stdout.reconfigure(encoding='utf-8')
with open('vocab/N2/tu_vung_n2_theo_30_chuong.csv', encoding='utf-8-sig') as f:
    vocab = list(csv.DictReader(f))
with open('vocab/N2/ngu_phap_n2_theo_30_chuong.csv', encoding='utf-8-sig') as f:
    grammar = list(csv.DictReader(f))
for ch in range(6, 11):
    ch_v = [x for x in vocab if x['Chuong'] == str(ch)]
    ch_g = [x for x in grammar if x['Chuong'] == str(ch)]
    print(f"=== CH{ch}: vocab STT {ch_v[0]['STT_Goc']}-{ch_v[-1]['STT_Goc']}, grammar STT {ch_g[0]['STT_Goc']}-{ch_g[-1]['STT_Goc']} ===")
    for v in ch_v:
        print(f"  V{v['STT_Goc']}: {v['Tu_Vung']} - {v['Nghia']}")
    for g in ch_g:
        print(f"  G{g['STT_Goc']}: {g['Pattern']} ({g['Reading']}) - {g['Meaning']}")
