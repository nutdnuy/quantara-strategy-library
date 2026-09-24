# Quantara Strategy Library

ต้นแบบเว็บคลังกลยุทธ์ พร้อมภาพไอเทมที่เชื่อมแนวคิดการลงทุนกับโลก Quantara ใช้ไฟล์ Markdown หนึ่งไฟล์ต่อหนึ่งการ์ด เพิ่มเนื้อหาผ่าน GitHub ได้โดยไม่ต้องแก้หน้าเว็บ ไม่มีแพ็กเกจ npm เพิ่มเติม และไม่ต้องมีฐานข้อมูล

Repository: [nutdnuy/quantara-strategy-library](https://github.com/nutdnuy/quantara-strategy-library) โดยใช้ GitHub Actions ตรวจข้อมูลและเผยแพร่เว็บจาก branch `main` ทุกครั้งที่ commit การแก้ไข

## เว็บที่เผยแพร่แล้ว

- Wix: https://www.quant-corner.com/strategies
- GitHub Pages: https://nutdnuy.github.io/quantara-strategy-library/

Wix ฝัง GitHub Pages โดยตรง เมื่อ commit ลง `main` และ Actions สำเร็จ เนื้อหาใหม่จะปรากฏทั้งสองแห่งหลังรีเฟรช ไม่ต้องเผยแพร่ Wix ใหม่สำหรับการเพิ่มหรือแก้การ์ด

## ดูเว็บในเครื่อง

ต้องมี Node.js 20 ขึ้นไป และ Python 3 สำหรับเซิร์ฟเวอร์ตัวอย่าง

```sh
npm test
npm run build
python3 -m http.server 4173 --bind 127.0.0.1 --directory dist
```

เปิด `http://localhost:4173` หลังแก้ Markdown ให้รัน `npm run build` อีกครั้งแล้วรีเฟรช ห้ามเปิด `index.html` ด้วย `file://` เพราะหน้าเว็บอ่านข้อมูล JSON ผ่าน HTTP

## เพิ่ม Strategy Card ผ่าน GitHub

1. เตรียมรูปไอเทมเป็นไฟล์ PNG และใช้ชื่อภาษาอังกฤษ เช่น `volatility-lantern.png`
2. ใน GitHub เปิด `assets/items` → **Add file → Upload files** แล้วอัปโหลดรูปและกด **Commit changes**
3. เปิด `templates/strategy.md` แล้วคัดลอกเนื้อหาทั้งหมด
4. ไปที่ `content/strategies` → **Add file → Create new file** ตั้งชื่อ เช่น `volatility-lantern.md` แล้ววางแม่แบบ
5. เปลี่ยน `slug` ให้ตรงกับชื่อไฟล์โดยไม่ใส่ `.md` แก้ชื่อ คำอธิบาย หมวดหมู่ เนื้อหา และแหล่งอ้างอิง
6. ตั้ง `image` เป็น `assets/items/volatility-lantern.png` และตั้ง `order` ตามลำดับที่ต้องการ ตัวเลขน้อยอยู่ก่อน
7. ตั้ง `published` เป็น `true` เมื่อต้องการแสดงการ์ด แล้วกด **Commit changes**
8. ตรวจแท็บ **Actions** หาก build และ deploy สำเร็จ การ์ดจะปรากฏบน GitHub Pages โดยอัตโนมัติ

ไม่มีข้อจำกัดว่าต้องมีเพียง 5 การ์ด ระบบอ่านไฟล์ `.md` ทุกไฟล์ใน `content/strategies/` โดยตรง ไม่ต้องแก้รายการในโค้ด การ์ดเรียงตาม `order` แล้วชื่อ `title` เมื่อเลขซ้ำกัน

## รูปแบบไฟล์

ส่วนต้นไฟล์ระหว่าง `---` เป็น **JSON object** ซึ่งเป็นรูปแบบย่อยที่เข้ากันได้กับ YAML ใช้เครื่องหมายคำพูดคู่และอย่าใส่ comma หลังรายการสุดท้าย ส่วนด้านล่างเป็น Markdown

| Field | ใช้ทำอะไร |
| --- | --- |
| `slug` | รหัสการ์ดที่ไม่ซ้ำ ใช้ภาษาอังกฤษตัวเล็ก ตัวเลข และขีดกลาง ต้องตรงกับชื่อไฟล์ |
| `title` | ชื่อกลยุทธ์ |
| `category` | หมวดหมู่ที่แสดงใต้ชื่อการ์ด |
| `summary` | คำอธิบายสั้นสำหรับหน้าการ์ด |
| `itemName` | ชื่อไอเทมเกม |
| `itemOrigin` | ที่มา/พื้นที่ในโลก Quantara |
| `itemLore` | เรื่องราวที่เชื่อมไอเทมกับแนวคิดของกลยุทธ์ |
| `image` | ตำแหน่งรูป PNG ภายใต้ `assets/items/` |
| `gameImage` | ภาพแฟนตาซีสำหรับแบบ B ไม่จำเป็นต้องใส่ หากไม่ใส่จะใช้ `image` |
| `order` | จำนวนเต็มตั้งแต่ 0 สำหรับเรียงการ์ด |
| `published` | `true` แสดงบนเว็บ หรือ `false` ซ่อนจากรายการ |
| `sources` | รายการแหล่งอ้างอิง แต่ละรายการมี `title` และ `url` แบบ HTTPS |
| `sourceNote` | หมายเหตุเกี่ยวกับแหล่งข้อมูล ไม่จำเป็นต้องใส่ |

ทุก field ยกเว้น `sourceNote` และ `gameImage` จำเป็นต้องมี เนื้อหา Markdown ต้องไม่ว่าง หน้าเว็บแสดงหัวข้อ รายการ และย่อหน้าที่รองรับผ่านข้อความใน DOM โดยไม่รัน HTML หรือ JavaScript ที่เขียนในเนื้อหา

เขียน `summary` เป็นบรีฟกลยุทธ์ตรง ๆ ประมาณ 1–2 ประโยคสั้น ส่วนบทความด้านล่างเขียนได้ยาว แนะนำให้มีแนวคิด ตัวอย่าง ประวัติ ผู้ใช้งานหรือผู้วิจัย กฎ และความเสี่ยง ใส่ `[1]`, `[2]` หลังข้อความเพื่อเชื่อมกับแหล่งอ้างอิงลำดับเดียวกันใน `sources` หน้าเว็บจะสร้างลิงก์ให้อัตโนมัติ

`published: false` เป็นฉบับร่างที่ซ่อนจาก JSON สาธารณะของหน้าเว็บ แต่ยังต้องผ่านการตรวจข้อมูลและมีรูปครบเหมือนการ์ดอื่น ไฟล์ต้นฉบับและภาพยังอยู่ใน GitHub ตามสิทธิ์การเข้าถึง repository และโฟลเดอร์ assets ถูกคัดลอกไปกับเว็บ จึงไม่ใช่พื้นที่เก็บข้อมูลลับ

## เปิดการเผยแพร่ครั้งแรก

1. สร้าง GitHub repository สำหรับเว็บนี้ แล้วใส่ **ไฟล์ภายในโฟลเดอร์นี้ไว้ที่ราก repository** รวม `.github/workflows/deploy.yml` โดยใช้ branch `main`
2. ใน repository เปิด **Settings → Pages → Build and deployment → Source → GitHub Actions**
3. เปิด **Actions → Build and deploy strategy library → Run workflow** หรือ commit การเปลี่ยนแปลงลง `main`
4. เมื่อ workflow สำเร็จ ดู URL ใน job `deploy` หรือหน้า **Settings → Pages**

Workflow ใช้ Node.js 20, รัน tests, ตรวจข้อมูลทั้งหมด, สร้างโฟลเดอร์ `dist/` และส่งเฉพาะเว็บที่สร้างแล้วไป GitHub Pages รูปและไฟล์เว็บใช้ relative paths เพื่อรองรับ URL ที่มีชื่อ repository ต่อท้าย หากใช้ repository เดิมที่มีโปรเจกต์อื่นอยู่ ต้องปรับ working directory และตำแหน่ง artifact ใน workflow ให้ตรงก่อน

การตั้งค่าอ้างอิง [GitHub Pages: Using custom workflows](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)

## เมื่อ build ไม่ผ่าน

ตรวจข้อความใน **Actions → build → Validate content and build site** ซึ่งระบุชื่อไฟล์และสาเหตุ เช่น ชื่อไฟล์ไม่ตรง slug, JSON ผิด, รูปไม่พบ หรือ URL ไม่ใช่ HTTPS แก้ไฟล์แล้ว commit ใหม่ การ build ที่ข้อมูลผิดจะหยุดก่อนขั้น deploy

## โครงสร้าง

```text
content/strategies/       # ไฟล์ต้นฉบับ หนึ่งไฟล์ต่อกลยุทธ์
assets/items/            # ภาพไอเทม PNG
templates/strategy.md    # แม่แบบสร้างการ์ด
scripts/build.mjs        # ตรวจข้อมูลและสร้างเว็บ
scripts/build.test.mjs   # ทดสอบการเพิ่มการ์ดและกรณีข้อมูลผิด
data/strategies.json     # สร้างอัตโนมัติ ไม่ต้องแก้
dist/                    # เว็บที่พร้อมนำไปโฮสต์ สร้างอัตโนมัติ
```

ข้อความและเรื่องราวไอเทมเป็นเนื้อหาเพื่อการศึกษา การเชื่อมไอเทมกับกลยุทธ์ไม่ได้เป็นผลทดสอบประสิทธิภาพหรือคำรับรองผลตอบแทน

เครดิตและใบอนุญาตภาพห้องสมุดอยู่ใน `assets/PHOTO-LICENSE.md` เครดิตบนหน้าเว็บอยู่ในปุ่ม i เล็ก ๆ บนภาพห้องสมุด ให้คงข้อมูลนี้ไว้เมื่อเผยแพร่

## เปรียบเทียบสองแบบ

- แบบ A: เปิด `/?style=classic` — การ์ดสีน้ำเดิม
- แบบ B: เปิด `/` หรือ `/?style=game` — แบบหลักที่เลือกใช้ การ์ดเกมกรอบทองหม่น ภาพแฟนตาซีลดความสด และแผ่นกระดาษสีงาช้าง

ทั้งสองแบบอ่าน Markdown ชุดเดียวกันและเปิดรายละเอียดเดียวกัน แบบ B ใช้ `gameImage` ถ้ามี ชื่อกลยุทธ์ หมวด และบรีฟยังเป็นข้อความจริงที่แก้ได้ ไม่ฝังอยู่ในรูป กดได้ทุกส่วนของการ์ด หรือใช้ Tab แล้ว Enter/Space เพื่อเปิดรายละเอียด ชื่อและเรื่องราวไอเทมอยู่ในหน้ารายละเอียด

นำหัวข้อรายการ ช่องค้นหา ตัวกรอง ตัวนับ และแถบส่วนท้ายออกจากทั้งสองแบบตามคอมเมนต์ ไม่มีฟังก์ชันค้นหาหรือกรองในเวอร์ชันปัจจุบัน

## การเชื่อม Wix

หน้า `strategies` ใช้ layout ไม่มี header/footer และ HTML component `comp-mufo5jbo` ชี้ไปยัง GitHub Pages แบบเกม ความกว้างยืดเต็มหน้าจอ ส่วน Custom Code ชื่อ **Strategy Library — responsive viewport** ใช้ไฟล์ `wix/responsive-viewport.html` เพื่อให้กรอบสูงเท่าหน้าจอทั้งเดสก์ท็อปและมือถือ CSS จำกัดด้วย page ID `ljtpi` และ component ID ดังกล่าว หากสร้างหน้า Wix ใหม่ต้องปรับ IDs ให้ตรง การแก้ไฟล์ CSS นี้ใน GitHub ไม่ส่งไป Wix อัตโนมัติ
