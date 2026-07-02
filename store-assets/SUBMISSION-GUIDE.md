# App Store'ga topshirish — qadamba-qadam qo'llanma

Holat: Apple Developer hisobi bor, iPhone + Xcode tayyor.
Bundle ID: `uz.zakovat.timer` · Versiya: 1.0 (build 1)

---

## 1-QADAM — GitHub Pages (maxfiylik siyosati URL)

1. https://github.com/xushnudjohn/zakovat-timer → **Settings** → **Pages**
2. **Source**: "Deploy from a branch"
3. **Branch**: `main`, papka: `/docs` → **Save**
4. 1-2 daqiqa kuting. URL tayyor bo'ladi:
   `https://xushnudjohn.github.io/zakovat-timer/privacy-policy.html`
5. Brauzerda ochib, ishlayotganini tekshiring.

---

## 2-QADAM — App Store Connect'da ilova yaratish

1. https://appstoreconnect.apple.com → **My Apps** → **+** → **New App**
2. To'ldiring:
   - Platform: **iOS**
   - Name: **Zakovat Timer**
   - Primary Language: **Uzbek** (yoki English)
   - Bundle ID: **uz.zakovat.timer** (ro'yxatdan tanlanadi)
   - SKU: `zakovat-timer-001` (ixtiyoriy, ichki kod)
3. **Create**.

---

## 3-QADAM — Xcode'da Archive (release build)

> Simulator emas, real "Any iOS Device" tanlanadi.

1. Xcode'da loyihani oching (allaqachon ochiq).
2. Yuqoridagi qurilma tanlash → **Any iOS Device (arm64)** ni tanlang.
3. Menyu: **Product → Scheme → Edit Scheme** → Run → Build Configuration = **Release** ekanini tekshiring (Archive uchun Release default).
4. **Signing & Capabilities** tab'ida Team tanlangan, "Automatically manage signing" yoqilgan bo'lsin.
5. Menyu: **Product → Archive**. Build 3-5 daqiqa.
6. Tugagach **Organizer** oynasi ochiladi.

---

## 4-QADAM — App Store Connect'ga yuklash

1. Organizer'da yangi arxivni tanlang → **Distribute App**.
2. **App Store Connect** → **Upload** → Next (default sozlamalar).
3. Upload tugagach, 5-15 daqiqada build App Store Connect'da "TestFlight" va "App Store" bo'limlarida paydo bo'ladi ("Processing" holatida).

---

## 5-QADAM — Metadata to'ldirish (App Store Connect)

`store-listing.md` faylidan nusxalang:
- Subtitle, Description, Keywords
- **Screenshots**: 6.9" (1320×2868) — `store-assets/screenshots/`
- **Privacy Policy URL**: 1-qadamdagi havola
- **Category**: Education
- **Age Rating**: so'rovnomani to'ldiring → 4+
- **Price**: Free
- **App Privacy**: "Data Not Collected" ( hech qanday ma'lumot yig'ilmaydi)

Build tanlash: "Build" bo'limida yuklangan build'ni biriktiring.

---

## 6-QADAM — Ko'rib chiqishga yuborish

1. Hammasi to'ldirilgach **Add for Review** → **Submit for Review**.
2. Apple ekspertizasi: odatda 1-3 kun.
3. Tasdiqlangach ilova App Store'da paydo bo'ladi (yoki qo'lda "Release" bosasiz).

---

## Keyingi versiyalar uchun

Kod o'zgargach:
1. `npm run build && npx cap sync`
2. Xcode'da `MARKETING_VERSION` (masalan 1.1) va build raqamini oshiring
3. Archive → Upload → yangi versiyani Submit
