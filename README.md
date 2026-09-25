# VocabStory — English, lived.

Kendi kelime havuzundan kişiselleştirilmiş İngilizce hikâyeler, diyaloglar ve günlük senaryolar üreten; okuma, dinleme, telaffuz pratiği ve anlama kontrolünü tek ekranda birleştiren, tamamen istemci tarafında (client-side) çalışan bir İngilizce öğrenme uygulaması.

Google Gemini API üzerinden içerik üretir, kelime havuzunu ve tercihleri tarayıcının `localStorage`'ında saklar. Sunucu veya backend gerektirmez — tek bir `.html` dosyasıdır.

---

## Özellikler

- **Kişisel kelime havuzu** — Quizlet benzeri metinleri (word–anlam çiftleri, sekme/CSV, alt alta liste) otomatik ayrıştırarak içe aktarır.
- **AI destekli içerik üretimi** — Seçilen kelimelerden, seviyeye (A1–C2) ve formata (hikâye / diyalog / günlük senaryo) göre özgün metin üretir.
- **Etkileşimli okuma** — Metindeki her kelimeye dokunarak telaffuzunu dinleyebilir, anlamını görebilir ve havuza ekleyebilirsiniz. Hedef kelimeler metin içinde vurgulanır.
- **Shadowing (konuşma pratiği)** — Web Speech API ile mikrofon üzerinden okunan cümle, hedef cümleyle karşılaştırılıp benzerlik oranı hesaplanır.
- **Anlama kontrolü (quiz)** — Üretilen metne dayalı, açıklamalı çoktan seçmeli soru.
- **İlerleme takibi** — Öğrenilen / tekrar edilecek kelime sayıları ve halka (ring) grafikle görsel ilerleme özeti.
- **Yedekleme** — Kelime havuzunu JSON olarak dışa/içe aktarma.
- **Açık/koyu tema** — Sistem tercihine duyarlı, elle değiştirilebilir.
- **Tam responsive** — Masaüstünde iki kolonlu dashboard, mobilde alt sekme çubuğu (tab bar) ve tek kolon düzen.

---

## Kurulum ve Çalıştırma

Herhangi bir derleme adımı gerekmez.

1. `vocabstory-modern-v2.html` dosyasını bir tarayıcıda açın (çift tıklayarak veya basit bir statik sunucuyla: `npx serve .`).
2. Sağ üstteki **⚙ Ayarlar** ikonuna tıklayın.
3. **Gemini API** bölümüne kendi [Google AI Studio](https://aistudio.google.com/) API anahtarınızı girin.
4. Model adını gerekirse güncelleyin (varsayılan: `gemini-2.5-flash`).
5. **Kelime içe aktar** alanına kelime listenizi yapıştırın, **Değişiklikleri kaydet**'e tıklayın.
6. Ana ekrandan format ve seviye seçip **Yeni bölüm oluştur**'a basın.

> ⚠️ API anahtarı yalnızca tarayıcının `localStorage`'ında tutulur. Bu, hızlı prototipleme için uygundur ancak **üretim/paylaşımlı ortamda güvenli değildir** — anahtarın istemci tarafında görünür olmaması için bir backend proxy kullanılması önerilir.

---

## Teknoloji

| Katman | Kullanılan |
|---|---|
| Arayüz | Saf HTML + CSS (framework yok) |
| Mantık | Vanilla JavaScript (framework yok) |
| İçerik üretimi | Google Gemini API (`generateContent`, JSON çıktı modu) |
| Ses | Web Speech API (`SpeechSynthesis` + `SpeechRecognition`) |
| Veri saklama | `localStorage` (kelime havuzu, tema, API ayarları) |

---

## Tasarım Sistemi

- **Renk/tema:** CSS custom property tabanlı, `color-mix()` ile üretilen açık/koyu tema değişkenleri (`:root` ve `[data-theme="dark"]`).
- **Tipografi:** Arayüzde sistem fontu (SF Pro / Inter), okuma alanında bilinçli olarak serif (Georgia) — uzun metinde okunabilirliği artırmak için.
- **Bileşenler:** Tutarlı radius skalası (`--radius-sm/md/lg/xl`), glassmorphism kart yüzeyleri (`backdrop-filter: blur`), yumuşak gölge katmanları.
- **Erişilebilirlik:** `prefers-reduced-motion` desteği, `aria-live` toast bildirimleri, `aria-modal` diyaloglar, güvenli alan (safe-area-inset) desteği.
- **Duyarlı tasarım:** 900px ve 640px kırılım noktaları; mobilde yan panel gizlenip alt tab bar'a geçiş yapılır.

---

## Klasör Yapısı

Proje tek dosyadan oluşur:

```
vocabstory-modern-v2.html   # HTML + CSS + JS bir arada
```

---

## Bilinen Sınırlamalar

- API anahtarı yalnızca istemci tarafında saklanır; canlıya alınacaksa backend proxy önerilir.
- Konuşma tanıma (`SpeechRecognition`), yalnızca Chromium tabanlı tarayıcılarda desteklenir; diğer tarayıcılarda shadowing özelliği devre dışı kalır.
- Veriler yalnızca tarayıcı `localStorage`'ında tutulur; tarayıcı verisi temizlenirse kelime havuzu kaybolur (düzenli JSON yedek alınması önerilir).

---

## Lisans

Bu proje için lisans belirtilmemiştir — dağıtmadan veya paylaşmadan önce bir lisans (ör. MIT) eklemeniz önerilir.
